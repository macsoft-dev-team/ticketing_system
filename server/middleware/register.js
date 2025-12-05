const { prisma } = require("../lib/clients");
const { hashPassword } = require("../lib/hashPassword");
const { 
  createUserNotification, 
  saveAndBroadcastNotification 
} = require("../lib/notificationUtils");

exports.register = async (req, res) => {
  const { name, phone, password, stateId, projectCode, orgCode } = req.body;
  const io = req.io;
  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { phone },
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: {
          code: "USER_EXISTS",
          message: `User already exists with phone number ${phone}`,
        },
      });
    }

    // Hash the password
    const hashedPassword = await hashPassword(password);

    // Create a new user
    const newUser = await prisma.user.create({
      data: {
        name,
        phone,
        password: hashedPassword,
        role: "CUSTOMER_FIELD_ENGINEER", // Default role
        stateId: stateId ? parseInt(stateId) : null,
        projectCode: projectCode || null,
        orgCode: orgCode || null,
      },
    });
    if (newUser) {
      // Get all ADMIN users to notify
      const adminUsers = await prisma.user.findMany({
        where: {
          role: { equals: "MACSOFT_ADMIN" },
        },
        select: { id: true },
      });

      const adminUserIds = adminUsers.map(user => user.id);

      // Create and broadcast user registration notification
      const notificationData = createUserNotification(
        "registered",
        newUser,
        newUser.id
      );

      // Save and broadcast notification to all admins
      await saveAndBroadcastNotification(prisma, io, notificationData, adminUserIds);

      if (io) {
        io.emit("user", newUser);
      }
    }
    return res.status(201).json({
      code: "USER_REGISTERED",
      success: true,
      message: "User registered successfully",
    });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};
