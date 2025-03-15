import React, { useEffect, useState } from "react";
import axios from "axios";
import { Card, CardContent, Typography } from "@mui/material";
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
        const data = res.data || [];

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
        setError("Failed to load leave trends.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [email, year]);

  // ✅ Define the color palette
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

  const getOption = () => {
    const months = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];
  
    return {
      tooltip: {
        trigger: "item",
        backgroundColor: "rgba(0, 0, 0, 0.75)",
        borderRadius: 6,
        textStyle: { color: "#fff", fontSize: 12 },
      },
      legend: { show: false }, // ✅ Hide default legend, using custom below
      grid: {
        left: "5%",
        right: "5%",
        bottom: "3%", // ✅ Reduced gap between X-axis and custom legend
        top: "10%",
        containLabel: true,
      },
      xAxis: {
        type: "category",
        data: months,
        axisLabel: {
          margin: 6, // ✅ Reduced margin between X-axis labels and the bars
          fontSize: 12,
          color: "#555",
        },
        axisLine: { lineStyle: { color: "#ccc" } },
      },
      yAxis: {
        type: "value",
        minInterval: 1,
        splitLine: {
          lineStyle: { type: "dashed", color: "#ddd" },
        },
      },
      series: leaveTypes.length > 0 ? leaveTypes.map((type, index) => ({
        name: type,
        type: "bar",
        stack: "total",
        data: months.map((monthName, idx) => {
          const monthData = chartData.find(m => m.month === idx + 1);
          return monthData ? monthData[type] || 0 : 0;
        }),
        itemStyle: {
          color: colorPalette[index % colorPalette.length][0], // Assign color from palette
        },
      })) : [],
    };
  };
  

  return (
    <Card sx={{ margin: "auto", padding: 2, boxShadow: 3, backgroundColor: "#F4F5F7" }}>
      <CardContent>
        <Typography variant="h6" align="center" gutterBottom>
          Monthly Approved Leave Trends
        </Typography>

        {loading ? (
          <Typography align="center">Loading...</Typography>
        ) : error ? (
          <Typography color="error" align="center">{error}</Typography>
        ) : chartData.length === 0 ? (
          <Typography align="center">No data available for {year}.</Typography>
        ) : (
          <>
            <ReactECharts option={getOption()} style={{ height: 300 }} />
            {/* ✅ Custom Legend Below */}
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                justifyContent: "center",
                gap: "10px",
              }}
            >
              {leaveTypes.map((type, index) => (
                <span
                  key={type}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    fontSize: "12px",
                    fontWeight: "bold",
                    color: "#333",
                  }}
                >
                  <span
                    style={{
                      display: "inline-block",
                      width: "12px",
                      height: "12px",
                      backgroundColor: colorPalette[index % colorPalette.length][0],
                      marginRight: "5px",
                      borderRadius: "50%",
                    }}
                  ></span>
                  {type}
                </span>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default LeaveTrendChart;
