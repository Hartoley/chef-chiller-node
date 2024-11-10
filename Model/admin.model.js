const mongoose = require("mongoose");
const { string } = require("yup");

const productchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  category: [{ type: String }],
  prepTime: [{ type: String }],
  description: { type: String },
  price: { type: Number },
  image: { type: String },
  createdAt: { type: Date, default: Date.now },
});

const productmodel = mongoose.model("product_collection", productchema);
module.exports = { productmodel };
