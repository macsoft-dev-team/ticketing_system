const { prisma } = require("../lib/clients");
const { comparePassword, hashPassword } = require("../lib/hashPassword");

exports.updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user?.id || req.user?.userId;

    if (!newPassword || typeof newPassword !== "string" || newPassword.trim().length < 6) {
      return res.status(400).json({
        success: false,
        error: "New password must be at least 6 characters long",
        message: "New password must be at least 6 characters long",
      });
    }

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized",
        message: "Unauthorized",
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
        message: "User not found",
      });
    }

    // Verify current password if provided
    if (currentPassword) {
      const isPasswordValid = await comparePassword(currentPassword, user.password);
      if (!isPasswordValid) {
        return res.status(400).json({
          success: false,
          error: "Current password is incorrect",
          message: "Current password is incorrect",
        });
      }
    }

    const hashedPassword = await hashPassword(newPassword.trim());
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return res.status(200).json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (error) {
    console.error("Update password error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to update password",
      message: error.message || "Failed to update password",
    });
  }
};
