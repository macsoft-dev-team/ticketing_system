const { prisma } = require("../lib/clients");
const fs = require("fs");
const path = require("path");
const { generateTicketFileUrl } = require("../lib/ticket_file_handler");

/**
 * Migration script to move existing files to ticket-specific folders
 */
async function migrateFilesToTicketStructure() {
  console.log("🚀 Starting file migration to ticket-specific structure...");
  
  try {
    // Get all attachments with their ticket information
    const attachments = await prisma.attachments.findMany({
      include: {
        ticket: {
          select: {
            ticketCode: true
          }
        },
        message: {
          include: {
            ticket: {
              select: {
                ticketCode: true
              }
            }
          }
        }
      }
    });

    console.log(`📄 Found ${attachments.length} attachments to migrate`);

    const baseUploadDir = process.env.UPLOAD_DIR || path.join(__dirname, '../../uploads');
    let migratedCount = 0;
    let errorCount = 0;

    for (const attachment of attachments) {
      try {
        // Get ticket code from either direct ticket relation or message->ticket relation
        const ticketCode = attachment.ticket?.ticketCode || attachment.message?.ticket?.ticketCode;
        
        if (!ticketCode) {
          console.log(`⚠️  Skipping attachment ${attachment.id} - no ticket code found`);
          continue;
        }

        // Determine if this is a conversation attachment or ticket attachment
        const isConversationAttachment = attachment.messageId && !attachment.ticket;
        const subfolder = isConversationAttachment ? 'conversations' : '';

        // Create current file path from existing fileUrl
        let currentFilePath;
        if (attachment.fileUrl.startsWith('/uploads/')) {
          const relativePath = attachment.fileUrl.substring('/uploads/'.length);
          currentFilePath = path.join(baseUploadDir, relativePath);
        } else {
          currentFilePath = path.join(baseUploadDir, attachment.fileUrl);
        }

        // Check if file exists
        if (!fs.existsSync(currentFilePath)) {
          console.log(`❌ File not found: ${currentFilePath}`);
          errorCount++;
          continue;
        }

        // Create new directory structure
        let newDir = path.join(baseUploadDir, ticketCode);
        if (subfolder) {
          newDir = path.join(newDir, subfolder);
        }

        if (!fs.existsSync(newDir)) {
          fs.mkdirSync(newDir, { recursive: true });
        }

        // Extract filename from current path
        const filename = path.basename(currentFilePath);
        const newFilePath = path.join(newDir, filename);

        // Move file if it's not already in the correct location
        if (currentFilePath !== newFilePath) {
          // Check if target file already exists
          if (fs.existsSync(newFilePath)) {
            console.log(`⚠️  Target file already exists: ${newFilePath}`);
          } else {
            // Move the file
            fs.renameSync(currentFilePath, newFilePath);
            console.log(`📁 Moved: ${currentFilePath} -> ${newFilePath}`);
          }
        }

        // Update database with new file URL
        const newFileUrl = generateTicketFileUrl(ticketCode, filename, subfolder);
        await prisma.attachments.update({
          where: { id: attachment.id },
          data: {
            fileUrl: newFileUrl
          }
        });

        console.log(`✅ Updated attachment ${attachment.id} URL: ${newFileUrl}`);
        migratedCount++;

      } catch (error) {
        console.error(`❌ Error migrating attachment ${attachment.id}:`, error.message);
        errorCount++;
      }
    }

    console.log(`\n📊 Migration Summary:`);
    console.log(`✅ Successfully migrated: ${migratedCount} files`);
    console.log(`❌ Errors: ${errorCount} files`);
    console.log(`📁 Total processed: ${attachments.length} attachments`);
    console.log(`🎉 Migration completed!`);

  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  migrateFilesToTicketStructure()
    .then(() => {
      console.log("✅ Migration script completed successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Migration script failed:", error);
      process.exit(1);
    });
}

module.exports = {
  migrateFilesToTicketStructure
};