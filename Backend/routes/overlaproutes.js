const express = require("express");
const router = express.Router();
const LeaveData = require("../models/Leave");
const User = require("../models/User");
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
    console.error("Error fetching leave reports:", error);
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
    console.error("Error fetching manager leave reports:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});


module.exports = router;