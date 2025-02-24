import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, Typography, Grid, FormControl, Select, MenuItem, InputLabel } from "@mui/material";
import ReactECharts from "echarts-for-react";
import fallbackImage from "../assets/img/no_data.jpg";

const ManagerDashboard = ({ email,selectedYear }) => {
  const currentYear = new Date().getFullYear();
  const [yearData, setYearData] = useState([]);
  const [approvalRateData, setApprovalRateData] = useState({});
  const [leaveTypeData, setLeaveTypeData] = useState([]);
  const [monthlyLeaveData, setMonthlyLeaveData] = useState({});
  const [yearlyLeaveData, setYearlyLeaveData] = useState({});

 

  useEffect(() => {
    fetchData(`http://localhost:5001/leave-approval-rate?userEmail=${email}&year=${selectedYear}`, setApprovalRateData);
    fetchData(`http://localhost:5001/leave-types?userEmail=${email}&year=${selectedYear}`, setLeaveTypeData);
    fetchData(`http://localhost:5001/employee-monthly-leaves?userEmail=${email}&year=${selectedYear}`, setMonthlyLeaveData);
    fetchData(`http://localhost:5001/employee-yearly-leaves?userEmail=${email}&year=${selectedYear}`, setYearlyLeaveData);
  }, [selectedYear, email]);

  const fetchData = async (url, setter) => {
    try {
      const response = await fetch(url);
      const text = await response.text();
      try {
        const data = JSON.parse(text);
        setter(data || []);
      } catch (jsonError) {
        console.error("API did not return valid JSON:", text);
        setter([]);
      }
    } catch (error) {
      console.error("Network error:", error);
      setter([]);
    }
  };

  const hasData = () => {
    return approvalRateData && Object.keys(approvalRateData).length > 0 &&
           leaveTypeData && leaveTypeData.length > 0 &&
           monthlyLeaveData && Object.keys(monthlyLeaveData).length > 0 &&
           yearlyLeaveData && Object.keys(yearlyLeaveData).length > 0;
  };
  const getApprovalRateChart = () => {
    const filteredData = [
      { value: approvalRateData?.approved || 0, name: "Approved", itemStyle: { color: "#4CAF50" } },
      { value: approvalRateData?.pending || 0, name: "Pending", itemStyle: { color: "#313896" } },
      { value: approvalRateData?.rejected || 0, name: "Rejected", itemStyle: { color: "#FF5733" } },
    ].filter(item => item.value > 0); // Remove items with 0 value
  
    return {
      title: { 
        text: `Leave Request Status Distribution`, 
        left: "center",
        textStyle: {
          fontSize: 14, // Reduced font size
          fontWeight: "bold"
        }
      },
      tooltip: { trigger: "item" },
      legend: { 
        orient: "horizontal",
        bottom: 0,
        left: "center",
        textStyle: {
          fontSize: 12,
          fontWeight: "bold"
        }
      },
      series: [
        {
          name: "Status",
          type: "pie",
          radius: "75%",
          data: filteredData,
          label: {
            show: true,
            position: "inside",
            formatter: (params) => `${Math.round(params.percent)}%`,
            fontSize: 10,
            color: "#fff",
          },
          labelLine: { show: false },
        },
      ],
    };
  };
  

const getLeaveTypeChart = () => {
  const leaveTypeCount = leaveTypeData.length;
  const barWidth = leaveTypeCount > 5 ? "auto" : 35; // Adjust width dynamically

  return {
    title: { 
      text: `Leave  Breakdown By Type`, 
      left: "center",
      textStyle: {
        fontSize: 14, // Reduce title font size
        fontWeight: "bold"
      }
    },
    tooltip: { 
      trigger: "item",
      formatter: (params) => {
        const leaveType = params.name; 
        return `<b>${leaveType}</b> <br/> ${params.seriesName}: ${params.value}`;
      }
    },
    legend: { 
      data: ["Pending", "Approved", "Rejected"], 
      bottom: 0,
      textStyle: {
        fontSize: 12,
        fontWeight: "bold"
      }
    },
    grid: {
      left: "10%",
      right: "10%",
      bottom: "15%",
      containLabel: true
    },
    xAxis: { 
      type: "category", 
      data: (leaveTypeData || []).map((item) => item.leaveType || "Unknown"),
      axisLabel: {
        rotate: 15, // Try 0 first; increase if labels overlap
        interval: 0, // Ensures every label is displayed
        fontSize: 10,
        fontWeight: "bold"
      }
      
    },
    yAxis: { 
      type: "value", 
      min: 0, 
      max: "dataMax", // Adjusts based on the highest value dynamically
      minInterval: 1, // Ensures only whole numbers appear
      splitNumber: Math.min(10, Math.max(5, Math.ceil(Math.log10(Math.max(...leaveTypeData.map(i => (i.pending || 0) + (i.approved || 0) + (i.rejected || 0) + 1)))))), // Ensures optimal scaling
      axisLabel: {
        fontSize: 10,
        fontWeight: "bold"
      }
    },
    series: [
      { 
        name: "Pending", 
        type: "bar", 
        stack: "total", 
        data: (leaveTypeData || []).map((item) => item.pending || 0), 
        barWidth,
        itemStyle: { color: "#313896" }
      },
      { 
        name: "Approved", 
        type: "bar", 
        stack: "total", 
        data: (leaveTypeData || []).map((item) => item.approved || 0), 
        barWidth,
        itemStyle: { color: "#4CAF50" }
      },
      { 
        name: "Rejected", 
        type: "bar", 
        stack: "total", 
        data: (leaveTypeData || []).map((item) => item.rejected || 0), 
        barWidth,
        itemStyle: { color: "#FF5733" }
      },
    ],
  };
};



  const getMonthlyLeaveChart = () => {
    if (!monthlyLeaveData || Object.keys(monthlyLeaveData).length === 0) {
      return null;
    }
  
    const monthNames = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];
  
    // ✅ Generate distinct random colors using HSL
    const generateDistinctColor = (index) => {
      const hue = (index * 137) % 360; // Spread hues evenly
      return `hsl(${hue}, 70%, 50%)`; // Vibrant colors with good contrast
    };
  
    const employees = Object.keys(monthlyLeaveData);
    const employeeColors = employees.reduce((acc, emp, index) => {
      acc[emp] = generateDistinctColor(index);
      return acc;
    }, {});
  
    // ✅ Compute total leaves per month (for scaling the y-axis)
    const totalLeavesPerMonth = monthNames.map((_, monthIndex) =>
      employees.reduce((sum, emp) => sum + (monthlyLeaveData[emp]?.[String(monthIndex + 1)] || 0), 0)
    );
  
    // ✅ Get correct y-axis max value
    let maxValue = Math.max(...totalLeavesPerMonth);
    let interval = maxValue <= 10 ? 5 : maxValue <= 50 ? 10 : maxValue <= 100 ? 20 : 50;
  
    return {
      title: { text: `Employee Monthly Leaves`, left: "center" },
      tooltip: {
        trigger: "axis", // ✅ Shows all employees' leave details for the hovered month
        axisPointer: {
          type: "shadow", // Highlights the entire bar group
        },
        formatter: (params) => {
          let tooltipContent = `<b>${params[0].name}</b><br/>`;
          params.forEach((item) => {
            tooltipContent += `<span style="color: ${item.color}; font-weight: bold;">● ${item.seriesName}:</span> ${item.value}<br/>`;
          });
          return tooltipContent;
        }
      }
      ,
      legend: { data: employees, bottom: 0 },
      xAxis: {
        type: "category",
        data: monthNames,
        axisLabel: { rotate: 20, interval: 0 }
      },
      yAxis: { 
        type: "value", 
        interval, 
        max: Math.ceil(maxValue / interval) * interval
      },
      series: employees.map((emp) => ({
        name: emp,
        type: "bar",
        stack: "total",
        data: monthNames.map((_, monthIndex) => monthlyLeaveData[emp]?.[String(monthIndex + 1)] || 0),
        itemStyle: { color: employeeColors[emp] },
      })),
    };
  };
  const getHighestLeaveChart = () => {
    if (!yearlyLeaveData || Object.keys(yearlyLeaveData).length === 0) return {};
  
    // Extract employees and their total leave counts
    const topEmployees = Object.entries(yearlyLeaveData)
      .map(([emp, leaves]) => ({ name: emp, totalLeaves: leaves }))
      .sort((a, b) => b.totalLeaves - a.totalLeaves) // Sort in descending order
      .slice(0, 3); // Keep only the top 3
  
    const seriesData = topEmployees.map(emp => ({
      name: emp.name,
      value: emp.totalLeaves,
    }));
  
    // ✅ Assign custom colors (Pink, Light Green, and a third distinct color)
    const customColors = ["#FF69B4", "#90EE90", "#FFA500"]; // Pink, Light Green, Orange
  
    return {
      title: { text: "Top 3 Leave Takers", left: "center" },
      tooltip: { trigger: "item" },
      legend: { show: false },
      series: [
        {
          type: "pie",
          radius: "50%",
          data: seriesData,
          label: { show: true, formatter: "{b}: {c} leaves" },
          itemStyle: {
            color: (params) => customColors[params.dataIndex], // Assign colors dynamically
          },
        },
      ],
    };
  };
  const getYearlyLeaveChart = () => {
    const employeeCount = Object.keys(yearlyLeaveData).length;
    const barWidth = employeeCount > 5 ? "auto" : 20; // Fixed width for <= 5 employees, auto-adjust after
  
    return {
      title: { text: `Total Leaves Taken By Each Employee`, left: "center" },
      tooltip: { trigger: "axis" },
      xAxis: { type: "category", data: Object.keys(yearlyLeaveData) },
      yAxis: {
        type: "value",
        minInterval: 1, // ✅ Ensures whole number steps
        axisLabel: {
          formatter: (value) => Math.round(value), // ✅ Display only whole numbers
        },
      },
      series: [
        {
          name: "Total Leaves",
          type: "bar",
          data: Object.values(yearlyLeaveData),
          barWidth: barWidth, // Dynamically set bar width
          itemStyle: { color: "#FF69B4" }, // ✅ Set bars to pink color
        },
      ],
    };
  };
  

  return (
    <Grid container spacing={3} sx={{ padding: 3 }}>
     
      {hasData() ? (
        <>
          <Grid item xs={12} md={4}><Card><CardContent><ReactECharts option={getApprovalRateChart()} /></CardContent></Card></Grid>
          <Grid item xs={12} md={8}><Card><CardContent><ReactECharts option={getLeaveTypeChart()} /></CardContent></Card></Grid>
          <Grid item xs={12} md={6}><Card><CardContent><ReactECharts option={getMonthlyLeaveChart()} /></CardContent></Card></Grid>
        
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <ReactECharts option={getHighestLeaveChart()} style={{ height: 300 }} />
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} md={12}><Card><CardContent><ReactECharts option={getYearlyLeaveChart()} /></CardContent></Card></Grid>


        </>
      ) : (
        <Grid item xs={12} style={{ textAlign: "center" }}>
          <img src={fallbackImage} alt="No Data Available" style={{ maxWidth: "100%" }} />
          <Typography variant="h6">No data available for the selected year.</Typography>
        </Grid>
      )}
    </Grid>
  );
};

export default ManagerDashboard;   



