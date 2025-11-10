const User = require('../models/user');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto'); // for verification token
const logger = require('../utils/logger');
const sendEmail = require('../utils/sendEmail'); // Email utility

// Helper function to generate tokens
const generateTokens = (userId) => {
  const accessToken = jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '15m' });
  const refreshToken = jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
  return { accessToken, refreshToken };
};

//  Register User (with backend verification link)
const registerUser = async ({ firstName, lastName, phoneNumber, email, password, address, role }) => {
  try {
    logger.info("Checking if user exists", { email }); 

    const userExists = await User.findOne({ email });
    if (userExists) {
      return { success: false, message: "User already exists" };
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    //  Generate verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationTokenExpiry = Date.now() + 24 * 60 * 60 * 1000; // 24 hours expiry

    const user = await User.create({
      firstName,
      lastName,
      phoneNumber,
      email,
      password: hashedPassword,
      address,
      role: role || "user",
      verificationToken,
      verificationTokenExpiry,
    });

    logger.info("User created successfully", { userId: user._id, email });

    //  Backend-friendly verification link
    const verificationLink = `${process.env.BASE_URL}/api/auth/verify/${verificationToken}`;

    const html = `
      <div style="font-family: Arial, sans-serif; background-color: #f6f6f6ff; padding: 30px;">
        <div style="max-width: 600px; background: white; margin: auto; border-radius: 10px; padding: 20px; text-align: center;">
          <h2 style="color:#222;">Welcome to <span style="color:#E91E63;">Mahas Creation</span> 🎉</h2>
          <p style="font-size:16px; color:#555;">Hi <b>${user.firstName}</b>,</p>
          <p style="font-size:15px; color:#555;">Please verify your email by clicking the button below:</p>
          <a href="${verificationLink}" 
             style="display:inline-block;background-color:#E91E63;color:white;padding:12px 25px;
                    border-radius:5px;text-decoration:none;margin-top:10px;font-weight:bold;">
             Verify My Email
          </a>
          <p style="font-size:13px; color:#777; margin-top:20px;">This link will expire in 24 hours.</p>
          <hr style="margin:20px 0; border:none; border-top:1px solid #eeeeee;">
          <p style="font-size:12px; color:#999;">Ignore this email if you didn't sign up.</p>
        </div>
      </div>
    `;

    try {
      await sendEmail({
        to: user.email,
        subject: "Verify Your Email - Mahas Creation",
        html,
      });
      logger.info("Verification email sent to user", { email: user.email });
    } catch (err) {
      logger.warn("Failed to send verification email", { error: err.message });
    }

    //  Notify Admin
    try {
      await sendEmail({
        to: process.env.ADMIN_EMAIL,
        subject: "🧍 New User Registered",
        text: `A new user has signed up:\n\nName: ${firstName} ${lastName}\nEmail: ${email}\nPhone: ${phoneNumber}`,
      });
      logger.info("Admin notified of new registration", { email });
    } catch (err) {
      logger.warn("Failed to notify admin", { error: err.message });
    }

    return { success: true, message: "Verification email sent. Please verify your account." };

  } catch (error) {
    logger.error("Register Service Error", { error: error.message });
    return { success: false, message: error.message };
  }
};

//  Verify Email
const verifyEmail = async (token) => {
  try {
    const user = await User.findOne({
      verificationToken: token,
      verificationTokenExpiry: { $gt: Date.now() },
    });

    if (!user) {
      return { success: false, message: "Invalid or expired verification token" };
    }

    await User.updateOne(
      { _id: user._id },
      {
        $set: { isVerified: true },
        $unset: { verificationToken: "", verificationTokenExpiry: "" },
      }
    );

    logger.info("User email verified", { email: user.email });
    return { success: true, message: "Email verified successfully" };
  } catch (error) {
    logger.error("Verify Email Error", { error: error.message });
    return { success: false, message: error.message };
  }
};

// Resend Verification Email
const resendVerificationEmail = async (email) => {
  try {
    const user = await User.findOne({ email });
    if (!user) return { success: false, message: "User not found" };
    if (user.isVerified) return { success: false, message: "User already verified" };

    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationTokenExpiry = Date.now() + 24*60*60*1000; // 24 hours

    await User.updateOne(
      { _id: user._id },
      { $set: { verificationToken, verificationTokenExpiry } }
    );

    const verificationLink = `${process.env.BASE_URL}/api/auth/verify/${verificationToken}`;

    const html = `
      <div style="font-family: Arial, sans-serif; background-color: #f6f6f6ff; padding: 30px;">
        <div style="max-width: 600px; background: white; margin: auto; border-radius: 10px; padding: 20px; text-align: center;">
          <h2 style="color:#222;">Welcome to <span style="color:#E91E63;">Mahas Creation</span> 🎉</h2>
          <p style="font-size:16px; color:#555;">Hi <b>${user.firstName}</b>,</p>
          <p style="font-size:15px; color:#555;">Please verify your email by clicking the button below:</p>
          <a href="${verificationLink}" 
             style="display:inline-block;background-color:#E91E63;color:white;padding:12px 25px;
                    border-radius:5px;text-decoration:none;margin-top:10px;font-weight:bold;">
             Verify My Email
          </a>
          <p style="font-size:13px; color:#777; margin-top:20px;">This link will expire in 24 hours.</p>
          <hr style="margin:20px 0; border:none; border-top:1px solid #eeeeee;">
          <p style="font-size:12px; color:#999;">Ignore this email if you didn't sign up.</p>
        </div>
      </div>
    `;

    await sendEmail({
      to: user.email,
      subject: "Verify Your Email - Mahas Creation",
      html,
    });

    return { success: true, message: "Verification email resent successfully" };

  } catch (error) {
    logger.error("Resend Verification Email Error", { error: error.message });
    return { success: false, message: error.message };
  }
};

//  Login User (with verification check)
const loginUser = async ({ email, password }) => {
  try {
    logger.info("Login attempt", { email });

    const user = await User.findOne({ email });
    if (!user) return { success: false, message: "Invalid credentials" };
    if (!user.isVerified) return { success: false, message: "Please verify your email before logging in." };

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return { success: false, message: "Invalid credentials" };

    const { accessToken, refreshToken } = generateTokens(user._id);
    logger.info("Login successful", { userId: user._id, email });

    return { success: true, message: "Login successful", accessToken, refreshToken };
  } catch (error) {
    logger.error("Login Service Error", { error: error.message });
    return { success: false, message: error.message };
  }
};

// Refresh Access Token
const refreshAccessToken = (payload) => {
  try {
    const decoded = jwt.verify(payload.token, process.env.JWT_REFRESH_SECRET);
    const accessToken = jwt.sign({ userId: decoded.userId }, process.env.JWT_SECRET, { expiresIn: '15m' });
    return { success: true, message: "New access token generated", accessToken };
  } catch (error) {
    return { success: false, message: "Invalid or expired refresh token" };
  }
};

module.exports = { registerUser, verifyEmail, loginUser, refreshAccessToken, resendVerificationEmail };
