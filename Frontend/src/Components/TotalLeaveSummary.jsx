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
      if (!email || !year || !gender) return;

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
  }, [email, year, gender]);

  if (!leaveData) return null;

  const total = leaveData.usedLeaves + leaveData.availableLeaves;

  const pieData = [
    {
      name: "Used Leaves",
      value: leaveData.usedLeaves,
      percentage: ((leaveData.usedLeaves / total) * 100).toFixed(1),
      color: "#ff7300",
    },
    {
      name: "Available Leaves",
      value: leaveData.availableLeaves,
      percentage: ((leaveData.availableLeaves / total) * 100).toFixed(1),
      color: "#82ca9d",
    },
  ];

  return (
    <Card sx={{ maxWidth: 800, margin: "auto", boxShadow: 3, backgroundColor: "#F4F5F7" }}>
      <CardContent>
        <Typography variant="h6" align="center" gutterBottom>
          Leave Balance
        </Typography>
        {loading ? (
          <Typography align="center">Loading...</Typography>
        ) : error ? (
          <Typography color="error" align="center">{error}</Typography>
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
              label={({ value, percentage }) => ` ${value} (${Number(percentage)}%)`}
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value, name, props) => [`${value} (${Number(props.payload.percentage)}%)`, name]}
            />
            <Legend />
          </PieChart>
        )}
      </CardContent>
    </Card>
  );
};

export default LeaveBalanceChart;
