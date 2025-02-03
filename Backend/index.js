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
const multer = require("multer");
const path = require("path");
const excelJS = require("exceljs");
const pdfkit = require("pdfkit");
const fs = require("fs");
const upload = multer({ dest: "uploads/" });

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
app.use("/api/leave-policies", leavepolicyRoutes);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.post("/apply-leave", upload.single("attachment"), async (req, res) => {
  const { email } = req.query;
  const { empname, empid, leaveType, startDate, endDate, reason } = req.body; // Removed applyDate as it should be derived from the current date
  const filePath = req.file ? req.file.path : null;

  try {
    let leaveRecord = await Leave.findOne({ email, leaveType });

    // Create a new leave record or update an existing one
    if (leaveRecord) {
      // Update existing leave record
      leaveRecord.startDate.push(new Date(startDate));
      leaveRecord.endDate.push(new Date(endDate));
      leaveRecord.status.push("pending");

      if (filePath) {
        leaveRecord.attachments.push(filePath);
      } else {
        leaveRecord.attachments.push(""); // Push an empty string when no file is provided
      }

      if (reason) {
        leaveRecord.reason.push(reason); // Ensure reason is pushed
      }
    } else {
      // Create a new leave record
      leaveRecord = new Leave({
        email,
        empname,
        empid,
        applyDate: new Date(), // Setting current date as applyDate
        leaveType,
        startDate: [new Date(startDate)],
        endDate: [new Date(endDate)],
        reason: reason ? [reason] : [], // Add reason only if provided
        status: ["pending"],
        attachments: [filePath ? filePath : ""], // Always create an attachments array with an entry (empty string if no file)
      });
    }

    await leaveRecord.save();
    res
      .status(200)
      .json({ message: "Leave application submitted successfully" });
  } catch (error) {
    console.error("Error updating leave record:", error); // Log the error for debugging
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

    const formattedHistory = leaveHistory
      .map((leave) => {
        return leave.startDate.map((start, index) => ({
          leaveType: leave.leaveType,
          applyDate: new Date(leave.applyDate).toLocaleDateString(), // Format and include apply date
          startDate: new Date(start).toLocaleDateString(),
          endDate: new Date(leave.endDate[index]).toLocaleDateString(),
          reason: leave.reason[index],
          status: leave.status[index] || "Pending",
          duration: leave.duration[index],
          attachments: leave.attachments[index],
        }));
      })
      .flat();

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
app.get("/leaverequests", async (req, res) => {
  try {
    const excludeEmail = req.query.excludeEmail; // Get email to exclude from query parameters
    const query = excludeEmail ? { email: { $ne: excludeEmail } } : {}; // Filter out the email
    const leaveRequests = await Leave.find(query); // Query the database
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
    return res
      .status(400)
      .json({ message: "Email and new password are required." });
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
  console.log(newHoliday);

  try {
    const savedHoliday = await newHoliday.save();
    res.status(201).json(savedHoliday);
  } catch (err) {
    console.error("Error saving holiday:", err);
    res
      .status(500)
      .json({ message: "Error creating holiday", error: err.message });
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
  const { empid, empname, email, project } = req.body;

  try {
    if (!empid || !empname || !email || !project) {
      return res.status(400).json({ message: "All fields are required!" });
    }
    const updatedEmployee = await User.findByIdAndUpdate(
      req.params.id,
      { empid, empname, email, project },
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
    res
      .status(500)
      .json({ message: "Error deleting employee", error: err.message });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

app.get("/reports", async (req, res) => {
  try {
    const { project, search } = req.query;
    let query = {};

    if (project) query.project = project;
    if (search) {
      query.$or = [
        { empname: new RegExp(search, "i") },
        { empid: new RegExp(search, "i") },
      ];
    }

    // Fetch employees based on project & search
    const employees = await User.find(query);

    // Fetch leave data for each employee
    const reports = await Promise.all(
      employees.map(async (employee) => {
        const leaves = await Leave.find({ email: employee.email });

        return {
          empid: employee.empid,
          empname: employee.empname,
          project: employee.project,
          email: employee.email,
          leaves: leaves.flatMap((leave) =>
            leave.startDate.map((start, index) => ({
              leaveType: leave.leaveType,
              startDate: new Date(start).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              }),
              endDate: leave.endDate[index]
                ? new Date(leave.endDate[index]).toLocaleDateString()
                : "N/A",
              status: leave.status[index] || "Pending",
              reason: leave.reason[index] || "No reason provided",
              duration: leave.duration[index] || "N/A",
              attachments: leave.attachments[index] || [],
            }))
          ),
        };
      })
    );

    console.log(reports);
    res.status(200).json(reports);
  } catch (error) {
    console.error("Error fetching reports:", error);
    res.status(500).json({ message: "Server Error" });
  }
});

// Export Report to Excel
app.get("/reports/export-excel", async (req, res) => {
  try {
    const { project } = req.query;
    let query = {};
    if (project) query.project = project;
    const employees = await User.find(query);
    const workbook = new excelJS.Workbook();
    const worksheet = workbook.addWorksheet("Reports");
    worksheet.columns = [
      { header: "Employee ID", key: "empid" },
      { header: "Name", key: "empname" },
      { header: "Project", key: "project" },
      { header: "Leave Type", key: "leaveType" },
      { header: "Start Date", key: "startDate" },
      { header: "End Date", key: "endDate" },
      { header: "Status", key: "status" },
    ];
    for (const emp of employees) {
      const leaves = await Leave.find({ email: emp.email });
      leaves.forEach((leave) => {
        worksheet.addRow({
          empid: emp.empid,
          empname: emp.empname,
          project: emp.project,
          leaveType: leave.leaveType,
          startDate: leave.startDate,
          endDate: leave.endDate,
          status: leave.status,
        });
      });
    }
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=leave_reports.xlsx"
    );
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("Error exporting Excel:", error);
    res.status(500).json({ message: "Server Error" });
  }
});

// Export Report to PDF
app.get("/reports/export-pdf", async (req, res) => {
  try {
    const { project } = req.query;
    let query = {};
    if (project) query.project = project;
    const employees = await User.find(query);
    const doc = new pdfkit();
    const filePath = "reports.pdf";
    doc.pipe(fs.createWriteStream(filePath));
    doc.fontSize(12).text("Leave Reports", { align: "center" });
    doc.moveDown();
    employees.forEach((emp) => {
      doc
        .fontSize(10)
        .text(
          `ID: ${emp.empid}, Name: ${emp.empname}, Project: ${emp.project}`
        );
      doc.moveDown();
    });
    doc.end();
    res.download(filePath, "leave_reports.pdf", () => fs.unlinkSync(filePath));
  } catch (error) {
    console.error("Error exporting PDF:", error);
    res.status(500).json({ message: "Server Error" });
  }
});
