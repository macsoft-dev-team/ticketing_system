const { prisma } = require('./lib/clients');

(async () => {
  try {
    const config = await prisma.buzzerAlertConfig.findFirst();
    console.log('Current buzzer config in database:');
    console.log(JSON.stringify(config, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
})();
