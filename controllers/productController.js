const productService = require('../Services/productservices');
const multer = require('multer');

// ✅ Multer setup for image upload (uploads folder)
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads'); // images uploads folder me save hongi
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

// Helper function to build image URL correctly
function getImageUrl(req, image) {
  if (!image) return null;
  // agar image already ek URL hai (http ya https)
  if (image.startsWith('http://') || image.startsWith('https://')) {
    return image;
  }
  // warna local uploads folder ka URL banao
  return `${req.protocol}://${req.get('host')}/uploads/${image}`;
}

// ✅ Get all products
exports.getAllProducts = async (req, res) => {
  try {
    const resp = await productService.getAllProducts();

    if (!resp.success) {
      return res.status(404).json({ success: false, message: resp.message });
    }

    const products = resp.data.map(p => ({
      ...p._doc,
      image: getImageUrl(req, p.image)
    }));

    return res.status(200).json({ success: true, data: products });
  } catch (error) {
    console.error("ProductController Error:", error.message);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ✅ Add new product with image
exports.addProduct = async (req, res) => {
  try {
    const productData = req.body;

    // Agar file upload ho rahi hai
    if (req.file) {
      productData.image = req.file.filename;
    }

    const resp = await productService.addProduct(productData);

    if (!resp.success) {
      return res.status(400).json({ success: false, message: resp.message });
    }

    const product = {
      ...resp.data._doc,
      image: getImageUrl(req, resp.data.image)
    };

    return res.status(201).json({ success: true, data: product });
  } catch (error) {
    console.error("ProductController Error:", error.message);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ✅ Export multer upload for routes
exports.upload = upload;
