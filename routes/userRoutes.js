const express = require('express');
const router = express.Router();
const { auth} = require('../middleware/authMiddleware');
const { registerUser, loginUser } = require('../controllers/authController'); // ✅ Import register/login

// ✅ Register route
router.post('/register', registerUser);

// ✅ Login route
router.post('/login', loginUser);

// ✅ Protected Route - sirf logged in user ke liye
router.get('/profile', auth, (req, res) => {
  res.json({
    message: 'Welcome to your profile!',
    user: req.user,
  });
});

module.exports = router;
