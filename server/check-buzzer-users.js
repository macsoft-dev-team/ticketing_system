const { prisma } = require('./lib/clients');

(async () => {
  try {
    console.log('🔍 Checking users eligible for buzzer alerts...\n');
    
    // Get all users
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        phone: true,
        role: true
      }
    });
    
    console.log('📊 All users in system:');
    allUsers.forEach(u => {
      console.log(`  - ${u.name} (${u.phone}) - Role: ${u.role} - ID: ${u.id}`);
    });
    
    console.log('\n🔔 Users eligible for buzzer alerts (MACSOFT_HEAD, MACSOFT_SUPPORT):');
    const macsoftUsers = allUsers.filter(u => ['MACSOFT_HEAD', 'MACSOFT_SUPPORT'].includes(u.role));
    macsoftUsers.forEach(u => {
      console.log(`  ✅ ${u.name} (${u.phone}) - ${u.role} - Room: notifications-${u.id}`);
    });
    
    console.log('\n🚫 Users NOT eligible (MACSOFT_ADMIN and others):');
    const otherUsers = allUsers.filter(u => !['MACSOFT_HEAD', 'MACSOFT_SUPPORT'].includes(u.role));
    otherUsers.forEach(u => {
      console.log(`  ❌ ${u.name} (${u.phone}) - ${u.role}`);
    });
    
    if (macsoftUsers.length === 0) {
      console.log('\n⚠️  WARNING: No users found with MACSOFT_HEAD or MACSOFT_SUPPORT roles!');
      console.log('   Buzzer alerts will not be sent to anyone.');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
})();
