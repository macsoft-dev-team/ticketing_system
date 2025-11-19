const serviceCenterService = require("../service/serviceCenter");
const moment = require("moment");

const getAll = async (req, res) => {
  try {
    const { skip, take, filter } = req.query;
    const transformedFilter = filter ? JSON.parse(filter) : null;
    const currentUser = req.user;
    const { serviceCenters, count, statusCount } =
      await serviceCenterService.getAll(skip, take, transformedFilter, currentUser);

    const takeNum = take ? parseInt(take) : 10;
    const skipNum = skip ? parseInt(skip) : 0;

    const _transformedServiceCenters = serviceCenters.map((serviceCenter) => ({
      ...serviceCenter,
      status: serviceCenter.isActive ? "ACTIVE" : "INACTIVE",
      createdAt: moment(serviceCenter.createdAt).format("DD MMM YYYY, hh:mm A"),
      updatedAt: moment(serviceCenter.updatedAt).format("DD MMM YYYY, hh:mm A"),
    }));
    
    res.status(200).json({
      serviceCenters: _transformedServiceCenters,
      totalPages: Math.ceil(count / takeNum),
      currentPage: Math.floor(skipNum / takeNum) + 1,
      total: count,
      skip: skipNum,
      take: takeNum,
      statusCount,
    });
  } catch (error) {
    console.error('Error in getAll service centers controller:', error);
    
    // Handle authorization errors differently
    if (error.message.includes('Unauthorized') || error.message.includes('Authentication required')) {
      return res.status(403).json({
        message: error.message,
        error: error.message
      });
    }
    
    res.status(500).json({ 
      message: "Failed to fetch service centers",
      error: error.message 
    });
  }
};

const getById = async (req, res) => {
  try {
    const { id } = req.params;
    const serviceCenter = await serviceCenterService.getById(id);
    
    if (!serviceCenter) {
      return res.status(404).json({ message: "Service center not found" });
    }

    const transformedServiceCenter = {
      ...serviceCenter,
      status: serviceCenter.isActive ? "ACTIVE" : "INACTIVE",
      createdAt: moment(serviceCenter.createdAt).format("YYYY-MM-DD HH:mm:ss"),
    };

    res.status(200).json(transformedServiceCenter);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const createServiceCenter = async (req, res) => {
  try {
    const data = req.body;
    const newServiceCenter = await serviceCenterService.createServiceCenter(data);
    res.status(201).json(newServiceCenter);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const updateServiceCenter = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;
    
    if (!data || Object.keys(data).length === 0) {
      return res.status(400).json({ message: "No data provided for update" });
    }
    
    const updatedServiceCenter = await serviceCenterService.updateServiceCenter(parseInt(id), data);
    res.status(200).json(updatedServiceCenter);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const deleteServiceCenter = async (req, res) => {
  try {
    const { id } = req.params;
    await serviceCenterService.deleteServiceCenter(id);
    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  getAll,
  getById,
  createServiceCenter,
  updateServiceCenter,
  deleteServiceCenter,
};
