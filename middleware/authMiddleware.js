// middleware/authMiddleware.js
const jwt = require("jsonwebtoken");
const User = require("../models/user");
const logger = require("../utils/logger");

// ✅ Authenticate (token verify)
const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1]; // Bearer <token>

    if (!token) {
      logger.warn("Auth failed - Token missing");
      return res.status(401).json({ message: "Not authorized, token missing" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // ✅ Fix: userId use karna hai, id nahi
    req.user = { id: decoded.userId };
    logger.info("Auth success - Token verified", { userId: decoded.userId });

    next();
  } catch (error) {
    logger.error("Auth error", { error: error.message });
    res.status(401).json({ message: "Not authorized, token failed" });
  }
};

// ✅ Authorize (role check)
const authorize = (roles = []) => {
  return async (req, res, next) => {
    try {
      const user = await User.findById(req.user.id);

      if (!user) {
        logger.warn("Authorize failed - User not found");
        return res.status(404).json({ message: "User not found" });
      }

      if (!roles.includes(user.role)) {
        logger.warn("Authorize failed - Role not allowed", { role: user.role });
        return res.status(403).json({ message: "Access denied - Only admin can add product" }); // ✅ updated line
      }

      logger.info("Authorize success", { role: user.role });
      next();
    } catch (error) {
      logger.error("Authorize error", { error: error.message });
      res.status(500).json({ message: "Server error during authorization" });
    }
  };
};

module.exports = { authenticate, authorize };
