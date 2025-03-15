import React, { useEffect, useState } from "react";
import { PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import { Card, CardContent, Typography } from "@mui/material";
import { useManagerContext } from "../context/ManagerContext";

const LeaveBalanceChart = ({ email, year }) => {
  const [leaveData, setLeaveData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { gender } = useManagerContext();

  useEffect(() => {
    const fetchLeaveBalance = async () => {
      if (!email || !year || !gender) return; // ✅ Ensure all values exist before API call

      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `http://localhost:5001/leave-total?email=${email}&year=${year}&gender=${gender}`
        );

        if (!response.ok) {
          throw new Error(`Error ${response.status}: Failed to fetch leave data`);
        }

        const data = await response.json();
        setLeaveData(data);
      } catch (error) {
        console.error("Error fetching leave balance:", error);
        setError(error.message || "Failed to load leave balance.");
      } finally {
        setLoading(false);
      }
    };

    fetchLeaveBalance();
  }, [email, year, gender]); // ✅ Added `gender` as a dependency

  const pieData = leaveData
    ? [
        { name: "Total Leaves", value: leaveData.totalLeaves, color: "#8884d8" },
        { name: "Used Leaves", value: leaveData.usedLeaves, color: "#ff7300" },
        { name: "Available Leaves", value: leaveData.availableLeaves, color: "#82ca9d" },
      ]
    : [];

  return (
    <Card sx={{ maxWidth: 800, margin: "auto", boxShadow: 3, backgroundColor: "#F4F5F7" }}>
      <CardContent>
        <Typography variant="h6" align="center" gutterBottom>
          Leave Summary for {year}
        </Typography>
        {loading ? (
          <Typography align="center">Loading...</Typography>
        ) : error ? (
          <Typography color="error" align="center">{error}</Typography>
        ) : pieData.length === 0 ? (
          <Typography align="center">No data available for {year}.</Typography>
        ) : (
          <PieChart width={400} height={350}>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={5}
              dataKey="value"
              label
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        )}
      </CardContent>
    </Card>
  );
};

export default LeaveBalanceChart;
