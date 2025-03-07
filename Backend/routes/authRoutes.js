const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const nodemailer = require('nodemailer');
const router = express.Router();
require('dotenv').config();
const formatCase = (text) => {
  return text.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
};
router.post('/addEmployee', async (req, res) => {
  let { empname, empid, email, password, gender, project, role, managerEmail } = req.body;
  try {
    // Check if email already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists!" });
    }
    if (project) {
      project = project.trim().toLowerCase();
    }

    // Enforce unique project per Manager
    if (role === "Manager") {
      const projectExists = await User.findOne({ project, role: "Manager" });
      if (projectExists) {
        return res.status(400).json({ message: "A Manager already exists for this project!" });
      }
    }
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);


    // Create new user
    const newUser = new User({
      empname,
      empid,
      email,
      password: hashedPassword,
      gender,
      project,
      role,
      ...(role === "Employee" && { managerEmail }),
    });

    // console.log(newUser);

    await newUser.save();

    // Send welcome email
    const transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
        user: 'lahirikokkiligadda@gmail.com',
        pass: 'jmfe rmka otnc upxe'
      }
    });

    const mailOptions = {
      from: 'lahirikokkiligadda@gmail.com',
      to: email,
      subject: 'Welcome to Quadface Company!',
      text: `Hello ${empname},\n\nWelcome To Leave Management System. We are excited to have you on board.\nUsername: ${email}\nPassword: ${password}\n\nBest regards,\nAdmin`
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log('Error sending email:', error);
        return res.status(500).json({ message: 'Error sending email' });
      } else {
        console.log('Email sent: ' + info.response);
        res.status(201).json({ message: 'Employee Added successfully!', userId: newUser._id });
      }
    });

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Error registering user' });
  }
});


// Sign-in route
router.post('/signin', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user ) {
      return res.status(400).json({ message: "User not found!" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials!" });
    }

    res.status(200).json({ message: 'User signed in successfully!', userId: user._id });
  } catch (err) {
    res.status(500).json({ message: 'Error signing in user' });
  }
});

router.get('/user/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await User.findById(userId);
    // console.log("USER>>",user)
    if (!user && !user.isActive) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      empname: user.empname,
      empid: user.empid,
      email: user.email,
      password:user.password,
      gender:user.gender,
      project: user.project,
      role: user.role, // Add role here
      managerEmail:user.managerEmail,
      isActive:user.isActive,
      
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});


module.exports = router;