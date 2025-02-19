import React, { useState, useEffect } from "react";
import { Card, CardContent, Typography, Grid, FormControl, Select, MenuItem } from "@mui/material";
import ReactECharts from "echarts-for-react";

const ManagerDashboard = ({email}) => {
  const [approvalRateData, setApprovalRateData] = useState({ approved: 0, rejected: 0, pending: 0 });
  const [leaveTypeData, setLeaveTypeData] = useState([]);
  const [employeeMonthlyLeaveData, setEmployeeMonthlyLeaveData] = useState({});
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [employeeYearlyLeaveData, setEmployeeYearlyLeaveData] = useState([]);

  const fetchEmployeeYearlyLeaveData = async () => {
    try {
      const response = await fetch(`http://localhost:5001/employee-yearly-leaves?userEmail=${email}`);
      if (!response.ok) throw new Error("Failed to fetch employee yearly leave data");
      
      const data = await response.json();
      setEmployeeYearlyLeaveData(data);
    } catch (error) {
      console.error("Error fetching employee yearly leave data:", error);
    }
  };

  const getEmployeeYearlyLeaveChart = () => {
    if (!Object.keys(employeeYearlyLeaveData).length) return {};
    
    const employees = Object.keys(employeeYearlyLeaveData);
    const years = [...new Set(employees.flatMap(emp => Object.keys(employeeYearlyLeaveData[emp])))].sort();

    const seriesData = years.map(year => ({
      name: year,
      type: "bar",
      stack: "total",
      data: employees.map(emp => employeeYearlyLeaveData[emp][year] || 0),
    }));

    return {
      tooltip: { trigger: "axis" },
      legend: { data: years },
      xAxis: { type: "category", data: employees },
      yAxis: { type: "value" },
      barWidth: (employeeYearlyLeaveData?.employees?.length || 0) < 3 ? 50 : "60%",

      series: seriesData,
    };
  };

  useEffect(() => {
    fetchEmployeeYearlyLeaveData();
  }, []);
  
  useEffect(() => {
    fetchLeaveApprovalRate();
    fetchLeaveTypes();
    fetchEmployeeMonthlyLeaveData();
    if (!selectedEmployee) setSelectedEmployee(Object.keys(employeeLeaveTypes)[0]); // Set default selected employee
  }, [selectedEmployee]);

  const sampleData = {

  employees: [
    { name: "John", leavesTaken: 15, thisYear: 25 },
    { name: "Alice", leavesTaken: 10, thisYear: 20 },
    { name: "Bob", leavesTaken: 12, thisYear: 18 },
    { name: "Emily", leavesTaken: 8, thisYear: 22 },
  ],
  monthlyTrends: [5, 10, 8, 12, 7, 9, 15, 6, 11, 14, 8, 10], // Monthly leave count
};

const employeeLeaveTypes = {
  John: { Sick: 5, Casual: 7, Earned: 3 },
  Alice: { Sick: 2, Casual: 6, Earned: 2 },
  Bob: { Sick: 4, Casual: 5, Earned: 3 },
  Emily: { Sick: 3, Casual: 8, Earned: 2 },
};
  const fetchLeaveApprovalRate = async () => {
    try {
      const response = await fetch(`http://localhost:5001/leave-approval-rate?userRole=Manager&userEmail=${email}`);
      if (!response.ok) throw new Error("Failed to fetch leave requests");

      const data = await response.json();
      setApprovalRateData(data);
    } catch (error) {
      console.error("Error fetching leave approval rate:", error);
    }
  };

  const fetchLeaveTypes = async () => {
    try {
      const response = await fetch(`http://localhost:5001/leave-types?userRole=Manager&userEmail=${email}`);
      if (!response.ok) throw new Error("Failed to fetch leave types");

      const data = await response.json();
      setLeaveTypeData(Object.entries(data).map(([leaveType, statuses]) => ({ leaveType, ...statuses })));
    } catch (error) {
      console.error("Error fetching leave types:", error);
    }
  };

  const fetchEmployeeMonthlyLeaveData = async () => {
    try {
      const response = await fetch(`http://localhost:5001/employee-monthly-leaves?userRole=Manager&userEmail=${email}`);
      if (!response.ok) throw new Error("Failed to fetch employee monthly leave data");

      const data = await response.json();
      setEmployeeMonthlyLeaveData(data);
    } catch (error) {
      console.error("Error fetching employee monthly leave data:", error);
    }
  };

  const getLeaveApprovalRateChart = () => ({
    tooltip: { trigger: "item" },
    series: [
      {
        type: "pie",
        radius: "50%",
        data: [
          { value: approvalRateData.approved, name: "Approved" },
          { value: approvalRateData.rejected, name: "Rejected" },
          { value: approvalRateData.pending, name: "Pending" },
        ],
      },
    ],
  });
  const getLeaveTypeChart = () => {
    const types = leaveTypeData.map((lt) => lt.leaveType);
    const statuses = ["Pending", "Approved", "Rejected"];
    const seriesData = statuses.map((status) => ({
      name: status,
      type: "bar",
      stack: "total",
      data: types.map((type) => leaveTypeData.find((lt) => lt.leaveType === type)?.[status.toLowerCase()] || 0),
    }));
  
    return {
      tooltip: { trigger: "axis" },
      legend: { data: statuses },
      grid: {
        left: "10%",  // Adds more space on the left
        right: "5%",
        bottom: "15%", // Prevents labels from being cut
        containLabel: true, // Ensures labels fit within the chart
      },
      xAxis: { 
        type: "category", 
        data: types,
        axisLabel: {
          interval: 0, 
          rotate: 20, // Rotate labels slightly
          fontSize: 10, // Reduce font size to fit better
          margin: 10, // Space between labels and axis
        },
      },
      yAxis: { 
        type: "value",
        minInterval: 1, // Ensures only whole numbers are displayed
      },       series: seriesData,
    };
  };
  
  
  const getEmployeeMonthlyLeaveChart = () => {
    if (!Object.keys(employeeMonthlyLeaveData).length) return {};
  
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  
    const months = Object.keys(employeeMonthlyLeaveData[Object.keys(employeeMonthlyLeaveData)[0]]).map(
      (month) => monthNames[parseInt(month) - 1] // Convert month number to month name
    );
  
    const employees = Object.keys(employeeMonthlyLeaveData);
  
    const seriesData = employees.map((emp) => ({
      name: emp,
      type: "bar",
      stack: "total",
      data: months.map((month, index) => employeeMonthlyLeaveData[emp][Object.keys(employeeMonthlyLeaveData[emp])[index]] || 0),
    }));
  
    return {
      tooltip: { trigger: "axis" },
      legend: { data: employees },
      xAxis: { type: "category", data: months },
      yAxis: { type: "value" },
      barWidth: (employeeMonthlyLeaveData?.months?.length || 0) < 3 ? 50 : "60%",

      series: seriesData,
    };
  };
 
  
  const getEmployeeLeaveChart = () => ({
    tooltip: { trigger: "axis" },
    xAxis: { type: "category", data: sampleData.employees.map((e) => e.name) },
    yAxis: { type: "value" },
    series: [{ type: "bar", data: sampleData.employees.map((e) => e.leavesTaken), name: "Leaves Taken" }],
  });
  const getHighestLeaveChart = () => {
    if (!Object.keys(employeeYearlyLeaveData).length) return {};
    
    const employees = Object.keys(employeeYearlyLeaveData);
    const years = [...new Set(employees.flatMap(emp => Object.keys(employeeYearlyLeaveData[emp])))].sort();
    
    const topEmployees = employees.map(emp => ({
      name: emp,
      totalLeaves: years.reduce((sum, year) => sum + (employeeYearlyLeaveData[emp][year] || 0), 0),
    })).sort((a, b) => b.totalLeaves - a.totalLeaves).slice(0, 3);

    const seriesData = topEmployees.map(emp => ({
      name: emp.name,
      value: emp.totalLeaves,
    }));

    return {
      tooltip: { trigger: "item" },
      legend: { show: false },
      series: [{
        type: "pie",
        radius: "50%",
        data: seriesData,
        label: { show: true, formatter: "{b}: {c} leaves" },
      }],
    };
  };


  const getMonthlyLeaveChart = () => ({
    tooltip: { trigger: "axis" },
    xAxis: { type: "category", data: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] },
    yAxis: { type: "value" },
    series: [{ type: "line", data: sampleData.monthlyTrends, name: "Leaves Taken" }],
  });

  const getEmployeeLeaveTypeChart = (selectedEmployee) => {
    if (!selectedEmployee || !employeeLeaveTypes[selectedEmployee]) return {};

    const leaveTypes = Object.keys(employeeLeaveTypes[selectedEmployee]);
    const leaveCounts = leaveTypes.map((type) => employeeLeaveTypes[selectedEmployee][type]);

    return {
      tooltip: { trigger: "axis" },
      xAxis: { type: "category", data: leaveTypes },
      yAxis: { type: "value" },
      series: [{ type: "bar", data: leaveCounts, name: "Leaves Taken" }],
    };
  };

  return (
    <Grid container spacing={3} sx={{ padding: 3 }}>
      <Grid item xs={16} md={5}>
        <Card>
          <CardContent>
            <Typography variant="h6">Leave Approval status</Typography>
            <ReactECharts option={getLeaveApprovalRateChart()} style={{ height: 300 }} />
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={16} md={7}>
        <Card>
          <CardContent>
            <Typography variant="h6">Leave Breakdown by Type</Typography>
            <ReactECharts option={getLeaveTypeChart()} style={{ height: 300 }} />
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6">Employee Leave Status by Month</Typography>
            <ReactECharts option={getEmployeeMonthlyLeaveChart()} style={{ height: 300 }} />
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6">Employee Leave Status by Year</Typography>
            <ReactECharts option={getEmployeeYearlyLeaveChart()} style={{ height: 300 }} />
          </CardContent>
        </Card>
      </Grid>


      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6">Top 3 Leave Takers</Typography>
            <ReactECharts option={getHighestLeaveChart()} style={{ height: 300 }} />
          </CardContent>
        </Card>
      </Grid>


      
    </Grid>
  );
};

export default ManagerDashboard;  