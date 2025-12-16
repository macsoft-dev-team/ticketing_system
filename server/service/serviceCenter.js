const { prisma } = require("../lib/clients");

const getAll = async (skip, take, filter, currentUser) => {
  try {    
    // Check if current user is authorized
    if (!currentUser) {
      throw new Error("Authentication required: User not found");
    }
    
    if (
      ![
        "MACSOFT_ADMIN",
        "MACSOFT_HEAD",
        "MACSOFT_SUPPORT",
        "SERVICE_CENTER_TECHNICIAN",
      ].includes(currentUser.role)
    ) {
      throw new Error(
        `Unauthorized: Role '${currentUser.role}' is not authorized. Only MACSOFT_ADMIN, MACSOFT_HEAD, or MACSOFT_SUPPORT can access service centers list`
      );
    }

    // Parse pagination parameters
    const params = {};
    if (skip && parseInt(skip) > 0) {
      params.skip = (parseInt(skip) - 1) * parseInt(take || 10);
    }
    if (take && parseInt(take) > 0) {
      params.take = parseInt(take);
    }

    // Build where clause for filtering
    const where = {};

    // Parse filter if it exists
    if (filter) {
      try {
        const filterObj = typeof filter === "string" ? JSON.parse(filter) : filter;

        // Status filter
        if (filterObj.status && filterObj.status !== "") {
          where.isActive = filterObj.status === "ACTIVE";
        }

        // Search filter (name, centerCode, orgCode, address, email)
        if (filterObj.search && filterObj.search.trim() !== "") {
          const searchTerm = filterObj.search.trim();
          where.OR = [
            { name: { contains: searchTerm } },
            { centerCode: { contains: searchTerm } },
            { orgCode: { contains: searchTerm } },
            { address: { contains: searchTerm } },
            { email: { contains: searchTerm } },
          ];
        }
      } catch (parseError) {
        console.warn('Filter parsing error:', parseError);
      }
    }

    params.where = where;

    const serviceCenters = await prisma.serviceCenter.findMany({
      skip: params.skip,
      take: params.take,
      where: params.where, 
      orderBy: [{ createdAt: "desc" }],
    });

    // Get status count for isActive field true/false
    const statusCounts = await prisma.serviceCenter.groupBy({
      by: ["isActive"],
      _count: {
        id: true,
      },
     });
    
    // Transform statusCounts to have 'ALL','ACTIVE' and 'INACTIVE' 
    const _transformedStatusCount = { ALL: 0, ACTIVE: 0, INACTIVE: 0 };
    _transformedStatusCount.ALL = await prisma.serviceCenter.count();
    statusCounts.forEach((statusGroup) => {
      if (statusGroup.isActive) {
        _transformedStatusCount.ACTIVE = statusGroup._count.id;
      } else {
        _transformedStatusCount.INACTIVE = statusGroup._count.id;
      }
    });
    
    const count = await prisma.serviceCenter.count({ where: params.where });

    return { serviceCenters, count, statusCount: _transformedStatusCount };
  } catch (error) {    
    // Provide more specific error messages
    if (error.message.includes('Unauthorized') || error.message.includes('Authentication required')) {
      throw error; // Re-throw auth errors as-is
    }
    
    // For database or other errors, provide a generic message but log the details
    console.error('Database error in service center getAll:', error.stack);
    throw new Error(`Failed to fetch serviceCenters: ${error.message}`);
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
      orgCode: data.orgCode === '' ? null : data.orgCode
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
