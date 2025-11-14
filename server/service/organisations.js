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
      let where = {};
      if (filter.name) where.name = { contains: filter.name };
      if (filter.isActive) where.isActive = filter.isActive;
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
    console.error(error);
    throw new Error("Failed to fetch organisations");
  }
};

module.exports = {
  getAll,
};
