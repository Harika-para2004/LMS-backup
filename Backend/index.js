const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const authRoutes = require("./routes/authRoutes");
const leavepolicyRoutes = require("./routes/LeavePolicyRoutes");

const Leave = require("./models/Leave");
const User = require("./models/User");
const bcrypt = require("bcrypt");
const Holiday = require("./models/Holiday");
const multer = require('multer');

dotenv.config();

const app = express();
const port = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());
/* mongodb+srv://lahiri:sai*123@cluster0.r7eze9l.mongodb.net/*/
// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err.message));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/leave-policies",leavepolicyRoutes);
const upload = multer({ dest: "uploads/" });
const path = require("path");
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.post("/apply-leave", upload.single("attachment"), async (req, res) => {
  const { email } = req.query;
  const { leaveType, applyDate, startDate, endDate, reason } = req.body;
  const filePath = req.file ? req.file.path : null;

  try {
    let leaveRecord = await Leave.findOne({ email, leaveType });

    if (leaveRecord) {
      leaveRecord.startDate.push(new Date(startDate));
      leaveRecord.endDate.push(new Date(endDate));
      leaveRecord.status.push("pending");

      if (filePath) {
        leaveRecord.attachments.push(filePath);
      }

      if (reason) {
        leaveRecord.reason = leaveRecord.reason || []; // Ensure it's an array
        leaveRecord.reason.push(reason);
      }
    } else {
      leaveRecord = new Leave({
        email,
        applyDate,
        leaveType,
        startDate: [new Date(startDate)],
        endDate: [new Date(endDate)],
        reason: reason ? [reason] : [], // Add reason only if provided
        status: ["pending"],
        attachments: filePath ? [filePath] : [],
      });
    }

    await leaveRecord.save();
    res.status(200).json({ message: "Leave application submitted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Error updating leave record" });
  }
});


app.get("/leave-history", async (req, res) => {
  const { email } = req.query;
  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  try {
    const leaveHistory = await Leave.find({ email });

    console.log(leaveHistory);
    const formattedHistory = leaveHistory.map((leave) => {
      return leave.startDate.map((start, index) => {
        const duration = leave.duration && leave.duration[index] ? leave.duration[index] : "N/A"; // Add fallback for missing duration
        console.log("Duration for this leave:", leave.duration[index]);
        return {
          leaveType: leave.leaveType,
          applyDate: new Date(leave.applyDate).toLocaleDateString(),
          startDate: new Date(start).toLocaleDateString(),
          endDate: new Date(leave.endDate[index]).toLocaleDateString(),
          duration,
          reason: leave.reason[index] || "N/A",
          status: leave.status[index] || "Pending",
        };
      });
    }).flat();

    res.status(200).json(formattedHistory);
  } catch (error) {
    console.error("Error fetching leave history:", error);
    res.status(500).json({ message: "An error occurred" });
  }
});

app.get("/leavesummary", async (req, res) => {
  const { email } = req.query; // Get the email from the query parameters
  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  try {
    const leaveData = await Leave.find({ email });

    if (!leaveData || leaveData.length === 0) {
      return res
        .status(404)
        .json({ message: "No leave records found for the specified email" });
    }

    res.json(leaveData);
  } catch (err) {
    console.error("Error fetching leave summary:", err);
    res.status(500).send("Server Error");
  }
});

// app.get("/leaverequests", async (req, res) => {
//   try {
//     const excludeEmail = req.query.excludeEmail; // Get email to exclude from query parameters
//     const query = excludeEmail ? { email: { $ne: excludeEmail } } : {}; // Filter out the email
//     const leaveRequests = await Leave.find(query); // Query the database
//     res.json(leaveRequests);
//   } catch (error) {
//     console.error("Error fetching leave requests:", error);
//     res.status(500).send("Server error");
//   }
// });

app.get("/leaverequests", async (req, res) => {
  try {
    const { email, excludeEmail } = req.query;

    let matchQuery = {};
    if (email) {
      matchQuery.email = email; // Fetch leave requests for a specific employee
    } else if (excludeEmail) {
      matchQuery.email = { $ne: excludeEmail }; // Exclude leave requests for a specific email
    }

    const leaveRequests = await Leave.aggregate([
      {
        $match: matchQuery, // Apply the filter condition
      },
      {
        $lookup: {
          from: "signups_cols", // The actual collection name in MongoDB
          localField: "email",
          foreignField: "email",
          as: "employeeDetails",
        },
      },
      {
        $unwind: {
          path: "$employeeDetails",
          preserveNullAndEmptyArrays: true, // Keep records even if no user details exist
        },
      },
      {
        $project: {
          _id: 1,
          empid: "$employeeDetails.empid",
          empname: "$employeeDetails.empname",
          email: 1,
          leaveType: 1,
          applyDate: 1,
          startDate: 1,
          endDate: 1,
          reason: 1,
          status: 1,
          totalLeaves: 1,
          usedLeaves: 1,
          availableLeaves: 1,
          attachments: 1,
          duration:1,
        },
      },
    ]);

    if (!leaveRequests.length) {
      return res.status(404).json({ message: "No leave records found" });
    }

    res.json(leaveRequests);
  } catch (error) {
    console.error("Error fetching leave requests:", error);
    res.status(500).send("Server error");
  }
});


app.put("/leaverequests/:id", async (req, res) => {
  try {
    const leaveId = req.params.id;
    const updatedData = req.body;

    const leave = await Leave.findByIdAndUpdate(leaveId, updatedData, {
      new: true,
    });

    if (leave) {
      res.status(200).json(leave);
    } else {
      res.status(404).json({ message: "Leave request not found" });
    }
  } catch (error) {
    console.error("Error updating leave request:", error);
    res.status(500).json({ message: "An error occurred" });
  }
});


app.put("/updatepassword", async (req, res) => {
  const { email, newPassword } = req.body;

  // Validate input
  if (!email || !newPassword) {
    return res.status(400).json({ message: "Email and new password are required." });
  }

  try {
    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update the user's password
    user.password = hashedPassword;
    await user.save();

    res.status(200).json({ message: "Password updated successfully." });
  } catch (error) {
    console.error("Error updating password:", error);
    res.status(500).json({ message: "Internal server error." });
  }
});

app.get("/holidays", async (req, res) => {
  try {
    const holidays = await Holiday.find();
    res.json(holidays);
  } catch (err) {
    console.error("Error fetching holidays:", err);
    res.status(500).json({ message: "Server Error", error: err.message }); // Include error message
  }
});

app.get("/employee-list", async (req, res) => {
  try {
    const employees = await User.find();
    res.json(employees);
  } catch (err) {
    console.error("Error fetching holidays:", err);
    res.status(500).json({ message: "Server Error", error: err.message }); // Include error message
  }
});


// Create a new holiday
app.post("/holidays", async (req, res) => {
  const { date, name, type } = req.body;

  if (!date || !name || !type) {
    return res.status(400).json({ message: "All fields are required!" });
  }

  const holidayDate = new Date(date);
  const dayOfWeek = holidayDate.toLocaleString("en-us", { weekday: "long" }); 

  const newHoliday = new Holiday({ date, day: dayOfWeek, name, type });
  console.log(newHoliday)

  try {
    const savedHoliday = await newHoliday.save();
    res.status(201).json(savedHoliday); 
  } catch (err) {
    console.error("Error saving holiday:", err);
    res.status(500).json({ message: "Error creating holiday", error: err.message });
  }
});

// Update a holiday
app.put("/holidays/:id", async (req, res) => {
  const { date, name, type } = req.body;

  try {
    if (!date || !name || !type) {
      return res.status(400).json({ message: "All fields are required!" });
    }

    const holidayDate = new Date(date);
    const dayOfWeek = holidayDate.toLocaleString("en-us", { weekday: "long" });

    const updatedHoliday = await Holiday.findByIdAndUpdate(
      req.params.id,
      { date, day: dayOfWeek, name, type },
      { new: true }
    );

    if (!updatedHoliday) {
      return res.status(404).json({ message: "Holiday not found" });
    }

    res.json(updatedHoliday);
  } catch (err) {
    res
      .status(400)
      .json({ message: "Error updating holiday", error: err.message });
  }
});
app.put("/updateEmployeeList/:id", async (req, res) => {
  const { empid, empname, email,project } = req.body;

  try {
    if (!empid || !empname || !email || !project) {
      return res.status(400).json({ message: "All fields are required!" });
    }
    const updatedEmployee = await User.findByIdAndUpdate(
      req.params.id,
      { empid,empname,email,project },
      { new: true }
    );

    if (!updatedEmployee) {
      return res.status(404).json({ message: "Holiday not found" });
    }

    res.json(updatedEmployee);
  } catch (err) {
    res
      .status(400)
      .json({ message: "Error updating holiday", error: err.message });
  }
});
// Delete a holiday
app.delete("/holidays/:id", async (req, res) => {
  try {
    const holiday = await Holiday.findById(req.params.id);

    if (!holiday) {
      return res.status(404).json({ message: "Holiday not found" });
    }

    await Holiday.findByIdAndDelete(req.params.id);
    res.json({ message: "Holiday deleted successfully" });
  } catch (err) {
    res
      .status(400)
      .json({ message: "Error deleting holiday", error: err.message });
  }
});
app.delete("/employee-del/:id", async (req, res) => {
  try {
    // Check if the employee exists
    const emp = await User.findById(req.params.id);

    if (!emp) {
      return res.status(404).json({ message: "Employee not found" });
    }

    // Delete the employee
    await User.findByIdAndDelete(req.params.id);

    res.json({ message: "Employee deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting employee", error: err.message });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});