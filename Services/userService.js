const User = require("../models/user");
const logger = require("../utils/logger");
const STATUS_CODES = require("../utils/statusCodes"); // <-- IMPORTED
const MESSAGES = require("../utils/messages");     // <-- IMPORTED

//  Get User Profile Service
const getUserProfileService = async (userId) => {
  try {
    logger.info("UserService: getUserProfileService - Fetching profile for user", { userId });

    const user = await User.findById(userId).select("-password");

    if (!user) {
      logger.warn("UserService: getUserProfileService - User not found", { userId });
      return { success: false, message: MESSAGES.USER_NOT_FOUND, statusCode: STATUS_CODES.NOT_FOUND };
    }

    logger.info("UserService: getUserProfileService - User profile fetched successfully", { userId });
    return {
      success: true,
      message: MESSAGES.USER_PROFILE_FETCH_SUCCESS,
      profile: {
        _id: user._id, // Adding _id for completeness
        firstName: user.firstName,
        lastName: user.lastName,
        phoneNumber: user.phoneNumber,
        email: user.email,
        address: user.address,
        role: user.role,
      },
      statusCode: STATUS_CODES.OK,
    };
  } catch (error) {
    logger.error("UserService: getUserProfileService - Error fetching user profile", { error: error.message, stack: error.stack, userId });
    return { success: false, message: MESSAGES.USER_PROFILE_FETCH_ERROR, details: error.message, statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR };
  }
};

//  Delete User Service (by ID for normal users, by Email for admin)
const deleteUserService = async (identifier, isAdmin = false) => {
  try {
    logger.info("UserService: deleteUserService - Initiated delete for user", { identifier, isAdmin });

    let user;
    // Assuming identifier is always an email for deletion as per the comment in controller
    // If admin can delete by userId, the logic here would need to differentiate between email/ID
    if (isAdmin) {
      // Admin can delete by email or ID, let's assume `identifier` is email for simplicity here
      user = await User.findOneAndDelete({ email: identifier });
    } else {
      // Normal user can only delete their own account, so identifier will be their email
      user = await User.findOneAndDelete({ email: identifier });
    }

    if (!user) {
      logger.warn("UserService: deleteUserService - User not found for deletion", { identifier });
      return { success: false, message: MESSAGES.USER_NOT_FOUND, statusCode: STATUS_CODES.NOT_FOUND };
    }

    logger.info("UserService: deleteUserService - User account deleted successfully", { identifier });
    return { success: true, message: MESSAGES.USER_DELETE_SUCCESS, statusCode: STATUS_CODES.OK };
  } catch (error) {
    logger.error("UserService: deleteUserService - Error deleting user", { error: error.message, stack: error.stack, identifier });
    return { success: false, message: MESSAGES.USER_DELETE_ERROR, details: error.message, statusCode: STATUS_CODES.INTERNAL_SERVER_ERROR };
  }
};

module.exports = {
  getUserProfileService,
  deleteUserService,
};