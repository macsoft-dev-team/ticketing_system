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
      additionalNotes,
      io,
    } = data;

    // Get user details to determine their role and service center
    const user = await prisma.user.findUnique({
      where: { id: createdBy },
      select: { centerCode: true, role: true, name: true }
    });

    if (!user) {
      throw new Error("User not found");
    }

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

    // Determine which service center to check inventory for
    let checkCenterCode;
    const macsoftRoles = ['MACSOFT_ADMIN', 'MACSOFT_HEAD', 'MACSOFT_SUPPORT'];
    
    if (macsoftRoles.includes(user.role)) {
      // For MACSOFT roles, check the service center assigned to the ticket
      if (!ticket.assignedServiceCenter) {
        throw new Error("Ticket is not assigned to any service center");
      }
      checkCenterCode = ticket.assignedServiceCenter;
    } else {
      // For service center roles, use their own center code
      if (!user.centerCode) {
        throw new Error("User not assigned to a service center");
      }
      checkCenterCode = user.centerCode;
    }

    // Validate all products exist
    const productIds = spareItems.map((item) => item.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
    });

    if (products.length !== productIds.length) {
      throw new Error("One or more products not found");
    }

    // Check inventory at the appropriate service center
    const itemsWithCenterCode = spareItems.map(item => ({
      ...item,
      centerCode: checkCenterCode
    }));
    
    const stockCheck = await inventoryService.checkStockAvailability(itemsWithCenterCode);
    
    if (stockCheck.allAvailable) {
      // Service center already has the required items in stock
      console.log(`ℹ️ All items available at center ${checkCenterCode}. Spare request still created for approval workflow.`);
    } else {
      const insufficientItems = stockCheck.insufficientItems.map(item => 
        `${item.product?.name || `Product ${item.productId}`}: Required ${item.requestedQuantity}, Available at ${checkCenterCode}: ${item.availableQuantity}`
      );
      
      console.warn(`⚠️ Service center ${checkCenterCode} has insufficient inventory:`, insufficientItems);
      
      // Create the spare request as items are not available locally
      // This will trigger the approval workflow to get items from MHSEC
    }

    // Create spare request with items in a transaction
    const spareRequest = await prisma.spareRequest.create({
      data: {
        ticketCode,
        status: "PENDING",
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
            product: {
              include: {
                inventories: true,
              },
            },
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

     // Update milestone - Mark current milestone as completed and create SPARE_REQUESTED
    try {
      if (spareRequest) {
        // Find the current active milestone (should be REPLACEMENT_IN_PROGRESS)
        const currentMilestone = ticket.ticketMilestones.find(
          (m) => m.status === "IN_PROGRESS"
        );
        
        if (currentMilestone && currentMilestone.stage === "REPLACEMENT_IN_PROGRESS") {
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
            product: {
              include: {
                inventories: true,
              },
            },
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
            product: {
              include: {
                inventories: true,
              },
            },
          },
        },
      },
    });

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
        product: {
          include: {
            inventories: true,
          },
        },
        spareRequest: {
          include: {
            spareItems: {
              include: {
                product: {
                  include: {
                    inventories: true,
                  },
                },
              },
            },
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
        product: {
          include: {
            inventories: true,
          },
        },
        spareRequest: true,
      },
    });

    // If item is approved, deduct from inventory
    if (status === 'approved') {
      try {
         await inventoryService.deductInventory(
          [{ productId: item.productId, quantity: item.quantity }],
          item.spareRequest.ticketCode,
          updatedBy
        );

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
              
             }
          }
        } catch (milestoneError) {
          console.error('❌ Error transitioning milestone after spare approval:', milestoneError);
          // Don't throw here as the item status update was successful
        }
      }
    }

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
            product: {
              include: {
                inventories: true,
              },
            },
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

         } catch (inventoryError) {          
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
         }
      }
    }

     
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

/**
 * Approve individual spare request item
 */
async function approveSpareRequestItem(itemId, approvedBy, approverName, approverRole) {
  try {
    // Start transaction for approval process
    const result = await prisma.$transaction(async (tx) => {
      // Get the spare request item with product info
      const spareItem = await tx.spareRequestItem.findUnique({
        where: { id: itemId },
        include: {
          product: true,
          spareRequest: {
            include: {
              createdByUser: {
                select: { id: true, name: true, role: true, centerCode: true }
              }
            }
          }
        }
      });

      if (!spareItem) {
        throw new Error('Spare request item not found');
      }

      if (spareItem.status === 'approved') {
        throw new Error('Spare request item is already approved');
      }

      // Get ticket to find destination center
      const ticket = await tx.ticket.findUnique({
        where: { ticketCode: spareItem.spareRequest.ticketCode },
        select: { assignedServiceCenter: true }
      });

      // Determine centers
      const toCenterCode = ticket?.assignedServiceCenter || spareItem.spareRequest.createdByUser?.centerCode;

      if (!toCenterCode) {
        throw new Error('Unable to determine destination service center');
      }

      // Check inventory availability - GOOD condition by default
      const condition = 'GOOD';
      const conditionField = 'goodQty';

      // First, check if spare is available at the requesting service center
      const centerInventory = await tx.inventory.findUnique({
        where: {
          centerCode_productId: {
            centerCode: toCenterCode,
            productId: spareItem.productId
          }
        }
      });

      const centerAvailableQty = centerInventory?.[conditionField] || 0;
      
      let fromCenterCode;
      let inventory;
      let availableQty;
      let isLocalApproval = false;

      // If available at requesting center, approve from there
      if (centerAvailableQty >= spareItem.quantity) {
        fromCenterCode = toCenterCode;
        inventory = centerInventory;
        availableQty = centerAvailableQty;
        isLocalApproval = true;
        console.log(`✅ Spare available at requesting center ${toCenterCode}. Approving from local inventory.`);
      } else {
        // Otherwise, check MHSEC (MACSOFT HEAD SERVICE CENTER)
        fromCenterCode = 'MHSEC';
        inventory = await tx.inventory.findUnique({
          where: {
            centerCode_productId: {
              centerCode: fromCenterCode,
              productId: spareItem.productId
            }
          }
        });
        availableQty = inventory?.[conditionField] || 0;
        console.log(`⚠️ Spare not available at ${toCenterCode}. Checking MHSEC inventory.`);
      }

      if (availableQty < spareItem.quantity) {
        throw new Error(`Insufficient ${condition} inventory. Available at ${fromCenterCode}: ${availableQty}, Required: ${spareItem.quantity}`);
      }

      // Deduct inventory from source center
      await tx.inventory.update({
        where: { id: inventory.id },
        data: {
          [conditionField]: {
            decrement: spareItem.quantity
          }
        }
      });

      // Create ProductTransaction for DELIVERY or TICKET_ISSUE with items
      // If local approval (same center), mark as TICKET_ISSUE instead of DELIVERY
      const transactionType = isLocalApproval ? 'TICKET_ISSUE' : 'DELIVERY';
      const transactionRemarks = isLocalApproval 
        ? `Spare request approved from local inventory by ${approverName} (${approverRole}) - Item already available at ${fromCenterCode} - Ticket: ${spareItem.spareRequest.ticketCode} - Product: ${spareItem.product.productCode} - Spare Request Item ID: ${itemId}`
        : `Spare request approved by ${approverName} (${approverRole}) - Delivery from ${fromCenterCode} to ${toCenterCode} - Ticket: ${spareItem.spareRequest.ticketCode} - Product: ${spareItem.product.productCode} - Spare Request Item ID: ${itemId}`;

      const transaction = await tx.productTransaction.create({
        data: {
          transactionType: transactionType,
          status: 'COMPLETED',
          centerCode: fromCenterCode,
          fromCenterCode: fromCenterCode,
          toCenterCode: isLocalApproval ? fromCenterCode : toCenterCode,
          remarks: transactionRemarks,
          createdBy: approvedBy,
          deliveryDate: new Date(),
          items: {
            create: {
              productId: spareItem.productId,
              condition: condition,
              quantity: spareItem.quantity
            }
          }
        },
        include: {
          items: true
        }
      });

      // Update spare request item status
      const updatedItem = await tx.spareRequestItem.update({
        where: { id: itemId },
        data: {
          status: 'approved',
          updatedAt: new Date()
        },
        include: {
          product: {
            include: {
              inventories: true,
            },
          },
          spareRequest: {
            include: {
              createdByUser: {
                select: { id: true, name: true, role: true }
              }
            }
          }
        }
      });

      // Update parent spare request status if needed
      const allItems = await tx.spareRequestItem.findMany({
        where: { spareRequestId: spareItem.spareRequestId }
      });

      const approvedItems = allItems.filter(item => item.status === 'approved');
      const rejectedItems = allItems.filter(item => item.status === 'rejected');
      const processedItems = approvedItems.length + rejectedItems.length;
      let milestoneTransitionResult = null;
      
      // Check if all items have been processed (approved or rejected)
      if (processedItems === allItems.length) {
        // Determine final status based on what was processed
        let finalStatus;
        if (approvedItems.length === allItems.length) {
          finalStatus = 'APPROVED';
        } else if (rejectedItems.length === allItems.length) {
          finalStatus = 'REJECTED';
        } else {
          finalStatus = 'PARTIALLY_APPROVED'; // Mixed scenario
        }
        
        await tx.spareRequest.update({
          where: { id: spareItem.spareRequestId },
          data: {
            status: finalStatus,
            updatedBy: approvedBy
          }
        });

        // Handle milestone transition from SPARE_REQUESTED to SPARE_APPROVED
        try {
          const ticket = await tx.ticket.findUnique({
            where: { ticketCode: spareItem.spareRequest.ticketCode },
            include: {
              ticketMilestones: {
                where: { status: 'IN_PROGRESS' },
                orderBy: { order: 'desc' }
              }
            }
          });

          if (ticket && ticket.ticketMilestones.length > 0) {
            const currentMilestone = ticket.ticketMilestones[0];
            
            if (currentMilestone.stage === 'SPARE_REQUESTED') {
              // Complete current milestone
              await tx.ticketMilestone.update({
                where: { id: currentMilestone.id },
                data: {
                  status: 'DONE',
                  completedAt: new Date(),
                  changedBy: approvedBy,
                  notes: `${currentMilestone.notes || ''} - All spare items approved by ${approverName} (${approverRole})`
                }
              });

              // Create appropriate milestone based on final status
              let nextStage, milestoneNotes, order, milestoneStatus = 'IN_PROGRESS';
              if (rejectedItems.length === allItems.length) {
                // All items rejected - close the ticket directly
                nextStage = 'TICKET_CLOSED';
                milestoneNotes = `Ticket closed - All spare requests rejected (${allItems.length} item(s))`;
                order = 12;
                milestoneStatus = 'DONE';
                
                // Update ticket status to closed
                await tx.ticket.update({
                  where: { id: ticket.id },
                  data: {
                    status: 'CLOSED',
                    updatedAt: new Date()
                  }
                });
              } else if (approvedItems.length === allItems.length) {
                // All items approved - create SPARE_APPROVED milestone
                nextStage = 'SPARE_APPROVED';
                milestoneNotes = `Spare request fully approved - ${allItems.length} item(s) approved by ${approverName} (${approverRole})`;
                order = 10;
              } else {
                // Mixed scenario - create SPARE_APPROVED milestone (partial approval)
                nextStage = 'SPARE_APPROVED';
                milestoneNotes = `Spare request processed - ${approvedItems.length} approved, ${rejectedItems.length} rejected by ${approverName} (${approverRole})`;
                order = 10;
              }
              
              const newMilestone = await tx.ticketMilestone.create({
                data: {
                  ticketId: ticket.id,
                  stage: nextStage,
                  status: milestoneStatus,
                  order: order,
                  changedBy: approvedBy,
                  notes: milestoneNotes,
                  startedAt: new Date(),
                  completedAt: milestoneStatus === 'DONE' ? new Date() : null
                }
              });
              
              milestoneTransitionResult = {
                previousStage: 'SPARE_REQUESTED',
                newStage: nextStage,
                milestoneId: newMilestone.id,
                ticketId: ticket.id
              };
            }
          }
        } catch (milestoneError) {
          console.error('❌ Error transitioning milestone after spare approval:', milestoneError);
          // Don't throw here as the item approval was successful
        }
      }

      // Create notification for requester
      const notification = await tx.notification.create({
        data: {
          title: 'Spare Request Approved',
          description: `Your spare request for ${spareItem.product.name} (Qty: ${spareItem.quantity}) has been approved by ${approverName} (${approverRole}). Item will be delivered to ${toCenterCode}.`,
          type: 'SPARE_APPROVED',
          createdById: approvedBy,
          recipients: {
            create: {
              userId: spareItem.spareRequest.createdBy,
              seen: false
            }
          }
        }
      });

      return { updatedItem, notification, milestoneTransitionResult, transaction };
    });

    console.log(`✅ Spare request item ${itemId} approved. Inventory deducted from ${result.transaction.fromCenterCode}, Transaction ID: ${result.transaction.id}`);
    return result;
  } catch (error) {
    console.error('❌ Error approving spare request item:', error);
    throw error;
  }
}

/**
 * Reject individual spare request item
 */
async function rejectSpareRequestItem(itemId, rejectedBy, rejecterName, rejecterRole, reason = '') {
  try {
    const result = await prisma.$transaction(async (tx) => {
      // Get the spare request item
      const spareItem = await tx.spareRequestItem.findUnique({
        where: { id: itemId },
        include: {
          product: {
            include: {
              inventories: true,
            },
          },
          spareRequest: {
            include: {
              createdByUser: {
                select: { id: true, name: true, role: true }
              }
            }
          }
        }
      });

      if (!spareItem) {
        throw new Error('Spare request item not found');
      }

      if (spareItem.status === 'rejected') {
        throw new Error('Spare request item is already rejected');
      }

      if (spareItem.status === 'approved') {
        throw new Error('Cannot reject an already approved spare request item');
      }

      // Update spare request item status
      const updatedItem = await tx.spareRequestItem.update({
        where: { id: itemId },
        data: {
          status: 'rejected',
          updatedAt: new Date()
        },
        include: {
          product: {
            include: {
              inventories: true,
            },
          },
          spareRequest: {
            include: {
              createdByUser: {
                select: { id: true, name: true, role: true }
              }
            }
          }
        }
      });

      // Check if all items have been processed (approved or rejected)
      const allItems = await tx.spareRequestItem.findMany({
        where: { spareRequestId: spareItem.spareRequestId }
      });

      const approvedItems = allItems.filter(item => item.status === 'approved');
      const rejectedItems = allItems.filter(item => item.status === 'rejected');
      const processedItems = approvedItems.length + rejectedItems.length;
      let milestoneTransitionResult = null;
      
      if (processedItems === allItems.length) {
        // Determine final status based on what was processed
        let finalStatus;
        if (approvedItems.length === allItems.length) {
          finalStatus = 'APPROVED';
        } else if (rejectedItems.length === allItems.length) {
          finalStatus = 'REJECTED';
        } else {
          finalStatus = 'PARTIALLY_APPROVED'; // Mixed scenario
        }
        
        await tx.spareRequest.update({
          where: { id: spareItem.spareRequestId },
          data: {
            status: finalStatus,
            updatedBy: rejectedBy
          }
        });
        
        // Handle milestone transition from SPARE_REQUESTED to SPARE_APPROVED (regardless of mix)
        try {
          const ticket = await tx.ticket.findUnique({
            where: { ticketCode: spareItem.spareRequest.ticketCode },
            include: {
              ticketMilestones: {
                where: { status: 'IN_PROGRESS' },
                orderBy: { order: 'desc' }
              }
            }
          });

          if (ticket && ticket.ticketMilestones.length > 0) {
            const currentMilestone = ticket.ticketMilestones[0];
            
            if (currentMilestone.stage === 'SPARE_REQUESTED') {
              // Complete current milestone
              await tx.ticketMilestone.update({
                where: { id: currentMilestone.id },
                data: {
                  status: 'DONE',
                  completedAt: new Date(),
                  changedBy: rejectedBy,
                  notes: `${currentMilestone.notes || ''} - All spare items processed: ${approvedItems.length} approved, ${rejectedItems.length} rejected`
                }
              });

              // Create appropriate milestone based on final status
              let nextStage, milestoneNotes, order, milestoneStatus = 'IN_PROGRESS';
              if (rejectedItems.length === allItems.length) {
                // All items rejected - close the ticket directly
                nextStage = 'TICKET_CLOSED';
                milestoneNotes = `Ticket closed - All spare requests rejected (${allItems.length} item(s)) by ${rejecterName} (${rejecterRole})`;
                order = 12;
                milestoneStatus = 'DONE';
                
                // Update ticket status to closed
                await tx.ticket.update({
                  where: { id: ticket.id },
                  data: {
                    status: 'CLOSED',
                    updatedAt: new Date()
                  }
                });
              } else if (approvedItems.length === allItems.length) {
                // All items approved - create SPARE_APPROVED milestone
                nextStage = 'SPARE_APPROVED';
                milestoneNotes = `Spare request fully approved - ${allItems.length} item(s) approved`;
                order = 10;
              } else {
                // Mixed scenario - create SPARE_APPROVED milestone (partial approval)
                nextStage = 'SPARE_APPROVED';
                milestoneNotes = `Spare request processed - ${approvedItems.length} approved, ${rejectedItems.length} rejected`;
                order = 10;
              }
              
              const newMilestone = await tx.ticketMilestone.create({
                data: {
                  ticketId: ticket.id,
                  stage: nextStage,
                  status: milestoneStatus,
                  order: order,
                  changedBy: rejectedBy,
                  notes: milestoneNotes,
                  startedAt: new Date(),
                  completedAt: milestoneStatus === 'DONE' ? new Date() : null
                }
              });
              
              milestoneTransitionResult = {
                previousStage: 'SPARE_REQUESTED',
                newStage: nextStage,
                milestoneId: newMilestone.id,
                ticketId: ticket.id
              };
            }
          }
        } catch (milestoneError) {
          console.error('❌ Error transitioning milestone after spare rejection:', milestoneError);
          // Don't throw here as the item rejection was successful
        }
      }

      // Create notification for requester
      const notification = await tx.notification.create({
        data: {
          title: 'Spare Request Rejected',
          description: `Your spare request for ${spareItem.product.name} (Qty: ${spareItem.quantity}) has been rejected by ${rejecterName} (${rejecterRole})${reason ? `. Reason: ${reason}` : ''}`,
          type: 'SPARE_REJECTED',
          createdById: rejectedBy,
          recipients: {
            create: {
              userId: spareItem.spareRequest.createdBy,
              seen: false
            }
          }
        }
      });

      return { updatedItem, notification, milestoneTransitionResult };
    });

    return result;
  } catch (error) {
    console.error('❌ Error rejecting spare request item:', error);
    throw error;
  }
}

/**
 * Get pending spare request items for approval
 */
async function getPendingSpareRequestsForApproval({ skip = 0, take = 20, userRole = null, userId = null, userCenterCode = null } = {}) {
  try {
    const whereCondition = {
      status: {
        in: ['PENDING', 'URGENT']
      },
      spareItems: {
        some: {
          status: {
            in: ['REQUESTED', 'pending']
          }
        }
      }
    };

    const [spareRequests, count] = await Promise.all([
      prisma.spareRequest.findMany({
        where: whereCondition,
        include: {
          spareItems: {
            where: {
              status: {
                in: ['REQUESTED', 'pending']
              }
            },
            include: {
              product: {
                include: {
                  inventories: true
                }
              }
            }
          },
          createdByUser: {
            select: {
              id: true,
              name: true,
              role: true,
              centerCode: true
            }
          }
        },
        skip,
        take,
        orderBy: {
          createdAt: 'desc'
        }
      }),
      prisma.spareRequest.count({
        where: whereCondition
      })
    ]);

    // Get all unique ticket codes to fetch ticket details
    const ticketCodes = [...new Set(spareRequests.map(req => req.ticketCode))];
    const tickets = await prisma.ticket.findMany({
      where: {
        ticketCode: {
          in: ticketCodes
        }
      },
      select: {
        ticketCode: true,
        assignedServiceCenter: true
      }
    });

    // Create a map for quick ticket lookup
    const ticketMap = new Map(tickets.map(t => [t.ticketCode, t]));

    // Flatten the result to show individual items for approval
    const approvalItems = [];
    spareRequests.forEach(request => {
      const ticket = ticketMap.get(request.ticketCode);
      const requestingCenter = ticket?.assignedServiceCenter || request.createdByUser.centerCode;

      request.spareItems.forEach(item => {
        // Find inventory at MACSOFT HEAD SERVICE CENTER (central warehouse)
        const macsoftInventory = item.product.inventories?.find(
          inv => inv.centerCode === 'MHSEC'
        );
        
        // Find inventory at requesting service center
        const centerInventory = requestingCenter ? item.product.inventories?.find(
          inv => inv.centerCode === requestingCenter
        ) : null;
        
        // Available quantity from MHSEC (where spares are approved from)
        const macsoftQty = macsoftInventory?.goodQty || 0;
        
        // Available quantity at requesting center (for reference)
        const centerQty = centerInventory?.goodQty || 0;
        
        // Get user's service center inventory for service center roles
        const userCenterInventory = userCenterCode ? item.product.inventories?.find(
          inv => inv.centerCode === userCenterCode
        ) : null;
        const userCenterQty = userCenterInventory?.goodQty || 0;
        
        // Determine role-based inventory display
        const isMacsoftRole = userRole && userRole.includes('MACSOFT');
        
        let displayedAvailableQty, displayedCenterQty, displayedCenter;
        
        if (isMacsoftRole) {
          // MACSOFT roles see both MACSOFT and requesting service center quantities
          displayedAvailableQty = macsoftQty;
          displayedCenterQty = centerQty; // Always show requesting center quantity
          displayedCenter = requestingCenter;
        } else {
          // Service center roles see their own inventory as primary
          displayedAvailableQty = userCenterQty;
          // Show requesting center quantity if it's different from user's center
          displayedCenterQty = (requestingCenter && requestingCenter !== userCenterCode) ? centerQty : undefined;
          displayedCenter = userCenterCode;
        }
        
        const approvalItem = {
          itemId: item.id,
          requestId: request.id,
          ticketCode: request.ticketCode,
          productId: item.productId,
          productName: item.product.name,
          productCode: item.product.productCode,
          requestedQuantity: item.quantity,
          availableQuantity: displayedAvailableQty,
          centerAvailableQuantity: displayedCenterQty,
          requestingCenter: displayedCenter,
          // Keep original values for approval logic
          macsoftQty: macsoftQty,
          actualCenterQty: centerQty,
          actualRequestingCenter: requestingCenter,
          status: item.status,
          requestedBy: request.createdByUser.name,
          requestedByRole: request.createdByUser.role,
          requestedDate: request.createdAt,
          canApprove: macsoftQty >= item.quantity || centerQty >= item.quantity || userCenterQty >= item.quantity
        };
        
        approvalItems.push(approvalItem);
      });
    });

    return { spareRequests: approvalItems, count };
  } catch (error) {
    console.error('❌ Error getting pending spare requests for approval:', error);
    throw error;
  }
}

/**
 * Bulk approve multiple spare request items
 */
async function bulkApproveSpareRequestItems(itemIds, approvedBy, approverName, approverRole) {
  try {
    const results = {
      successful: [],
      failed: [],
      insufficientStock: [],
      totalProcessed: itemIds.length,
      milestoneTransitions: []
    };

    // Process each item individually to handle failures gracefully
    for (const itemId of itemIds) {
      try {
        const approvalResult = await approveSpareRequestItem(parseInt(itemId), approvedBy, approverName, approverRole);
        results.successful.push(itemId);
        
        // Collect milestone transitions
        if (approvalResult.milestoneTransitionResult) {
          results.milestoneTransitions.push(approvalResult.milestoneTransitionResult);
        }
      } catch (error) {
        if (error.message.includes('Insufficient inventory')) {
          results.insufficientStock.push({
            itemId,
            error: error.message
          });
        } else {
          results.failed.push({
            itemId,
            error: error.message
          });
        }
      }
    }

    return results;
  } catch (error) {
    console.error('❌ Error bulk approving spare request items:', error);
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
  approveSpareRequestItem,
  rejectSpareRequestItem,
  getPendingSpareRequestsForApproval,
  bulkApproveSpareRequestItems,
};
