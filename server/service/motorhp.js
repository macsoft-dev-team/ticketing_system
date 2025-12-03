const { prisma } = require("../lib/clients");

const getMotorHPs = async (skip, take, filter) => {
  try {
    const params = {};
   
    if (skip) params.skip = (parseInt(skip) - 1) * parseInt(take || 10);
    if (take) params.take = parseInt(take);
    let where = { active: true }; // Only show active records by default
    
    if (filter) {
      where.OR = [
        { label: { contains: filter } },
        { value: { equals: isNaN(parseInt(filter)) ? undefined : parseInt(filter) } }
      ].filter(condition => condition.value !== undefined || condition.label);
    }
    
    params.where = where;
    params.orderBy = [
      { sortOrder: 'asc' },
      { value: 'asc' }
    ];
    
    const count = await prisma.motorhp.count({ where: params.where });
    const motorhps = await prisma.motorhp.findMany(params);
    return { motorhps, count };
  } catch (error) {
    console.error("Error fetching motor HPs:", error);
    throw error;
  }
};

const getMotorHPById = async (motorhpId) => {
  try {
    const motorhp = await prisma.motorhp.findUnique({
      where: { id: parseInt(motorhpId) },
    });
    return motorhp;
  } catch (error) {
    console.error("Error fetching motor HP by ID:", error);
    throw error;
  }
};

const createMotorHP = async (motorhpData) => {
  try {
    const newMotorHP = await prisma.motorhp.create({
      data: {
        label: motorhpData.label,
        value: parseInt(motorhpData.value),
        sortOrder: motorhpData.sortOrder ? parseInt(motorhpData.sortOrder) : null,
        active: motorhpData.active !== undefined ? motorhpData.active : true
      },
    });
    return newMotorHP;
  } catch (error) {
    console.error("Error creating motor HP:", error);
    throw error;
  }
};

const updateMotorHP = async (motorhpId, updateData) => {
  try {
    const updatedData = {
      label: updateData.label,
      value: parseInt(updateData.value),
      sortOrder: updateData.sortOrder ? parseInt(updateData.sortOrder) : null,
      active: updateData.active !== undefined ? updateData.active : true
    };
    
    const updatedMotorHP = await prisma.motorhp.update({
      where: { id: parseInt(motorhpId) },
      data: updatedData,
    });
    return updatedMotorHP;
  } catch (error) {
    console.error("Error updating motor HP:", error);
    throw error;
  }
};

const deleteMotorHP = async (motorhpId) => {
  try {
    // Soft delete by setting active to false
    const deletedMotorHP = await prisma.motorhp.update({
      where: { id: parseInt(motorhpId) },
      data: { active: false },
    });
    return deletedMotorHP;
  } catch (error) {
    console.error("Error deleting motor HP:", error);
    throw error;
  }
};

const getAllActiveMotorHPs = async () => {
  try {
    const motorhps = await prisma.motorhp.findMany({
      where: { active: true },
      orderBy: [
        { sortOrder: 'asc' },
        { value: 'asc' }
      ]
    });
    return motorhps;
  } catch (error) {
    console.error("Error fetching active motor HPs:", error);
    throw error;
  }
};

module.exports = {
  getMotorHPs,
  getMotorHPById,
  createMotorHP,
  updateMotorHP,
  deleteMotorHP,
  getAllActiveMotorHPs
};