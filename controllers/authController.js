const authService = require('../Services/authservice');
const { registerSchema, loginSchema, refreshTokenSchema } = require('../validation/authValidation');
const logger = require('../utils/logger');

//  Register User
const registerUser = async (req, res) => {
  try {
    logger.info(" Register API Request", { body: req.body });

    // Joi Validation
    const { error } = registerSchema.validate(req.body);
    if (error) {
      logger.warn(" Validation failed at Register", { error: error.details[0].message });
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
        data: null
      });
    }

    // Service call
    const resp = await authService.registerUser(req.body);

    if (!resp.success) {
      logger.warn(" Register Service failed", { message: resp.message });
      return res.status(400).json({
        success: false,
        message: resp.message,
        data: null
      });
    }

    logger.info(" Register Success", { user: req.body.email });
    return res.status(201).json({
      success: true,
      message: resp.message,
      data: {
        accessToken: resp.accessToken,
        refreshToken: resp.refreshToken
      }
    });

  } catch (error) {
    logger.error(" Register Error", { error: error.message, stack: error.stack });
    return res.status(500).json({
      success: false,
      message: error.message || "Registration failed!",
      data: null
    });
  }
};

//  Login User
const loginUser = async (req, res) => {
  try {
    logger.info(" Login API Request", { body: req.body });

    // Joi Validation
    const { error } = loginSchema.validate(req.body);
    if (error) {
      logger.warn(" Validation failed at Login", { error: error.details[0].message });
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
        data: null
      });
    }

    // Service call
    const resp = await authService.loginUser(req.body);

    if (!resp.success) {
      logger.warn(" Login Service failed", { message: resp.message });
      return res.status(400).json({
        success: false,
        message: resp.message,
        data: null
      });
    }

    logger.info(" Login Success", { user: req.body.email });
    return res.status(200).json({
      success: true,
      message: resp.message,
      data: {
        accessToken: resp.accessToken,
        refreshToken: resp.refreshToken
      }
    });

  } catch (error) {
    logger.error("  Login Error", { error: error.message, stack: error.stack });
    return res.status(500).json({
      success: false,
      message: error.message || "Login failed!",
      data: null
    });
  }
};

//  Refresh Token
const refreshToken = async (req, res) => {
  try {
    logger.info(" Refresh Token API Request", { body: req.body });

    // Joi Validation
    const { error } = refreshTokenSchema.validate(req.body);
    if (error) {
      logger.warn(" Validation failed at Refresh Token", { error: error.details[0].message });
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
        data: null
      });
    }

    // Service call
    const { token } = req.body;
    const resp = authService.refreshAccessToken(token);

    if (!resp.success) {
      logger.warn(" Refresh Token Service failed", { message: resp.message });
      return res.status(403).json({
        success: false,
        message: resp.message,
        data: null
      });
    }

    logger.info(" New Access Token generated", { token: resp.accessToken });
    return res.status(200).json({
      success: true,
      message: resp.message,
      data: { accessToken: resp.accessToken }
    });

  } catch (error) {
    logger.error(" Refresh Token Error", { error: error.message, stack: error.stack });
    return res.status(500).json({
      success: false,
      message: error.message || "Could not refresh token",
      data: null
    });
  }
};

module.exports = { registerUser, loginUser, refreshToken };
