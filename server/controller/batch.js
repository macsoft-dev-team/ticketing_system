const batchService = require("../service/batch");

const getBatches = async (req, res) => {
  try {
    const { id } = req.user;
    const batches = await batchService.getBatchByUser(id);
    res.status(200).json(batches);
  } catch (error) {
    console.error("❌ Error fetching batches:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const getActiveBatch = async (req, res) => {
  try {
    const { id } = req.user;
    const {batchType} = req.query;
    const activeBatch = await batchService.getActiveBatchByUser(id, batchType);
    res.status(200).json(activeBatch);
  } catch (error) {
    console.error("❌ Error fetching active batch:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const createBatch = async (req, res) => {
  try {
    const { id } = req.user;
    const { batchType = "RECEIVE_CONTROLLER" } = req.body;
    const batch = await batchService.createBatch(id, batchType);
    res.status(201).json(batch);
  } catch (error) {
    console.error("❌ Error creating batch:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

const getOrCreateActiveBatch = async (req, res) => {
  try {
    const { id } = req.user;
    const { batchType = "RECEIVE_CONTROLLER" } = req.body;
    const batch = await batchService.getOrCreateActiveBatch(id, batchType);
    res.status(200).json(batch);
  } catch (error) {
    console.error("❌ Error getting or creating active batch:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

const addTicketToBatch = async (req, res) => {
  try {
    const { batchId, ticketId } = req.body;

    if (!batchId || !ticketId) {
      return res.status(400).json({
        message: "Batch ID and Ticket ID are required",
      });
    }

    const batchItem = await batchService.addTicketToBatch(
      parseInt(batchId),
      parseInt(ticketId)
    );
    res.status(201).json(batchItem);
  } catch (error) {
    console.error("❌ Error adding ticket to batch:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

const removeTicketFromBatch = async (req, res) => {
  try {
    const { batchId, ticketId } = req.body;

    if (!batchId || !ticketId) {
      return res.status(400).json({
        message: "Batch ID and Ticket ID are required",
      });
    }

    await batchService.removeTicketFromBatch(
      parseInt(batchId),
      parseInt(ticketId)
    );
    res.status(200).json({ message: "Ticket removed from batch successfully" });
  } catch (error) {
    console.error("❌ Error removing ticket from batch:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

const getCompletedBatches = async (req, res) => {
  try {
    const { id } = req.user;
    const { batchType } = req.query;
    const completedBatches = await batchService.getCompletedBatchesByUser(id, batchType);
    res.status(200).json(completedBatches);
  } catch (error) {
    console.error("❌ Error fetching completed batches:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const getBatchImages = async (req, res) => {
  try {
    const { batchId } = req.params;
    const images = await batchService.getBatchImages(parseInt(batchId));
    res.status(200).json(images);
  } catch (error) {
    console.error("❌ Error fetching batch images:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

module.exports = {
  getBatches,
  getActiveBatch,
  getCompletedBatches,
  createBatch,
  getOrCreateActiveBatch,
  addTicketToBatch,
  removeTicketFromBatch,
  getBatchImages,
};
