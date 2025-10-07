const orderService = require("../Services/orderservices");
const { createOrderSchema } = require("../validation/orderValidation");
const logger = require("../utils/logger");

// ✅ Create new order
const createOrder = async (req, res) => {
  const userId = req.user?.userId;

  try {
    logger.info("CreateOrder API Request", { userId });

    // === Validate request data ===
    const { error } = createOrderSchema.validate({ userId });
    if (error) {
      logger.warn("Order validation failed", { error: error.details[0].message });
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
        data: null,
      });
    }

    const resp = await orderService.createOrder({ userId });

    return res.status(resp.statusCode).json({
      success: resp.success,
      message: resp.message,
      data: resp.data || null,
    });
  } catch (error) {
    logger.error("CreateOrder Controller Error", { error: error.message });
    return res.status(500).json({
      success: false,
      message: "Server error while creating order",
      data: null,
    });
  }
};

// ✅ Get all orders for logged-in user
const getUserOrders = async (req, res) => {
  const userId = req.user?.userId;

  try {
    logger.info("GetUserOrders API Request", { userId });
    const resp = await orderService.getUserOrders({ userId });

    return res.status(resp.statusCode).json({
      success: resp.success,
      message: resp.message,
      data: resp.data || null,
    });
  } catch (error) {
    logger.error("GetUserOrders Controller Error", { error: error.message });
    return res.status(500).json({
      success: false,
      message: "Server error while fetching orders",
      data: null,
    });
  }
};

// ✅ Mark Order as Paid
const markOrderPaid = async (req, res) => {
  const userId = req.user?.userId;
  const orderId = req.params.id; // ✅ params se le rahe ho

  try {
    logger.info("MarkOrderPaid API Request", { userId, orderId });

    const resp = await orderService.markOrderPaid({ userId, orderId });

    return res.status(resp.statusCode).json({
      success: resp.success,
      message: resp.message,
      data: resp.data || null,
    });
  } catch (error) {
    logger.error("MarkOrderPaid Controller Error", { error: error.message });
    return res.status(500).json({
      success: false,
      message: "Server error while updating order payment",
      data: null,
    });
  }
};

module.exports = { createOrder, getUserOrders, markOrderPaid };
