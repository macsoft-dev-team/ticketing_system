const { prisma } = require('./lib/clients');

(async () => {
  try {
     
    // Get all users
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        phone: true,
        role: true
      }
    });
    
 
    
     const macsoftUsers = allUsers.filter(u => ['MACSOFT_HEAD', 'MACSOFT_SUPPORT'].includes(u.role));
 
    
     const otherUsers = allUsers.filter(u => !['MACSOFT_HEAD', 'MACSOFT_SUPPORT'].includes(u.role));
 
    
    if (macsoftUsers.length === 0) {
     }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
})();
