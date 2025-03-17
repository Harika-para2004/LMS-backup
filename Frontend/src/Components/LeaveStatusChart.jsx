import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Card,
  CardContent,
  Typography,
  Select,
  MenuItem,
  FormControl,
} from "@mui/material";
import ReactECharts from "echarts-for-react";

const LeaveStatusChart = ({ email, year }) => {
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!email || !year) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await axios.get(
          `http://localhost:5001/leave-type-status/${email}/${year}`
        );
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
    const barWidth = barCount < 4 ? 30 : "40%";

    const statusColors = {
      Pending: ["#F4C542", "#FFD700"], // Golden gradient
      Approved: ["#4CAF50", "#81C784"], // Green gradient
      Rejected: ["#F44336", "#FF6B6B"], // Red gradient
    };

    const seriesData = statuses.map((status) => ({
      name: status,
      type: "bar",
      stack: "total",
      barWidth,
      emphasis: { focus: "series" },
      itemStyle: {
        color: {
          type: "linear",
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            { offset: 0, color: statusColors[status][0] }, // Start color
            { offset: 1, color: statusColors[status][1] }, // End color
          ],
        },
        borderRadius: [5, 5, 0, 0], // Smooth edges on top
      },
      data: chartData.map((item) => item.statuses[status] || 0),
      label: { show: false }, // ❌ Hides numbers on bars
    }));

    return {
      animation: true,

      tooltip: {
        trigger: "item", // ✅ Shows only hovered bar details
        backgroundColor: "rgba(0, 0, 0, 0.75)",
        textStyle: { color: "#fff" },
        borderRadius: 5,
        padding: 10,
        formatter: (params) => {
          return `<b>${params.seriesName}:</b> ${params.value}`;
        },
        axisPointer: {
          type: "shadow",
        },
      },

      legend: {
        data: statuses,
        bottom: "2%",
        left: "center",
        textStyle: { fontSize: 14, fontWeight: "bold" },
      },

      grid: {
        left: "5%",
        right: "5%",
        bottom: "15%",
        containLabel: true,
      },

      xAxis: {
        type: "category",
        data: leaveTypes,
        axisLabel: {
          interval: 0,
          margin: 10,
          fontSize: 12,
          color: "#555",
          formatter: (value) =>
            value.length > 6 ? value.substring(0, 6) + "..." : value,
        },
        axisTick: { show: false },
        axisLine: { lineStyle: { color: "#ddd" } },
        tooltip: {
          show: true,
          formatter: (params) => params.value,
        },
      },

      yAxis: {
        type: "value",
        minInterval: 1,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { fontSize: 12, color: "#555" },
        splitLine: { lineStyle: { type: "dashed", color: "#ddd" } },
      },

      series: seriesData,
    };
  };

  return (
    <Card
      sx={{
        maxWidth: 700,
        maxHeight: 460,
        minHeight: 400,
        overflowY: "auto",
        margin: "auto",
        padding: 3,
        boxShadow: 3,
        backgroundColor: "#F4F5F7",
        
      }}
    >
      <CardContent>
        <Typography variant="h6" align="center">
          Leave Status Overview
        </Typography>
        {loading ? (
          <Typography align="center">Loading...</Typography>
        ) : error ? (
          <Typography color="error" align="center">
            {error}
          </Typography>
        ) : chartData.length === 0 ? (
          <Typography align="center">No data available for {year}.</Typography>
        ) : (
          <ReactECharts option={getOption()} style={{ height: 280 }} />
        )}
      </CardContent>
    </Card>
  );
};

export default LeaveStatusChart;
