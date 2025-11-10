const { getUserProfileService, deleteUserService } = require("../Services/userService");

//  Get Logged-in User Profile
const getUserProfile = async (req, res) => {
  try {
    const resp = await getUserProfileService(req.user.userId);
    return res.status(resp.success ? 200 : 404).json(resp);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

//  Delete User (Admin ya User dono apna account delete kar sakte hain)
const deleteUser = async (req, res) => {
  try {
    // agar admin hai aur param diya gaya hai → to email ke zariye delete karega
    // warna normal user apna account delete karega (token se)
    const identifier =
      req.user.role === "admin" && req.params.id
        ? req.params.id // yahan :id ke jagah email ayega
        : req.user.email;

    const isAdmin = req.user.role === "admin";

    const resp = await deleteUserService(identifier, isAdmin);
    return res.status(resp.success ? 200 : 404).json(resp);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getUserProfile,
  deleteUser,
};
