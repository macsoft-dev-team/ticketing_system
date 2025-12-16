const { PrismaClient } = require("../prisma/generated/prisma/client");
const prisma = new PrismaClient();

/**
 * INVENTORY TRANSACTION SERVICE
 * Single Source of Truth for all inventory changes
 * 
 * CORE PRINCIPLES:
 * 1. Inventory is STATE (current quantities)
 * 2. ProductTransaction is TRUTH (why inventory changed)
 * 3. Inventory NEVER changes without a ProductTransaction
 * 4. Every transaction must have a STATUS
 */

class InventoryTransactionService {
  /**
   * Get condition field name based on InventoryCondition enum
   */
  getConditionField(condition) {
    const fieldMap = {
      GOOD: "goodQty",
      DEFECTIVE: "damagedQty",
      REPAIRABLE: "repairableQty",
      SCRAP: "scrapQty",
    };
    return fieldMap[condition];
  }

  /**
   * Update inventory based on transaction type and status
   */
  async updateInventory(transaction, items, prismaClient = prisma) {
    const { transactionType, status, centerCode, fromCenterCode, toCenterCode } = transaction;

    for (const item of items) {
      const { productId, condition, quantity } = item;

      // Skip if productId is not known (customer return with unknown product)
      if (!productId) continue;

      const conditionField = this.getConditionField(condition);

      // Determine inventory impact based on transaction type and status
      switch (transactionType) {
        case "RECEIPT":
          if (status === "RECEIVED" || status === "COMPLETED") {
            await this.incrementInventory(centerCode, productId, conditionField, quantity, prismaClient);
          }
          break;

        case "RETURN":
          if (status === "RECEIVED") {
            await this.incrementInventory(centerCode, productId, conditionField, quantity, prismaClient);
          }
          break;

        case "DELIVERY":
        case "TICKET_ISSUE":
          if (status === "COMPLETED") {
            await this.decrementInventory(centerCode, productId, conditionField, quantity, prismaClient);
          }
          break;

        case "TRANSFER":
          if (status === "PENDING") {
            // Deduct from source center immediately on dispatch
            await this.decrementInventory(fromCenterCode, productId, conditionField, quantity, prismaClient);
          } else if (status === "RECEIVED") {
            // Add to destination center on receive
            await this.incrementInventory(toCenterCode, productId, conditionField, quantity, prismaClient);
          } else if (status === "CANCELLED") {
            // Return to source center if cancelled
            await this.incrementInventory(fromCenterCode, productId, conditionField, quantity, prismaClient);
          } else if (status === "PENDING_APPROVAL") {
            // Do nothing - waiting for approval, no inventory change
          } else if (status === "APPROVED") {
            // Status changed in approval controller, inventory already handled
          } else if (status === "REJECTED") {
            // Do nothing - request rejected, no inventory change
          }
          break;

        case "ADJUSTMENT":
          // ADMIN only - can be positive or negative
          if (status === "COMPLETED") {
            const signedQuantity = item.adjustmentQuantity || quantity;
            if (signedQuantity > 0) {
              await this.incrementInventory(centerCode, productId, conditionField, Math.abs(signedQuantity), prismaClient);
            } else {
              await this.decrementInventory(centerCode, productId, conditionField, Math.abs(signedQuantity), prismaClient);
            }
          }
          break;

        default:
          throw new Error(`Unknown transaction type: ${transactionType}`);
      }
    }
  }

  /**
   * Increment inventory quantity
   */
  async incrementInventory(centerCode, productId, conditionField, quantity, prismaClient = prisma) {
    // Find or create inventory record
    let inventory = await prismaClient.inventory.findUnique({
      where: {
        centerCode_productId: {
          centerCode,
          productId,
        },
      },
    });

    if (!inventory) {
      // Create new inventory record
      inventory = await prismaClient.inventory.create({
        data: {
          centerCode,
          productId,
          [conditionField]: quantity,
        },
      });
    } else {
      // Update existing inventory
      await prismaClient.inventory.update({
        where: { id: inventory.id },
        data: {
          [conditionField]: {
            increment: quantity,
          },
        },
      });
    }
  }

  /**
   * Decrement inventory quantity with validation
   */
  async decrementInventory(centerCode, productId, conditionField, quantity, prismaClient = prisma) {
    const inventory = await prismaClient.inventory.findUnique({
      where: {
        centerCode_productId: {
          centerCode,
          productId,
        },
      },
    });

    if (!inventory) {
      throw new Error(`Inventory not found for center ${centerCode} and product ${productId}`);
    }

    const currentQty = inventory[conditionField];
    if (currentQty < quantity) {
      throw new Error(
        `Insufficient ${conditionField} inventory. Available: ${currentQty}, Required: ${quantity}`
      );
    }

    await prismaClient.inventory.update({
      where: { id: inventory.id },
      data: {
        [conditionField]: {
          decrement: quantity,
        },
      },
    });
  }

  /**
   * Update inventory quantity (can be positive or negative)
   * Used for manual adjustments or approval flows
   */
  async updateInventoryQuantity(prismaClient, centerCode, productId, condition, quantity) {
    const conditionField = this.getConditionField(condition);
    
    if (quantity > 0) {
      await this.incrementInventory(centerCode, productId, conditionField, quantity, prismaClient);
    } else if (quantity < 0) {
      await this.decrementInventory(centerCode, productId, conditionField, Math.abs(quantity), prismaClient);
    }
    // If quantity is 0, do nothing
  }

  /**
   * Create a transaction with inventory update
   */
  async createTransaction(data, userId) {
    const { transactionType, status, centerCode, fromCenterCode, toCenterCode, items, ...rest } = data;

    return await prisma.$transaction(async (tx) => {
      // Validate items
      if (!items || items.length === 0) {
        throw new Error("Transaction must have at least one item");
      }

      // Validate quantities
      for (const item of items) {
        if (item.quantity <= 0) {
          throw new Error("Quantity must be positive");
        }
      }

      // Create transaction
      const transaction = await tx.productTransaction.create({
        data: {
          transactionType,
          status: status || "PENDING",
          centerCode: centerCode || fromCenterCode,
          fromCenterCode,
          toCenterCode,
          createdBy: userId,
          ...rest,
        },
        include: {
          serviceCenter: true,
          fromCenter: true,
          toCenter: true,
        },
      });

      // Create transaction items
      const createdItems = [];
      for (const item of items) {
        const createdItem = await tx.productTransactionItem.create({
          data: {
            transactionId: transaction.id,
            productId: item.productId,
            productName: item.productName,
            condition: item.condition,
            quantity: item.quantity,
          },
          include: {
            product: true,
          },
        });
        createdItems.push(createdItem);
      }

      // Update inventory based on transaction
      await this.updateInventory(transaction, createdItems, tx);

      return {
        ...transaction,
        items: createdItems,
      };
    });
  }

  /**
   * Update transaction status (e.g., PENDING → RECEIVED for transfers)
   */
  async updateTransactionStatus(transactionId, newStatus, userId) {
    return await prisma.$transaction(async (tx) => {
      const transaction = await tx.productTransaction.findUnique({
        where: { id: transactionId },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      });

      if (!transaction) {
        throw new Error("Transaction not found");
      }

      // Validate status transition
      this.validateStatusTransition(transaction.status, newStatus, transaction.transactionType);

      // Update transaction status
      const updatedTransaction = await tx.productTransaction.update({
        where: { id: transactionId },
        data: {
          status: newStatus,
          receivedAt: newStatus === "RECEIVED" ? new Date() : transaction.receivedAt,
          updatedAt: new Date(),
        },
        include: {
          items: true,
          serviceCenter: true,
          fromCenter: true,
          toCenter: true,
        },
      });

      // Update inventory based on new status
      await this.updateInventory(updatedTransaction, transaction.items, tx);

      return updatedTransaction;
    });
  }

  /**
   * Validate status transitions
   */
  validateStatusTransition(currentStatus, newStatus, transactionType) {
    const validTransitions = {
      PENDING_APPROVAL: ["APPROVED", "REJECTED", "PENDING"], // Approval workflow
      APPROVED: ["PENDING"], // After approval, can move to pending
      REJECTED: [], // Terminal state
      PENDING: ["RECEIVED", "COMPLETED", "CANCELLED"],
      RECEIVED: ["COMPLETED", "CANCELLED"],
      COMPLETED: [], // Terminal state
      CANCELLED: [], // Terminal state
    };

    if (!validTransitions[currentStatus]?.includes(newStatus)) {
      throw new Error(`Invalid status transition from ${currentStatus} to ${newStatus}`);
    }

    // TRANSFER specific validation
    if (transactionType === "TRANSFER" && currentStatus === "PENDING" && newStatus === "COMPLETED") {
      throw new Error("TRANSFER must be RECEIVED before COMPLETED");
    }
  }

  /**
   * Get pending transfers for a service center
   */
  async getPendingTransfers(centerCode, role = null) {
    const where = {
      transactionType: "TRANSFER",
      status: "PENDING",
    };

    // MACSOFT can see all pending transfers
    if (role === "MACSOFT_ADMIN" || role === "MACSOFT_HEAD") {
      // No additional filter - see all pending transfers
    } else {
      // SSC only sees transfers coming TO their center
      where.toCenterCode = centerCode;
    }

    return await prisma.productTransaction.findMany({
      where,
      include: {
        items: {
          include: {
            product: true,
          },
        },
        fromCenter: true,
        toCenter: true,
        createdByUser: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  /**
   * Get transaction history
   */
  async getTransactionHistory(filters = {}) {
    const { centerCode, transactionType, status, startDate, endDate, skip = 0, take = 50 } = filters;

    const where = {};
    if (centerCode) where.centerCode = centerCode;
    if (transactionType) where.transactionType = transactionType;
    if (status) where.status = status;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const [transactions, total] = await Promise.all([
      prisma.productTransaction.findMany({
        where,
        include: {
          items: {
            include: {
              product: true,
            },
          },
          serviceCenter: true,
          fromCenter: true,
          toCenter: true,
          ticket: {
            select: {
              id: true,
              ticketCode: true,
            },
          },
          createdByUser: {
            select: {
              id: true,
              name: true,
              phone: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        skip: parseInt(skip),
        take: parseInt(take),
      }),
      prisma.productTransaction.count({ where }),
    ]);

    return {
      transactions,
      total,
      page: Math.floor(skip / take) + 1,
      totalPages: Math.ceil(total / take),
    };
  }

  /**
   * Check inventory availability
   */
  async checkInventoryAvailability(centerCode, productId, condition, requiredQuantity) {
    const inventory = await prisma.inventory.findUnique({
      where: {
        centerCode_productId: {
          centerCode,
          productId,
        },
      },
    });

    if (!inventory) {
      return {
        available: false,
        currentQuantity: 0,
        requiredQuantity,
      };
    }

    const conditionField = this.getConditionField(condition);
    const currentQty = inventory[conditionField];

    return {
      available: currentQty >= requiredQuantity,
      currentQuantity: currentQty,
      requiredQuantity,
    };
  }
}

module.exports = new InventoryTransactionService();
