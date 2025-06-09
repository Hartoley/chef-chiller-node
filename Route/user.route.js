const express = require("express");
const router = express.Router();
const { validate } = require("../Middleware/validator");
const { adminvalidator } = require("../Middleware/adminvalidator");
const upload = require("../utils/multer");

const {
  usersignup,
  getData,
  userlogin,
  getUserById,
} = require("../Controller/user.controller");
const {
  addProject,
  getAllProjects,
  deleteProject,
  getProjectById,
  updateProject,
  decodeSecretMessage
} = require("../Controller/project.controller");

router.post("/user/register", usersignup);
router.post("/user/login", userlogin);
router.post("/updateproject", updateProject);
router.get("/user/getdata", getData);
router.get("/getallproject", getAllProjects);
router.delete("/deleteproject/:id", deleteProject);
router.get("/fetchproject/:id", getProjectById);
// router.post("/uploadmyproject", addProject);
router.post("/uploadmyproject", upload.single("image"), addProject);
// router.get("/user/getuser/:pId", getUserById);
router.get("/user/getuser/:id", getUserById);


module.exports = router;
