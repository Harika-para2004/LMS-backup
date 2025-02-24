import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Card, CardContent, Typography, Select, MenuItem, FormControl } from "@mui/material";
import ReactECharts from "echarts-for-react";

const LeaveStatusChart = ({ email,year }) => {
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!email || !year) return;

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
    const barWidth = barCount < 4 ? 40 : "60%";

    const statusColors = {
      Pending: "#F4C542",
      Approved: "#4CAF50",
      Rejected: "#F44336",
    };

    const seriesData = statuses.map((status) => ({
      name: status,
      type: "bar",
      stack: "total",
      barWidth,
      emphasis: { focus: "series" },
      itemStyle: { color: statusColors[status] },
      data: chartData.map((item) => item.statuses[status] || 0),
      label: { show: false },
    }));

    return {
      animation: false, // ✅ Disable animation for instant bar display

      tooltip: {
        trigger: "item",
        formatter: (params) => `<b>${params.seriesName}</b>: ${params.value}`,
      },
      legend: {
        data: statuses,
        orient: "horizontal",
        bottom: "5%",
        left: "center",
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
          rotate: barCount > 5 ? 45 : 0,
          margin: 10,
        },
      },
      yAxis: {
        type: "value",
        minInterval: 1,
      },
      series: seriesData,
    };
  };

  return (
    <Card sx={{ maxWidth: 700, margin: "auto", padding: 3, boxShadow: 3 }}>
      <CardContent>
        <Typography variant="h6" align="center">
          Leave Status Overview ({year})
        </Typography>
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
