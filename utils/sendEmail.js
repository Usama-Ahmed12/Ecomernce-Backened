const nodemailer = require("nodemailer");

const sendEmail = async ({ to, subject, text, html }) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER, // tumhara gmail
        pass: process.env.EMAIL_PASS, // Google app password
      },
    });

    //  Default HTML template (agar koi custom html na diya ho)
    const defaultHtml = `
      <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #fafafa; border-radius: 10px;">
        <h2 style="color: #222;">${subject}</h2>
        <p style="font-size: 16px; color: #333;">${text}</p>
        <br>
        <p style="font-size: 14px; color: #888;">Best Regards,<br><b>Mahas Creation Team</b></p>
      </div>
    `;

    const mailOptions = {
      from: `"Mahas Creation" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      html: html || defaultHtml, // agar html diya gaya ho to wo use karo warna default template
    };

    await transporter.sendMail(mailOptions);
    console.log(" Email sent successfully to:", to);
  } catch (error) {
    console.error(" Email send failed:", error.message);
  }
};

module.exports = sendEmail;
