const productService = require('../Services/productservices');
const { getImageUrl } = require('../utils/imageHelper');
const { createProductSchema } = require('../validation/productValidation');
const logger = require('../utils/logger');

// ✅ Get all products
exports.getAllProducts = async (req, res) => {
  try {
    logger.info(" GetAllProducts API Request");

    const resp = await productService.getAllProducts();

    if (!resp.success) {
      logger.warn(" No products found");
      return res.status(404).json({
        success: false,
        message: resp.message || "No products found",
        data: null,
      });
    }

    const products = resp.data.map(p => ({
      ...p._doc,
      image: getImageUrl(req, p.image),
    }));

    logger.info(" Products fetched successfully", { count: products.length });
    return res.status(200).json({
      success: true,
      message: "Products fetched successfully",
      data: products,
    });
  } catch (error) {
    logger.error(" ProductController Error (GetAll)", { error: error.message });
    return res.status(500).json({
      success: false,
      message: "Server error while fetching products",
      data: null,
    });
  }
};

// ✅ Add new product with validation
exports.addProduct = async (req, res) => {
  try {
    logger.info(" AddProduct API Request", { body: req.body });

    const productData = req.body;

    if (req.file) {
      productData.image = req.file.filename;
    }

    // === Validate product data ===
    const { error } = createProductSchema.validate(productData);
    if (error) {
      logger.warn(" Product validation failed", { error: error.details[0].message });
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
        data: null,
      });
    }

    const resp = await productService.addProduct(productData);

    if (!resp.success) {
      logger.warn(" Product service failed", { message: resp.message });
      return res.status(400).json({
        success: false,
        message: resp.message || "Failed to add product",
        data: null,
      });
    }

    const product = {
      ...resp.data._doc,
      image: getImageUrl(req, resp.data.image),
    };

    logger.info("✅ Product added successfully", { name: product.name });
    return res.status(201).json({
      success: true,
      message: "Product added successfully",
      data: product,
    });
  } catch (error) {
    logger.error("❌ ProductController Error (Add)", { error: error.message });
    return res.status(500).json({
      success: false,
      message: "Server error while adding product",
      data: null,
    });
  }
};
