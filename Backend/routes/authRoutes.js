// const express = require('express');
// const bcrypt = require('bcryptjs');
// const User = require('../models/User');
// const nodemailer = require('nodemailer');

// const router = express.Router();
// router.post('/addEmployee', async (req, res) => {
//   const { empname,empid, email, password,gender, project ,role,managerEmail} = req.body;
// /* app name:lmsappgmail*/
// /* password:jmfe rmka otnc upxe*/

//   try {
//     const userExists = await User.findOne({ email });
//     if (userExists) {
//       return res.status(400).json({ message: "User already exists!" });
//     }

//     const hashedPassword = await bcrypt.hash(password, 10);

//     const newUser = new User({
//       empname,
//       empid,
//       email,
//       password: hashedPassword,
//       gender,
//       project,
//       role,
//       ...(role === "Employee" && { managerEmail })
//     });

//     await newUser.save();

//     const transporter = nodemailer.createTransport({
//       service: 'Gmail', // You can use any email service, like 'Outlook', 'Yahoo', etc.
//       auth: {
//         user: 'lahirikokkiligadda@gmail.com', // Replace with your email
//         pass: 'jmfe rmka otnc upxe' // Replace with your email password or app-specific password
//       }
//     });

//     // Email content
//     const mailOptions = {
//       from: 'lahirikokkiligadda@gmail.com',
//       to: email,
//       subject: 'Welcome to Quadface Company!',
//       text: `Hello ${empname},\n\nWelcome To Leave Management System. We are excited to have you on board.\nUsername:${email}\nPassword:${password}\n\nBest regards,\nAdmin`    };

//     // Send the email
//     transporter.sendMail(mailOptions, (error, info) => {
//       if (error) {
//         console.log('Error sending email:', error);
//         return res.status(500).json({ message: 'Error sending email' });
//       } else {
//         console.log('Email sent: ' + info.response);
//         res.status(201).json({ message: 'Employee Added successfully!', userId: newUser._id });
//       }
//     });
//   } catch (err) {
//     console.log(err);
//     res.status(500).json({ message: 'Error registering user' });
//   }
// });

// // Sign-in route
// router.post('/signin', async (req, res) => {
//   const { email, password } = req.body;

//   try {
//     const user = await User.findOne({ email });
//     if (!user) {
//       return res.status(400).json({ message: "User not found!" });
//     }

//     const isMatch = await bcrypt.compare(password, user.password);
//     if (!isMatch) {
//       return res.status(400).json({ message: "Invalid credentials!" });
//     }

//     res.status(200).json({ message: 'User signed in successfully!', userId: user._id });
//   } catch (err) {
//     res.status(500).json({ message: 'Error signing in user' });
//   }
// });

// router.get('/user/:userId', async (req, res) => {
//   const { userId } = req.params;

//   try {
//     const user = await User.findById(userId);

//     if (!user) {
//       return res.status(404).json({ message: 'User not found' });
//     }

//     res.status(200).json({
//       empname: user.empname,
//       empid: user.empid,
//       email: user.email,
//       password:user.password,
//       gender:user.gender,
//       project: user.project,
//       role: user.role, // Add role here
//       managerEmail:user.managerEmail,
//     });
//   } catch (error) {
//     res.status(500).json({ message: 'Server error', error: error.message });
//   }
// });


// module.exports = router;


const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const nodemailer = require('nodemailer');
const multer = require("multer");
const XLSX = require("xlsx");
const router = express.Router();
const path = require("path");
require('dotenv').config();


// Multer setup for file upload
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Route to handle bulk employee upload
router.post('/uploadEmployees', upload.single('file'), async (req, res) => {
  try {
      if (!req.file) {
          return res.status(400).json({ message: "Please upload an Excel file!" });
      }

      // Read Excel file
      const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const sheetData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

      if (!sheetData.length) {
          return res.status(400).json({ message: "Excel file is empty!" });
      }

      const newUsers = [];
      const failedEntries = [];

      for (let row of sheetData) {
          const { EmployeeID, EmployeeName, Email, Password, Role, Gender, Project, ManagerEmail } = row;

          if (!Email || !Password) {
              failedEntries.push({ email: Email || "Unknown", reason: "Missing required fields" });
              continue;
          }

          // Check if email already exists
          const userExists = await User.findOne({ email: Email });
          if (userExists) {
              failedEntries.push({ email: Email, reason: "User already exists!" });
              continue;
          }

          // Store original password for email
          const originalPassword = Password.toString();

          // Hash password before saving to database
          const hashedPassword = await bcrypt.hash(originalPassword, 10);

          const newUser = new User({
              empid: EmployeeID,
              empname: EmployeeName,
              email: Email,
              password: hashedPassword, // Store only hashed password
              role: Role,
              gender: Gender,
              project: Project,
              ...(String(Role).toLowerCase() === "employee" && { managerEmail: ManagerEmail })
          });

          newUsers.push({ ...newUser.toObject(), originalPassword }); // Keep original password for email
      }

      if (newUsers.length > 0) {
          await User.insertMany(newUsers);
      }

      // Email configuration
      const transporter = nodemailer.createTransport({
          service: 'Gmail',
          auth: {
              user: process.env.EMAIL_USER,
              pass: process.env.EMAIL_PASS
          }
      });

      // Send emails concurrently using Promise.all
      const emailPromises = newUsers.map(user => {
          const mailOptions = {
              from: process.env.EMAIL_USER,
              to: user.email,
              subject: 'Welcome to Quadface Company!',
              text: `Hello ${user.empname},\n\nWelcome to the Leave Management System!\n\nHere are your login details:\n🔹 Username: ${user.email}\n🔹 Password: ${user.originalPassword}\n\nPlease log in and change your password after your first login for security reasons.\n\nBest regards,\nAdmin`
          };
          return transporter.sendMail(mailOptions).catch(err => {
              console.log(`Error sending email to ${user.email}:`, err);
          });
      });

      await Promise.all(emailPromises);

      res.status(201).json({
          message: "Employees uploaded successfully!",
          totalInserted: newUsers.length,
          failedEntries
      });

  } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Error processing file" });
  }
});



router.post('/addEmployee', async (req, res) => {
  const { empname,empid, email, password,gender, project ,role,managerEmail} = req.body;
/* app name:lmsappgmail*/
/* password:jmfe rmka otnc upxe*/

  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists!" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      empname,
      empid,
      email,
      password: hashedPassword,
      gender,
      project,
      role,
      ...(role === "Employee" && { managerEmail })
    });

    await newUser.save();

    const transporter = nodemailer.createTransport({
      service: 'Gmail', // You can use any email service, like 'Outlook', 'Yahoo', etc.
      auth: {
        user: 'lahirikokkiligadda@gmail.com', // Replace with your email
        pass: 'jmfe rmka otnc upxe' // Replace with your email password or app-specific password
      }
    });

    // Email content
    const mailOptions = {
      from: 'lahirikokkiligadda@gmail.com',
      to: email,
      subject: 'Welcome to Quadface Company!',
      text: `Hello ${empname},\n\nWelcome To Leave Management System. We are excited to have you on board.\nUsername:${email}\nPassword:${password}\n\nBest regards,\nAdmin`    };

    // Send the email
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

router.get('/user/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await User.findById(userId);

    if (!user) {
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
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});


module.exports = router;