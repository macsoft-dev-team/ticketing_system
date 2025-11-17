const inboundActivityService = require("../service/inboundActivity");
const moment = require("moment");

/**
 * Create inbound activity
 * POST /api/inbound-activities
 */
async function createInboundActivity(req, res) {
  try {
    const { items, supplier, reference, notes } = req.body;
    const { role: userRole, id: userId } = req.user;

    // Role-based validation
    const allowedRoles = ['MACSOFT_ADMIN', 'MACSOFT_HEAD'];
    if (!allowedRoles.includes(userRole.toUpperCase())) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Only ADMIN and HEAD can create inbound activities. Your role: ${userRole}`
      });
    }

    // Validate required fields
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Items array is required and cannot be empty"
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
    }

    const result = await inboundActivityService.createInboundActivity({
      items,
      supplier: supplier || null,
      reference: reference || null,
      notes: notes || null,
      createdBy: userId
    });

    // Emit socket event for real-time updates
    if (req.io) {
      req.io.emit("inbound-activity-created", {
        processedItems: result.processedItems,
        supplier: result.supplier,
        reference: result.reference,
        createdBy: userId,
        timestamp: new Date().toISOString()
      });
    }

    res.status(201).json({
      success: true,
      message: `Inbound activity created successfully. ${result.processedItems} items processed.`,
      data: result
    });
  } catch (error) {
    console.error("❌ Error in createInboundActivity controller:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to create inbound activity"
    });
  }
}

/**
 * Get inbound activity history
 * GET /api/inbound-activities
 */
async function getInboundActivityHistory(req, res) {
  try {
    const { productId, startDate, endDate, limit, skip } = req.query;

    const options = {
      productId: productId ? parseInt(productId) : null,
      startDate: startDate || null,
      endDate: endDate || null,
      limit: limit ? parseInt(limit) : 50,
      skip: skip ? parseInt(skip) : 0
    };

    const result = await inboundActivityService.getInboundActivityHistory(options);

    // Transform transactions for response
    const transformedTransactions = result.transactions.map(transaction => ({
      id: transaction.id,
      productId: transaction.productId,
      productName: transaction.product.name,
      productCode: transaction.product.productCode,
      category: transaction.product.category,
      brandName: transaction.product.brandName,
      quantity: transaction.quantity,
      notes: transaction.notes,
      createdBy: transaction.createdByUser.name,
      createdByRole: transaction.createdByUser.role,
      createdAt: moment(transaction.createdAt).format("YYYY-MM-DD HH:mm:ss")
    }));

    res.status(200).json({
      success: true,
      data: transformedTransactions,
      pagination: {
        currentPage: result.currentPage,
        totalPages: result.totalPages,
        totalItems: result.count,
        limit: options.limit
      }
    });
  } catch (error) {
    console.error("❌ Error in getInboundActivityHistory controller:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch inbound activity history"
    });
  }
}

/**
 * Process bulk inbound activity
 * POST /api/inbound-activities/bulk
 */
async function processBulkInboundActivity(req, res) {
  try {
    const { items, supplier, reference, notes } = req.body;
    const { role: userRole, id: userId } = req.user;

    // Role-based validation
    const allowedRoles = ['MACSOFT_ADMIN', 'MACSOFT_HEAD'];
    if (!allowedRoles.includes(userRole.toUpperCase())) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Only ADMIN and HEAD can process bulk inbound activities. Your role: ${userRole}`
      });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Items array is required and cannot be empty"
      });
    }

    const result = await inboundActivityService.processBulkInboundActivity({
      items,
      supplier,
      reference,
      notes,
      createdBy: userId
    });

    // Emit socket event for real-time updates
    if (req.io) {
      req.io.emit("bulk-inbound-activity-created", {
        processedItems: result.processedItems,
        supplier: result.supplier,
        reference: result.reference,
        createdBy: userId,
        timestamp: new Date().toISOString()
      });
    }

    res.status(201).json({
      success: true,
      message: `Bulk inbound activity processed successfully. ${result.processedItems} items processed.`,
      data: result
    });
  } catch (error) {
    console.error("❌ Error in processBulkInboundActivity controller:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to process bulk inbound activity"
    });
  }
}

/**
 * Get inbound activity summary
 * GET /api/inbound-activities/summary
 */
async function getInboundActivitySummary(req, res) {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "Both startDate and endDate are required for summary"
      });
    }

    const summary = await inboundActivityService.getInboundActivitySummary(startDate, endDate);

    const transformedSummary = summary.map(item => ({
      productId: item.productId,
      productName: item.product?.name || 'Unknown Product',
      productCode: item.product?.productCode || 'N/A',
      category: item.product?.category || 'N/A',
      totalQuantityReceived: item.totalQuantityReceived,
      transactionCount: item.transactionCount
    }));

    res.status(200).json({
      success: true,
      data: transformedSummary,
      period: {
        startDate,
        endDate
      },
      totalProducts: transformedSummary.length,
      totalQuantityReceived: transformedSummary.reduce((sum, item) => sum + item.totalQuantityReceived, 0),
      totalTransactions: transformedSummary.reduce((sum, item) => sum + item.transactionCount, 0)
    });
  } catch (error) {
    console.error("❌ Error in getInboundActivitySummary controller:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch inbound activity summary"
    });
  }
}

module.exports = {
  createInboundActivity,
  getInboundActivityHistory,
  processBulkInboundActivity,
  getInboundActivitySummary
};