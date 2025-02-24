const express = require("express");
const Leave = require("../models/Leave");
const User = require("../models/User");
const router = express.Router();

router.get("/projects", async (req, res) => {
  try {
    const projects = await User.distinct("project", { project: { $ne: null } }); // Fetch unique non-null projects
    if (!projects.length) {
      return res.status(404).json({ message: "No projects found" });
    }
    res.json(projects.map((name) => ({ name }))); // Format as [{ name: "Project A" }]
  } catch (error) {
    console.error("Error fetching projects:", error);
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
    const employees = await User.find({ project }, "empid empname email");
    if (employees.length === 0) {
      return res.status(404).json({ message: "No employees found in this project" });
    }

    // ✅ Step 2: Fetch leave records of employees
    const employeeMap = new Map();
    for (const emp of employees) {
      const leaves = await Leave.find({ email: emp.email });
      employeeMap.set(emp.empid, { empname: emp.empname, leaves });
    }

    // ✅ Step 3: Compare leave dates for overlaps
    const overlapReport = [];

    const empIds = Array.from(employeeMap.keys());
    for (let i = 0; i < empIds.length; i++) {
      for (let j = i + 1; j < empIds.length; j++) {
        const emp1 = employeeMap.get(empIds[i]);
        const emp2 = employeeMap.get(empIds[j]);

        emp1.leaves.forEach((leave1) => {
          emp2.leaves.forEach((leave2) => {
            leave1.startDate.forEach((start1, idx1) => {
              leave2.startDate.forEach((start2, idx2) => {
                const end1 = new Date(leave1.endDate[idx1]);
                const end2 = new Date(leave2.endDate[idx2]);

                // ✅ Check for overlap: start1 <= end2 && start2 <= end1
                if (new Date(start1) <= end2 && new Date(start2) <= end1) {
                  overlapReport.push({
                    employee1: emp1.empname,
                    employee2: emp2.empname,
                    overlappedStart: new Date(Math.max(new Date(start1), new Date(start2))),
                    overlappedEnd: new Date(Math.min(end1, end2)),
                    leaveType: leave1.leaveType,
                  });
                }
              });
            });
          });
        });
      }
    }

    return res.json({ overlapReport });

  } catch (error) {
    console.error("Error fetching leave overlap report:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/projects", async (req, res) => {
  try {
    const projects = await User.distinct("project", { project: { $ne: null } });
    if (!projects.length) {
      return res.status(404).json({ message: "No projects found" });
    }
    res.json(projects.map((name) => ({ name })));
  } catch (error) {
    console.error("Error fetching projects:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
})
router.get("/leave-trends/:year", async (req, res) => {
  try {
    const { year } = req.params;
    const parsedYear = parseInt(year);

    console.log(`Fetching leave trends for year: ${parsedYear}`);

    const leaves = await Leave.aggregate([
      // Step 1: Filter documents to match the specified year
      {
        $match: {
          year: { $elemMatch: { $eq: parsedYear } }, // Ensure year array contains the target year
          status: { $elemMatch: { $eq: "Approved" } } // Ensure at least one status is "Approved"
        }
      },

      // Step 2: Unwind nested arrays
      { $unwind: "$year" },
      { $unwind: "$month" },
      { $unwind: "$duration" },
      { $unwind: "$status" },

      // Step 3: Filter only the required year and approved status
      {
        $match: {
          year: parsedYear,
          status: "Approved"
        }
      },

      // Step 4: Group by month and sum durations
      {
        $group: {
          _id: "$month",
          totalLeaveDays: { $sum: "$duration" } // Sum all leave durations per month
        }
      },

      // Step 5: Sort months in ascending order
      { $sort: { _id: 1 } }
    ]);

    console.log("Aggregated Leave Data:", JSON.stringify(leaves, null, 2));

    // Step 6: Send response with formatted data
    res.json({
      months: leaves.map(l => l._id),
      leaveCounts: leaves.map(l => l.totalLeaveDays)
    });

  } catch (err) {
    console.error("❌ Error fetching leave trends:", err);
    res.status(500).json({ error: "Server error" });
  }
});


router.get("/department-leave/:year", async (req, res) => {
  try {
    const { year } = req.params;
    const reports = await getAdminReports();

    const departmentData = reports.reduce((acc, report) => {
      // Sum up total leave duration for the given year
      const totalDuration = report.leaves
        .filter((leave) => new Date(leave.startDate).getFullYear() === parseInt(year))
        .reduce((sum, leave) => sum + leave.duration, 0); // ✅ Summing leave durations

      if (totalDuration > 0) {
        acc[report.project] = (acc[report.project] || 0) + totalDuration;
      }

      return acc;
    }, {});

    res.status(200).json(departmentData);
  } catch (error) {
    console.error("Error fetching department leave stats:", error);
    res.status(500).json({ message: "Server Error" });
  }
});

// ✅ 4. Top Employees Who Took Leaves
router.get("/top-leave-takers/:year", async (req, res) => {
  try {
    const { year } = req.params;

    const topEmployees = await Leave.aggregate([
      {
        $match: {
          year: parseInt(year), // ✅ Ensure correct year filtering
        },
      },
      {
        $unwind: { path: "$status", includeArrayIndex: "index" }, // ✅ Get index to align with duration
      },
      {
        $project: {
          email: 1,
          empname: 1,
          duration: { $arrayElemAt: ["$duration", "$index"] }, // ✅ Get correct duration using index
          status: 1,
        },
      },
      {
        $match: { status: "Approved" }, // ✅ Only include approved leaves
      },
      {
        $group: {
          _id: "$email",
          empname: { $first: "$empname" },
          leavesTaken: { $sum: "$duration" }, // ✅ Correctly sum only approved durations
        },
      },
      {
        $sort: { leavesTaken: -1 }, // ✅ Sort by total approved leave days
      },
      {
        $limit: 10, // ✅ Get top 10 employees
      },
    ]);

    res.status(200).json(topEmployees);
  } catch (err) {
    console.error("Error fetching top leave takers:", err);
    res.status(500).json({ error: "Server Error" });
  }
});


router.get("/leave-status/:year", async (req, res) => {
  try {
    const { year } = req.params;

    // Fetch all leaves that have a start date in the given year
    const leaves = await Leave.find();

    // Filter leaves for the given year and extract statuses
    const leaveStatuses = leaves.flatMap((leave) =>
      leave.startDate
        .map((start, index) => ({
          status: leave.status[index],
          year: new Date(start).getFullYear(),
        }))
        .filter((leave) => leave.year === parseInt(year))
        .map((leave) => leave.status)
    );

    // Count occurrences of each status
    const statusCounts = leaveStatuses.reduce((acc, status) => {
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    res.status(200).json(statusCounts);
  } catch (error) {
    console.error("Error fetching leave status:", error);
    res.status(500).json({ message: "Server Error" });
  }
});

router.get("/leave-type-distribution/:year", async (req, res) => {
  try {
    const { year } = req.params;
    const reports = await getAdminReports();

    const leaveTypeCount = reports.flatMap((report) =>
      report.leaves
        .filter((leave) => new Date(leave.startDate).getFullYear() === parseInt(year))
        .map((leave) => leave.leaveType)
    );

    const distribution = leaveTypeCount.reduce((acc, type) => {
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

    res.status(200).json(distribution);
  } catch (error) {
    console.error("Error fetching leave distribution:", error);
    res.status(500).json({ message: "Server Error" });
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
                duration: (leave.duration[index] || []).reduce((sum, days) => sum + days, 0), // ✅ Summing up durations
                attachments: leave.attachments[index] || [],
              }))
              .filter((leave) => leave.status === "Approved") // ✅ Only approved requests
          ),
        };
      })
    );

    return reports;
  } catch (error) {
    console.error("Error fetching admin reports:", error);
    throw error;
  }
}

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
