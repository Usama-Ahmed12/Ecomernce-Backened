const Order = require('../models/orderModel');
const Cart = require('../models/cartModel');

// ✅ Create Order
const createOrder = async (payload) => {
  try {
    console.log("Creating order")
    const cart = await Cart.findOne({ user: payload.userId }).populate('items.product');

    console.log("cart:",cart)
    if (!cart || cart.items.length === 0) {
      return { success: false, message: 'Cart is empty' };
    }

    const totalAmount = cart.items.reduce((sum, item) => {
      return sum + (item.product.price * item.quantity);
    }, 0);

    const order = new Order({
      user: payload.userId, 
      items: cart.items,
      totalAmount
    });

    await order.save();

    // Clear cart after order placed
    cart.items = [];
    await cart.save();

    return {
      success: true,
      message: 'Order placed successfully',
      order
    };

  } catch (error) {
    console.log("Error",error)
    return { success: false, message: error.message || 'Server error' }; // ✅ Better error handling
  }
};

// ✅ Get Orders for User
const getUserOrders = async (payload) => {
  try {
    const orders = await Order.find({ user: payload.userId }).populate('items.product');
    return { success: true, orders };
  } catch (error) {
    return { success: false, message: error.message || 'Server error' };
  }
};

module.exports = { createOrder, getUserOrders };
