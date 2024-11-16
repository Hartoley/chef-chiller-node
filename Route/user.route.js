const express = require("express");
const router = express.Router();
const { validate } = require("../Middleware/validator");
const { adminvalidator } = require("../Middleware/adminvalidator");
const {
  usersignup,
  getData,
  userlogin,
  getUserById,
} = require("../Controller/user.controller");

router.post("/user/register", usersignup);
router.post("/user/login", userlogin);
router.get("/user/getdata", getData);
router.get("/user/getuser/:id", getUserById);

module.exports = router;
