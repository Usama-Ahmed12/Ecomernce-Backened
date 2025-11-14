const authService = require('../Services/authService');
const { registerSchema, loginSchema, refreshTokenSchema, resendVerificationSchema } = require('../validation/authValidation');
const logger = require('../utils/logger');
const STATUS_CODES = require('../utils/statusCodes'); // <-- IMPORTED
const MESSAGES = require('../utils/messages');     // <-- IMPORTED

//  Register Controller
const registerUser = async (req, res) => {
  try {
    logger.info("Register API Request", { body: req.body });
    const { error } = registerSchema.validate(req.body);
    if (error) return res.status(STATUS_CODES.BAD_REQUEST).json({ success: false, message: error.details[0].message });

    const resp = await authService.registerUser(req.body);
    // Service se aane wala statusCode istemal karen, agar success nahi to BAD_REQUEST (default)
    return res.status(resp.statusCode || STATUS_CODES.BAD_REQUEST).json(resp);
  } catch (error) {
    logger.error("Register Controller Error", { error: error.message });
    return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ success: false, message: MESSAGES.SERVER_ERROR });
  }
};

//  Verify Email Controller
const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;
    const resp = await authService.verifyEmail(token);
    // Service se aane wala statusCode istemal karen, agar success nahi to BAD_REQUEST (default)
    return res.status(resp.statusCode || STATUS_CODES.BAD_REQUEST).json(resp);
  } catch (error) {
    logger.error("Verify Email Controller Error", { error: error.message });
    return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ success: false, message: MESSAGES.SERVER_ERROR });
  }
};

//  Login Controller (with Cookie)
const loginUser = async (req, res) => {
  try {
    logger.info("Login API Request", { body: req.body });
    const { error } = loginSchema.validate(req.body);
    if (error) return res.status(STATUS_CODES.BAD_REQUEST).json({ success: false, message: error.details[0].message });

    const resp = await authService.loginUser(req.body);

    if (!resp.success) {
      // Agar service se success nahi mila, to service ka statusCode istemal karen
      return res.status(resp.statusCode || STATUS_CODES.BAD_REQUEST).json(resp);
    }

    //  'token' naam ki cookie mein accessToken set karein
    res.cookie("token", resp.accessToken, {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 1 din
      secure: process.env.NODE_ENV === "production", // production me HTTPS only
      sameSite: "strict",
    });

    // Optionally, 'refreshToken' ko bhi alag cookie mein set karein
    if (resp.refreshToken) {
        res.cookie("refreshToken", resp.refreshToken, {
            httpOnly: true,
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 din ke liye
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
        });
    }

    // --- YAHAN CHANGE KIYA GAYA HAI ---
    return res.status(STATUS_CODES.OK).json({
      success: true,
      message: MESSAGES.LOGIN_SUCCESS,
      // 'user: resp.user,' wali line hata di gayi hai
      // accessToken: resp.accessToken, // agar client ko tokens bhejna chahte ho, toh rehne do (optional)
      // refreshToken: resp.refreshToken, // agar client ko tokens bhejna chahte ho, toh rehne do (optional)
    });
    // --- CHANGE END ---

  } catch (error) {
    logger.error("Login Controller Error", { error: error.message });
    return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ success: false, message: MESSAGES.SERVER_ERROR });
  }
};

//  Logout Controller
const logoutUser = (req, res) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });
    // Agar refreshToken cookie bhi set ki hai toh usko bhi clear karein
    res.clearCookie("refreshToken", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
    });
    logger.info("Logout successful - Token cookie(s) cleared.");
    return res.status(STATUS_CODES.OK).json({ success: true, message: MESSAGES.LOGOUT_SUCCESS });
  } catch (error) {
    logger.error("Logout Controller Error", { error: error.message });
    return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ success: false, message: MESSAGES.SERVER_ERROR });
  }
};


//  Refresh Token Controller
const refreshToken = async (req, res) => {
  try {
    // Agar refreshToken cookie mein hai toh body ki bajaye cookie se read karein
    const currentRefreshToken = req.cookies.refreshToken;

    if (!currentRefreshToken) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({ success: false, message: MESSAGES.REFRESH_TOKEN_MISSING });
    }

    const resp = await authService.refreshAccessToken({ token: currentRefreshToken }); // Service ko cookie wala token bheja

    if (!resp.success) {
      // Agar service se success nahi mila, to service ka statusCode istemal karen
      return res.status(resp.statusCode || STATUS_CODES.FORBIDDEN).json(resp);
    }

    // Naya accessToken cookie mein set karein
    res.cookie("token", resp.accessToken, {
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, // 1 din
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict", // SameSite ko 'strict' rakha, pehle 'none' tha. Agar cross-site requests ho toh 'none' (with secure: true) ki zaroorat pad sakti hai.
    });

    return res.status(STATUS_CODES.OK).json({ success: true, message: MESSAGES.REFRESH_TOKEN_SUCCESS, accessToken: resp.accessToken });
  } catch (error) {
    logger.error("Refresh Token Controller Error", { error: error.message });
    return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ success: false, message: MESSAGES.SERVER_ERROR });
  }
};

//  Resend Verification Email Controller
const resendVerificationEmail = async (req, res) => {
  try {
    const { error } = resendVerificationSchema.validate(req.body);
    if (error) return res.status(STATUS_CODES.BAD_REQUEST).json({ success: false, message: error.details[0].message });

    const resp = await authService.resendVerificationEmail(req.body.email);
    // Service se aane wala statusCode istemal karen, agar success nahi to BAD_REQUEST (default)
    return res.status(resp.statusCode || STATUS_CODES.BAD_REQUEST).json(resp);
  } catch (error) {
    logger.error("Resend Verification Controller Error", { error: error.message });
    return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ success: false, message: MESSAGES.SERVER_ERROR });
  }
};

module.exports = {
  registerUser,
  verifyEmail,
  loginUser,
  logoutUser,
  refreshToken,
  resendVerificationEmail
};