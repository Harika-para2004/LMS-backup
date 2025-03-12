const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const nodemailer = require('nodemailer');
const router = express.Router();
const Project = require('../models/Project');
require('dotenv').config();

const formatCase = (text) => {
  return text.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
};
router.post('/addEmployee', async (req, res) => {
  let { empname, empid, email, password, gender, project, role, managerEmail } = req.body;
  email = email ? email.toLowerCase() : "";
  project = project ? project.toLowerCase() : "";
  managerEmail = managerEmail ? managerEmail.toLowerCase() : "";

  try {
    // ✅ Check if email already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists!" });
    }

    // ✅ Check if empid already exists
    const user = await User.findOne({ empid });
    if (user) {
      return res.status(400).json({ message: "Empid already exists!" });
    }

    let assignedProject = "";
    if (role === "Manager") {
      const projectExists = await User.findOne({ project, role: "Manager",isActive:true });

      if (projectExists) {
        return res.status(400).json({ message: `Project "${project}" is already assigned to another manager.` });
      }

      assignedProject = project;
    }

    // ✅ Handle Project Assignment from Senior → Manager → Employee
    if (role === "Employee" && managerEmail) {
      const manager = await User.findOne({ email: managerEmail });

      if (manager && manager.project) {
        assignedProject = manager.project; // Get project from Manager
      }
    }

    if (role === "Manager") {
      // Check if another active manager already has the project
      const activeManager = await User.findOne({ project, role: "Manager", isActive: true });
    
      if (activeManager) {
        return res.status(400).json({ message: `Project "${project}" is already assigned to another active manager.` });
      }
    
      // Assign project to the new manager
      assignedProject = project;
    
      // Find employees with the same project and update their managerEmail
      await User.updateMany(
        { project, role: "Employee" }, // Employees under this project
        { $set: { managerEmail: email } } // Assign new manager
      );
    }
    

    // ✅ Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // ✅ Create new user
    const newUser = new User({
      empname,
      empid,
      email,
      password: hashedPassword,
      gender,
      project: assignedProject,
      role,
      managerEmail: role === "Manager" ? "" : managerEmail
    });

    await newUser.save();

    const transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
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
  let { email, password } = req.body;

  try {
    // Convert entered email to lowercase for case-insensitive comparison
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
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

// Get User Route
router.get('/user/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await User.findById(userId);

    if (!user && !user.isActive) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      empname: user.empname,
      empid: user.empid,
      email: user.email,  // Returns email in lowercase (stored as lowercase)
      password: user.password,
      gender: user.gender,
      project: user.project,
      role: user.role,
      managerEmail: user.managerEmail,
      isActive: user.isActive,
    });

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.put("/updateAdminPassword", async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const updatedAdmin = await User.findOneAndUpdate(
      { email },
      { $set: { password: hashedPassword, project: "" } }, // Ensuring `project` is a string
      { new: true, runValidators: true }
    );

    if (!updatedAdmin) {
      return res.status(404).json({ error: "Admin not found" });
    }

    res.json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Error updating admin password:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
module.exports = router;
