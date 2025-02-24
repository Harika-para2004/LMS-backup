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
import OverlapReport from "./OverlapReport";

const AdminAnalytics = ({year}) => {
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

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const colors = [
    "#FF5733", "#33FF57", "#3357FF", "#FF33A8", "#FFC300", 
    "#DAF7A6", "#581845", "#900C3F", "#C70039", "#E74C3C", 
    "#8E44AD", "#1ABC9C"
  ];
  
  const trendsOptions = {
    title: { text: `Monthly Leave Trends - ${year}`, left: "center" },
    tooltip: { trigger: "axis" },
    grid: { left: "5%", right: "5%", bottom: "10%", containLabel: true },
    xAxis: { 
      type: "category", 
      data: leaveTrends?.months?.map(month => monthNames[month - 1]) || [] 
    },
    yAxis: { type: "value" },
    series: [
      {
        name: "Leaves",
        type: "bar",
        barWidth: leaveTrends?.months?.length < 3 ? 40 : "60%",
        data: leaveTrends?.leaveCounts || [],
        itemStyle: {
          color: (params) => {
            const colors = [
              ["#FF6B6B", "#FF8E8E"], // Soft Red
              ["#6B8E23", "#A0C84C"], // Olive Green
              ["#1E90FF", "#87CEFA"], // Sky Blue
              ["#FFB84D", "#FFD580"], // Warm Orange
              ["#9370DB", "#D8BFD8"], // Lavender
              ["#2E8B57", "#66CDAA"], // Sea Green
              ["#DC143C", "#FF6F61"], // Crimson
              ["#4682B4", "#5F9EA0"], // Steel Blue
              ["#8B4513", "#CD853F"], // Saddle Brown
              ["#708090", "#A9A9A9"], // Slate Gray
              ["#32CD32", "#90EE90"], // Lime Green
              ["#9932CC", "#BA55D3"], // Dark Orchid
            ];
            const gradient = colors[params.dataIndex % colors.length];
            return {
              type: "linear",
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: gradient[0] }, // Top color
                { offset: 1, color: gradient[1] }, // Bottom color
              ],
            };
          },
        },
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
      data: departmentLeaves?.departments || [],
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
        itemStyle: {
          color: (params) => {
            const total = departmentLeaves?.departments?.length || 1;
            const hue = (params.dataIndex * (360 / total)) % 360; // Spread colors evenly
            return {
              type: "linear",
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: `hsl(${hue}, 80%, 60%)` }, // Brighter top
                { offset: 1, color: `hsl(${hue}, 70%, 40%)` }, // Darker bottom
              ],
            };
          },
        },
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
        itemStyle: {
          color: (params) => {
            const total = topLeaveTakers?.employees?.length || 1;
            const hue = (params.dataIndex * (360 / total)) % 360; // Spread colors evenly
            return {
              type: "linear",
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: `hsl(${hue}, 80%, 60%)` }, // Brighter top
                { offset: 1, color: `hsl(${hue}, 70%, 40%)` }, // Darker bottom
              ],
            };
          },
        },
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
    <Card sx={{ p: 2, width: "100%", mb: 2,overflowY:"auto" }}>
      <CardContent>
       

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

            <Grid item md={12} style={{ height: 400, width: "100%" }}>
              <OverlapReport/>
            </Grid>

          
          </Grid>
        )}
      </CardContent>
    </Card>
  );
};

export default AdminAnalytics;
