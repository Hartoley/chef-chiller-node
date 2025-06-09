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
const axios = require('axios');
const { JSDOM } = require('jsdom');

async function decodeSecretMessage(docUrl) {
  try {
    console.log("Fetching Google Doc URL:", docUrl);

    // Fetch the document content
    const response = await axios.get(docUrl);
    console.log("Received response from Google Docs");

    // Parse the document content using JSDOM
    const dom = new JSDOM(response.data);
    const document = dom.window.document;
    const bodyText = document.body.textContent.trim();

    // Split the document into lines
    const lines = bodyText.split('\n').map(line => line.trim()).filter(line => line);

    let gridData = {};
    let maxX = 0, maxY = 0;

    // Process each line of the document
    for (let i = 0; i < lines.length; i += 3) {
      // Check if there are enough lines to extract data
      if (i + 2 < lines.length) {
        const x = parseInt(lines[i].trim(), 10);
        const char = lines[i + 1].trim();
        const y = parseInt(lines[i + 2].trim(), 10);

        // Store the character in the gridData object
        if (!gridData[y]) gridData[y] = {};
        gridData[y][x] = char;

        // Update the grid's boundaries
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      } else {
        console.warn("Skipping incomplete line set:", lines.slice(i, i + 3));
      }
    }

    // Construct the grid as a string
    let result = '';
    for (let y = 0; y <= maxY; y++) {
      let row = '';
      for (let x = 0; x <= maxX; x++) {
        row += gridData[y]?.[x] || ' ';  // Use space for empty spots
      }
      result += row + '\n';
    }

    // Print the decoded message (the grid of characters)
    console.log("Decoded message:\n", result);

  } catch (error) {
    console.error("Error decoding the message:", error);
  }
}

const googleDocUrl = 'https://docs.google.com/document/d/e/2PACX-1vRMx5YQlZNa3ra8dYYxmv-QIQ3YJe8tbI3kqcuC7lQiZm-CSEznKfN_HYNSpoXcZIV3Y_O3YoUB1ecq/pub'
decodeSecretMessage(googleDocUrl);




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

eventEmitter.on("ordersRetrievedByAdmin", (data) => {
  io.emit("ordersRetrievedByAdmin", data);
  console.log("Received 'ordersFetched' event with data:", data);
});

eventEmitter.on("ordersRetrieved", (data) => {
  io.emit("ordersRetrieved", data);
  console.log("Received 'ordersFetched' event with data:", data);
});

eventEmitter.on("orderApprovedByAdmin", (data) => {
  io.emit("orderApprovedByAdmin", data);
});
eventEmitter.on("orderDeclinedByAdmin", (data) => {
  io.emit("orderDeclinedByAdmin", data);
});

eventEmitter.on("userFound", (data) => {
  io.emit("userFound", data);
});

eventEmitter.on("ordersUpdated", (data) => {
  io.emit("ordersUpdated", data); // Emit to all connected clients
  console.log("ordersUpdated event emitted:", data);
});

eventEmitter.on("orderApproved", (data) => {
  io.emit("orderApproved", data);
});



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
