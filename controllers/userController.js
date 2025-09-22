const {getUserProfileService,deleteUserService } = require("../Services/userService");

// ✅ Get Logged-in User Profile
const getUserProfile = async (req, res) => {
  try {
    const resp = await getUserProfileService(req.user.id);
    return res.status(resp.success ? 200 : 404).json(resp);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Delete User (Admin ya User dono apna account delete kar sakte hain)
const deleteUser = async (req, res) => {
  try {
    // agar admin hai aur param diya hai to us user ko delete karega
    // warna normal user apna account delete karega
    const userId = (req.user.role === "admin" && req.params.id) 
      ? req.params.id 
      : req.user.id;

    const resp = await deleteUserService(userId);
    return res.status(resp.success ? 200 : 404).json(resp);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { 
  getUserProfile,
  deleteUser
};
