const User = require('../models/user');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');   // logger import

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

    // Generate token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });
    logger.info(" Token generated for user", { userId: user._id });

    return { success: true, message: "User registered successfully", token };
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

    // Generate token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });
    logger.info(" Login successful", { userId: user._id, email });

    return { success: true, message: "Login successful", token };
  } catch (error) {
    logger.error(" Login Service Error", { error: error.message, stack: error.stack });
    return { success: false, message: error.message };
  }
};

module.exports = { registerUser, loginUser };
