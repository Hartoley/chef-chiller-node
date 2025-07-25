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
    eventEmitter.emit("ordersUpdated", {
      userId,
      orders: user.orders,
      user: user,
    });
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

    const packedOrder = {
      products: user.orders.map((order) => ({
        productId: order.productId,
        productName: order.productName,
        image: order.image,
        quantity: order.quantity,
        price: order.productPrice,
      })),
    };

    console.log("Packed Order for Update:", packedOrder);

    for (const product of packedOrder.products) {
      if (
        !product.productId ||
        !product.productName ||
        !product.image ||
        !product.price
      ) {
        console.error("Missing required fields in packedOrder:", product);
        return res
          .status(400)
          .json({ message: "Missing required fields in products." });
      }
    }

    const userOrders = await adminordersmodel.find({ userId });

    const updatableOrder = userOrders.find(
      (order) =>
        !["Payment Approved", "Payment Declined", "Payment Pending"].includes(
          order.status
        )
    );

    if (updatableOrder) {
      console.log("Updating existing order:", updatableOrder._id);

      let updated = false;

      packedOrder.products.forEach((newProduct) => {
        const existingProduct = updatableOrder.products.find(
          (product) =>
            product.productId.toString() === newProduct.productId.toString()
        );

        if (existingProduct) {
          existingProduct.quantity += Number(newProduct.quantity);
          updatableOrder.markModified("products");
          updated = true;
        } else {
          updatableOrder.products.push(newProduct);
          updatableOrder.markModified("products");
          updated = true;
        }
      });

      if (updated) {
        try {
          const savedOrder = await updatableOrder.save();
          console.log("Order updated successfully:", savedOrder);

          user.orders = [];
          await user.save();

          eventEmitter.emit("orderApproved", {
            order: savedOrder,
            user: user,
          });

          return res.status(200).json({
            message: "Order updated successfully.",
            order: savedOrder,
          });
        } catch (error) {
          console.error("Error saving order:", error);
          return res
            .status(500)
            .json({ message: "Failed to save order.", error: error.message });
        }
      } else {
        return res
          .status(400)
          .json({ message: "No updates were made to the order." });
      }
    } else {
      console.log(
        "No suitable existing order found. Creating a new collection."
      );

      const newOrder = new adminordersmodel({
        userId,
        products: packedOrder.products,
        Total: packedOrder.products.reduce(
          (acc, product) => acc + product.price * product.quantity,
          0
        ),
        status: "Pending",
      });

      try {
        const savedOrder = await newOrder.save();
        console.log("New order created successfully:", savedOrder);

        user.orders = [];
        await user.save();

        eventEmitter.emit("orderApproved", {
          orders: savedOrder,
          user: user,
        });

        return res.status(201).json({
          message: "New order created successfully.",
          order: savedOrder,
        });
      } catch (error) {
        console.error("Error creating new order:", error);
        return res.status(500).json({
          message: "Failed to create new order.",
          error: error.message,
        });
      }
    }
  } catch (error) {
    console.error("Error processing orders:", error);
    return res.status(500).json({
      message: "An error occurred while processing orders.",
      error: error.message,
    });
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
    const imagePath = paymentImage.path.replace(/\\/g, "/");

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
    order.paid = true;

    await order.save();

    eventEmitter.emit({
      message:
        "Payment image uploaded to Cloudinary and order updated successfully!",
      paymentImage: order.paymentImage,
    });
  } catch (error) {
    console.error("Error uploading payment image to Cloudinary:", error);
    return res
      .status(500)
      .json({ message: "An error occurred", error: error.message });
  }
};

const deleteOrder = async (req, res) => {
  const { orderId } = req.params;

  try {
    const order = await adminordersmodel.findById(orderId);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    if (order.status !== "Pending" && order.status !== "Delivery declined") {
      return res.status(400).json({
        message:
          "Order can only be deleted if status is Pending or Delivery Declined",
      });
    }

    await adminordersmodel.findByIdAndDelete(orderId);

    return res.status(200).json({ message: "Order deleted successfully" });
  } catch (error) {
    console.error("Error deleting order:", error);
    return res
      .status(500)
      .json({ message: "An error occurred", error: error.message });
  }
};

const getOrdersByUserId = async (req, res) => {
  const { userId } = req.params;

  // Parse pagination query params with defaults
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  console.log(
    `Fetching orders for userId: ${userId}, page: ${page}, limit: ${limit}`
  );

  try {
    const query = userId ? { userId } : {};

    // Get total count for pagination info
    const totalOrders = await adminordersmodel.countDocuments(query);

    // Fetch paginated orders sorted by orderedDate descending
    const orders = await adminordersmodel
      .find(query)
      .sort({ orderedDate: -1 })
      .skip(skip)
      .limit(limit);

    // Emit event if needed
    eventEmitter.emit("ordersRetrieved", orders);

    // Return consistent structured response
    return res.status(200).json({
      orders,
      totalOrders,
      currentPage: page,
      totalPages: Math.ceil(totalOrders / limit),
    });
  } catch (error) {
    console.error("Error retrieving orders for admin:", error);
    return res.status(500).json({
      message: "An error occurred while retrieving orders",
      error: error.message,
    });
  }
};

const getAllOrders = async (req, res) => {
  try {
    const orders = await adminordersmodel.find().sort({ orderedDate: -1 });

    if (orders.length === 0) {
      return res.status(200).json({ message: "No orders found." });
    }

    eventEmitter.emit("ordersRetrievedByAdmin", orders);

    return res.status(200).json({ orders });
  } catch (error) {
    console.error("Error retrieving orders for admin:", error);
    return res
      .status(500)
      .json({ message: "An error occurred", error: error.message });
  }
};

const DeclineOrder = async (req, res) => {
  const { orderId } = req.params;
  console.log(`Approving order with ID: ${orderId}`);

  try {
    const updatedOrder = await adminordersmodel.findByIdAndUpdate(
      orderId,
      { status: "Payment Declined" },
      { new: true }
    );

    if (!updatedOrder) {
      console.error(`Order with ID: ${orderId} not found.`);
      return res.status(404).json({ message: "Order not found." });
    }

    console.log(`Order declined successfully:`, updatedOrder);

    eventEmitter.emit("orderDeclinedByAdmin", updatedOrder);

    return res
      .status(200)
      .json({ message: "Order declined successfully.", order: updatedOrder });
  } catch (error) {
    console.error("Error approving order:", error);
    return res.status(500).json({
      message: "An error occurred while approving the order.",
      error: error.message,
    });
  }
};

const approveOrder = async (req, res) => {
  const { orderId } = req.params;
  console.log(`Approving order with ID: ${orderId}`);

  try {
    const updatedOrder = await adminordersmodel.findByIdAndUpdate(
      orderId,
      { status: "Payment Approved" },
      { new: true }
    );

    if (!updatedOrder) {
      console.error(`Order with ID: ${orderId} not found.`);
      return res.status(404).json({ message: "Order not found." });
    }

    console.log(`Order approved successfully:`, updatedOrder);

    eventEmitter.emit("orderApprovedByAdmin", updatedOrder);

    return res
      .status(200)
      .json({ message: "Order approved successfully.", order: updatedOrder });
  } catch (error) {
    console.error("Error approving order:", error);
    return res.status(500).json({
      message: "An error occurred while approving the order.",
      error: error.message,
    });
  }
};

const approveOrderDelivery = async (req, res) => {
  const { orderId } = req.params;
  console.log(`Approving order with ID: ${orderId}`);

  try {
    const updatedOrder = await adminordersmodel.findByIdAndUpdate(
      orderId,
      { status: "Delivery Approved" },
      { new: true }
    );

    if (!updatedOrder) {
      console.error(`Order with ID: ${orderId} not found.`);
      return res.status(404).json({ message: "Order not found." });
    }

    console.log(`Order approved successfully:`, updatedOrder);

    eventEmitter.emit("orderApprovedByAdmin", updatedOrder);

    return res
      .status(200)
      .json({ message: "Order approved successfully.", order: updatedOrder });
  } catch (error) {
    console.error("Error approving order:", error);
    return res.status(500).json({
      message: "An error occurred while approving the order.",
      error: error.message,
    });
  }
};

const declineOrderDelivery = async (req, res) => {
  const { orderId } = req.params;
  console.log(`Approving order with ID: ${orderId}`);

  try {
    const updatedOrder = await adminordersmodel.findByIdAndUpdate(
      orderId,
      { status: "Delivery declined" },
      { new: true }
    );

    if (!updatedOrder) {
      console.error(`Order with ID: ${orderId} not found.`);
      return res.status(404).json({ message: "Order not found." });
    }

    console.log(`Order approved successfully:`, updatedOrder);

    eventEmitter.emit("orderApprovedByAdmin", updatedOrder);

    return res
      .status(200)
      .json({ message: "Order approved successfully.", order: updatedOrder });
  } catch (error) {
    console.error("Error approving order:", error);
    return res.status(500).json({
      message: "An error occurred while approving the order.",
      error: error.message,
    });
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
  getAllOrders,
  approveOrder,
  DeclineOrder,
  approveOrderDelivery,
  deleteOrder,
  declineOrderDelivery,
};
