const { prisma } = require("../lib/clients");
const { comparePassword } = require("../lib/hashPassword");
const { generateToken } = require("../lib/generateToken");

exports.login = async (req, res) => {
  const { phone, password } = req.body;
  const io = req.io;

  try {
    // Find the user by phone number
    const user = await prisma.user.findUnique({
      where: { phone },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          code: "USER_NOT_FOUND",
          message: `User not found with phone number ${phone}, please register!`,
        },
      });
    }

    // Compare the password with the hashed password in the database
    const isPasswordValid = await comparePassword(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: {
          code: "INVALID_CREDENTIALS",
          message: "Invalid phone number or password",
        },
      });
    }

    if (user) {
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLogin: new Date() }, // Update the last login time
      });
    }

    const token = await generateToken({ ...user, password: undefined });
    if (token && user.role !== "ADMIN") {
      const users = await prisma.user.findMany({
        where: {
          role: {
            equals: `ADMIN`,
          },
        },
      });
      const notification = await prisma.notification.create({
        data: {
          createdById: user.id,
          description: `${user.name} - ${user.role}  logged in`,
          type: "USER_LOGIN",
          title: "User Login",
        },
      });
      let _notification = [];
      for (const user of users) {
       const notificationRecipient = await prisma.notificationRecipient.create({
          data: {
            userId: user.id,
            notificationId: notification.id,
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                phone: true,
                role: true,
              },
            },
            notification: {
              include: {
                createdBy: true,
                ticket: true,
                message: true,
              },
            },
          },
        });
        _notification.push(notificationRecipient);
      }
      if(io && _notification) {
        io.emit("notification", _notification);
      }
     }
    return res.status(200).json({
      message: "Login successful",
      user: { ...user, password: undefined }, // Exclude password from the response
      token, // Include the token in the response
    });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};
