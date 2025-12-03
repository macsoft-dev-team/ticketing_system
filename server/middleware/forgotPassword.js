const { prisma } = require("../lib/clients");
const { hashPassword } = require("../lib/hashPassword");
const crypto = require('crypto');

// In-memory store for verification codes (in production, use Redis or database)
const verificationCodes = new Map();

// Generate 6-digit verification code
const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send SMS function (mock implementation - replace with actual SMS service)
const sendSMS = async (phoneNumber, message) => {
  // Mock SMS implementation - replace with actual SMS service like Twilio
  console.log(`📱 SMS to ${phoneNumber}: ${message}`);
  
  // Simulate SMS delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // In production, integrate with SMS service:
  // const twilio = require('twilio');
  // const client = twilio(accountSid, authToken);
  // return await client.messages.create({
  //   body: message,
  //   from: '+1234567890',
  //   to: phoneNumber
  // });
  
  return { success: true, messageSid: 'mock_message_id' };
};

// Request password reset
exports.forgotPassword = async (req, res) => {
  const { phone } = req.body;

  try {
    if (!phone) {
      return res.status(400).json({
        success: false,
        message: "Phone number is required"
      });
    }

    // Find user by phone number
    const user = await prisma.user.findUnique({
      where: { phone }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "No account found with this phone number"
      });
    }

    // Generate verification code
    const verificationCode = generateVerificationCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

    // Store verification code with expiry
    verificationCodes.set(phone, {
      code: verificationCode,
      expiresAt,
      attempts: 0,
      userId: user.id
    });

    // Send SMS with verification code
    const message = `Your password reset code is: ${verificationCode}. This code will expire in 10 minutes.`;
    
    try {
      await sendSMS(phone, message);
    } catch (smsError) {
      return res.status(500).json({
        success: false,
        message: "Failed to send verification code. Please try again."
      });
    }

    res.status(200).json({
      success: true,
      message: "Verification code sent successfully",
      expiresIn: 600 // 10 minutes in seconds
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// Verify reset code
exports.verifyResetCode = async (req, res) => {
  const { phone, code } = req.body;

  try {
    if (!phone || !code) {
      return res.status(400).json({
        success: false,
        message: "Phone number and verification code are required"
      });
    }

    const storedData = verificationCodes.get(phone);

    if (!storedData) {
      return res.status(400).json({
        success: false,
        message: "No verification code found. Please request a new one."
      });
    }

    // Check if code is expired
    if (new Date() > storedData.expiresAt) {
      verificationCodes.delete(phone);
      return res.status(400).json({
        success: false,
        message: "Verification code has expired. Please request a new one."
      });
    }

    // Check attempt limit
    if (storedData.attempts >= 3) {
      verificationCodes.delete(phone);
      return res.status(400).json({
        success: false,
        message: "Too many failed attempts. Please request a new verification code."
      });
    }

    // Verify code
    if (storedData.code !== code) {
      storedData.attempts += 1;
      verificationCodes.set(phone, storedData);
      
      return res.status(400).json({
        success: false,
        message: "Invalid verification code"
      });
    }

    // Mark code as verified but keep it for password reset
    storedData.verified = true;
    verificationCodes.set(phone, storedData);

    res.status(200).json({
      success: true,
      message: "Verification code verified successfully"
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// Reset password
exports.resetPassword = async (req, res) => {
  const { phone, code, newPassword } = req.body;

  try {
    if (!phone || !code || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Phone number, verification code, and new password are required"
      });
    }

    // Validate password strength
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long"
      });
    }

    const storedData = verificationCodes.get(phone);

    if (!storedData) {
      return res.status(400).json({
        success: false,
        message: "No verification code found. Please request a new one."
      });
    }

    // Check if code was verified
    if (!storedData.verified) {
      return res.status(400).json({
        success: false,
        message: "Please verify your code first"
      });
    }

    // Check if code is still valid
    if (new Date() > storedData.expiresAt) {
      verificationCodes.delete(phone);
      return res.status(400).json({
        success: false,
        message: "Verification code has expired. Please request a new one."
      });
    }

    // Verify code one more time
    if (storedData.code !== code) {
      return res.status(400).json({
        success: false,
        message: "Invalid verification code"
      });
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update user password
    await prisma.user.update({
      where: { id: storedData.userId },
      data: { password: hashedPassword }
    });

    // Clean up verification code
    verificationCodes.delete(phone);

    res.status(200).json({
      success: true,
      message: "Password reset successfully"
    });

  } catch (error) {
     res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// Clean up expired codes (should be run periodically)
exports.cleanupExpiredCodes = () => {
  const now = new Date();
  for (const [phone, data] of verificationCodes.entries()) {
    if (now > data.expiresAt) {
      verificationCodes.delete(phone);
    }
  }
};

// Set up periodic cleanup (run every 5 minutes)
setInterval(exports.cleanupExpiredCodes, 5 * 60 * 1000);