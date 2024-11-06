require("dotenv").config();

const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
  connectionTimeout: 10000,
});

const sendRegistrationEmail = (to, name) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject: "Welcome to Chef Chiller!",
    text: `Hello ${name},\n\nThank you for registering with Chef Chiller. We are excited to have you!\n\nBest regards,\nChef Chiller Team`,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error("Error while sending email:", error);
      return;
    }
    console.log("Email sent:", info.response);
  });
};

module.exports = sendRegistrationEmail;
