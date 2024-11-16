const express = require("express");
const router = express.Router();
const multer = require("multer");
const upload = require("../utils/multer");
const {
  uploadProduct,
  getProducts,
  deleteProduct,
  editproduct,
  getProductData,
  addproduct,
} = require("../Controller/admin.contoller");

router.get("/user/getproducts", getProducts);
router.delete("/delete/:productId", deleteProduct);
router.get("/product/:productId", getProductData);
router.post("/updatecart", addproduct);
router.post("/edit/:productId", upload.single("image"), editproduct);

router.post("/upload", upload.single("image"), uploadProduct);

module.exports = router;
