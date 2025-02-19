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

const LeaveTrendChart = ({ email }) => {
  const [year, setYear] = useState(new Date().getFullYear());
  const [chartData, setChartData] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const yearsRange = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 15 }, (_, i) => currentYear + 1 - i);
  }, []);

  useEffect(() => {
    if (!email || !year) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await axios.get(
          `http://localhost:5001/leave-trends/${email}/${year}`
        );
        console.log("Fetched Data:", res.data); // ✅ Debug: Print API response
        const data = res.data || [];

        setChartData(data);

        // Extract unique leave types dynamically
        const types = new Set();
        data.forEach((monthData) => {
          Object.keys(monthData).forEach((key) => {
            if (key !== "month") types.add(key);
          });
        });

        console.log("Extracted Leave Types:", [...types]); // ✅ Debug: Print extracted leave types
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

  const getOption = () => {
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const barCount = leaveTypes.length;


    const series = leaveTypes.map((type) => ({
      name: type,
      type: "line",
      data: months.map((_, idx) => chartData[idx]?.[type] || 0),
      smooth: true,
      lineStyle: { width: 2 },
    }));

    console.log("Chart Series Data:", series); // ✅ Debug: Print final chart data

    return {
      tooltip: { trigger: "axis" },
      legend: { 
        data: leaveTypes, 
        orient: "horizontal",
        bottom: 0,  // Place it at the bottom
        left: "center",
        padding: [10, 0, 0, 0], // Adds some space from the chart
      },
           grid: { left: "3%", right: "4%", bottom: "10%", containLabel: true },
      xAxis: {
        type: "category",
        data: months,
        axisLabel: {
          interval: 0,
          rotate: 45,
          margin: 10,
        },
      },

      yAxis: { type: "value" },
      series,
    };
  };

  return (
    <Card sx={{ maxWidth: 700, margin: "auto", padding: 2, boxShadow: 3 }}>
      <CardContent>
        <Typography variant="h6" align="center">
          Monthly Approved Leave Trends ({year})
        </Typography>

        <FormControl sx={{ marginBottom: 2, marginTop: 3 }}>
          <Select value={year} onChange={(e) => setYear(e.target.value)}>
            {yearsRange.map((yr) => (
              <MenuItem key={yr} value={yr}>
                {yr}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {loading ? (
          <Typography align="center">Loading...</Typography>
        ) : error ? (
          <Typography color="error" align="center">
            {error}
          </Typography>
        ) : (
          <ReactECharts option={getOption()} style={{ height: 400 }} />
        )}
      </CardContent>
    </Card>
  );
};

export default LeaveTrendChart;
