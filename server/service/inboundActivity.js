const { prisma } = require("../lib/clients");

const inventoryService = require("./inventory");

/**
 * Create an inbound activity (stock replenishment)
 */
async function createInboundActivity(data) {
  try {
    const {
      items, // Array of { productId, quantity, notes? }
      supplier,
      reference, // PO number, invoice number, etc.
      notes,
      createdBy,
    } = data;

    // Validate all products exist
    const productIds = items.map((item) => item.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true, productCode: true },
    });

    if (products.length !== productIds.length) {
      throw new Error("One or more products not found");
    }

    // Process inventory additions
    const inventoryResults = await inventoryService.addInventory(
      items,
      `Inbound activity${reference ? ` - Ref: ${reference}` : ""}${
        supplier ? ` from ${supplier}` : ""
      }${notes ? ` - ${notes}` : ""}`,
      createdBy
    );

    return {
      success: true,
      processedItems: inventoryResults.length,
      items: inventoryResults.map((result) => ({
        productId: result.productId,
        productName: result.product.name,
        productCode: result.product.productCode,
        addedQuantity: result.addedQuantity,
        previousQuantity: result.previousQuantity,
        newQuantity: result.newQuantity,
        inventoryCreated: result.created,
      })),
      supplier,
      reference,
      notes,
      createdAt: new Date(),
    };
  } catch (error) {
    throw error;
  }
}

/**
 * Get inbound activity history (using product transactions)
 */
async function getInboundActivityHistory(options = {}) {
  try {
    const { productId, startDate, endDate, limit = 50, skip = 0 } = options;

    const where = {
      type: "RECEIPT",
    };

    if (productId) {
      where.productId = parseInt(productId);
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const [transactions, count] = await Promise.all([
      prisma.productTransaction.findMany({
        where,
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
        skip,
      }),
      prisma.productTransaction.count({ where }),
    ]);

    return {
      transactions,
      count,
      currentPage: Math.floor(skip / limit) + 1,
      totalPages: Math.ceil(count / limit),
    };
  } catch (error) {
    throw error;
  }
}

/**
 * Process bulk inbound activity from CSV or bulk data
 */
async function processBulkInboundActivity(data) {
  try {
    const {
      items, // Array of { productCode?, productId?, quantity, notes? }
      supplier,
      reference,
      notes,
      createdBy,
    } = data;

    // Resolve product IDs from product codes if needed
    const processedItems = [];

    for (const item of items) {
      let productId = item.productId;

      if (!productId && item.productCode) {
        const product = await prisma.product.findUnique({
          where: { productCode: item.productCode },
          select: { id: true },
        });

        if (!product) {
          throw new Error(`Product not found with code: ${item.productCode}`);
        }

        productId = product.id;
      }

      if (!productId) {
        throw new Error(`Product ID or product code is required for each item`);
      }

      if (!item.quantity || item.quantity <= 0) {
        throw new Error(
          `Invalid quantity for product ${item.productCode || productId}: ${
            item.quantity
          }`
        );
      }

      processedItems.push({
        productId,
        quantity: parseInt(item.quantity),
        location: item.location,
        notes: item.notes,
      });
    }

    // Create the inbound activity
    const result = await createInboundActivity({
      items: processedItems,
      supplier,
      reference,
      notes,
      createdBy,
    });

    return result;
  } catch (error) {
    throw error;
  }
}

/**
 * Get inbound activity summary by date range
 */
async function getInboundActivitySummary(startDate, endDate) {
  try {
    const where = {
      type: "RECEIPT",
      createdAt: {},
    };

    if (startDate) where.createdAt.gte = new Date(startDate);
    if (endDate) where.createdAt.lte = new Date(endDate);

    const summary = await prisma.productTransaction.groupBy({
      by: ["productId"],
      where,
      _sum: {
        quantity: true,
      },
      _count: {
        id: true,
      },
    });

    // Get product details for summary
    const productIds = summary.map((s) => s.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: {
        id: true,
        name: true,
        productCode: true,
        category: true,
      },
    });

    const productMap = products.reduce((acc, product) => {
      acc[product.id] = product;
      return acc;
    }, {});

    const summaryWithProducts = summary.map((item) => ({
      productId: item.productId,
      product: productMap[item.productId],
      totalQuantityReceived: item._sum.quantity,
      transactionCount: item._count.id,
    }));

    return summaryWithProducts;
  } catch (error) {
    throw error;
  }
}

module.exports = {
  createInboundActivity,
  getInboundActivityHistory,
  processBulkInboundActivity,
  getInboundActivitySummary,
};
