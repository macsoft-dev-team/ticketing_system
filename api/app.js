const express = require("express");
const bodyparser = require("body-parser");
const cors = require("cors");
require("dotenv").config();
const path = require("path");
const { Server } = require("socket.io");
const appRouter = require("./routes/index");
const http = require("http");
const setupSwagger = require('./swagger/swaggerConfig');
const app = express();
const httpServer =http.createServer(app);
const io = new Server(http, {
  cors: {
    origin: [
      "http://localhost:5173",
     ],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

setupSwagger(app);

app.use(cors());
app.use(express.json());
app.use(bodyparser.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.send("hello from backend");
});

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api", appRouter);

app.use((req, res, next) => {
  req.io = io;
  next();
});

const PORT = process.env.PORT || 8080;
httpServer.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
});
