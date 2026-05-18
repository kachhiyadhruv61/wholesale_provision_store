const nodemailer = require("nodemailer");

const MAIL_USER = process.env.MAIL_USER;
const MAIL_PASS = process.env.MAIL_PASS;

if (!MAIL_USER || !MAIL_PASS) {
  console.warn('MAIL_USER or MAIL_PASS not set. Mailer will likely fail when sending emails.');
}

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: MAIL_USER,
    pass: MAIL_PASS, // App password (NOT your Gmail password)
  },
});

module.exports = transporter;



