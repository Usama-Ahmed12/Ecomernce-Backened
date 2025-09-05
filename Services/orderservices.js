const Order = require('../models/orderModel');
const Cart = require('../models/cartModel');
const logger = require('../utils/logger'); // ✅ logger import

// ✅ Create Order
const createOrder = async ({ userId }) => {
  try {
    logger.info("Creating order for user", { userId });

    const cart = await Cart.findOne({ user: userId }).populate('items.product');

    if (!cart || cart.items.length === 0) {
      logger.warn("Cart is empty for order", { userId });
      return { success: false, message: 'Cart is empty', statusCode: 400 };
    }

    const totalAmount = cart.items.reduce((sum, item) => {
      return sum + (item.product.price * item.quantity);
    }, 0);

    const order = new Order({
      user: userId,
      items: cart.items,
      totalAmount
    });

    await order.save();

    // ✅ Clear cart after order placed
    cart.items = [];
    await cart.save();

    logger.info("Order placed successfully", { orderId: order._id, userId });
    return { success: true, message: 'Order placed successfully', data: order, statusCode: 201 };

  } catch (error) {
    logger.error("OrderService error", { error: error.message });
    return { success: false, message: error.message || 'Server error', statusCode: 500 };
  }
};

// ✅ Get Orders for User
const getUserOrders = async ({ userId }) => {
  try {
    logger.info("Fetching orders for user", { userId });
    const orders = await Order.find({ user: userId }).populate('items.product');

    return { success: true, message: 'Orders fetched successfully', data: orders, statusCode: 200 };
  } catch (error) {
    logger.error("OrderService error", { error: error.message });
    return { success: false, message: error.message || 'Server error', statusCode: 500 };
  }
};

module.exports = { createOrder, getUserOrders };
