const productService = require("../Services/productServices");
const { getImageUrl } = require("../utils/imageHelper");
const { createProductSchema } = require("../validation/productValidation");
const logger = require("../utils/logger");

// 🧠 Clean incoming form-data body (remove spaces and arrays)
const normalizeBody = (body) => {
  const normalized = {};
  for (const key in body) {
    const cleanKey = key.trim();
    let val = body[key];

    // If multiple same keys (Postman form-data duplicates)
    if (Array.isArray(val)) {
      const pick = val.find(v => v && v.trim() !== "") || val[0];
      val = pick;
    }

    if (typeof val === "string") val = val.trim();
    normalized[cleanKey] = val;
  }
  return normalized;
};

// ✅ Get all products
exports.getAllProducts = async (req, res) => {
  try {
    const { page, limit, category, sortBy, order, minPrice, maxPrice } = req.query;
    const resp = await productService.getAllProducts({ page, limit, category, sortBy, order, minPrice, maxPrice });

    if (!resp.success)
      return res.status(404).json({ success: false, message: resp.message, data: null });

    const products = resp.data.map(p => ({ ...p, image: getImageUrl(req, p.image) }));

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
    return res.status(500).json({ success: false, message: "Server error while fetching products", data: null });
  }
};

// ✅ Add new product (Admin only)
exports.addProduct = async (req, res) => {
  try {
    console.log("🧠 Raw req.body:", req.body);
    console.log("🖼️ req.file:", req.file);

    // Normalize form-data
    let productData = normalizeBody(req.body);

    // Parse variants if sent as JSON string
    if (productData.variants && typeof productData.variants === "string") {
      try {
        productData.variants = JSON.parse(productData.variants);
      } catch (err) {
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

    console.log("🧩 Normalized productData:", productData);

    // Joi validation
    const { error } = createProductSchema.validate(productData);
    if (error)
      return res.status(400).json({ success: false, message: error.details[0].message, data: null });

    // Call service
    const resp = await productService.addProduct(productData);

    if (!resp.success)
      return res.status(400).json({ success: false, message: resp.message, data: null });

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
