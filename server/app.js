const express = require("express");
const bodyparser = require("body-parser");
var cookieParser = require("cookie-parser");
const cors = require("cors");
require("dotenv").config();
const path = require("path");
const { Server } = require("socket.io");
const appRouter = require("./routes/index");
const http = require("http");
const jobScheduler = require("./jobs/scheduler");

const app = express();
const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: ["http://localhost:5173", "https://cms.macsoftautomations.in"],
    credentials: true,
  },
});

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      // Allow all origins in development
      return callback(null, true);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
    exposedHeaders: ["Set-Cookie"],
  })
);
app.use(express.json({ limit: "150mb" }));
app.use(express.urlencoded({ extended: false, limit: "150mb" }));
app.use(cookieParser());
app.get("/", (req, res) => {
  res.send("hello from backend");
});

app.use(
  "/uploads",
  express.static(process.env.UPLOAD_DIR || path.join(__dirname, "../uploads"))
);

app.use((req, res, next) => {
  req.io = io;
  next();
});

// Add static file serving for /api/uploads route as well
app.use(
  "/api/uploads",
  express.static(process.env.UPLOAD_DIR || path.join(__dirname, "../uploads"))
);

app.use("/api", appRouter);

// Socket.IO authentication middleware with proper JWT verification
const jwt = require('jsonwebtoken');
const { prisma } = require("./lib/clients");

io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;

    if (!token) {
      console.log("⚠️ No token provided for socket connection");
      return next(new Error("Authentication error: No token provided"));
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Fetch user from database to get current role and permissions
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        name: true,
        role: true,
        centerCode: true,
        State: { select: { id: true, name: true, stateCode: true } },
        states: { select: { id: true, name: true, stateCode: true } },
      }
    });

    if (!user) {
      console.log("❌ User not found for token:", decoded.id);
      return next(new Error("Authentication error: User not found"));
    }

    // Set user information on socket
    socket.userId = user.id;
    socket.userName = user.name;
    socket.userRole = user.role;
    socket.centerCode = user.centerCode;
    socket.userState = user.State;
    socket.assignedStates = user.states || [];

    console.log(`✅ Socket authenticated - User: ${user.name} (${user.role})`);
    next();
  } catch (error) {
    console.log("❌ Socket authentication error:", error.message);
    next(new Error("Authentication error: Invalid token"));
  }
});

io.on("connection", (socket) => {
  console.log(`✅ Socket connected - User: ${socket.userName} (${socket.userRole}) [${socket.id}]`);

  // Automatically join user-specific notification room
  const userNotificationRoom = `notifications-${socket.userId}`;
  socket.join(userNotificationRoom);
  console.log(`🔔 User ${socket.userName} joined notification room: ${userNotificationRoom}`);

  // Automatically join role-based rooms
  const roleRoom = `role-${socket.userRole}`;
  socket.join(roleRoom);
  console.log(`👥 User ${socket.userName} joined role room: ${roleRoom}`);

  // Join service center specific room for service center roles
  if ((socket.userRole === 'SERVICE_CENTER_TECHNICIAN' || socket.userRole === 'SERVICE_CENTER_HEAD') && socket.centerCode) {
    const centerRoom = `center-${socket.centerCode}`;
    socket.join(centerRoom);
    console.log(`🏢 User ${socket.userName} joined center room: ${centerRoom}`);
  }

  // Join state-based rooms for Customer Service Heads
  if (socket.userRole === 'CUSTOMER_SERVICE_HEAD') {
    // Join primary state room
    if (socket.userState) {
      const primaryStateRoom = `state-${socket.userState.stateCode}`;
      socket.join(primaryStateRoom);
      console.log(`🗺️ CSH ${socket.userName} joined primary state room: ${primaryStateRoom}`);
    }
    
    // Join assigned states rooms
    socket.assignedStates.forEach(state => {
      const stateRoom = `state-${state.stateCode}`;
      socket.join(stateRoom);
      console.log(`🗺️ CSH ${socket.userName} joined assigned state room: ${stateRoom}`);
    });
  }

  // Join Macsoft alerts room for buzzer alerts
  const MACSOFT_ROLES = ['MACSOFT_ADMIN', 'MACSOFT_HEAD', 'MACSOFT_SUPPORT'];
  if (MACSOFT_ROLES.includes(socket.userRole)) {
    socket.join('macsoft_alerts');
    console.log(`🚨 User ${socket.userName} joined Macsoft alerts room`);
  }

  // Handle conversation events with permission checks
  socket.on("join-conversation", async (ticketId) => {
    try {
      // Check if user has permission to access this ticket conversation
      const hasAccess = await checkTicketAccess(socket.userId, socket.userRole, ticketId, socket);
      if (hasAccess) {
        const room = `conversation-${ticketId}`;
        socket.join(room);
        console.log(`💬 User ${socket.userName} joined conversation: ${room}`);
      } else {
        socket.emit('error', { message: 'Access denied to this conversation' });
      }
    } catch (error) {
      socket.emit('error', { message: 'Error joining conversation' });
    }
  });

  socket.on("leave-conversation", (ticketId) => {
    const room = `conversation-${ticketId}`;
    socket.leave(room);
    console.log(`👋 User ${socket.userName} left conversation: ${room}`);
  });

  // Test notification event
  socket.on("send-test-notification", (data) => {
    console.log(`📧 User ${socket.userName} sending test notification:`, data);
    // Send to user's own notification room
    io.to(`notifications-${socket.userId}`).emit("notification", {
      id: Date.now(),
      type: data.type || "test",
      title: data.title || "Test Notification",
      message: data.message || "This is a test notification",
      timestamp: new Date().toISOString(),
      seen: false,
    });
  });

  // Test buzzer alert event  
  socket.on("send-test-buzzer", (data) => {
    if (!MACSOFT_ROLES.includes(socket.userRole)) {
      socket.emit('error', { message: 'Access denied: Only Macsoft roles can send buzzer alerts' });
      return;
    }
    
    console.log(`🧪 User ${socket.userName} sending test buzzer alert:`, data);
    const testBuzzerAlert = {
      type: 'CUSTOMER_RESPONSE_PENDING',
      timestamp: new Date().toISOString(),
      urgency: 'HIGH',
      title: 'Test Customer Response Alert',
      message: '1 test ticket has customer messages waiting for Macsoft response (1+ minute)',
      ticketId: 999,
      ticketCode: 'TKT-2025-TEST',
      hoursWaiting: 1,
      assignedTo: socket.userName,
      conversationId: 999,
      customerName: 'Test Customer'
    };
    
    // Send to macsoft_alerts room
    io.to('macsoft_alerts').emit('buzzer_alert', testBuzzerAlert);
    console.log(`✅ Test buzzer alert sent to macsoft_alerts room by ${socket.userName}`);
  });

  socket.on("disconnect", (reason) => {
    console.log(`❌ User ${socket.userName} disconnected [${socket.id}] - Reason: ${reason}`);
  });
});

// Helper function to check if user has access to a specific ticket
const checkTicketAccess = async (userId, userRole, ticketId, socket) => {
  try {
    const ticket = await prisma.ticket.findUnique({
      where: { id: parseInt(ticketId) },
      include: {
        createdByUser: {
          select: { stateId: true }
        }
      }
    });

    if (!ticket) return false;

    // Apply same RBAC logic as in ticket service
    if (userRole === "CUSTOMER_FIELD_ENGINEER") {
      return ticket.createdBy === userId;
    } else if (userRole === "SERVICE_CENTER_TECHNICIAN") {
      return ticket.assignedServiceCenter === socket.centerCode;
    } else if (userRole === "CUSTOMER_SERVICE_HEAD") {
      // Check if ticket creator's state is in CSH's allowed states
      const allowedStateIds = new Set();
      if (socket.userState?.id) allowedStateIds.add(socket.userState.id);
      socket.assignedStates.forEach(state => {
        if (state?.id) allowedStateIds.add(state.id);
      });
      return allowedStateIds.has(ticket.createdByUser?.stateId);
    } else {
      // MACSOFT roles have global access
      return ['MACSOFT_ADMIN', 'MACSOFT_HEAD', 'MACSOFT_SUPPORT'].includes(userRole);
    }
  } catch (error) {
    console.error('Error checking ticket access:', error);
    return false;
  }
};

const PORT = process.env.PORT || 4055;

httpServer.listen(PORT, () => {
/*   console.log(`Server running on port ${PORT}`);
  
  // Start the job scheduler after server starts
  setTimeout(() => {
    console.log('Starting background job scheduler...');
    jobScheduler.start(io); // Pass io object for buzzer alerts
  }, 3000); // Wait 3 seconds for database connections to be ready
 */});

module.exports = app;
