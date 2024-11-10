const express = require("express");
const router = express.Router();
const multer = require("multer");
const upload = require("../utils/multer");
const { uploadProduct, getProducts } = require("../Controller/admin.contoller");

router.get("/user/getproducts", getProducts);
router.post("/upload", upload.single("image"), uploadProduct);
module.exports = router;
