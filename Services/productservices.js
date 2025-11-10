const Product = require("../models/productModel");
const logger = require("../utils/logger");

const cleanString = (str) => (str ? str.replace(/^["']|["',]$/g, "").trim() : "");

// ✅ Get all products
const getAllProducts = async ({ page = 1, limit = 10, category, sortBy = "name", order = "asc", minPrice, maxPrice }) => {
  try {
    page = parseInt(page);
    limit = parseInt(limit);
    const skip = (page - 1) * limit;
    const query = {};

    if (category)
      query.category = { $regex: new RegExp(`^${cleanString(category)}$`, "i") };
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    const sortOptions = {};
    sortOptions[sortBy] = order === "desc" ? -1 : 1;

    const products = await Product.find(query)
      .collation({ locale: "en", strength: 2 })
      .sort(sortOptions)
      .skip(skip)
      .limit(limit);

    if (!products.length) return { success: false, message: "No products found" };

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
    return {
      success: true,
      data: cleanedProducts,
      total,
      page,
      pages: Math.ceil(total / limit),
    };
  } catch (error) {
    logger.error("ProductService Error (GetProducts)", { error: error.message });
    return { success: false, message: error.message };
  }
};

// ✅ Add new product
const addProduct = async ({ name, price, description, image, category, stock, variants }) => {
  try {
    if (!name || price === undefined || isNaN(price))
      return { success: false, message: "Price is required" };

    const existing = await Product.findOne({ name: cleanString(name) });
    if (existing) return { success: false, message: "Product already exists" };

    let totalStock = Number(stock) || 0;

    if (variants && variants.length) {
      variants = variants.map((v) => ({
        color: cleanString(v.color),
        stock: Number(v.stock) || 0,
        price: Number(v.price) || Number(price),
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
    return { success: true, data: newProduct };
  } catch (error) {
    logger.error("ProductService Error (Add)", { error: error.message });
    return { success: false, message: error.message };
  }
};

module.exports = { getAllProducts, addProduct };
