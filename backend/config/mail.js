const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: 'kachhiyadhruv61@gmail.com',
    pass: 'ilgu gyhz mdkm omdp', // App password (NOT your Gmail password)
  },
});

module.exports = transporter;



