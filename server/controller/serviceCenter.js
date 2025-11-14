const serviceCenterService = require("../service/serviceCenter");
const moment = require("moment");

const getAll = async (req, res) => {
  try {
    const { skip, take, filter } = req.query;
    const parsedFilter = filter ? JSON.parse(filter) : undefined;
    const userId = req.user.id;
    const { serviceCenters, count, statusCount } =
      await serviceCenterService.getAll(skip, take, parsedFilter, userId);

    const _transformedOrgs = serviceCenters.map((org) => ({
      ...org,
      status: org.isActive ? "ACTIVE" : "INACTIVE",
      createdAt: moment(org.createdAt).format("YYYY-MM-DD HH:mm:ss"),
      
    }));
    res.status(200).json({
      serviceCenters: _transformedOrgs,
      statusCount,
      totalPages: Math.ceil(count / 10),
      currentPage: Math.ceil(skip / take),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
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
