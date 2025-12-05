const { PrismaClient } = require('../generated/prisma/client');
const prisma = new PrismaClient();

async function seedWorkingHoursConfiguration() {
  console.log('🕐 Seeding working hours configuration...');

  try {
    // Seed working hours (Monday to Friday: 9 AM to 6 PM)
    const workingHours = [
      { dayOfWeek: 1, startHour: 9, endHour: 18 }, // Monday
      { dayOfWeek: 2, startHour: 9, endHour: 18 }, // Tuesday
      { dayOfWeek: 3, startHour: 9, endHour: 18 }, // Wednesday
      { dayOfWeek: 4, startHour: 9, endHour: 18 }, // Thursday
      { dayOfWeek: 5, startHour: 9, endHour: 18 }, // Friday
      { dayOfWeek: 6, startHour: 0, endHour: 0 },  // Saturday (inactive)
      { dayOfWeek: 7, startHour: 0, endHour: 0 }   // Sunday (inactive)
    ];

    for (const hours of workingHours) {
      await prisma.workingHours.upsert({
        where: { dayOfWeek: hours.dayOfWeek },
        update: {
          startHour: hours.startHour,
          endHour: hours.endHour,
          isActive: hours.dayOfWeek <= 5 // Monday to Friday active
        },
        create: {
          dayOfWeek: hours.dayOfWeek,
          startHour: hours.startHour,
          endHour: hours.endHour,
          isActive: hours.dayOfWeek <= 5
        }
      });
    }

    console.log('✅ Working hours seeded successfully');

    // Seed break times
    const breakTimes = [
      {
        name: 'Morning Break',
        startHour: 11,
        startMinute: 0,
        endHour: 11,
        endMinute: 15
      },
      {
        name: 'Lunch Break',
        startHour: 13,
        startMinute: 0,
        endHour: 13,
        endMinute: 30
      },
      {
        name: 'Evening Break',
        startHour: 16,
        startMinute: 0,
        endHour: 16,
        endMinute: 15
      }
    ];

    for (const breakTime of breakTimes) {
      await prisma.breakTime.upsert({
        where: { name: breakTime.name },
        update: breakTime,
        create: breakTime
      });
    }

    console.log('✅ Break times seeded successfully');

    // Seed office holidays for 2025
    const holidays = [
      { name: 'New Year', date: new Date('2025-01-01'), description: 'New Year Day' },
      { name: 'Republic Day', date: new Date('2025-01-26'), description: 'Republic Day of India' },
      { name: 'Independence Day', date: new Date('2025-08-15'), description: 'Independence Day of India' },
      { name: 'Gandhi Jayanti', date: new Date('2025-10-02'), description: 'Gandhi Jayanti' },
      { name: 'Christmas', date: new Date('2025-12-25'), description: 'Christmas Day' }
    ];

    for (const holiday of holidays) {
      await prisma.officeHoliday.upsert({
        where: { date: holiday.date },
        update: {
          name: holiday.name,
          description: holiday.description,
          isActive: true
        },
        create: holiday
      });
    }

    console.log('✅ Office holidays seeded successfully');

  } catch (error) {
    console.error('❌ Error seeding working hours configuration:', error);
    throw error;
  }
}

async function main() {
  try {
    await seedWorkingHoursConfiguration();
    console.log('🎉 Working hours configuration seeded successfully!');
  } catch (error) {
    console.error('Failed to seed working hours configuration:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run if this script is executed directly
if (require.main === module) {
  main();
}

module.exports = { seedWorkingHoursConfiguration };