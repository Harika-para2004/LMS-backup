import React, { useState, useEffect, useMemo } from "react";
import {
  FormControl,
  Select,
  MenuItem,
  InputLabel,
  Card,
  CardContent,
  CircularProgress,
  Grid,
  Typography,
} from "@mui/material";
import ReactECharts from "echarts-for-react";
import axios from "axios";

const AdminAnalytics = () => {
  const [year, setYear] = useState(new Date().getFullYear());
  const [leaveTrends, setLeaveTrends] = useState(null);
  const [leaveTypes, setLeaveTypes] = useState(null);
  const [departmentLeaves, setDepartmentLeaves] = useState(null);
  const [leaveStatus, setLeaveStatus] = useState(null);
  const [topLeaveTakers, setTopLeaveTakers] = useState(null);
  const [managers, setManagers] = useState([]);
  const [selectedManager, setSelectedManager] = useState("");
  const [managerLeaveTrends, setManagerLeaveTrends] = useState({});
  const [loading, setLoading] = useState(false);
  const [noTrendsData, setNoTrendsData] = useState(false);
  const [noTypesData, setNoTypesData] = useState(false);
  const [noDeptData, setNoDeptData] = useState(false);
  const [noTopEmployeesData, setNoTopEmployeesData] = useState(false);
  const [noLeaveStatusData, setNoLeaveStatusData] = useState(false);

  const formatCase = (text) => {
    return text.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
  };

  useEffect(() => {
    fetchAnalytics(year);
    fetchManagers();
  }, [year]);
  useEffect(() => {
    fetchAnalytics(year);
    fetchManagers();
  }, []);

  const yearsRange = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 15 }, (_, i) => currentYear + 1 - i);
  }, []);

  const fetchAnalytics = async (year) => {
    setLoading(true);
    setNoTrendsData(false);
    setNoTypesData(false);
    setNoDeptData(false);
    setNoTopEmployeesData(false);
    setNoLeaveStatusData(false);

    try {
      const [trendsRes, typesRes, deptRes, topEmployeesRes, leaveStatusRes] =
        await Promise.all([
          axios.get(`http://localhost:5001/admin/leave-trends/${year}`),
          axios.get(
            `http://localhost:5001/admin/leave-type-distribution/${year}`
          ),
          axios.get(`http://localhost:5001/admin/department-leave/${year}`),
          axios.get(`http://localhost:5001/admin/top-leave-takers/${year}`),
          axios.get(`http://localhost:5001/admin/leave-status/${year}`),
        ]);

      // Set data for each chart
      if (trendsRes.data.length === 0) setNoTrendsData(true);
      setLeaveTrends({
        months: trendsRes.data.months,
        leaveCounts: trendsRes.data.leaveCounts,
      });

      if (Object.keys(typesRes.data).length === 0) setNoTypesData(true);
      setLeaveTypes(
        Object.entries(typesRes.data).map(([type, count]) => ({
          name: type,
          value: count,
        }))
      );

      if (Object.keys(deptRes.data).length === 0) setNoDeptData(true);
      const departmentData = Object.entries(deptRes.data);
      setDepartmentLeaves({
        departments: departmentData.map(([dept]) => dept),
        leaveCounts: departmentData.map(([, count]) => count),
      });

      if (topEmployeesRes.data.length === 0) setNoTopEmployeesData(true);
      setTopLeaveTakers({
        employees: topEmployeesRes.data.map((emp) => emp.empname),
        leaveCounts: topEmployeesRes.data.map((emp) => emp.leavesTaken),
      });

      if (Object.keys(leaveStatusRes.data).length === 0)
        setNoLeaveStatusData(true);
      setLeaveStatus(
        Object.entries(leaveStatusRes.data).map(([status, count]) => ({
          name: status,
          value: count,
        }))
      );
    } catch (error) {
      console.error("Error fetching analytics:", error);
    }
    setLoading(false);
  };

  const fetchManagers = async () => {
    try {
      const res = await axios.get("http://localhost:5001/admin/managers");
      setManagers(res.data);
    } catch (error) {
      console.error("Error fetching managers:", error);
    }
  };

  useEffect(() => {
    if (selectedManager) {
      axios
        .get(
          `http://localhost:5001/admin/manager-leave-trends/${year}/${selectedManager}`
        )
        .then((res) => setManagerLeaveTrends(res.data))
        .catch((err) => console.error(err));
    }
  }, [selectedManager, year]);

  const isSingleBar = leaveTrends?.months?.length === 3;

  const trendsOptions = {
    title: { text: `Leave Trends - ${year}`, left: "center" },
    tooltip: { trigger: "axis" },
    grid: { left: "5%", right: "5%", bottom: "10%", containLabel: true },
    xAxis: { type: "category", data: leaveTrends?.months || [] },
    yAxis: { type: "value" },
    series: [
      {
        name: "Leaves",
        type: "bar",
        barWidth: leaveTrends?.months?.length < 3 ? 40 : "60%",
        data: leaveTrends?.leaveCounts || [],
      },
    ],
  };

  const leaveTypesOptions = {
    title: { text: `Leave Type Distribution - ${year}`, left: "center" },
    tooltip: { trigger: "item" },
    series: [
      {
        name: "Leave Types",
        type: "pie",
        radius: "60%",
        data: leaveTypes || [],
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: "rgba(0, 0, 0, 0.5)",
          },
        },
      },
    ],
  };

  const departmentLeavesOptions = {
    title: {
      text: `Project-wise Leave Distribution - ${year}`,
      left: "center",
    },
    tooltip: { trigger: "axis" },
    grid: { left: "5%", right: "5%", bottom: "10%", containLabel: true },
    xAxis: {
      type: "category",
      data:  (departmentLeaves?.departments) || [],
      axisLabel: {
        interval: 0,
        rotate: 45,
        margin: 10,
      },
    },
    yAxis: { type: "value" },
    series: [
      {
        name: "Leaves",
        type: "bar",
        barWidth: (departmentLeaves?.departments?.length || 0) < 3 ? 50 : "60%",
        data: departmentLeaves?.leaveCounts || [],
      },
    ],
  };

  const topLeaveTakersOptions = {
    title: { text: `Top 10 Leave Takers - ${year}`, left: "center" },
    tooltip: { trigger: "axis" },
    grid: { left: "5%", right: "5%", bottom: "10%", containLabel: true },
    xAxis: { type: "value" },

    yAxis: { type: "category", data: topLeaveTakers?.employees || [] },
    series: [
      {
        name: "Leaves Taken",
        type: "bar",
        data: topLeaveTakers?.leaveCounts || [],
        barWidth: topLeaveTakers?.length < 4 ? 40 : "60%",
        // itemStyle: { color: "#ff7f50" },
      },
    ],
  };

  const leaveStatusOptions = {
    title: { text: `Leave Status Distribution - ${year}`, left: "center" },
    tooltip: { trigger: "item" },
    legend: { orient: "vertical", left: "left" },
    series: [
      {
        name: "Leave Status",
        type: "pie",
        radius: "50%",
        data: leaveStatus || [],
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: "rgba(0, 0, 0, 0.5)",
          },
        },
      },
    ],
  };

  const managerLeaveTrendsOptions = {
    title: { text: "Leave Trends by Status", left: "center" },
    tooltip: {},
    xAxis: { type: "category", data: Object.keys(managerLeaveTrends) },
    yAxis: { type: "value" },
    series: [
      {
        data: Object.values(managerLeaveTrends),
        type: "bar",
        barWidth: Object.keys(managerLeaveTrends).length < 4 ? 50 : "60%",
      },
    ],
  };

  return (
    <Card sx={{ p: 2, width: "100%", mb: 2 }}>
      <CardContent>
        <FormControl>
          <InputLabel id="select-label">Select Year</InputLabel>
          <Select
            labelId="select-label"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            label="Select Year"
          >
            {yearsRange.map((yr) => (
              <MenuItem key={yr} value={yr}>
                {yr}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {loading ? (
          <CircularProgress sx={{ display: "block", mx: "auto", mt: 2 }} />
        ) : (
          <Grid container spacing={2} sx={{ mt: 2 }}>
            <Grid item xs={12} md={6} style={{ height: 400, width: "100%" }}>
              {noTrendsData ? (
                <div>
                  <Typography>{`Leave Trends - ${year}`} </Typography>
                  <p>No data available for leave trends.</p>
                </div>
              ) : (
                <ReactECharts
                  option={trendsOptions}
                  style={{ height: 400, width: "100%" }}
                />
              )}
            </Grid>

            <Grid item xs={12} md={6} style={{ height: 400, width: "100%" }}>
              {noTypesData ? (
                <div>
                  <Typography variant="h6" sx={{ mb: 3 }}>
                    {`Leave Status Trends - ${year}`}{" "}
                  </Typography>
                  <p>No data available </p>
                </div>
              ) : (
                <ReactECharts
                  option={leaveTypesOptions}
                  style={{ height: 400, width: "100%" }}
                />
              )}
            </Grid>

            <Grid item xs={12} md={6} style={{ height: 400, width: "100%" }}>
              {noDeptData ? (
                <div>
                  <Typography variant="h6" sx={{ mb: 3 }}>
                    {`Project wise Leave Trends - ${year}`}{" "}
                  </Typography>
                  <p>No data available .</p>
                </div>
              ) : (
                <ReactECharts
                  option={departmentLeavesOptions}
                  style={{ height: 400, width: "100%" }}
                />
              )}
            </Grid>

            <Grid item xs={12} md={6} style={{ height: 400, width: "100%" }}>
              {noTopEmployeesData ? (
                <div>
                  <Typography variant="h6" sx={{ mb: 3 }}>
                    {`Top 10 leave takers - ${year}`}{" "}
                  </Typography>
                  <p>No data available .</p>
                </div>
              ) : (
                <ReactECharts
                  option={topLeaveTakersOptions}
                  style={{ height: 400, width: "100%" }}
                />
              )}
            </Grid>

            <Grid item xs={12} md={6} style={{ height: 400, width: "100%" }}>
              {noLeaveStatusData ? (
                <div>
                  <Typography variant="h6" sx={{ mb: 3 }}>
                    {`Leave Status Distribution - ${year}`}{" "}
                  </Typography>
                  <p>No data available .</p>
                </div>
              ) : (
                <ReactECharts
                  option={leaveStatusOptions}
                  style={{ height: 400, width: "100%" }}
                />
              )}
            </Grid>

            <Grid item xs={12} md={6} style={{ height: 400, width: "100%" }}>
              <FormControl fullWidth>
                <InputLabel id="select-label">Select Manager</InputLabel>
                <Select
                  labelId="select-label"
                  value={selectedManager}
                  onChange={(e) => setSelectedManager(e.target.value)}
                  disabled={managers.length === 0}
                  label="Select Manager"
                  id="simple-select"
                >
                  {managers.map((manager) => (
                    <MenuItem key={manager} value={manager}>
                      {manager}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Handle case when no manager is selected */}
              {!selectedManager && (
                <div style={{ textAlign: "center", marginTop: 20 }}>
                  <p>Please select a manager to view the leave trends.</p>
                </div>
              )}

              {/* Handle case when there is no data for the selected manager */}
              {selectedManager && !managerLeaveTrends && (
                <div style={{ textAlign: "center", marginTop: 20 }}>
                  <p>No leave data available for the selected manager.</p>
                </div>
              )}

              {/* Display manager leave trends if data is available */}
              {selectedManager && managerLeaveTrends && (
                <ReactECharts
                  option={managerLeaveTrendsOptions}
                  style={{ height: 400, width: "100%" }}
                />
              )}
            </Grid>
          </Grid>
        )}
      </CardContent>
    </Card>
  );
};

export default AdminAnalytics;
