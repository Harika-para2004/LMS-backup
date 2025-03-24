import React, { useState, useEffect, useMemo } from "react";
import { formatDate } from "../utils/dateUtlis";
import {
  Button,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
  Stack,
  Pagination,
} from "@mui/material";
import AdminAnalytics from "./AdminAnalytics";
const backendUrl = import.meta.env.VITE_BACKEND_URL;

const ReportsAdmin = () => {
  const [reports, setReports] = useState([]);
  const [project, setProject] = useState("");
  const [search, setSearch] = useState("");
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [years, setYears] = useState([]);

  const currentYear = new Date().getFullYear();

  const yearsRange = useMemo(() => [...years].sort((a, b) => b - a), [years]); 

  useEffect(() => {
    const fetchYears = async () => {
      try {
        const response = await fetch(`${backendUrl}/years`); // Adjust API URL if needed
        const data = await response.json();
        setYears(data.years);
      } catch (error) {
        console.error("Error fetching years:", error);
      }
    };

    fetchYears();
  }, []);

  useEffect(() => {
    fetchReports();
  }, [project, search, selectedYear]); // Added selectedYear

  const fetchReports = async () => {
    try {
      const response = await fetch(
        `${backendUrl}/reports-admin?project=${project}&search=${search}&year=${selectedYear}`
      );
      if (!response.ok) throw new Error("Failed to fetch reports");
      const data = await response.json();
      setReports(data);
    } catch (error) {
      console.error("Error fetching reports:", error);
    }
  };

  const formatName = (str) =>
    str
      ? str.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase())
      : "N/A";

  const sortedReports = reports
    .flatMap((report) =>
      report.leaves.length > 0
        ? report.leaves.map((leave) => ({
            empname: formatName(report.empname),
            empid: report.empid,
            role:report.role,
            email: report.email || "N/A",
            project: formatName(report.project),
            leaveType: formatName(leave.leaveType),
            startDate: formatDate(leave.startDate), // Convert to Date for sorting
            endDate: formatDate(leave.endDate),
            duration: leave.duration,
          }))
        : [
            {
              empname: formatName(report.empname),
              empid: report.empid,
              role:report.role,
              email: report.email || "N/A",
              project: formatName(report.project),
              leaveType: "N/A",
              startDate: new Date(0), // Earliest date for proper sorting
              endDate: "N/A",
              duration: "No Leaves",
            },
          ]
    )
    .sort((a, b) => {
      if (a.empname !== b.empname) return a.empname.localeCompare(b.empname); // Sort by name first
      return a.startDate - b.startDate; // Then sort by startDate within each employee
    })
    .filter(
      (report) =>
        (report.empname.toLowerCase().includes(search.toLowerCase()) ||
          report.email.toLowerCase().includes(search.toLowerCase()) ||
          report.project.toLowerCase().includes(search.toLowerCase()) ||
          report.empid.toString().includes(search)
        )

        );
  // .map((report) => ({
  //   ...report,
  //   startDate: formatDate(report.startDate), // Convert back to dd/mm/yyyy for display
  // }));

  const [currentPage, setCurrentPage] = useState(1);
  const employeesPerPage = 15;

  // Calculate the indexes for slicing the data
  const indexOfLastEmployee = currentPage * employeesPerPage;
  const indexOfFirstEmployee = indexOfLastEmployee - employeesPerPage;
  const currentReports = sortedReports.slice(
    indexOfFirstEmployee,
    indexOfLastEmployee
  );
  // Handle page change
  const handlePageChange = (event, value) => {
    setCurrentPage(value);
  };

  const exportExcel = async () => {
    const url = `${backendUrl}/reports/export-excel`;

    // ✅ Ensure search filter is applied before sending data
    const filteredReports = reports.filter(
      (report) =>
        report.empname.toLowerCase().includes(search.toLowerCase()) ||
        report.email.toLowerCase().includes(search.toLowerCase()) ||
        report.project.toLowerCase().includes(search.toLowerCase()) ||
        report.empid.toString().includes(search)

    );

    const postData = {
      year: selectedYear,
      reports: filteredReports, // Send only searched reports
    };

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(postData),
      });

      if (!response.ok) throw new Error("Failed to export file");

      const blob = await response.blob();
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.setAttribute("download", "leave_reports.xlsx");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error exporting Excel:", error);
    }
  };

  const exportFile = async (url, filename) => {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to export file");
      const blob = await response.blob();
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error(`Error exporting ${filename}:`, error);
    }
  };
  return (
    <div className="reports-container">
      <div className="filters">
        <h2 className="content-heading">Annual Approved Leave Summary</h2>

        <div  >
        <Button
            onClick={() => setShowAnalytics(!showAnalytics)}
            variant="outlined"
            sx={{
              color: "#313896",
              border: "1px solid #313896" ,
              fontSize: "13px",
              textTransform: "none",
              height:"40px",
              mr:2,
            }}
            // className="btn-analytics"
          >
            {showAnalytics ? "Show Reports" : "Show Analytics"}
          </Button>
          <FormControl
            sx={{
              minWidth: 85,
              bgcolor: "white",
              borderRadius: 1,
              boxShadow: "0px 2px 6px rgba(159, 50, 178, 0.2)", // Softer purple glow for elegance
              "& .MuiOutlinedInput-notchedOutline": { border: "none" }, // Removes default border
            }}
          >
            <Select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              displayEmpty
              sx={{
                fontSize: "13px",
                fontWeight: 500,
                color: "#fff",
                background: "linear-gradient(135deg, #9F32B2 0%, #6A1B9A 100%)", // Elegant gradient
                borderRadius: 1,
                height: 40, // Slightly reduced height for compact look
                px: 1.2, // Well-balanced padding
                bgcolor: "#fafafa", // Softer background
                transition: "all 0.3s ease-in-out",
                "&:hover": { bgcolor: "#f0f0f0" },
                "&.Mui-focused": {
                  background:
                    "linear-gradient(135deg, #9F32B2 0%, #6A1B9A 100%)", // Elegant gradient
                  boxShadow: "0px 3px 8px rgba(159, 50, 178, 0.3)", // Elegant focused effect
                },
              }}
            >
              {yearsRange.map((year) => (
                <MenuItem
                  key={year}
                  value={year}
                  sx={{
                    fontSize: "12px",
                    px: 1.2,
                    "&:hover": { bgcolor: "#f5e9f7" }, // Subtle hover effect
                  }}
                >
                  {year}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          
        </div>
      </div>

      {/* {!showAnalytics && (
        <div className="table-container">
          {showAnalytics ? <AdminAnalytics year={selectedYear} /> : null}

          <h2 className="table-heading">
            Export the Annual Approved Leave Data
          </h2> */}

      {showAnalytics ? (
        <AdminAnalytics year={selectedYear} />
      ) : (
        <div className="table-container" id="table-container">
          {!showAnalytics && (
            <div className="export-container">
              <h2 className="">Export the Annual Approved Leave Data</h2>
              <div className="search-container">
                <input
                  type="text"
                  className="search-input"
                  placeholder="Search by name, project or ID"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <div className="export-btn">
                <button onClick={exportExcel} className="btn-excel">
                  Export Excel
                </button>
              </div>
            </div>
          )}

          <table>
            <thead>
              <tr>
                <th>Employee</th>
                <th>Employee ID</th>
                <th>Project</th>
                <th>Leave Type</th>
                <th>From</th>
                <th>To</th>
                <th>No Of Days</th>
              </tr>
            </thead>
            <tbody>
              {currentReports.length > 0 ? (
                currentReports
                  .filter((report) => report.role !== "Admin")
                  .map((report, index) => (
                    <tr key={index}>
                      <td>{report.empname || ""}</td>
                      <td>{report.empid||""}</td>
                      <td>{report.project||""}</td>
                      <td>{report.leaveType||""}</td>
                      <td>{report.startDate||""}</td>
                      <td>{report.endDate||""}</td>
                      <td>{report.duration||""}</td>
                    </tr>
                  ))
              ) : (
                <tr>
                  <td className="no-reports" colSpan="8">
                    No reports found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <Stack
            spacing={2}
            sx={{ mt: 2, display: "flex", alignItems: "center" }}
          >
            <Pagination
              count={Math.ceil(sortedReports.length / employeesPerPage)}
              page={currentPage}
              onChange={handlePageChange}
              color="primary"
            />
          </Stack>
        </div>
      )}
    </div>
  );
};

export default ReportsAdmin;
