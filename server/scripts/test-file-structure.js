const fs = require('fs');
const path = require('path');

/**
 * Test script to verify ticket-specific file upload structure
 */
async function testTicketFileStructure() {
  console.log("🧪 Testing ticket-specific file upload structure...");
  
  const baseUploadDir = process.env.UPLOAD_DIR || path.join(__dirname, '../../uploads');
  
  // Test ticket codes
  const testTickets = [
    { code: 'TKT-001', hasConversations: true },
    { code: 'TKT-002', hasConversations: false },
  ];
  
  console.log(`📁 Base upload directory: ${baseUploadDir}`);
  
  for (const ticket of testTickets) {
    console.log(`\n📋 Testing ticket: ${ticket.code}`);
    
    // Create ticket directory
    const ticketDir = path.join(baseUploadDir, ticket.code);
    if (!fs.existsSync(ticketDir)) {
      fs.mkdirSync(ticketDir, { recursive: true });
      console.log(`✅ Created ticket directory: ${ticketDir}`);
    } else {
      console.log(`📁 Ticket directory exists: ${ticketDir}`);
    }
    
    // Test conversation directory if needed
    if (ticket.hasConversations) {
      const conversationDir = path.join(ticketDir, 'conversations');
      if (!fs.existsSync(conversationDir)) {
        fs.mkdirSync(conversationDir, { recursive: true });
        console.log(`✅ Created conversation directory: ${conversationDir}`);
      } else {
        console.log(`💬 Conversation directory exists: ${conversationDir}`);
      }
    }
    
    // Create test files
    const testFile = path.join(ticketDir, 'test-attachment.txt');
    fs.writeFileSync(testFile, `Test attachment for ${ticket.code}`);
    console.log(`📎 Created test file: ${testFile}`);
    
    if (ticket.hasConversations) {
      const testConversationFile = path.join(ticketDir, 'conversations', 'test-conversation.txt');
      fs.writeFileSync(testConversationFile, `Test conversation attachment for ${ticket.code}`);
      console.log(`💬 Created test conversation file: ${testConversationFile}`);
    }
  }
  
  console.log("\n🎉 Test structure creation completed!");
  console.log("\nDirectory structure:");
  
  // Show the created structure
  function showDirectory(dir, prefix = '') {
    if (!fs.existsSync(dir)) return;
    
    const items = fs.readdirSync(dir);
    items.forEach((item, index) => {
      const itemPath = path.join(dir, item);
      const isLast = index === items.length - 1;
      const connector = isLast ? '└── ' : '├── ';
      
      console.log(`${prefix}${connector}${item}`);
      
      if (fs.lstatSync(itemPath).isDirectory()) {
        const newPrefix = prefix + (isLast ? '    ' : '│   ');
        showDirectory(itemPath, newPrefix);
      }
    });
  }
  
  console.log(`📁 ${baseUploadDir}`);
  showDirectory(baseUploadDir);
}

// Clean up test files
function cleanupTestFiles() {
  console.log("\n🧹 Cleaning up test files...");
  
  const baseUploadDir = process.env.UPLOAD_DIR || path.join(__dirname, '../../uploads');
  const testTickets = ['TKT-001', 'TKT-002'];
  
  for (const ticketCode of testTickets) {
    const ticketDir = path.join(baseUploadDir, ticketCode);
    if (fs.existsSync(ticketDir)) {
      fs.rmSync(ticketDir, { recursive: true, force: true });
      console.log(`🗑️  Removed test directory: ${ticketDir}`);
    }
  }
  
  console.log("✅ Cleanup completed!");
}

// Run test if this file is executed directly
if (require.main === module) {
  testTicketFileStructure()
    .then(() => {
      console.log("\n✅ Test completed successfully");
      
      // Ask if user wants to clean up
      const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      readline.question('\nDo you want to clean up test files? (y/N): ', (answer) => {
        if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
          cleanupTestFiles();
        }
        readline.close();
        process.exit(0);
      });
    })
    .catch((error) => {
      console.error("❌ Test failed:", error);
      process.exit(1);
    });
}

module.exports = {
  testTicketFileStructure,
  cleanupTestFiles
};