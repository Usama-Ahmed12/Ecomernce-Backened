const jwt = require("jsonwebtoken");
const User = require("../models/user");
const logger = require("../utils/logger");

//  Authenticate (token verify from cookie)
const authenticate = async (req, res, next) => {
  try {
    const token = req.cookies.token; // ✅ cookie se token read karo

    if (!token) {
      logger.warn("Auth failed - Token missing");
      return res.status(401).json({ message: "Not authorized, token missing" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch full user info from DB
    const user = await User.findById(decoded.userId);
    if (!user) {
      logger.warn("Auth failed - User not found");
      return res.status(404).json({ message: "User not found" });
    }

    // Set full user info for controllers
    req.user = {
      userId: user._id,
      email: user.email,
      name: user.name || user.firstName,
      role: user.role
    };

    logger.info("Auth success - Token verified", { userId: decoded.userId });
    next();
  } catch (error) {
    logger.error("Auth error", { error: error.message });
    res.status(401).json({ message: "Not authorized, token failed" });
  }
};

//  Authorize (role check - same as before)
const authorize = (roles = []) => {
  return async (req, res, next) => {
    try {
      const user = await User.findById(req.user.userId);

      if (!user) {
        logger.warn("Authorize failed - User not found");
        return res.status(404).json({ message: "User not found" });
      }

      if (!roles.includes(user.role)) {
        logger.warn("Authorize failed - Role not allowed", { role: user.role });
        return res.status(403).json({ message: "Access denied - Only allowed roles can access" });
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
