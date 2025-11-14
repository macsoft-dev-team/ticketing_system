const { prisma } = require("../lib/clients");

const getAll = async (skip, take, filter, userId) => {
  try {
    //VERIFY IT IS MACSOFT_ADMIN OR SUPER ADMIN
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (
      user?.role !== "MACSOFT_ADMIN" &&
      user?.role !== "MACSOFT_HEAD" &&
      user?.role !== "MACSOFT_SUPPORT"
    ) {
      throw new Error("Unauthorized");
    }
    //isActive IS boolean
    const params = {};
    if (skip) params.skip = (parseInt(skip) - 1) * parseInt(take || 10);
    if (take) params.take = parseInt(take);
    if (filter) {
      let where = {};
      if (filter.search)
        where.OR = [
          { orgCode: { contains: filter.search } },
          { centerCode: { contains: filter.search } },
          { name: { contains: filter.search } },
          { address: { contains: filter.search } },
        ];
      if (filter.status)
        where.isActive =
          filter.status === "ACTIVE"
            ? true
            : filter.status === "INACTIVE"
            ? false
            : undefined;
      params.where = where;
    }

    //get status count for isActive field true/false

    //EXPECTED RESULT { 'true': 5, 'false': 3, 'ALL': 8 }
    const [activeCount, inactiveCount, allCount] = await Promise.all([
      prisma.serviceCenter.count({ where: { isActive: true } }),
      prisma.serviceCenter.count({ where: { isActive: false } }),
      prisma.serviceCenter.count(),
    ]);
    const _transformedStatusCount = {
      ACTIVE: activeCount,
      INACTIVE: inactiveCount,
      ALL: allCount,
    };
    const serviceCenters = await prisma.serviceCenter.findMany(params);

    const count = await prisma.serviceCenter.count({ where: params.where });

    return { serviceCenters, count, statusCount: _transformedStatusCount };
  } catch (error) {
    console.error(error);
    throw new Error("Failed to fetch serviceCenters");
  }
};

const getById = async (id) => {
  try {
    const serviceCenter = await prisma.serviceCenter.findUnique({
      where: {
        id: parseInt(id),
      },
      include: {
        organisation: true,
        users: {
          select: {
            id: true,
            name: true,
            role: true,
            isActive: true,
          },
        },
      },
    });
    return serviceCenter;
  } catch (error) {
    console.error(error);
    throw new Error("Failed to fetch serviceCenter");
  }
};

const createServiceCenter = async (data) => {
  try {
    // If orgCode is empty string, set it to null to avoid foreign key constraint
    const cleanData = {
      ...data,
      projectCode: data.projectCode === '' ? null : data.projectCode
    };
    
    const newServiceCenter = await prisma.serviceCenter.create({
      data: cleanData,
    });
    return newServiceCenter;
  } catch (error) {
    console.error(error);
    throw new Error("Failed to create serviceCenter");
  }
};

const updateServiceCenter = async (id, data) => {
  try {
    // Validate that data is provided
    if (!data || typeof data !== 'object') {
      throw new Error("Invalid data provided for update");
    }

    // If orgCode is empty string, set it to null to avoid foreign key constraint
    const cleanData = {
      ...data,
      orgCode: data.orgCode === '' ? null : data.orgCode
    };
    
    const updatedServiceCenter = await prisma.serviceCenter.update({
      where: { id: parseInt(id) },
      data: cleanData,
    });
    return updatedServiceCenter;
  } catch (error) {
    console.error(error);
    throw new Error("Failed to update serviceCenter");
  }
};

const deleteServiceCenter = async (id) => {
  try {
    const deletedServiceCenter = await prisma.serviceCenter.delete({
      where: { id: parseInt(id) },
    });
    return deletedServiceCenter;
  } catch (error) {
    console.error(error);
    throw new Error("Failed to delete serviceCenter");
  }
};

module.exports = {
  getAll,
  getById,
  createServiceCenter,
  updateServiceCenter,
  deleteServiceCenter,
};
