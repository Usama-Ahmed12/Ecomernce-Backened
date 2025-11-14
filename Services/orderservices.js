const Order = require('../models/orderModel');
const Cart = require('../models/cartModel');
const logger = require('../utils/logger');
const sendEmail = require('../utils/sendEmail');
const STATUS_CODES = require('../utils/statusCodes'); // <-- IMPORTED
const MESSAGES = require('../utils/messages');     // <-- IMPORTED
require('dotenv').config();

//  Create Order
const createOrder = async ({ userId, userEmail, userName }) => {
  try {
    logger.info("OrderService: createOrder - Initiated for user", { userId, userEmail, userName });

    if (!userEmail || !userName) {
      logger.warn("OrderService: createOrder - User email or name missing", { userId });
      return { success: false, message: MESSAGES.USER_EMAIL_NAME_MISSING, statusCode: STATUS_CODES.BAD_REQUEST };
    }

    const cart = await Cart.findOne({ user: userId }).populate('items.product');
    if (!cart || cart.items.length === 0) {
      logger.warn("OrderService: createOrder - Cart is empty for user", { userId });
      return { success: false, message: MESSAGES.ORDER_CART_EMPTY, statusCode: STATUS_CODES.BAD_REQUEST };
    }

    const totalAmount = cart.items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);

    const order = new Order({
      user: userId,
      items: cart.items,
      totalAmount,
      status: "Pending" // Initial status
    });

    await order.save();

    //  Clear cart after order creation
    cart.items = [];
    await cart.save();
    logger.info("OrderService: createOrder - Cart cleared for user", { userId });

    const adminEmail = process.env.ADMIN_EMAIL;

    // Admin Notification Email
    if (adminEmail) {
      await sendEmail({
        to: adminEmail,
        subject: `New Order Placed - ${order._id}`,
        html: `
          <h2>New Order Placed</h2>
          <p>User: ${userName} (${userEmail})</p>
          <p>Order ID: ${order._id}</p>
          <p>Total Amount: $${totalAmount.toFixed(2)}</p>
          <h3>Items:</h3>
          <ul>
            ${order.items.map(i => `<li>${i.product.name} x ${i.quantity} - $${i.product.price.toFixed(2)}</li>`).join('')}
          </ul>
        `
      });
      logger.info("OrderService: createOrder - Admin notification email sent", { orderId: order._id });
    } else {
      logger.warn("OrderService: createOrder - ADMIN_EMAIL not configured, skipping admin notification.");
    }

    // User Notification Email
    await sendEmail({
      to: userEmail,
      subject: `Your Order Confirmation - ${order._id}`,
      html: `
        <h2>Thank you for your order, ${userName}!</h2>
        <p>Order ID: ${order._id}</p>
        <p>Status: ${order.status}</p>
        <p>Total Amount: $${totalAmount.toFixed(2)}</p>
        <h3>Items:</h3>
        <ul>
          ${order.items.map(i => `<li>${i.product.name} x ${i.quantity} - $${i.product.price.toFixed(2)}</li>`).join('')}
        </ul>
        <p>We will notify you once your order is shipped.</p>
      `
    });
    logger.info("OrderService: createOrder - User confirmation email sent", { orderId: order._id, userEmail });

    return { success: true, message: MESSAGES.ORDER_PLACED_SUCCESS, data: order, statusCode: STATUS_CODES.CREATED };

  } catch (error) {
    logger.error("OrderService: createOrder - Error creating order", { error: error.message, stack: error.stack, userId });
    return { success: false, message: MESSAGES.ORDER_CREATED_SERVER_ERROR, details: error.message, statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR };
  }
};

//  Get User Orders
const getUserOrders = async ({ userId }) => {
  try {
    logger.info("OrderService: getUserOrders - Fetching orders for user", { userId });
    const orders = await Order.find({ user: userId }).populate('items.product');
    if (!orders || orders.length === 0) {
      logger.info("OrderService: getUserOrders - No orders found for user", { userId });
      return { success: true, message: MESSAGES.ORDERS_FETCH_SUCCESS_DB, data: [], statusCode: STATUS_CODES.OK };
    }
    logger.info("OrderService: getUserOrders - Orders fetched successfully for user", { userId, count: orders.length });
    return { success: true, message: MESSAGES.ORDERS_FETCH_SUCCESS_DB, data: orders, statusCode: STATUS_CODES.OK };
  } catch (error) {
    logger.error("OrderService: getUserOrders - Error fetching user orders", { error: error.message, stack: error.stack, userId });
    return { success: false, message: MESSAGES.SERVER_ERROR, details: error.message, statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR };
  }
};

//  Mark Order as Paid
const markOrderPaid = async ({ userId, orderId, userEmail, userName }) => {
  try {
    logger.info("OrderService: markOrderPaid - Initiated for order", { userId, orderId });

    if (!userEmail || !userName) {
      logger.warn("OrderService: markOrderPaid - User email or name missing", { userId, orderId });
      return { success: false, message: MESSAGES.USER_EMAIL_NAME_MISSING, statusCode: STATUS_CODES.BAD_REQUEST };
    }

    const order = await Order.findOne({ _id: orderId, user: userId }).populate('items.product');
    if (!order) {
      logger.warn("OrderService: markOrderPaid - Order not found for user", { userId, orderId });
      return { success: false, message: MESSAGES.ORDER_NOT_FOUND, statusCode: STATUS_CODES.NOT_FOUND };
    }

    if (order.status === "Paid") {
      logger.info("OrderService: markOrderPaid - Order already paid", { orderId });
      return { success: false, message: MESSAGES.ORDER_ALREADY_PAID, statusCode: STATUS_CODES.BAD_REQUEST };
    }

    order.status = "Paid";
    order.paidAt = new Date();
    await order.save();
    logger.info("OrderService: markOrderPaid - Order status updated to Paid", { orderId });

    const adminEmail = process.env.ADMIN_EMAIL;

    // Admin Notification Email
    if (adminEmail) {
      await sendEmail({
        to: adminEmail,
        subject: `Order Paid - ${order._id}`,
        html: `
          <h2>Order Paid Notification</h2>
          <p>User: ${userName} (${userEmail})</p>
          <p>Order ID: ${order._id}</p>
          <p>Total Amount: $${order.totalAmount.toFixed(2)}</p>
          <p>Status: Paid</p>
          <h3>Items:</h3>
          <ul>
            ${order.items.map(i => `<li>${i.product.name} x ${i.quantity} - $${i.product.price.toFixed(2)}</li>`).join('')}
          </ul>
        `
      });
      logger.info("OrderService: markOrderPaid - Admin payment notification email sent", { orderId: order._id });
    } else {
      logger.warn("OrderService: markOrderPaid - ADMIN_EMAIL not configured, skipping admin notification.");
    }

    // User Invoice Email
    await sendEmail({
      to: userEmail,
      subject: `Invoice for Your Order - ${order._id}`,
      html: `
        <h2>Thank you for your payment, ${userName}!</h2>
        <p>Order ID: ${order._id}</p>
        <p>Status: Paid</p>
        <p>Total Amount: $${order.totalAmount.toFixed(2)}</p>
        <h3>Items:</h3>
        <ul>
          ${order.items.map(i => `<li>${i.product.name} x ${i.quantity} - $${i.product.price.toFixed(2)}</li>`).join('')}
        </ul>
        <p>Your order is now confirmed as paid. We will notify you once your order is shipped.</p>
      `
    });
    logger.info("OrderService: markOrderPaid - User invoice email sent", { orderId: order._id, userEmail });

    return { success: true, message: MESSAGES.ORDER_PAID_SUCCESS, data: order, statusCode: STATUS_CODES.OK };

  } catch (error) {
    logger.error("OrderService: markOrderPaid - Error marking order as paid", { error: error.message, stack: error.stack, userId, orderId });
    return { success: false, message: MESSAGES.ORDER_UPDATE_PAYMENT_ERROR, details: error.message, statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR };
  }
};

module.exports = { createOrder, getUserOrders, markOrderPaid };