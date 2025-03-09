const express = require("express");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const nodemailer = require("nodemailer");
require("dotenv").config();

const router = express.Router();

// ✅ Configure Nodemailer using environment variables
const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ✅ Forgot Password Route - Sends a reset code via email
router.post("/forgot-password", async (req, res) => {
    const { email } = req.body;
  
    try {
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(400).json({ message: "User not found!" });
      }
  
      // ✅ Generate three random numbers, one correct
      const correctNumber = Math.floor(100000 + Math.random() * 900000);
      const randomNumbers = [
        correctNumber,
        Math.floor(100000 + Math.random() * 900000),
        Math.floor(100000 + Math.random() * 900000),
      ].sort(() => Math.random() - 0.5); // Shuffle
  
      // ✅ Store correct reset code in DB
      user.resetCode = correctNumber;
      user.resetCodeExpires = Date.now() + 10 * 60 * 1000; // Expires in 10 mins
      await user.save();
  
      // ✅ Send email with correct code
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Password Reset Code",
        text: `Your password reset code is: ${correctNumber}. Select the correct one in the UI.`,
      };
      await transporter.sendMail(mailOptions);
  
      res.status(200).json({ 
        message: "Reset code sent! Select the correct number.",
        numbers: randomNumbers, 
        correctNumber // Send correct number to frontend
      });
    } catch (error) {
      res.status(500).json({ message: "Error sending reset code", error: error.message });
    }
  });
  

// ✅ Verify Code Route
router.post("/verify-code", async (req, res) => {
  const { email, resetCode } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user || user.resetCode !== resetCode || Date.now() > user.resetCodeExpires) {
      return res.status(400).json({ message: "Invalid or expired code!" });
    }

    res.status(200).json({ message: "Code verified, proceed to reset password." });
  } catch (error) {
    res.status(500).json({ message: "Error verifying code", error: error.message });
  }
});

// ✅ Reset Password Route
router.post("/reset-password", async (req, res) => {
  const { email, newPassword } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "User not found!" });
    }

    // ✅ Hash the new password before saving
    user.password = await bcrypt.hash(newPassword, 10);

    // ✅ Clear resetCode after password change
    user.resetCode = null;
    user.resetCodeExpires = null;
    await user.save();

    res.status(200).json({ message: "Password reset successfully!" });
  } catch (error) {
    res.status(500).json({ message: "Error resetting password", error: error.message });
  }
});

module.exports = router;
