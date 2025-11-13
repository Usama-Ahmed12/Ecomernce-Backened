const productService = require("../Services/productServices");
const { getImageUrl } = require("../utils/imageHelper");
const { createProductSchema } = require("../validation/productValidation");
const logger = require("../utils/logger");
const redisClient = require("../utils/redis"); //  Redis client import

// 🧹 Clean incoming form-data body (remove spaces and arrays)
const normalizeBody = (body) => {
  const normalized = {};
  for (const key in body) {
    const cleanKey = key.trim();
    let val = body[key];
    if (Array.isArray(val)) {
      const pick = val.find(v => v && v.trim() !== "") || val[0];
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
    const { page = 1, limit = 10, category, sortBy, order, minPrice, maxPrice } = req.query;

    //  Unique cache key (based on filters/pagination)
    const cacheKey = `products:${page}:${limit}:${category || "all"}:${sortBy || "name"}:${order || "asc"}:${minPrice || 0}:${maxPrice || "max"}`;

    // 1️ Try getting data from Redis
    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      logger.info(" Products fetched from Redis cache", { cacheKey });
      const parsed = JSON.parse(cachedData);
      return res.status(200).json({
        success: true,
        message: "Products fetched successfully (from cache)",
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
      logger.warn("No products found in DB", { category, page });
      return res.status(404).json({ success: false, message: resp.message, data: null });
    }

    const products = resp.data.map(p => ({ ...p, image: getImageUrl(req, p.image) }));

    const result = {
      total: resp.total,
      page: resp.page,
      pages: resp.pages,
      data: products,
    };

    // 3️ Save in Redis for 10 minutes (600 sec)
    await redisClient.setEx(cacheKey, 600, JSON.stringify(result));
    logger.info(" Products cached in Redis", { cacheKey });

    return res.status(200).json({
      success: true,
      message: "Products fetched successfully (from DB)",
      ...result,
    });
  } catch (error) {
    logger.error("ProductController Error (GetAll)", { error: error.message });
    return res.status(500).json({
      success: false,
      message: "Server error while fetching products",
      data: null,
    });
  }
};

//  Add new product (Admin only)
exports.addProduct = async (req, res) => {
  try {
    logger.debug("Incoming product request body", { body: req.body });
    logger.debug("Uploaded file info", { file: req.file });

    // Normalize form-data
    let productData = normalizeBody(req.body);

    // Parse variants if sent as JSON string
    if (productData.variants && typeof productData.variants === "string") {
      try {
        productData.variants = JSON.parse(productData.variants);
      } catch (err) {
        logger.warn("Invalid JSON format for variants", { variants: productData.variants });
        return res.status(400).json({
          success: false,
          message: "Invalid JSON for variants",
          data: null,
        });
      }
    }

    // Convert price and stock to numbers
    if (productData.price !== undefined) productData.price = Number(productData.price);
    if (productData.stock !== undefined) productData.stock = Number(productData.stock);

    // Convert variant prices/stocks to numbers
    if (Array.isArray(productData.variants)) {
      productData.variants = productData.variants.map(v => ({
        ...v,
        price: Number(v.price),
        stock: Number(v.stock),
      }));
    }

    // Attach image from multer
    if (req.file) productData.image = req.file.filename;

    logger.info("Normalized product data ready for validation", { productData });

    // Joi validation
    const { error } = createProductSchema.validate(productData);
    if (error) {
      logger.warn("Product validation failed", { details: error.details[0].message });
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
        data: null,
      });
    }

    // Call service
    const resp = await productService.addProduct(productData);

    if (!resp.success) {
      logger.warn("ProductService failed to add product", { message: resp.message });
      return res.status(400).json({
        success: false,
        message: resp.message,
        data: null,
      });
    }

    const product = {
      ...resp.data.toObject(),
      image: getImageUrl(req, resp.data.image),
    };

    // 4️ Clear all product cache keys after new product added
    const keys = await redisClient.keys("products:*");
    if (keys.length > 0) {
      await redisClient.del(keys);
      logger.info("🧹 Redis cache cleared after adding new product", { clearedKeys: keys.length });
    }

    return res.status(201).json({
      success: true,
      message: "Product added successfully",
      data: product,
    });
  } catch (error) {
    logger.error("ProductController Error (Add)", { error: error.message });
    return res.status(500).json({
      success: false,
      message: "Server error while adding product",
      data: null,
    });
  }
};
