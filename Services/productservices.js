const Product = require('../models/productModel');

// ✅ Get all products
const getAllProducts = async () => {
  try {
    const products = await Product.find({});
    if (!products || products.length === 0) {
      return { success: false, message: "No products found" };
    }
    return { success: true, data: products };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

// ✅ Add new product
const addProduct = async ({ name, price, description, image, category, stock }) => {
  try {
    // validation
    if (!name || !price) {
      return { success: false, message: "Name and price are required" };
    }

    // check duplicate
    const existing = await Product.findOne({ name });
    if (existing) {
      return { success: false, message: "Product already exists" };
    }

    const newProduct = new Product({ name, price, description, image, category, stock });
    await newProduct.save();

    return { success: true, data: newProduct };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

module.exports = { getAllProducts, addProduct };
