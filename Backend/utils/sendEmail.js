// utils/sendEmail.js

const transporter = require("../config/mail");

const sendEmail = async (to, subject, html) => {
  try {
    await transporter.sendMail({
      from: `"DKTRADERS" <${'kachhiyadhruv61@gmail.com'}>`,
      to,
      subject,
      html,
    });
  } catch (error) {
    console.error("EMAIL ERROR:", error);
  }
};

module.exports = sendEmail;