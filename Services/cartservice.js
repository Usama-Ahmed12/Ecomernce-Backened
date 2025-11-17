const Cart = require("../models/cartModel");
const Product = require("../models/productModel");
const logger = require("../utils/logger");
const STATUS_CODES = require('../utils/statusCodes'); // Already imported
const MESSAGES = require('../utils/messages');         // Already imported

//  Add to Cart 
const addToCart = async ({ userId, productId, quantity }) => {
  try {
    logger.info(" CartService: Add to Cart called", { userId, productId, quantity });

    const product = await Product.findById(productId);
    if (!product) {
      logger.warn(" Product not found in CartService", { productId });
      return { 
        success: false, 
        message: MESSAGES.PRODUCT_NOT_FOUND, 
        statusCode: STATUS_CODES.NOT_FOUND 
      };
    }

    let cart = await Cart.findOne({ user: userId });

    if (cart) {
      const existingIndex = cart.items.findIndex(
        (item) => item.product.toString() === productId
      );

      if (existingIndex >= 0) {
        cart.items[existingIndex].quantity += quantity;
        logger.info(" Updated product quantity in cart", { 
          userId, productId, newQty: cart.items[existingIndex].quantity 
        });
      } else {
        cart.items.push({ product: productId, quantity });
        logger.info(" Added new product to cart", { userId, productId, quantity });
      }
    } else {
      cart = new Cart({
        user: userId,
        items: [{ product: productId, quantity }],
      });
      logger.info(" Created new cart for user", { userId, productId, quantity });
    }

    await cart.save();
    await cart.populate("items.product");

    return { 
      success: true, 
      message: MESSAGES.PRODUCT_ADDED_TO_CART, 
      data: cart, 
      statusCode: STATUS_CODES.OK 
    };
  } catch (error) {
    logger.error(" CartService AddToCart Error", { error: error.message, stack: error.stack });
    return { 
      success: false, 
      message: MESSAGES.SERVER_ERROR, 
      statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR 
    };
  }
};

//  Get Cart 
const getCart = async ({ userId }) => {
  try {
    logger.info(" CartService: Get Cart called", { userId });

    const cart = await Cart.findOne({ user: userId }).populate("items.product");
    if (!cart) {
      logger.warn(" Cart not found", { userId });
      return { 
        success: false, 
        message: MESSAGES.CART_NOT_FOUND, 
        statusCode: STATUS_CODES.NOT_FOUND 
      };
    }

    logger.info(" Cart fetched successfully", { userId, itemsCount: cart.items.length });
    return { 
      success: true, 
      message: MESSAGES.CART_FETCHED_SUCCESSFULLY, 
      data: cart, 
      statusCode: STATUS_CODES.OK 
    };
  } catch (error) {
    logger.error(" CartService GetCart Error", { error: error.message, stack: error.stack });
    return { 
      success: false, 
      message: MESSAGES.SERVER_ERROR, 
      statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR 
    };
  }
};

//  Cron Cleanup Function -
const deleteOldCarts = async () => {
  try {
    const oldDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours
    const result = await Cart.deleteMany({
      updatedAt: { $lt: oldDate }
    });

    logger.info(` Cron: Deleted old carts = ${result.deletedCount}`);
  } catch (error) {
    logger.error(" Cron Cart Cleanup Error", { error: error.message });
  }
};

//  Export 
module.exports = { addToCart, getCart, deleteOldCarts };
