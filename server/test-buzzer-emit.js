const { io } = require('./app'); // Get io instance
const { prisma } = require('./lib/clients');

(async () => {
  try {
     
    // Get all MACSOFT users
    const macsoftUsers = await prisma.user.findMany({
      where: {
        role: {
          in: ['MACSOFT_HEAD', 'MACSOFT_SUPPORT']
        }
      }
    });
    
     
    const testAlert = {
      type: 'CUSTOMER_RESPONSE_PENDING',
      urgency: 'HIGH',
      title: 'TEST BUZZER ALERT',
      message: 'This is a test buzzer alert',
      ticketCode: 'TKT-2025-TEST',
      ticketId: 123,
      hoursWaiting: 2
    };
    
    // Emit to each user
    macsoftUsers.forEach(user => {
      const userRoom = `notifications-${user.id}`;
       
      if (io) {
        io.to(userRoom).emit('buzzer_alert', {
          ...testAlert,
          targetUser: {
            id: user.id,
            name: user.name,
            role: user.role
          }
        });
       } else {
       }
    });
    
     
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
    setTimeout(() => process.exit(0), 2000);
  }
})();
