const Product = require("../models/productModel");
const logger = require("../utils/logger");
const STATUS_CODES = require("../utils/statusCodes"); // <-- IMPORTED
const MESSAGES = require("../utils/messages");     // <-- IMPORTED

const cleanString = (str) => (str ? str.replace(/^["']|["',]$/g, "").trim() : "");

// Get all products
const getAllProducts = async ({ page = 1, limit = 10, category, sortBy = "name", order = "asc", minPrice, maxPrice }) => {
  try {
    logger.info("ProductService: getAllProducts - Fetching all products", { page, limit, category, sortBy, order, minPrice, maxPrice });

    page = parseInt(page);
    limit = parseInt(limit);
    const skip = (page - 1) * limit;
    const query = {};

    if (category) {
      query.category = { $regex: new RegExp(`^${cleanString(category)}$`, "i") };
    }
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice !== undefined) query.price.$gte = Number(minPrice);
      if (maxPrice !== undefined) query.price.$lte = Number(maxPrice);
    }

    const sortOptions = {};
    sortOptions[sortBy] = order === "desc" ? -1 : 1;

    const products = await Product.find(query)
      .collation({ locale: "en", strength: 2 }) // Case-insensitive and accent-insensitive sorting
      .sort(sortOptions)
      .skip(skip)
      .limit(limit);

    if (!products || products.length === 0) {
      logger.info("ProductService: getAllProducts - No products found matching criteria", { query });
      // Although no products found, it's not an error, just an empty result.
      return { success: true, message: MESSAGES.PRODUCTS_EMPTY_LIST, data: [], total: 0, page, pages: 0, statusCode: STATUS_CODES.OK };
    }

    const cleanedProducts = products.map((p) => ({
      ...p.toObject(),
      name: cleanString(p.name),
      description: cleanString(p.description),
      category: cleanString(p.category),
      variants: p.variants.map((v) => ({
        ...v.toObject(),
        color: cleanString(v.color),
        description: cleanString(v.description),
      })),
    }));

    const total = await Product.countDocuments(query);
    logger.info("ProductService: getAllProducts - Products fetched successfully", { count: cleanedProducts.length, total });

    return {
      success: true,
      data: cleanedProducts,
      total,
      page,
      pages: Math.ceil(total / limit),
      statusCode: STATUS_CODES.OK,
    };
  } catch (error) {
    logger.error("ProductService: getAllProducts - Error fetching products", { error: error.message, stack: error.stack });
    return { success: false, message: MESSAGES.PRODUCT_SERVER_ERROR, details: error.message, statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR };
  }
};

// ✅ Add new product
const addProduct = async ({ name, price, description, image, category, stock, variants }) => {
  try {
    logger.info("ProductService: addProduct - Initiated to add new product", { name, category });

    if (!name || price === undefined || isNaN(price)) {
      logger.warn("ProductService: addProduct - Price is required or invalid for new product", { name, price });
      return { success: false, message: MESSAGES.PRICE_REQUIRED, statusCode: STATUS_CODES.BAD_REQUEST };
    }

    const existing = await Product.findOne({ name: cleanString(name) });
    if (existing) {
      logger.warn("ProductService: addProduct - Product with this name already exists", { name });
      return { success: false, message: MESSAGES.PRODUCT_EXISTS, statusCode: STATUS_CODES.CONFLICT };
    }

    let totalStock = Number(stock) || 0;

    if (variants && variants.length > 0) {
      variants = variants.map((v) => ({
        color: cleanString(v.color),
        stock: Number(v.stock) || 0,
        price: Number(v.price) || Number(price), // Use base price if variant price not provided
        description: cleanString(v.description),
      }));
      totalStock = variants.reduce((sum, v) => sum + v.stock, 0);
    }

    const newProduct = new Product({
      name: cleanString(name),
      price: Number(price),
      description: cleanString(description),
      image,
      category: cleanString(category),
      stock: totalStock,
      variants,
    });

    await newProduct.save();
    logger.info("ProductService: addProduct - New product added successfully", { productId: newProduct._id, name: newProduct.name });
    return { success: true, message: MESSAGES.PRODUCT_ADDED_SUCCESS, data: newProduct, statusCode: STATUS_CODES.CREATED };
  } catch (error) {
    logger.error("ProductService: addProduct - Error adding product", { error: error.message, stack: error.stack, name });
    return { success: false, message: MESSAGES.PRODUCT_SERVER_ERROR, details: error.message, statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR };
  }
};

module.exports = { getAllProducts, addProduct };