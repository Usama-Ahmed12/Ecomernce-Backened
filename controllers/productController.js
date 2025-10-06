const productService = require("../Services/productservices"); 
const { getImageUrl } = require("../utils/imageHelper");
const { createProductSchema } = require("../validation/productValidation");
const logger = require("../utils/logger");

//  Get Products (with pagination, filtering, sorting, price range)

exports.getAllProducts = async (req, res) => { 
  try {
    logger.info("GetAllProducts API Request");

    //  Query params (page, limit, category, sorting, price range)
    const { page, limit, category, sortBy, order, minPrice, maxPrice } = req.query;

    //  Service call with all filters
    const resp = await productService.getAllProducts({ 
      page, 
      limit, 
      category, 
      sortBy, 
      order,
      minPrice,
      maxPrice
    });

    if (!resp.success) {
      logger.warn("No products found (with filters)");
      return res.status(404).json({
        success: false,
        message: resp.message || "No products found",
        data: null,
      });
    }

    // 🔹 Convert image path to full URL
    const products = resp.data.map((p) => ({
      ...p,
      image: getImageUrl(req, p.image),
    }));

    return res.status(200).json({
      success: true,
      message: "Products fetched successfully",
      total: resp.total,
      page: resp.page,
      pages: resp.pages,
      data: products,
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

//  Add New Product
exports.addProduct = async (req, res) => {
  try {
    logger.info("AddProduct API Request", { body: req.body });

    const productData = req.body;

    // 🔹 If image uploaded
    if (req.file) {
      productData.image = req.file.filename;
    }

    // 🔹 Validate product data using Joi
    const { error } = createProductSchema.validate(productData);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
        data: null,
      });
    }

    //  Call service to add product
    const resp = await productService.addProduct(productData);

    if (!resp.success) {
      return res.status(400).json({
        success: false,
        message: resp.message || "Failed to add product",
        data: null,
      });
    }

    //  Convert image path
    const product = {
      ...resp.data.toObject(),
      image: getImageUrl(req, resp.data.image),
    };

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
