// middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');  // ✅ apna logger import

const auth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]; // Bearer <token>

    if (!token) {
      logger.warn(" Auth failed - Token missing", { headers: req.headers });
      return res.status(401).json({ message: 'Not authorized, token missing' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    logger.info("✅ Auth success - Token verified", { userId: decoded.userId });

    req.user = { userId: decoded.userId }; // ✅ set user object
    next();

  } catch (error) {
    logger.error(" Auth error", { error: error.message, stack: error.stack });
    res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

module.exports = { auth };
