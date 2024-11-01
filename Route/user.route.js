const express = require("express");
const router = express.Router();
const { validate } = require("../Middleware/validator");
const { adminvalidator } = require("../Middleware/adminvalidator");
const { usersignup } = require("../Controller/user.controller");

router.post("/user/register", usersignup);
