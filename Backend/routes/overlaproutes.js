const express = require("express");
const router = express.Router();
const LeaveData = require("../models/Leave");
const User = require("../models/User");
const Holiday = require("../models/Holiday");
// Route to fetch leave reports for a given month
router.get("/leave-reports", async (req, res) => {
  try {
    const { month, year } = req.query;
    if (!month || !year) {
      return res.status(400).json({ error: "Month and year are required." });
    }

    const selectedMonth = parseInt(month);
    const selectedYear = parseInt(year);

    // Fetch all leave requests
    const leaveRecords = await LeaveData.find();
    let leaveMap = {};

    leaveRecords.forEach((record) => {
      record.startDate.forEach((start, index) => {
        const end = new Date(record.endDate[index]);
        let currentDate = new Date(start);

        while (currentDate <= end) {
          const currentMonth = currentDate.getMonth() + 1;
          const currentYear = currentDate.getFullYear();

          if (currentMonth === selectedMonth && currentYear === selectedYear) {
            const day = currentDate.getDate();
            if (!leaveMap[day]) leaveMap[day] = [];
            leaveMap[day].push(record.empname);
          }
          currentDate.setDate(currentDate.getDate() + 1);
        }
      });
    });

    res.json(leaveMap);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Route to fetch overlapping leaves for a manager's employees
router.get("/manager-leave-reports", async (req, res) => {
  try {
    const { email, month, year } = req.query;
    if (!email || !month || !year) {
      return res.status(400).json({ error: "Manager email, month, and year are required." });
    }

    const selectedMonth = parseInt(month);
    const selectedYear = parseInt(year);

    // Fetch employees under this manager
    const employees = await User.find({ managerEmail: email }).select("email empname");
    const employeeEmails = employees.map(emp => emp.email);
    const employeeNames = Object.fromEntries(employees.map(emp => [emp.email, emp.empname]));

    // Fetch leave records with overlapping dates for the selected month
    const leaveRecords = await LeaveData.find({
      email: { $in: employeeEmails },
      status: "Approved",
      startDate: { $elemMatch: { $lte: new Date(selectedYear, selectedMonth, 31) } },
      endDate: { $elemMatch: { $gte: new Date(selectedYear, selectedMonth, 1) } }
    });

    let leaveMap = {};

    leaveRecords.forEach((record) => {
      record.startDate.forEach((start, index) => {
        const end = new Date(record.endDate[index]); // Get the corresponding end date
        let currentDate = new Date(start);

        while (currentDate <= end) {
          const currentMonth = currentDate.getMonth() + 1;
          const currentYear = currentDate.getFullYear();

          if (currentMonth === selectedMonth && currentYear === selectedYear) {
            const day = currentDate.getDate();
            if (!leaveMap[day]) leaveMap[day] = [];
            leaveMap[day].push(employeeNames[record.email] || "Unknown Employee"); // Prevent undefined
          }
          currentDate.setDate(currentDate.getDate() + 1);
        }
      });
    });

    res.json(leaveMap);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});
// GET holidays for a specific month and year
router.get("/holidays", async (req, res) => {
  try {
    const { month, year } = req.query;

    if (!month || !year) {
      return res.status(400).json({ error: "Month and year are required" });
    }

    // Convert numeric month to short-form text (e.g., "03" → "Mar")
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthIndex = parseInt(month, 10) - 1; // Convert "03" to 2 (March)
    
    if (monthIndex < 0 || monthIndex > 11) {
      return res.status(400).json({ error: "Invalid month value" });
    }

    const monthText = monthNames[monthIndex]; // "Mar"

    // Find only "Mandatory" holidays in the selected month & year
    const holidays = await Holiday.find({
      date: { $regex: `-${monthText}-${year}$`, $options: "i" }, // Case-insensitive match
      type: "Mandatory", // Explicitly filter only Mandatory holidays
    });

    res.json(holidays);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});





module.exports = router;