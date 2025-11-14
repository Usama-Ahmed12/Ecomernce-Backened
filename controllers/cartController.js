const cartService = require("../Services/cartservice");
const { addToCartSchema } = require("../validation/cartValidation");
const logger = require("../utils/logger");
const redisClient = require("../utils/redis");
const STATUS_CODES = require('../utils/statusCodes'); // IMPORTED
const MESSAGES = require('../utils/messages');     // IMPORTED

//  Add to cart
const addToCart = async (req, res) => {
  try {
    logger.info("Add to Cart API Request", { body: req.body, userId: req.user?.userId });

    // === Validate request body ===
    const { error } = addToCartSchema.validate(req.body);
    if (error) {
      logger.warn("Add to Cart Validation Failed", { error: error.details[0].message });
      return res.status(STATUS_CODES.BAD_REQUEST).json({ // Updated
        success: false,
        message: error.details[0].message,
        data: null
      });
    }

    const resp = await cartService.addToCart({
      userId: req.user.userId,
      productId: req.body.productId,
      quantity: req.body.quantity,
    });

    if (!resp.success) {
      logger.warn("Add to Cart Service Failed", { message: resp.message });
    } else {
      logger.info("Item Added to Cart", { userId: req.user.userId, productId: req.body.productId });

      //  Clear user's cart cache after update
      const cacheKey = `cart:${req.user.userId}`;
      await redisClient.del(cacheKey);
      logger.info(" Redis cache cleared after cart update", { cacheKey });
    }

    // Service se aane wala statusCode istemal karen, agar nahi hai to OK (default)
    return res.status(resp.statusCode || STATUS_CODES.OK).json({ // Updated
      success: resp.success,
      message: resp.message,
      data: resp.data || null,
    });
  } catch (error) {
    logger.error("Add to Cart Error", { error: error.message, stack: error.stack });
    return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ // Updated
      success: false,
      message: MESSAGES.SERVER_ERROR, // Updated
      data: null
    });
  }
};

//  Get user's cart
const getCart = async (req, res) => {
  try {
    logger.info("Get Cart API Request", { userId: req.user?.userId });

    const cacheKey = `cart:${req.user.userId}`;

    // 1️ Try fetching from Redis
    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      logger.info("📦 Cart fetched from Redis cache", { cacheKey });
      return res.status(STATUS_CODES.OK).json({ // Updated
        success: true,
        message: MESSAGES.CART_FETCHED_FROM_CACHE, // New message can be added
        data: JSON.parse(cachedData),
      });
    }

    // 2️ Fetch from DB via service
    const resp = await cartService.getCart({ userId: req.user.userId });

    if (!resp.success) {
      logger.warn("Get Cart Service Failed", { message: resp.message });
      // Service se aane wala statusCode istemal karen, agar nahi hai to NOT_FOUND (default)
      return res.status(resp.statusCode || STATUS_CODES.NOT_FOUND).json({ // Updated
        success: false,
        message: resp.message,
        data: null,
      });
    }

    // 3️ Cache the result for 5 minutes
    await redisClient.setEx(cacheKey, 300, JSON.stringify(resp.data));
    logger.info(" Cart cached in Redis", { cacheKey });

    logger.info("Cart Fetched Successfully", { userId: req.user.userId });
    // Service se aane wala statusCode istemal karen, agar nahi hai to OK (default)
    return res.status(resp.statusCode || STATUS_CODES.OK).json({ // Updated
      success: true,
      message: MESSAGES.CART_FETCHED_SUCCESSFULLY, // Updated
      data: resp.data || null,
    });
  } catch (error) {
    logger.error("Get Cart Error", { error: error.message, stack: error.stack });
    return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ // Updated
      success: false,
      message: MESSAGES.SERVER_ERROR, // Updated
      data: null
    });
  }
};

module.exports = { addToCart, getCart };