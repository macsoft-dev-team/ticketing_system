const { prisma } = require("../lib/clients");
const { createMilestone } = require("./milestones");
const { getStageConfig } = require("../lib/milestoneConfig");

/**
 * Gets available service centers for a given state (for manual assignment suggestions)
 * @param {string} state - The state where the ticket originated
 * @returns {Promise<Array>} - List of suitable service centers for the state
 */
const getSuggestedServiceCentersForState = async (state) => {
  try {
    const serviceCenters = await prisma.serviceCenter.findMany({
      where: {
        AND: [
          { isActive: true },
          {
            OR: [
              { serviceableStates: { contains: state } },
              { serviceableStates: null } // Include centers with no specific states (universal)
            ]
          }
        ]
      },
      select: {
        id: true,
        name: true,
        centerCode: true,
        serviceableStates: true,
        address: true,
        _count: {
          select: {
            assignedTickets: {
              where: {
                status: { in: ['OPEN', 'IN_PROGRESS'] }
              }
            }
          }
        }
      },
      orderBy: [
        { serviceableStates: 'asc' }, // Prioritize specific state assignments over universal ones
        { createdAt: 'asc' }
      ]
    });

    // Mark which ones specifically serve this state and calculate priority
    return serviceCenters.map(center => {
      const isStateSpecific = center.serviceableStates && center.serviceableStates.includes(state);
      const currentWorkload = center._count.assignedTickets;
      
      // Calculate priority based on state specificity and workload
      let priority = 'LOW';
      let priorityScore = 0;
      
      if (isStateSpecific && currentWorkload <= 5) {
        priority = 'HIGH';
        priorityScore = 3;
      } else if (isStateSpecific && currentWorkload > 5) {
        priority = 'MEDIUM';
        priorityScore = 2;
      } else if (!isStateSpecific && currentWorkload <= 5) {
        priority = 'MEDIUM';
        priorityScore = 2;
      } else {
        priority = 'LOW';
        priorityScore = 1;
      }
      
      return {
        ...center,
        isStateSpecific,
        currentWorkload,
        priority,
        priorityScore
      };
    }).sort((a, b) => {
      // Sort by priority score (highest first), then by workload (lowest first)
      if (a.priorityScore !== b.priorityScore) {
        return b.priorityScore - a.priorityScore;
      }
      return a.currentWorkload - b.currentWorkload;
    });
  } catch (error) {
    console.error('Error getting suggested service centers for state:', error);
    throw error;
  }
};

/**
 * Manually assigns a service center to a ticket (used by MACSOFT_SUPPORT)
 * @param {number} ticketId - The ID of the ticket
 * @param {string} centerCode - The service center code to assign
 * @param {number} assignedByUserId - The ID of the user making the assignment
 * @returns {Promise<Object>} - Updated ticket with assigned service center
 */
const assignServiceCenterToTicket = async (ticketId, centerCode, assignedByUserId) => {
  try {
    console.log(`🔄 Starting service center assignment: ticketId=${ticketId}, centerCode=${centerCode}, userId=${assignedByUserId}`);
    
    // Verify the service center exists and is active
    const serviceCenter = await prisma.serviceCenter.findUnique({
      where: { centerCode },
      select: { id: true, name: true, isActive: true }
    });

    console.log(`📋 Service center lookup result:`, serviceCenter);

    if (!serviceCenter) {
      throw new Error(`Service center with code ${centerCode} not found`);
    }

    if (!serviceCenter.isActive) {
      throw new Error(`Service center ${centerCode} is not active`);
    }

    // Verify ticket exists
    const ticketExists = await prisma.ticket.findUnique({
      where: { id: ticketId },
      select: { id: true, ticketCode: true }
    });
    
    if (!ticketExists) {
      throw new Error(`Ticket with ID ${ticketId} not found`);
    }
    
    console.log(`📝 Updating ticket ${ticketId} (${ticketExists.ticketCode}) with service center assignment...`);

    // Update ticket with service center assignment
    const updatedTicket = await prisma.ticket.update({
      where: { id: ticketId },
      data: { 
        assignedServiceCenter: centerCode,
        updatedBy: assignedByUserId
      },
      include: {
        serviceCenter: true,
        createdByUser: true,
        updatedByUser: true,
      }
    });

    console.log(`✅ Ticket updated successfully, creating milestone...`);

    // Create SERVICE_CENTER_ASSIGNED milestone
    try {
      const stageConfig = getStageConfig('SERVICE_CENTER_ASSIGNED');
      
      console.log(`📋 Stage config for SERVICE_CENTER_ASSIGNED:`, stageConfig);
      
      if (!stageConfig) {
        console.warn(`⚠️ No stage config found for SERVICE_CENTER_ASSIGNED, skipping milestone creation`);
      } else {
        // Check if milestone already exists for this stage
        const existingMilestone = await prisma.ticketMilestone.findFirst({
          where: {
            ticketId: ticketId,
            stage: 'SERVICE_CENTER_ASSIGNED'
          }
        });
        
        if (existingMilestone) {
          console.log(`📋 SERVICE_CENTER_ASSIGNED milestone already exists, updating instead of creating new one`);
          
          const updatedMilestone = await prisma.ticketMilestone.update({
            where: { id: existingMilestone.id },
            data: {
              changedBy: assignedByUserId,
              notes: `Service center ${serviceCenter.name} (${centerCode}) has been assigned to this ticket - choose to clear at field or send to service center`,
              status: 'IN_PROGRESS'
            }
          });
          
          console.log(`📋 SERVICE_CENTER_ASSIGNED milestone updated successfully:`, updatedMilestone);
        } else {
          console.log(`📋 About to create milestone with data:`, {
            ticketId: ticketId,
            stage: 'SERVICE_CENTER_ASSIGNED',
            order: stageConfig.order,
            changedBy: assignedByUserId,
            notes: `Service center ${serviceCenter.name} (${centerCode}) has been assigned to this ticket`,
            completedAt: new Date(),
          });
          
          const milestone = await createMilestone({
            ticketId: ticketId,
            stage: 'SERVICE_CENTER_ASSIGNED',
            order: stageConfig.order,
            changedBy: assignedByUserId,
            notes: `Service center ${serviceCenter.name} (${centerCode}) has been assigned to this ticket - choose to clear at field or send to service center`,
            status: 'IN_PROGRESS'
          });
          
          console.log(`📋 SERVICE_CENTER_ASSIGNED milestone created successfully:`, milestone);
        }
        
        // Also mark TICKET_RAISED milestone as DONE if it exists and is still IN_PROGRESS
        try {
          const ticketRaisedMilestone = await prisma.ticketMilestone.findFirst({
            where: {
              ticketId: ticketId,
              stage: 'TICKET_RAISED',
              status: 'IN_PROGRESS'
            }
          });
          
          if (ticketRaisedMilestone) {
            await prisma.ticketMilestone.update({
              where: { id: ticketRaisedMilestone.id },
              data: {
                status: 'DONE',
                completedAt: new Date(),
                changedBy: assignedByUserId,
                notes: ticketRaisedMilestone.notes || 'Ticket raised - service center assigned'
              }
            });
            
            console.log(`📋 TICKET_RAISED milestone marked as DONE`);
          }
        } catch (ticketRaisedError) {
          console.error(`⚠️ Error updating TICKET_RAISED milestone:`, ticketRaisedError);
          // Don't throw - this is not critical
        }
        
      }
    } catch (milestoneError) {
      console.error(`❌ Error creating milestone (but continuing):`, milestoneError);
      console.error(`❌ Milestone error details:`, {
        message: milestoneError.message,
        code: milestoneError.code,
        meta: milestoneError.meta
      });
      // Don't throw - allow the assignment to succeed even if milestone fails
    }

    console.log(`✅ Service center ${centerCode} assigned to ticket ${ticketId} by user ${assignedByUserId}`);
    
    return updatedTicket;
  } catch (error) {
    console.error('❌ Error assigning service center to ticket:', error);
    console.error('❌ Error details:', {
      message: error.message,
      code: error.code,
      meta: error.meta,
      stack: error.stack?.split('\n').slice(0, 5).join('\n')
    });
    throw error;
  }
};

/**
 * Gets all service centers with their serviceable states
 * @param {Object} filters - Search and filter parameters
 * @param {string} filters.search - Search term for name, centerCode, or address
 * @param {string} filters.state - Filter by serviceable states (state name)
 * @param {string} filters.stateId - Filter by state ID (will be converted to state name)
 * @returns {Promise<Array>} - List of service centers with state assignments
 */
const getServiceCentersWithStates = async (filters = {}) => {
  try {
    const { search, state, stateId } = filters;
    
    // Build where clause
    const whereConditions = [{ isActive: true }];
    
    // Add search filter if provided
    if (search) {
      whereConditions.push({
        OR: [
          { name: { contains: search } },
          { centerCode: { contains: search } },
          { address: { contains: search } }
        ]
      });
    }
    
    // Add state filter if provided (either by name or by ID)
    let stateToFilter = state;
    
    // If stateId is provided, look up the state name
    if (stateId && !state) {
      const stateRecord = await prisma.state.findUnique({
        where: { id: parseInt(stateId) },
        select: { name: true }
      });
      stateToFilter = stateRecord?.name;
    }
    
    if (stateToFilter) {
      whereConditions.push({
        serviceableStates: { contains: stateToFilter }
      });
    }
    
    const whereClause = whereConditions.length > 1 
      ? { AND: whereConditions }
      : whereConditions[0];

    const serviceCenters = await prisma.serviceCenter.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        centerCode: true,
        serviceableStates: true,
        address: true,
        _count: {
          select: {
            assignedTickets: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    // Add priority calculation to each service center
    return serviceCenters.map(center => {
      const currentWorkload = center._count.assignedTickets;
      const hasSpecificStates = center.serviceableStates && center.serviceableStates.trim() !== '';
      
      // Determine if this center serves the filtered state (if any)
      const isStateSpecific = stateToFilter ? 
        (center.serviceableStates && center.serviceableStates.includes(stateToFilter)) : 
        hasSpecificStates;
      
      // Calculate priority based on state specificity and workload
      let priority = 'LOW';
      let priorityScore = 0;
      
      if (isStateSpecific && currentWorkload <= 5) {
        priority = 'HIGH';
        priorityScore = 3;
      } else if (isStateSpecific && currentWorkload > 5) {
        priority = 'MEDIUM';
        priorityScore = 2;
      } else if (!hasSpecificStates && currentWorkload <= 5) {
        priority = 'MEDIUM';
        priorityScore = 2;
      } else {
        priority = 'LOW';
        priorityScore = 1;
      }
      
      return {
        ...center,
        currentWorkload,
        priority,
        priorityScore,
        isStateSpecific: isStateSpecific || false,
        isUniversal: !hasSpecificStates
      };
    }).sort((a, b) => {
      // Sort by priority score (highest first), then by workload (lowest first)
      if (a.priorityScore !== b.priorityScore) {
        return b.priorityScore - a.priorityScore;
      }
      return a.currentWorkload - b.currentWorkload;
    });
  } catch (error) {
    console.error('Error fetching service centers with states:', error);
    throw error;
  }
};

/**
 * Updates the serviceable states for a service center
 * @param {string} centerCode - The center code
 * @param {Array<string>} states - Array of state names
 * @returns {Promise<Object>} - Updated service center
 */
const updateServiceCenterStates = async (centerCode, states) => {
  try {
    const statesString = states && states.length > 0 ? states.join(',') : null;
    
    return await prisma.serviceCenter.update({
      where: { centerCode },
      data: { serviceableStates: statesString },
      include: {
        _count: {
          select: {
            assignedTickets: true
          }
        }
      }
    });
  } catch (error) {
    console.error('Error updating service center states:', error);
    throw error;
  }
};

/**
 * Gets ticket distribution by service center
 * @returns {Promise<Array>} - Service center ticket statistics
 */
const getServiceCenterTicketStats = async () => {
  try {
    return await prisma.serviceCenter.findMany({
      where: { isActive: true },
      select: {
        name: true,
        centerCode: true,
        serviceableStates: true,
        _count: {
          select: {
            assignedTickets: {
              where: {
                status: { in: ['OPEN', 'IN_PROGRESS'] }
              }
            }
          }
        },
        assignedTickets: {
          select: {
            state: true,
            status: true,
            createdAt: true
          },
          take: 5,
          orderBy: { createdAt: 'desc' }
        }
      },
      orderBy: { name: 'asc' }
    });
  } catch (error) {
    console.error('Error fetching service center ticket stats:', error);
    throw error;
  }
};

/**
 * Gets tickets that are unassigned (no service center assigned yet)
 * @returns {Promise<Array>} - List of unassigned tickets
 */
const getUnassignedTickets = async () => {
  try {
    return await prisma.ticket.findMany({
      where: {
        assignedServiceCenter: null,
        status: { in: ['OPEN', 'IN_PROGRESS'] }
      },
      include: {
        createdByUser: {
          select: { id: true, name: true, role: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  } catch (error) {
    console.error('Error fetching unassigned tickets:', error);
    throw error;
  }
};

/**
 * Removes service center assignment from a ticket
 * @param {number} ticketId - The ID of the ticket
 * @param {number} removedByUserId - The ID of the user removing the assignment
 * @returns {Promise<Object>} - Updated ticket without service center assignment
 */
const removeServiceCenterAssignment = async (ticketId, removedByUserId) => {
  try {
    const updatedTicket = await prisma.ticket.update({
      where: { id: ticketId },
      data: { 
        assignedServiceCenter: null,
        updatedBy: removedByUserId
      },
      include: {
        createdByUser: true,
        updatedByUser: true,
      }
    });

    console.log(`🔄 Service center assignment removed from ticket ${ticketId} by user ${removedByUserId}`);
    return updatedTicket;
  } catch (error) {
    console.error('Error removing service center assignment:', error);
    throw error;
  }
};

module.exports = {
  getSuggestedServiceCentersForState,
  assignServiceCenterToTicket,
  getServiceCentersWithStates,
  updateServiceCenterStates,
  getServiceCenterTicketStats,
  getUnassignedTickets,
  removeServiceCenterAssignment,
};