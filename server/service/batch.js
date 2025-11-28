const { prisma } = require("../lib/clients");

const generateBatchCode = () => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0");
  return `BATCH-${timestamp}-${random}`;
};

const getBatchByUser = async (userId) => {
  try {
    const batches = await prisma.batch.findMany({
      where: { createdBy: userId },
      include: {
        batchItems: {
          include: {
            ticket: {
              include: {
                messages: true,
                notifications: true,
                productTransactions: true,
                attachments: true,
                ticketMilestones: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    return batches;
  } catch (error) {
    console.error("❌ Error fetching batches by user:", error);
    throw error;
  }
};

const getActiveBatchByUser = async (userId, batchType) => {
  try {
    const where = {
      batchStatus: "PENDING",
    };
    if (batchType === "DELIVERY_CONTROLLER") {
      where.batchType = "DELIVERY_CONTROLLER";
    } else {
      where.batchType = "RECEIVE_CONTROLLER";
    }

    if (userId) {
      where.createdBy = userId;
    }
    const activeBatch = await prisma.batch.findFirst({
      where:  where,
      include: {
        batchItems: {
          include: {
            ticket: {
              include: {
                attachments: true,
                ticketMilestones: {
                  include: {
                    attachments: true,
                  },
                },
                messages: true,
                notifications: true,
                productTransactions: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    return activeBatch;
  } catch (error) {
    console.error("❌ Error fetching active batch by user:", error);
    throw error;
  }
};

const getCompletedBatchesByUser = async (userId, batchType) => {
  try {
    const where = {
      batchStatus: "COMPLETED",
    };
    if (batchType === "DELIVERY_CONTROLLER") {
      where.batchType = "DELIVERY_CONTROLLER";
    } else {
      where.batchType = "RECEIVE_CONTROLLER";
    }

    if (userId) {
      where.createdBy = userId;
    }

    const completedBatches = await prisma.batch.findMany({
      where,
      include: {
        batchItems: {
          include: {
            ticket: {
              include: {
                attachments: true,
                ticketMilestones: {
                  include: {
                    attachments: true,
                  },
                },
                messages: true,
                notifications: true,
                productTransactions: true,
              },
            },
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });
    return completedBatches;
  } catch (error) {
    console.error("❌ Error fetching completed batches by user:", error);
    throw error;
  }
};

const createBatch = async (userId, batchType = "RECEIVE_CONTROLLER") => {
  try {
    const batchCode = generateBatchCode();

    const batch = await prisma.batch.create({
      data: {
        batchCode,
        batchType,
        createdBy: userId,
      },
      include: {
        batchItems: {
          include: {
            ticket: {
              select: {
                id: true,
                ticketCode: true,
                controllerNo: true,
                customerName: true,
                status: true,
              },
            },
          },
        },
      },
    });

    return batch;
  } catch (error) {
    console.error("❌ Error creating batch:", error);
    throw error;
  }
};

const addTicketToBatch = async (batchId, ticketId) => {
  try {
    // Check if ticket is already in this batch
    const existingItem = await prisma.batchItem.findFirst({
      where: {
        batchId,
        ticketId,
      },
    });

    if (existingItem) {
      throw new Error("Ticket is already in this batch");
    }

    const batchItem = await prisma.batchItem.create({
      data: {
        batchId,
        ticketId,
      },
      include: {
        ticket: {
          select: {
            id: true,
            ticketCode: true,
            controllerNo: true,
            customerName: true,
            status: true,
          },
        },
      },
    });

    return batchItem;
  } catch (error) {
    console.error("❌ Error adding ticket to batch:", error);
    throw error;
  }
};

const removeTicketFromBatch = async (batchId, ticketId) => {
  try {
    const deletedItem = await prisma.batchItem.deleteMany({
      where: {
        batchId,
        ticketId,
      },
    });

    return deletedItem;
  } catch (error) {
    console.error("❌ Error removing ticket from batch:", error);
    throw error;
  }
};

const getOrCreateActiveBatch = async (
  userId,
  batchType = "RECEIVE_CONTROLLER"
) => {
  try {
    // First try to get existing active batch
    let activeBatch = await getActiveBatchByUser(userId, batchType);

    // If no active batch, create one
    if (!activeBatch) {
      activeBatch = await createBatch(userId, batchType);
    }

    return activeBatch;
  } catch (error) {
    console.error("❌ Error getting or creating active batch:", error);
    throw error;
  }
};

const getBatchImages = async (batchId) => {
  try {
    // Get all tickets in the batch and their milestone attachments
    const batch = await prisma.batch.findUnique({
      where: { id: batchId },
      include: {
        batchItems: {
          include: {
            ticket: {
              include: {
                attachments: true,
                ticketMilestones: {
                  include: {
                    attachments: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!batch) {
      throw new Error("Batch not found");
    }

    // Collect all images from all ticket milestones in the batch
    const images = [];

    batch.batchItems.forEach((batchItem) => {
      batchItem.ticket.ticketMilestones.forEach((milestone) => {
        milestone.attachments.forEach((attachment) => {
          // Only include image files
          if (attachment.fileType && attachment.fileType.startsWith("image/")) {
            images.push({
              id: attachment.id,
              filename: attachment.fileName,
              mimeType: attachment.fileType,
              size: attachment.fileSize,
              url: `/api/attachments/download/${attachment.id}`,
              uploadedAt: attachment.createdAt,
              ticketCode: batchItem.ticket.ticketCode,
              milestoneId: attachment.milestoneId,
            });
          }
        });
      });
    });

    return images;
  } catch (error) {
    console.error("❌ Error getting batch images:", error);
    throw error;
  }
};

const receiveControllerBatch = async (batchId) => {
  try {
    // Update batch status to COMPLETED
    const updatedBatch = await prisma.batch.update({
      where: { id: parseInt(batchId) },
      data: {
        batchStatus: "COMPLETED",
        updatedAt: new Date(),
      },
    });
    return updatedBatch;
  } catch (error) {
    console.error("❌ Error receiving controller batch:", error);
    throw error;
  }
};

module.exports = {
  getBatchByUser,
  getActiveBatchByUser,
  getCompletedBatchesByUser,
  createBatch,
  addTicketToBatch,
  removeTicketFromBatch,
  getOrCreateActiveBatch,
  getBatchImages,
  receiveControllerBatch,
};
