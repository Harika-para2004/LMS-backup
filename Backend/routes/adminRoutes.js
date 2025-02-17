const express = require("express");
const Leave = require("../models/Leave");

const router = express.Router();

// ✅ Route: Get Leave Trends for Admin Analytics
router.get("/leave-trends", async (req, res) => {
  try {
    const { year, month } = req.query;
    if (!year || !month) {
      return res.status(400).json({ message: "Year and month are required" });
    }

    const parsedYear = parseInt(year);
    const parsedMonth = parseInt(month);

    const leaves = await Leave.find({
      year: parsedYear,
      month: parsedMonth,
    });

    if (leaves.length === 0) {
      return res.status(404).json({ message: "No leave data available" });
    }

    let totalLeaves = 0;
    let leaveTypeCounts = {};
    let employeeLeaveCounts = {};
    let statusCounts = { Pending: 0, Approved: 0, Rejected: 0 };

    leaves.forEach((leave) => {
      leave.leaveType.forEach((type, index) => {
        const days = leave.duration[index] || 0;
        totalLeaves += days;
        leaveTypeCounts[type] = (leaveTypeCounts[type] || 0) + days;
        employeeLeaveCounts[leave.empname] =
          (employeeLeaveCounts[leave.empname] || 0) + days;

        const status = leave.status[index] || "Pending";
        statusCounts[status] = (statusCounts[status] || 0) + 1;
      });
    });

    res.json({ totalLeaves, leaveTypeCounts, employeeLeaveCounts, statusCounts });
  } catch (error) {
    console.error("Error fetching leave trends:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

module.exports = router;
