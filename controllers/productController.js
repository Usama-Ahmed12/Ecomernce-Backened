const productService = require('../Services/productservices'); 


// ✅ Get all products
exports.getAllProducts = async (req, res) => {
  try {
    const resp = await productService.getAllProducts();

    if (!resp.success) {
      return res.status(404).json({ success: false, message: resp.message });
    }
    return res.status(200).json({ success: true, data: resp.data });
  } catch (error) {
    console.error("ProductController Error:", error.message);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ✅ Add new product
exports.addProduct = async (req, res) => {
  try {
    const resp = await productService.addProduct(req.body);

    if (!resp.success) {
      return res.status(400).json({ success: false, message: resp.message });
    }
    return res.status(201).json({ success: true, data: resp.data });
  } catch (error) {
    console.error("ProductController Error:", error.message);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
