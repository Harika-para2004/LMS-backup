import React, { useEffect, useState } from "react";
import axios from "axios";
import { Card, CardContent, Typography, Select, MenuItem, FormControl } from "@mui/material";
import ReactECharts from "echarts-for-react";

const LeaveTrendChart = ({ email }) => {
  const [year, setYear] = useState(new Date().getFullYear());
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!email || !year) return;
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await axios.get(`http://localhost:5001/leave-trends/${email}/${year}`);
        setChartData(res.data || []);
      } catch (err) {
        console.error("Error fetching leave trends:", err);
        setError("Failed to load leave trends.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [email,year]);

  const getOption = () => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    const pending = months.map((_, idx) => chartData[idx]?.Pending || 0);
    const approved = months.map((_, idx) => chartData[idx]?.Approved || 0);
    const rejected = months.map((_, idx) => chartData[idx]?.Rejected || 0);

    return {
      tooltip: { trigger: "axis" },
      legend: { data: ["Pending", "Approved", "Rejected"], bottom: 0 },
      grid: { left: "3%", right: "4%", bottom: "10%", containLabel: true },
      xAxis: { type: "category", data: months },
      yAxis: { type: "value" },
      series: [
        { name: "Pending", type: "line", data: pending, smooth: true, color: "orange" },
        { name: "Approved", type: "line", data: approved, smooth: true, color: "green" },
        { name: "Rejected", type: "line", data: rejected, smooth: true, color: "red" },
      ],
    };
  };

  return (
    <Card sx={{ maxWidth: 700, margin: "auto", padding: 2, boxShadow: 3 }}>
      <CardContent>
        <Typography variant="h6" align="center">Monthly Leave Trends ({year})</Typography>

        <FormControl sx={{ marginBottom: 2,marginTop: 3 }}>
          <Select value={year} onChange={(e) => setYear(e.target.value)}>
            {[2023, 2024, 2025].map((yr) => (
              <MenuItem key={yr} value={yr}>{yr}</MenuItem>
            ))}
          </Select>
        </FormControl>

        {loading ? <Typography align="center">Loading...</Typography> : 
         error ? <Typography color="error" align="center">{error}</Typography> : 
         <ReactECharts option={getOption()} style={{ height: 400 }} />}
      </CardContent>
    </Card>
  );
};

export default LeaveTrendChart;
