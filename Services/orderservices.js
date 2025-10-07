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
    logger.error("OrderService error", { error });
    return { 
      success: false, 
      message: error.message || 'Server error', 
      details: error,   // ✅ full error bhej diya
      statusCode: 500 
    };
  }
};

// ✅ Get Orders for User
const getUserOrders = async ({ userId }) => {
  try {
    logger.info("Fetching orders for user", { userId });
    const orders = await Order.find({ user: userId }).populate('items.product');

    return { success: true, message: 'Orders fetched successfully', data: orders, statusCode: 200 };
  } catch (error) {
    logger.error("OrderService error", { error });
    return { 
      success: false, 
      message: error.message || 'Server error', 
      details: error,   // ✅ full error bhej diya
      statusCode: 500 
    };
  }
};

// ✅ Mark Order as Paid
const markOrderPaid = async ({ userId, orderId }) => {
  try {
    logger.info("Marking order as paid", { userId, orderId });

    const order = await Order.findOne({ _id: orderId, user: userId });

    if (!order) {
      logger.warn("Order not found", { userId, orderId });
      return { success: false, message: "Order not found", statusCode: 404 };
    }

    if (order.status === "Paid") {
      return { success: false, message: "Order is already paid", statusCode: 400 };
    }

    order.status = "Paid";
    await order.save();

    logger.info("Order marked as paid", { orderId });
    return { success: true, message: "Order payment successful", data: order, statusCode: 200 };
  } catch (error) {
    logger.error("MarkOrderPaid error", { error });
    return { 
      success: false, 
      message: error.message || "Server error", 
      details: error,   // ✅ full error bhej diya
      statusCode: 500 
    };
  }
};

module.exports = { createOrder, getUserOrders, markOrderPaid };
