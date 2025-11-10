const User = require("../models/user");
const logger = require("../utils/logger");

//  Get User Profile Service
const getUserProfileService = async (userId) => {
  try {
    const user = await User.findById(userId).select("-password");

    if (!user) {
      return { success: false, message: "User not found" };
    }

    return {
      success: true,
      profile: {
        firstName: user.firstName,
        lastName: user.lastName,
        phoneNumber: user.phoneNumber,
        email: user.email,
        address: user.address,
        role: user.role,
      },
    };
  } catch (error) {
    logger.error("Get Profile Service Error", { error: error.message });
    return { success: false, message: error.message || "Unexpected error in getUserProfileService" };
  }
};

//  Delete User Service (by ID for normal users, by Email for admin)
const deleteUserService = async (identifier, isAdmin = false) => {
  try {
    const user = isAdmin
      ? await User.findOneAndDelete({ email: identifier })
      : await User.findOneAndDelete({ email: identifier }); // both delete by email

    if (!user) {
      return { success: false, message: "User not found" };
    }

    return { success: true, message: "User account deleted successfully" };
  } catch (error) {
    logger.error("Delete User Service Error", { error: error.message });
    return { success: false, message: error.message || "Unexpected error in deleteUserService" };
  }
};

module.exports = {
  getUserProfileService,
  deleteUserService,
};
