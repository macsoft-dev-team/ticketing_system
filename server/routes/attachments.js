const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const authenticate = require("../middleware/authenticate");
const { prisma } = require("../lib/clients");

// Route to serve attachment files with proper headers
router.get("/download/:attachmentId", authenticate, async (req, res) => {
  try {
    const { attachmentId } = req.params;

    // Find the attachment in database
    const attachment = await prisma.attachments.findUnique({
      where: { id: parseInt(attachmentId) },
    });

    if (!attachment) {
      return res.status(404).json({ message: "Attachment not found" });
    }

    // Construct file path - handle both old and new file structure
    let filePath;
    if (attachment.fileUrl.startsWith("/uploads/")) {
      // Remove the leading /uploads/ from the URL to get the relative path
      const relativePath = attachment.fileUrl.substring("/uploads/".length);
      const baseDir =
        process.env.UPLOAD_DIR || path.join(__dirname, "../../uploads");
      filePath = path.join(baseDir, relativePath);
    } else {
      // Fallback for old structure
      const baseDir =
        process.env.UPLOAD_DIR || path.join(__dirname, "../../uploads");
      filePath = path.join(baseDir, attachment.fileUrl);
    }

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "File not found on server" });
    }

    // Set appropriate headers for download
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${attachment.fileName}"`
    );
    res.setHeader("Content-Type", attachment.fileType);
    res.setHeader("Content-Length", attachment.fileSize);

    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
});

// Route to get attachment metadata
router.get("/info/:attachmentId", authenticate, async (req, res) => {
  try {
    const { attachmentId } = req.params;

    const attachment = await prisma.attachments.findUnique({
      where: { id: parseInt(attachmentId) },
      select: {
        id: true,
        fileName: true,
        fileType: true,
        fileSize: true,
        createdAt: true,
        message: {
          select: {
            id: true,
            ticketId: true,
          },
        },
        ticket: {
          select: {
            id: true,
            ticketCode: true,
          },
        },
      },
    });

    if (!attachment) {
      return res.status(404).json({ message: "Attachment not found" });
    }

    res.json(attachment);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
