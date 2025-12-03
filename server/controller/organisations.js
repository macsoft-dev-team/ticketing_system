const organisationService = require("../service/organisations");
const moment = require("moment");

const getAll = async (req, res) => {
  try {
    const { skip, take, filter } = req.query;
    const userId = req.user.id;
    const { organisations, count, statusCount } =
      await organisationService.getAll(skip, take, filter, userId);

    const _transformedOrgs = organisations.map((org) => ({
      ...org,
      status: org.isActive ? "ACTIVE" : "INACTIVE",
      createdAt:  moment(org.createdAt).format("YYYY-MM-DD HH:mm:ss"),
    }));
    res.status(200).json({
      organisations: _transformedOrgs,
      statusCount,
      totalPages: Math.ceil(count / 10),
      currentPage: Math.ceil(skip / take),
    });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

const getById = async (req, res) => {
  try {
    const organisation = await organisationService.getById(req.params.id);
    
    const transformedOrg = {
      ...organisation,
      status: organisation.isActive ? 'ACTIVE' : 'INACTIVE',
      createdAt: moment(organisation.createdAt).format("YYYY-MM-DD HH:mm:ss"),
    };
    
    res.status(200).json(transformedOrg);
  } catch (error) {
    if (error.message === "Organisation not found") {
      res.status(404).json({ message: error.message });
    } else {
      res.status(500).json({ 
        message: "Failed to fetch organisation",
        error: error.message 
      });
    }
  }
};

const create = async (req, res) => {
  try {
    const _data = req.body;
    
    // Clean up undefined or empty string values (but keep false values)
    Object.keys(_data).forEach(key => {
      if (_data[key] === undefined || _data[key] === "") {
        delete _data[key];
      }
    });
    
    const newOrganisation = await organisationService.create(_data);
    
    const transformedOrg = {
      ...newOrganisation,
      status: newOrganisation.isActive ? 'ACTIVE' : 'INACTIVE',
      createdAt: moment(newOrganisation.createdAt).format("YYYY-MM-DD HH:mm:ss"),
    };
    
    res.status(201).json(transformedOrg);
  } catch (error) {
    
    if (error.message.includes("already exists") || 
        error.message.includes("required") ||
        error.message.includes("not found")) {
      res.status(400).json({ 
        message: error.message,
        error: error.message 
      });
    } else {
      res.status(500).json({ 
        message: "Failed to create organisation",
        error: error.message 
      });
    }
  }
};

const update = async (req, res) => {
  try {
    const updatedOrganisation = await organisationService.update(req.params.id, req.body.organisationData);
    
    const transformedOrg = {
      ...updatedOrganisation,
      status: updatedOrganisation.isActive ? 'ACTIVE' : 'INACTIVE',
      createdAt: moment(updatedOrganisation.createdAt).format("YYYY-MM-DD HH:mm:ss"),
    };
    
    res.status(200).json(transformedOrg);
  } catch (error) {
    
    if (error.message === "Organisation not found") {
      res.status(404).json({ message: error.message });
    } else if (error.message.includes("already exists") || 
               error.message.includes("required")) {
      res.status(400).json({ 
        message: error.message,
        error: error.message 
      });
    } else {
      res.status(500).json({ 
        message: "Failed to update organisation",
        error: error.message 
      });
    }
  }
};

const deleteOrganisation = async (req, res) => {
  try {
    const deletedOrganisation = await organisationService.deleteOrganisation(req.params.id);
    
    res.status(200).json({ 
      message: "Organisation deleted successfully",
      id: deletedOrganisation.id 
    });
  } catch (error) {
    
    if (error.message === "Organisation not found") {
      res.status(404).json({ message: error.message });
    } else {
      res.status(500).json({ 
        message: "Failed to delete organisation",
        error: error.message 
      });
    }
  }
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  deleteOrganisation,
};
