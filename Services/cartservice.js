const Cart = require("../models/cartModel");
const Product = require("../models/productModel");
const logger = require("../utils/logger");
const STATUS_CODES = require('../utils/statusCodes'); // IMPORTED
const MESSAGES = require('../utils/messages');     // IMPORTED

//  Add to cart logic
const addToCart = async ({ userId, productId, quantity }) => {
  try {
    logger.info("🛒 CartService: Add to Cart called", { userId, productId, quantity });

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      logger.warn(" Product not found in CartService", { productId });
      return { success: false, message: MESSAGES.PRODUCT_NOT_FOUND, statusCode: STATUS_CODES.NOT_FOUND }; // Updated
    }

    // Find user's cart
    let cart = await Cart.findOne({ user: userId });

    if (cart) {
      // Check if product already in cart
      const existingIndex = cart.items.findIndex(
        (item) => item.product.toString() === productId
      );

      if (existingIndex >= 0) {
        cart.items[existingIndex].quantity += quantity;
        logger.info(" Updated product quantity in cart", { userId, productId, newQty: cart.items[existingIndex].quantity });
      } else {
        cart.items.push({ product: productId, quantity });
        logger.info(" Added new product to cart", { userId, productId, quantity });
      }
    } else {
      // Create new cart
      cart = new Cart({
        user: userId,
        items: [{ product: productId, quantity }],
      });
      logger.info(" Created new cart for user", { userId, productId, quantity });
    }

    await cart.save();
    await cart.populate("items.product");

    return { success: true, message: MESSAGES.PRODUCT_ADDED_TO_CART, data: cart, statusCode: STATUS_CODES.OK }; // Updated
  } catch (error) {
    logger.error(" CartService AddToCart Error", { error: error.message, stack: error.stack });
    return { success: false, message: MESSAGES.SERVER_ERROR, statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR }; // Updated
  }
};

//  Get user's cart
const getCart = async ({ userId }) => {
  try {
    logger.info(" CartService: Get Cart called", { userId });

    const cart = await Cart.findOne({ user: userId }).populate("items.product");
    if (!cart) {
      logger.warn(" Cart not found", { userId });
      return { success: false, message: MESSAGES.CART_NOT_FOUND, statusCode: STATUS_CODES.NOT_FOUND }; // Updated
    }

    logger.info(" Cart fetched successfully", { userId, itemsCount: cart.items.length });
    return { success: true, message: MESSAGES.CART_FETCHED_SUCCESSFULLY, data: cart, statusCode: STATUS_CODES.OK }; // Updated
  } catch (error) {
    logger.error(" CartService GetCart Error", { error: error.message, stack: error.stack });
    return { success: false, message: MESSAGES.SERVER_ERROR, statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR }; // Updated
  }
};

module.exports = { addToCart, getCart };