const jwt = require("jsonwebtoken");
const User = require("../models/user");
const logger = require("../utils/logger");
const STATUS_CODES = require("../utils/statusCodes"); // <-- IMPORTED
const MESSAGES = require("../utils/messages");     // <-- IMPORTED

//  Authenticate (token verify from cookie)
const authenticate = async (req, res, next) => {
  try {
    const token = req.cookies.token; // ✅ cookie se token read karo

    if (!token) {
      logger.warn("AuthMiddleware: authenticate - Token missing in cookies.");
      return res.status(STATUS_CODES.UNAUTHORIZED).json({
        success: false,
        message: MESSAGES.AUTH_TOKEN_MISSING
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    logger.debug("AuthMiddleware: authenticate - Token decoded successfully", { userId: decoded.userId });

    // Fetch full user info from DB
    const user = await User.findById(decoded.userId);
    if (!user) {
      logger.warn("AuthMiddleware: authenticate - User not found for decoded token", { userId: decoded.userId });
      // Although user not found, technically token was valid for a user that might have been deleted.
      // 401 is still appropriate for "not authorized" if the user doesn't exist anymore.
      return res.status(STATUS_CODES.UNAUTHORIZED).json({ // Changed from 404 to 401 for consistency in auth failures
        success: false,
        message: MESSAGES.AUTH_USER_NOT_FOUND
      });
    }

    // Set full user info for controllers
    req.user = {
      userId: user._id.toString(), // Store as string for consistency
      email: user.email,
      name: user.firstName || user.name, // Use firstName if available, else name
      role: user.role
    };

    logger.info("AuthMiddleware: authenticate - Authentication successful", { userId: req.user.userId, role: req.user.role });
    next();
  } catch (error) {
    logger.error("AuthMiddleware: authenticate - Authentication failed", { error: error.message, stack: error.stack });
    // jwt.verify errors (TokenExpiredError, JsonWebTokenError) usually mean invalid/expired token.
    return res.status(STATUS_CODES.UNAUTHORIZED).json({
      success: false,
      message: MESSAGES.AUTH_TOKEN_INVALID
    });
  }
};

//  Authorize (role check - same as before)
const authorize = (roles = []) => {
  return async (req, res, next) => {
    try {
      // req.user will be available from the authenticate middleware
      if (!req.user || !req.user.userId) {
        logger.error("AuthMiddleware: authorize - req.user not set before authorization, this should not happen.");
        return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ // Critical internal error
          success: false,
          message: MESSAGES.SERVER_ERROR
        });
      }

      // We already have user role from authenticate, no need to fetch again
      const userRole = req.user.role;

      if (!roles.includes(userRole)) {
        logger.warn("AuthMiddleware: authorize - Access denied due to insufficient role", { requiredRoles: roles, userRole });
        return res.status(STATUS_CODES.FORBIDDEN).json({
          success: false,
          message: MESSAGES.AUTH_ACCESS_DENIED
        });
      }

      logger.info("AuthMiddleware: authorize - Authorization successful", { userId: req.user.userId, role: userRole });
      next();
    } catch (error) {
      logger.error("AuthMiddleware: authorize - Authorization failed unexpectedly", { error: error.message, stack: error.stack, userId: req.user?.userId });
      return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: MESSAGES.SERVER_ERROR
      });
    }
  };
};

module.exports = { authenticate, authorize };