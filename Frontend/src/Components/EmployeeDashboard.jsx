import { useEffect, useState } from "react";
import ReactECharts from "echarts-for-react";
import { Card, CardContent, Typography, Grid } from "@mui/material";
import axios from "axios";

const EmployeeDashboard = ({ email }) => {
  const [monthlyTrends, setMonthlyTrends] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const trendsResponse = await axios.get(`http://localhost:5001/leave-trends/${email}`);
        const typesResponse = await axios.get(`http://localhost:5001/leave-types/${email}`);

        setMonthlyTrends(Array.isArray(trendsResponse.data) ? trendsResponse.data : []);
        setLeaveTypes(Array.isArray(typesResponse.data) ? typesResponse.data : []);
      } catch (error) {
        console.error("Error fetching leave stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [email]);

  console.log("monthlyTrends:",monthlyTrends)

  // 🟢 Monthly Leave Trends - Bar Chart
  const monthlyTrendsOptions = {
    title: { text: "Monthly Leave Trends", left: "center" },
    tooltip: { trigger: "axis" },
    xAxis: { type: "category", data: monthlyTrends.map((item) => `${item._id.month}/${item._id.year}`) },
    yAxis: { type: "value" },
    series: [{ name: "Leaves Taken", type: "bar", data: monthlyTrends.map((item) => item.totalLeaves) }],
  };

  // 🟢 Leave Type Distribution - Pie Chart
  const leaveTypesOptions = {
    title: { text: "Leave Type Distribution", left: "center" },
    tooltip: { trigger: "item" },
    legend: { bottom: 0 },
    series: [
      {
        name: "Leave Types",
        type: "pie",
        radius: "50%",
        data: leaveTypes.map((item) => ({ value: item.count, name: item._id })),
      },
    ],
  };

  return (
    <Grid container spacing={3} sx={{ p: 3 }}>
      {/* Monthly Trends Chart */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            {/* <Typography variant="h6" gutterBottom>Monthly Leave Trends</Typography> */}
            {loading ? (
              <Typography>Loading...</Typography>
            ) : monthlyTrends.length === 0 ? (
              <Typography>No leave trends available.</Typography>
            ) : (
              <ReactECharts option={monthlyTrendsOptions} />
            )}
          </CardContent>
        </Card>
      </Grid>

      {/* Leave Type Chart */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            {/* <Typography variant="h6" gutterBottom>Leave Type Distribution</Typography> */}
            {loading ? (
              <Typography>Loading...</Typography>
            ) : leaveTypes.length === 0 ? (
              <Typography>No leave type data available.</Typography>
            ) : (
              <ReactECharts option={leaveTypesOptions} />
            )}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

export default EmployeeDashboard;
