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

//  Login Controller (with Cookie) - Ab sahi kiya gaya hai!
const loginUser = async (req, res) => {
  try {
    logger.info("Login API Request", { body: req.body });
    const { error } = loginSchema.validate(req.body);
    if (error) return res.status(400).json({ success: false, message: error.details[0].message });

    const resp = await authService.loginUser(req.body); // Yahan resp mein accessToken aur refreshToken hain

    if (!resp.success) {
      return res.status(400).json(resp);
    }

    // ✅ 'token' naam ki cookie mein accessToken set karein
    res.cookie("token", resp.accessToken, { // <-- Yahan 'resp.accessToken' use kiya hai
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

    return res.status(200).json({
      success: true,
      message: "Logged in successfully",
      user: resp.user, // Assuming AuthService user details bhi return kar raha hai
      // Agar aap client-side ko bhi tokens bhejna chahte hain, toh yahan shamil kar sakte hain
      // accessToken: resp.accessToken,
      // refreshToken: resp.refreshToken,
    });

  } catch (error) {
    logger.error("Login Controller Error", { error: error.message });
    return res.status(500).json({ success: false, message: error.message });
  }
};

//  Logout Controller - Yeh theek hai
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
    return res.status(200).json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    logger.error("Logout Controller Error", { error: error.message });
    return res.status(500).json({ success: false, message: error.message });
  }
};


//  Refresh Token Controller - Ab sahi kiya gaya hai
const refreshToken = async (req, res) => {
  try {
    // Agar refreshToken cookie mein hai toh body ki bajaye cookie se read karein
    const currentRefreshToken = req.cookies.refreshToken; // <-- Ab cookie se read ho raha hai

    if (!currentRefreshToken) {
      return res.status(400).json({ success: false, message: "Refresh token missing" });
    }

    const resp = await authService.refreshAccessToken({ token: currentRefreshToken }); // Service ko cookie wala token bheja

    if (!resp.success) {
      return res.status(403).json(resp);
    }

    // Naya accessToken cookie mein set karein
    res.cookie("token", resp.accessToken, {
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, // 1 din
        secure: process.env.NODE_ENV === "production",
        sameSite: "none",
    });

    return res.status(200).json({ success: true, message: "New access token generated", accessToken: resp.accessToken });
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
  logoutUser,
  refreshToken,
  resendVerificationEmail
};