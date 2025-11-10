const express = require("express");
const router = express.Router();
const sendEmail = require("../utils/sendEmail");

router.post("/send", async (req, res) => {
  const { to, subject, message } = req.body;
  try {
    await sendEmail(to, subject, `<p>${message}</p>`);
    res.json({ success: true, message: "Email sent successfully!" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
