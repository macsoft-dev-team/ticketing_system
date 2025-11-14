const uploadService = require('../service/uploads');

const uploadUsers = async (req, res) => {
  try {
    // Handle both JSON and form data
    let userData;
    if (req.body) {
      // Handle JSON string from FormData
      userData = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    } else if (Array.isArray(req.body)) {
      // Handle direct array
      userData = req.body;
    } else {
      throw new Error("Invalid data format. Expected users array.");
    }

    const result = await uploadService.uploadUsers(userData);
    res.status(201).json(result);
  } catch (error) {
    console.error("Error uploading users:", error);
    res.status(400).json({ 
      error: error.message || "Failed to upload users",
      message: error.message || "Failed to upload users"
    });
  }
};


const uploadOrganisations = async (req, res) => {
  try {
    const result = await uploadService.uploadOrganisations(req.body);
    res.status(201).json(result);
  } catch (error) {
    console.error("Error uploading organisations:", error);
    res.status(500).json({ error: "Failed to upload organisations" });
  }
};

const uploadServiceCenters = async (req, res) => {
  try {
    const result = await uploadService.uploadServiceCenters(req.body);
    res.status(201).json(result);
  } catch (error) {
    console.error("Error uploading service centers:", error);
    res.status(500).json({ error: "Failed to upload service centers" });
  }
};

const uploadProducts = async (req, res) => {
  try {
    const result = await uploadService.uploadProducts(req.body);
    res.status(201).json(result);
  } catch (error) {
    console.error("Error uploading products:", error);
    res.status(500).json({ error: "Failed to upload products" });
  }
};

module.exports = {
  uploadUsers,
  uploadOrganisations,
  uploadServiceCenters,
  uploadProducts,
};