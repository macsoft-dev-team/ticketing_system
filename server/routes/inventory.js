const express = require('express');
const router = express.Router();
const inventoryController = require('../controller/inventory');
const authenticate = require('../middleware/authenticate');

// All routes require authentication

// Get all inventory records
router.get('/', inventoryController.getAllInventory);

// Get low stock items
router.get('/low-stock', inventoryController.getLowStockItems);

// Get all transaction history
router.get('/transactions', inventoryController.getInventoryTransactionHistory);

// Check stock availability for items
router.post('/check-availability', inventoryController.checkStockAvailability);

// Process inbound activity (add inventory)
router.post('/inbound', inventoryController.processInboundActivity);

// Create or update inventory
router.post('/', inventoryController.upsertInventory);

// Get inventory by product ID
router.get('/product/:productId', inventoryController.getInventoryByProductId);

// Get transaction history for specific product
router.get('/product/:productId/transactions', inventoryController.getInventoryTransactionHistory);

// Update inventory (same as upsert)
router.put('/product/:productId', inventoryController.upsertInventory);

// Delete inventory record
router.delete('/product/:productId', inventoryController.deleteInventory);

module.exports = router;