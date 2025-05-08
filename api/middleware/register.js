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
    if (newUser){
      const users = await prisma.user.findMany({
        where:{
          role:{
            contains: "ADIMN"
          }
        }
      });
      // Create a notification for all users except the newly created user
      const notification = await prisma.notification.create({
        data: {
          createdById: newUser.id,
          userId: newUser.id,
          description: `New user registered: ${newUser.name}`,
          type: "USER_REGISTERED",
          title: "New User Registration",
        },
      });

      for (const user of users) {
        await prisma.notificationRecipient.create({
          data: {
            userId: user.id,
            notificationId: notification.id,
          },
        });
      }
    }
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
