const authService = require('../Services/authservice');

// ✅ Register User
const registerUser = async (req, res) => {
  try {
    const resp = await authService.registerUser(req.body);

    if (!resp.success) {
      return res.status(400).json({ success: false, message: resp.message });
    }

    return res.status(201).json({ success: true, message: resp.message, token: resp.token });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ✅ Login User
const loginUser = async (req, res) => {
  try {
    const resp = await authService.loginUser(req.body);

    if (!resp.success) {
      return res.status(400).json({ success: false, message: resp.message });
    }

    return res.status(200).json({ success: true, message: resp.message, token: resp.token });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = { registerUser, loginUser };
