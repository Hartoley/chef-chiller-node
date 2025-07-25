const mongoose = require("mongoose");

// AdminOrder Schema
const AdminOrderSchema = new mongoose.Schema({
  products: [
    {
      productId: { type: String, required: true },
      productName: { type: String, required: true },
      image: { type: String, required: true },
      quantity: { type: Number, required: true },
      price: { type: Number, required: true },
    },
  ],
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

// Add indexes for efficient querying by user and date
AdminOrderSchema.index({ userId: 1 });
AdminOrderSchema.index({ orderedDate: -1 });

// Product Schema
const productSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  category: { type: String },
  prepTime: { type: String },
  description: { type: String },
  price: { type: Number },
  image: { type: String },
  createdAt: { type: Date, default: Date.now },
});

// Models
const ProductModel = mongoose.model("product_collection", productSchema);
const AdminOrdersModel = mongoose.model("order_collection", AdminOrderSchema);

// Exports
module.exports = { ProductModel, AdminOrdersModel };
