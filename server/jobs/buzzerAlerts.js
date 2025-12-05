const { prisma } = require("../lib/clients");

// Define Macsoft roles (internal users) - excludes MACSOFT_ADMIN
const MACSOFT_ROLES = [
  'MACSOFT_HEAD', 
  'MACSOFT_SUPPORT'
];

/**
 * Check if current time is within working hours using database configuration
 * Excludes weekends, office holidays, and break times from database
 * Converts UTC to IST timezone
 */
const isWithinWorkingHours = async () => {
  try {
    // Get current time in IST timezone
    const nowUTC = new Date();
    const nowIST = new Date(nowUTC.toLocaleString("en-US", {timeZone: "Asia/Kolkata"}));
    
    const dayOfWeek = nowIST.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    const hour = nowIST.getHours();
    const minutes = nowIST.getMinutes();
    const today = new Date(nowIST.getFullYear(), nowIST.getMonth(), nowIST.getDate()); // Today at midnight in IST
    
    console.log(`🕐 Current IST time: ${nowIST.toLocaleString('en-IN', {timeZone: 'Asia/Kolkata', hour12: true})} (UTC: ${nowUTC.toISOString()})`);
    console.log(`📅 Checking working hours for ${getDayName(dayOfWeek)} at ${hour}:${minutes.toString().padStart(2, '0')}`);
    
    // Convert day of week (0=Sunday, 1=Monday...) to our format (1=Monday, 7=Sunday)
    const dbDayOfWeek = dayOfWeek === 0 ? 7 : dayOfWeek;
    
    // Check working hours for current day
    const workingHours = await prisma.workingHours.findUnique({
      where: { dayOfWeek: dbDayOfWeek }
    });
    
    if (!workingHours || !workingHours.isActive) {
      console.log(`🚫 Not sending buzzer alert - Non-working day (${getDayName(dayOfWeek)})`);
      return false;
    }
    
    // Check if within working hours
    if (hour < workingHours.startHour || hour >= workingHours.endHour) {
      console.log(`🚫 Not sending buzzer alert - Outside working hours (IST ${hour}:${minutes.toString().padStart(2, '0')}) - Working hours: ${workingHours.startHour}:00-${workingHours.endHour}:00`);
      return false;
    }
    
    // Check for office holidays (convert IST date to UTC for database query)
    const todayUTC = new Date(today.getTime() - (5.5 * 60 * 60 * 1000)); // Convert IST to UTC
    const tomorrowUTC = new Date(todayUTC.getTime() + 24 * 60 * 60 * 1000);
    
    const holidayToday = await prisma.officeHoliday.findFirst({
      where: {
        date: {
          gte: todayUTC,
          lt: tomorrowUTC
        },
        isActive: true
      }
    });
    
    if (holidayToday) {
      console.log(`🚫 Not sending buzzer alert - Office Holiday (${holidayToday.name})`);
      return false;
    }
    
    // Check for break times
    const activeBreakTimes = await prisma.breakTime.findMany({
      where: { isActive: true }
    });
    
    for (const breakTime of activeBreakTimes) {
      const breakStart = breakTime.startHour * 100 + breakTime.startMinute;
      const breakEnd = breakTime.endHour * 100 + breakTime.endMinute;
      const currentTime = hour * 100 + minutes;
      
      if (currentTime >= breakStart && currentTime <= breakEnd) {
        console.log(`🚫 Not sending buzzer alert - ${breakTime.name} (IST ${breakTime.startHour}:${breakTime.startMinute.toString().padStart(2, '0')}-${breakTime.endHour}:${breakTime.endMinute.toString().padStart(2, '0')})`);
        return false;
      }
    }
    
    console.log(`✅ Within working hours - IST ${nowIST.toLocaleString('en-IN', {timeZone: 'Asia/Kolkata', hour12: true})} (${getDayName(dayOfWeek)}, ${hour}:${minutes.toString().padStart(2, '0')})`);
    return true;
    
  } catch (error) {
    console.error('Error checking working hours:', error);
    // Fallback to basic check if database fails (using IST)
    const nowUTC = new Date();
    const nowIST = new Date(nowUTC.toLocaleString("en-US", {timeZone: "Asia/Kolkata"}));
    const dayOfWeek = nowIST.getDay();
    const hour = nowIST.getHours();
    
    if (dayOfWeek === 0 || dayOfWeek === 6) return false; // Weekend
    if (hour < 9 || hour >= 18) return false; // Outside 9-6 IST
    
    console.log(`⚠️ Using fallback working hours check - IST ${hour}:${nowIST.getMinutes().toString().padStart(2, '0')}`);
    return true;
  }
};

/**
 * Helper function to get day name
 */
const getDayName = (dayOfWeek) => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[dayOfWeek];
};

// Define Customer roles (external users)
const CUSTOMER_ROLES = [
  'CUSTOMER_SERVICE_HEAD',
  'SERVICE_CENTER_TECHNICIAN',
  'CUSTOMER_FIELD_ENGINEER'
];

/**
 * Find tickets where customers messaged last but no Macsoft response within 3 hours
 */
const checkPendingCustomerMessages = async (io = null) => {
  try {
    console.log(`🔔 [${new Date().toISOString()}] Checking for pending customer messages...`);
    
    // Check if we're within working hours
    if (!(await isWithinWorkingHours())) {
      return {
        success: true,
        pendingCount: 0,
        tickets: [],
        skippedReason: 'Outside working hours or holiday'
      };
    }
    
    // Get current timestamp, 3 hours ago (lower bound) and 5 hours ago (upper bound)
    const now = new Date();
    const threeHoursAgo = new Date(now.getTime() - 3 * 60 * 60 * 1000);
    const fiveHoursAgo = new Date(now.getTime() - 5 * 60 * 60 * 1000);
    
    console.log(`🔔 Looking for messages between 3-5 hours old: ${fiveHoursAgo.toISOString()} to ${threeHoursAgo.toISOString()}`);
    
    // Find open/in-progress tickets that have messages
    const candidateTickets = await prisma.ticket.findMany({
      where: {
        status: {
          in: ['OPEN', 'IN_PROGRESS']
        },
        messages: {
          some: {} // Has at least one message
        }
      },
      include: {
        messages: {
          include: {
            sender: {
              select: {
                id: true,
                role: true,
                name: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
        createdByUser: {
          select: {
            id: true,
            name: true
          }
        },
        serviceCenter: {
          select: {
            name: true,
            centerCode: true
          }
        }
      }
    });

    console.log(`Found ${candidateTickets.length} candidate tickets to check for pending responses`);
    
    const pendingTickets = [];
    
    for (const ticket of candidateTickets) {
      if (ticket.messages.length === 0) continue;
      
      // Get the last message
      const lastMessage = ticket.messages[0];
      
      // Check if last message was from a customer user
      const isLastMessageFromCustomer = CUSTOMER_ROLES.includes(lastMessage.sender.role);
      
      if (!isLastMessageFromCustomer) continue;
      
      // Check if the last message is between 3-5 hours old (skip if newer than 3 hours or older than 5 hours)
      const isWithinTimeWindow = lastMessage.createdAt < threeHoursAgo && lastMessage.createdAt >= fiveHoursAgo;
      
      if (!isWithinTimeWindow) {
        if (lastMessage.createdAt >= threeHoursAgo) {
          console.log(`⏳ Skipping ticket ${ticket.ticketCode} - message too recent (less than 3 hours)`);
        } else if (lastMessage.createdAt < fiveHoursAgo) {
          console.log(`⏰ Skipping ticket ${ticket.ticketCode} - message too old (more than 5 hours)`);
        }
        continue;
      }
      
      // Check if there are any Macsoft messages after the last customer message
      const hasMacsoftResponseAfterCustomer = ticket.messages.some(message => {
        return MACSOFT_ROLES.includes(message.sender.role) && 
               message.createdAt > lastMessage.createdAt;
      });
      
      if (hasMacsoftResponseAfterCustomer) continue;
      
      // This ticket qualifies for buzzer alert
      const secondsSince = Math.round((now - lastMessage.createdAt) / 1000);
      const hoursSince = Math.round((now - lastMessage.createdAt) / (1000 * 60 * 60));
      
      pendingTickets.push({
        ticket,
        lastMessage,
        secondsSinceLastMessage: secondsSince,
        hoursSinceLastMessage: hoursSince
      });
      
      console.log(`🚨 Pending response needed for ticket: ${ticket.ticketCode} - Last customer message from ${lastMessage.sender.name} at ${lastMessage.createdAt} (${secondsSince} seconds ago)`);
    }
    
    console.log(`🔔 Found ${pendingTickets.length} tickets needing Macsoft response`);
    
    // Trigger buzzer alerts if we have pending tickets and io is available
    if (pendingTickets.length > 0 && io) {
      console.log(`🚨 Triggering buzzer alerts for ${pendingTickets.length} tickets...`);
      await triggerBuzzerAlerts(pendingTickets, io);
    } else if (pendingTickets.length > 0 && !io) {
      console.log(`⚠️  Found ${pendingTickets.length} pending tickets but no Socket.IO instance available`);
    } else {
      console.log(`✅ No pending tickets found - no buzzer alerts needed`);
    }
    
    return {
      success: true,
      pendingCount: pendingTickets.length,
      tickets: pendingTickets.map(p => ({
        ticketCode: p.ticket.ticketCode,
        customerName: p.ticket.customerName,
        lastMessageFrom: p.lastMessage.sender.name,
        secondsSinceLastMessage: p.secondsSinceLastMessage,
        hoursSinceLastMessage: p.hoursSinceLastMessage,
        serviceCenter: p.ticket.serviceCenter?.name || 'Unassigned'
      }))
    };
    
  } catch (error) {
    console.error('Error checking pending customer messages:', error);
    throw error;
  }
};

/**
 * Trigger buzzer alerts to Macsoft users
 */
const triggerBuzzerAlerts = async (pendingTickets, io) => {
  try {
    console.log(`Triggering buzzer alerts for ${pendingTickets.length} pending tickets...`);
    
    // Get all active Macsoft users
    const macsoftUsers = await prisma.user.findMany({
      where: {
        role: { in: MACSOFT_ROLES },
        isActive: true
      },
      select: {
        id: true,
        name: true,
        role: true
      }
    });
    
    console.log(`Found ${macsoftUsers.length} active Macsoft users to notify`);
    
    // Create buzzer alert data
    const buzzerAlert = {
      type: 'CUSTOMER_RESPONSE_PENDING',
      timestamp: new Date().toISOString(),
      urgency: 'HIGH',
      title: 'Customer Messages Pending Response',
      message: `${pendingTickets.length} tickets have customer messages waiting for Macsoft response (3+ hours)`,
      tickets: pendingTickets.map(p => ({
        ticketCode: p.ticket.ticketCode,
        customerName: p.ticket.customerName,
        description: p.ticket.description.substring(0, 100) + '...',
        lastMessageFrom: p.lastMessage.sender.name,
        lastMessageRole: p.lastMessage.sender.role,
        secondsSinceLastMessage: p.secondsSinceLastMessage,
        hoursSinceLastMessage: p.hoursSinceLastMessage,
        lastMessagePreview: p.lastMessage.content.substring(0, 150) + '...',
        serviceCenter: p.ticket.serviceCenter?.name || 'Unassigned',
        priority: p.ticket.priority || 'Normal'
      })),
      actionRequired: 'Please respond to pending customer messages',
      sound: {
        enabled: true,
        type: 'urgent',
        duration: 5000, // 5 seconds
        repeat: 3
      }
    };
    
    // Send buzzer alert to all Macsoft users via Socket.IO
    console.log(`🚨 Sending buzzer alerts to ${macsoftUsers.length} Macsoft users...`);
    
    macsoftUsers.forEach(user => {
      const userRoom = `notifications-${user.id}`;
      console.log(`📤 Sending to user room: ${userRoom} (${user.name} - ${user.role})`);
      
      io.to(userRoom).emit('buzzer_alert', {
        ...buzzerAlert,
        ticketId: pendingTickets[0]?.ticket?.id,
        ticketCode: pendingTickets[0]?.ticket?.ticketCode,
        hoursWaiting: pendingTickets[0]?.hoursSinceLastMessage || 0,
        targetUser: {
          id: user.id,
          name: user.name,
          role: user.role
        }
      });
    });
    
    console.log(`✅ Buzzer alerts sent to ${macsoftUsers.length} Macsoft users (excluding MACSOFT_ADMIN)`);
    
    // Log the alert for monitoring
    await logBuzzerAlert(pendingTickets, macsoftUsers.length);
    
  } catch (error) {
    console.error('Error triggering buzzer alerts:', error);
    throw error;
  }
};

/**
 * Log buzzer alert for monitoring and analytics
 */
const logBuzzerAlert = async (pendingTickets, notifiedUserCount) => {
  try {
    // Create a log entry (you might want to create a BuzzerLog model in your schema)
    const logEntry = {
      timestamp: new Date(),
      alertType: 'CUSTOMER_RESPONSE_PENDING',
      ticketCount: pendingTickets.length,
      notifiedUserCount,
      tickets: pendingTickets.map(p => p.ticket.ticketCode).join(', '),
      details: JSON.stringify(pendingTickets.map(p => ({
        ticketCode: p.ticket.ticketCode,
        hoursSinceLastMessage: p.hoursSinceLastMessage,
        customerName: p.ticket.customerName
      })))
    };
    
    // For now, just log to console (you can extend this to database logging)
    console.log('Buzzer Alert Log:', logEntry);
    
    // Optional: Store in database if you create a BuzzerLog table
    // await prisma.buzzerLog.create({ data: logEntry });
    
  } catch (error) {
    console.error('Error logging buzzer alert:', error);
  }
};

/**
 * Get tickets that are candidates for buzzer alerts (for monitoring)
 */
const getCandidateTicketsForBuzzer = async () => {
  try {
    const now = new Date();
    const threeHoursAgo = new Date(now.getTime() - (3 * 60 * 60 * 1000));
    
    const candidates = await prisma.ticket.findMany({
      where: {
        status: {
          in: ['OPEN', 'IN_PROGRESS']
        },
        messages: {
          some: {
            createdAt: {
              lt: threeHoursAgo
            },
            sender: {
              role: {
                in: CUSTOMER_ROLES
              }
            }
          }
        }
      },
      include: {
        messages: {
          include: {
            sender: {
              select: {
                id: true,
                role: true,
                name: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 3 // Get last 3 messages for analysis
        }
      }
    });
    
    return candidates.filter(ticket => {
      const lastMessage = ticket.messages[0];
      if (!lastMessage) return false;
      
      const isLastFromCustomer = CUSTOMER_ROLES.includes(lastMessage.sender.role);
      if (!isLastFromCustomer) return false;
      
      const hasMacsoftResponseAfter = ticket.messages.some(msg => 
        MACSOFT_ROLES.includes(msg.sender.role) && msg.createdAt > lastMessage.createdAt
      );
      
      return !hasMacsoftResponseAfter;
    });
    
  } catch (error) {
    console.error('Error getting candidate tickets for buzzer:', error);
    throw error;
  }
};

module.exports = {
  checkPendingCustomerMessages,
  getCandidateTicketsForBuzzer,
  triggerBuzzerAlerts,
  isWithinWorkingHours,
  getDayName,
  MACSOFT_ROLES,
  CUSTOMER_ROLES
};