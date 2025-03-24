const express = require("express");
const Leave = require("../models/Leave");
const User = require("../models/User");
const router = express.Router();
router.get("/projects", async (req, res) => {
  try {
    const projects = await User.distinct("project", { project: { $ne: null } });

    if (!projects.length) {
      return res.status(404).json({ message: "No projects found" });
    }
    
    res.json(projects.map((name) => ({ name })));
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ✅ Route to get leave overlap report for a selected project
router.get("/leaves/overlap-report", async (req, res) => {
  try {
    const { project } = req.query;
    if (!project) {
      return res.status(400).json({ error: "Project is required" });
    }


    // ✅ Step 1: Get all employees in the project
    const employees = await User.find(
      { project: { $regex: new RegExp(`^${project}$`, "i") } },
      "empid empname email"
    );


    if (employees.length === 0) {
      return res.status(404).json({ message: "No employees found in this project" });
    }

    // ✅ Step 2: Fetch only "Approved" leave records
    const employeeLeaves = [];
    for (const emp of employees) {
      const leaves = await Leave.find(
        { email: emp.email, status: "Approved" },
        "startDate endDate leaveType"
      );

      if (leaves.length > 0) {
        employeeLeaves.push({ empid: emp.empid, empname: emp.empname, leaves });
      }
    }


    if (employeeLeaves.length < 2) {
      return res.status(200).json({ message: "Not enough employees with approved leaves for overlap check." });
    }

    // ✅ Step 3: Compare leave dates for overlapping employees
    const overlapReport = [];

    for (let i = 0; i < employeeLeaves.length; i++) {
      for (let j = i + 1; j < employeeLeaves.length; j++) {
        const emp1 = employeeLeaves[i];
        const emp2 = employeeLeaves[j];

        const overlappingPeriods = [];

        emp1.leaves.forEach((leaveA) => {
          emp2.leaves.forEach((leaveB) => {
            const startA = new Date(leaveA.startDate);
            const endA = new Date(leaveA.endDate);
            const startB = new Date(leaveB.startDate);
            const endB = new Date(leaveB.endDate);

            // ✅ Corrected overlap logic (earliest start and latest end)
            if (startA <= endB && startB <= endA) {
              const overlappedStart = new Date(Math.max(startA, startB)); // Latest start date
              const overlappedEnd = new Date(Math.min(endA, endB)); // Earliest end date

              overlappingPeriods.push({ overlappedStart, overlappedEnd });
            }
          });
        });

        if (overlappingPeriods.length > 0) {
          overlapReport.push({
            employees: [emp1.empname, emp2.empname],
            overlappingPeriods,
          });
        }
      }
    }

    return res.json({ overlapReport });

  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});



router.get("/leave-trends/:year", async (req, res) => {
  try {
    const { year } = req.params;
    const selectedYear = parseInt(year);


    const leaves = await Leave.find({
      year: { $elemMatch: { $elemMatch: { $eq: selectedYear } } }, // Match the correct year
      status: { $elemMatch: { $eq: "Approved" } } // Only approved leaves
    });

    const monthlyData = {};

    // Step 1: Process each leave entry correctly
    leaves.forEach(({ year, month, duration, status }) => {
      year.forEach((yearGroup, i) => {
        yearGroup.forEach((leaveYear, index) => {
          if (leaveYear === selectedYear && status[i] === "Approved") {
            const leaveMonth = month[i][index]; // Correct month from the same index
            const leaveDuration = duration[i][index]; // Correct duration from the same index

            // Sum up leave durations for each month
            monthlyData[leaveMonth] = (monthlyData[leaveMonth] || 0) + leaveDuration;
          }
        });
      });
    });

    // Step 2: Convert monthlyData object into sorted arrays for frontend
    const sortedMonths = Object.keys(monthlyData).map(Number).sort((a, b) => a - b);
    const leaveCounts = sortedMonths.map(month => monthlyData[month]);

    // Step 3: Send response formatted for frontend charts
    res.json({
      months: sortedMonths,
      leaveCounts
    });

  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

async function getAdminReports(project = "", search = "") {
  try {
    let query = {};
    if (project) query.project = project;
    if (search) {
      query.$or = [
        { empname: new RegExp(search, "i") },
        { empid: new RegExp(search, "i") },
        { project: new RegExp(search, "i") },
      ];
    }

    const employees = await User.find(query);
    const reports = await Promise.all(
      employees.map(async (employee) => {
        const leaves = await Leave.find({ email: employee.email });

        return {
          empid: employee.empid,
          empname: employee.empname,
          project: employee.project,
          email: employee.email,
          leaves: leaves.flatMap((leave) =>
            leave.startDate
              .map((start, index) => ({
                leaveType: leave.leaveType,
                startDate: new Date(start).toLocaleDateString(),
                endDate: leave.endDate[index]
                  ? new Date(leave.endDate[index]).toLocaleDateString()
                  : "N/A",
                status: leave.status[index] || "Pending",
                reason: leave.reason[index] || "No reason provided",
                duration: (leave.duration[index] || []).reduce((sum, days) => sum + days, 0),
                attachments: leave.attachments[index] || [],
              }))
              .filter((leave) => leave.status === "Approved")
          ),
        };
      })
    );

    return reports;
  } catch (error) {
    throw error;
  }
}
router.get("/department-leave/:year", async (req, res) => {
  try {
    const { year } = req.params;
    const selectedYear = parseInt(year);


    // Fetch employee reports with project details
    const adminReports = await getAdminReports();

    // Create a mapping of email to project
    const projectMapping = adminReports.reduce((acc, { email, project }) => {
      acc[email] = project; // Assign project to each employee email
      return acc;
    }, {});

    // Fetch leave records for the selected year
    const leaves = await Leave.find({
      year: { $elemMatch: { $elemMatch: { $eq: selectedYear } } },
      status: { $elemMatch: { $eq: "Approved" } },
    });

    const departmentData = {};

    leaves.forEach(({ year, month, duration, status, email }) => {
      const project = projectMapping[email] || "Unknown"; // Assign project based on email mapping

      year.forEach((yearGroup, i) => {
        yearGroup.forEach((leaveYear, index) => {
          if (leaveYear === selectedYear && status[i] === "Approved") {
            const leaveDuration = duration[i][index];
            departmentData[project] = (departmentData[project] || 0) + leaveDuration;
          }
        });
      });
    });


    res.status(200).json(departmentData);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
});


// ✅ 4. Top Employees Who Took Leaves
router.get("/top-leave-takers/:year", async (req, res) => {
  try {
    const { year } = req.params;
    const selectedYear = parseInt(year);


    // Fetch employee reports to map email → empname
    const adminReports = await getAdminReports();
    const employeeMapping = adminReports.reduce((acc, { email, empname }) => {
      acc[email] = empname; // Store empname by email
      return acc;
    }, {});

    const leaves = await Leave.find({
      year: { $elemMatch: { $elemMatch: { $eq: selectedYear } } },
      status: { $elemMatch: { $eq: "Approved" } }
    });

    const employeeLeaveData = {};

    leaves.forEach(({ email, year, status, duration }) => {
      year.forEach((yearGroup, i) => {
        yearGroup.forEach((leaveYear, index) => {
          if (leaveYear === selectedYear && status[i] === "Approved") {
            const leaveDuration = duration[i][index];

            employeeLeaveData[email] = (employeeLeaveData[email] || 0) + leaveDuration;
          }
        });
      });
    });

    // Convert to array and include employee names
    const topEmployees = Object.entries(employeeLeaveData).map(([email, totalLeave]) => ({
      email,
      empname: employeeMapping[email] || "Unknown",
      totalLeave,
    }));


    res.status(200).json(topEmployees);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
});
router.get("/leave-status/:year", async (req, res) => {
  try {
    const { year } = req.params;

    // Fetch all leave records for the given year
    const leaves = await Leave.find({
      year: { $elemMatch: { $elemMatch: { $eq: parseInt(year) } } },
    });

    // Extract and sum durations for each status
    const statusCounts = {};

    leaves.forEach((leave) => {
      leave.startDate.forEach((start, index) => {
        const leaveYear = new Date(start).getFullYear();
        if (leaveYear === parseInt(year)) {
          const status = leave.status[index]; // Get corresponding status
          const leaveDurations = leave.duration[index]; // Get duration array

          // Sum all values inside the nested array
          const totalDuration = Array.isArray(leaveDurations)
            ? leaveDurations.reduce((sum, days) => sum + days, 0)
            : 0;

          statusCounts[status] = (statusCounts[status] || 0) + totalDuration;
        }
      });
    });

    res.status(200).json(statusCounts);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
});
router.get("/leave-type-distribution/:year", async (req, res) => {
  try {
    const { year } = req.params;
    const selectedYear = parseInt(year);


    // Fetch all leave records for the given year
    const leaves = await Leave.find({
      year: { $elemMatch: { $elemMatch: { $eq: selectedYear } } },
    });

    const leaveTypeDuration = {};

    leaves.forEach((leave) => {
      leave.startDate.forEach((start, index) => {
        const leaveYear = new Date(start).getFullYear();
        if (leaveYear === selectedYear && leave.status[index] === "Approved") {
          const leaveType = leave.leaveType;
          const leaveDurations = leave.duration[index]; // Get duration array

          // Sum all values inside the nested array
          const totalDuration = Array.isArray(leaveDurations)
            ? leaveDurations.reduce((sum, days) => sum + days, 0)
            : 0;

          leaveTypeDuration[leaveType] = (leaveTypeDuration[leaveType] || 0) + totalDuration;
        }
      });
    });


    res.status(200).json(leaveTypeDuration);

  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
});



// router.get("/manager-leave-trends/:year/:managerEmail", async (req, res) => {
//   try {
//     const { year, managerEmail } = req.params;
    
//     const leaveTrends = await Leave.aggregate([
//       { $match: { year: parseInt(year), managerEmail } },
//       { $group: { 
//           _id: "$status", 
//           count: { $sum: 1 } 
//       }}
//     ]);

//     res.json(leaveTrends.reduce((acc, item) => {
//       acc[item._id] = item.count;
//       return acc;
//     }, {}));
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });
router.get("/manager-leave-trends/:year/:managerEmail", async (req, res) => {
  try {
    const { year, managerEmail } = req.params;

    const leaveTrends = await Leave.aggregate([
      { $match: { year: { $in: [parseInt(year)] }, managerEmail } },
      { $unwind: "$status" }, // Expand each status into a separate document
      { $group: { 
          _id: "$status", 
          count: { $sum: 1 } 
      }}
    ]);

    res.json(leaveTrends.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {}));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.get("/managers", async (req, res) => {
  try {
    const managers = await Leave.distinct("managerEmail");
    res.json(managers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


module.exports = router;
