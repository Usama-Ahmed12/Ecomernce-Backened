const Order = require('../models/orderModel');
const Cart = require('../models/cartModel');
const logger = require('../utils/logger');
const sendEmail = require('../utils/sendEmail');
require('dotenv').config();

//  Create Order
const createOrder = async ({ userId, userEmail, userName }) => {
  try {
    logger.info("Creating order for user", { userId, userEmail, userName });

    if (!userEmail || !userName) {
      return { success: false, message: "User email or name missing in request", statusCode: 400 };
    }

    const cart = await Cart.findOne({ user: userId }).populate('items.product');
    if (!cart || cart.items.length === 0) {
      return { success: false, message: 'Cart is empty', statusCode: 400 };
    }

    const totalAmount = cart.items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);

    const order = new Order({
      user: userId,
      items: cart.items,
      totalAmount,
      status: "Pending"
    });

    await order.save();

    //  Clear cart
    cart.items = [];
    await cart.save();

    const adminEmail = process.env.ADMIN_EMAIL;

    // Admin Notification Email
  
    await sendEmail({
      to: adminEmail,
      subject: `New Order Placed - ${order._id}`,
      html: `
        <h2>New Order Placed</h2>
        <p>User: ${userName} (${userEmail})</p>
        <p>Order ID: ${order._id}</p>
        <p>Total Amount: $${totalAmount}</p>
        <h3>Items:</h3>
        <ul>
          ${order.items.map(i => `<li>${i.product.name} x ${i.quantity} - $${i.product.price}</li>`).join('')}
        </ul>
      `
    });

  
    // User Notification Email
    
    await sendEmail({
      to: userEmail,
      subject: `Your Order Confirmation - ${order._id}`,
      html: `
        <h2>Thank you for your order, ${userName}!</h2>
        <p>Order ID: ${order._id}</p>
        <p>Status: ${order.status}</p>
        <p>Total Amount: $${totalAmount}</p>
        <h3>Items:</h3>
        <ul>
          ${order.items.map(i => `<li>${i.product.name} x ${i.quantity} - $${i.product.price}</li>`).join('')}
        </ul>
        <p>We will notify you once your order is shipped.</p>
      `
    });

    logger.info("Order placed successfully", { orderId: order._id });
    return { success: true, message: 'Order placed successfully', data: order, statusCode: 201 };

  } catch (error) {
    logger.error("OrderService error", { error });
    return { success: false, message: error.message || 'Server error', details: error, statusCode: 500 };
  }
};

//  Get User Orders
const getUserOrders = async ({ userId }) => {
  try {
    const orders = await Order.find({ user: userId }).populate('items.product');
    return { success: true, message: 'Orders fetched successfully', data: orders, statusCode: 200 };
  } catch (error) {
    return { success: false, message: error.message || 'Server error', details: error, statusCode: 500 };
  }
};

//  Mark Order as Paid
const markOrderPaid = async ({ userId, orderId, userEmail, userName }) => {
  try {
    if (!userEmail || !userName) {
      return { success: false, message: "User email or name missing in request", statusCode: 400 };
    }

    const order = await Order.findOne({ _id: orderId, user: userId }).populate('items.product');
    if (!order) {
      return { success: false, message: "Order not found", statusCode: 404 };
    }

    if (order.status === "Paid") {
      return { success: false, message: "Order already paid", statusCode: 400 };
    }

    order.status = "Paid";
    order.paidAt = new Date();
    await order.save();

    const adminEmail = process.env.ADMIN_EMAIL;

    // Admin Notification Email

    await sendEmail({
      to: adminEmail,
      subject: `Order Paid - ${order._id}`,
      html: `
        <h2>New Order Paid</h2>
        <p>User: ${userName} (${userEmail})</p>
        <p>Order ID: ${order._id}</p>
        <p>Total Amount: $${order.totalAmount}</p>
        <h3>Items:</h3>
        <ul>
          ${order.items.map(i => `<li>${i.product.name} x ${i.quantity} - $${i.product.price}</li>`).join('')}
        </ul>
      `
    });

    // User Invoice Email
    await sendEmail({
      to: userEmail,
      subject: `Invoice for Your Order - ${order._id}`,
      html: `
        <h2>Thank you for your payment, ${userName}!</h2>
        <p>Order ID: ${order._id}</p>
        <p>Status: Paid</p>
        <p>Total Amount: $${order.totalAmount}</p>
        <h3>Items:</h3>
        <ul>
          ${order.items.map(i => `<li>${i.product.name} x ${i.quantity} - $${i.product.price}</li>`).join('')}
        </ul>
        <p>We will notify you once your order is shipped.</p>
      `
    });

    return { success: true, message: "Order payment successful", data: order, statusCode: 200 };

  } catch (error) {
    return { success: false, message: error.message || "Server error", details: error, statusCode: 500 };
  }
};

module.exports = { createOrder, getUserOrders, markOrderPaid };
