const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
require("dotenv").config();
const ejs = require("ejs");
const http = require("http");
const socketIo = require("socket.io");
const eventEmitter = require("./eventemmiter");

const userrouter = require("./Route/user.route");
const adminrouter = require("./Route/admin.route");

const app = express();

app.use(
  "/Uploads",
  (req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader("Cache-Control", "public, max-age=31536000");
    next();
  },
  express.static(path.join(__dirname, "Uploads"))
);

const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
    credentials: true,
  },
});

// Set EJS as the view engine
app.set("view engine", "ejs");

app.use(cors({ origin: "*" }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true, limit: "100mb" }));

app.use("/", userrouter);
app.use("/chefchiller", adminrouter);

// WebSocket connection handling
io.on("connection", (socket) => {
  console.log("A new client connected");

  // Emit a message to the connected client
  socket.emit("message", "Welcome to the WebSocket server");

  // Listen for events from the client
  socket.on("disconnect", () => {
    console.log("A client disconnected");
  });
});

eventEmitter.on("newProject", (project) => {
  console.log("Broadcasting new project to all clients:", project);
  io.emit("newProject", project);
});

eventEmitter.on("projectDeleted", (deletedProject) => {
  console.log("Broadcasting project deletion to all clients:", deletedProject);
  io.emit("projectDeleted", deletedProject);
});

eventEmitter.on("ordersRetrieved", (data) => {
  io.emit("ordersRetrieved", data);
  console.log("Received 'ordersFetched' event with data:", data);
});

eventEmitter.on("userFound", (data) => {
  io.emit("userFound", data);
  // console.log("Received 'user' event with data:", data);
});

// Database connection
const connect = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to database");
  } catch (error) {
    console.error("Database connection error:", error);
  }
};

// Start the server
const port = process.env.PORT || 5010;
connect()
  .then(() => {
    server.listen(port, () => {
      console.log(`App started at port ${port}`);
      console.log("EventEmitter:", eventEmitter);
    });
  })
  .catch((err) => {
    console.error("Failed to connect to the database:", err);
  });

// Emit events
eventEmitter.emit("serverStarted", { message: "Server has started" });

// Export the eventEmitter (optional, in case you need it in other modules)
module.exports = { io, eventEmitter };
