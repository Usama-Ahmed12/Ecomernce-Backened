const Cart = require("../models/cartModel");
const Product = require("../models/productModel");

// ✅ Add to cart logic
const addToCart = async ({ userId, productId, quantity }) => {
  try {
    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return { success: false, message: "Product not found", statusCode: 404 };
    }

    // Find user's cart
    let cart = await Cart.findOne({ user: userId });

    if (cart) {
      // Check if product already in cart
      const existingIndex = cart.items.findIndex(
        (item) => item.product.toString() === productId
      );

      if (existingIndex >= 0) {
        // Update quantity
        cart.items[existingIndex].quantity += quantity;
      } else {
        cart.items.push({ product: productId, quantity });
      }
    } else {
      // Create new cart
      cart = new Cart({
        user: userId,
        items: [{ product: productId, quantity }],
      });
    }

    await cart.save();

    // Populate product details
    await cart.populate("items.product");

    return { success: true, message: "Product added to cart", data: cart, statusCode: 200 };
  } catch (error) {
    console.error("CartService error:", error);
    return { success: false, message: error.message, statusCode: 500 };
  }
};

// ✅ Get user's cart
const getCart = async ({ userId }) => {
  try {
    const cart = await Cart.findOne({ user: userId }).populate("items.product");
    if (!cart) {
      return { success: false, message: "Cart not found", statusCode: 404 };
    }
    return { success: true, message: "Cart fetched successfully", data: cart, statusCode: 200 };
  } catch (error) {
    console.error("CartService error:", error);
    return { success: false, message: error.message, statusCode: 500 };
  }
};

module.exports = { addToCart, getCart };
