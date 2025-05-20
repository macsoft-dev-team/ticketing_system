const express = require("express");
const bodyparser = require("body-parser");
var cookieParser = require("cookie-parser");
const cors = require("cors");
require("dotenv").config();
const path = require("path");
const { Server } = require("socket.io");
const appRouter = require("./routes/index");
const http = require("http");
const setupSwagger = require("./swagger/swaggerConfig");

const app = express();
const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: ["http://localhost:5173", "https://cms2.macsoftautomations.in"]
  },
});

setupSwagger(app);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.get("/", (req, res) => {
  res.send("hello from backend");
});

app.use("/uploads", express.static(path.join(__dirname, "uploads")));


app.use((req, res, next) => {
  req.io = io;
  next();
});

app.use("/api", appRouter);
 
io.on("connection", (socket) => {
  console.log("✅ Socket connected:", socket.id);

  socket.onAny((event, ...args) => {
    console.log(`📨 Received client event: ${event}`, args);
  });

  socket.on("disconnect", () => {
    console.log("❌ Socket disconnected:", socket.id);
  });
});


const PORT = process.env.PORT || 8080;

io.on("connection", (socket) => {
  console.log("✅ Client connected:", socket.id);
});

httpServer.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
});

module.exports = app;