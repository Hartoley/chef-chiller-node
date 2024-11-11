const { productmodel } = require("../Model/admin.model");
const { cloudinary } = require("../utils/cloudinary");

const uploadProduct = async (req, res) => {
  try {
    const { name, category, prepTime, description, price } = req.body;
    const image = req.file;

    if (!name || !category || !price || !image) {
      console.log(req.file);
      return res
        .status(400)
        .json({ error: "Please fill in all required fields!" });
    }

    const result = await cloudinary.uploader.upload(image.path, {
      folder: "products",
    });

    const newProduct = new productmodel({
      name,
      category,
      prepTime,
      description,
      price,
      image: result.secure_url,
    });

    const savedProduct = await newProduct.save();

    return res.status(200).json({
      message: "Product uploaded successfully",
      product: savedProduct,
    });
  } catch (error) {
    console.error("Error uploading product:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        error:
          "Product with this name already exists. Please choose a different name.",
      });
    }

    return res
      .status(500)
      .json({ error: "An error occurred while uploading the product" });
  }
};

const getProducts = async (req, res) => {
  try {
    const data = await productmodel.find({});
    if (data.length === 0) {
      console.log("No data found");
      res.status(404).send({ message: "No data found" });
    } else {
      console.log(data);
      data.forEach((product) => {
        console.log(product.name);
      });
      res.status(200).send(data);
    }
  } catch (err) {
    console.log(err);
    res.status(500).send({ message: "Internal server error" });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const product = await productmodel.findById(productId);

    if (!product) {
      return res
        .status(404)
        .json({ message: "product not found", status: false });
    }

    await productmodel.findByIdAndDelete(productId);

    return res
      .status(200)
      .json({ message: "product deleted successfully", status: true });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};

const editproduct = async (req, res) => {
  try {
    const { name, category, prepTime, description, price } = req.body;
    const uploadedimage = req.file;
    const productId = req.params.productId;

    console.log(req.body);

    if (!name || !category || !prepTime || !description || !price) {
      return res.status(400).send({
        message: "All fields are required",
        status: false,
      });
    }

    const existingproduct = await productmodel.findById(productId);
    if (!existingproduct) {
      return res
        .status(404)
        .send({ message: "Product not found", status: false });
    }

    let imageUrl = existingproduct.image;
    if (uploadedimage) {
      const result = await cloudinary.uploader.upload(uploadedimage.path, {
        folder: "products",
      });
      imageUrl = result.secure_url;
    }

    existingproduct.name = name;
    existingproduct.category = category;
    existingproduct.prepTime = prepTime;
    existingproduct.description = description;
    existingproduct.price = price;
    existingproduct.image = imageUrl;

    const updatedproduct = await existingproduct.save();

    res.status(200).send({
      message: "Product updated successfully",
      status: true,
      product: updatedproduct,
    });
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(500).send({ message: error.message });
  }
};

const getProductData = async (req, res) => {
  try {
    const product = req.params.productId;
    const adminIn = await productmodel.findById(product);
    res.send(adminIn);
  } catch (error) {
    return res.status(408).send("product not found shoooo");
  }
};

module.exports = {
  uploadProduct,
  getProducts,
  deleteProduct,
  editproduct,
  getProductData,
};
