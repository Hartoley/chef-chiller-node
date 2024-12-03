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
  approveAndPackOrders,
  getOrdersByUserId,
  uploadPaymentImage,
  getAllOrders,
  approveOrder,
} = require("../Controller/admin.contoller");

router.get("/user/getproducts", getProducts);
router.delete("/delete/:productId", deleteProduct);
router.get("/product/:productId", getProductData);
router.get("/admingetorders", getAllOrders);
router.post("/makeOrder", approveAndPackOrders);
router.post("/updatecart", addproduct);
router.post(
  "/approveDelivery/:orderId",
  upload.single("image"),
  uploadPaymentImage
);
router.post("/edit/:productId", upload.single("image"), editproduct);
router.get("/getmyorders/:userId", getOrdersByUserId);
router.post("/approveorders/:orderId", approveOrder);

router.post("/upload", upload.single("image"), uploadProduct);

module.exports = router;
