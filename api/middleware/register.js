const { prisma } = require("../lib/clients");
const { hashPassword } = require("../lib/hashPassword");

exports.register = async (req, res) => {
  const { name, phone, password } = req.body;
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
        role: "USER",
      },
    });
    if (io && newUser) {
      io.emit("user", newUser);
    }
    return res.status(201).json({
      message: "User registered successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};
