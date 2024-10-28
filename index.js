const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();
const ejs = require("ejs");
app.set("view engine", "ejs");
app.use(bodyParser.json());
app.use(cors({ origin: "*" }));
app.use(bodyParser.urlencoded({ extended: true, limit: "100mb" }));
const multer = require("multer");
const { createProxyMiddleware } = require("http-proxy-middleware");

const port = process.env.PORT || 5010;
const uri = process.env.MONGODB_URI;

const connect = async () => {
  try {
    const connected = await mongoose.connect(uri);
    if (connected) {
      console.log("connected to database");
    }
  } catch (error) {
    console.log(error);
  }
};
connect();

app.listen(port, () => {
  console.log("app started at port" + port);
});
