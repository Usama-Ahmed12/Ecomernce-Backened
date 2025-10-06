const Product = require("../models/productModel");
const logger = require("../utils/logger");

// Helper: Clean string fields
const cleanString = (str) => {
  if (!str) return "";
  return str.replace(/^["']|["',]$/g, "").trim();
};


//  Get Products with Pagination + Filtering + Sorting + Price Range
const getAllProducts = async ({ 
  page = 1, 
  limit = 10, 
  category, 
  sortBy = "name", 
  order = "asc",
  minPrice,
  maxPrice
}) => {
  try {
    page = parseInt(page) || 1;
    limit = parseInt(limit) || 10;
    const skip = (page - 1) * limit;

    const query = {};

    //  Category filter
    if (category) {
      query.category = { $regex: new RegExp(`^${cleanString(category)}$`, "i") };
    }

    //  Price range filter
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    const sortOrder = order === "desc" ? -1 : 1;
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder;

    const products = await Product.find(query)
      .collation({ locale: "en", strength: 2 }) // Case-insensitive sorting
      .sort(sortOptions)
      .skip(skip)
      .limit(limit);

    // Clean strings in result
    const cleanedProducts = products.map(p => ({
      ...p.toObject(),
      name: cleanString(p.name),
      description: cleanString(p.description),
      category: cleanString(p.category),
      variants: p.variants.map(v => ({
        ...v.toObject(),
        color: cleanString(v.color),
        description: cleanString(v.description),
      }))
    }));

    const total = await Product.countDocuments(query);

    if (!products || products.length === 0) {
      return { success: false, message: "No products found" };
    }

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


//  Add New Product (with Variants & Number Conversion)

const addProduct = async ({ name, price, description, image, category, stock, variants }) => {
  try {
    if (!name || !price) {
      return { success: false, message: "Name and price are required" };
    }

    const existing = await Product.findOne({ name: cleanString(name) });
    if (existing) {
      return { success: false, message: "Product already exists" };
    }

    let totalStock = Number(stock) || 0;

    if (variants && variants.length > 0) {
      variants = variants.map(v => ({
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
