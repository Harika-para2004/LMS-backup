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
  email=email.toLowerCase();
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

    // ✅ Handle Manager Role (Allow Manager to have Manager)
    if (role === "Manager") {
      const projectList = await Project.find({ managerEmail: email });
      const projectNames = projectList.map(p => p.projectName.toLowerCase());

      // ✅ Ensure the project is always an array (no mix of string/array)
      project = projectNames.length > 0 ? projectNames : [];
    }

    // ✅ Ensure project is always an array, prevent split characters
    if (!Array.isArray(project)) {
      project = project ? [project] : [];
    }

    // ✅ Prevent empty strings in project
    project = project.filter(p => p.trim() !== "");

    // ✅ Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // ✅ Create new user (Manager or Employee)
    const newUser = new User({
      empname,
      empid,
      email,
      password: hashedPassword,
      gender,
      project,
      role,
      managerEmail  // ✅ Keep this field even for Managers now
    });

    // ✅ Save the User
    await newUser.save();

    // ✅ Step 2: Assign Employee's Project to Manager & Senior Manager (if role=Employee)
    if (role === "Employee" && managerEmail) {
      let currentManagerEmail = managerEmail;

      // ✅ Traverse the chain of managers and assign projects
      while (currentManagerEmail) {
        const manager = await User.findOne({ email: currentManagerEmail });

        if (manager) {
          // ✅ Prevent duplicates in manager's project
          const updatedProjects = Array.isArray(manager.project)
            ? [...new Set([...manager.project, ...project])]
            : [project];

          // ✅ Update the Manager's Project
          await User.updateOne(
            { email: currentManagerEmail },
            { $set: { project: updatedProjects } }
          );

          // ✅ Move to the next Senior Manager (if exists)
          currentManagerEmail = manager.managerEmail;
        } else {
          // ✅ No more senior managers
          currentManagerEmail = null;
        }
      }
    }

    // ✅ Step 3: Send Welcome Email
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

module.exports = router;
