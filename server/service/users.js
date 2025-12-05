const { prisma } = require("../lib/clients");
const { hashPassword } = require("../lib/hashPassword");

// Helper function to convert state codes to state IDs
const getStateIdByCode = async (stateCode) => {
  if (!stateCode) return null;
  const state = await prisma.state.findUnique({
    where: { stateCode }
  });
  return state ? state.id : null;
};

// Helper function to convert array of state codes to array of state IDs
const getStateIdsByCodes = async (stateCodes) => {
  if (!stateCodes || !Array.isArray(stateCodes) || stateCodes.length === 0) return [];
  const states = await prisma.state.findMany({
    where: { stateCode: { in: stateCodes } }
  });
  return states.map(state => ({ id: state.id }));
};
 
const getAll = async (skip, take, filter, currentUser) => {
  try {
    // Check if current user is MACSOFT_ADMIN
    if (!currentUser || currentUser.role !== 'MACSOFT_ADMIN') {
      throw new Error("Unauthorized: Only MACSOFT_ADMIN can access user list");
    }

    // Parse pagination parameters
    const params = {};
    if (skip) params.skip = (parseInt(skip) - 1) * parseInt(take || 10);
    if (take) params.take = parseInt(take);

    // Build where clause for filtering
    const where = {};

    // Parse filter if it exists
    if (filter) {
      try {
        const filterObj =
          typeof filter === "string" ? JSON.parse(filter) : filter;

        // Status filter
        if (filterObj.status && filterObj.status !== "") {
          where.isActive = filterObj.status === "ACTIVE";
        }

        // Search filter (name, phone)
        if (filterObj.search && filterObj.search.trim() !== "") {
          const searchTerm = filterObj.search.trim();
          where.OR = [
            { name: { contains: searchTerm } },
            { phone: { contains: searchTerm } },
            // Note: Email search is commented out until schema migration is run
            // { email: { contains: searchTerm, mode: 'insensitive' } }
          ];
        }

        // Role filter
        if (filterObj.role && filterObj.role !== "") {
          where.role = filterObj.role;
        }

        // Organization filter
        if (filterObj.projectCode && filterObj.projectCode !== "") {
          where.serviceCenter = {
            projectCode: filterObj.projectCode,
          };
        }
      } catch (parseError) {
        console.warn("Filter parsing error:", parseError);
      }
    }

    // Exclude deleted users
    where.deletedAt = null;
    
    // Exclude the current admin user from results
    where.id = {
      not: currentUser.id
    };

    const users = await prisma.user.findMany({
      skip: params.skip,
      take: params.take,
      where,
      include: {
        serviceCenter: {
          include: {
            project: true,
          },
        },
        organisation: true,
        State: true,
        states: true,
      },
      orderBy: [{ createdAt: "desc" }],
    });

    //group by status active,inactive count

    const statusCounts = await prisma.user.groupBy({
      by: ["isActive"],
       _count: {
        id: true,
      },
    });
    // Transform statusCounts to have 'ALL','ACTIVE' and 'INACTIVE' 
    const _transformedStatusCounts = { ALL: 0, ACTIVE: 0, INACTIVE: 0 };
    _transformedStatusCounts.ALL = await prisma.user.count();
    statusCounts.forEach((statusGroup) => {
      if (statusGroup.isActive) {
        _transformedStatusCounts.ACTIVE = statusGroup._count.id;
      } else {
        _transformedStatusCounts.INACTIVE = statusGroup._count.id;
      }
    });
    const count = await prisma.user.count({ where });
    return { users, count, statusCounts: _transformedStatusCounts };
  } catch (error) {
    console.error('Error in getAll users service:', error);
    throw new Error("Failed to fetch users");
  }
};

const getCurrentUser = async (userId) => {
  try {
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        phone: true,
        role: true,
        isActive: true,
        centerCode: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
        serviceCenter: {
          include: {
            organisation: true
          }
        },
        State: true,
        states: true
      },
    });

    if (!user) {
      throw new Error("User not found");
    }

    return user;
  } catch (error) {
    console.error('Error in getCurrentUser service:', error);
    throw new Error("Failed to fetch current user");
  }
};

const getById = async (id) => {
  try {
    const user = await prisma.user.findUnique({
      where: {
        id: parseInt(id),
        deletedAt: null,
      },
      include: {
        serviceCenter: {
          include: {
            organisation: true
          }
        },
        State: true,
        states: true
      }
    });

    if (!user) {
      throw new Error("User not found");
    }

    return user;
  } catch (error) {
    console.error('Error in getById service:', error);
    throw new Error("Failed to fetch user");
  }
};

const create = async (userData) => {
  try {
    // Validate required fields
    if (!userData.name || !userData.phone || !userData.password) {
      throw new Error("Name, phone, and password are required");
    }

    // Check if phone already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        phone: userData.phone,
        deletedAt: null
      }
    });

    if (existingUser) {
      throw new Error("User with this phone number already exists");
    }

    // Hash password
    const hashedPassword = await hashPassword(userData.password);
    
    // Prepare user data
    const createData = {
      name: userData.name,
      phone: userData.phone,
      password: hashedPassword,
      role: userData.role || 'SCE_USER',
      isActive: userData.status === 'ACTIVE' || userData.isActive !== false,
    };

    // Note: Email field is commented out until schema migration is run
    // Add email if provided and email field exists in schema
    // if (userData.email && userData.email.trim() !== '') {
    //   createData.email = userData.email.trim();
    // }

    // Handle organization/service center relationship
    if (userData.projectCode) {
      // Find service center by projectCode
      const serviceCenter = await prisma.serviceCenter.findFirst({
        where: { projectCode: userData.projectCode }
      });
      
      if (serviceCenter) {
        createData.centerCode = serviceCenter.centerCode;
      }
    }

    // Handle primary state relationship
    if (userData.primaryState) {
      const primaryStateId = await getStateIdByCode(userData.primaryState);
      if (primaryStateId) {
        createData.stateId = primaryStateId;
      }
    } else if (userData.stateId) {
      createData.stateId = parseInt(userData.stateId);
    }

    // Handle multiple states relationship
    let multipleStatesConnect = [];
    if (userData.multipleStates && Array.isArray(userData.multipleStates)) {
      multipleStatesConnect = await getStateIdsByCodes(userData.multipleStates);
    }

    const newUser = await prisma.user.create({
      data: {
        ...createData,
        states: {
          connect: multipleStatesConnect
        }
      },
      include: {
        serviceCenter: {
          include: {
            project: true
          }
        },
        State: true,
        states: true
      }
    });

    // Remove password from response
    const { password, ...userResponse } = newUser;
    return userResponse;
  } catch (error) {
    console.error('Error in create user service:', error);
    throw error; // Re-throw to preserve specific error messages
  }
};
const update = async (id, userData) => {
  try {
    // Check if user exists
    const existingUser = await prisma.user.findFirst({
      where: {
        id: parseInt(id),
        deletedAt: null
      }
    });

    if (!existingUser) {
      throw new Error("User not found");
    }

    // Check for phone number conflicts (if phone is being updated)
    if (userData.phone && userData.phone !== existingUser.phone) {
      const phoneConflict = await prisma.user.findFirst({
        where: {
          phone: userData.phone,
          id: { not: parseInt(id) },
          deletedAt: null
        }
      });

      if (phoneConflict) {
        throw new Error("User with this phone number already exists");
      }
    }

    // Prepare update data
    const updateData = {};

    // Only update provided fields
    if (userData.name) updateData.name = userData.name;
    if (userData.phone) updateData.phone = userData.phone;
    if (userData.role) updateData.role = userData.role;
    if (userData.hasOwnProperty('status')) {
      updateData.isActive = userData.status === 'ACTIVE';
    }
    if (userData.hasOwnProperty('isActive')) {
      updateData.isActive = userData.isActive;
    }

    // Note: Email field is commented out until schema migration is run
    // Handle email (can be empty)
    // if (userData.hasOwnProperty('email')) {
    //   updateData.email = userData.email && userData.email.trim() !== '' ? userData.email.trim() : null;
    // }

    // Handle password update
    if (userData.password && userData.password.trim() !== '') {
      updateData.password = await hashPassword(userData.password);
    }
    //Handle service center code update
    if(userData.centerCode){
      updateData.centerCode = userData.centerCode;
    }
    
    //Handle Organization code update 
    if (userData.orgCode ) {
      updateData.orgCode = userData.orgCode;
    }
    // Handle primary state relationship
    if (userData.hasOwnProperty('primaryState')) {
      if (userData.primaryState) {
        const primaryStateId = await getStateIdByCode(userData.primaryState);
        updateData.stateId = primaryStateId;
      } else {
        updateData.stateId = null;
      }
    } else if (userData.stateId) {
      updateData.stateId = parseInt(userData.stateId);
    }

    // Handle multiple states relationship
    let statesUpdate = {};
    if (userData.hasOwnProperty('multipleStates')) {
      // First disconnect all existing states
      const currentUser = await prisma.user.findUnique({
        where: { id: parseInt(id) },
        include: { states: true }
      });
      
      if (currentUser && currentUser.states.length > 0) {
        statesUpdate.disconnect = currentUser.states.map(state => ({ id: state.id }));
      }
      
      // Then connect new states if provided
      if (userData.multipleStates && Array.isArray(userData.multipleStates) && userData.multipleStates.length > 0) {
        const multipleStatesConnect = await getStateIdsByCodes(userData.multipleStates);
        if (multipleStatesConnect.length > 0) {
          statesUpdate.connect = multipleStatesConnect;
        }
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: parseInt(id) },
      data: {
        ...updateData,
        ...(Object.keys(statesUpdate).length > 0 && { states: statesUpdate })
      },
      include: {
        serviceCenter: {
          include: {
            project: true
          }
        },
        organisation: true,
        State: true,
        states: true
      }
    });

    // Remove password from response
    const { password, ...userResponse } = updatedUser;
    return userResponse;
  } catch (error) {
    console.error('Error in update user service:', error);
    throw error; // Re-throw to preserve specific error messages
  }
};

const deleteUser = async (id) => {
  try {
    // Check if user exists
    const existingUser = await prisma.user.findFirst({
      where: {
        id: parseInt(id),
        deletedAt: null
      }
    });

    if (!existingUser) {
      throw new Error("User not found");
    }

    // Soft delete - update deletedAt timestamp
    const deletedUser = await prisma.user.update({
      where: { id: parseInt(id) },
      data: {
        deletedAt: new Date(),
        isActive: false,
      },
      include: {
        serviceCenter: {
          include: {
            project: true,
          },
        },
        State: true,
      },
    });

    // Remove password from response
    const { password, ...userResponse } = deletedUser;
    return userResponse;
  } catch (error) {
    console.error('Error in delete user service:', error);
    throw error; // Re-throw to preserve specific error messages
  }
};

const updateProfile = async (userId, profileData) => {
  try {
    // Check if user exists
    const existingUser = await prisma.user.findFirst({
      where: {
        id: userId,
        deletedAt: null
      }
    });

    if (!existingUser) {
      throw new Error("User not found");
    }

    // Check for phone number conflicts (if phone is being updated)
    if (profileData.phone && profileData.phone !== existingUser.phone) {
      const phoneConflict = await prisma.user.findFirst({
        where: {
          phone: profileData.phone,
          id: { not: userId },
          deletedAt: null
        }
      });

      if (phoneConflict) {
        throw new Error("User with this phone number already exists");
      }
    }

    // Prepare update data
    const updateData = {};

    // Update name if provided
    if (profileData.name) {
      updateData.name = profileData.name;
    }

    // Update phone if provided
    if (profileData.phone) {
      updateData.phone = profileData.phone;
    }

    // Hash and update password if provided
    if (profileData.password) {
      updateData.password = await hashPassword(profileData.password);
    }

    // Update the user profile
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      include: {
        serviceCenter: true,
        State: true,
        states: true
      }
    });

    // Remove password from response
    const { password, ...userResponse } = updatedUser;
    return userResponse;
  } catch (error) {
    console.error('Error in updateProfile service:', error);
    throw error; // Re-throw to preserve specific error messages
  }
};

const validateOrganization = async (orgCode) => {
  try {
    const organization = await prisma.organisation.findUnique({
      where: { orgCode: orgCode.toString() }
    });

    return organization;
  } catch (error) {
    console.error('Error validating organization:', error);
    return null;
  }
};

const updateOrganization = async (userId, orgCode) => {
  try {
    // Verify user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: parseInt(userId) }
    });

    if (!existingUser) {
      throw new Error('User not found');
    }

    // Update user's organization
    const updatedUser = await prisma.user.update({
      where: { id: parseInt(userId) },
      data: {
        orgCode: orgCode.toString(),
      },
      include: {
        organisation: true,
        State: true,
        states: true,
      },
    });

    // Remove password from response
    const { password, ...userResponse } = updatedUser;
    return userResponse;
  } catch (error) {
    console.error('Error in updateOrganization service:', error);
    throw error;
  }
};

module.exports = {
  getAll,
  getCurrentUser,
  getById,
  create,
  update,
  updateProfile,
  updateOrganization,
  validateOrganization,
  deleteUser,
};
