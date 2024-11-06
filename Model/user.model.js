const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const { object, boolean } = require("yup");

const OrderSchema = new mongoose.Schema({
  productId: { type: String, required: true },
  productName: { type: String, required: true },
  paid: { type: Boolean, default: false },
  orderedDate: { type: Date, default: Date.now },
  dateToBeDelivered: { type: Date, required: true },
  dateDelivered: { type: Date },
  transactionId: { type: String },
  delivered: { type: Boolean, default: false },
  productPrice: { type: Number, required: true },
  paymentMethod: { type: String, required: true },
  status: { type: String, default: "Pending" },
});

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, trim: true },
  password: { type: String, required: true, trim: true },
  email: { type: String, unique: true, required: true, trim: true },
  phoneNumber: { type: String, required: true, trim: true },
  role: { type: String, required: true, trim: true, default: "User" },
  orders: [OrderSchema],
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
