const { prisma } = require("../lib/clients");
const { createMilestone } = require("./milestones");
const { getStageConfig } = require("../lib/milestoneConfig");

 
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

 
const assignServiceCenterToTicket = async (ticketId, centerCode, assignedByUserId) => {
  try {
     // Verify the service center exists and is active
    const serviceCenter = await prisma.serviceCenter.findUnique({
      where: { centerCode },
      select: { id: true, name: true, isActive: true }
    });


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


    // Create milestones
    try {
      const isTechCreated = updatedTicket.createdByUser?.role === 'SERVICE_CENTER_TECHNICIAN';
      
      if (isTechCreated) {
        // For SERVICE_CENTER_TECHNICIAN, auto-progress milestones up to RECEIVED_AT_SERVICE_CENTER (since they already have the controller)
        // 1. Mark TICKET_RAISED as DONE
        const ticketRaisedMilestone = await prisma.ticketMilestone.findFirst({
          where: {
            ticketId: ticketId,
            stage: 'TICKET_RAISED'
          }
        });
        if (ticketRaisedMilestone) {
          await prisma.ticketMilestone.update({
            where: { id: ticketRaisedMilestone.id },
            data: {
              status: 'DONE',
              completedAt: new Date(),
              changedBy: assignedByUserId,
              notes: 'Ticket raised by technician - approved by Macsoft.'
            }
          });
        }

        // 2. Create SERVICE_CENTER_ASSIGNED as DONE
        const scAssignedConfig = getStageConfig('SERVICE_CENTER_ASSIGNED');
        await createMilestone({
          ticketId: ticketId,
          stage: 'SERVICE_CENTER_ASSIGNED',
          order: scAssignedConfig?.order || 1,
          status: 'DONE',
          startedAt: new Date(),
          completedAt: new Date(),
          changedBy: assignedByUserId,
          notes: `Approved and assigned to service center: ${serviceCenter.name} (${centerCode})`
        });

        // 3. Create RECEIVED_AT_SERVICE_CENTER as IN_PROGRESS
        const receivedConfig = getStageConfig('RECEIVED_AT_SERVICE_CENTER');
        await createMilestone({
          ticketId: ticketId,
          stage: 'RECEIVED_AT_SERVICE_CENTER',
          order: receivedConfig?.order || 5,
          status: 'IN_PROGRESS',
          startedAt: new Date(),
          eta: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days ETA
          slaDueAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days SLA
          photoRequired: true,
          changedBy: assignedByUserId,
          notes: "Controller received at service center by technician. Please upload 4 required photos: Controller Front, Controller Bottom, Full View Open, MCB Close Up."
        });

        // Update ticket status to IN_PROGRESS
        await prisma.ticket.update({
          where: { id: ticketId },
          data: { status: 'IN_PROGRESS' }
        });

      } else {
        // Standard flow for non-technician tickets
        const stageConfig = getStageConfig('SERVICE_CENTER_ASSIGNED');
              
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
            await prisma.ticketMilestone.update({
              where: { id: existingMilestone.id },
              data: {
                changedBy: assignedByUserId,
                notes: `Service center ${serviceCenter.name} (${centerCode}) has been assigned to this ticket - choose to issue solved or send to service center`,
                status: 'IN_PROGRESS'
              }
            });
          } else {
            await createMilestone({
              ticketId: ticketId,
              stage: 'SERVICE_CENTER_ASSIGNED',
              order: stageConfig.order,
              changedBy: assignedByUserId,
              notes: `Service center ${serviceCenter.name} (${centerCode}) has been assigned to this ticket - choose to issue solved or send to service center`,
              status: 'IN_PROGRESS'
            });
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
            }
          } catch (ticketRaisedError) {
            // Ignore
          }
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

     return updatedTicket;
  } catch (error) {
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