const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const { object, boolean } = require("yup");

const OrderSchema = new mongoose.Schema({
  productId: { type: String, required: true },
  productName: { type: String, required: true },
  image: { type: String, required: true },
  paid: { type: Boolean, default: false },
  approved: { type: Boolean, default: false },
  orderedDate: { type: Date, default: Date.now },
  dateToBeDelivered: { type: Date, default: Date.now },
  dateDelivered: { type: Date },
  transactionId: { type: String },
  quantity: { type: Number },
  delivered: { type: Boolean, default: false },
  productPrice: { type: Number, required: true },
  paymentMethod: { type: String, default: "Payment on Delivery" },
  status: { type: String, default: "Pending" },
});

const historySchema = new mongoose.Schema({
  image: { type: String, required: true },
  productId: { type: String, required: true },
  productName: { type: String, required: true },
  paid: { type: Boolean, default: true },
  orderedDate: { type: Date, default: Date.now },
  dateDelivered: { type: Date },
  transactionId: { type: String },
  quantity: { type: Number },
  delivered: { type: Boolean, default: false },
  productPrice: { type: Number, required: true },
  paymentMethod: { type: String, default: "Payment on Delivery" },
  status: { type: String, default: "Delivered" },
});

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, trim: true },
  password: { type: String, required: true, trim: true },
  email: { type: String, unique: true, required: true, trim: true },
  phoneNumber: { type: String, required: true, trim: true },
  role: { type: String, required: true, trim: true, default: "User" },
  orders: [OrderSchema],
  history: [historySchema],
});

const saltRound = 10;
UserSchema.pre("save", function (next) {
  if (!this.isModified("password")) return next();
  bcrypt
    .hash(this.password, saltRound)
    .then((hashedPassword) => {
      this.password = hashedPassword;
      next();
    })
    .catch((err) => next(err));
});

const usermodel = mongoose.model("chefChillerUser", UserSchema);
module.exports = { usermodel };
