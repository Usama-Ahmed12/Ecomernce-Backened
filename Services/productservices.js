const Product = require('../models/productModel');
const logger = require('../utils/logger');

// ✅ Get all products
const getAllProducts = async () => {
  try {
    const products = await Product.find({});
    if (!products || products.length === 0) {
      logger.warn(" No products found in DB");
      return { success: false, message: "No products found" };
    }
    logger.info("✅ Products found in DB", { count: products.length });
    return { success: true, data: products };
  } catch (error) {
    logger.error(" ProductService Error (GetAll)", { error: error.message });
    return { success: false, message: error.message };
  }
};

// ✅ Add new product
const addProduct = async ({ name, price, description, image, category, stock }) => {
  try {
    if (!name || !price) {
      logger.warn(" Product validation failed - missing name/price");
      return { success: false, message: "Name and price are required" };
    }

    // check duplicate
    const existing = await Product.findOne({ name });
    if (existing) {
      logger.warn(" Duplicate product", { name });
      return { success: false, message: "Product already exists" };
    }

    const newProduct = new Product({ name, price, description, image, category, stock });
    await newProduct.save();

    logger.info(" Product saved to DB", { id: newProduct._id });
    return { success: true, data: newProduct };
  } catch (error) {
    logger.error(" ProductService Error (Add)", { error: error.message });
    return { success: false, message: error.message };
  }
};

module.exports = { getAllProducts, addProduct };
