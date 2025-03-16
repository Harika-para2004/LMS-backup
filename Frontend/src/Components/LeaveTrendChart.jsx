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
      
        const approvedData = data.filter(monthData => 
          Object.keys(monthData).some(type => type !== "month" && monthData[type] > 0)
        );
        
        if (approvedData.length === 0) {
          console.log("No approved leave data found.");
          setChartData([]);
          setLeaveTypes([]);
          return;
        }
        
        setChartData(approvedData);
        
      
      
        const types = new Set();
        data.forEach((monthData) => {
          Object.keys(monthData).forEach((key) => {
            if (key !== "month") types.add(key);
          });
        });
      
        setLeaveTypes([...types]);
      } catch (err) {
        console.error("Error fetching leave trends:", err);
      
        if (err.response && err.response.status === 404) {
          // ✅ Handle 404 explicitly by treating it as "No data" instead of an error
          setChartData([]);
          setLeaveTypes([]);
        } else {
          setError("Failed to load leave trends."); // ✅ Only set error for actual failures
        }
      } finally {
        setLoading(false);
      }
     
    };
  
    fetchData();
  }, [email, year]);  


  


  const getYAxisInterval = (maxValue) => {
    return maxValue <= 10 ? 1 : Math.ceil(maxValue / 5); // Ensure optimal spacing
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
  
    // Elegant color palette with gradients
    const colorPalette = [
      ["#6A8CAF", "#A1B5D8"], // Muted Blue
      ["#6B8E23", "#A0C84C"], // Olive Green
      ["#1E90FF", "#87CEFA"], // Sky Blue
      ["#FFB84D", "#FFD580"], // Warm Orange
      ["#9370DB", "#D8BFD8"], // Lavender
      ["#2E8B57", "#66CDAA"], // Sea Green
      ["#DC143C", "#FF6F61"], // Crimson
      ["#4682B4", "#5F9EA0"], // Steel Blue
    ];
  
    const series = leaveTypes.map((type, index) => ({
      name: type,
      type: "bar",
      stack: "total",
      data: months.map((_, idx) => chartData[idx]?.[type] || 0),
      emphasis: { focus: "series" },
      barWidth: 20, // Ensure equal bar sizes
      itemStyle: {
        color: {
          type: "linear",
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            { offset: 0, color: colorPalette[index % colorPalette.length][0] },
            { offset: 1, color: colorPalette[index % colorPalette.length][1] },
          ],
        },
        borderRadius: [6, 6, 0, 0], // Rounded top edges for elegance
      },
    }));
  
    return {
      animation: true,
      tooltip: {
        trigger: "item",  // Show tooltip only for the hovered bar
        backgroundColor: "rgba(0, 0, 0, 0.75)",
        borderRadius: 6,
        textStyle: { color: "#fff", fontSize: 12 },
        formatter: function (params) {
          return `
            <span style="display:inline-block;width:10px;height:10px;background-color:${params.color};margin-right:5px;border-radius:50%;"></span>
            <strong>${params.seriesName}:</strong> ${params.value}
          `;
        },
      },
      
  
      legend: {
        data: leaveTypes,
        bottom: 0,
        left: "center",
        itemGap: 5, // Better spacing
        textStyle: { fontSize: 12, color: "#333" },
      },
  
      grid: { left: "5%", right: "5%", bottom: "12%", containLabel: true },
  
      xAxis: {
        type: "category",
        data: months,
        axisLabel: {
          rotate: 0,
          margin: 10,
          fontSize: 12,
          color: "#555",
        },
        axisLine: { lineStyle: { color: "#ccc" } }, // Subtle line for neatness
      },
  
      yAxis: {
        type: "value",
        minInterval: 1,
        interval: yAxisInterval,
        splitLine: {
          lineStyle: { type: "dashed", color: "#ddd" }, // Soft dotted lines
        },
      },
  
      series,
    };
  };
  

  return (
    <Card sx={{margin: "auto", padding: 2, boxShadow: 3,backgroundColor: "#F4F5F7" }}>
      <CardContent>
        <Typography variant="h6" align="center">
          Monthly Approved Leave Trends
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
          <ReactECharts option={getOption()} style={{ height: 330 }} />
        )}
      </CardContent>
    </Card>
  );
  

};

export default LeaveTrendChart;