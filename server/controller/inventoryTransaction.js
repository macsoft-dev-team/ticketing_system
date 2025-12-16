const inventoryTransactionService = require("../service/inventoryTransaction");
const { PrismaClient } = require("../prisma/generated/prisma/client");
const prisma = new PrismaClient();

/**
 * INVENTORY TRANSACTION CONTROLLERS
 * Handles all inventory transaction operations
 */

/**
 * 1. CREATE CUSTOMER RETURN TRANSACTION
 * Role: SERVICE_CENTER_TECHNICIAN
 * 
 * Customer returns a product to service center
 * ProductId is OPTIONAL - if unknown, store description
 */
exports.createReturnTransaction = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const userCenterCode = req.user.centerCode;

    // Validate role
    if (!["SERVICE_CENTER_TECHNICIAN", "CUSTOMER_SERVICE_HEAD", "MACSOFT_ADMIN", "MACSOFT_HEAD"].includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized to create return transactions",
      });
    }

    const { items, remarks } = req.body;

    // Validate items
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one item is required",
      });
    }

    // Validate each item
    for (const item of items) {
      if (!item.condition) {
        return res.status(400).json({
          success: false,
          message: "Condition is required for each item",
        });
      }
      if (!item.quantity || item.quantity <= 0) {
        return res.status(400).json({
          success: false,
          message: "Valid quantity is required for each item",
        });
      }
      // Either productId or productName must be provided
      if (!item.productId && !item.productName) {
        return res.status(400).json({
          success: false,
          message: "Either productId or productName must be provided",
        });
      }
    }

    // Create return transaction
    const transaction = await inventoryTransactionService.createTransaction(
      {
        transactionType: "RETURN",
        status: "RECEIVED",
        centerCode: userCenterCode,
        items,
        remarks,
      },
      userId
    );

    res.json({
      success: true,
      message: "Return transaction created successfully",
      transaction,
    });
  } catch (error) {
    console.error("❌ Create return transaction error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to create return transaction",
    });
  }
};

/**
 * 2. APPROVE SPARE REQUEST (AUTO INVENTORY DEDUCTION)
 * Role: CUSTOMER_SERVICE_HEAD / MACSOFT_HEAD
 * 
 * Approves spare request and automatically deducts inventory
 */
exports.approveSpareRequest = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const { spareRequestId, approvedItems } = req.body;

    // Validate role
    if (!["CUSTOMER_SERVICE_HEAD", "MACSOFT_HEAD", "MACSOFT_ADMIN"].includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized to approve spare requests",
      });
    }

    if (!spareRequestId) {
      return res.status(400).json({
        success: false,
        message: "Spare request ID is required",
      });
    }

    // Get spare request
    const spareRequest = await prisma.spareRequest.findUnique({
      where: { id: parseInt(spareRequestId) },
      include: {
        spareItems: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!spareRequest) {
      return res.status(404).json({
        success: false,
        message: "Spare request not found",
      });
    }

    // Get related ticket
    const ticket = await prisma.ticket.findUnique({
      where: { ticketCode: spareRequest.ticketCode },
      select: {
        id: true,
        ticketCode: true,
        assignedServiceCenter: true,
      },
    });

    if (!ticket || !ticket.assignedServiceCenter) {
      return res.status(400).json({
        success: false,
        message: "Ticket or assigned service center not found",
      });
    }

    // Prepare items for transaction (approved items only)
    const items = approvedItems || spareRequest.spareItems;
    const transactionItems = items.map((item) => ({
      productId: item.productId,
      condition: "GOOD", // Always deduct from GOOD stock
      quantity: item.quantity,
    }));

    // Check inventory availability
    for (const item of transactionItems) {
      const availability = await inventoryTransactionService.checkInventoryAvailability(
        ticket.assignedServiceCenter,
        item.productId,
        item.condition,
        item.quantity
      );

      if (!availability.available) {
        return res.status(400).json({
          success: false,
          message: `Insufficient inventory for product ${item.productId}. Available: ${availability.currentQuantity}, Required: ${availability.requiredQuantity}`,
        });
      }
    }

    // Create TICKET_ISSUE transaction
    const transaction = await inventoryTransactionService.createTransaction(
      {
        transactionType: "TICKET_ISSUE",
        status: "COMPLETED",
        centerCode: ticket.assignedServiceCenter,
        ticketId: ticket.id,
        items: transactionItems,
        remarks: `Spare request #${spareRequestId} approved`,
      },
      userId
    );

    // Update spare request status
    await prisma.spareRequest.update({
      where: { id: parseInt(spareRequestId) },
      data: {
        status: "APPROVED",
        updatedBy: userId,
      },
    });

    // Update spare request items status
    for (const item of items) {
      await prisma.spareRequestItem.update({
        where: { id: item.id },
        data: {
          status: "APPROVED",
        },
      });
    }

    res.json({
      success: true,
      message: "Spare request approved and inventory deducted",
      transaction,
    });
  } catch (error) {
    console.error("❌ Approve spare request error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to approve spare request",
    });
  }
};

/**
 * 3. DISPATCH TRANSFER (MACSOFT → SSC)
 * Role: MACSOFT_HEAD / MACSOFT_ADMIN
 * 
 * MACSOFT can transfer ALL conditions (GOOD, DEFECTIVE, REPAIRABLE, SCRAP)
 */
/**
 * 3. DISPATCH TRANSFER
 * MACSOFT Roles: Immediately dispatch transfer (inventory deducted)
 * SSC Roles: Create transfer request (pending MACSOFT approval)
 */
exports.dispatchTransfer = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const userCenterCode = req.user.centerCode;

    // Check if user can create transfers
    const isMacsoft = ["MACSOFT_HEAD", "MACSOFT_ADMIN"].includes(userRole);
    const isSSC = ["SERVICE_CENTER_TECHNICIAN", "CUSTOMER_SERVICE_HEAD"].includes(userRole);

    if (!isMacsoft && !isSSC) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized to create transfers",
      });
    }

    const { fromCenterCode, toCenterCode, items, remarks } = req.body;

    // For MACSOFT: can specify fromCenterCode or use their own
    // For SSC: must use their own center as source
    const sourceCenterCode = isMacsoft 
      ? (fromCenterCode || userCenterCode) 
      : userCenterCode;

    if (!sourceCenterCode) {
      return res.status(400).json({
        success: false,
        message: "Source service center is required",
      });
    }

    if (!toCenterCode) {
      return res.status(400).json({
        success: false,
        message: "Destination service center is required",
      });
    }

    if (sourceCenterCode === toCenterCode) {
      return res.status(400).json({
        success: false,
        message: "Source and destination centers cannot be the same",
      });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one item is required",
      });
    }

    // Validate destination center exists
    const destinationCenter = await prisma.serviceCenter.findUnique({
      where: { centerCode: toCenterCode },
    });

    if (!destinationCenter) {
      return res.status(404).json({
        success: false,
        message: "Destination service center not found",
      });
    }

    // Validate items
    for (const item of items) {
      if (!item.productId || !item.condition || !item.quantity) {
        return res.status(400).json({
          success: false,
          message: "ProductId, condition, and quantity are required for each item",
        });
      }

      // Check inventory availability
      const availability = await inventoryTransactionService.checkInventoryAvailability(
        sourceCenterCode,
        item.productId,
        item.condition,
        item.quantity
      );

      if (!availability.available) {
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
        });
        return res.status(400).json({
          success: false,
          message: `Insufficient ${item.condition} inventory for ${product?.name || "product"}. Available: ${availability.currentQuantity}, Required: ${availability.requiredQuantity}`,
        });
      }
    }

    // Determine status based on role
    // MACSOFT: PENDING (immediate dispatch, inventory deducted)
    // SSC: PENDING_APPROVAL (request, no inventory change yet)
    const status = isMacsoft ? "PENDING" : "PENDING_APPROVAL";

    // Create TRANSFER transaction
    const transaction = await inventoryTransactionService.createTransaction(
      {
        transactionType: "TRANSFER",
        status,
        fromCenterCode: sourceCenterCode,
        toCenterCode,
        items,
        remarks,
      },
      userId
    );

    const message = isMacsoft 
      ? "Transfer dispatched successfully" 
      : "Transfer request submitted for approval";

    res.json({
      success: true,
      message,
      transaction,
      requiresApproval: !isMacsoft,
    });
  } catch (error) {
    console.error("❌ Dispatch transfer error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to dispatch transfer",
    });
  }
};

/**
 * 4. RECEIVE TRANSFER
 * Role: CUSTOMER_SERVICE_HEAD / SERVICE_CENTER_TECHNICIAN
 * 
 * SSC receives transfer and updates inventory
 */
exports.receiveTransfer = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const userCenterCode = req.user.centerCode;
    const { transactionId } = req.body;

    // Validate role
    if (!["CUSTOMER_SERVICE_HEAD", "SERVICE_CENTER_TECHNICIAN", "MACSOFT_ADMIN"].includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized to receive transfers",
      });
    }

    if (!transactionId) {
      return res.status(400).json({
        success: false,
        message: "Transaction ID is required",
      });
    }

    // Get transaction
    const transaction = await prisma.productTransaction.findUnique({
      where: { id: parseInt(transactionId) },
      include: {
        items: true,
        fromCenter: true,
        toCenter: true,
      },
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found",
      });
    }

    // Validate transaction type
    if (transaction.transactionType !== "TRANSFER") {
      return res.status(400).json({
        success: false,
        message: "Transaction is not a transfer",
      });
    }

    // Validate status
    if (transaction.status !== "PENDING") {
      return res.status(400).json({
        success: false,
        message: `Transfer is already ${transaction.status}`,
      });
    }

    // Validate destination center
    if (transaction.toCenterCode !== userCenterCode && userRole !== "MACSOFT_ADMIN") {
      return res.status(403).json({
        success: false,
        message: "You can only receive transfers for your service center",
      });
    }

    // Update transaction status to RECEIVED
    const updatedTransaction = await inventoryTransactionService.updateTransactionStatus(
      parseInt(transactionId),
      "RECEIVED",
      userId
    );

    res.json({
      success: true,
      message: "Transfer received successfully",
      transaction: updatedTransaction,
    });
  } catch (error) {
    console.error("❌ Receive transfer error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to receive transfer",
    });
  }
};

/**
 * 5. ADJUST INVENTORY (ADMIN ONLY)
 * Role: MACSOFT_ADMIN
 * 
 * Direct inventory correction with reason
 */
exports.adjustInventory = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    // Validate role - ADMIN ONLY
    if (userRole !== "MACSOFT_ADMIN") {
      return res.status(403).json({
        success: false,
        message: "Only MACSOFT_ADMIN can adjust inventory",
      });
    }

    const { centerCode, productId, condition, adjustmentQuantity, remarks } = req.body;

    if (!centerCode || !productId || !condition || !adjustmentQuantity || !remarks) {
      return res.status(400).json({
        success: false,
        message: "Center, product, condition, adjustment quantity, and reason are required",
      });
    }

    // If negative adjustment, check inventory availability
    if (adjustmentQuantity < 0) {
      const availability = await inventoryTransactionService.checkInventoryAvailability(
        centerCode,
        productId,
        condition,
        Math.abs(adjustmentQuantity)
      );

      if (!availability.available) {
        return res.status(400).json({
          success: false,
          message: `Insufficient inventory. Available: ${availability.currentQuantity}, Adjustment: ${Math.abs(adjustmentQuantity)}`,
        });
      }
    }

    // Create ADJUSTMENT transaction
    const items = [
      {
        productId,
        condition,
        quantity: Math.abs(adjustmentQuantity),
        adjustmentQuantity, // Keep sign for processing
      },
    ];

    const transaction = await inventoryTransactionService.createTransaction(
      {
        transactionType: "ADJUSTMENT",
        status: "COMPLETED",
        centerCode,
        items,
        remarks: `ADMIN ADJUSTMENT: ${remarks}`,
      },
      userId
    );

    res.json({
      success: true,
      message: "Inventory adjusted successfully",
      transaction,
    });
  } catch (error) {
    console.error("❌ Adjust inventory error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to adjust inventory",
    });
  }
};

/**
 * GET PENDING TRANSFERS
 */
exports.getPendingTransfers = async (req, res) => {
  try {
    const userCenterCode = req.user.centerCode;
    const userRole = req.user.role;

    let centerCode = userCenterCode;

    // MACSOFT can view all pending transfers
    if (["MACSOFT_ADMIN", "MACSOFT_HEAD"].includes(userRole)) {
      centerCode = req.query.centerCode || userCenterCode;
    }

    const transfers = await inventoryTransactionService.getPendingTransfers(centerCode, userRole);

    res.json({
      success: true,
      transfers,
    });
  } catch (error) {
    console.error("❌ Get pending transfers error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to get pending transfers",
    });
  }
};

/**
 * GET TRANSACTION HISTORY
 */
exports.getTransactionHistory = async (req, res) => {
  try {
    const userCenterCode = req.user.centerCode;
    const userRole = req.user.role;
    const { centerCode, transactionType, status, startDate, endDate, skip, take } = req.query;

    // Build filters
    const filters = {
      skip: skip ? parseInt(skip) : 0,
      take: take ? parseInt(take) : 50,
    };

    // MACSOFT can view all centers
    if (["MACSOFT_ADMIN", "MACSOFT_HEAD", "MACSOFT_SUPPORT"].includes(userRole)) {
      if (centerCode) filters.centerCode = centerCode;
    } else {
      // SSC can only view their own
      filters.centerCode = userCenterCode;
    }

    if (transactionType) filters.transactionType = transactionType;
    if (status) filters.status = status;
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;

    const result = await inventoryTransactionService.getTransactionHistory(filters);

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("❌ Get transaction history error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to get transaction history",
    });
  }
};

/**
 * CREATE RECEIPT TRANSACTION
 * Role: SERVICE_CENTER_TECHNICIAN, CUSTOMER_SERVICE_HEAD
 */
exports.createReceiptTransaction = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const userCenterCode = req.user.centerCode;

    // Validate role
    if (!["SERVICE_CENTER_TECHNICIAN", "CUSTOMER_SERVICE_HEAD", "MACSOFT_ADMIN", "MACSOFT_HEAD"].includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized to create receipt transactions",
      });
    }

    const { items, invoiceNo, receiptDate, remarks } = req.body;

    // Validate items
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one item is required",
      });
    }

    // Create receipt transaction
    const transaction = await inventoryTransactionService.createTransaction(
      {
        transactionType: "RECEIPT",
        status: "RECEIVED",
        centerCode: userCenterCode,
        items,
        invoiceNo,
        receiptDate: receiptDate ? new Date(receiptDate) : new Date(),
        remarks,
      },
      userId
    );

    res.json({
      success: true,
      message: "Receipt transaction created successfully",
      transaction,
    });
  } catch (error) {
    console.error("❌ Create receipt transaction error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to create receipt transaction",
    });
  }
};

/**
 * CREATE DELIVERY TRANSACTION
 * Role: SERVICE_CENTER_TECHNICIAN, CUSTOMER_SERVICE_HEAD
 */
exports.createDeliveryTransaction = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const userCenterCode = req.user.centerCode;

    // Validate role
    if (!["SERVICE_CENTER_TECHNICIAN", "CUSTOMER_SERVICE_HEAD", "MACSOFT_ADMIN", "MACSOFT_HEAD"].includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized to create delivery transactions",
      });
    }

    const { items, billNo, deliveryDate, remarks } = req.body;

    // Validate items
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one item is required",
      });
    }

    // Check inventory availability
    for (const item of items) {
      const availability = await inventoryTransactionService.checkInventoryAvailability(
        userCenterCode,
        item.productId,
        item.condition,
        item.quantity
      );

      if (!availability.available) {
        return res.status(400).json({
          success: false,
          message: `Insufficient inventory. Available: ${availability.currentQuantity}, Required: ${availability.requiredQuantity}`,
        });
      }
    }

    // Create delivery transaction
    const transaction = await inventoryTransactionService.createTransaction(
      {
        transactionType: "DELIVERY",
        status: "COMPLETED",
        centerCode: userCenterCode,
        items,
        billNo,
        deliveryDate: deliveryDate ? new Date(deliveryDate) : new Date(),
        remarks,
      },
      userId
    );

    res.json({
      success: true,
      message: "Delivery transaction created successfully",
      transaction,
    });
  } catch (error) {
    console.error("❌ Create delivery transaction error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to create delivery transaction",
    });
  }
};

/**
 * APPROVE TRANSFER REQUEST
 * Role: MACSOFT_ADMIN / MACSOFT_HEAD
 * 
 * Approves SSC transfer request and deducts inventory
 */
exports.approveTransferRequest = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    // Only MACSOFT can approve
    if (!["MACSOFT_HEAD", "MACSOFT_ADMIN"].includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: "Only MACSOFT can approve transfer requests",
      });
    }

    const { transactionId } = req.body;

    if (!transactionId) {
      return res.status(400).json({
        success: false,
        message: "Transaction ID is required",
      });
    }

    // Get transaction with items
    const transaction = await prisma.productTransaction.findUnique({
      where: { id: transactionId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        fromCenter: true,
        toCenter: true,
      },
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Transfer request not found",
      });
    }

    if (transaction.status !== "PENDING_APPROVAL") {
      return res.status(400).json({
        success: false,
        message: `Cannot approve transfer with status: ${transaction.status}`,
      });
    }

    // Verify inventory availability
    for (const item of transaction.items) {
      const availability = await inventoryTransactionService.checkInventoryAvailability(
        transaction.fromCenterCode,
        item.productId,
        item.condition,
        item.quantity
      );

      if (!availability.available) {
        return res.status(400).json({
          success: false,
          message: `Insufficient inventory for ${item.product?.name}. Available: ${availability.currentQuantity}, Required: ${item.quantity}`,
        });
      }
    }

    // Update transaction status and deduct inventory
    const result = await inventoryTransactionService.updateTransactionStatus(
      transactionId,
      "PENDING",
      userId
    );

    // Also update approval fields
    await prisma.productTransaction.update({
      where: { id: transactionId },
      data: {
        approvedBy: userId,
        approvedAt: new Date(),
      },
    });

    res.json({
      success: true,
      message: "Transfer request approved successfully",
      transaction: result,
    });
  } catch (error) {
    console.error("❌ Approve transfer request error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to approve transfer request",
    });
  }
};

/**
 * REJECT TRANSFER REQUEST
 * Role: MACSOFT_ADMIN / MACSOFT_HEAD
 * 
 * Rejects SSC transfer request
 */
exports.rejectTransferRequest = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    // Only MACSOFT can reject
    if (!["MACSOFT_HEAD", "MACSOFT_ADMIN"].includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: "Only MACSOFT can reject transfer requests",
      });
    }

    const { transactionId, rejectionReason } = req.body;

    if (!transactionId) {
      return res.status(400).json({
        success: false,
        message: "Transaction ID is required",
      });
    }

    if (!rejectionReason || rejectionReason.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Rejection reason is required",
      });
    }

    // Get transaction
    const transaction = await prisma.productTransaction.findUnique({
      where: { id: transactionId },
      include: {
        fromCenter: true,
        toCenter: true,
        createdByUser: true,
      },
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Transfer request not found",
      });
    }

    if (transaction.status !== "PENDING_APPROVAL") {
      return res.status(400).json({
        success: false,
        message: `Cannot reject transfer with status: ${transaction.status}`,
      });
    }

    // Update transaction status
    const updatedTransaction = await prisma.productTransaction.update({
      where: { id: transactionId },
      data: {
        status: "REJECTED",
        approvedBy: userId,
        approvedAt: new Date(),
        rejectionReason,
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        fromCenter: true,
        toCenter: true,
        createdByUser: true,
        approverUser: true,
      },
    });

    res.json({
      success: true,
      message: "Transfer request rejected",
      transaction: updatedTransaction,
    });
  } catch (error) {
    console.error("❌ Reject transfer request error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to reject transfer request",
    });
  }
};
