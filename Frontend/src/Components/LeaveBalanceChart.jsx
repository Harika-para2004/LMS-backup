import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Card, CardContent, Typography, Grid, MenuItem, Select, CircularProgress, Box, Divider, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, FormControl } from "@mui/material";
import ReactECharts from "echarts-for-react";

const LeaveBalanceChart = ({ email }) => {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [leaveBalance, setLeaveBalance] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const yearsRange = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 15 }, (_, i) => currentYear - i);
  }, []);

  useEffect(() => {
    if (!email || !year) return;
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await axios.get(`http://localhost:5001/leave-balance/${email}/${year}`);
        setLeaveBalance(res.data);
      } catch (err) {
        console.error("Error fetching leave balance:", err);
        setError("Failed to load leave balance.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [email, year]);

  const getChartOption = (title, data) => ({
    title: { text: title, left: "center", textStyle: { fontSize: 16, fontWeight: "bold" } },
    tooltip: { trigger: "item" },
    // legend: { bottom: "5%", left: "center", itemGap: 10 },
    series: [
      {
        type: "pie",
        radius: ["45%", "70%"],
        avoidLabelOverlap: false,
        label: {
          show: true,
          position: "inside",
          formatter: "{c}", // Only number inside slices
          fontSize: 12,
          fontWeight: "bold",
          color: "#fff",
        },
        emphasis: { label: { show: true, fontSize: "14", fontWeight: "bold" } },
        labelLine: { show: false }, // Hide connecting lines for cleaner look
        data,
      },
    ],
  });

  if (loading)
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="300px">
        <CircularProgress />
      </Box>
    );

  if (error)
    return (
      <Typography color="error" align="center" sx={{ mt: 2, fontSize: "1rem", fontWeight: "bold" }}>
        {error}
      </Typography>
    );

  if (!leaveBalance) return null;

  const totalLeavesData = Object.entries(leaveBalance).map(([type, data]) => ({
    name: type,
    value: data.totalLeaves,
  }));

  const availableLeavesData = Object.entries(leaveBalance).map(([type, data]) => ({
    name: type,
    value: data.availableLeaves,
  }));

  return (
    <Card sx={{ maxWidth: 800, margin: "auto", padding: 3, boxShadow: 3, borderRadius: 3, backgroundColor: "#FFFFFF" }}>
      <CardContent>
        {/* <Typography variant="h5" align="center" sx={{ fontWeight: "bold", mb: 2 }}>
          Leave Balance Overview
        </Typography> */}
        <FormControl  sx={{ marginBottom: 2,marginTop:3 }} >
          <Select value={year} onChange={(e) => setYear(e.target.value)}>
            {yearsRange.map((yr) => (
              <MenuItem key={yr} value={yr}>{yr}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <Typography variant="h6" align="center" sx={{ fontWeight: "bold", mb: 2 }}>
          Leave Summary
        </Typography>
        <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: 1 }}>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: "#E3F2FD" }}>
                <TableCell sx={{ fontWeight: "bold" }}>Leave Type</TableCell>
                <TableCell sx={{ fontWeight: "bold" }} align="center">
                  Total Leaves
                </TableCell>
                <TableCell sx={{ fontWeight: "bold" }} align="center">
                  Available Leaves
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {Object.entries(leaveBalance).map(([type, data]) => (
                <TableRow key={type}>
                  <TableCell>{type}</TableCell>
                  <TableCell align="center">{data.totalLeaves}</TableCell>
                  <TableCell align="center">{data.availableLeaves}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
};

export default LeaveBalanceChart;
