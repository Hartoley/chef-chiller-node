const mongoose = require("mongoose");
const { string } = require("yup");

const AdminOrderSchema = new mongoose.Schema({
  products: { type: Object, required: true },
  userId: { type: String, required: true },
  Total: { type: Number },
  paid: { type: Boolean, default: false },
  approved: { type: Boolean, default: false },
  orderedDate: { type: Date, default: Date.now },
  dateToBeDelivered: { type: Date, default: Date.now },
  dateDelivered: { type: Date },
  transactionId: { type: String },
  paymentMethod: { type: String, default: "Payment on Delivery" },
  status: { type: String, default: "Pending" },
  totalPrice: { type: Number },
  paymentImage: { type: String },
});

const productchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  category: { type: String },
  prepTime: { type: String },
  description: { type: String },
  price: { type: Number },
  image: { type: String },
  createdAt: { type: Date, default: Date.now },
});

const productmodel = mongoose.model("product_collection", productchema);
const adminordersmodel = mongoose.model("order_collection", AdminOrderSchema);
module.exports = { productmodel, adminordersmodel };
