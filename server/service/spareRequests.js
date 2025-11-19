const { PrismaClient } = require("../prisma/generated/prisma/client");
const prisma = new PrismaClient();
const milestoneService = require("./milestones");
const inventoryService = require("./inventory");

async function createSpareRequest(data) {
  try {
    const {
      ticketCode,
      createdBy,
      userRole,
      spareItems,
      requestReason,
      urgencyLevel,
      expectedDelivery,
      additionalNotes,
      io,
    } = data;

    // Validate ticket exists
    const ticket = await prisma.ticket.findUnique({
      where: { ticketCode },
      include: {
        ticketMilestones: true,
      },
    });

    if (!ticket) {
      throw new Error(`Ticket ${ticketCode} not found`);
    }

    // Validate all products exist
    const productIds = spareItems.map((item) => item.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
    });

    if (products.length !== productIds.length) {
      throw new Error("One or more products not found");
    }

    // Check inventory availability for each item
    console.log(`📦 Checking inventory availability for ${spareItems.length} items...`);
    const stockCheck = await inventoryService.checkStockAvailability(spareItems);
    
    if (!stockCheck.allAvailable) {
      const insufficientItems = stockCheck.insufficientItems.map(item => 
        `${item.product?.name || `Product ${item.productId}`}: Required ${item.requestedQuantity}, Available ${item.availableQuantity}`
      );
      
      console.warn(`⚠️ Insufficient inventory for spare request:`, insufficientItems);
      
      // Create the spare request even with insufficient stock, but add a note
      // This allows for back-ordering and tracking of requirements
    }

    // Create spare request with items in a transaction
    const spareRequest = await prisma.spareRequest.create({
      data: {
        ticketCode,
        status: urgencyLevel === "CRITICAL" ? "URGENT" : "PENDING",
        createdBy,
        spareItems: {
          create: spareItems.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            status: "REQUESTED",
          })),
        },
      },
      include: {
        spareItems: {
          include: {
            product: true,
          },
        },
        createdByUser: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
    });

    console.log(
      `✅ Spare request created for ticket ${ticketCode}:`,
      spareRequest.id
    );

    // Update milestone - Mark current milestone as completed and create SPARE_REQUESTED
    try {
      if (spareRequest) {
        // Find the current active milestone (should be REPLACEMENT_IN_PROGRESS)
        const currentMilestone = ticket.ticketMilestones.find(
          (m) => m.status === "IN_PROGRESS"
        );
        
        if (currentMilestone && currentMilestone.stage === "REPLACEMENT_IN_PROGRESS") {
          console.log(`📋 Found current milestone: ${currentMilestone.stage}, transitioning to SPARE_REQUESTED`);
          
          // Complete the current milestone (REPLACEMENT_IN_PROGRESS)
          await prisma.ticketMilestone.update({
            where: { id: currentMilestone.id },
            data: {
              status: "DONE",
              completedAt: new Date(),
              changedBy: createdBy,
              notes: `${currentMilestone.notes || ''} - Spare request initiated for replacement`,
            },
          });

          // Create new milestone entry for SPARE_REQUESTED
          await prisma.ticketMilestone.create({
            data: {
              ticketId: ticket.id,
              stage: "SPARE_REQUESTED",
              status: "IN_PROGRESS",
              order: 8, // Updated order from milestoneConfig
              changedBy: createdBy,
              notes: `Spare request submitted for replacement: ${spareItems.length} item(s) requested`,
              startedAt: new Date(),
            },
          });
          
          console.log(`✅ Milestone transition completed: ${currentMilestone.stage} → SPARE_REQUESTED`);
        } else if (currentMilestone) {
          console.warn(`⚠️ Spare requests can only be made from REPLACEMENT_IN_PROGRESS stage, current stage: ${currentMilestone.stage}`);
          throw new Error(`Spare requests can only be made during replacement process. Current stage: ${currentMilestone.stage}`);
        } else {
          console.warn('⚠️ No active milestone found for spare request transition');
          throw new Error('No active milestone found. Cannot create spare request.');
        }
      }    
    } catch (milestoneError) {
      console.error(
        "❌ Error updating milestone after spare request:",
        milestoneError
      );
      // Re-throw the error since milestone transition is critical for workflow
      throw milestoneError;
    }

    return spareRequest;
  } catch (error) {
    console.error("❌ Error creating spare request:", error);
    throw error;
  }
}

async function getSpareRequestsByTicket(ticketCode) {
  try {
    const spareRequests = await prisma.spareRequest.findMany({
      where: { ticketCode },
      include: {
        spareItems: {
          include: {
            product: true,
          },
        },
        createdByUser: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
        updatedByUser: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return spareRequests;
  } catch (error) {
    console.error("❌ Error fetching spare requests:", error);
    throw error;
  }
}

async function updateSpareRequestStatus(id, data) {
  try {
    const { status, updatedBy } = data;

    const spareRequest = await prisma.spareRequest.update({
      where: { id },
      data: {
        status,
        updatedBy,
      },
      include: {
        spareItems: {
          include: {
            product: true,
          },
        },
      },
    });

    console.log(`✅ Spare request ${id} status updated to ${status}`);
    return spareRequest;
  } catch (error) {
    console.error("❌ Error updating spare request:", error);
    throw error;
  }
}

async function updateSpareRequestItemStatus(itemId, status, updatedBy = null) {
  try {
    // Get the current item to check if it exists and get the spare request info
    const currentItem = await prisma.spareRequestItem.findUnique({
      where: { id: itemId },
      include: {
        product: true,
        spareRequest: {
          include: {
            spareItems: true,
          }
        }
      },
    });

    if (!currentItem) {
      throw new Error(`Spare request item with ID ${itemId} not found`);
    }

    // Update the item status
    const item = await prisma.spareRequestItem.update({
      where: { id: itemId },
      data: { 
        status,
        updatedAt: new Date(),
      },
      include: {
        product: true,
        spareRequest: true,
      },
    });

    // If item is approved, deduct from inventory
    if (status === 'approved') {
      try {
        console.log(`📦 Deducting inventory for approved item: ${item.product.name} (${item.quantity} units)`);
        
        await inventoryService.deductInventory(
          [{ productId: item.productId, quantity: item.quantity }],
          item.spareRequest.ticketCode,
          updatedBy
        );

        console.log(`✅ Inventory deducted successfully for ${item.product.name}`);
      } catch (inventoryError) {
        console.error(`❌ Failed to deduct inventory for item ${itemId}:`, inventoryError);
        
        // Revert the item status if inventory deduction fails
        await prisma.spareRequestItem.update({
          where: { id: itemId },
          data: { 
            status: 'pending', // Revert to pending
            updatedAt: new Date()
          }
        });
        
        throw new Error(`Cannot approve item: ${inventoryError.message}`);
      }
    }

    // Check if all items in this spare request are approved and trigger milestone transition
    if (status === 'approved') {
      const allItems = await prisma.spareRequestItem.findMany({
        where: { spareRequestId: currentItem.spareRequestId },
      });
      
      const allApproved = allItems.every(spareItem => 
        spareItem.id === itemId ? true : spareItem.status === 'approved'
      );

      if (allApproved) {
        // Update the main spare request status
        await prisma.spareRequest.update({
          where: { id: currentItem.spareRequestId },
          data: {
            status: 'APPROVED',
            updatedBy: updatedBy,
          },
        });

        // Transition milestone from SPARE_REQUESTED to SPARE_APPROVED
        try {
          const ticket = await prisma.ticket.findUnique({
            where: { ticketCode: currentItem.spareRequest.ticketCode },
            include: {
              ticketMilestones: {
                where: { status: 'IN_PROGRESS' },
                orderBy: { order: 'desc' },
              },
            },
          });

          if (ticket && ticket.ticketMilestones.length > 0) {
            const currentMilestone = ticket.ticketMilestones[0];
            
            if (currentMilestone.stage === 'SPARE_REQUESTED') {
              // Complete current milestone
              await prisma.ticketMilestone.update({
                where: { id: currentMilestone.id },
                data: {
                  status: 'DONE',
                  completedAt: new Date(),
                  changedBy: updatedBy,
                  notes: `${currentMilestone.notes || ''} - All spare items approved`,
                },
              });

              // Create SPARE_APPROVED milestone
              await prisma.ticketMilestone.create({
                data: {
                  ticketId: ticket.id,
                  stage: 'SPARE_APPROVED',
                  status: 'IN_PROGRESS',
                  order: 9,
                  changedBy: updatedBy,
                  notes: `Spare request fully approved - ${allItems.length} item(s) approved`,
                  startedAt: new Date(),
                },
              });
              
              console.log(`✅ Milestone transitioned: SPARE_REQUESTED → SPARE_APPROVED for ticket ${ticket.ticketCode}`);
            }
          }
        } catch (milestoneError) {
          console.error('❌ Error transitioning milestone after spare approval:', milestoneError);
          // Don't throw here as the item status update was successful
        }
      }
    }

    console.log(`✅ Spare request item ${itemId} status updated to ${status} by user ${updatedBy}`);
    return item;
  } catch (error) {
    console.error("❌ Error updating spare request item:", error);
    throw error;
  }
}

async function getAllSpareRequests(skip, take, filters) {
  try {
    const params = {};
    if (skip) params.skip = (parseInt(skip) - 1) * parseInt(take || 10);
    if (take) params.take = parseInt(take);

    // Build where clause for filtering
    params.where = {};

    // Parse filter if it exists
    if (filters) {
      try {
        const filterObj = typeof filters === 'string' ? JSON.parse(filters) : filters;

        // Status filter
        if (filterObj.status && filterObj.status !== '') {
          params.where.status = filterObj.status;
        }

        // Search filter (ticketCode, createdBy name, updatedBy name)
        if (filterObj.search && filterObj.search.trim() !== '') {
          const searchTerm = filterObj.search.trim();
          params.where.OR = [
            { ticketCode: { contains: searchTerm } },
            {
              createdByUser: {
                name: { contains: searchTerm }
              }
            },
            {
              updatedByUser: {
                name: { contains: searchTerm }
              }
            }
          ];
        }

        // Date range filter
        if (filterObj.dateFrom || filterObj.dateTo) {
          params.where.createdAt = {};
          if (filterObj.dateFrom) {
            params.where.createdAt.gte = new Date(filterObj.dateFrom);
          }
          if (filterObj.dateTo) {
            params.where.createdAt.lte = new Date(filterObj.dateTo);
          }
        }
      } catch (parseError) {
        console.warn('Filter parsing error:', parseError);
      }
    }

    const spareRequests = await prisma.spareRequest.findMany({
      skip: params.skip,
      take: params.take,
      where: params.where,
      include: {
        spareItems: {
          include: {
            product: true,
          },
        },
        createdByUser: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
        updatedByUser: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    
    const count = await prisma.spareRequest.count({ where: params.where });
    return { spareRequests, count };
  } catch (error) {
    console.error("❌ Error fetching all spare requests:", error);
    throw error;
  }
}

/**
 * Bulk approve all pending spare requests for a ticket
 * Used when milestone transitions to SPARE_APPROVED
 */
async function bulkApproveSpareRequestsByTicket(ticketCode, approvedBy = null) {
  try {
    console.log(`🔄 Starting bulk approval of spare requests for ticket ${ticketCode}`);

    // Get all pending spare requests for this ticket
    const pendingSpareRequests = await prisma.spareRequest.findMany({
      where: {
        ticketCode,
        status: { in: ['PENDING', 'URGENT'] }
      },
      include: {
        spareItems: {
          where: {
            status: { in: ['REQUESTED', 'pending'] }
          }
        }
      }
    });

    if (pendingSpareRequests.length === 0) {
      console.log(`ℹ️ No pending spare requests found for ticket ${ticketCode}`);
      return { approvedRequests: 0, approvedItems: 0 };
    }

    let totalApprovedRequests = 0;
    let totalApprovedItems = 0;

    // Update all pending spare request items to approved and deduct inventory
    for (const spareRequest of pendingSpareRequests) {
      if (spareRequest.spareItems.length > 0) {
        try {
          // First, check inventory availability for all items in this request
          const inventoryItems = spareRequest.spareItems.map(item => ({
            productId: item.productId,
            quantity: item.quantity
          }));

          console.log(`📦 Checking inventory for bulk approval of request ${spareRequest.id}...`);
          
          // Deduct inventory for all items
          await inventoryService.deductInventory(inventoryItems, ticketCode, approvedBy);

          // If inventory deduction succeeds, update the item statuses
          const updatedItems = await prisma.spareRequestItem.updateMany({
            where: {
              spareRequestId: spareRequest.id,
              status: { in: ['REQUESTED', 'pending'] }
            },
            data: {
              status: 'approved',
              updatedAt: new Date()
            }
          });

          // Update the main spare request status to APPROVED
          await prisma.spareRequest.update({
            where: { id: spareRequest.id },
            data: {
              status: 'APPROVED',
              updatedBy: approvedBy,
              updatedAt: new Date()
            }
          });

          totalApprovedRequests++;
          totalApprovedItems += updatedItems.count;

          console.log(`✅ Auto-approved spare request ${spareRequest.id} with ${updatedItems.count} items and deducted inventory`);
        } catch (inventoryError) {
          console.error(`❌ Failed to process spare request ${spareRequest.id} due to inventory issue:`, inventoryError);
          
          // Skip this spare request if inventory deduction fails
          // Optionally, you could mark it as 'PENDING_INVENTORY' status
          await prisma.spareRequest.update({
            where: { id: spareRequest.id },
            data: {
              status: 'PENDING_INVENTORY',
              updatedBy: approvedBy,
              updatedAt: new Date()
            }
          });
          
          console.log(`⚠️ Spare request ${spareRequest.id} marked as PENDING_INVENTORY due to insufficient stock`);
        }
      }
    }

    console.log(`✅ Bulk approval completed for ticket ${ticketCode}: ${totalApprovedRequests} requests, ${totalApprovedItems} items`);
    
    return {
      approvedRequests: totalApprovedRequests,
      approvedItems: totalApprovedItems,
      ticketCode
    };
  } catch (error) {
    console.error(`❌ Error bulk approving spare requests for ticket ${ticketCode}:`, error);
    throw error;
  }
}

module.exports = {
  createSpareRequest,
  getSpareRequestsByTicket,
  updateSpareRequestStatus,
  updateSpareRequestItemStatus,
  getAllSpareRequests,
  bulkApproveSpareRequestsByTicket,
};
