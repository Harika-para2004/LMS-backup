import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Card,
  CardContent,
  Typography
} from "@mui/material";
import ReactECharts from "echarts-for-react";

const LeaveTrendChart = ({ email, year }) => {
  const [chartData, setChartData] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  useEffect(() => {
    if (!email || !year) return;
  
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await axios.get(
          `http://localhost:5001/leave-trends/${email}/${year}`
        );
  
        console.log("Fetched Data:", res.data);
        
        const data = res.data || [];
  
        if (data.length === 0) {
          console.log("No leave data found.");
          setChartData([]);
          setLeaveTypes([]);
          return; // ✅ Stops execution here, preventing error state
        }
  
        setChartData(data);
  
        const types = new Set();
        data.forEach((monthData) => {
          Object.keys(monthData).forEach((key) => {
            if (key !== "month") types.add(key);
          });
        });
  
        setLeaveTypes([...types]);
      } catch (err) {
        console.error("Error fetching leave trends:", err);
        setError("Failed to load leave trends."); // ✅ Only sets error if request truly fails
      } finally {
        setLoading(false);
      }
    };
  
    fetchData();
  }, [email, year]);  
  const getYAxisInterval = (maxValue) => {
    if (maxValue <= 5) return 1;
    if (maxValue <= 10) return 2;
    if (maxValue <= 20) return 5;
    if (maxValue <= 50) return 10;
    if (maxValue <= 100) return 20;
    return 50; // For very large values
  };

  const getOption = () => {
    const months = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];

    // Compute max value from data
    const maxValue = Math.max(
      ...chartData.map((monthData) => 
        Object.values(monthData).reduce((sum, val) => sum + (typeof val === "number" ? val : 0), 0)
      ), 0
    );

    const yAxisInterval = getYAxisInterval(maxValue);

    const series = leaveTypes.map((type) => ({
      name: type,
      type: "bar",
      stack: "total",
      data: months.map((_, idx) => chartData[idx]?.[type] || 0),
      emphasis: { focus: "series" },
    }));

    return {
      animation: false, // Disable animation for instant bar display

      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
        formatter: function (params) {
          const hovered = params.find((p) => p.seriesName && p.value > 0);
          return hovered ? `${hovered.seriesName}: ${hovered.value}` : "";
        },
      },

      legend: {
        data: leaveTypes,
        bottom: 0,
        left: "center",
        padding: [10, 0, 0, 0],
      },

      grid: { left: "3%", right: "4%", bottom: "10%", containLabel: true },

      xAxis: {
        type: "category",
        data: months,
        axisLabel: { rotate: 45, margin: 10 },
      },

      yAxis: {
        type: "value",
        interval: yAxisInterval, // 🔹 Dynamic interval
        max: Math.ceil(maxValue / yAxisInterval) * yAxisInterval, // Ensure it fits in the interval
      },

      series, 
    };
  };

  return (
    <Card sx={{ maxWidth: 700, margin: "auto", padding: 2, boxShadow: 3 }}>
      <CardContent>
        <Typography variant="h6" align="center">
          Monthly Approved Leave Trends ({year})
        </Typography>

        {loading ? (
          <Typography align="center">Loading...</Typography>
        ) : error ? (
          <Typography color="error" align="center">
            {error}
          </Typography>
        ) : chartData.length === 0 ? (
          <Typography align="center">No data available for {year}.</Typography>
        )  : (
          <ReactECharts option={getOption()} style={{ height: 400 }} />
        )}
      </CardContent>
    </Card>
  );
};

export default LeaveTrendChart;
