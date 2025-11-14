const productService = require("../Services/productServices");
const { getImageUrl } = require("../utils/imageHelper");
const { createProductSchema } = require("../validation/productValidation");
const logger = require("../utils/logger");
const redisClient = require("../utils/redis");
const STATUS_CODES = require("../utils/statusCodes"); // <-- IMPORTED
const MESSAGES = require("../utils/messages");     // <-- IMPORTED

// 🧹 Clean incoming form-data body (remove spaces and arrays)
const normalizeBody = (body) => {
  const normalized = {};
  for (const key in body) {
    const cleanKey = key.trim();
    let val = body[key];
    if (Array.isArray(val)) {
      // Pick the first non-empty string or just the first element
      const pick = val.find(v => v && v.toString().trim() !== "") || val[0];
      val = pick;
    }
    if (typeof val === "string") val = val.trim();
    normalized[cleanKey] = val;
  }
  return normalized;
};

//  Get all products (with Redis caching)
exports.getAllProducts = async (req, res) => {
  try {
    logger.info("ProductController: getAllProducts - API Request initiated", { query: req.query });

    const { page = 1, limit = 10, category, sortBy, order, minPrice, maxPrice } = req.query;

    //  Unique cache key (based on filters/pagination)
    const cacheKey = `products:${page}:${limit}:${category || "all"}:${sortBy || "name"}:${order || "asc"}:${minPrice || "min"}:${maxPrice || "max"}`;

    // 1️ Try getting data from Redis
    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      logger.info("ProductController: getAllProducts - Products fetched from Redis cache", { cacheKey });
      const parsed = JSON.parse(cachedData);
      return res.status(STATUS_CODES.OK).json({
        success: true,
        message: MESSAGES.PRODUCTS_FETCH_SUCCESS_CACHE,
        total: parsed.total,
        page: parsed.page,
        pages: parsed.pages,
        data: parsed.data,
      });
    }

    // 2️ Fetch from DB via service
    const resp = await productService.getAllProducts({
      page,
      limit,
      category,
      sortBy,
      order,
      minPrice,
      maxPrice,
    });

    if (!resp.success) {
      // Service will return success:true even for empty results, but if it's an actual service error
      logger.error("ProductController: getAllProducts - ProductService failed to fetch products", { message: resp.message, statusCode: resp.statusCode });
      return res.status(resp.statusCode || STATUS_CODES.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: resp.message,
        data: MESSAGES.DATA_NULL,
      });
    }

    // Map image URLs
    const productsWithImageUrls = resp.data.map(p => ({ ...p, image: getImageUrl(req, p.image) }));

    const result = {
      total: resp.total,
      page: resp.page,
      pages: resp.pages,
      data: productsWithImageUrls,
    };

    // 3️ Save in Redis for 10 minutes (600 sec)
    if (result.data && result.data.length > 0) { // Only cache if there are results
      await redisClient.setEx(cacheKey, 600, JSON.stringify(result));
      logger.info("ProductController: getAllProducts - Products cached in Redis", { cacheKey, count: result.data.length });
    } else {
       // Cache empty result for a shorter period to avoid repeated DB calls for empty queries
       await redisClient.setEx(cacheKey, 60, JSON.stringify(result)); // e.g., 60 seconds
       logger.info("ProductController: getAllProducts - Empty product list cached in Redis", { cacheKey });
    }


    return res.status(STATUS_CODES.OK).json({
      success: true,
      message: MESSAGES.PRODUCTS_FETCH_SUCCESS_DB,
      ...result,
    });
  } catch (error) {
    logger.error("ProductController: getAllProducts - Unexpected error", { error: error.message, stack: error.stack });
    return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: MESSAGES.PRODUCT_SERVER_ERROR,
      data: MESSAGES.DATA_NULL,
    });
  }
};

//  Add new product (Admin only)
exports.addProduct = async (req, res) => {
  try {
    logger.debug("ProductController: addProduct - Incoming product request body", { body: req.body });
    logger.debug("ProductController: addProduct - Uploaded file info", { file: req.file });

    // Normalize form-data
    let productData = normalizeBody(req.body);

    // Parse variants if sent as JSON string
    if (productData.variants && typeof productData.variants === "string") {
      try {
        productData.variants = JSON.parse(productData.variants);
        // Ensure parsed variants array contains objects with numeric stock/price
        if (Array.isArray(productData.variants)) {
          productData.variants = productData.variants.map(v => ({
            ...v,
            price: Number(v.price) || undefined, // undefined will let service use base price
            stock: Number(v.stock) || 0,
          }));
        }
      } catch (err) {
        logger.warn("ProductController: addProduct - Invalid JSON format for variants", { variants: productData.variants, error: err.message });
        return res.status(STATUS_CODES.BAD_REQUEST).json({
          success: false,
          message: MESSAGES.VALIDATION_ERROR + ": Invalid JSON for variants.", // More specific message
          data: MESSAGES.DATA_NULL,
        });
      }
    }

    // Convert price and stock to numbers before validation
    if (productData.price !== undefined) productData.price = Number(productData.price);
    if (productData.stock !== undefined) productData.stock = Number(productData.stock);

    // Attach image from multer
    if (req.file) productData.image = req.file.filename;

    logger.info("ProductController: addProduct - Normalized product data ready for validation", { productData });

    // Joi validation
    const { error } = createProductSchema.validate(productData);
    if (error) {
      logger.warn("ProductController: addProduct - Validation failed", { details: error.details[0].message, productData });
      return res.status(STATUS_CODES.BAD_REQUEST).json({
        success: false,
        message: MESSAGES.VALIDATION_ERROR + `: ${error.details[0].message}`, // Combine generic with specific
        data: MESSAGES.DATA_NULL,
      });
    }

    // Call service
    const resp = await productService.addProduct(productData);

    if (!resp.success) {
      logger.warn("ProductController: addProduct - ProductService failed to add product", { message: resp.message, statusCode: resp.statusCode });
      // Use service's status code and message
      return res.status(resp.statusCode || STATUS_CODES.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: resp.message,
        data: MESSAGES.DATA_NULL,
      });
    }

    // Prepare product data for response, including image URL
    const product = {
      ...resp.data.toObject(),
      image: getImageUrl(req, resp.data.image),
    };

    // 4️ Clear all relevant product cache keys after new product added
    // This is important because a new product affects all 'getAllProducts' queries.
    const keys = await redisClient.keys("products:*");
    if (keys.length > 0) {
      await redisClient.del(keys);
      logger.info("ProductController: addProduct - Redis cache cleared after adding new product", { clearedKeys: keys.length });
    }

    return res.status(STATUS_CODES.CREATED).json({
      success: true,
      message: MESSAGES.PRODUCT_ADDED_SUCCESS,
      data: product,
    });
  } catch (error) {
    logger.error("ProductController: addProduct - Unexpected error", { error: error.message, stack: error.stack, body: req.body });
    return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: MESSAGES.PRODUCT_SERVER_ERROR, // Specific server error message for this action
      data: MESSAGES.DATA_NULL,
    });
  }
};