const express = require("express");
const multer = require("multer");
const Holiday = require("../models/Holiday"); // Import your Holiday model
require("dotenv").config();
const User = require("../models/User");
const router = express.Router();
const XLSX = require("xlsx");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
// Multer setup for file upload
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const ProjectSchema = require('../models/Project');

const formatCase = (str) => {
  return str.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
};
router.post("/uploadEmployees", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Please upload an Excel file!" });
    }

    // Read Excel file
    const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const sheetData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

    if (!sheetData.length) {
      return res.status(400).json({ message: "Excel file is empty!" });
    }

    // Extract column names from the first row
    const expectedColumns = [
      "EmployeeID",
      "EmployeeName",
      "Email",
      "Password",
      "Role",
      "Gender",
      "Project",
      "ManagerEmail",
    ];
    const fileColumns = Object.keys(sheetData[0]);

    const newUsers = [];
    const failedEntries = [];
    const managerEmails = new Map();

    const assignedProjects = new Set();

    for (let row of sheetData) {
      const {
        EmployeeID,
        EmployeeName,
        Email = "", // ✅ Default empty string to avoid undefined
        Password = "", // ✅ Default empty string
        Role = "", // ✅ Ensure role is not undefined
        Gender = "", 
        Project = "", 
        ManagerEmail = "", 
      } = row;
    
      const email = Email.toString().toLowerCase().trim();  // ✅ Convert safely
      const project = Project.toString().toLowerCase().trim(); // ✅ Convert safely
    
      if (String(Role).toLowerCase().trim() === "manager") {
        const userExists = await User.findOne({ email });
        const empidExists = await User.findOne({ empid: EmployeeID });
    
        if (userExists || empidExists) {
          failedEntries.push({
            email,
            reason: "User or EmpID already exists!",
          });
          continue;
        }
    
        if (assignedProjects.has(project)) {
          failedEntries.push({
            email,
            reason: `Duplicate manager for project '${project}' found in the Excel file!`,
          });
          continue;
        }
    
        const existingManager = await User.findOne({
          project: project,
          role: "Manager",
        });
    
        if (existingManager) {
          failedEntries.push({
            email,
            reason: `Project '${project}' already has a manager (${existingManager.email})!`,
          });
          continue;
        }
    
        const existingProject = await ProjectSchema.findOne({
          projectName: project,
        });
        if (!existingProject) {
          await ProjectSchema.create({ projectName: project });
        }
    
        const hashedPassword = await bcrypt.hash(Password.toString(), 10);
    
        const newUser = new User({
          empid: EmployeeID,
          empname: formatCase(EmployeeName),
          email,
          password: hashedPassword,
          role: formatCase(Role),
          gender: formatCase(Gender),
          project,
        });
    
        await newUser.save();
        newUsers.push({ ...newUser.toObject(), originalPassword: Password });
        managerEmails.set(email, project);
      }
    }
    
    // ✅ Now insert Employees
    for (let row of sheetData) {
      const {
        EmployeeID,
        EmployeeName,
        Email = "",
        Password = "",
        Role = "",
        Gender = "",
        Project = "",
        ManagerEmail = "",
      } = row;
    
      const email = Email.toString().toLowerCase().trim();
      const managerEmail = ManagerEmail.toString().toLowerCase().trim();
    
      if (String(Role).toLowerCase().trim() === "employee") {
        const userExists = await User.findOne({ email });
        const empidExists = await User.findOne({ empid: EmployeeID });
    
        if (userExists || empidExists) {
          failedEntries.push({
            email,
            reason: "User or EmpID already exists!",
          });
          continue;
        }
    
        let assignedProject = "";
        if (managerEmails.has(managerEmail)) {
          assignedProject = managerEmails.get(managerEmail);
        } else {
          const manager = await User.findOne({ email: managerEmail });
          if (manager && manager.project) {
            assignedProject = manager.project.toLowerCase().trim();
          } else {
            failedEntries.push({
              email,
              reason: "Invalid manager email or project not assigned",
            });
            continue;
          }
        }
    
        // ✅ Prevent crash if Project field is empty
        if (Project) {
          const existingProject = await ProjectSchema.findOne({
            projectName: Project.toLowerCase().trim(),
          });
          if (!existingProject) {
            await ProjectSchema.create({ projectName: Project.toLowerCase().trim() });
          }
        }
    
        const hashedPassword = await bcrypt.hash(Password.toString(), 10);
    
        const newUser = new User({
          empid: EmployeeID,
          empname: formatCase(EmployeeName),
          email,
          password: hashedPassword,
          role: formatCase(Role),
          gender: formatCase(Gender),
          project: assignedProject,
          managerEmail,
        });
    
        await newUser.save();
        newUsers.push({ ...newUser.toObject(), originalPassword: Password });
      }
    }

    // ✅ Send Emails
    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const emailPromises = newUsers.map((user) => {
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: user.email,
        subject: "Welcome to Quadface Company!",
        text: `Hello ${user.empname},\n\nWelcome To Leave Management System. We are excited to have you on board.\nUsername: ${user.email}\nPassword: ${user.originalPassword}\n\nBest regards,\nAdmin`,
      };

      return transporter.sendMail(mailOptions).catch((err) => {
        console.log(`Error sending email to ${user.email}:`, err);
      });
    });

    await Promise.all(emailPromises);

    res.status(201).json({
      message: `${newUsers.length} employees were successfully added!`,
      totalInserted: newUsers.length,
      failedEntries,
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
  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
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
    const hasCorrectFormat = expectedColumns.every((col) =>
      fileColumns.includes(col)
    );

    if (!hasCorrectFormat) {
      return res
        .status(400)
        .json({ message: "Wrong format! Please upload a correctly formatted file." });
    }

    const holidaysToInsert = [];
    const existingDates = new Set();
    const existingNames = new Set();

    // ✅ Fetch existing holiday dates from the database
    const existingHolidays = await Holiday.find({}, "date name");
existingHolidays.forEach((holiday) => {
  existingDates.add(holiday.date);
  existingNames.add(holiday.name.toLowerCase()); // To avoid case sensitivity
});

    for (const row of data) {
      let { date, name, type } = row;

      if (!date || !name || !type) {
        console.log("⚠️ Skipping invalid row:", row);
        continue;
      }

      // ✅ Convert Excel serial date to readable format if needed
      const formattedDate =
        typeof date === "number" ? formatExcelDate(date) : date;

      // ✅ Check if the holiday already exists
      if (existingDates.has(formattedDate) || existingNames.has(name.toLowerCase())) {
        console.log(
          `⚠️ Skipping duplicate holiday (Date/Name): ${formattedDate} - ${name}`
        );
        continue; // Skip duplicates
      }

      const dayOfWeek = new Date(formattedDate).toLocaleString("en-us", {
        weekday: "long",
      });
      if (dayOfWeek === "Saturday" || dayOfWeek === "Sunday") {
        console.log(`⚠️ Skipping weekend holiday: ${formattedDate}`);
        continue; // Skip weekends
      }

      console.log("✅ Processed Holiday:", {
        date: formattedDate,
        day: dayOfWeek,
        name,
        type,
      });

      holidaysToInsert.push({
        date: formattedDate,
        day: dayOfWeek,
        name,
        type,
      });
    }

    if (!holidaysToInsert.length) {
      return res.status(400).json({ message: "No new holidays to add." });
    }

    const insertedHolidays = await Holiday.insertMany(holidaysToInsert);
    res.status(201).json({
      insertedCount: insertedHolidays.length,
      newHolidays: insertedHolidays,
    });
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
  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const month = monthNames[parsedDate.getMonth()];
  const year = parsedDate.getFullYear();

  return `${day}-${month}-${year}`;
}

router.get("/downloadHolidayTemplate", async (req, res) => {
  try {
    // Define the template structure with headers
    const templateData = [
      { date: "YYYY-MM-DD", name: "Example Holiday", type: "Mandotary/Optional" }
    ];

    // Create a worksheet & workbook
    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Holiday_Template");

    // Convert workbook to a buffer
    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    // Set response headers
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=Holiday_Template.xlsx"
    );
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

    // Send the file
    res.send(buffer);
  } catch (error) {
    console.error("Error generating holiday template:", error);
    res.status(500).json({ message: "Error generating template" });
  }
});

router.get("/downloadTemplate", async (req, res) => {
  try {
    // Define the headers based on the expected format
    const templateData = [
      {
        EmployeeID: "",
        EmployeeName: "",
        Email: "",
        Password: "",
        Role: "",
        Gender: "",
        Project: "",
        ManagerEmail: "",
      },
    ];

    // Create a new workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(templateData);

    // Append worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, "Employee_Template");

    // Convert workbook to buffer
    const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "buffer" });

    // Set response headers for file download
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=Employee_Template.xlsx"
    );
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    res.send(buffer);
  } catch (error) {
    console.error("Error generating template:", error);
    res.status(500).json({ message: "Error generating template" });
  }
});

module.exports = router;