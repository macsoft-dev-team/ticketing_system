const { prisma } = require("../lib/clients");

/**
 * Get all inventory records with product details
 */
async function getAllInventory(skip = 0, take = 10, filter = null) {
  try {
    const params = {};

    if (skip) params.skip = (parseInt(skip) - 1) * parseInt(take || 10);
    if (take) params.take = parseInt(take);

    let where = {};
    if (filter) {
      where.OR = [
        { product: { name: { contains: filter } } },
        { product: { productCode: { contains: filter } } },
        { product: { category: { contains: filter } } },
        { location: { contains: filter } },
      ];
    }
    params.where = where;

    const [inventory, count] = await Promise.all([
      prisma.inventory.findMany({
        ...params,
        include: {
          product: {
            select: {
              id: true,
              name: true,
              productCode: true,
              category: true,
              brandName: true,
            },
          },
        },
        orderBy: {
          updatedAt: "desc",
        },
      }),
      prisma.inventory.count({ where: params.where }),
    ]);

    return { inventory, count };
  } catch (error) {
    console.error("❌ Error fetching inventory:", error);
    throw error;
  }
}

/**
 * Get inventory by product ID
 */
async function getInventoryByProductId(productId) {
  try {
    const inventory = await prisma.inventory.findUnique({
      where: { productId: parseInt(productId) },
      include: {
        product: true,
      },
    });

    return inventory;
  } catch (error) {
    console.error("❌ Error fetching inventory by product ID:", error);
    throw error;
  }
}

/**
 * Create or update inventory for a product
 */
async function upsertInventory(data) {
  try {
    const { productId, quantity, minStock, maxStock, location } = data;

    const inventory = await prisma.inventory.upsert({
      where: { productId: parseInt(productId) },
      update: {
        quantity: parseInt(quantity),
        minStock: parseInt(minStock) || 0,
        maxStock: maxStock ? parseInt(maxStock) : null,
        location: location || null,
        updatedAt: new Date(),
      },
      create: {
        productId: parseInt(productId),
        quantity: parseInt(quantity),
        minStock: parseInt(minStock) || 0,
        maxStock: maxStock ? parseInt(maxStock) : null,
        location: location || null,
      },
      include: {
        product: true,
      },
    });
    return inventory;
  } catch (error) {
    console.error("❌ Error upserting inventory:", error);
    throw error;
  }
}

/**
 * Check stock availability for multiple products
 */
async function checkStockAvailability(items) {
  try {
    const stockChecks = await Promise.all(
      items.map(async (item) => {
        const inventory = await prisma.inventory.findUnique({
          where: { productId: item.productId },
          include: {
            product: {
              select: {
                id: true,
                name: true,
                productCode: true,
              },
            },
          },
        });

        const available = inventory
          ? inventory.quantity >= item.quantity
          : false;
        const availableQuantity = inventory ? inventory.quantity : 0;

        return {
          productId: item.productId,
          requestedQuantity: item.quantity,
          availableQuantity,
          sufficient: available,
          product: inventory?.product || null,
          inventoryExists: !!inventory,
        };
      })
    );

    const allAvailable = stockChecks.every((check) => check.sufficient);
    const insufficientItems = stockChecks.filter((check) => !check.sufficient);

    return {
      allAvailable,
      stockChecks,
      insufficientItems,
    };
  } catch (error) {
    console.error("❌ Error checking stock availability:", error);
    throw error;
  }
}

/**
 * Deduct inventory quantities (used when spare items are issued)
 */
async function deductInventory(items, ticketCode = null, updatedBy = null) {
  try {
    const results = [];

    for (const item of items) {
      const currentInventory = await prisma.inventory.findUnique({
        where: { productId: item.productId },
        include: { product: true },
      });

      if (!currentInventory) {
        throw new Error(
          `No inventory record found for product ID ${item.productId}`
        );
      }

      if (currentInventory.quantity < item.quantity) {
        throw new Error(
          `Insufficient stock for ${currentInventory.product.name}. Available: ${currentInventory.quantity}, Required: ${item.quantity}`
        );
      }

      // Update inventory quantity
      const updatedInventory = await prisma.inventory.update({
        where: { productId: item.productId },
        data: {
          quantity: currentInventory.quantity - item.quantity,
          updatedAt: new Date(),
        },
        include: { product: true },
      });

      // Create transaction record for outbound (DELIVERY)
      await prisma.productTransaction.create({
        data: {
          productId: item.productId,
          type: "DELIVERY",
          quantity: item.quantity,
          ticketId: ticketCode ? await getTicketIdFromCode(ticketCode) : null,
          notes: ticketCode
            ? `Spare parts issued for ticket ${ticketCode}`
            : "Inventory deduction",
          createdBy: updatedBy || 1, // Default to system user if not provided
        },
      });

      results.push({
        productId: item.productId,
        product: updatedInventory.product,
        previousQuantity: currentInventory.quantity,
        newQuantity: updatedInventory.quantity,
        deductedQuantity: item.quantity,
      });
    }

    return results;
  } catch (error) {
    console.error("❌ Error deducting inventory:", error);
    throw error;
  }
}

/**
 * Add inventory quantities (used for inbound activities/stock replenishment)
 */
async function addInventory(items, notes = null, updatedBy = null) {
  try {
    const results = [];

    for (const item of items) {
      const currentInventory = await prisma.inventory.findUnique({
        where: { productId: item.productId },
        include: { product: true },
      });

      if (!currentInventory) {
        // Create new inventory record if it doesn't exist
        const newInventory = await prisma.inventory.create({
          data: {
            productId: item.productId,
            quantity: item.quantity,
            minStock: 0,
            maxStock: null,
            location: item.location || null,
          },
          include: { product: true },
        });

        results.push({
          productId: item.productId,
          product: newInventory.product,
          previousQuantity: 0,
          newQuantity: newInventory.quantity,
          addedQuantity: item.quantity,
          created: true,
        });
      } else {
        // Update existing inventory
        const updatedInventory = await prisma.inventory.update({
          where: { productId: item.productId },
          data: {
            quantity: currentInventory.quantity + item.quantity,
            updatedAt: new Date(),
          },
          include: { product: true },
        });

        results.push({
          productId: item.productId,
          product: updatedInventory.product,
          previousQuantity: currentInventory.quantity,
          newQuantity: updatedInventory.quantity,
          addedQuantity: item.quantity,
          created: false,
        });
      }

      // Create transaction record for inbound (RECEIPT)
      await prisma.productTransaction.create({
        data: {
          productId: item.productId,
          type: "RECEIPT",
          quantity: item.quantity,
          notes: notes || "Stock replenishment",
          createdBy: updatedBy || 1,
        },
      });

    }

    return results;
  } catch (error) {
    throw error;
  }
}

/**
 * Get low stock items (quantity <= minStock)
 */
async function getLowStockItems() {
  try {
    // Get all inventory items and filter in application code
    // since Prisma doesn't support comparing fields directly in where clause
    const allInventory = await prisma.inventory.findMany({
      include: {
        product: {
          select: {
            id: true,
            name: true,
            productCode: true,
            category: true,
            brandName: true,
          },
        },
      },
      orderBy: {
        quantity: "asc",
      },
    });

    // Filter for low stock items
    const lowStockItems = allInventory.filter((item) => {
      return (
        item.quantity <= item.minStock ||
        (item.minStock === 0 && item.quantity === 0)
      );
    });

    return lowStockItems;
  } catch (error) {
    console.error("❌ Error fetching low stock items:", error);
    throw error;
  }
}

/**
 * Get inventory transaction history
 */
async function getInventoryTransactionHistory(productId = null, limit = 50) {
  try {
    const where = productId ? { productId: parseInt(productId) } : {};

    const transactions = await prisma.productTransaction.findMany({
      where,
      include: {
        product: {
          select: {
            id: true,
            name: true,
            productCode: true,
            category: true,
          },
        },
        ticket: {
          select: {
            id: true,
            ticketCode: true,
            description: true,
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
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
    });

    return transactions;
  } catch (error) {
    console.error("❌ Error fetching inventory transaction history:", error);
    throw error;
  }
}

/**
 * Helper function to get ticket ID from ticket code
 */
async function getTicketIdFromCode(ticketCode) {
  try {
    const ticket = await prisma.ticket.findUnique({
      where: { ticketCode },
      select: { id: true },
    });
    return ticket?.id || null;
  } catch (error) {
    console.error("❌ Error getting ticket ID:", error);
    return null;
  }
}

/**
 * Delete inventory record
 */
async function deleteInventory(productId) {
  try {
    await prisma.inventory.delete({
      where: { productId: parseInt(productId) },
    });

  } catch (error) {
    throw error;
  }
}

module.exports = {
  getAllInventory,
  getInventoryByProductId,
  upsertInventory,
  checkStockAvailability,
  deductInventory,
  addInventory,
  getLowStockItems,
  getInventoryTransactionHistory,
  deleteInventory,
};
