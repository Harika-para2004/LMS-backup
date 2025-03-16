const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const leavepolicyRoutes = require("./routes/LeavePolicyRoutes");
const projectRoutes=require("./routes/projectRoutes");
const Leave = require("./models/Leave");
const User = require("./models/User");
const bcrypt = require("bcrypt");
const Holiday = require("./models/Holiday");
const multer = require("multer");
const path = require("path");
const LeavePolicy = require("./models/LeavePolicy");
const leavereports = require("./routes/overlaproutes");
const excelJS = require("exceljs");
const pdfkit = require("pdfkit");
const fs = require("fs");
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const exceluploads = require("./routes/exceluploads")
const forgotPasswordRoutes = require("./routes/ForgotPasswordRoutes");
dotenv.config();

const app = express();
const port = process.env.PORT || 5001;

app.use(cors());
app.use(express.json({ limit: "10mb" }));  // Increase JSON body size limit
/* mongodb+srv://lahiri:sai*123@cluster0.r7eze9l.mongodb.net/*/
// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err.message));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/leave-policies", leavepolicyRoutes);
app.use("/api",projectRoutes)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/excel",exceluploads);
app.use("/admin", adminRoutes);
app.use("/api/employees", require("./routes/empUnderMang"));
app.use("/data",leavereports);
app.use("/api/auth/forgot", forgotPasswordRoutes);
const formatCase = (text) => {
  return text.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
};
app.get("/managers-list", async (req, res) => {
  try {
    const managers = await User.find({ role: "Manager" }, { empname: 1, empid: 1, email: 1,project:1,gender:1,isActive:1, _id: 0 }); 
    res.status(200).json(managers);
  } catch (error) {
    res.status(500).json({ message: "Error fetching managers", error: error.message });
  }
});

// app.post("/apply-leave", upload.single("attachment"), async (req, res) => {
//   const { email } = req.query;
//   const { empname, empid, leaveType, startDate, endDate, reason, managerEmail } = req.body;
//   const filePath = req.file ? req.file.path : null;

//   try {
//     const formattedStartDate = new Date(startDate);
//     const formattedEndDate = new Date(endDate);

//     if (!leaveType || !startDate || !endDate) {
//       return res.status(400).json({ message: "All fields (Leave Type, Start Date, End Date) are required." });
//     }

//     if (formattedEndDate < formattedStartDate) {
//       return res.status(400).json({ message: "End Date cannot be before Start Date." });
//     }

//     // Fetch all leave records for the user
//     let existingLeaves = await Leave.find({ email });

//     for (let leave of existingLeaves) {
//       for (let i = 0; i < leave.startDate.length; i++) {
//         const existingStartDate = new Date(leave.startDate[i]);
//         const existingEndDate = new Date(leave.endDate[i]);

//         if (
//           (formattedStartDate >= existingStartDate && formattedStartDate <= existingEndDate) ||
//           (formattedEndDate >= existingStartDate && formattedEndDate <= existingEndDate) ||
//           (formattedStartDate <= existingStartDate && formattedEndDate >= existingEndDate)
//         ) {
//           return res.status(400).json({
//             message: `You have already applied for leave from ${existingStartDate.toLocaleDateString("en-GB")} to ${existingEndDate.toLocaleDateString("en-GB")}.`
//           });
//         }
//       }
//     }

//     const startMonth = formattedStartDate.getMonth() + 1;
//     const startYear = formattedStartDate.getFullYear();

//     let leaveRecord = await Leave.findOne({ email, leaveType });

//     if (leaveRecord) {
//       leaveRecord.startDate.push(formattedStartDate);
//       leaveRecord.endDate.push(formattedEndDate);
//       leaveRecord.applyDate.push(new Date());
//       leaveRecord.status.push("Pending");
//       leaveRecord.attachments.push(filePath || "");
//       leaveRecord.reason.push(reason || "");
//       leaveRecord.month.push(startMonth);
//       leaveRecord.year.push(startYear);

//       await leaveRecord.save();
//       return res.status(200).json({ message: "Leave application submitted successfully" });
//     } else {
//       const newLeave = new Leave({
//         email,
//         empname,
//         empid,
//         managerEmail,
//         applyDate: [new Date()],
//         leaveType,
//         startDate: [formattedStartDate],
//         endDate: [formattedEndDate],
//         reason: reason ? [reason] : [],
//         status: ["Pending"],
//         attachments: [filePath || ""],
//         month: [startMonth],
//         year: [startYear],
//       });

//       await newLeave.save();
//       return res.status(200).json({ message: "Leave application submitted successfully" });
//     }
//   } catch (error) {
//     console.error("Error applying for leave:", error);
//     res.status(500).json({ message: "Server error while applying leave." });
//   }
// });
const getMandatoryHolidays = async () => {
  try {
    const mandatoryHolidays = await Holiday.find({ type: "Mandatory" }).select("date");
    return mandatoryHolidays.map((holiday) => holiday.date);
  } catch (error) {
    console.error("Error fetching mandatory holidays:", error);
    return [];
  }
};
const isMandatoryHoliday = async (date) => {
  const mandatoryHolidays = await getMandatoryHolidays();

  // Convert date to "DD-MMM-YYYY" format
  const formatDate = (dateObj) => {
    const day = dateObj.getUTCDate().toString().padStart(2, "0");
    const month = dateObj.toLocaleString("en-US", { month: "short", timeZone: "UTC" });
    const year = dateObj.getUTCFullYear();
    return `${day}-${month}-${year}`;
  };

  const formattedDate = formatDate(new Date(date));
  return mandatoryHolidays.includes(formattedDate);
};

app.post("/apply-leave", upload.single("attachment"), async (req, res) => {
  const { email } = req.query;
  const { empname, empid, leaveType, startDate, endDate, reason, managerEmail,prevStart, prevEnd, prevId } = req.body;
  const filePath = req.file ? req.file.buffer.toString("base64") : null; // Convert file to Base64
  try {
    let formattedStartDate = new Date(startDate);
    let formattedEndDate = new Date(endDate);

    if (!leaveType || !startDate || !endDate) {
      return res.status(400).json({ message: "All fields (Leave Type, Start Date, End Date) are required." });
    }

    if (formattedEndDate < formattedStartDate) {
      return res.status(400).json({ message: "End Date cannot be before Start Date." });
    }

    formattedStartDate = new Date(Date.UTC(
      formattedStartDate.getFullYear(),
      formattedStartDate.getMonth(),
      formattedStartDate.getDate(),
      0, 0, 0
    ));

    formattedEndDate = new Date(Date.UTC(
      formattedEndDate.getFullYear(),
      formattedEndDate.getMonth(),
      formattedEndDate.getDate(),
      23, 59, 59
    ));

    const startYear = formattedStartDate.getFullYear();
    const endYear = formattedEndDate.getFullYear();
    let existingLeaves = await Leave.find({ email});

    // for (let leave of existingLeaves) {
    //   for (let i = 0; i < leave.startDate.length; i++) {
    //     if (leave.status[i] === "Rejected") continue;

    //     const existingStartDate = new Date(leave.startDate[i]);
    //     const existingEndDate = new Date(leave.endDate[i]);
    
    //     // Convert to dd/mm/yyyy format
    //     const formatDate = (date) => {
    //       const day = date.getUTCDate().toString().padStart(2, "0");
    //       const month = (date.getUTCMonth() + 1).toString().padStart(2, "0"); // Months are 0-based
    //       const year = date.getUTCFullYear();
    //       return `${day}/${month}/${year}`;
    //     };
    
    //     const existingStartDateStr = formatDate(existingStartDate);
    //     const existingEndDateStr = formatDate(existingEndDate);
    
    //     if (
    //       (formattedStartDate >= existingStartDate && formattedStartDate <= existingEndDate) ||
    //       (formattedEndDate >= existingStartDate && formattedEndDate <= existingEndDate) ||
    //       (formattedStartDate <= existingStartDate && formattedEndDate >= existingEndDate)
    //     ) {
    //       return res.status(400).json({
    //         message: `You have already applied for leave from ${existingStartDateStr} to ${existingEndDateStr}.`
    //       });
    //     }
    //   }
    // }
    for (let leave of existingLeaves) {
      if (leave._id.toString() === prevId) {
        const ignoreIndex = leave.startDate.findIndex(date => 
          new Date(date).toISOString() === new Date(prevStart).toISOString()
        );
    
        for (let i = 0; i < leave.startDate.length; i++) {
          if (i === ignoreIndex) continue;
    
          let existingStartDate = new Date(leave.startDate[i]);
          let existingEndDate = new Date(leave.endDate[i]);
          const endDate = new Date(existingEndDate);
          endDate.setHours(0, 0, 0, 0);
          if (
            (formattedStartDate >= existingStartDate && formattedStartDate <= existingEndDate) ||
            (formattedEndDate >= existingStartDate && formattedEndDate <= existingEndDate) ||
            (formattedStartDate <= existingStartDate && formattedEndDate >= existingEndDate)
          ) {
            return res.status(400).json({
              message : `You have already applied for leave from ${existingStartDate.getDate().toString().padStart(2, '0')}/${(existingStartDate.getMonth() + 1).toString().padStart(2, '0')}/${existingStartDate.getFullYear()} to ${(existingEndDate.getDate() - 1).toString().padStart(2, '0')}/${(existingEndDate.getMonth() + 1).toString().padStart(2, '0')}/${existingEndDate.getFullYear()}.`
            });
          }
        }
      } else {
        for (let i = 0; i < leave.startDate.length; i++) {
          let existingStartDate = new Date(leave.startDate[i]);
          let existingEndDate = new Date(leave.endDate[i]);
    
          if (
            (formattedStartDate >= existingStartDate && formattedStartDate <= existingEndDate) ||
            (formattedEndDate >= existingStartDate && formattedEndDate <= existingEndDate) ||
            (formattedStartDate <= existingStartDate && formattedEndDate >= existingEndDate)
          ) {
            return res.status(400).json({
              message : `You have already applied for leave from ${existingStartDate.getDate().toString().padStart(2, '0')}/${(existingStartDate.getMonth() + 1).toString().padStart(2, '0')}/${existingStartDate.getFullYear()} to ${(existingEndDate.getDate() - 1).toString().padStart(2, '0')}/${(existingEndDate.getMonth() + 1).toString().padStart(2, '0')}/${existingEndDate.getFullYear()}.`
            });
          }
        }
      }
    }
    
    
    let defaultTotalLeaves = 0; // Adjust as per policy

    if (startYear === endYear) {
      console.log("start",startYear)
      console.log("end",endYear)
      let leaveRecord = await Leave.findOne({
        email,
        leaveType,
        year: { $elemMatch: { $elemMatch: { $eq: Number(startYear) } } }  // Convert to number
      });
      
            console.log(leaveRecord)
      let durationDays = Math.ceil((formattedEndDate - formattedStartDate) / (1000 * 60 * 60 * 24)) + 1;

      if (!leaveRecord) {
        leaveRecord = new Leave({
          email,
          empname,
          empid,
          managerEmail,
          leaveType,
          totalLeaves: defaultTotalLeaves,
          usedLeaves: 0,  // ✅ Keep usedLeaves as 0 initially
          availableLeaves: defaultTotalLeaves,
          applyDate: [],
          startDate: [],
          endDate: [],
          reason: [],
          status: [],
          attachments: [],
          month: [],
          year: [],
          duration: []
        });
      }

      leaveRecord.startDate.push(formattedStartDate);
      leaveRecord.endDate.push(formattedEndDate);
      leaveRecord.applyDate.push(new Date());
      leaveRecord.status.push("Pending");  // ✅ Initially Pending
      leaveRecord.attachments.push(filePath || "");
      leaveRecord.reason.push(reason || "N/A");
      leaveRecord.month.push([formattedStartDate.getMonth() + 1]);
      leaveRecord.year.push([startYear]);
      leaveRecord.duration.push([durationDays]);

      leaveRecord.availableLeaves = leaveRecord.totalLeaves; // ✅ Leave is still pending, don't deduct from available

      await leaveRecord.save();
    } else {
      let currentStartDate = formattedStartDate;

      for (let year = startYear; year <= endYear; year++) {
        let yearStart = new Date(Date.UTC(year, 0, 1));
        let yearEnd = new Date(Date.UTC(year, 11, 31, 23, 59, 59));

        let leaveStart = year === startYear ? currentStartDate : yearStart;
        console.log("leaveStart",leaveStart)
        while (await isMandatoryHoliday(leaveStart)) {
          leaveStart.setUTCDate(leaveStart.getUTCDate() + 1);
        }
        
        let leaveEnd = year === endYear ? formattedEndDate : yearEnd;
        let days = Math.ceil((leaveEnd - leaveStart) / (1000 * 60 * 60 * 24)) + 1;

        let leaveRecord = await Leave.findOne({
          email,
          leaveType,
          year: { $elemMatch: { $elemMatch: { $eq: Number(year) } } }  // Convert to number
        });
        if (!leaveRecord) {
          leaveRecord = new Leave({
            email,
            empname,
            empid,
            managerEmail,
            leaveType,
            totalLeaves: defaultTotalLeaves,
            usedLeaves: 0,  // ✅ Keep usedLeaves as 0 initially
            availableLeaves: defaultTotalLeaves,
            applyDate: [],
            startDate: [],
            endDate: [],
            reason: [],
            status: [],
            attachments: [],
            month: [],
            year: [],
            duration: []
          });
        }

        leaveRecord.startDate.push(leaveStart);
        leaveRecord.endDate.push(leaveEnd);
        leaveRecord.applyDate.push(new Date());
        leaveRecord.status.push("Pending");
        leaveRecord.attachments.push(filePath || "");
        leaveRecord.reason.push(reason || "N/A");
        leaveRecord.month.push([leaveStart.getMonth() + 1]);
        leaveRecord.year.push([year]);
        leaveRecord.duration.push([days]);

        leaveRecord.availableLeaves = leaveRecord.totalLeaves; // ✅ Do not deduct from available leaves initially

        await leaveRecord.save();
        currentStartDate = new Date(Date.UTC(year + 1, 0, 1));
      }
    }

    return res.status(200).json({ message: "Leave application submitted successfully" });

  } catch (error) {
    console.error("Error applying for leave:", error);
    res.status(500).json({ message: "Server error while applying leave." });
  }
});

app.get("/leave-history", async (req, res) => {
  const { email, year } = req.query;
  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  try {
    let leaveHistory = await Leave.find({ email });

    let formattedHistory = leaveHistory.flatMap((leave) => {
      return leave.startDate.map((start, index) => ({
        _id: leave._id,
        leaveType: leave.leaveType,
        applyDate: leave.applyDate[index]
          ? new Date(leave.applyDate[index]).toISOString().split("T")[0]
          : null,
        startDate: start
          ? new Date(start).toISOString().split("T")[0]
          : null,
        endDate: leave.endDate[index]
          ? new Date(leave.endDate[index]).toISOString().split("T")[0]
          : null,
        reason: leave.reason[index] || "N/A",
        rejectionComment: leave.rejectionComment[index] || "N/A",

        status: leave.status[index] || "Pending",
        duration: Array.isArray(leave.duration[index])
          ? leave.duration[index].reduce((sum, num) => sum + num, 0)
          : leave.duration[index] || 0,
        year: leave.year[index] ? leave.year[index][0] : null, // Extract the correct year
        month: leave.month[index] ? leave.month[index][0] : null,
        attachments: leave.attachments[index] || "",
      }));
    });

    // Apply year filter correctly
    if (year) {
      formattedHistory = formattedHistory.filter((leave) => leave.year === Number(year));
    }

    res.status(200).json(formattedHistory);
  } catch (error) {
    console.error("Error fetching leave history:", error);
    res.status(500).json({ message: "An error occurred" });
  }
});
// app.get("/leavesummary", async (req, res) => {
//   const { email } = req.query; // Get the email from the query parameters
//   if (!email) {
//     return res.status(400).json({ message: "Email is required" });
//   }

//   const currentYear = new Date().getFullYear(); // Get the current year

//   try {
//     const leaveData = await Leave.find({
//       email,
//       year: { $in: [[currentYear]] } // Match the year field
//     });

//     if (!leaveData || leaveData.length === 0) {
//       return res
//         .status(404)
//         .json({ message: "No leave records found for the specified email in the current year" });
//     }

//     res.json(leaveData);
//   } catch (err) {
//     console.error("Error fetching leave summary:", err);
//     res.status(500).send("Server Error");
//   }
// });

app.get("/leavesummary", async (req, res) => {
  const { email } = req.query;
  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  const currentYear = new Date().getFullYear();

  try {
    // Fetch leave records for the user
    const leaveData = await Leave.find({
      email,
      year: { $in: [[currentYear]] }, // Fetches leave records for the current year
    });

    if (!leaveData || leaveData.length === 0) {
      return res.status(404).json({
        message: "No leave records found for the specified email in the current year",
      });
    }

    // Fetch all leave policies (Not present in the second version)
    const leavePolicies = await LeavePolicy.find();
    
    // Create a map of leave policies for quick lookup
    const policyMap = new Map(leavePolicies.map(policy => [policy.leaveType, policy.maxAllowedLeaves || 0]));

    // Update totalLeaves and availableLeaves dynamically (Not done in the second version)
    const updatedLeaveData = leaveData.map(leave => {
      const maxLeaves = policyMap.get(leave.leaveType) || 0; // Get max allowed leaves from policy
      const availableLeaves = Math.max(0, maxLeaves - leave.usedLeaves); // Calculate available leaves

      return {
        ...leave.toObject(),
        totalLeaves: maxLeaves, // Adding dynamically calculated total leaves
        availableLeaves: availableLeaves, // Adding dynamically calculated available leaves
      };
    });

    res.json(updatedLeaveData); // Returns the updated leave data with policy adjustments
  } catch (err) {
    console.error("Error fetching leave summary:", err);
    res.status(500).send("Server Error");
  }
});


app.get("/leaverequests", async (req, res) => {
  try {
    const { userRole, userEmail, year } = req.query;

    let query = {};
    
    // Filter based on manager role
    if (userRole === "Manager") {
      query.managerEmail = userEmail;
    }

    // Correct filtering for an array of dates (startDate)
    if (year) {
      query.startDate = {
        $elemMatch: {
          $gte: new Date(`${year}-01-01T00:00:00.000Z`),
          $lt: new Date(`${year}-12-31T23:59:59.999Z`)
        }
      };
    }

    // Fetch leave requests from MongoDB
    const leaveRequests = await Leave.find(query);

    // Process the fetched data
    let processedLeaves = leaveRequests.map((leave) => ({
      ...leave._doc,
      endDate: Array.isArray(leave.endDate)
        ? leave.endDate.map((date) =>
            new Date(date).toISOString().split("T")[0]
          )
        : [],
      duration: Array.isArray(leave.duration)
        ? leave.duration.map((entry) =>
            Array.isArray(entry)
              ? entry.reduce((sum, num) => sum + num, 0)
              : entry || 0
          )
        : []
    }));

    // Ensure the year filter is correctly applied if some records slip through
    if (year) {
      processedLeaves = processedLeaves.filter((leave) =>
        Array.isArray(leave.startDate) &&
        leave.startDate.some(
          (date) => new Date(date).getFullYear() === Number(year)
        )
      );
    }

   // console.log("Final Processed Data:", processedLeaves); // Debugging log

    res.json(processedLeaves);
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
    const { year } = req.query;

    if (!year || isNaN(year)) {
      return res.status(400).json({ message: "Valid year is required!" });
    }

    console.log("Fetching holidays for year:", year);

    const holidays = await Holiday.find({
      date: { $regex: `-${year}$`, $options: "i" },
    });

    console.log("Found holidays:", holidays.length);
    
    res.json(holidays);
  } catch (err) {
    console.error("Error fetching holidays:", err);
    res.status(500).json({ message: "Server Error", error: err.message });
  }
});



app.get("/employee-list", async (req, res) => {
  try {
   
    const employees = await User.find().lean(); // Use .lean() to return plain objects

    // Create a map of managers for quick lookup
    const managerMap = {};
    employees.forEach(emp => {
      if (emp.role === "Manager") {
        managerMap[emp.email] = { name: emp.empname, id: emp.empid };
      }
    });

    // Add manager details to employees
    const updatedEmployees = employees.map(emp => ({
      ...emp, // Now it's always a plain object
      managerName: emp.managerEmail && managerMap[emp.managerEmail] ? managerMap[emp.managerEmail].name : "-",
    }));

    res.json(updatedEmployees);
  } catch (err) {
    console.error("Error fetching employees:", err);
    res.status(500).json({ message: "Server Error", error: err.message });
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

app.put("/holidays/:id", async (req, res) => {
  console.log("Received ID:", req.params.id);
  console.log("Received Data:", req.body);

  const { date, name, type } = req.body;

  try {
    if (!date || !name || !type) {
      console.log("Missing fields!");
      return res.status(400).json({ message: "All fields are required!" });
    }

    const holidayDate = new Date(date);
    const dayOfWeek = holidayDate.toLocaleString("en-us", { weekday: "long" });

    // ✅ Check if another holiday already has BOTH same date AND same name
    const existingHoliday = await Holiday.findOne({
      _id: { $ne: req.params.id }, // Exclude the current holiday from search
      date: date, // Check for same date
      name: name, // Check for same name
    });

    if (existingHoliday) {
      console.log("Duplicate holiday found!");
      return res.status(400).json({
        message: `A holiday with the same date (${date}) and name (${name}) already exists!`,
      });
    }

    // ✅ Update the holiday if no duplicate is found
    const updatedHoliday = await Holiday.findByIdAndUpdate(
      req.params.id,
      { date, day: dayOfWeek, name, type },
      { new: true }
    );

    if (!updatedHoliday) {
      console.log("Holiday not found!");
      return res.status(404).json({ message: "Holiday not found" });
    }

    console.log("Updated Holiday:", updatedHoliday);
    res.json(updatedHoliday);
  } catch (err) {
    console.error("Error updating holiday:", err.message);
    res.status(400).json({ message: "Error updating holiday", error: err.message });
  }
});


app.put("/updateEmployeeList/:id", async (req, res) => {
  const { empid, empname, email, project, role, managerEmail } = req.body;

  try {
    if (!empid || !empname || !email) {
      return res.status(400).json({ message: "All fields are required!" });
    }

    // ✅ Fetch existing employee data
    const existingEmployee = await User.findById(req.params.id);

    if (!existingEmployee) {
      return res.status(404).json({ message: "Employee not found" });
    }
   
    
    let assignedProject = existingEmployee.project;
   // ✅ Check if the project is already assigned to another manager
   if (role === "Manager") {
    const otherManager = await User.findOne({
      project: project,
      role: "Manager",
      isActive:true,
      _id: { $ne: req.params.id }, // Exclude current employee
    });

    if (otherManager) {
      return res.status(400).json({
        message: `Project is already assigned to another manager (${otherManager.empname})!`,
      });
    }
  }
    // ✅ Handle Project Assignment When Role Changes to Employee
    if (role === "Employee" && existingEmployee.role !== "Employee") {
      if (managerEmail) {
        const manager = await User.findOne({ email: managerEmail });

        if (manager && manager.project) {
          assignedProject = manager.project;
        }
      }
    }

    // ✅ Handle Project Assignment When Role Changes to Manager
    if (role === "Manager") {
      assignedProject = project;

      // ✅ Check if this employee was under a previous manager for the same project
      const previousEmployees = await User.find({ project, role: "Employee" });

      if (previousEmployees.length > 0) {
        // ✅ Update all employees with the same project to have this new manager
        await User.updateMany(
          { project: project, role: "Employee" },
          { $set: { managerEmail: email } }
        );
      }
    }

    // ✅ Handle Project Transfer if Manager Changes
    if (role === "Employee" && existingEmployee.managerEmail !== managerEmail) {
      const newManager = await User.findOne({ email: managerEmail });

      if (newManager && newManager.project) {
        assignedProject = newManager.project;
      }
    }


    // ✅ Handle Project Transfer if Manager Changes
    if (role === "Employee" && existingEmployee.managerEmail !== managerEmail) {
      const newManager = await User.findOne({ email: managerEmail });

      if (newManager && newManager.project) {
        assignedProject = newManager.project;
      }
    }

    // ✅ Handle Project Transfer if Manager is Demoted
    if (existingEmployee.role === "Manager" && role === "Employee") {
      const seniorManager = await User.findOne({ email: existingEmployee.managerEmail });

      if (seniorManager) {
        const seniorProject = seniorManager.project;
        assignedProject = seniorProject;
      }
    }

    // ✅ Automatically update all Employees if Manager's Project Changes
    if (existingEmployee.role === "Manager" && project !== existingEmployee.project) {
      // ✅ Update Manager's project
      assignedProject = project;

      // ✅ Now update all Employees having managerEmail = Manager's email
      await User.updateMany(
        { managerEmail: email },
        { $set: { project: project } }
      );
    }

    // ✅ Prepare the update payload
    const updatePayload = {
      empid,
      empname,
      email,
      role,
      managerEmail: role === "Manager" ? "" : managerEmail,
      project: assignedProject,
    };

    // ✅ Update Employee (Manager or Employee)
    const updatedEmployee = await User.findByIdAndUpdate(
      req.params.id,
      updatePayload,
      { new: true }
    );

    res.status(200).json(updatedEmployee);
  } catch (err) {
    res.status(400).json({
      message: "Error updating employee",
      error: err.message,
    });
  }
});


app.get("/getManagers", async (req, res) => {
  try {
    const managers = await User.find({ role: "Manager", isActive: true }); // ✅ Fetch only active managers
    res.status(200).json(managers);
  } catch (err) {
    res.status(500).json({ message: "Error fetching managers", error: err.message });
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

app.put("/employee-del/:id", async (req, res) => {
  try {
    const emp = await User.findById(req.params.id);

    if (!emp) {
      return res.status(404).json({ message: "Employee not found" });
    }

    // Update isActive to false instead of deleting
    await User.findByIdAndUpdate(req.params.id, {
      isActive: false,
      managerEmail: "dummy@gmail.com",
    });

    if (emp.role === "Manager") {
      await User.updateMany(
        { managerEmail: emp.email }, 
        { $set: { managerEmail: "dummy@gmail.com" }} 
      );
    }

    
    res.json({ message: "Employee deactivated successfully" });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error deactivating employee", error: err.message });
  }
});


// Start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
app.get("/reports", async (req, res) => {
  try {
    const { project, search, email, year } = req.query;
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

    // Fetch leave data for each employee (only approved leaves in selected year)
    const reports = await Promise.all(
      employees.map(async (employee) => {
        const leaves = await Leave.find({ email: employee.email });

        // Filter only approved leaves within the selected year
        const approvedLeaves = leaves.flatMap((leave) =>
          leave.startDate
            .map((start, index) => ({
              leaveType: leave.leaveType,
              startDate: new Date(start).toISOString().split("T")[0],
              endDate: leave.endDate[index]
              ? new Date(new Date(leave.endDate[index]).setDate(new Date(leave.endDate[index]).getDate() - 1))
              : "N/A",  
              status: leave.status[index] || "Pending",
              reason: leave.reason[index] || "No reason provided",
              duration: Array.isArray(leave.duration[index]) 
              ? leave.duration[index].reduce((sum, num) => sum + num, 0) 
              : "N/A",
                        attachments: leave.attachments[index] || [],
            }))
            .filter(
              (leave) =>
                leave.status === "Approved" &&
                new Date(leave.startDate).getFullYear() === parseInt(year) // ✅ Filter by year
            )
        );
      //  console.log(approvedLeaves);

        // Only return employees who have at least one approved leave in the selected year
        if (approvedLeaves.length > 0) {
          return {
            empid: employee.empid,
            empname: employee.empname,
            project: employee.project,
            email: employee.email,
            managerEmail: employee.managerEmail,
            role: employee.role,
            leaves: approvedLeaves,
          };
        }

        return null; // Ignore employees with no approved leaves in the selected year
      })
    );

   // console.log(reports);

    // Remove null values (employees with no approved leaves)
    const filteredReports = reports.filter((report) => report !== null);

    res.status(200).json(filteredReports);
  } catch (error) {
    console.error("Error fetching reports:", error);
    res.status(500).json({ message: "Server Error" });
  }
});

app.get("/reports-admin", async (req, res) => {
  try {
    const { project, search, year } = req.query;
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

    // Fetch leave data for each employee (only approved leaves in selected year)
    const reports = await Promise.all(
      employees.map(async (employee) => {
        const leaves = await Leave.find({ email: employee.email });
        leaves.flatMap((leave) => console.log(leave.startDate));


        // Filter only approved leaves within the selected year
        const approvedLeaves = leaves.flatMap((leave) =>
        // console.log(leave);
          leave.startDate
            .map((start, index) => ({
              leaveType: leave.leaveType,
              startDate: new Date(start).toISOString().split("T")[0],
              endDate: leave.endDate[index]
              ? new Date(new Date(leave.endDate[index]).setDate(new Date(leave.endDate[index]).getDate() - 1))
              : "N/A",          
              status: leave.status[index] || "Pending",
              reason: leave.reason[index] || "No reason provided",
              duration: Array.isArray(leave.duration[index]) 
              ? leave.duration[index].reduce((sum, num) => sum + num, 0) 
              : "N/A"
,                        attachments: leave.attachments[index] || [],
            }))
            .filter(
              (leave) =>
                leave.status === "Approved" &&
                new Date(leave.startDate).getFullYear() === parseInt(year) // ✅ Filter by year
            )
        );

        // console.log(approvedLeaves);


        // Only return employees who have at least one approved leave in the selected year
        if (approvedLeaves.length > 0) {
          return {
            empid:employee.empid,
            role:employee.role,
            empname: employee.empname,
            project: employee.project,
            email: employee.email,
            leaves: approvedLeaves,
          };
        }

        return null; // Ignore employees with no approved leaves in the selected year
      })
    );
    

    // Remove null values (employees with no approved leaves)
    const filteredReports = reports.filter((report) => report !== null);

    res.status(200).json(filteredReports);
  } catch (error) {
    console.error("Error fetching admin reports:", error);
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
app.get("/reports/export-excel", async (req, res) => {
  try {
    let { project, reports,year } = req.query;
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
      { header: "Employee ID", key: "empid", width: 10 },
      { header: "Name", key: "empname", width: 25 },
      { header: "Email", key: "email", width: 30 },
      { header: "Project", key: "project", width: 25 },
      { header: "Leave Type", key: "leaveType", width: 20 },
      { header: "From", key: "startDate", width: 15 },
      { header: "To", key: "endDate", width: 15 },
      { header: "No Of Days", key: "duration", width: 15 },
    ];

    let allReports = [];

    for (const empemail of employees) {
      const empl = await User.find({ email: empemail });
      for (const emp of empl) {
        const leaves = await Leave.find({ 
          email: empemail, 
          year: { $elemMatch: { $elemMatch: { $eq: Number(year) } } }  // ✅ Double `$elemMatch` for deeply nested arrays
        });
        
        if (leaves.length > 0) {
          leaves.forEach((leave, index) => {
            leave.startDate.forEach((start, i) => {
              if (leave.status[i] === "Approved") {
                const correctEndDate = new Date(leave.endDate[i]);
                correctEndDate.setDate(correctEndDate.getDate() - 1);
                const totalDuration = Array.isArray(leave.duration[i])
  ? leave.duration[i].flat().reduce((sum, num) => sum + num, 0)
  : 0;

              allReports.push({
                empid: emp.empid,
                empname: formatName(emp.empname),
                email: emp.email || "N/A",
                project: formatName(emp.project) || "N/A",   
               leaveType: formatName(leave.leaveType),
                startDate: new Date(start), // Convert to Date for sorting
                endDate: formatDate(correctEndDate),
                duration:totalDuration                    });
           } });
          });
        } else {
          allReports.push({
            empid: emp.empid,
            empname: formatName(emp.empname),
            email: emp.email || "N/A",
            project: formatName(emp.project) || "N/A",
            leaveType: "N/A",
            startDate: new Date(0), // Default earliest date for sorting
            endDate: "N/A",
            duration: "No Leaves",
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
function subtractOneDay(date) {
  date.setDate(date.getDate() - 1);
  return date;
}
app.post("/reports/export-excel", async (req, res) => {
  try {
    let { project, reports, year } = req.body;
    let query = {};
    if (project) query.project = project;

    if (!Array.isArray(reports)) {
      return res.status(400).json({ message: "Invalid reports format" });
    }

    const employees = reports
      .filter((report) => report.email !== "admin@gmail.com")
      .map((report) => report.email);

    const workbook = new excelJS.Workbook();
    const worksheet = workbook.addWorksheet("Reports");

    worksheet.columns = [
      { header: "Employee ID", key: "empid", width: 15 },
      { header: "Name", key: "empname", width: 25 },
      { header: "Email", key: "email", width: 30 },
      { header: "Project", key: "project", width: 25 },
      { header: "Leave Type", key: "leaveType", width: 20 },
      { header: "From", key: "startDate", width: 15 },
      { header: "To", key: "endDate", width: 15 },
      { header: "No Of Days", key: "duration", width: 15 },
    ];

    let allReports = [];

    for (const empemail of employees) {
      const empl = await User.find({ email: empemail });
      for (const emp of empl) {
        const leaves = await Leave.find({
          email: empemail,
          year: { $elemMatch: { $elemMatch: { $eq: Number(year) } } },
        });

        let empLeaves = [];

        if (leaves.length > 0) {
          leaves.forEach((leave) => {
            leave.startDate.forEach((start, i) => {
              if (leave.status[i] === "Approved") {
               
                const totalDuration = Array.isArray(leave.duration[i])
  ? leave.duration[i].flat().reduce((sum, num) => sum + num, 0)
  : 0;
                empLeaves.push({
                  empid: emp.empid,
                  empname: emp.empname,
                  email: emp.email || "N/A",
                  project: formatName(emp.project) || "N/A",
                  leaveType: leave.leaveType,
                  startDate: new Date(start),
                  endDate: subtractOneDay(new Date(leave.endDate[i])), 
                  duration:totalDuration                });
              }
            });
          });
        }

        // ✅ Sort leaves **within** the employee based on startDate
        empLeaves.sort((a, b) => a.startDate - b.startDate);

        // ✅ Push sorted leaves to allReports
        allReports.push(...empLeaves);
      }
    }

    // Convert dates to `dd/mm/yyyy` before writing to Excel
// ✅ Sort employees alphabetically and their leaves by startDate
allReports.sort((a, b) => {
  if (a.empname.toLowerCase() !== b.empname.toLowerCase()) {
    return a.empname.toLowerCase().localeCompare(b.empname.toLowerCase());
  }
  return a.startDate - b.startDate;
});

// ✅ Convert dates to `dd/mm/yyyy` before writing to Excel
allReports.forEach((report) => {
  worksheet.addRow({
    ...report,
    startDate: formatDate(report.startDate),
    endDate: formatDate(report.endDate),
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




const PDFDocument = require("pdfkit");
const moment = require("moment");
const { appendFile } = require("fs/promises");

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
app.get("/admin-leave-trends/:year", async (req, res) => {
  try {
    
    const leaves = await Leave.aggregate([
      { $match: { year: { $in: [parseInt(year)] } } },
      { $unwind: "$month" },
      { $group: { _id: "$month", count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    
    res.json({
      months: leaves.map(l => l._id),
      leaveCounts: leaves.map(l => l.count)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//Employee
app.get("/leave-trends/:email/:year", async (req, res) => {
  try {
    const { email, year } = req.params;
    const numericYear = parseInt(year);

    // Fetch only relevant leave records for the given email
    const leaves = await Leave.find({ email });

    if (!leaves.length) {
      return res.status(404).json({ message: "No leave records found." });
    }

    // Initialize monthly leave data
    const leaveTrends = Array(12).fill(null).map((_, idx) => ({ month: idx + 1 }));

    leaves.forEach((leave) => {
      leave.year.forEach((yearArray, index) => {
        yearArray.forEach((y, i) => {
          if (y === numericYear && leave.status[index] === "Approved") {  // Check if status is Approved
            const monthIndex = leave.month[index][i] - 1;
            if (monthIndex >= 0 && monthIndex < 12) {
              const leaveType = leave.leaveType;

              if (!leaveTrends[monthIndex][leaveType]) {
                leaveTrends[monthIndex][leaveType] = 0;
              }

              leaveTrends[monthIndex][leaveType] += leave.duration[index][i] || 0;
            }
          }
        });
      });
    });

   // console.log("Leave Trends Data:", JSON.stringify(leaveTrends, null, 2)); // Log data before sending
    res.json(leaveTrends);
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

app.get('/leave-type-status/:email/:year', async (req, res) => {
  const { email, year } = req.params;
  const requestedYear = parseInt(year);

  try {
    const leaveStats = await Leave.find({ email });

    const formattedResponse = {};

    leaveStats.forEach(({ leaveType, status, year: leaveYears, duration }) => {
      let isYearPresent = false; // ✅ Track if the leave type exists in the requested year

      leaveYears.forEach((yearGroup, i) => {
        if (Array.isArray(yearGroup) && yearGroup.includes(requestedYear)) {
          if (!formattedResponse[leaveType]) {
            formattedResponse[leaveType] = { Pending: 0, Approved: 0, Rejected: 0 };
          }

          // ✅ Sum all elements in duration[i]
          const totalDuration = duration[i] ? duration[i].reduce((sum, val) => sum + val, 0) : 0;

          formattedResponse[leaveType][status[i]] += totalDuration;
          isYearPresent = true; // ✅ Mark that this leave type exists in the requested year
        }
      });

      // ✅ If the leave type exists in the requested year, do NOT remove it
      if (isYearPresent) {
        formattedResponse[leaveType] = formattedResponse[leaveType];
      }
    });

    res.json(Object.entries(formattedResponse).map(([leaveType, statuses]) => ({ leaveType, statuses })));
  } catch (err) {
    console.error("❌ Error in API:", err);
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
// Fetch Leave Type Status
// Fetch Leave Type Status
// Fetch Leave Type Status
app.get('/leave-type-status/:email/:year', async (req, res) => {
  const { email, year } = req.params;
  const requestedYear = parseInt(year);

  try {
    const leaveStats = await Leave.find({ email });

    const formattedResponse = {};

    leaveStats.forEach(({ leaveType, status, year: leaveYears, duration }) => {
      let isYearPresent = false; // ✅ Track if the leave type exists in the requested year

      leaveYears.forEach((yearGroup, i) => {
        if (Array.isArray(yearGroup) && yearGroup.includes(requestedYear)) {
          if (!formattedResponse[leaveType]) {
            formattedResponse[leaveType] = { Pending: 0, Approved: 0, Rejected: 0 };
          }
          formattedResponse[leaveType][status[i]] += duration[i][0] || 0;
          isYearPresent = true; // ✅ Mark that this leave type exists in the requested year
        }
      });

      // ✅ If the leave type exists in the requested year, do NOT remove it
      if (isYearPresent) {
        formattedResponse[leaveType] = formattedResponse[leaveType];
      }
    });

    res.json(Object.entries(formattedResponse).map(([leaveType, statuses]) => ({ leaveType, statuses })));
  } catch (err) {
    console.error("❌ Error in API:", err);
    res.status(500).json({ error: err.message });
  }
});


app.get("/leave-trends/:email/:year", async (req, res) => {
  const { email, year } = req.params;

  try {
    const leaves = await Leave.find({ email });

    if (!leaves.length) {
      return res.status(404).json({ message: "No leave records found." });
    }

    const leaveTrends = Array(12).fill(null).map((_, idx) => ({ month: idx + 1 }));

    leaves.forEach((leave) => {
      leave.year.forEach((yearArray, index) => {
        yearArray.forEach((y, i) => {
          if (y == year) {
            const monthIndex = leave.month[index][i] - 1;
            const leaveType = leave.leaveType;
            
            if (!leaveTrends[monthIndex][leaveType]) {
              leaveTrends[monthIndex][leaveType] = 0;
            }
            
            leaveTrends[monthIndex][leaveType] += leave.duration[index][i];
          }
        });
      });
    });

   // console.log("Leave Trends Data:", JSON.stringify(leaveTrends, null, 2)); // Logging the data
    res.json(leaveTrends);
  } catch (error) {
    console.error("Error fetching leave trends:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});
app.get("/leave-balance/:email/:year", async (req, res) => {
  const { email, year } = req.params;
  const numericYear = Number(year);

  try {
    // Fetch all leave policies
    const policies = await LeavePolicy.find({});
    
    // Initialize leave balance with all leave types
    const leaveBalance = {};
    policies.forEach(policy => {
      leaveBalance[policy.leaveType] = {
        totalLeaves: policy.maxAllowedLeaves,
        usedLeaves: 0,
        availableLeaves: policy.maxAllowedLeaves, // Initially set to total leaves
      };
    });

    // Fetch leave requests for the given email and year
    const leaves = await Leave.find({
      email,
      year: { $elemMatch: { $elemMatch: { $eq: numericYear } } }
    });

    for (const leave of leaves) {
      const { leaveType, duration, year, status } = leave;

      // Skip if leave type is not found in policies (fallback check)
      if (!leaveBalance[leaveType]) continue;

      let usedLeavesInYear = 0;
      for (let i = 0; i < year.length; i++) {
        for (let j = 0; j < year[i].length; j++) {
          if (year[i][j] === numericYear && status[i] === "Approved") {
            usedLeavesInYear += duration[i][j];
          }
        }
      }

      // Update used leaves and available leaves
      leaveBalance[leaveType].usedLeaves += usedLeavesInYear;
      leaveBalance[leaveType].availableLeaves = Math.max(
        0,
        leaveBalance[leaveType].totalLeaves - leaveBalance[leaveType].usedLeaves
      );
    }

    res.json(leaveBalance);
  } catch (err) {
    console.error("Error fetching leave balance:", err);
    res.status(500).json({ error: "Error fetching leave balance" });
  }
});


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
// Backend Updates
app.get('/leave-approval-rate', async (req, res) => {
  const { userEmail, year } = req.query;
  try {
    const leaves = await Leave.find({
      managerEmail: userEmail,
      year: { $elemMatch: { $elemMatch: { $eq: parseInt(year) } } } // ✅ Match any year inside the nested array
  });
  

      const stats = { approved: 0, pending: 0, rejected: 0 };

      leaves.forEach(leave => {
          if (leave.status && Array.isArray(leave.status)) {  
              leave.status.forEach(status => {
                  const formattedStatus = status.toLowerCase();
                  if (stats[formattedStatus] !== undefined) {
                      stats[formattedStatus]++;
                  }
              });
          }
      });

    //  console.log("Leave Approval Rate Data:", stats);
      res.json(stats);
  } catch (error) {
      console.error("Error fetching approval rate:", error);
      res.status(500).json({ message: 'Error fetching approval rate', error });
  }
});
app.get('/leave-types', async (req, res) => {
  const { userEmail, year } = req.query;
  try {
      const leaves = await Leave.find({ 
          managerEmail: userEmail, 
          year: { $elemMatch: { $elemMatch: { $eq: parseInt(year) } } } } 
      );

      const types = {};
      leaves.forEach(({ leaveType, status }) => {
          if (!types[leaveType]) {
              types[leaveType] = { approved: 0, pending: 0, rejected: 0 };
          }
          status.forEach(s => { // ✅ Correctly count statuses
              const formattedStatus = s.toLowerCase();
              if (types[leaveType][formattedStatus] !== undefined) {
                  types[leaveType][formattedStatus]++;
              }
          });
      });

     // console.log("Leave Types Data:", types); // ✅ Debugging log
      res.json(Object.entries(types).map(([leaveType, counts]) => ({ leaveType, ...counts })));
    } catch (error) {
      console.error("Error fetching leave types:", error);
      res.status(500).json({ message: 'Error fetching leave types', error });
  }})// Fetch Employee Monthly Leaves (Handles Multiple Years)
// Fetch Employee Monthly Leaves (Handles Leaves Spanning Multiple Years)
// Fetch Employee Monthly Leaves (Fix for Multi-Year Leave)
app.get('/employee-monthly-leaves', async (req, res) => {
  const { userEmail, year } = req.query;
  try {
      const selectedYear = parseInt(year);
      const leaves = await Leave.find({ managerEmail: userEmail });

      const monthlyData = {};

      leaves.forEach(({ empname, month, duration, status, year: leaveYears }) => {
          if (!monthlyData[empname]) monthlyData[empname] = {};

          leaveYears.forEach((yearGroup, i) => {
              yearGroup.forEach((leaveYear, index) => {
                  const leaveMonth = month[i][index]; // Correct month for this leave
                  const leaveDuration = duration[i][index]; // Correct leave duration

                  // Only count "Approved" leaves in the selected year
                  if (leaveYear === selectedYear && status[i] === "Approved") {
                      monthlyData[empname][leaveMonth] = (monthlyData[empname][leaveMonth] || 0) + leaveDuration;
                  }
              });
          });
      });

      res.json(monthlyData);
  } catch (error) {
      res.status(500).json({ message: 'Error fetching monthly leaves', error });
  }
});


// Fetch Employee Yearly Leaves (Fix for Multi-Year Leave)
app.get('/employee-yearly-leaves', async (req, res) => {
  const { userEmail, year } = req.query;
  try {
      const selectedYear = parseInt(year);
      const leaves = await Leave.find({ managerEmail: userEmail });

      const yearlyData = {};

      leaves.forEach(({ empname, duration, year: leaveYears, status }) => {
          let yearlyLeaveCount = 0;

          // Iterate through each leave entry
          leaveYears.forEach((yearGroup, i) => {
              yearGroup.forEach((leaveYear, index) => {
                  const leaveDuration = duration[i][index]; // Correct leave duration for that year

                  // Only count leaves that are in the selected year & "Approved"
                  if (leaveYear === selectedYear && status[i] === "Approved") {
                      yearlyLeaveCount += leaveDuration;
                  }
              });
          });

          yearlyData[empname] = (yearlyData[empname] || 0) + yearlyLeaveCount;
      });

      res.json(yearlyData);
  } catch (error) {
      res.status(500).json({ message: 'Error fetching yearly leaves', error });
  }
});

const checkOverlap = async (email, newFrom, newTo, leaveId,leaveType) => {
  try {
      let formattedStartDate = new Date(newFrom);
      let formattedEndDate = new Date(newTo);

      formattedStartDate = new Date(Date.UTC(
          formattedStartDate.getFullYear(),
          formattedStartDate.getMonth(),
          formattedStartDate.getDate(),
          0, 0, 0
      ));

      formattedEndDate = new Date(Date.UTC(
          formattedEndDate.getFullYear(),
          formattedEndDate.getMonth(),
          formattedEndDate.getDate(),
          23, 59, 59
      ));

      let existingLeaves = await Leave.find({ email });

      for (let leave of existingLeaves) {
          for (let i = 0; i < leave.startDate.length; i++) {
              if (leave.status[i] === "Rejected") continue;

              const existingStartDate = new Date(leave.startDate[i]);
              const existingEndDate = new Date(leave.endDate[i]);

              // 🛑 **Ignore if it's the same leaveId being edited**
              if (leaveId && leave._id.toString() === leaveId) {
                continue;
              }
              if (leave.leaveType[i] === leaveType || leave.leaveType[i] !== leaveType) {

              // **Updated Overlap Condition**
              if (
                  formattedStartDate.getTime() === existingStartDate.getTime() ||  // Start date matches
                  formattedEndDate.getTime() === existingEndDate.getTime() ||      // End date matches
                  (formattedStartDate >= existingStartDate && formattedStartDate <= existingEndDate) ||
                  (formattedEndDate >= existingStartDate && formattedEndDate <= existingEndDate) ||
                  (formattedStartDate <= existingStartDate && formattedEndDate >= existingEndDate)
              ) {
                  return {
                      hasOverlap: true,
                      message: `You have already applied for leave from ${existingStartDate.toDateString()} to ${existingEndDate.toDateString()}.`
                  };
              }
          }}
      }

      return { hasOverlap: false };
  } catch (error) {
      console.error("Error checking leave overlap:", error);
      return { hasOverlap: false, error: "Something went wrong" };
  }
};

app.get("/check-overlap", async (req, res) => {
  const { email, newFrom, newTo, leaveId, leaveType,index } = req.query;
console.log("index",index)
  try {
    const overlap = await checkOverlap(email, newFrom, newTo, leaveId, leaveType,index);
console.log("overlap",overlap)
    if (overlap.hasOverlap) {
      return res.status(400).json(overlap); // 🛑 Return error response instead of proceeding
    }

    res.json(overlap);
  } catch (error) {
    console.error("Error checking overlap:", error);
    res.status(500).json({ error: "Something went wrong" });
  }
});


app.delete("/leaves/:id", async (req, res) => {
  const { id } = req.params;
  const { startDate, endDate } = req.body;

  console.log("Received ID:", id);
  console.log("Start Date to Match:", startDate);
  console.log("Start Date to Match:", endDate);

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: "Invalid MongoDB ID format" });
  }

  const parseDate = (dateString) => {
    const [day, month, year] = dateString.split("/");
    return new Date(`${year}-${month}-${day}T00:00:00.000Z`);
  };

  try {
    const leave = await Leave.findById(id);

    if (!leave) {
      return res.status(404).json({ error: "Leave not found" });
    }

    // If only one record exists, delete the entire document
    if (leave.startDate.length === 1) {
      await Leave.findByIdAndDelete(id);
      return res.status(200).json({ message: "Leave record deleted completely" });
    }

    const parsedStartDate = parseDate(startDate);
    const parsedEndDate = parseDate(endDate);

    const indexToRemove = leave.startDate.findIndex((date, i) => {
      return (
        new Date(date).toISOString() === parsedStartDate.toISOString() &&
        // new Date(leave.endDate[i]).toISOString() === parsedEndDate.toISOString() &&
        leave.status[i] === "Pending"
      );
    });

    if (indexToRemove === -1) {
      return res.status(404).json({ error: "matching leave not found" });
    }

    if (leave.status[indexToRemove] === "Pending") {
      leave.startDate.splice(indexToRemove, 1);
      leave.endDate.splice(indexToRemove, 1);
      leave.reason.splice(indexToRemove, 1);
      leave.status.splice(indexToRemove, 1);
      leave.duration.splice(indexToRemove, 1);
      leave.year.splice(indexToRemove, 1);
      leave.month.splice(indexToRemove, 1);
      leave.attachments.splice(indexToRemove, 1);
      leave.applyDate.splice(indexToRemove, 1);

      await leave.save();
      return res.status(200).json({ message: "Leave entry deleted successfully" });
    }

    return res.status(400).json({ error: `Only 'Pending' leave entries can be deleted ${leave.status[indexToRemove]}` });

  } catch (error) {
    console.error("Error deleting leave:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
app.get("/leave-total", async (req, res) => {
  const { email, year, gender } = req.query;
  const numericYear = Number(year);

  try {
    // Fetch all leave policies
    const policies = await LeavePolicy.find({});

    // ✅ Filter leave policies based on gender
    const filteredPolicies = policies.filter(policy => {
      if (gender === "Male" && policy.leaveType === "Maternity Leave") return false;
      if (gender === "Female" && policy.leaveType === "Paternity Leave") return false;
      return true;
    });

    // ✅ Sum up maxAllowedLeaves, ignoring null values
    const totalLeaves = filteredPolicies.reduce((sum, policy) => sum + (policy.maxAllowedLeaves || 0), 0);

    let usedLeaves = 0;

    // Fetch leave requests for the given email and year
    const leaves = await Leave.find({
      email,
      year: { $elemMatch: { $elemMatch: { $eq: numericYear } } },
    });

    for (const leave of leaves) {
      const { leaveType, duration, year, status } = leave;

      // ✅ Skip leaves based on gender
      if ((gender === "Male" && leaveType === "Maternity Leave") ||
          (gender === "Female" && leaveType === "Paternity Leave")) {
        continue;
      }

      let usedLeavesInYear = 0;
      for (let i = 0; i < year.length; i++) {
        for (let j = 0; j < year[i].length; j++) {
          if (year[i][j] === numericYear && status[i] === "Approved") {
            usedLeavesInYear += duration[i][j];
          }
        }
      }
      usedLeaves += usedLeavesInYear;
    }

    const availableLeaves = Math.max(0, totalLeaves - usedLeaves);

    res.json({
      totalLeaves,
      usedLeaves,
      availableLeaves,
    });
  } catch (err) {
    console.error("Error fetching leave summary:", err);
    res.status(500).json({ error: "Error fetching leave summary" });
  }
});
app.get("/allholidays", async (req, res) => {
  try {
    const holidays = await Holiday.find();
    res.json(holidays);
  } catch (err) {
    console.error("Error fetching holidays:", err);
    res.status(500).json({ message: "Server Error", error: err.message }); // Include error message
  }
});