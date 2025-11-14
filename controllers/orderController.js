const orderService = require("../Services/orderservices");
const { createOrderSchema } = require("../validation/orderValidation");
const logger = require("../utils/logger");
const redisClient = require("../utils/redis");
const STATUS_CODES = require("../utils/statusCodes"); // <-- IMPORTED
const MESSAGES = require("../utils/messages");     // <-- IMPORTED

//  Create new order
const createOrder = async (req, res) => {
  const userId = req.user?.userId?.toString();
  const userEmail = req.user?.email;
  const userName = req.user?.name || req.user?.firstName;

  try {
    logger.info("OrderController: createOrder - API Request initiated", { userId, userEmail });

    // Validate request body (assuming createOrderSchema validates userId if needed)
    // Note: The provided createOrderSchema only validates userId. If other body fields are expected, update schema.
    const { error } = createOrderSchema.validate({ userId });
    if (error) {
      logger.warn("OrderController: createOrder - Validation failed", { error: error.details[0].message, userId });
      return res.status(STATUS_CODES.BAD_REQUEST).json({
        success: false,
        message: error.details[0].message, // Use specific validation message
        data: MESSAGES.DATA_NULL,
      });
    }

    // Create new order via service
    const resp = await orderService.createOrder({ userId, userEmail, userName });

    if (!resp.success) {
      logger.warn("OrderController: createOrder - Order creation failed in service", { userId, message: resp.message, statusCode: resp.statusCode });
      return res.status(resp.statusCode || STATUS_CODES.INTERNAL_SERVER_ERROR).json({ // Use service's status code
        success: false,
        message: resp.message,
        data: MESSAGES.DATA_NULL,
      });
    }

    // Clear user's order cache (if exists) after successful creation
    const cacheKey = `orders:${userId}`;
    await redisClient.del(cacheKey);
    logger.info("OrderController: createOrder - Redis cache cleared after new order creation", { cacheKey });

    return res.status(resp.statusCode || STATUS_CODES.CREATED).json({ // Use service's status code, default to CREATED
      success: true,
      message: resp.message,
      data: resp.data,
    });
  } catch (error) {
    logger.error("OrderController: createOrder - Unexpected error", { error: error.message, stack: error.stack, userId });
    return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: MESSAGES.ORDER_CREATED_SERVER_ERROR, // Use specific server error message
      data: MESSAGES.DATA_NULL,
    });
  }
};

//  Get all orders for logged-in user (with Redis caching)
const getUserOrders = async (req, res) => {
  const userId = req.user?.userId?.toString();

  try {
    logger.info("OrderController: getUserOrders - API Request initiated", { userId });

    const cacheKey = `orders:${userId}`;

    // 1️ Try fetching from Redis cache
    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      logger.info("OrderController: getUserOrders - Orders fetched from Redis cache", { cacheKey });
      const parsed = JSON.parse(cachedData);
      return res.status(STATUS_CODES.OK).json({
        success: true,
        message: MESSAGES.ORDERS_FETCH_SUCCESS_CACHE,
        data: parsed,
      });
    }

    // 2️ Fetch from DB via service
    const resp = await orderService.getUserOrders({ userId });

    if (!resp.success) {
      logger.warn("OrderController: getUserOrders - No orders found in DB or service error", { userId, message: resp.message, statusCode: resp.statusCode });
      // Even if no orders are found, service returns success: true with empty array.
      // This 'if' block would primarily catch service's internal server error.
      return res.status(resp.statusCode || STATUS_CODES.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: resp.message,
        data: MESSAGES.DATA_NULL,
      });
    }

    // 3️ Cache result in Redis for 5 minutes (300 sec)
    // Only cache if there's actual data, or cache empty array
    if (resp.data && resp.data.length > 0) {
      await redisClient.setEx(cacheKey, 300, JSON.stringify(resp.data));
      logger.info("OrderController: getUserOrders - Orders cached in Redis", { cacheKey, count: resp.data.length });
    } else {
      // Cache empty array too, to prevent repeated DB calls for users with no orders
      await redisClient.setEx(cacheKey, 300, JSON.stringify([]));
      logger.info("OrderController: getUserOrders - Empty orders list cached in Redis", { cacheKey });
    }


    return res.status(STATUS_CODES.OK).json({
      success: true,
      message: MESSAGES.ORDERS_FETCH_SUCCESS_DB,
      data: resp.data,
    });
  } catch (error) {
    logger.error("OrderController: getUserOrders - Unexpected error", { error: error.message, stack: error.stack, userId });
    return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: MESSAGES.SERVER_ERROR, // General server error message
      data: MESSAGES.DATA_NULL,
    });
  }
};

//  Mark Order as Paid
const markOrderPaid = async (req, res) => {
  const userId = req.user?.userId?.toString();
  const userEmail = req.user?.email;
  const userName = req.user?.name || req.user?.firstName;
  const orderId = req.params.id;

  try {
    logger.info("OrderController: markOrderPaid - API Request initiated", { userId, orderId });

    if (!userEmail || !userName) {
      logger.warn("OrderController: markOrderPaid - User email or name missing from request", { userId, orderId });
      return res.status(STATUS_CODES.BAD_REQUEST).json({
        success: false,
        message: MESSAGES.USER_EMAIL_NAME_MISSING,
        data: MESSAGES.DATA_NULL,
      });
    }

    const resp = await orderService.markOrderPaid({ userId, orderId, userEmail, userName });

    if (!resp.success) {
      logger.warn("OrderController: markOrderPaid - Order payment update failed in service", { userId, orderId, message: resp.message, statusCode: resp.statusCode });
      return res.status(resp.statusCode || STATUS_CODES.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: resp.message,
        data: MESSAGES.DATA_NULL,
      });
    }

    // Clear cache after payment update
    const cacheKey = `orders:${userId}`;
    await redisClient.del(cacheKey);
    logger.info("OrderController: markOrderPaid - Redis cache cleared after marking order paid", { cacheKey });

    return res.status(resp.statusCode || STATUS_CODES.OK).json({
      success: true,
      message: resp.message,
      data: resp.data,
    });
  } catch (error) {
    logger.error("OrderController: markOrderPaid - Unexpected error", { error: error.message, stack: error.stack, userId, orderId });
    return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: MESSAGES.ORDER_UPDATE_PAYMENT_ERROR, // Specific server error message for this action
      data: MESSAGES.DATA_NULL,
    });
  }
};

module.exports = { createOrder, getUserOrders, markOrderPaid };