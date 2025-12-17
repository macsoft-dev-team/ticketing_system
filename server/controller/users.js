const userService = require('../service/users');
const moment = require('moment');

const getAll = async (req, res) => {
    try {
        const {skip, take, filter} = req.query;
        const transformedFilter = filter ? JSON.parse(filter) : null;
        const currentUser = req.user; // Get current authenticated user
        const { users, count, statusCounts } = await userService.getAll(
          skip,
          take,
          transformedFilter,
          currentUser
        );

        const takeNum = take ? parseInt(take) : 10;
        const skipNum = skip ? parseInt(skip) : 0;

        const transformedUsers = users.map((user) => ({
          ...user,
          password: undefined, // Remove password from response
          status: user.isActive ? "ACTIVE" : "INACTIVE",
          organisation: user?.organisation?.name ? user.organisation.name : (user.serviceCenter?.name || "N/A"),
          orgCode: user.orgCode || null,
          centerCode: user.centerCode || null,
          state: user.State?.name || null,
          primaryState: user.State?.stateCode || null,
          multipleStates: user.states?.map(state => state.stateCode) || [],
          createdAt: moment(user.createdAt).format("DD MMM YYYY, hh:mm A"),
          lastLogin: moment(user.lastLogin).format("DD MMM YYYY, hh:mm A"),
          createdTicketsCount: user.createdTickets ? user.createdTickets.length : 0,
        }));

        res.status(200).json({
          users: transformedUsers,
          totalPages: Math.ceil(count / take),
          currentPage: parseInt(skip) || 1,
          total: count,
          skip: skipNum,
          take: takeNum,
          statusCounts,
        });
    } catch (error) {
        res.status(500).json({ 
            message: "Failed to fetch users",
            error: error.message 
        });
    }
};

const getCurrentUser = async (req, res) => {
    try {
        const user = await userService.getCurrentUser(req.user.id);
        
        // Transform response
        const transformedUser = {
            ...user,
            password: undefined,
            status: user.isActive ? 'ACTIVE' : 'INACTIVE',
            organisation: user.serviceCenter?.organisation?.name || 'N/A',
            orgCode: user.serviceCenter?.orgCode || null,
            state: user.State?.name || null,
        };
        
        res.status(200).json({ user: transformedUser });
    } catch (error) {
        if (error.message === "User not found") {
            res.status(404).json({ message: error.message });
        } else {
            res.status(500).json({ 
                message: "Failed to fetch current user",
                error: error.message 
            });
        }
    }
}

const getById = async (req, res) => {
    try {
        const user = await userService.getById(req.params.id);
        
        // Transform response
        const transformedUser = {
            ...user,
            password: undefined,
            status: user.isActive ? 'ACTIVE' : 'INACTIVE',
            organisation: user.serviceCenter?.organisation?.name || 'N/A',
            orgCode: user.serviceCenter?.orgCode || null,
            state: user.State?.name || null,
            primaryState: user.State?.stateCode || null,
            multipleStates: user.states?.map(state => state.stateCode) || [],
        };
        
        res.status(200).json(transformedUser);
    } catch (error) {
        if (error.message === "User not found") {
            res.status(404).json({ message: error.message });
        } else {
            res.status(500).json({ 
                message: "Failed to fetch user",
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
        
        const newUser = await userService.create(_data);
        
        // Transform response
        const transformedUser = {
            ...newUser,
            status: newUser.isActive ? 'ACTIVE' : 'INACTIVE',
            organisation: newUser.serviceCenter?.organisation?.name || 'N/A',
            orgCode: newUser.serviceCenter?.orgCode || null,
            state: newUser.State?.name || null,
            primaryState: newUser.State?.stateCode || null,
            multipleStates: newUser.states?.map(state => state.stateCode) || [],
        };
        
        res.status(201).json(transformedUser);
    } catch (error) {
        
        // Handle specific validation errors
        if (error.message.includes("already exists") || 
            error.message.includes("required") ||
            error.message.includes("not found")) {
            res.status(400).json({ 
                message: error.message,
                error: error.message 
            });
        } else {
            res.status(500).json({ 
                message: "Failed to create user",
                error: error.message 
            });
        }
    }
};
const update = async (req, res) => {
    try {
        const updatedUser = await userService.update(req.params.id, req.body);
        
        // Transform response
        const transformedUser = {
            ...updatedUser,
            status: updatedUser.isActive ? 'ACTIVE' : 'INACTIVE',
            organisation: updatedUser?.organisation?.name ? updatedUser.organisation.name : (updatedUser.serviceCenter?.organisation?.name || 'N/A'),
            state: updatedUser.State?.name || null,
            primaryState: updatedUser.State?.stateCode || null,
            multipleStates: updatedUser.states?.map(state => state.stateCode) || [],
        };
        
        res.status(200).json(transformedUser);
    } catch (error) {
        
        // Handle specific errors
        if (error.message === "User not found") {
            res.status(404).json({ message: error.message });
        } else if (error.message.includes("already exists") || 
                   error.message.includes("required")) {
            res.status(400).json({ 
                message: error.message,
                error: error.message 
            });
        } else {
            res.status(500).json({ 
                message: "Failed to update user",
                error: error.message 
            });
        }
    }
};

const deleteUser = async (req, res) => {
    try {
        const deletedUser = await userService.deleteUser(req.params.id);
        
        // Transform response for consistency
        const transformedUser = {
            ...deletedUser,
            status: deletedUser.isActive ? 'ACTIVE' : 'INACTIVE',
            organisation: deletedUser.serviceCenter?.organisation?.name || 'N/A',
            orgCode: deletedUser.serviceCenter?.orgCode || null,
            state: deletedUser.State?.name || null,
            primaryState: deletedUser.State?.stateCode || null,
            multipleStates: deletedUser.states?.map(state => state.stateCode) || [],
        };
        
        res.status(200).json({ 
            message: "User deleted successfully",
            id: transformedUser.id 
        });
    } catch (error) {
        
        if (error.message === "User not found") {
            res.status(404).json({ message: error.message });
        } else {
            res.status(500).json({ 
                message: "Failed to delete user",
                error: error.message 
            });
        }
    }
};

const updateProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const { name, phone, newPassword } = req.body;

        // Validate required fields
        if (!name || !phone) {
            return res.status(400).json({
                message: "Name and phone are required"
            });
        }

        // Prepare update data
        const updateData = {
            name: name.trim(),
            phone: phone.trim()
        };

        // Add password if provided
        if (newPassword && newPassword.trim()) {
            updateData.password = newPassword.trim();
        }

        const updatedUser = await userService.updateProfile(userId, updateData);
        
        // Transform response
        const transformedUser = {
            ...updatedUser,
            password: undefined, // Remove password from response
            status: updatedUser.isActive ? 'ACTIVE' : 'INACTIVE', 
        };
        
        res.status(200).json({
            message: "Profile updated successfully",
            user: transformedUser
        });
    } catch (error) {
        
        // Handle specific errors
        if (error.message === "User not found") {
            res.status(404).json({ message: error.message });
        } else if (error.message.includes("already exists") || 
                   error.message.includes("required")) {
            res.status(400).json({ 
                message: error.message,
                error: error.message 
            });
        } else {
            res.status(500).json({ 
                message: "Failed to update profile",
                error: error.message 
            });
        }
    }
};

const updateOrganization = async (req, res) => {
    try {
        const userId = req.user.id;
        const { orgCode } = req.body;

        if (!orgCode) {
            return res.status(400).json({
                message: "Organization code is required",
                error: "Organization code is required"
            });
        }

        // Verify organization exists and is active
        const organization = await userService.validateOrganization(orgCode);
        if (!organization) {
            return res.status(400).json({
                message: "Invalid organization code",
                error: "Invalid organization code"
            });
        }

        // Update user's organization
        const updatedUser = await userService.updateOrganization(userId, orgCode);

        // Transform response
        const transformedUser = {
            ...updatedUser,
            status: updatedUser.isActive ? 'ACTIVE' : 'INACTIVE',
            organisation: updatedUser.organisation?.name || 'N/A',
            state: updatedUser.State?.name || null,
            primaryState: updatedUser.State?.stateCode || null,
            multipleStates: updatedUser.states?.map(state => state.stateCode) || [],
        };

        res.status(200).json({
            message: "Organization updated successfully",
            user: transformedUser
        });
    } catch (error) {
        if (error.message === "User not found") {
            res.status(404).json({ message: error.message });
        } else if (error.message.includes("Organization not found") || 
                   error.message.includes("required")) {
            res.status(400).json({ 
                message: error.message,
                error: error.message 
            });
        } else {
            res.status(500).json({ 
                message: "Failed to update organization",
                error: error.message 
            });
        }
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
  deleteUser,
};