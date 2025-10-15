const authService = require('../services/authService');
const { registerSchema, loginSchema, refreshTokenSchema } = require('../validation/authValidation');
const logger = require('../utils/logger');

//  Register Controller
const registerUser = async (req, res) => {
  try {
    logger.info("Register API Request", { body: req.body });

    // Joi Validation
    const { error } = registerSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const resp = await authService.registerUser(req.body);
    if (!resp.success) {
      return res.status(400).json(resp);
    }

    return res.status(201).json(resp);
  } catch (error) {
    logger.error("Register Controller Error", { error: error.message });
    return res.status(500).json({ success: false, message: error.message });
  }
};

//  Verify Email Controller
const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;
    const resp = await authService.verifyEmail(token);

    if (!resp.success) {
      return res.status(400).json(resp);
    }

    return res.status(200).json(resp);
  } catch (error) {
    logger.error("Verify Email Controller Error", { error: error.message });
    return res.status(500).json({ success: false, message: error.message });
  }
};

//  Login Controller
const loginUser = async (req, res) => {
  try {
    logger.info("Login API Request", { body: req.body });

    const { error } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const resp = await authService.loginUser(req.body);
    if (!resp.success) {
      return res.status(400).json(resp);
    }

    return res.status(200).json(resp);
  } catch (error) {
    logger.error("Login Controller Error", { error: error.message });
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Refresh Token Controller
const refreshToken = async (req, res) => {
  try {
    const { error } = refreshTokenSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const resp = authService.refreshAccessToken(req.body);
    if (!resp.success) {
      return res.status(403).json(resp);
    }

    return res.status(200).json(resp);
  } catch (error) {
    logger.error("Refresh Token Controller Error", { error: error.message });
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { registerUser, verifyEmail, loginUser, refreshToken };
