const express = require("express");
const router = express.Router();
const {
  createReturnTransaction,
  approveSpareRequest,
  dispatchTransfer,
  receiveTransfer,
  adjustInventory,
  getPendingTransfers,
  getTransactionHistory,
  createReceiptTransaction,
  createDeliveryTransaction,
  approveTransferRequest,
  rejectTransferRequest,
} = require("../controller/inventoryTransaction");
const authenticate = require("../middleware/authenticate");

/**
 * INVENTORY TRANSACTION ROUTES
 * All routes require authentication
 */

// Customer Return
router.post("/return", authenticate, createReturnTransaction);

// Receipt from vendor
router.post("/receipt", authenticate, createReceiptTransaction);

// Delivery to customer
router.post("/delivery", authenticate, createDeliveryTransaction);

// Spare Request Approval (auto inventory deduction)
router.post("/spare-approval", authenticate, approveSpareRequest);

// Transfer Dispatch (MACSOFT → SSC or SSC → SSC with approval)
router.post("/transfer/dispatch", authenticate, dispatchTransfer);

// Transfer Receive (SSC receives)
router.post("/transfer/receive", authenticate, receiveTransfer);

// Approve Transfer Request (MACSOFT only)
router.post("/transfer/approve", authenticate, approveTransferRequest);

// Reject Transfer Request (MACSOFT only)
router.post("/transfer/reject", authenticate, rejectTransferRequest);

// Pending Transfers
router.get("/transfer/pending", authenticate, getPendingTransfers);

// Inventory Adjustment (ADMIN only)
router.post("/adjustment", authenticate, adjustInventory);

// Transaction History
router.get("/history", authenticate, getTransactionHistory);

module.exports = router;
