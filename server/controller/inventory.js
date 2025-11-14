const inventoryService = require("../service/inventory");
const moment = require("moment");

/**
 * Get all inventory records
 * GET /api/inventory
 */
async function getAllInventory(req, res) {
  try {
    const { skip, take, filter } = req.query;
    
    const { inventory, count } = await inventoryService.getAllInventory(
      skip,
      take,
      filter
    );

    // Transform inventory data for response
    const transformedInventory = inventory.map((item) => ({
      id: item.id,
      productId: item.productId,
      productName: item.product.name,
      productCode: item.product.productCode,
      category: item.product.category,
      brandName: item.product.brandName,
      quantity: item.quantity,
      minStock: item.minStock,
      maxStock: item.maxStock,
      location: item.location,
      status: getStockStatus(item.quantity, item.minStock),
      updatedAt: moment(item.updatedAt).format("YYYY-MM-DD HH:mm:ss"),
    }));

    res.status(200).json({
      success: true,
      inventory: transformedInventory,
      totalPages: Math.ceil(count / (parseInt(take) || 10)),
      currentPage: parseInt(skip) || 1,
      totalItems: count
    });
  } catch (error) {
    console.error("❌ Error in getAllInventory controller:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch inventory",
    });
  }
}

/**
 * Get inventory by product ID
 * GET /api/inventory/product/:productId
 */
async function getInventoryByProductId(req, res) {
  try {
    const { productId } = req.params;
    
    const inventory = await inventoryService.getInventoryByProductId(productId);
    
    if (!inventory) {
      return res.status(404).json({
        success: false,
        message: "Inventory record not found for this product"
      });
    }

    const transformedInventory = {
      id: inventory.id,
      productId: inventory.productId,
      productName: inventory.product.name,
      productCode: inventory.product.productCode,
      category: inventory.product.category,
      quantity: inventory.quantity,
      minStock: inventory.minStock,
      maxStock: inventory.maxStock,
      location: inventory.location,
      status: getStockStatus(inventory.quantity, inventory.minStock),
      updatedAt: moment(inventory.updatedAt).format("YYYY-MM-DD HH:mm:ss"),
    };

    res.status(200).json({
      success: true,
      data: transformedInventory
    });
  } catch (error) {
    console.error("❌ Error in getInventoryByProductId controller:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch inventory"
    });
  }
}

/**
 * Create or update inventory
 * POST /api/inventory
 * PUT /api/inventory/:productId
 */
async function upsertInventory(req, res) {
  try {
    const { productId, quantity, minStock, maxStock, location } = req.body;
    const { role: userRole, id: userId } = req.user;

    // Role-based validation - Only certain roles can manage inventory
    const allowedRoles = ['MACSOFT_ADMIN', 'MACSOFT_HEAD', 'SERVICE_CENTER_HEAD'];
    if (!allowedRoles.includes(userRole.toUpperCase())) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Only ADMIN, HEAD, and SERVICE_CENTER_HEAD can manage inventory. Your role: ${userRole}`
      });
    }

    // Validate required fields
    if (!productId || quantity === undefined) {
      return res.status(400).json({
        success: false,
        message: "Product ID and quantity are required"
      });
    }

    if (quantity < 0 || minStock < 0) {
      return res.status(400).json({
        success: false,
        message: "Quantity and minimum stock cannot be negative"
      });
    }

    const inventory = await inventoryService.upsertInventory({
      productId,
      quantity,
      minStock: minStock || 0,
      maxStock,
      location
    });

    // Emit socket event for real-time updates
    if (req.io) {
      req.io.emit("inventory-updated", {
        productId: inventory.productId,
        quantity: inventory.quantity,
        updatedBy: userId,
        timestamp: new Date().toISOString()
      });
    }

    res.status(200).json({
      success: true,
      message: "Inventory updated successfully",
      data: {
        id: inventory.id,
        productId: inventory.productId,
        productName: inventory.product.name,
        quantity: inventory.quantity,
        minStock: inventory.minStock,
        maxStock: inventory.maxStock,
        location: inventory.location,
        status: getStockStatus(inventory.quantity, inventory.minStock)
      }
    });
  } catch (error) {
    console.error("❌ Error in upsertInventory controller:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to update inventory"
    });
  }
}

/**
 * Check stock availability for spare request items
 * POST /api/inventory/check-availability
 */
async function checkStockAvailability(req, res) {
  try {
    const { items } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Items array is required"
      });
    }

    const stockCheck = await inventoryService.checkStockAvailability(items);

    res.status(200).json({
      success: true,
      data: stockCheck
    });
  } catch (error) {
    console.error("❌ Error in checkStockAvailability controller:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to check stock availability"
    });
  }
}

/**
 * Process inbound activity (add inventory)
 * POST /api/inventory/inbound
 */
async function processInboundActivity(req, res) {
  try {
    const { items, notes } = req.body;
    const { role: userRole, id: userId } = req.user;

    // Role-based validation
    const allowedRoles = ['MACSOFT_ADMIN', 'MACSOFT_HEAD', 'SERVICE_CENTER_HEAD'];
    if (!allowedRoles.includes(userRole.toUpperCase())) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Only ADMIN, HEAD, and SERVICE_CENTER_HEAD can process inbound activities. Your role: ${userRole}`
      });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Items array is required"
      });
    }

    // Validate items
    for (const item of items) {
      if (!item.productId || !item.quantity || item.quantity <= 0) {
        return res.status(400).json({
          success: false,
          message: "Each item must have productId and positive quantity"
        });
      }
    }

    const results = await inventoryService.addInventory(items, notes, userId);

    // Emit socket event for real-time updates
    if (req.io) {
      req.io.emit("inventory-inbound", {
        items: results.map(r => ({
          productId: r.productId,
          productName: r.product.name,
          addedQuantity: r.addedQuantity,
          newQuantity: r.newQuantity
        })),
        updatedBy: userId,
        timestamp: new Date().toISOString()
      });
    }

    res.status(200).json({
      success: true,
      message: `Successfully processed inbound activity for ${results.length} items`,
      data: results
    });
  } catch (error) {
    console.error("❌ Error in processInboundActivity controller:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to process inbound activity"
    });
  }
}

/**
 * Get low stock items
 * GET /api/inventory/low-stock
 */
async function getLowStockItems(req, res) {
  try {
    const lowStockItems = await inventoryService.getLowStockItems();

    const transformedItems = lowStockItems.map((item) => ({
      id: item.id,
      productId: item.productId,
      productName: item.product.name,
      productCode: item.product.productCode,
      category: item.product.category,
      brandName: item.product.brandName,
      quantity: item.quantity,
      minStock: item.minStock,
      location: item.location,
      deficit: Math.max(0, item.minStock - item.quantity),
      updatedAt: moment(item.updatedAt).format("YYYY-MM-DD HH:mm:ss"),
    }));

    res.status(200).json({
      success: true,
      data: transformedItems,
      count: transformedItems.length
    });
  } catch (error) {
    console.error("❌ Error in getLowStockItems controller:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch low stock items"
    });
  }
}

/**
 * Get inventory transaction history
 * GET /api/inventory/transactions
 * GET /api/inventory/product/:productId/transactions
 */
async function getInventoryTransactionHistory(req, res) {
  try {
    const { productId } = req.params;
    const { limit } = req.query;

    const transactions = await inventoryService.getInventoryTransactionHistory(
      productId,
      limit ? parseInt(limit) : 50
    );

    const transformedTransactions = transactions.map((transaction) => ({
      id: transaction.id,
      productId: transaction.productId,
      productName: transaction.product.name,
      productCode: transaction.product.productCode,
      type: transaction.type,
      quantity: transaction.quantity,
      ticketCode: transaction.ticket?.ticketCode || null,
      notes: transaction.notes,
      createdBy: transaction.createdByUser.name,
      createdByRole: transaction.createdByUser.role,
      createdAt: moment(transaction.createdAt).format("YYYY-MM-DD HH:mm:ss"),
    }));

    res.status(200).json({
      success: true,
      data: transformedTransactions,
      count: transformedTransactions.length
    });
  } catch (error) {
    console.error("❌ Error in getInventoryTransactionHistory controller:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch transaction history"
    });
  }
}

/**
 * Delete inventory record
 * DELETE /api/inventory/:productId
 */
async function deleteInventory(req, res) {
  try {
    const { productId } = req.params;
    const { role: userRole } = req.user;

    // Role-based validation - Only ADMIN can delete inventory records
    if (userRole.toUpperCase() !== 'MACSOFT_ADMIN') {
      return res.status(403).json({
        success: false,
        message: `Access denied. Only MACSOFT_ADMIN can delete inventory records. Your role: ${userRole}`
      });
    }

    await inventoryService.deleteInventory(productId);

    res.status(200).json({
      success: true,
      message: "Inventory record deleted successfully"
    });
  } catch (error) {
    console.error("❌ Error in deleteInventory controller:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to delete inventory record"
    });
  }
}

/**
 * Helper function to determine stock status
 */
function getStockStatus(quantity, minStock) {
  if (quantity === 0) {
    return 'OUT_OF_STOCK';
  } else if (quantity <= minStock) {
    return 'LOW_STOCK';
  } else {
    return 'IN_STOCK';
  }
}

module.exports = {
  getAllInventory,
  getInventoryByProductId,
  upsertInventory,
  checkStockAvailability,
  processInboundActivity,
  getLowStockItems,
  getInventoryTransactionHistory,
  deleteInventory
};