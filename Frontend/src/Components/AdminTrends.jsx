import React, { useEffect, useState } from "react";
import axios from "axios";
import { Box, TextField, Typography } from "@mui/material";
import ReactECharts from "echarts-for-react";

const LeaveTrendsChart = () => {
    const [year, setYear] = useState(new Date().getFullYear());
    const [data, setData] = useState([]);

    useEffect(() => {
        if (!year || isNaN(year) || year < 2000) return;
        const fetchTrends = async () => {
            try {
                const res = await axios.get(`/api/leaves/trends?year=${year}`);
                setData(res.data);
            } catch (error) {
                console.error("Error fetching trends:", error);
            }
        };
        fetchTrends();
    }, [year]);

    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    // Transform data for ECharts
    const transformedData = {};
    const statuses = ["Pending", "Approved", "Rejected"];
    const leaveTypes = [...new Set(data.map(item => item._id.leaveType))];

    data.forEach(({ _id: { month, leaveType, status }, totalDays }) => {
        if (!transformedData[leaveType]) {
            transformedData[leaveType] = {};
        }
        if (!transformedData[leaveType][status]) {
            transformedData[leaveType][status] = Array(12).fill(0);
        }
        transformedData[leaveType][status][month - 1] = totalDays;
    });

    const series = leaveTypes.flatMap((type) =>
        statuses.map((status) => ({
            name: `${type} - ${status}`,
            type: "bar",
            stack: type,
            data: transformedData[type]?.[status] || Array(12).fill(0)
        }))
    );

    const options = {
        title: {
            text: `Leave Trends for ${year}`,
            left: "center",
            textStyle: { fontSize: 18 }
        },
        tooltip: { trigger: "axis" },
        legend: { bottom: 0, data: series.map(s => s.name) },
        grid: { left: "3%", right: "4%", bottom: "10%", containLabel: true },
        xAxis: { type: "category", data: months },
        yAxis: { type: "value", name: "Days of Leave" },
        series
    };

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h6" align="center">Leave Trends</Typography>
            <TextField
                label="Year"
                type="number"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                sx={{ mb: 2, width: "200px" }}
                inputProps={{ min: "2000", step: "1" }}
            />
            <ReactECharts option={options} style={{ height: 400 }} />
        </Box>
    );
};

export default LeaveTrendsChart;
