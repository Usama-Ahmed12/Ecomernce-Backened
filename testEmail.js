require("dotenv").config();
const sendEmail = require("./utils/sendEmail");

(async () => {
  try {
    await sendEmail(
      "uusamaahmed1@gmail.com", // apni email
      " Test Email from Mahas Creation",
      "<h2>Congratulations!</h2><p>Your Nodemailer setup is working perfectly 🎉</p>"
    );
    console.log(" Test email sent successfully!");
  } catch (err) {
    console.error(" Failed to send test email:", err);
  }
})();
