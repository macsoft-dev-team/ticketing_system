const express = require("express");
const router = express.Router(); 
const batch = require("../controller/batch");
const authenticate = require("../middleware/authenticate");

// Batch routes
router.get("/", authenticate, batch.getBatches);
router.get("/active", authenticate, batch.getActiveBatch);
router.get("/completed", authenticate, batch.getCompletedBatches);
router.post("/", authenticate, batch.createBatch);
router.post("/get-or-create", authenticate, batch.getOrCreateActiveBatch);
router.post("/add-ticket", authenticate, batch.addTicketToBatch);
router.delete("/remove-ticket", authenticate, batch.removeTicketFromBatch);
router.get("/:batchId/images", authenticate, batch.getBatchImages);

module.exports = router;