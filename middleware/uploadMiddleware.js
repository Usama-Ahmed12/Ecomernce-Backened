const multer = require("multer");

// ✅ Storage setup
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads"); // images uploads folder me save hongi
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

// ✅ File filter: sirf images allow
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed!"), false);
  }
};

// ✅ Upload instance
const upload = multer({ storage, fileFilter });

// ✅ Flexible upload middleware (koi bhi field name chale)
function uploadAnyImage() {
  return (req, res, next) => {
    // upload.any() → koi bhi field name se file accept karega
    upload.any()(req, res, (err) => {
      if (err) {
        return res.status(400).json({ success: false, message: err.message });
      }

      // agar koi file nahi upload hui
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ success: false, message: "No image uploaded!" });
      }

      // pehli file ka data req.file me rakh do
      req.file = req.files[0];

      next();
    });
  };
}

module.exports = uploadAnyImage;
