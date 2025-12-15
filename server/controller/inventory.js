const inventoryService = require("../service/inventory");
const moment = require("moment");

/**
 * Get all inventory records
 * GET /api/inventory
 * - MACSOFT roles can see all inventory from all centers (can filter by centerCode)
 * - Service center users can only see their own inventory
 */
async function getAllInventory(req, res) {
  try {
    const { skip, take, filter, centerCode, condition, category } = req.query;
    const { role: userRole, centerCode: userCenterCode } = req.user;

    // Determine which centerCode to use based on user role
    let effectiveCenterCode = null;
    const macsoftRoles = ['MACSOFT_ADMIN', 'MACSOFT_HEAD', 'MACSOFT_SUPPORT'];

    if (macsoftRoles.includes(userRole?.toUpperCase())) {
      // MACSOFT users can filter by centerCode or see all
      effectiveCenterCode = centerCode || null;
    } else {
      // Service center users can only see their own inventory
      effectiveCenterCode = userCenterCode;
    }

    const { inventory, count } = await inventoryService.getAllInventory(
      skip,
      take,
      filter,
      effectiveCenterCode,
      condition,
      category
    );

    // Transform inventory data for response
    const transformedInventory = inventory.map((item) => ({
      id: item.id,
      productId: item.productId,
      productName: item.product.name,
      productCode: item.product.productCode,
      category: item.product.category,
      brandName: item.product.brandName,
      condition: item.condition,
      quantity: item.quantity,
      minStock: item.minStock,
      maxStock: item.maxStock,
      location: item.location,
      centerCode: item.centerCode,
      centerName: item.serviceCenter?.name || item.centerCode,
      status: getStockStatus(item.quantity, item.minStock),
      updatedAt: moment(item.updatedAt).format("YYYY-MM-DD HH:mm:ss"),
    }));

    res.status(200).json({
      success: true,
      inventory: transformedInventory,
      count: count,
      totalPages: Math.ceil(count / (parseInt(take) || 10)),
      currentPage: parseInt(skip) + 1, // Convert 0-based to 1-based for consistency
      totalItems: count
    });
  } catch (error) {
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
    const { role: userRole, centerCode: userCenterCode } = req.user;

    const macsoftRoles = ['MACSOFT_ADMIN', 'MACSOFT_HEAD', 'MACSOFT_SUPPORT'];
    const effectiveCenterCode = macsoftRoles.includes(userRole?.toUpperCase()) ? null : userCenterCode;

    const inventory = await inventoryService.getInventoryByProductId(productId, effectiveCenterCode);

    if (!inventory || inventory.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Inventory record not found for this product"
      });
    }

    res.status(200).json({
      success: true,
      data: inventory
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch inventory"
    });
  }
}

/**
 * Create or update inventory
 * POST /api/inventory
 * PUT /api/inventory
 * - MACSOFT roles can update any center's inventory
 * - Service center users can only update their own inventory
 */
async function upsertInventory(req, res) {
  try {
    const { productId, centerCode, condition, quantity, minStock, maxStock, location } = req.body;
    const { role: userRole, id: userId, centerCode: userCenterCode } = req.user;

    // Role-based validation
    const macsoftRoles = ['MACSOFT_ADMIN', 'MACSOFT_HEAD', 'MACSOFT_SUPPORT'];
    const serviceCenterRoles = ['SERVICE_CENTER_TECHNICIAN', 'CUSTOMER_SERVICE_HEAD'];
    const allowedRoles = [...macsoftRoles, ...serviceCenterRoles];

    if (!allowedRoles.includes(userRole?.toUpperCase())) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Your role: ${userRole}`
      });
    }

    // Validate required fields
    if (!productId || quantity === undefined || !condition) {
      return res.status(400).json({
        success: false,
        message: "Product ID, condition, and quantity are required"
      });
    }

    const parsedQuantity = parseInt(quantity);
    const parsedMinStock = parseInt(minStock) || 0;
    const parsedMaxStock = maxStock ? parseInt(maxStock) : null;

    if (parsedQuantity < 0) {
      return res.status(400).json({
        success: false,
        message: "Quantity cannot be negative"
      });
    }

    // Validate condition
    const validConditions = ['GOOD', 'DEFECTIVE', 'REPAIRABLE', 'SCRAP'];
    if (!validConditions.includes(condition)) {
      return res.status(400).json({
        success: false,
        message: "Invalid condition. Must be GOOD, DEFECTIVE, REPAIRABLE, or SCRAP"
      });
    }

    // Determine centerCode - MACSOFT can specify, service center users use their own
    let effectiveCenterCode;
    if (macsoftRoles.includes(userRole?.toUpperCase())) {
      effectiveCenterCode = centerCode;
    } else {
      // Service center users can only modify their own inventory
      if (centerCode && centerCode !== userCenterCode) {
        return res.status(403).json({
          success: false,
          message: "You can only modify inventory for your own service center"
        });
      }
      effectiveCenterCode = userCenterCode;
    }

    if (!effectiveCenterCode) {
      return res.status(400).json({
        success: false,
        message: "Service center code is required"
      });
    }

    const inventory = await inventoryService.upsertInventory({
      productId: parseInt(productId),
      centerCode: effectiveCenterCode,
      condition,
      quantity: parsedQuantity,
      minStock: parsedMinStock,
      maxStock: parsedMaxStock,
      location
    });

    // Emit socket event for real-time updates
    if (req.io) {
      req.io.emit("inventory-updated", {
        productId: inventory.productId,
        centerCode: inventory.centerCode,
        condition: inventory.condition,
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
        centerCode: inventory.centerCode,
        condition: inventory.condition,
        quantity: inventory.quantity,
        minStock: inventory.minStock,
        maxStock: inventory.maxStock,
        location: inventory.location,
        status: getStockStatus(inventory.quantity, inventory.minStock || 0)
      }
    });
  } catch (error) {
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
    res.status(500).json({
      success: false,
      message: error.message || "Failed to check stock availability"
    });
  }
}

/**
 * Process inbound activity (add inventory)
 * POST /api/inventory/inbound
 * - MACSOFT roles can add to any center
 * - Service center users can only add to their own center
 */
async function processInboundActivity(req, res) {
  try {
    const { items, notes } = req.body;
    const { role: userRole, id: userId, centerCode: userCenterCode } = req.user;

    // Role-based validation
    const macsoftRoles = ['MACSOFT_ADMIN', 'MACSOFT_HEAD', 'MACSOFT_SUPPORT'];
    const serviceCenterRoles = ['SERVICE_CENTER_TECHNICIAN', 'CUSTOMER_SERVICE_HEAD'];
    const allowedRoles = [...macsoftRoles, ...serviceCenterRoles];

    if (!allowedRoles.includes(userRole?.toUpperCase())) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Your role: ${userRole}`
      });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Items array is required"
      });
    }

    // Validate and set centerCode for items
    const processedItems = [];
    for (const item of items) {
      if (!item.productId || !item.quantity || item.quantity <= 0) {
        return res.status(400).json({
          success: false,
          message: "Each item must have productId and positive quantity"
        });
      }

      let effectiveCenterCode;
      if (macsoftRoles.includes(userRole?.toUpperCase())) {
        effectiveCenterCode = item.centerCode;
      } else {
        // Service center users can only add to their own center
        if (item.centerCode && item.centerCode !== userCenterCode) {
          return res.status(403).json({
            success: false,
            message: "You can only add inventory to your own service center"
          });
        }
        effectiveCenterCode = userCenterCode;
      }

      if (!effectiveCenterCode) {
        return res.status(400).json({
          success: false,
          message: "Service center code is required for each item"
        });
      }

      processedItems.push({
        ...item,
        centerCode: effectiveCenterCode,
      });
    }

    const results = await inventoryService.addInventory(processedItems, notes, userId);

    // Emit socket event for real-time updates
    if (req.io) {
      req.io.emit("inventory-inbound", {
        items: results.map(r => ({
          productId: r.productId,
          productName: r.product.name,
          condition: r.condition,
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
    res.status(500).json({
      success: false,
      message: error.message || "Failed to process inbound activity"
    });
  }
}

/**
 * Process outbound activity (deduct inventory)
 * POST /api/inventory/outbound
 * - MACSOFT roles can deduct from any center
 * - Service center users can only deduct from their own center
 */
async function processOutboundActivity(req, res) {
  try {
    const { items, notes } = req.body;
    const { role: userRole, id: userId, centerCode: userCenterCode } = req.user;

    // Role-based validation
    const macsoftRoles = ['MACSOFT_ADMIN', 'MACSOFT_HEAD', 'MACSOFT_SUPPORT'];
    const serviceCenterRoles = ['SERVICE_CENTER_TECHNICIAN', 'CUSTOMER_SERVICE_HEAD'];
    const allowedRoles = [...macsoftRoles, ...serviceCenterRoles];

    if (!allowedRoles.includes(userRole?.toUpperCase())) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Your role: ${userRole}`
      });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Items array is required"
      });
    }

    // Validate and set centerCode for items
    const processedItems = [];
    for (const item of items) {
      if (!item.productId || !item.quantity || item.quantity <= 0) {
        return res.status(400).json({
          success: false,
          message: "Each item must have productId and positive quantity"
        });
      }

      let effectiveCenterCode;
      if (macsoftRoles.includes(userRole?.toUpperCase())) {
        effectiveCenterCode = item.centerCode;
      } else {
        // Service center users can only deduct from their own center
        if (item.centerCode && item.centerCode !== userCenterCode) {
          return res.status(403).json({
            success: false,
            message: "You can only deduct inventory from your own service center"
          });
        }
        effectiveCenterCode = userCenterCode;
      }

      if (!effectiveCenterCode) {
        return res.status(400).json({
          success: false,
          message: "Service center code is required for each item"
        });
      }

      processedItems.push({
        ...item,
        centerCode: effectiveCenterCode,
      });
    }

    const results = await inventoryService.deductInventory(processedItems, null, userId);

    // Emit socket event for real-time updates
    if (req.io) {
      req.io.emit("inventory-outbound", {
        items: results.map(r => ({
          productId: r.productId,
          productName: r.product.name,
          condition: r.condition,
          deductedQuantity: r.deductedQuantity,
          newQuantity: r.newQuantity
        })),
        updatedBy: userId,
        timestamp: new Date().toISOString()
      });
    }

    res.status(200).json({
      success: true,
      message: `Successfully processed outbound activity for ${results.length} items`,
      data: results
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to process outbound activity"
    });
  }
}

/**
 * Adjust inventory (MACSOFT only - for corrections)
 * POST /api/inventory/adjust
 */
async function adjustInventory(req, res) {
  try {
    const { productId, centerCode, condition, adjustmentType, quantity, reason } = req.body;
    const { role: userRole, id: userId } = req.user;

    // Only MACSOFT roles can make adjustments
    const macsoftRoles = ['MACSOFT_ADMIN', 'MACSOFT_HEAD'];
    if (!macsoftRoles.includes(userRole?.toUpperCase())) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Only MACSOFT_ADMIN and MACSOFT_HEAD can make inventory adjustments. Your role: ${userRole}`
      });
    }

    // Validate required fields
    if (!productId || !centerCode || !condition || !adjustmentType || quantity === undefined) {
      return res.status(400).json({
        success: false,
        message: "productId, centerCode, condition, adjustmentType, and quantity are required"
      });
    }

    // Validate adjustmentType
    const validAdjustmentTypes = ['ADD', 'SUBTRACT', 'SET'];
    if (!validAdjustmentTypes.includes(adjustmentType)) {
      return res.status(400).json({
        success: false,
        message: "adjustmentType must be ADD, SUBTRACT, or SET"
      });
    }

    // Validate condition
    const validConditions = ['GOOD', 'DEFECTIVE', 'REPAIRABLE', 'SCRAP'];
    if (!validConditions.includes(condition)) {
      return res.status(400).json({
        success: false,
        message: "Invalid condition. Must be GOOD, DEFECTIVE, REPAIRABLE, or SCRAP"
      });
    }

    const result = await inventoryService.adjustInventory({
      productId,
      centerCode,
      condition,
      adjustmentType,
      quantity: parseInt(quantity),
      reason
    }, userId);

    // Emit socket event for real-time updates
    if (req.io) {
      req.io.emit("inventory-adjusted", {
        productId: result.productId,
        centerCode: result.centerCode,
        condition: result.condition,
        adjustmentType: result.adjustmentType,
        previousQuantity: result.previousQuantity,
        newQuantity: result.newQuantity,
        updatedBy: userId,
        timestamp: new Date().toISOString()
      });
    }

    res.status(200).json({
      success: true,
      message: "Inventory adjusted successfully",
      data: {
        productId: result.productId,
        productName: result.product.name,
        centerCode: result.centerCode,
        condition: result.condition,
        adjustmentType: result.adjustmentType,
        previousQuantity: result.previousQuantity,
        newQuantity: result.newQuantity,
        adjustedQuantity: result.adjustedQuantity
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to adjust inventory"
    });
  }
}

/**
 * Get low stock items
 * GET /api/inventory/low-stock
 */
async function getLowStockItems(req, res) {
  try {
    const { role: userRole, centerCode: userCenterCode } = req.user;

    const macsoftRoles = ['MACSOFT_ADMIN', 'MACSOFT_HEAD', 'MACSOFT_SUPPORT'];
    const effectiveCenterCode = macsoftRoles.includes(userRole?.toUpperCase()) ? null : userCenterCode;

    const lowStockItems = await inventoryService.getLowStockItems(effectiveCenterCode);

    const transformedItems = lowStockItems.map((item) => ({
      id: item.id,
      productId: item.productId,
      productName: item.product.name,
      productCode: item.product.productCode,
      category: item.product.category,
      brandName: item.product.brandName,
      centerCode: item.centerCode,
      centerName: item.serviceCenter?.name || item.centerCode,
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
    const { limit, centerCode } = req.query;
    const { role: userRole, centerCode: userCenterCode } = req.user;

    const macsoftRoles = ['MACSOFT_ADMIN', 'MACSOFT_HEAD', 'MACSOFT_SUPPORT'];
    const effectiveCenterCode = macsoftRoles.includes(userRole?.toUpperCase())
      ? (centerCode || null)
      : userCenterCode;

    const transactions = await inventoryService.getInventoryTransactionHistory(
      productId,
      effectiveCenterCode,
      limit ? parseInt(limit) : 50
    );

    const transformedTransactions = transactions.map((transaction) => ({
      id: transaction.id,
      transactionType: transaction.transactionType,
      centerCode: transaction.centerCode,
      centerName: transaction.serviceCenter?.name || transaction.centerCode,
      items: transaction.items.map(item => ({
        productId: item.productId,
        productName: item.product?.name,
        productCode: item.product?.productCode,
        condition: item.condition,
        quantity: item.quantity,
      })),
      ticketCode: transaction.ticket?.ticketCode || null,
      remarks: transaction.remarks,
      invoiceNo: transaction.invoiceNo,
      billNo: transaction.billNo,
      createdBy: transaction.createdByUser?.name,
      createdByRole: transaction.createdByUser?.role,
      createdAt: moment(transaction.createdAt).format("YYYY-MM-DD HH:mm:ss"),
    }));

    res.status(200).json({
      success: true,
      data: transformedTransactions,
      count: transformedTransactions.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch transaction history"
    });
  }
}

/**
 * Get inventory summary
 * GET /api/inventory/summary
 */
async function getInventorySummary(req, res) {
  try {
    const { centerCode } = req.query;
    const { role: userRole, centerCode: userCenterCode } = req.user;

    const macsoftRoles = ['MACSOFT_ADMIN', 'MACSOFT_HEAD', 'MACSOFT_SUPPORT'];
    const effectiveCenterCode = macsoftRoles.includes(userRole?.toUpperCase())
      ? (centerCode || null)
      : userCenterCode;

    const summary = await inventoryService.getInventorySummary(effectiveCenterCode);

    res.status(200).json({
      success: true,
      data: summary
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch inventory summary"
    });
  }
}

/**
 * Bulk import inventory from JSON data
 * POST /api/inventory/bulk-import
 * - MACSOFT roles can import to any center
 * - Service center users can only import to their own center
 */
async function bulkImportInventory(req, res) {
  try {
    const { items } = req.body;
    const { role: userRole, id: userId, centerCode: userCenterCode } = req.user;

    // Role-based validation
    const macsoftRoles = ['MACSOFT_ADMIN', 'MACSOFT_HEAD'];
    const serviceCenterRoles = ['SERVICE_CENTER_TECHNICIAN', 'CUSTOMER_SERVICE_HEAD'];
    const allowedRoles = [...macsoftRoles, ...serviceCenterRoles];

    if (!allowedRoles.includes(userRole?.toUpperCase())) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Your role: ${userRole}`
      });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Items array is required and must not be empty"
      });
    }

    const errors = [];
    const successes = [];
    const validConditions = ['GOOD', 'DEFECTIVE', 'REPAIRABLE', 'SCRAP'];

    // Validate each item
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const rowErrors = [];

      // Required field validations
      if (!item.productId || !Number.isInteger(Number(item.productId))) {
        rowErrors.push('productId must be a valid number');
      }

      // Service center users can only import to their own center
      if (!macsoftRoles.includes(userRole?.toUpperCase())) {
        if (item.centerCode && item.centerCode !== userCenterCode) {
          rowErrors.push('You can only import inventory to your own service center');
        }
        item.centerCode = userCenterCode;
      }

      if (!item.centerCode || typeof item.centerCode !== 'string') {
        rowErrors.push('centerCode is required and must be a string');
      }
      if (!item.condition || !validConditions.includes(item.condition)) {
        rowErrors.push(`condition must be one of: ${validConditions.join(', ')}`);
      }
      if (item.quantity === undefined || item.quantity < 0 || !Number.isInteger(Number(item.quantity))) {
        rowErrors.push('quantity must be a non-negative integer');
      }
      if (item.minStock !== undefined && (item.minStock < 0 || !Number.isInteger(Number(item.minStock)))) {
        rowErrors.push('minStock must be a non-negative integer');
      }
      if (item.maxStock !== undefined && item.maxStock !== null && (item.maxStock < 0 || !Number.isInteger(Number(item.maxStock)))) {
        rowErrors.push('maxStock must be a non-negative integer or null');
      }

      if (rowErrors.length > 0) {
        errors.push({
          row: i + 1,
          message: rowErrors.join(', '),
          data: item
        });
      }
    }

    // If there are validation errors, return them
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Validation failed for ${errors.length} items`,
        errors
      });
    }

    // Process valid items
    for (let i = 0; i < items.length; i++) {
      const item = items[i];

      try {
        const inventory = await inventoryService.upsertInventory({
          productId: parseInt(item.productId),
          centerCode: item.centerCode,
          condition: item.condition,
          quantity: parseInt(item.quantity),
          minStock: parseInt(item.minStock) || 0,
          maxStock: item.maxStock ? parseInt(item.maxStock) : null,
          location: item.location || null
        });

        successes.push({
          row: i + 1,
          productId: item.productId,
          centerCode: item.centerCode,
          condition: item.condition,
          quantity: item.quantity
        });
      } catch (error) {
        errors.push({
          row: i + 1,
          message: error.message || 'Failed to save inventory record',
          data: item
        });
      }
    }

    // Emit socket event for real-time updates
    if (req.io && successes.length > 0) {
      req.io.emit("inventory-bulk-imported", {
        imported: successes.length,
        updatedBy: userId,
        timestamp: new Date().toISOString()
      });
    }

    res.status(200).json({
      success: true,
      message: `Bulk import completed. ${successes.length} records imported successfully.`,
      imported: successes.length,
      failed: errors.length,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('Bulk import error:', error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to process bulk import"
    });
  }
}

/**
 * Delete inventory record
 * DELETE /api/inventory/:id
 */
async function deleteInventory(req, res) {
  try {
    const { id } = req.params;
    const { role: userRole } = req.user;

    // Role-based validation - Only ADMIN can delete inventory records
    if (userRole?.toUpperCase() !== 'MACSOFT_ADMIN') {
      return res.status(403).json({
        success: false,
        message: `Access denied. Only MACSOFT_ADMIN can delete inventory records. Your role: ${userRole}`
      });
    }

    // First get the inventory record to get the required fields
    const inventoryRecord = await inventoryService.getInventoryById(parseInt(id));

    if (!inventoryRecord) {
      return res.status(404).json({
        success: false,
        message: "Inventory record not found"
      });
    }

    await inventoryService.deleteInventory(
      inventoryRecord.productId,
      inventoryRecord.centerCode
    );

    res.status(200).json({
      success: true,
      message: "Inventory record deleted successfully"
    });
  } catch (error) {
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

/**
 * Process a complete inventory transaction (ProductTransaction + ProductTransactionItem)
 * POST /api/inventory/transaction
 * Creates a ProductTransaction with related ProductTransactionItems
 * - MACSOFT roles can process for any center
 * - Service center users can only process for their own center
 */
async function processTransaction(req, res) {
  try {
    const { 
      transactionType, 
      centerCode, 
      invoiceNo, 
      billNo, 
      receiptDate, 
      deliveryDate, 
      ticketId, 
      remarks, 
      items 
    } = req.body;
    
    const { role: userRole, id: userId, centerCode: userCenterCode } = req.user;

    // Role-based validation
    const macsoftRoles = ['MACSOFT_ADMIN', 'MACSOFT_HEAD', 'MACSOFT_SUPPORT'];
    const serviceCenterRoles = ['SERVICE_CENTER_TECHNICIAN', 'CUSTOMER_SERVICE_HEAD'];
    const allowedRoles = [...macsoftRoles, ...serviceCenterRoles];

    if (!allowedRoles.includes(userRole?.toUpperCase())) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Your role: ${userRole}`
      });
    }

    // Validate required fields
    if (!transactionType || !['RECEIPT', 'DELIVERY'].includes(transactionType)) {
      return res.status(400).json({
        success: false,
        message: "Valid transaction type (RECEIPT or DELIVERY) is required"
      });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one item is required"
      });
    }

    // Validate each item
    for (const item of items) {
      if (!item.productId || !item.quantity || item.quantity <= 0) {
        return res.status(400).json({
          success: false,
          message: "Each item must have productId and positive quantity"
        });
      }
      if (!item.condition || !['GOOD', 'DEFECTIVE', 'REPAIRABLE', 'SCRAP'].includes(item.condition)) {
        return res.status(400).json({
          success: false,
          message: "Each item must have a valid condition (GOOD, DEFECTIVE, REPAIRABLE, SCRAP)"
        });
      }
    }

    // Determine centerCode - MACSOFT can specify, service center users use their own
    let effectiveCenterCode;
    if (macsoftRoles.includes(userRole?.toUpperCase())) {
      effectiveCenterCode = centerCode;
    } else {
      // Service center users can only process for their own center
      if (centerCode && centerCode !== userCenterCode) {
        return res.status(403).json({
          success: false,
          message: "You can only process transactions for your own service center"
        });
      }
      effectiveCenterCode = userCenterCode;
    }

    if (!effectiveCenterCode) {
      return res.status(400).json({
        success: false,
        message: "Service center code is required"
      });
    }

    // Process the transaction
    const result = await inventoryService.createProductTransaction({
      transactionType,
      centerCode: effectiveCenterCode,
      invoiceNo: invoiceNo || null,
      billNo: billNo || null,
      receiptDate: receiptDate ? new Date(receiptDate) : null,
      deliveryDate: deliveryDate ? new Date(deliveryDate) : null,
      ticketId: ticketId ? parseInt(ticketId) : null,
      remarks: remarks || null,
      createdBy: userId,
      items: items.map(item => ({
        productId: parseInt(item.productId),
        condition: item.condition,
        quantity: parseInt(item.quantity)
      }))
    });

    // Emit socket event for real-time updates
    if (req.io) {
      req.io.emit("inventory-transaction", {
        transactionId: result.transaction.id,
        transactionType,
        centerCode: effectiveCenterCode,
        itemCount: items.length,
        totalQuantity: items.reduce((sum, item) => sum + item.quantity, 0),
        updatedBy: userId,
        timestamp: new Date().toISOString()
      });
    }

    res.status(200).json({
      success: true,
      message: `Transaction processed successfully. ${items.length} item(s) ${transactionType === 'RECEIPT' ? 'received' : 'delivered'}.`,
      data: result
    });
  } catch (error) {
    console.error('Transaction error:', error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to process transaction"
    });
  }
}

module.exports = {
  getAllInventory,
  getInventoryByProductId,
  upsertInventory,
  checkStockAvailability,
  processInboundActivity,
  processOutboundActivity,
  adjustInventory,
  bulkImportInventory,
  getLowStockItems,
  getInventoryTransactionHistory,
  getInventorySummary,
  deleteInventory,
  processTransaction
};
