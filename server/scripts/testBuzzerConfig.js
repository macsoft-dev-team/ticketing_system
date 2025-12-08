const { prisma } = require("../lib/clients");

/**
 * Test buzzer alert configuration
 */
async function testBuzzerConfig() {
  try {
    console.log('🧪 Testing Buzzer Alert Configuration...\n');
    
    // Fetch current configuration
    const config = await prisma.buzzerAlertConfig.findFirst({
      where: { isActive: true },
      orderBy: { updatedAt: 'desc' }
    });
    
    if (!config) {
      console.log('❌ No active configuration found!');
      return;
    }
    
    console.log('✅ Current Configuration:');
    console.log('─────────────────────────────────────────');
    console.log(`📋 Config ID: ${config.id}`);
    console.log(`⏱️  Min Time: ${config.minHours}h ${config.minMinutes}m ${config.minSeconds}s`);
    console.log(`⏱️  Max Time: ${config.maxHours}h ${config.maxMinutes}m ${config.maxSeconds}s`);
    console.log(`🔔 Active: ${config.isActive ? 'Yes' : 'No'}`);
    console.log(`📝 Description: ${config.description}`);
    console.log(`📅 Created At: ${config.createdAt.toISOString()}`);
    console.log(`📅 Updated At: ${config.updatedAt.toISOString()}`);
    console.log('─────────────────────────────────────────\n');
    
    // Calculate time windows
    const now = new Date();
    const minTotalMs = (config.minHours * 3600 + config.minMinutes * 60 + config.minSeconds) * 1000;
    const maxTotalMs = (config.maxHours * 3600 + config.maxMinutes * 60 + config.maxSeconds) * 1000;
    const minTimeAgo = new Date(now.getTime() - minTotalMs);
    const maxTimeAgo = new Date(now.getTime() - maxTotalMs);
    
    console.log('🕐 Time Window Calculation:');
    console.log('─────────────────────────────────────────');
    console.log(`🕐 Current Time: ${now.toISOString()}`);
    console.log(`📍 Alert Window Start: ${maxTimeAgo.toISOString()}`);
    console.log(`   (${config.maxHours}h ${config.maxMinutes}m ${config.maxSeconds}s ago)`);
    console.log(`📍 Alert Window End: ${minTimeAgo.toISOString()}`);
    console.log(`   (${config.minHours}h ${config.minMinutes}m ${config.minSeconds}s ago)`);
    console.log('─────────────────────────────────────────\n');
    
    console.log('💡 Buzzer alerts will trigger for messages between:');
    console.log(`   ${maxTimeAgo.toLocaleString()} to ${minTimeAgo.toLocaleString()}`);
    console.log(`   (${config.minHours}h ${config.minMinutes}m ${config.minSeconds}s to ${config.maxHours}h ${config.maxMinutes}m ${config.maxSeconds}s old)\n`);
    
    console.log('✅ Configuration test completed successfully!\n');
    
  } catch (error) {
    console.error('❌ Error testing buzzer config:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  testBuzzerConfig()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Test failed:', error);
      process.exit(1);
    });
}

module.exports = { testBuzzerConfig };
