const { prisma } = require("../lib/clients");

const getAll = async (skip, take, filter, userId) => {
  try {
    //VERIFY IT IS MACSOFT_ADMIN OR SUPER ADMIN
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (user?.role !== "MACSOFT_ADMIN" && user?.role !== "MACSOFT_HEAD" && user?.role !== "MACSOFT_SUPPORT") {
      throw new Error("Unauthorized");
    }
    //isActive IS boolean
    const params = {};
    if (skip) params.skip = parseInt(skip) - 1 * parseInt(take);
    if (take) params.take = parseInt(take);
    if (filter) {
      // Parse filter if it's a JSON string
      const parsedFilter = typeof filter === 'string' ? JSON.parse(filter) : filter;
      let where = {};
      if (parsedFilter.name) where.name = { contains: parsedFilter.name };
      if (parsedFilter.hasOwnProperty('isActive')) where.isActive = parsedFilter.isActive;
      params.where = where;
    }

    //get status count for isActive field true/false

    //EXPECTED RESULT { 'true': 5, 'false': 3, 'ALL': 8 }
    const [activeCount, inactiveCount, allCount] = await Promise.all([
      prisma.organisation.count({ where: { isActive: true } }),
      prisma.organisation.count({ where: { isActive: false } }),
      prisma.organisation.count(),
    ]);
    const _transformedStatusCount = {
      ACTIVE: activeCount,
      INACTIVE: inactiveCount,
      ALL: allCount,
    };
    const organisations = await prisma.organisation.findMany(params);

    const count = await prisma.organisation.count({ where: params.where });

    return { organisations, count, statusCount: _transformedStatusCount };
  } catch (error) {
    throw new Error("Failed to fetch organisations");
  }
};

const getById = async (id) => {
  try {
    const organisation = await prisma.organisation.findUnique({
      where: { id },
    });
    
    if (!organisation) {
      throw new Error("Organisation not found");
    }
    
    return organisation;
  } catch (error) {
    if (error.message === "Organisation not found") {
      throw error;
    }
    throw new Error("Failed to fetch organisation");
  }
};

const create = async (data) => {
  try {
    // Validate required fields
    if (!data.name || !data.name.trim()) {
      throw new Error("Organisation name is required");
    }
    if (!data.orgCode || !data.orgCode.trim()) {
      throw new Error("Organisation code is required");
    }
    if (!data.address || !data.address.trim()) {
      throw new Error("Organisation address is required");
    }
    
    // Check if organisation with same name or orgCode already exists
    const existingOrg = await prisma.organisation.findFirst({
      where: {
        OR: [
          { name: data.name },
          { orgCode: data.orgCode }
        ]
      }
    });
    
    if (existingOrg) {
      if (existingOrg.name === data.name) {
        throw new Error("Organisation with this name already exists");
      }
      if (existingOrg.orgCode === data.orgCode) {
        throw new Error("Organisation with this code already exists");
      }
    }
    
    // Convert status to isActive boolean if provided
    if (data.status) {
      data.isActive = data.status === 'ACTIVE';
      delete data.status;
    }
    
    const newOrganisation = await prisma.organisation.create({
      data,
    });
    
    return newOrganisation;
  } catch (error) {
    throw error;
  }
};

const update = async (id, data) => {
  try {
    // Validate required fields if they exist in the update data
    if (data.name && !data.name.trim()) {
      throw new Error("Organisation name cannot be empty");
    }
    if (data.orgCode && !data.orgCode.trim()) {
      throw new Error("Organisation code cannot be empty");
    }
    if (data.address && !data.address.trim()) {
      throw new Error("Organisation address cannot be empty");
    }
    
    // Check if organisation exists
    const existingOrg = await prisma.organisation.findUnique({
      where: {id:parseInt(id)}
    });
    
    if (!existingOrg) {
      throw new Error("Organisation not found");
    }
    
    // Check for name/orgCode conflicts (excluding current organisation)
    if (data.name || data.orgCode) {
      const conflictOrg = await prisma.organisation.findFirst({
        where: {
          AND: [
            { id: { not: parseInt(id) } },
            {
              OR: [
                ...(data.name ? [{ name: data.name }] : []),
                ...(data.orgCode ? [{ orgCode: data.orgCode }] : [])
              ]
            }
          ]
        }
      });
      
      if (conflictOrg) {
        if (conflictOrg.name === data.name) {
          throw new Error("Organisation with this name already exists");
        }
        if (conflictOrg.orgCode === data.orgCode) {
          throw new Error("Organisation with this code already exists");
        }
      }
    }
    
    // Convert status to isActive boolean if provided
    if (data.status) {
      data.isActive = data.status === 'ACTIVE';
      delete data.status;
    }
    
    const updatedOrganisation = await prisma.organisation.update({
      where: { id: parseInt(id) },
      data,
    });
    
    return updatedOrganisation;
  } catch (error) {
    throw error;
  }
};

const deleteOrganisation = async (id) => {
  try {
    // Check if organisation exists
    const existingOrg = await prisma.organisation.findUnique({
      where: { id }
    });
    
    if (!existingOrg) {
      throw new Error("Organisation not found");
    }
    
    // Soft delete by setting isActive to false
    const deletedOrganisation = await prisma.organisation.update({
      where: { id },
      data: { isActive: false },
    });
    
    return deletedOrganisation;
  } catch (error) {
    throw error;
  }
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  deleteOrganisation,
};
