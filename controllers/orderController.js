const orderService = require('../Services/orderservices');

// ✅ Create new order
const createOrder = async (req, res) => {
  const userId = req.userId;
  console.log("Request received")

  try {
    const resp = await orderService.createOrder({ userId });

    if (!resp.success) {
      return res.status(400).json({
        success: false,
        message: resp.message || 'Failed to create order',
      });
    }

    return res.status(201).json({
      success: true,
      message: resp.message || 'Order created successfully',
      data: resp.order,
    });

  } catch (error) {
    console.error('Error creating order:', error.message);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error while creating order',
    });
  }
};

// ✅ Get all orders for logged-in user
const getUserOrders = async (req, res) => {
  const userId = req.userId;

  try {
    const resp = await orderService.getUserOrders({ userId });

    if (!resp.success) {
      return res.status(404).json({
        success: false,
        message: resp.message || 'No orders found for this user',
      });
    }

    return res.status(200).json({
      success: true,
      message: resp.message || 'Orders fetched successfully',
      data: resp.orders,
    });

  } catch (error) {
    console.error('Error fetching orders:', error.message);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error while fetching orders',
    });
  }
};

module.exports = { createOrder, getUserOrders };
