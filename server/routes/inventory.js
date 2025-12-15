const express = require('express');
const router = express.Router();
const inventoryController = require('../controller/inventory');
const authenticate = require('../middleware/authenticate');

// All routes require authentication

// Get all inventory records
router.get('/', inventoryController.getAllInventory);

// Get inventory summary
router.get('/summary', inventoryController.getInventorySummary);

// Get low stock items
router.get('/low-stock', inventoryController.getLowStockItems);

// Get all transaction history
router.get('/transactions', inventoryController.getInventoryTransactionHistory);

// Check stock availability for items
router.post('/check-availability', inventoryController.checkStockAvailability);

// Process inbound activity (add inventory)
router.post('/inbound', inventoryController.processInboundActivity);

// Process outbound activity (deduct inventory)
router.post('/outbound', inventoryController.processOutboundActivity);

// Adjust inventory (MACSOFT only - for corrections)
router.post('/adjust', inventoryController.adjustInventory);

// Process complete transaction (ProductTransaction + ProductTransactionItems)
router.post('/transaction', inventoryController.processTransaction);

// Bulk import inventory from CSV
router.post('/bulk-import', inventoryController.bulkImportInventory);

// Create or update inventory
router.post('/', inventoryController.upsertInventory);

// Update inventory (same as upsert)
router.put('/', inventoryController.upsertInventory);

// Get inventory by product ID
router.get('/product/:productId', inventoryController.getInventoryByProductId);

// Get transaction history for specific product
router.get('/product/:productId/transactions', inventoryController.getInventoryTransactionHistory);

// Delete inventory record
router.delete('/:id', inventoryController.deleteInventory);

module.exports = router;