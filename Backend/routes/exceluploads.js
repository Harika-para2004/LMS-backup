const express = require("express");
const multer = require("multer");
const Holiday = require("../models/Holiday"); // Import your Holiday model
require('dotenv').config();
const User = require('../models/User');
const router = express.Router();
const XLSX = require("xlsx");
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
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
        // Extract column names from the first row
        const expectedColumns = ["EmployeeID", "EmployeeName", "Email", "Password", "Role", "Gender", "Project", "ManagerEmail"];
        const fileColumns = Object.keys(sheetData[0]); 
    
        // Check if the uploaded file has the correct columns
        const hasCorrectFormat = expectedColumns.every(col => fileColumns.includes(col));
    
     
        const newUsers = [];
        const failedEntries = [];
        for (let row of sheetData) {
            const { EmployeeID, EmployeeName, Email, Password, Role, Gender, Project, ManagerEmail } = row;
            Project.toLowerCase();
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
            if (String(Role).toLowerCase() === "manager") {
              const existingManager = await User.findOne({ role: "manager", project:Project  });
              if (existingManager) {
                 
                  failedEntries.push({ email: Email, reason: `Manager already exists for project '${Project}'` });
                  continue;
              }
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
  
        const responseMessage = newUsers.length > 0 
      ? `${newUsers.length} employees were successfully added!` 
      : "No employees added, they already exist.";
  
  res.status(201).json({
      message: responseMessage,
      totalInserted: newUsers.length,
      failedEntries
  });
  
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Error processing file" });
    }
  });
  
  const formatExcelDate = (serial) => {
    if (!serial || typeof serial !== "number") return null;
  
    const utc_days = Math.floor(serial - 25569);
    const date_info = new Date(utc_days * 86400000);
  
    const day = date_info.getDate().toString().padStart(2, "0");
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const month = monthNames[date_info.getMonth()];
    const year = date_info.getFullYear();
  
    return `${day}-${month}-${year}`; // Returns in "dd-MMM-yyyy" format
  };
  router.post("/uploadHolidays", upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      
      const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
      const sheetName = workbook.SheetNames[0];
      const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
  
      if (!data.length) {
        return res.status(400).json({ message: "Empty file uploaded" });
      }
      // Extract column names from the first row
      const expectedColumns = ["date", "name", "type"];
      const fileColumns = Object.keys(data[0]); 
  
      // Check if the uploaded file has the correct columns
      const hasCorrectFormat = expectedColumns.every(col => fileColumns.includes(col));
  
      if (!hasCorrectFormat) {
        return res.status(400).json({ message: "Wrong format! Please upload a correctly formatted file." });
      }
  
      const holidaysToInsert = [];
  
      for (const row of data) {
        let { date, name, type } = row;
  
        if (!date || !name || !type) {
          console.log("⚠️ Skipping invalid row:", row);
          continue;
        }
  
        const formattedDate = typeof date === "number" ? formatExcelDate(date) : date;
        const dayOfWeek = new Date(formattedDate).toLocaleString("en-us", { weekday: "long" });
  
        console.log("✅ Processed Holiday:", { date: formattedDate, day: dayOfWeek, name, type });
  
        holidaysToInsert.push({ date: formattedDate, day: dayOfWeek, name, type });
      }
  
      if (!holidaysToInsert.length) {
        return res.status(400).json({ message: "No new holidays to add." });
      }
  
      const insertedHolidays = await Holiday.insertMany(holidaysToInsert);
      res.status(201).json({ insertedCount: insertedHolidays.length, newHolidays: insertedHolidays });
  
    } catch (error) {
      console.error("Error uploading holidays:", error);
      res.status(500).json({ message: "Error processing file", error: error.message });
    }
  });
  // Function to format Excel date to "dd-MMM-yyyy"
  function formatDate(excelDate) {
    const parsedDate = new Date((excelDate - 25569) * 86400 * 1000); // Convert Excel serial date
    if (isNaN(parsedDate)) return null;
  
    const day = parsedDate.getDate().toString().padStart(2, "0");
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const month = monthNames[parsedDate.getMonth()];
    const year = parsedDate.getFullYear();
  
    return `${day}-${month}-${year}`;
  }

module.exports = router;
