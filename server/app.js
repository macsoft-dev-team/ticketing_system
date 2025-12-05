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

// Socket.IO authentication middleware - More flexible for development
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
 

    // Allow connection without token for development/testing
    // In production, you should enforce token validation
    if (!token) {
      // console.log("⚠️ No token provided - allowing connection for development");
      socket.userId = "anonymous-user";
      return next();
    }

    // Here you could verify the JWT token if needed
    // For now, we'll just check if token exists
    // // console.log("✅ Socket authentication successful");
    socket.userId = "authenticated-user"; // You can set actual user ID after JWT verification
    next();
  } catch (error) {
    // console.log("❌ Socket authentication error:", error.message);
    // Allow connection even if there's an auth error for development
    socket.userId = "fallback-user";
    next();
  }
});

io.on("connection", (socket) => {
  // console.log("✅ Socket.IO client connected:", socket.id);
  // console.log("👤 Authenticated user:", socket.userId);

  // Listen for all events for debugging
  socket.onAny((event, ...args) => {
    // console.log(`📨 Received Socket.IO event: ${event}`, args);
  });

  // Handle conversation events
  socket.on("join-conversation", (ticketId) => {
    const room = `conversation-${ticketId}`;
    socket.join(room);
    // console.log(`👥 Socket ${socket.id} joined conversation room: ${room}`);
  });

  socket.on("leave-conversation", (ticketId) => {
    const room = `conversation-${ticketId}`;
    socket.leave(room);
    // console.log(`👋 Socket ${socket.id} left conversation room: ${room}`);
  });

  // Handle notification events
  socket.on("join-notifications", (userId) => {
    const room = `notifications-${userId}`;
    socket.join(room);
    // console.log(`🔔 Socket ${socket.id} joined notifications room: ${room}`);
  });

  socket.on("leave-notifications", (userId) => {
    const room = `notifications-${userId}`;
    socket.leave(room);
    // console.log(`🔕 Socket ${socket.id} left notifications room: ${room}`);
  });

  // Handle Macsoft alerts room (for buzzer alerts)
  socket.on("join-macsoft-alerts", (userRole) => {
    if (['MACSOFT_ADMIN', 'MACSOFT_HEAD', 'MACSOFT_SUPPORT'].includes(userRole)) {
      socket.join('macsoft_alerts');
      // console.log(`🚨 Socket ${socket.id} joined Macsoft alerts room`);
    }
  });

  socket.on("leave-macsoft-alerts", () => {
    socket.leave('macsoft_alerts');
    // console.log(`🚨 Socket ${socket.id} left Macsoft alerts room`);
  });

  // Test notification event
  socket.on("send-test-notification", (data) => {
    // console.log(`📧 Sending test notification:`, data);
    // Broadcast to all connected clients for now
    io.emit("notification", {
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
    console.log(`🧪 Sending test buzzer alert:`, data);
    const testBuzzerAlert = {
      type: 'CUSTOMER_RESPONSE_PENDING',
      timestamp: new Date().toISOString(),
      urgency: 'HIGH',
      title: 'Test Customer Response Alert',
      message: '1 test ticket has customer messages waiting for Macsoft response (1+ minute)',
      ticketId: 999,
      ticketCode: 'TKT-2025-TEST',
      hoursWaiting: 1,
      assignedTo: 'Test User',
      conversationId: 999,
      customerName: 'Test Customer'
    };
    
    // Send to macsoft_alerts room
    io.to('macsoft_alerts').emit('buzzer_alert', testBuzzerAlert);
    console.log(`✅ Test buzzer alert sent to macsoft_alerts room`);
  });

  socket.on("disconnect", (reason) => {
   /*  console.log(
      "❌ Socket.IO client disconnected:",
      socket.id,
      "Reason:",
      reason
    ); */
  });
});

const PORT = process.env.PORT || 4055;

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  
  // Start the job scheduler after server starts
  setTimeout(() => {
    console.log('Starting background job scheduler...');
    jobScheduler.start(io); // Pass io object for buzzer alerts
  }, 3000); // Wait 3 seconds for database connections to be ready
});

module.exports = app;
