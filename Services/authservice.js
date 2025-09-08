const User = require('../models/user');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');   // logger import

// ✅ Helper function to generate tokens
const generateTokens = (userId) => {
  // Access Token (short expiry)
  const accessToken = jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }   // short expiry
  );

  // Refresh Token (long expiry)
  const refreshToken = jwt.sign(
    { userId },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }    // long expiry
  );

  return { accessToken, refreshToken };
};

// ✅ Register User
const registerUser = async ({ name, email, password }) => {
  try {
    logger.info(" Checking if user exists", { email });

    // Check existing
    const userExists = await User.findOne({ email });
    if (userExists) {
      logger.warn(" User already exists", { email });
      return { success: false, message: "User already exists" };
    }

    // Hash password
    logger.info(" Hashing password", { email });
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await User.create({ name, email, password: hashedPassword });
    logger.info(" User created successfully", { userId: user._id, email });

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user._id);
    logger.info(" Tokens generated for user", { userId: user._id });

    return {
      success: true,
      message: "User registered successfully",
      accessToken,
      refreshToken
    };
  } catch (error) {
    logger.error(" Register Service Error", { error: error.message, stack: error.stack });
    return { success: false, message: error.message };
  }
};

// ✅ Login User
const loginUser = async ({ email, password }) => {
  try {
    logger.info(" Login attempt", { email });

    const user = await User.findOne({ email });
    if (!user) {
      logger.warn(" Login failed: user not found", { email });
      return { success: false, message: "Invalid credentials" };
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      logger.warn(" Login failed: wrong password", { email });
      return { success: false, message: "Invalid credentials" };
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user._id);
    logger.info(" Login successful", { userId: user._id, email });

    return {
      success: true,
      message: "Login successful",
      accessToken,
      refreshToken
    };
  } catch (error) {
    logger.error(" Login Service Error", { error: error.message, stack: error.stack });
    return { success: false, message: error.message };
  }
};

// ✅ Refresh Access Token
const refreshAccessToken = (payload) => {
  try {

    const decoded = jwt.verify(payload.token, process.env.JWT_REFRESH_SECRET);

    const accessToken = jwt.sign(
      { userId: decoded.userId },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    logger.info(" New Access Token generated", { userId: decoded.userId });

    return {
      success: true,
      message: "New access token generated",
      accessToken
    };
  } catch (error) {
    logger.warn(" Invalid refresh token", { error: error.message });
    return { success: false, message: "Invalid or expired refresh token" };
  }
};

module.exports = { registerUser, loginUser, refreshAccessToken };
