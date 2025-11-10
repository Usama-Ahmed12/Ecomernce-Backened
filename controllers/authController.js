const authService = require('../Services/authService');
const { registerSchema, loginSchema, refreshTokenSchema, resendVerificationSchema } = require('../validation/authValidation');
const logger = require('../utils/logger');

//  Register Controller
const registerUser = async (req, res) => {
  try {
    logger.info("Register API Request", { body: req.body });
    const { error } = registerSchema.validate(req.body);
    if (error) return res.status(400).json({ success: false, message: error.details[0].message });

    const resp = await authService.registerUser(req.body);
    return res.status(resp.success ? 201 : 400).json(resp);
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
    return res.status(resp.success ? 200 : 400).json(resp);
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
    if (error) return res.status(400).json({ success: false, message: error.details[0].message });

    const resp = await authService.loginUser(req.body);
    return res.status(resp.success ? 200 : 400).json(resp);
  } catch (error) {
    logger.error("Login Controller Error", { error: error.message });
    return res.status(500).json({ success: false, message: error.message });
  }
};

//  Refresh Token Controller
const refreshToken = async (req, res) => {
  try {
    const { error } = refreshTokenSchema.validate(req.body);
    if (error) return res.status(400).json({ success: false, message: error.details[0].message });

    const resp = authService.refreshAccessToken(req.body);
    return res.status(resp.success ? 200 : 403).json(resp);
  } catch (error) {
    logger.error("Refresh Token Controller Error", { error: error.message });
    return res.status(500).json({ success: false, message: error.message });
  }
};

//  Resend Verification Email Controller
const resendVerificationEmail = async (req, res) => {
  try {
    const { error } = resendVerificationSchema.validate(req.body);
    if (error) return res.status(400).json({ success: false, message: error.details[0].message });

    const resp = await authService.resendVerificationEmail(req.body.email);
    return res.status(resp.success ? 200 : 400).json(resp);
  } catch (error) {
    logger.error("Resend Verification Controller Error", { error: error.message });
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { 
  registerUser,
  verifyEmail,
  loginUser,
  refreshToken,
  resendVerificationEmail
};
