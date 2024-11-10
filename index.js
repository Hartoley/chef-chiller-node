const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();
const ejs = require("ejs");
const userrouter = require("./Route/user.route");
const adminrouter = require("./Route/admin.route");

const app = express();

app.set("view engine", "ejs");

app.use(cors({ origin: "*" }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true, limit: "100mb" }));

app.use("/", userrouter);
app.use("/chefchiller", adminrouter);

const connect = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to database");
  } catch (error) {
    console.error("Database connection error:", error);
  }
};

const port = process.env.PORT || 5010;
connect()
  .then(() => {
    app.listen(port, () => {
      console.log(`App started at port ${port}`);
    });
  })
  .catch((err) => {
    console.error("Failed to connect to the database:", err);
  });
