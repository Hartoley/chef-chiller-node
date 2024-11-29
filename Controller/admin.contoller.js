const { productmodel } = require("../Model/admin.model");
const { adminordersmodel } = require("../Model/admin.model");
const { usermodel } = require("../Model/user.model");
const { cloudinary } = require("../utils/cloudinary");
const eventEmitter = require("../eventemmiter");

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

const uploadPaymentProof = async (imagePath) => {
  try {
    const result = await cloudinary.uploader.upload(imagePath, {
      folder: "payment_proofs", // You can customize this folder name
      resource_type: "image", // Ensure this is an image upload
    });

    return result.secure_url; // Return the URL of the uploaded image
  } catch (error) {
    console.error("Error uploading payment proof:", error);
    throw new Error("Failed to upload payment proof");
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

const addproduct = async (req, res) => {
  const { image, userId, productId, action, productName, productPrice } =
    req.body;
  console.log(productName);

  try {
    const user = await usermodel.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const existingProductIndex = user.orders.findIndex(
      (order) => order.productId.toString() === productId.toString()
    );

    switch (action) {
      case "add":
        if (existingProductIndex === -1) {
          user.orders.push({
            image,
            productId,
            productName,
            productPrice,
            quantity: 1,
          });
        } else {
          user.orders[existingProductIndex].quantity += 1;
        }
        break;

      case "increase":
        if (existingProductIndex === -1) {
          user.orders.push({
            image,
            productId,
            productName,
            productPrice,
            quantity: 1,
          });
        } else {
          user.orders[existingProductIndex].quantity += 1;
        }
        break;

      case "decrease":
        if (existingProductIndex === -1) {
          return res.status(400).json({ message: "Product not in cart" });
        } else {
          const existingOrder = user.orders[existingProductIndex];
          if (existingOrder.quantity > 1) {
            existingOrder.quantity -= 1;
          } else {
            user.orders.splice(existingProductIndex, 1);
          }
        }
        break;

      case "delete":
        if (existingProductIndex === -1) {
          return res.status(400).json({ message: "Product not in cart" });
        } else {
          user.orders.splice(existingProductIndex, 1);
        }
        break;

      default:
        return res.status(400).json({ message: "Invalid action" });
    }

    await user.save();
    res.status(200).json({ message: "Cart updated successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

const approveAndPackOrders = async (req, res) => {
  const { userId } = req.body;

  try {
    const user = await usermodel.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.orders.length === 0) {
      return res.status(400).json({ message: "No orders to process." });
    }

    // Create a new packed order object (only the products part)
    const packedOrder = {
      products: user.orders.map((order) => ({
        productId: order.productId,
        productName: order.productName,
        image: order.image,
        quantity: order.quantity,
        price: order.productPrice,
      })),
    };

    // Check if the user already has any order in the collection
    const existingOrder = await adminordersmodel.findOne({ userId });

    if (existingOrder) {
      // If the user already has an order, check each new product
      packedOrder.products.forEach((newProduct) => {
        // Check if the product already exists in the order
        const existingProduct = existingOrder.products.find(
          (product) =>
            product.productId.toString() === newProduct.productId.toString()
        );

        if (existingProduct) {
          // If the product exists, merge the quantity
          existingProduct.quantity += newProduct.quantity;
        } else {
          // If the product doesn't exist, add it to the order
          existingOrder.products.push(newProduct);
        }
      });

      // Save the updated order
      await existingOrder.save();

      return res.status(200).json({
        message:
          "Existing order updated with new products and merged quantities.",
      });
    } else {
      // If no existing order, create a new one
      const newOrder = {
        userId: user._id,
        products: packedOrder.products,
        status: "Approved",
        orderedDate: Date.now(),
        dateToBeDelivered: new Date(),
        paymentMethod: "Payment on Delivery",
      };

      await adminordersmodel.create(newOrder);

      user.orders = []; // Clear the user's orders after processing
      await user.save();

      return res.status(200).json({
        message: "New order packed, approved, and cleared successfully!",
      });
    }
  } catch (error) {
    console.error("Error approving, packing, and clearing orders:", error);
    return res
      .status(500)
      .json({ message: "An error occurred", error: error.message });
  }
};

const uploadPaymentImage = async (req, res) => {
  const { orderId } = req.params;
  const paymentImage = req.file;
  console.log(paymentImage);

  if (!paymentImage) {
    return res.status(400).json({ message: "No payment image provided" });
  }

  try {
    // Ensure correct path format for Cloudinary
    const imagePath = paymentImage.path.replace(/\\/g, "/"); // Correct path format for Cloudinary

    // Upload the payment image to Cloudinary
    const cloudinaryResponse = await cloudinary.uploader.upload(imagePath, {
      folder: "orders",
      public_id: `payment_${orderId}`, // Optional: Custom public ID for the image
    });

    // Find the order by its ID
    const order = await adminordersmodel.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    order.paymentImage = cloudinaryResponse.secure_url;
    order.status = "Payment Pending";

    await order.save();

    eventEmitter.emit({
      message:
        "Payment image uploaded to Cloudinary and order updated successfully!",
      paymentImage: order.paymentImage, // Return Cloudinary URL
    });
  } catch (error) {
    console.error("Error uploading payment image to Cloudinary:", error);
    return res
      .status(500)
      .json({ message: "An error occurred", error: error.message });
  }
};

const getOrdersByUserId = async (req, res) => {
  const { userId } = req.params;

  try {
    const query = userId ? { userId } : {};
    const orders = await adminordersmodel.find(query).sort({ orderedDate: -1 });

    if (orders.length === 0) {
      return res.status(200).json({ message: "No orders found." });
    }

    eventEmitter.emit({ message: "Orders retrieved successfully.", orders });
  } catch (error) {
    console.error("Error retrieving orders for admin:", error);
    return res
      .status(500)
      .json({ message: "An error occurred", error: error.message });
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

const updateCartInDatabase = (product, action) => {
  setCart((prevCart) => {
    const existingProductIndex = prevCart.findIndex(
      (item) => item.productId === product.productId
    );

    if (existingProductIndex === -1) {
      // If the product doesn't exist in the cart, add it
      return [...prevCart, { ...product, quantity: 1 }];
    } else {
      const updatedCart = [...prevCart];

      if (action === "increase") {
        // Increase the quantity by 1
        updatedCart[existingProductIndex].quantity += 1;
      } else if (
        action === "decrease" &&
        updatedCart[existingProductIndex].quantity > 1
      ) {
        // Decrease the quantity by 1, but not below 1
        updatedCart[existingProductIndex].quantity -= 1;
      } else if (action === "delete") {
        // Delete the product from the cart by setting the quantity to 0
        updatedCart[existingProductIndex].quantity = 0;
      }

      // Remove the product if quantity is 0 (effectively deletes the product from the cart)
      if (updatedCart[existingProductIndex].quantity === 0) {
        updatedCart.splice(existingProductIndex, 1);
      }

      return updatedCart;
    }
  });
};

module.exports = {
  uploadProduct,
  getProducts,
  deleteProduct,
  editproduct,
  getProductData,
  addproduct,
  updateCartInDatabase,
  approveAndPackOrders,
  getOrdersByUserId,
  uploadPaymentImage,
};
