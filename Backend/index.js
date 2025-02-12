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

// app.post("/apply-leave", upload.single("attachment"), async (req, res) => {
//   const { email } = req.query;
//   const {
//     empname,
//     empid,
//     leaveType,
//     startDate,
//     endDate,
//     reason,
//     managerEmail,
//   } = req.body;
//   const filePath = req.file ? req.file.path : null;

//   try {
//     // Convert dates to Date objects
//     const formattedStartDate = new Date(startDate);
//     const formattedEndDate = new Date(endDate);

//     // **✅ 1. Required Fields Check**
//     if (!leaveType || !startDate || !endDate) {
//       return res
//         .status(400)
//         .json({
//           message:
//             "All fields (Leave Type, Start Date, End Date) are required.",
//         });
//     }

//     // **✅ 2. Check if End Date is valid**
//     if (formattedEndDate < formattedStartDate) {
//       return res
//         .status(400)
//         .json({ message: "End Date cannot be before Start Date." });
//     }

//     // **✅ 3. Fetch overlapping leave requests**
//     const overlappingLeaves = await Leave.find({
//       email,
//       $or: [
//         {
//           startDate: { $lte: formattedEndDate },
//           endDate: { $gte: formattedStartDate },
//         },
//       ],
//     });

//     // **✅ 4. If an overlap exists, format the response properly**
//     if (overlappingLeaves.length > 0) {
//       const formattedLeaves = overlappingLeaves.map((leave) => {
//         const startDates = leave.startDate
//           .map((date) => new Date(date).toLocaleDateString("en-GB"))
//           .join(", ");
//         const endDates = leave.endDate
//           .map((date) => new Date(date).toLocaleDateString("en-GB"))
//           .join(", ");
//         return `From: ${startDates} to ${endDates}`;
//       });

//       // return res.status(400).json({
//       //   message: `You have already applied for leave on these dates:\n\n${formattedLeaves.join(
//       //     "\n"
//       //   )}`,
//       // });
//       return res.status(400).json({
//         message: 'You have already applied for leave on these dates'
//       });
//     }

//     // **✅ 5. Ensure no pending leave requests exist**
//     const pendingLeave = await Leave.findOne({
//       email,
//       leaveType,
//       $expr: { $eq: [{ $arrayElemAt: ["$status", -1] }, "Pending"] }, // ✅ Only checks latest status
//     });
    

//     console.log("Pending Leave:", pendingLeave);

//     if (pendingLeave) {
//       return res.status(400).json({
//         message: `You already have a pending leave request for ${leaveType}. Wait for approval before applying again.`,
//       });
//     }

//     // **✅ 6. Save Leave Record**
//     const newLeave = new Leave({
//       email,
//       empname,
//       empid,
//       managerEmail,
//       applyDate: new Date(),
//       leaveType,
//       startDate: [formattedStartDate],
//       endDate: [formattedEndDate],
//       reason: reason ? [reason] : [],
//       status: ["Pending"],
//       attachments: [filePath || ""],
//     });

//     await newLeave.save();
//     res
//       .status(200)
//       .json({ message: "Leave application submitted successfully." });
//   } catch (error) {
//     console.error("Error applying for leave:", error);
//     res.status(500).json({ message: "Server error while applying leave." });
//   }
// });

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

    // const pendingLeave = await Leave.findOne({ email, leaveType, status: "Pending" });

    // if (pendingLeave) {
    //   return res.status(400).json({ message: `You already have a pending leave request for ${leaveType}. Wait for approval before applying again.` });
    // }

    const leaveRecord = await Leave.findOne({ email, leaveType });

    if (leaveRecord) {
      for (let i = 0; i < leaveRecord.startDate.length; i++) {
        const existingStartDate = new Date(leaveRecord.startDate[i]);
        const existingEndDate = new Date(leaveRecord.endDate[i]);

        if (
          (formattedStartDate >= existingStartDate && formattedStartDate <= existingEndDate) ||
          (formattedEndDate >= existingStartDate && formattedEndDate <= existingEndDate) ||
          (formattedStartDate <= existingStartDate && formattedEndDate >= existingEndDate)
        ) {
          return res.status(400).json({ message: `You have already applied for leave from ${existingStartDate.toLocaleDateString("en-GB")} to ${existingEndDate.toLocaleDateString("en-GB")}.` });
        }
      }

      leaveRecord.startDate.push(formattedStartDate);
      leaveRecord.endDate.push(formattedEndDate);
      leaveRecord.status.push("Pending");
      leaveRecord.attachments.push(filePath ? filePath : "");
      leaveRecord.reason.push(reason || "");

      await leaveRecord.save();
      return res.status(200).json({ message: "Leave application submitted successfully" });
    } else {
      const newLeave = new Leave({
        email,
        empname,
        empid,
        managerEmail,
        applyDate: new Date(),
        leaveType,
        startDate: [formattedStartDate],
        endDate: [formattedEndDate],
        reason: reason ? [reason] : [],
        status: ["Pending"],
        attachments: [filePath ? filePath : ""],
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

// app.get("/leaverequests", async (req, res) => {
//   try {
//     const excludeEmail = req.query.excludeEmail; // Get manager's email from query parameters

//     if (!excludeEmail) {
//       return res.status(400).json({ message: "Manager email is required" });
//     }

//     const query = { managerEmail: excludeEmail }; // Fetch requests where managerEmail matches excludeEmail
//     console.log("Query:", query); // Debugging

//     const leaveRequests = await Leave.find(query); // Query the database correctly
//     res.json(leaveRequests);
//   } catch (error) {
//     console.error("Error fetching leave requests:", error);
//     res.status(500).send("Server error");
//   }
// });

app.get("/leaverequests", async (req, res) => {
  try {
    const { userRole, userEmail } = req.query; // Get role & email from query params

    let query = {}; // Default query for admin (fetch all)

    if (userRole === "Manager") {
      query.managerEmail = userEmail; // Filter requests for employees under this manager
    }

    console.log("Query:", query); // Debugging output

    const leaveRequests = await Leave.find(query);
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

// Get Monthly Leave Trends
app.get('/leave-trends/:email', async (req, res) => {
  const { email } = req.params;
  try {
    const trends = await Leave.aggregate([
      { $match: { email } },

      // 🔹 Unwind `startDate` & `duration` TOGETHER (Ensuring they match)
      { $unwind: { path: "$startDate", preserveNullAndEmptyArrays: true } },
      { $unwind: { path: "$duration", preserveNullAndEmptyArrays: true } },

      // 🔹 Extract Year & Month from `startDate`
      {
        $addFields: {
          year: { $year: "$startDate" },
          month: { $month: "$startDate" }
        }
      },

      // 🔹 Group by Year & Month, Sum up `duration`
      {
        $group: {
          _id: { year: "$year", month: "$month" },
          totalLeaves: { $sum: { $ifNull: ["$duration", 0] } }  // Ensure `duration` is not null
        }
      },

      // 🔹 Sort by Year & Month
      { $sort: { "_id.year": 1, "_id.month": 1 } }
    ]);

    console.log("📌 Leave Trends Result:", trends);
    res.json(trends);
  } catch (err) {
    console.error("❌ Error:", err);
    res.status(500).json({ error: err.message });
  }
});




// Get Leave Type Distribution
app.get('/leave-types/:email', async (req, res) => {
  const { email } = req.params;
  try {
    const types = await Leave.aggregate([
      { $match: { email } },
      { $group: { _id: "$leaveType", count: { $sum: { $size: "$startDate" } } } } // Count total leave applications
    ]);
    res.json(types);
  } catch (err) {
    res.status(500).json({ error: err.message });
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




