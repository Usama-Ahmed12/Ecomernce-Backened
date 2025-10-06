const cartService = require("../Services/cartservice");
const { addToCartSchema } = require("../validation/cartValidation");
const logger = require("../utils/logger");  //  import logger

//  Add to cart
const addToCart = async (req, res) => {
  try {
    logger.info(" Add to Cart API Request", { body: req.body, userId: req.user?.userId });

    // === Validate request body ===
    const { error } = addToCartSchema.validate(req.body);
    if (error) {
      logger.warn(" Add to Cart Validation Failed", { error: error.details[0].message });
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
        data: null
      });
    }

    const resp = await cartService.addToCart({
      userId: req.user.userId, //  from JWT
      productId: req.body.productId,
      quantity: req.body.quantity,
    });

    if (!resp.success) {
      logger.warn(" Add to Cart Service Failed", { message: resp.message });
    } else {
      logger.info(" Item Added to Cart", { userId: req.user.userId, productId: req.body.productId });
    }

    return res.status(resp.statusCode || 200).json({
      success: resp.success,
      message: resp.message,
      data: resp.data || null,
    });
  } catch (error) {
    logger.error(" Add to Cart Error", { error: error.message, stack: error.stack });
    return res.status(500).json({
      success: false,
      message: "Server error while adding to cart",
      data: null
    });
  }
};

//  Get user's cart
const getCart = async (req, res) => {
  try {
    logger.info(" Get Cart API Request", { userId: req.user?.userId });

    const resp = await cartService.getCart({ userId: req.user.userId });

    if (!resp.success) {
      logger.warn(" Get Cart Service Failed", { message: resp.message });
    } else {
      logger.info(" Cart Fetched Successfully", { userId: req.user.userId });
    }

    return res.status(resp.statusCode || 200).json({
      success: resp.success,
      message: resp.message,
      data: resp.data || null,
    });
  } catch (error) {
    logger.error(" Get Cart Error", { error: error.message, stack: error.stack });
    return res.status(500).json({
      success: false,
      message: "Server error while fetching cart",
      data: null
    });
  }
};

module.exports = { addToCart, getCart };
