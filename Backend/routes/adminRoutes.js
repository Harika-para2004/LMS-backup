const express = require("express");
const Leave = require("../models/Leave");
const User = require("../models/User");
const router = express.Router();


router.get("/leave-trends/:year", async (req, res) => {
  try {
    const { year } = req.params;
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

router.get("/department-leave/:year", async (req, res) => {
  try {
    const { year } = req.params;
    const reports = await getAdminReports();

    const departmentData = reports.reduce((acc, report) => {
      const leaveCount = report.leaves.filter(
        (leave) => new Date(leave.startDate).getFullYear() === parseInt(year)
      ).length;

      if (leaveCount > 0) {
        acc[report.project] = (acc[report.project] || 0) + leaveCount;
      }

      return acc;
    }, {});

    res.status(200).json(departmentData);
  } catch (error) {
    console.error("Error fetching department leave stats:", error);
    res.status(500).json({ message: "Server Error" });
  }
});

router.get("/top-leave-takers/:year", async (req, res) => {
  try {
    const { year } = req.params;
    const reports = await getAdminReports();

    const leaveTakers = reports
      .map((report) => ({
        empname: report.empname,
        empid: report.empid,
        email: report.email,
        totalLeaves: report.leaves.filter(
          (leave) => new Date(leave.startDate).getFullYear() === parseInt(year)
        ).length,
      }))
      .filter((item) => item.totalLeaves > 0)
      .sort((a, b) => b.totalLeaves - a.totalLeaves)
      .slice(0, 10);

    res.status(200).json(leaveTakers);
  } catch (error) {
    console.error("Error fetching top leave takers:", error);
    res.status(500).json({ message: "Server Error" });
  }
});

router.get("/leave-status/:year", async (req, res) => {
  try {
    const { year } = req.params;
    const reports = await getAdminReports();

    const leaveStatuses = reports.flatMap((report) =>
      report.leaves
        .filter((leave) => new Date(leave.startDate).getFullYear() === parseInt(year))
        .map((leave) => leave.status)
    );

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
