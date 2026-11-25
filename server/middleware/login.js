const { prisma } = require("../lib/clients");
const { comparePassword } = require("../lib/hashPassword");
const { generateToken } = require("../lib/generateToken");

exports.login = async (req, res) => {
  const identifier = (req.body.phone || req.body.username || req.body.phoneNo || req.body.email || "").toString().trim();
  const password = req.body.password;
  const io = req.io;

  try {
    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        message: "Username/phone number and password are required",
        error: "Username/phone number and password are required",
      });
    }

    // Find user by phone or name/username
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { phone: identifier },
          { name: identifier },
        ],
      },
      include: {
        organisation: true,
        serviceCenter: true,
        State: true,
        states: true,
      },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: `Invalid username/phone number or password`,
        error: "Invalid credentials",
        errorCode: "USER_NOT_FOUND",
      });
    }

    // Compare the password with the hashed password in the database
    const isPasswordValid = await comparePassword(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid phone number or password",
        error: "Invalid credentials",
        errorCode: "INVALID_CREDENTIALS",
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "User account is inactive",
        error: "Account is inactive",
        errorCode: "USER_INACTIVE",
      });
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    const token = await generateToken({
      id: user.id,
      userId: user.id,
      name: user.name,
      username: user.name || user.phone,
      phone: user.phone,
      role: user.role,
      orgCode: user.orgCode,
      centerCode: user.centerCode,
    });

    // Check if user has organization (exclude MACSOFT roles)
    const macsoftRoles = ["MACSOFT_ADMIN", "MACSOFT_HEAD", "MACSOFT_SUPPORT"];
    const needsOrganization =
      !user.orgCode && !user.organisation && !macsoftRoles.includes(user.role);

    return res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        username: user.name || user.phone,
        phone: user.phone,
        role: user.role || "CUSTOMER_FIELD_ENGINEER",
        orgCode: user.orgCode || null,
        organisation: user.organisation?.name || user.orgCode || null,
        serviceCenter: user.serviceCenter?.name || user.centerCode || null,
        centerCode: user.centerCode || null,
        stateId: user.stateId || null,
        isActive: user.isActive,
      },
      needsOrganization,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message || "Internal server error",
    });
  }
};
