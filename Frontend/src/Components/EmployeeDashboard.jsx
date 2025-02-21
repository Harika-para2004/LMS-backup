import { useEffect, useState, useMemo } from "react";
import ReactECharts from "echarts-for-react";
import {
  Card,
  CardContent,
  Typography,
  Grid,
  MenuItem,
  Select,
} from "@mui/material";
import axios from "axios";
import LeaveStatusChart from "./LeaveStatusChart";
import LeaveBalanceChart from "./LeaveBalanceChart";
import LeaveTrendChart from "./LeaveTrendChart";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useManagerContext } from "../context/ManagerContext";

const EmployeeDashboard = () => {
  const {
    email, 
    userData, setUserData,
    navigate,
    showToast
} = useManagerContext();

  // const location = useLocation();
  // const navigate = useNavigate();

  // Check if the user came from "Reports"
  const cameFromReports = location.state?.fromReports || false;

  const handleBack = () => {
    if (cameFromReports) {
      navigate(-1); // Go back to reports
    }
  };

  const [monthlyTrends, setMonthlyTrends] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [leaveData, setLeaveData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const yearsRange = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 15 }, (_, i) => currentYear + 1 - i);
  }, []);

  // 🔹 Fetch Leave Trends & Leave Types (On Mount)
  // useEffect(() => {
  //   const fetchData = async () => {
  //     setLoading(true);
  //     setError(null);
  //     try {
  //       const [trendsRes, typesRes] = await Promise.all([
  //         axios.get(`http://localhost:5001/leave-trends/${email}`),
  //         axios.get(`http://localhost:5001/leavetype-status/${email}`),
  //       ]);

  //       setMonthlyTrends(trendsRes.data || []);
  //       setLeaveTypes(typesRes.data || []);
  //     } catch (err) {
  //       console.error("Error fetching leave stats:", err);
  //       setError("Failed to load leave data.");
  //     } finally {
  //       setLoading(false);
  //     }
  //   };

  //   fetchData();
  // }, [email]);

  // // 🔹 Fetch Leave Data for Selected Year
  // useEffect(() => {
  //   setLoading(true);
  //   fetch(`http://localhost:5001/leave-types/${email}/${selectedYear}`)
  //     .then((res) => res.json())
  //     .then((data) => setLeaveData(data))
  //     .catch((err) => {
  //       console.error("Error fetching leave data:", err);
  //       setError("Failed to load leave data.");
  //     })
  //     .finally(() => setLoading(false));
  // }, [email, selectedYear]);

  // 🟢 Monthly Leave Trends - Bar Chart
  const monthlyTrendsOptions = {
    title: { text: "Monthly Approved Leave Trends", left: "center" },
    tooltip: { trigger: "axis" },
    xAxis: {
      type: "category",
      data: monthlyTrends.map((item) => `${item._id.month}/${item._id.year}`),
    },
    yAxis: { type: "value" },
    series: [
      {
        name: "Leaves Taken",
        type: "bar",
        data: monthlyTrends.map((item) => item.totalLeaves),
      },
    ],
  };

  // 🟢 Leave Type Distribution - Pie Chart
  const leaveTypesOptions = {
    title: { text: "Leave Type Distribution", left: "center" },
    tooltip: { trigger: "item" },
    legend: { bottom: 0 },
    series: [
      {
        name: "Leave Types",
        type: "pie",
        radius: "50%",
        data: leaveTypes.map((item) => ({
          value: item.count,
          name: `${item._id.leaveType} (${item._id.status})`,
        })),
      },
    ],
  };

  // 🔹 Extract Unique Years for X-axis
  const uniqueYears = [...new Set(leaveData.map((item) => item._id.year))];

  // 🟢 Leave Status Breakdown by Year - Bar Chart
  // const leaveStatusChart = {
  //   title: { text: "Leave Status Breakdown by Year", left: "center" },
  //   tooltip: { trigger: "axis" },
  //   legend: { bottom: 0 },
  //   xAxis: { type: "category", data: uniqueYears },
  //   yAxis: { type: "value" },
  //   series: ["Pending", "Approved", "Rejected"].map((status) => ({
  //     name: status,
  //     type: "bar",
  //     data: uniqueYears.map(
  //       (year) =>
  //         leaveData.find((item) => item._id.year === year && item._id.status === status)
  //           ?.count || 0
  //     ),
  //   })),
  // };

  // const leaveTypesOptions = {
  //   title: { text: "Leave Status Breakdown", left: "center" },
  //   tooltip: { trigger: "axis" },
  //   legend: { bottom: 0 },

  //   xAxis: {
  //     type: "category",
  //     data: [...new Set(leaveTypes.map((item) => item._id.leaveType))], // Unique leave types
  //   },
  //   yAxis: { type: "value" },

  //   series: [
  //     {
  //       name: "Pending",
  //       type: "bar",
  //       stack: "status",
  //       data: leaveTypes
  //         .filter((item) => item._id.status === "Pending")
  //         .map((item) => item.count),
  //     },
  //     {
  //       name: "Approved",
  //       type: "bar",
  //       stack: "status",
  //       data: leaveTypes
  //         .filter((item) => item._id.status === "Approved")
  //         .map((item) => item.count),
  //     },
  //     {
  //       name: "Rejected",
  //       type: "bar",
  //       stack: "status",
  //       data: leaveTypes
  //         .filter((item) => item._id.status === "Rejected")
  //         .map((item) => item.count),
  //     },
  //   ],
  // };

  return (
    <Grid container direction="column">
      {error && <Typography color="error">{error}</Typography>}

      <Grid container spacing={3} sx={{ p: 3 }}>
        {/* 🔹 Monthly Trends Chart */}
        <Grid item xs={12} md={6}>
          {/* <Card>
            <CardContent>
              {loading ? (
                <Typography>Loading...</Typography>
              ) : monthlyTrends.length === 0 ? (
                <Typography>No leave trends available.</Typography>
              ) : (
                <ReactECharts option={monthlyTrendsOptions} />
              )}
            </CardContent>
          </Card> */}
          <LeaveStatusChart email={email} />
        </Grid>

        {/* 🔹 Leave Type Distribution */}
        <Grid item xs={12} md={6}>
          {/* <Card>
            <CardContent>
              {loading ? (
                <Typography>Loading...</Typography>
              ) : leaveTypes.length === 0 ? (
                <Typography>No leave type data available.</Typography>
              ) : (
                <ReactECharts option={leaveTypesOptions} />
              )}
            </CardContent>
          </Card> */}
          <LeaveTrendChart email={email} />
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ p: 3 }}>
        {/* 🔹 Leave Status Breakdown */}
        <Grid item xs={12}>
          {/* <Card>
            <CardContent>
              {loading ? (
                <Typography>Loading...</Typography>
              ) : leaveData.length === 0 ? (
                <Typography>No leave status data available.</Typography>
              ) : (
                <>
                  <Select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                    sx={{ mb: 2 }}
                  >
                    {yearsRange.map((year) => (
                      <MenuItem key={year} value={year}>
                        {year}
                      </MenuItem>
                    ))}
                  </Select>
                  <ReactECharts option={leaveStatusChart} />
                </>
              )}
            </CardContent>
          </Card> */}
          <LeaveBalanceChart email={email} />
        </Grid>
      </Grid>
    </Grid>
  );
};

export default EmployeeDashboard;
