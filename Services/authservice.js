const User = require('../models/user');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// ✅ Register User
const registerUser = async ({ name, email, password }) => {
  try {
    // Check existingn
    const userExists = await User.findOne({ email });
    if (userExists) {
      return { success: false, message: "User already exists" };
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await User.create({ name, email, password: hashedPassword });

    // Generate token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });

    return { success: true, message: "User registered successfully", token };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

// ✅ Login User
const loginUser = async ({ email, password }) => {
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return { success: false, message: "Invalid credentials" };
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return { success: false, message: "Invalid credentials" };
    }

    // Generate token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });

    return { success: true, message: "Login successful", token };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

module.exports = { registerUser, loginUser };
