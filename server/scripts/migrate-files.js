const { prisma } = require("../lib/clients");
const fs = require("fs");
const path = require("path");
const { generateTicketFileUrl } = require("../lib/ticket_file_handler");

/**
 * Migration script to move existing files to ticket-specific folders
 */
async function migrateFilesToTicketStructure() {
   
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

 
    const baseUploadDir = process.env.UPLOAD_DIR || path.join(__dirname, '../../uploads');
    let migratedCount = 0;
    let errorCount = 0;

    for (const attachment of attachments) {
      try {
        // Get ticket code from either direct ticket relation or message->ticket relation
        const ticketCode = attachment.ticket?.ticketCode || attachment.message?.ticket?.ticketCode;
        
        if (!ticketCode) {
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
           } else {
            // Move the file
            fs.renameSync(currentFilePath, newFilePath);
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

         migratedCount++;

      } catch (error) {
         errorCount++;
      }
    }
  } catch (error) {
     throw error;
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  migrateFilesToTicketStructure()
    .then(() => {
       process.exit(0);
    })
    .catch((error) => {
       process.exit(1);
    });
}

module.exports = {
  migrateFilesToTicketStructure
};