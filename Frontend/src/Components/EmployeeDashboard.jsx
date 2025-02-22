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
  const { email: contextEmail, role } = useManagerContext(); // Role helps differentiate
  const { email: paramEmail } = useParams(); // Email from URL (if manager clicks)
  const navigate = useNavigate();

  const location = useLocation();
  const [userData, setUserData] = useState(location.state?.userData || {});

  const [email, setEmail] = useState(userData?.email);

  useEffect(() => {
    // CASE 1: If manager navigates, use paramEmail
    if (paramEmail) {
      setEmail(paramEmail);
    }
    // CASE 2: If employee logs in, use contextEmail
    else if (contextEmail) {
      setEmail(contextEmail);
    }
    // CASE 3: If no email found (e.g., direct URL access without login), redirect to login

  }, [contextEmail, paramEmail, navigate]);

  console.log("location", location);
  console.log("dash email", email);

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
