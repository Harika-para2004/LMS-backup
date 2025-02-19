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
const exceluploads = require("./routes/exceluploads")

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
app.use("/excel",exceluploads);


app.post("/apply-leave", upload.single("attachment"), async (req, res) => {
  const { email } = req.query;
  const { empname, empid, leaveType, startDate, endDate, reason, managerEmail } = req.body;
  const filePath = req.file ? req.file.path : null;

  try {
    const formattedStartDate = new Date(startDate);
    const formattedEndDate = new Date(endDate);

    if (!leaveType || !startDate || !endDate) {
      return res.status(400).json({ message: "All fields (Leave Type, Start Date, End Date) are required." });
    }

    if (formattedEndDate < formattedStartDate) {
      return res.status(400).json({ message: "End Date cannot be before Start Date." });
    }

    // Fetch all leave records for the user
    let existingLeaves = await Leave.find({ email });

    for (let leave of existingLeaves) {
      for (let i = 0; i < leave.startDate.length; i++) {
        const existingStartDate = new Date(leave.startDate[i]);
        const existingEndDate = new Date(leave.endDate[i]);

        if (
          (formattedStartDate >= existingStartDate && formattedStartDate <= existingEndDate) ||
          (formattedEndDate >= existingStartDate && formattedEndDate <= existingEndDate) ||
          (formattedStartDate <= existingStartDate && formattedEndDate >= existingEndDate)
        ) {
          return res.status(400).json({
            message: `You have already applied for leave from ${existingStartDate.toLocaleDateString("en-GB")} to ${existingEndDate.toLocaleDateString("en-GB")}.`
          });
        }
      }
    }

    const startMonth = formattedStartDate.getMonth() + 1;
    const startYear = formattedStartDate.getFullYear();

    let leaveRecord = await Leave.findOne({ email, leaveType });

    if (leaveRecord) {
      leaveRecord.startDate.push(formattedStartDate);
      leaveRecord.endDate.push(formattedEndDate);
      leaveRecord.applyDate.push(new Date());
      leaveRecord.status.push("Pending");
      leaveRecord.attachments.push(filePath || "");
      leaveRecord.reason.push(reason || "");
      leaveRecord.month.push(startMonth);
      leaveRecord.year.push(startYear);

      await leaveRecord.save();
      return res.status(200).json({ message: "Leave application submitted successfully" });
    } else {
      const newLeave = new Leave({
        email,
        empname,
        empid,
        managerEmail,
        applyDate: [new Date()],
        leaveType,
        startDate: [formattedStartDate],
        endDate: [formattedEndDate],
        reason: reason ? [reason] : [],
        status: ["Pending"],
        attachments: [filePath || ""],
        month: [startMonth],
        year: [startYear],
      });

      await newLeave.save();
      return res.status(200).json({ message: "Leave application submitted successfully" });
    }
  } catch (error) {
    console.error("Error applying for leave:", error);
    res.status(500).json({ message: "Server error while applying leave." });
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
          applyDate: new Date(leave.applyDate).toLocaleDateString("en-GB"), // Format and include apply date
          startDate: new Date(start).toLocaleDateString("en-GB"),
          endDate: new Date(leave.endDate[index]).toLocaleDateString("en-GB"),
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
    const { userRole, userEmail } = req.query; // Get role & email from query params

    let query = {}; // Default query for admin (fetch all)

    if (userRole === "Manager") {
      query.managerEmail = userEmail; // Filter requests for employees under this manager
    }

    console.log("Query:", query); // Debugging output

    const leaveRequests = await Leave.find(query);
    console.log(leaveRequests);
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

  try {
    // ✅ Check if a holiday already exists on the same date
    const existingHoliday = await Holiday.findOne({ date });

    if (existingHoliday) {
      return res.status(400).json({ message: `A holiday already exists on ${date}: ${existingHoliday.name}` });
    }

    // Get the day of the week
    const holidayDate = new Date(date);
    const dayOfWeek = holidayDate.toLocaleString("en-us", { weekday: "long" });

    // Create and save new holiday
    const newHoliday = new Holiday({ date, day: dayOfWeek, name, type });
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
    const { project, search, email } = req.query;
    let query = { managerEmail: email }; // Filter by manager's email

    if (project) query.project = project;
    if (search) {
      query.$or = [
        { empname: new RegExp(search, "i") },
        { empid: new RegExp(search, "i") },
        { project: new RegExp(search, "i") },
      ];
    }

    // Fetch employees based on manager's email, project & search
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
          managerEmail: employee.managerEmail,
          leaves: leaves.flatMap((leave) =>
            leave.startDate.map((start, index) => ({
              leaveType: leave.leaveType,
              startDate: new Date(start).toLocaleDateString(),
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

    res.status(200).json(reports);
  } catch (error) {
    console.error("Error fetching reports:", error);
    res.status(500).json({ message: "Server Error" });
  }
});
app.get("/reports-admin", async (req, res) => {
  try {
    const { project, search } = req.query;
    let query = {};

    if (project) query.project = project;
    if (search) {
      query.$or = [
        { empname: new RegExp(search, "i") },
        { empid: new RegExp(search, "i") },
        { project: new RegExp(search, "i") },
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
              startDate: new Date(start).toLocaleDateString(),
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

    // console.log(reports);
    res.status(200).json(reports);
  } catch (error) {
    console.error("Error fetching reports:", error);
    res.status(500).json({ message: "Server Error" });
  }
});

app.get("/reports/export-excel", async (req, res) => {
  try {
    let { project, reports } = req.query;
    let query = {};
    if (project) query.project = project;
    // console.log("reports:", reports);
    if (typeof reports === "string") {
      try {
        reports = JSON.parse(reports);
      } catch (error) {
        console.error("Error parsing reports:", error);
        reports = [];
      }
    }

    // const employees = await User.find(query);
    const employees = Array.isArray(reports)
      ? reports
          .filter((report) => report.email !== "admin@gmail.com")
          .map((report) => report.email)
      : [];

    const workbook = new excelJS.Workbook();
    const worksheet = workbook.addWorksheet("Reports");

    worksheet.columns = [
      { header: "Employee ID", key: "empid", width: 15 },
      { header: "Name", key: "empname", width: 25 },
      { header: "Email", key: "email", width: 30 },
      { header: "Project", key: "project", width: 25 },
      { header: "Leave Type", key: "leaveType", width: 20 },
      { header: "Start Date", key: "startDate", width: 15 },
      { header: "End Date", key: "endDate", width: 15 },
      { header: "Status", key: "status", width: 15 },
    ];

    let allReports = [];

    for (const empemail of employees) {
      const empl = await User.find({ email: empemail });
      for (const emp of empl) {
        const leaves = await Leave.find({ email: empemail });
        console.log(emp);
        if (leaves.length > 0) {
          leaves.forEach((leave, index) => {
            leave.startDate.forEach((start, i) => {
              allReports.push({
                empid: emp.empid,
                empname: formatName(emp.empname),
                email: emp.email || "N/A",
                project: formatName(emp.project),
                leaveType: formatName(leave.leaveType),
                startDate: new Date(start), // Convert to Date for sorting
                endDate: formatDate(leave.endDate[i]),
                status: formatName(leave.status[i] || "Pending"),
              });
            });
          });
        } else {
          allReports.push({
            empid: emp.empid,
            empname: formatName(emp.empname),
            email: emp.email || "N/A",
            project: formatName(emp.project),
            leaveType: "N/A",
            startDate: new Date(0), // Default earliest date for sorting
            endDate: "N/A",
            status: "No Leaves",
          });
        }
      }
    }

    // **Sorting logic: First by name (A-Z), then by startDate (earliest first)**
    allReports.sort((a, b) => {
      if (a.empname < b.empname) return -1;
      if (a.empname > b.empname) return 1;
      return a.startDate - b.startDate; // Sort by date if names are same
    });

    // Add sorted data to the worksheet
    allReports.forEach((report) => {
      worksheet.addRow({
        ...report,
        startDate:
          report.startDate.getTime() === 0
            ? "N/A"
            : formatDate(report.startDate),
      });
    });

    res.setHeader(
      "Content-Disposition",
      "attachment; filename=leave_reports.xlsx"
    );
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("Error exporting Excel:", error);
    res.status(500).json({ message: "Server Error" });
  }
});

// Helper function to format names like in frontend
const formatName = (str) =>
  str
    ? str.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase())
    : "N/A";

// Helper function to format dates properly
const formatDate = (date) =>
  date ? new Date(date).toLocaleDateString("en-GB") : "N/A";

const formatLeaveDate = (date) => {
  if (!date || date === "N/A" || date === "Invalid date") return "N/A";
  return moment(date).isValid() ? moment(date).format("DD/MM/YYYY") : "N/A";
};

// Export Report to PDF
// app.get("/reports/export-pdf", async (req, res) => {
//   try {
//     const { project } = req.query;
//     let query = {};
//     if (project) query.project = project;
//     const employees = await User.find(query);
//     const doc = new pdfkit();
//     const filePath = "reports.pdf";
//     doc.pipe(fs.createWriteStream(filePath));
//     doc.fontSize(12).text("Leave Reports", { align: "center" });
//     doc.moveDown();
//     employees.forEach((emp) => {
//       doc
//         .fontSize(10)
//         .text(
//           `ID: ${emp.empid}, Name: ${emp.empname}, Project: ${emp.project}`
//         );
//       doc.moveDown();
//     });
//     doc.end();
//     res.download(filePath, "leave_reports.pdf", () => fs.unlinkSync(filePath));
//   } catch (error) {
//     console.error("Error exporting PDF:", error);
//     res.status(500).json({ message: "Server Error" });
//   }
// });

// const PDFDocument = require("pdfkit");

// app.get("/reports/export-pdf", async (req, res) => {
//   try {
//     const { project } = req.query;
//     let query = {};
//     if (project) query.project = project;
//     const employees = await User.find(query);

//     // Set response headers
//     res.setHeader("Content-Type", "application/pdf");
//     res.setHeader("Content-Disposition", "attachment; filename=leave_reports.pdf");

//     const doc = new PDFDocument();
//     doc.pipe(res); // Stream PDF directly to response

//     // Title
//     doc.fontSize(16).text("Leave Reports", { align: "center" });
//     doc.moveDown(2);

//     // Table Headers
//     doc.fontSize(12).text("ID | Name | Project", { underline: true });
//     doc.moveDown();

//     // Employee Data
//     employees.forEach((emp) => {
//       doc.text(`${emp.empid} | ${emp.empname} | ${emp.project}`);
//       doc.moveDown();
//     });

//     doc.end();
//   } catch (error) {
//     console.error("Error exporting PDF:", error);
//     res.status(500).json({ message: "Server Error" });
//   }
// });

const PDFDocument = require("pdfkit");
const moment = require("moment");

app.get("/reports/export-pdf", async (req, res) => {
  try {
    const { project, reports } = req.query;
    let query = {};
    if (project) query.project = project;

    let employees = [];
    if (typeof reports === "string") {
      try {
        employees = JSON.parse(reports);
        if (!Array.isArray(employees)) employees = [];
      } catch (error) {
        console.error("Error parsing reports:", error);
        employees = [];
      }
    }

    employees = employees.filter((emp) => emp.email !== "admin@gmail.com");

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=leave_reports.pdf"
    );

    const doc = new PDFDocument({ margin: 40 });
    doc.pipe(res);

    // **Title**
    doc
      .fontSize(18)
      .text("Leave Reports", { align: "center", underline: true });
    doc.moveDown(2);

    // **Table Headers**
    const headers = [
      "ID",
      "Name",
      "Email",
      "Project",
      "Leave Type",
      "Start Date",
      "End Date",
      "Status",
    ];

    doc.font("Helvetica-Bold").fontSize(12);
    headers.forEach((header, i) => {
      doc.text(header, 40 + i * 80, doc.y, { continued: true });
    });
    doc.moveDown();

    // **Table Content**
    doc.font("Helvetica").fontSize(10);
    employees.forEach((emp) => {
      const leavesData =
        emp.leaves && emp.leaves.length > 0
          ? emp.leaves
          : [
              {
                leaveType: "N/A",
                startDate: "N/A",
                endDate: "N/A",
                status: "No Leaves",
              },
            ];

      leavesData.forEach((leave) => {
        doc
          .text(emp.empid, 40, doc.y, { continued: true })
          .text(emp.empname, 120, doc.y, { continued: true })
          .text(emp.email || "N/A", 200, doc.y, { continued: true })
          .text(emp.project, 300, doc.y, { continued: true })
          .text(leave.leaveType || "N/A", 380, doc.y, { continued: true })
          .text(formatLeaveDate(leave.startDate), 460, doc.y, {
            continued: true,
          })
          .text(formatLeaveDate(leave.endDate), 540, doc.y, { continued: true })
          .text(leave.status || "Pending", 620, doc.y);
        doc.moveDown();
      });
    });

    doc.end();
  } catch (error) {
    console.error("Error exporting PDF:", error);
    res.status(500).json({ message: "Server Error" });
  }
});


// --------------------Dahboard------------

//Employee
app.get("/leave-trends/:email/:year", async (req, res) => {
  try {
      const { email, year } = req.params;
      const numericYear = parseInt(year);

      // Fetch leave records for the given email and year
      const leaves = await Leave.find({ email, year: numericYear });

      // Initialize monthly leave data
      const leaveData = Array(12).fill(null).map(() => ({}));

      leaves.forEach(leave => {
          leave.month.forEach((month, index) => {
              if (leave.status[index] === "Approved") {
                  const leaveType = leave.leaveType;
                  const duration = leave.duration[index] || 0;

                  if (!leaveData[month - 1][leaveType]) {
                      leaveData[month - 1][leaveType] = 0;
                  }
                  leaveData[month - 1][leaveType] += duration;
              }
          });
      });

      // Format the response
      const response = leaveData.map((data, index) => ({
          month: index + 1,
          ...data
      }));

      res.json(response);
  } catch (error) {
      console.error("Error fetching leave trends:", error);
      res.status(500).json({ message: "Internal Server Error" });
  }
});





// Get Leave Type Distribution
// app.get('/leave-types/:email', async (req, res) => {
//   const { email } = req.params;
//   try {
//     const types = await Leave.aggregate([
//       { $match: { email } },
//       { $group: { _id: "$leaveType", count: { $sum: { $size: "$startDate" } } } } // Count total leave applications
//     ]);
//     res.json(types);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

app.get('/leavetype-status/:email', async (req, res) => {
  const { email } = req.params;
  try {
    const types = await Leave.aggregate([
      { $match: { email } },

      // 🔹 Unwind the arrays to process each date separately
      { $unwind: "$startDate" },
      { $unwind: "$endDate" },
      { $unwind: "$status" },

      // 🔹 Group by leaveType & status
      {
        $group: {
          _id: { leaveType: "$leaveType", status: "$status" },
          count: { $sum: 1 } // ✅ Correct count of each leave type & status
        }
      },

      // 🔹 Sort for better readability
      { $sort: { "_id.leaveType": 1, "_id.status": 1 } }
    ]);

    res.json(types);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// app.get('/leave-types/:email/:year?', async (req, res) => {
//   const { email, year } = req.params;
//   const matchStage = { email };

//   // If a specific year is provided, filter by that year
//   if (year) {
//     matchStage["year"] = parseInt(year);
//   }

//   try {
//     const types = await Leave.aggregate([
//       { $match: matchStage },

//       // 🔹 Unwind `status`, `startDate`, and `year`
//       { $unwind: "$status" },
//       { $unwind: "$startDate" },
//       { $unwind: "$year" },

//       // 🔹 Extract the year from `startDate`
//       {
//         $addFields: {
//           extractedYear: { $year: "$startDate" }
//         }
//       },

//       // 🔹 Group by Year & Status
//       {
//         $group: {
//           _id: { year: "$extractedYear", status: "$status" },
//           count: { $sum: 1 }
//         }
//       },

//       // 🔹 Sort by Year & Status
//       { $sort: { "_id.year": 1, "_id.status": 1 } }
//     ]);

//     res.json(types);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// app.get('/leave-types/:email/:year?', async (req, res) => {
//   const { email, year } = req.params;

//   try {
//     const matchStage = { email }; // Match email

//     // If a specific year is provided, filter by that year (inside the array)
//     if (year) {
//       matchStage["year"] = { $elemMatch: { $eq: parseInt(year) } };
//     }

//     const types = await Leave.aggregate([
//       { $match: matchStage },

//       // 🔹 Unwind arrays so that each leave entry is treated separately
//       { $unwind: "$startDate" },
//       { $unwind: "$status" },
//       { $unwind: "$year" },

//       // 🔹 Extract the year from `startDate`
//       {
//         $addFields: {
//           extractedYear: { $year: "$startDate" }
//         }
//       },

//       // 🔹 Filter again to match the requested year (if provided)
//       ...(year ? [{ $match: { extractedYear: parseInt(year) } }] : []),

//       // 🔹 Group by Year & Status
//       {
//         $group: {
//           _id: { year: "$extractedYear", status: "$status" },
//           count: { $sum: 1 }
//         }
//       },

//       // 🔹 Sort by Year & Status
//       { $sort: { "_id.year": 1, "_id.status": 1 } }
//     ]);
//     console.log("year by trends:",types);

//     res.json(types);

//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// app.get('/leave-types/:email/:year?', async (req, res) => {
//   const { email, year } = req.params;
  
//   console.log("Received request:", { email, year });

//   try {
//     // 🔹 Build Query Dynamically (Filter by Email & Year if provided)
//     let matchStage = { email };
//     if (year) {
//       matchStage.startDate = {
//         $gte: new Date(`${year}-01-01`),
//         $lt: new Date(`${year}-12-31`),
//       };
//     }

//     const leaveTypes = await Leave.aggregate([
//       { $match: matchStage },

//       // 🔹 Group by leaveType & status
//       {
//         $group: {
//           _id: { leaveType: "$leaveType", status: "$status" },
//           count: { $sum: 1 }
//         }
//       },

//       // 🔹 Sort for consistency
//       { $sort: { "_id.leaveType": 1 } }
//     ]);

//     console.log("📌 Leave Types Result:", leaveTypes);
//     res.json(leaveTypes);
//   } catch (err) {
//     console.error("❌ Error in API:", err);
//     res.status(500).json({ error: err.message });
//   }
// });

//charts.js
app.get('/leave-type-status/:email/:year', async (req, res) => {
  const { email, year } = req.params;

  try {
    const matchStage = { email };
    if (year) {
      matchStage.year = parseInt(year);
    }

    const leaveStats = await Leave.aggregate([
      { $match: matchStage },

      // Unwind status array to treat each status separately
      { $unwind: "$status" },

      // Group by leaveType and status, count occurrences
      {
        $group: {
          _id: { leaveType: "$leaveType", status: "$status" },
          count: { $sum: 1 }
        }
      },

      // Format response
      {
        $group: {
          _id: "$_id.leaveType",
          statuses: {
            $push: {
              status: "$_id.status",
              count: "$count"
            }
          }
        }
      },

      // Sort by leave type
      { $sort: { "_id": 1 } }
    ]);

    // Format response for frontend
    const formattedResponse = leaveStats.map(item => ({
      leaveType: item._id,
      statuses: item.statuses.reduce((acc, curr) => {
        acc[curr.status] = curr.count;
        return acc;
      }, { Pending: 0, Approved: 0, Rejected: 0 })
    }));

    res.json(formattedResponse);
  } catch (err) {
    console.error("❌ Error in API:", err);
    res.status(500).json({ error: err.message });
  }
});
app.get("/leave-trends/:email/:year", async (req, res) => {
  const { email, year } = req.params;
  try {
    const data = await Leave.aggregate([
      { $match: { email, year: parseInt(year) } },
      { $unwind: "$leaves" }, 
      {
        $group: {
          _id: { month: "$leaves.month", leaveType: "$leaves.leaveType" },
          totalDuration: { $sum: "$leaves.duration" }
        }
      },
      {
        $group: {
          _id: "$_id.month",
          leaveTypes: {
            $push: {
              type: "$_id.leaveType",
              duration: "$totalDuration"
            }
          }
        }
      }
    ]);

    // Convert to a fixed array of 12 months with default values
    const formattedData = new Array(12).fill(null).map((_, index) => ({
      month: index + 1,
      ...Object.fromEntries(data.find(d => d._id === index + 1)?.leaveTypes.map(l => [l.type, l.duration]) || [])
    }));

    res.json(formattedData);
  } catch (err) {
    res.status(500).json({ error: "Error fetching leave trends" });
  }
});


// Get leave balance
// app.get("/leave-balance/:email", async (req, res) => {
//   const { email } = req.params;
//   try {
//     const user = await Leave.findOne({ email });
//     if (!user) return res.status(404).json({ error: "User not found" });

//     res.json({ usedLeaves: user.usedLeaves, availableLeaves: user.availableLeaves });
//   } catch (err) {
//     res.status(500).json({ error: "Error fetching leave balance" });
//   }
// });

// app.get("/leave-balance/:email/:year", async (req, res) => {
//   const { email, year } = req.params;
//   try {
//     const leaves = await Leave.find({ email, year: Number(year) });

//     // if (!leaves.length) return res.status(404).json({ error: "No leave data found for this year" });

//     const leaveBalance = leaves.reduce((acc, leave) => {
//       if (!acc[leave.leaveType]) {
//         acc[leave.leaveType] = { availableLeaves: leave.availableLeaves, usedLeaves: leave.usedLeaves };
//       } else {
//         acc[leave.leaveType].availableLeaves += leave.availableLeaves;
//         acc[leave.leaveType].usedLeaves += leave.usedLeaves;
//       }
//       return acc;
//     }, {});

//     res.json(leaveBalance);
//   } catch (err) {
//     res.status(500).json({ error: "Error fetching leave balance" });
//   }
// });

app.get("/leave-balance/:email/:year", async (req, res) => {
  const { email, year } = req.params;
  
  try {
    const leaves = await Leave.find({ email, year: Number(year) });

    if (!leaves.length) {
      return res.json({});
    }

    const leaveBalance = leaves.reduce((acc, leave) => {
      if (!acc[leave.leaveType]) {
        acc[leave.leaveType] = {
          totalLeaves: leave.totalLeaves,
          usedLeaves: leave.usedLeaves,
          availableLeaves: leave.availableLeaves
        };
      } else {
        acc[leave.leaveType].totalLeaves += leave.totalLeaves;
        acc[leave.leaveType].usedLeaves += leave.usedLeaves;
        acc[leave.leaveType].availableLeaves += leave.availableLeaves;
      }
      return acc;
    }, {});

    res.json(leaveBalance);
  } catch (err) {
    console.error("Error fetching leave balance:", err);
    res.status(500).json({ error: "Error fetching leave balance" });
  }
});





//Manager

// Get Pending/Approved/Rejected Requests
app.get('/leave-status/:managerEmail', async (req, res) => {
  const { managerEmail } = req.params;
  try {
    const statusData = await Leave.aggregate([
      { $match: { managerEmail } },
      { $unwind: "$status" }, // Handle array of statuses
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);
    res.json(statusData);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Get Project-Wise Leave Trends
app.get('/leave-projects', async (req, res) => {
  try {
    const projectLeaves = await Leave.aggregate([
      { $group: { _id: "$project", totalLeaves: { $sum: "$usedLeaves" } } }
    ]);
    res.json(projectLeaves);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//Admin

// Get Company-Wide Leave Trends
app.get('/leave-company', async (req, res) => {
  try {
    const companyTrends = await Leave.aggregate([
      { $unwind: "$month" },
      { $unwind: "$year" },
      { 
        $group: {
          _id: { year: "$year", month: "$month" },
          totalLeaves: { $sum: { $sum: "$duration" } } // Sum all durations
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } }
    ]);
    res.json(companyTrends);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Get Holidays Impact on Leave Requests
app.get('/leave-holidays-impact', async (req, res) => {
  try {
    const impact = await Leave.aggregate([
      {
        $lookup: {
          from: "holidays",
          localField: "applyDate",
          foreignField: "date",
          as: "holidayInfo"
        }
      },
      {
        $group: {
          _id: { holiday: "$holidayInfo.name", date: "$applyDate" },
          totalLeaves: { $sum: "$usedLeaves" }
        }
      }
    ]);
    res.json(impact);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/leave-approval-rate", async (req, res) => {
  try {
    const { userRole, userEmail } = req.query;

    if (!userEmail) {
      return res.status(400).json({ error: "Manager email is required" });
    }

    let query = {};
      query.managerEmail = userEmail;
    

    const leaveRequests = await Leave.find(query);
    console.log(`Fetched ${leaveRequests.length} leave requests for manager: ${userEmail}`);

    let pending = 0, approved = 0, rejected = 0;

    leaveRequests.forEach((leave) => {
      // ✅ Count each status separately
      leave.status.forEach((status) => {
        const lowerStatus = status.toLowerCase();
        if (lowerStatus === "pending") pending++;
        else if (lowerStatus === "approved") approved++;
        else if (lowerStatus === "rejected") rejected++;
      });
    });

    console.log("Final Data Sent:", { pending, approved, rejected });
    res.json({ pending, approved, rejected });

  } catch (error) {
    console.error("Error fetching leave approval rate:", error);
    res.status(500).json({ error: "Server error" });
  }
});
app.get("/leave-types", async (req, res) => {
  try {
    const { userRole, userEmail } = req.query;

    if (!userEmail) {
      return res.status(400).json({ error: "Manager email is required" });
    }

    let query = {};
      query.managerEmail = userEmail;
    

    const leaveRequests = await Leave.find(query);
    console.log(`Fetched ${leaveRequests.length} leave requests for manager: ${userEmail}`);

    let leaveTypeSummary = {};

    leaveRequests.forEach((leave) => {
      const { leaveType, status } = leave;
      
      if (!leaveTypeSummary[leaveType]) {
        leaveTypeSummary[leaveType] = { pending: 0, approved: 0, rejected: 0 };
      }
      
      status.forEach((s) => {
        const lowerStatus = s.toLowerCase();
        if (lowerStatus === "pending") leaveTypeSummary[leaveType].pending++;
        else if (lowerStatus === "approved") leaveTypeSummary[leaveType].approved++;
        else if (lowerStatus === "rejected") leaveTypeSummary[leaveType].rejected++;
      });
    });

    console.log("Final Data Sent:", leaveTypeSummary);
    res.json(leaveTypeSummary);
  } catch (error) {
    console.error("Error fetching leave types summary:", error);
    res.status(500).json({ error: "Server error" });
  }
});
app.get("/employee-monthly-leaves", async (req, res) => {
  try {
    const { userEmail } = req.query; // Manager's email

    // ✅ Fetch only APPROVED leaves under this manager
    const approvedLeaves = await Leave.find({ managerEmail: userEmail, status: "Approved" });

    const monthlyLeaveData = {};

    approvedLeaves.forEach((leave) => {
      const employee = leave.empname;
      leave.month.forEach((month, index) => {
        if (leave.status[index] !== "Approved") return; // ✅ Ignore non-approved leaves

        if (!monthlyLeaveData[employee]) {
          monthlyLeaveData[employee] = {};
        }

        monthlyLeaveData[employee][month] =
          (monthlyLeaveData[employee][month] || 0) + leave.duration[index];
      });
    });

    res.json(monthlyLeaveData);
  } catch (error) {
    console.error("Error fetching employee monthly leave data:", error);
    res.status(500).json({ error: "Server error" });
  }
});


