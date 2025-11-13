const orderService = require("../Services/orderservices");
const { createOrderSchema } = require("../validation/orderValidation");
const logger = require("../utils/logger");
const redisClient = require("../utils/redis"); //  Redis client import

//  Create new order
const createOrder = async (req, res) => {
  const userId = req.user?.userId?.toString();
  const userEmail = req.user?.email;
  const userName = req.user?.name || req.user?.firstName;

  try {
    logger.info("CreateOrder API Request", { userId, userEmail });

    // Validate request
    const { error } = createOrderSchema.validate({ userId });
    if (error) {
      logger.warn("Order validation failed", { error: error.details[0].message });
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
        data: null,
      });
    }

    // Create new order
    const resp = await orderService.createOrder({ userId, userEmail, userName });

    //  Clear user's order cache (if exists)
    const cacheKey = `orders:${userId}`;
    await redisClient.del(cacheKey);
    logger.info(" Redis cache cleared after new order creation", { cacheKey });

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

//  Get all orders for logged-in user (with Redis caching)
const getUserOrders = async (req, res) => {
  const userId = req.user?.userId?.toString();

  try {
    logger.info("GetUserOrders API Request", { userId });

    //  Unique cache key for this user
    const cacheKey = `orders:${userId}`;

    // 1️ Try fetching from Redis cache
    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      logger.info(" Orders fetched from Redis cache", { cacheKey });
      const parsed = JSON.parse(cachedData);
      return res.status(200).json({
        success: true,
        message: "Orders fetched successfully (from cache)",
        data: parsed,
      });
    }

    // 2️ Fetch from DB via service
    const resp = await orderService.getUserOrders({ userId });

    if (!resp.success) {
      logger.warn("No orders found in DB", { userId });
      return res.status(resp.statusCode).json({
        success: false,
        message: resp.message,
        data: null,
      });
    }

    // 3️ Cache result in Redis for 5 minutes (300 sec)
    await redisClient.setEx(cacheKey, 300, JSON.stringify(resp.data));
    logger.info(" Orders cached in Redis", { cacheKey });

    return res.status(200).json({
      success: true,
      message: "Orders fetched successfully (from DB)",
      data: resp.data,
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

//  Mark Order as Paid
const markOrderPaid = async (req, res) => {
  const userId = req.user?.userId?.toString();
  const userEmail = req.user?.email;
  const userName = req.user?.name || req.user?.firstName;
  const orderId = req.params.id;

  if (!userEmail || !userName) {
    return res.status(400).json({
      success: false,
      message: "User email or name missing in request",
    });
  }

  try {
    logger.info("MarkOrderPaid API Request", { userId, orderId });

    const resp = await orderService.markOrderPaid({ userId, orderId, userEmail, userName });

    //  Clear cache after payment update
    const cacheKey = `orders:${userId}`;
    await redisClient.del(cacheKey);
    logger.info(" Redis cache cleared after marking order paid", { cacheKey });

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
