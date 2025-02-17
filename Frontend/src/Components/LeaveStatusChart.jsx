import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Card, CardContent, Typography, Select, MenuItem, FormControl } from "@mui/material";
import ReactECharts from "echarts-for-react";

const LeaveStatusChart = ({ email }) => {
  const [year, setYear] = useState(new Date().getFullYear());
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const yearsRange = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 15 }, (_, i) => currentYear - i);
  }, []);

  useEffect(() => {
    if (!email || !year) return; // Ensure both email and year are available

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await axios.get(`http://localhost:5001/leave-type-status/${email}/${year}`);
        const data = res.data;

        if (data.length === 0) {
          setChartData([]);
          return;
        }

        setChartData(data);
      } catch (err) {
        console.error("Error fetching leave data:", err);
        setError("Failed to load leave data.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [email, year]);
  const getOption = () => {
    const leaveTypes = chartData.map((item) => item.leaveType);
    const statuses = ["Pending", "Approved", "Rejected"];
    const barCount = leaveTypes.length;
  
    const seriesData = statuses.map((status) => ({
      name: status,
      type: "bar",
      stack: "total",
      emphasis: { focus: "series" },
      data: chartData.map((item) => item.statuses[status] || 0),
    }));
  
    return {
      tooltip: { trigger: "axis" },
      legend: { 
        data: statuses, 
        orient: "horizontal", // Arrange horizontally
        bottom: "5%",         // Place at bottom
        left: "center",       // Center align
      },
      grid: { 
        left: "5%", 
        right: "5%", 
        bottom: "15%", // Adjust to avoid legend overlap
        containLabel: true,
      },
      xAxis: {
        type: "category",
        data: leaveTypes,
        axisLabel: {
          interval: 0, 
          rotate: barCount > 5 ? 45 : 0, 
          margin: 10, 
        },
      },
      yAxis: { type: "value" },
      series: seriesData,
    };
  };
  
  
  return (
    <Card sx={{ maxWidth: 700, margin: "auto", padding: 3, boxShadow: 3 }}>
      <CardContent>
        <Typography variant="h6" align="center">Leave Status Overview ({year})</Typography>

        {/* Year Selector */}
        <FormControl  sx={{ marginBottom: 2,marginTop:3 }} >
          <Select value={year} onChange={(e) => setYear(e.target.value)}>
            {yearsRange.map((yr) => (
              <MenuItem key={yr} value={yr}>{yr}</MenuItem>
            ))}
          </Select>
        </FormControl>

        {loading ? (
          <Typography align="center">Loading...</Typography>
        ) : error ? (
          <Typography color="error" align="center">{error}</Typography>
        ) : chartData.length === 0 ? (
          <Typography align="center">No data available for {year}.</Typography>
        ) : (
          <ReactECharts option={getOption()} style={{ height: 400 }} />
        )}
      </CardContent>
    </Card>
  );
};

export default LeaveStatusChart;
