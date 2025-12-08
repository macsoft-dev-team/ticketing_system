const { prisma } = require("../lib/clients");

/**
 * Seed the buzzer alert configuration with default values
 */
async function seedBuzzerConfig() {
  try {
    console.log('🔧 Seeding buzzer alert configuration...');
    
    // Check if configuration already exists
    const existingConfig = await prisma.buzzerAlertConfig.findFirst();
    
    if (existingConfig) {
      console.log('✅ Buzzer alert configuration already exists:');
      console.log(`   - Min Time: ${existingConfig.minHours}h ${existingConfig.minMinutes}m ${existingConfig.minSeconds}s`);
      console.log(`   - Max Time: ${existingConfig.maxHours}h ${existingConfig.maxMinutes}m ${existingConfig.maxSeconds}s`);
      console.log(`   - Active: ${existingConfig.isActive}`);
      return existingConfig;
    }
    
    // Create default configuration
    const config = await prisma.buzzerAlertConfig.create({
      data: {
        minHours: 3,
        minMinutes: 0,
        minSeconds: 0,
        maxHours: 5,
        maxMinutes: 0,
        maxSeconds: 0,
        isActive: true,
        description: 'Default buzzer alert configuration - triggers alerts for customer messages pending response between 3-5 hours'
      }
    });
    
    console.log('✅ Created default buzzer alert configuration:');
    console.log(`   - Config ID: ${config.id}`);
    console.log(`   - Min Time: ${config.minHours}h ${config.minMinutes}m ${config.minSeconds}s`);
    console.log(`   - Max Time: ${config.maxHours}h ${config.maxMinutes}m ${config.maxSeconds}s`);
    console.log(`   - Active: ${config.isActive}`);
    console.log(`   - Description: ${config.description}`);
    
    return config;
    
  } catch (error) {
    console.error('❌ Error seeding buzzer config:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  seedBuzzerConfig()
    .then(() => {
      console.log('✅ Buzzer config seeding completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Buzzer config seeding failed:', error);
      process.exit(1);
    });
}

module.exports = { seedBuzzerConfig };
