import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Card,
  CardContent,
  Typography,
  Grid,
  MenuItem,
  Select,
  CircularProgress,
  Box,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  FormControl,
} from "@mui/material";
import ReactECharts from "echarts-for-react";

const LeaveBalanceChart = ({ email, year, years }) => {
  const currentYear = new Date().getFullYear();
  const [leaveBalance, setLeaveBalance] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [gender, setGender] = useState("");
  const [maxCasual, setMaxCasual] = useState();
  console.log(years.includes(year - 1));

  const fetchGenderByEmail = async (email) => {
    try {
      const response = await fetch(
        `http://localhost:5001/user/gender?email=${encodeURIComponent(email)}`
      );
      const data = await response.json();

      if (response.ok) {
        console.log("Gender:", data.gender);
        setGender(data.gender);
      } else {
        console.error("Error:", data.error);
      }
    } catch (error) {
      console.error("Fetch error:", error);
    }
  };

  useEffect(() => {
    if (email) {
      fetchGenderByEmail(email);
    }
  }, [email]);

  const fetchPolicies = async () => {
    try {
      const response = await fetch(`http://localhost:5001/api/leave-policies`);
      const data = await response.json();

      if (response.ok) {
        const casualLeave = data.data.find(
          (leave) => leave.leaveType === "Casual Leave"
        );

        const maxAllowedLeaves = casualLeave
          ? casualLeave.maxAllowedLeaves
          : null;
          setMaxCasual(maxAllowedLeaves);
      } else {
        console.error("Error:", data.error);
      }
    } catch (error) {
      console.error("Fetch error:", error);
    }
  };

  useEffect(() => {
    fetchPolicies();
  }, []);

  const [totalMatLeaves, setTotalMatLeaves] = useState(0);

  useEffect(() => {
    const fetchMaternityLimit = async () => {
      try {
        const response = await fetch("http://localhost:5001/maternity-limit", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email,
            leaveType: "Maternity Leave",
          }),
        });

        const data = await response.json();
        if (data.totalSplits >= 2) {
          setTotalMatLeaves(84);
        }
      } catch (error) {
        console.error("Error getting maternity limit:", error);
      }
    };

    fetchMaternityLimit();
  }, [email]); // Add dependencies if they change

  // const [prevleave, setPrevleave] = useState([]);
  // const [currleave, setCurrleave] = useState([]);
  // const isCasualForFreshYear =
  //   (Array.isArray(prevleave) &&
  //   prevleave.length === 0) && ( Array.isArray(currleave) &&
  //   currleave.length === 0 )&&
  //   years.includes(year - 1);
  // console.log("isCasualForFreshYear", isCasualForFreshYear);
  // useEffect(() => {
  //   if (!email || !year) return;
  //   const fetchData = async () => {
  //     setLoading(true);
  //     setError(null);
  //     if (years.includes(year - 1)) {
  //       try {
  //         const res1 = await axios.get(
  //           `http://localhost:5001/get-leave/${email}/${year - 1}`
  //         );
  //         const res2 = await axios.get(
  //           `http://localhost:5001/get-leave/${email}/${year }`
  //         );
  //         setPrevleave(res1.data);
  //         setCurrleave(res2.data);
  //       } catch (err) {
  //         console.error("Error fetching leave balance:", err);
  //         setError("Failed to load leave balance.");
  //       } finally {
  //         setLoading(false);
  //       }
  //     }
  //   };

  //   fetchData();
  // }, [year]);

  const [prevleave, setPrevleave] = useState([]);
  const [currleave, setCurrleave] = useState([]);
  const [isCasualForFreshYear, setIsCasualForFreshYear] = useState(false);

  useEffect(() => {
    if (!email || !year) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const res1 = await axios.get(
          `http://localhost:5001/get-leave/${email}/${year - 1}`
        );
        const res2 = await axios.get(
          `http://localhost:5001/get-leave/${email}/${year}`
        );
        setPrevleave(res1.data);
        setCurrleave(res2.data);
      } catch (err) {
        console.error("Error fetching leave balance:", err);
        setError("Failed to load leave balance.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [year]);

  // ✅ Compute isCasualForFreshYear *after* fetching data
  useEffect(() => {
    setIsCasualForFreshYear(
      Array.isArray(prevleave) &&
        prevleave.length === 0 &&
        Array.isArray(currleave) &&
        currleave.length === 0 &&
        years.includes(year - 1)
    );
  }, [prevleave, currleave, year]);

  console.log("isCasualForFreshYear", isCasualForFreshYear);

  console.log("prevleave", currleave);

  useEffect(() => {
    if (!email || !year) return;
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await axios.get(
          `http://localhost:5001/leave-balance/${email}/${year}`
        );
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
    title: {
      text: title,
      left: "center",
      textStyle: { fontSize: 16, fontWeight: "bold" },
    },
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
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        height="300px"
      >
        <CircularProgress />
      </Box>
    );

  if (error)
    return (
      <Typography
        color="error"
        align="center"
        sx={{ mt: 2, fontSize: "1rem", fontWeight: "bold" }}
      >
        {error}
      </Typography>
    );

  if (!leaveBalance) return null;

  const totalLeavesData = Object.entries(leaveBalance).map(([type, data]) => ({
    name: type,
    value: data.totalLeaves,
  }));

  const availableLeavesData = Object.entries(leaveBalance).map(
    ([type, data]) => ({
      name: type,
      value: data.availableLeaves,
    })
  );
  const filteredLeaveBalance = Object.fromEntries(
    Object.entries(leaveBalance).filter(
      ([type]) =>
        !(
          (gender === "Male" && type === "Maternity Leave") ||
          (gender === "Female" && type === "Paternity Leave")
        )
    )
  );

  // Prioritize Casual Leave and Sick Leave
  const sortedLeaveBalance = Object.fromEntries([
    ...Object.entries(filteredLeaveBalance).filter(
      ([type]) => type === "Casual Leave"
    ),
    ...Object.entries(filteredLeaveBalance).filter(
      ([type]) => type === "Sick Leave"
    ),
    ...Object.entries(filteredLeaveBalance).filter(
      ([type]) => type !== "Casual Leave" && type !== "Sick Leave"
    ),
  ]);

  return (
    <Card
      sx={{
        maxWidth: 800,
        height: 400,
        overflowY: "auto",
        margin: "auto",
        padding: 2,
        boxShadow: 3,
        borderRadius: 2,
        backgroundColor: "#F4F5F7",
      }}
    >
      <CardContent>
        {/* <Typography variant="h5" align="center" sx={{ fontWeight: "bold", mb: 2 }}>
          Leave Balance Overview
        </Typography> */}

        <Typography
          variant="h6"
          align="center"
          sx={{ fontWeight: "bold", mb: 2 }}
        >
          Leave Summary
        </Typography>
        <TableContainer
          component={Paper}
          sx={{
            borderRadius: 1,
            boxShadow: 1,
            maxHeight:
              Object.keys(sortedLeaveBalance).length > 7 ? 600 : "none",
            overflowY:
              Object.keys(sortedLeaveBalance).length > 7 ? "auto" : "hidden",
          }}
        >
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: "#ccc", height: "40px" }}>
                <TableCell sx={{ fontWeight: "bold", padding: "2px 4px" }}>
                  Leave Type
                </TableCell>
                <TableCell
                  sx={{ fontWeight: "bold", padding: "2px 4px" }}
                  align="center"
                >
                  Total
                </TableCell>
                <TableCell
                  sx={{ fontWeight: "bold", padding: "2px 4px" }}
                  align="center"
                >
                  Available
                </TableCell>
                <TableCell
                  sx={{ fontWeight: "bold", padding: "2px 4px" }}
                  align="center"
                >
                  Used
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {Object.entries(sortedLeaveBalance).map(([type, data]) => (
                <TableRow key={type} sx={{ height: "30px" }}>
                  {" "}
                  {/* Reduce row height */}
                  <TableCell sx={{ padding: "8px 8px" }}>{type}</TableCell>
                  <TableCell sx={{ padding: "8px 8px" }} align="center">
                    {/* {data.totalLeaves === null ? "-" : data.totalLeaves} */}
                    {type === "Casual Leave"
                      ? isCasualForFreshYear
                        ? data.carrylimit + maxCasual
                        : data.totalLeaves ?? "-"
                      : data.totalLeaves ?? "-"}
                  </TableCell>
                  <TableCell sx={{ padding: "8px 8px" }} align="center">
                    {/* {data.totalLeaves === null ? "-" : data.availableLeaves} */}
                    {type === "Casual Leave"
                      ? isCasualForFreshYear
                        ? data.carrylimit + maxCasual
                        : data.availableLeaves ?? "-"
                      : data.availableLeaves == 0 ||
                        data.availableLeaves == null
                      ? "-"
                      : data.availableLeaves}
                  </TableCell>
                  <TableCell sx={{ padding: "8px 8px" }} align="center">
                    {data.usedLeaves}
                  </TableCell>
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