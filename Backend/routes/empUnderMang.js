const express = require("express");
const router = express.Router();
const User = require("../models/User"); // Import your Mongoose User model

// Get employees under a specific manager
router.get("/", async (req, res) => {
  try {
    const { managerEmail } = req.query;
    if (!managerEmail) {
      return res.status(400).json({ error: "Manager email is required" });
    }

    const employees = await User.find({ managerEmail, role: "Employee" }).select("empid empname project gender email");

    res.status(200).json(employees);
  } catch (error) {
    console.error("Error fetching employees:", error);
    res.status(500).json({ error: "Server error" });
  }
});


module.exports = router;
