import React, { useState, useEffect, useMemo } from "react";
import { formatDate } from "../utils/dateUtlis";
import { Button, FormControl, Select, MenuItem, InputLabel } from "@mui/material";
import AdminAnalytics from "./AdminAnalytics";

const ReportsAdmin = () => {
  const [reports, setReports] = useState([]);
  const [project, setProject] = useState("");
  const [search, setSearch] = useState("");
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const yearsRange = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 17 }, (_, i) => currentYear - i + 1);
  }, []);
  
  

  useEffect(() => {
    fetchReports();
  }, [project, search, selectedYear]); // Added selectedYear

  const fetchReports = async () => {
    try {
      const response = await fetch(
        `http://localhost:5001/reports-admin?project=${project}&search=${search}&year=${selectedYear}`
      );
      if (!response.ok) throw new Error("Failed to fetch reports");
      const data = await response.json();
      setReports(data);
    } catch (error) {
      console.error("Error fetching reports:", error);
    }
  };

 
  const formatName = (str) =>
    str ? str.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase()) : "N/A";

  const sortedReports = reports
  .flatMap((report) =>
    report.leaves.length > 0
      ? report.leaves.map((leave) => ({
          empname: formatName(report.empname),
          empid: report.empid,
          email: report.email || "N/A",
          project: formatName(report.project),
          leaveType: formatName(leave.leaveType),
          startDate: new Date(leave.startDate), // Convert to Date for sorting
          endDate: formatDate(leave.endDate),
          status: formatName(leave.status),
        }))
      : [
          {
            empname: formatName(report.empname),
            empid: report.empid,
            email: report.email || "N/A",
            project: formatName(report.project),
            leaveType: "N/A",
            startDate: new Date(0), // Earliest date for proper sorting
            endDate: "N/A",
            status: "No Leaves",
          },
        ]
  )
  .sort((a, b) => {
    if (a.empname !== b.empname) return a.empname.localeCompare(b.empname); // Sort by name first
    return a.startDate - b.startDate; // Then sort by startDate within each employee
  })
  .filter((report) => 
    report.email !== "admin@gmail.com" &&
    (
      report.empname.toLowerCase().includes(search.toLowerCase()) ||
      report.email.toLowerCase().includes(search.toLowerCase()) ||
      report.project.toLowerCase().includes(search.toLowerCase()) ||
      report.empid.toString().includes(search)
    )
  )
  .map((report) => ({
    ...report,
    startDate: formatDate(report.startDate), // Convert back to dd/mm/yyyy for display
  }));

  const exportExcel = async () => {
    const url = "http://localhost:5001/reports/export-excel";
  

  
    // ✅ Ensure search filter is applied before sending data
    const filteredReports = reports.filter((report) =>
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
<h2 className="content-heading">Annual Approved Leave Summary</h2>

      <div className="filters">
      {!showAnalytics && (
 <input
 type="text"
 placeholder="Search by name,project, or ID"
 value={search}
 onChange={(e) => setSearch(e.target.value)}
/>
)}

        {/* ✅ Year Selection Dropdown */}
        <FormControl>
          <InputLabel id="select-year-label">Select Year</InputLabel>
          <Select
            labelId="select-year-label"
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            label="Select Year"
          >
            {yearsRange.map((yr) => (
              <MenuItem key={yr} value={yr}>
                {yr}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <div className="export-buttons" id="export-buttons1">
          {!showAnalytics && (
            <button onClick={exportExcel} className="btn-excel">
            Export Excel
          </button>
          )}
        </div>

        {/* ✅ Toggle Reports Table & Analytics View */}
        <Button
          onClick={() => setShowAnalytics((prev) => !prev)}
          sx={{ textTransform: "none" }}
          className="btn-analytics"
        >
          {showAnalytics ? "Show Reports" : "Show Analytics"}
        </Button>
      </div>

      {/* ✅ Show AdminAnalytics and pass selectedYear as prop */}
      {showAnalytics ? <AdminAnalytics year={selectedYear} /> : null}

      {/* ✅ Show Reports Table only if showAnalytics is false */}
      {!showAnalytics && (
        <div className="table-container">
            <h2 className="table-heading">Export the Annual Approved Leave Data</h2>

          <table>
            <thead>
              <tr>
                <th>Employee</th>
                <th>Employee ID</th>
                <th>Project</th>
                <th>Leave Type</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {sortedReports.length > 0 ? (
                sortedReports
                  .filter((report) => report.email !== "admin@gmail.com")
                  .map((report, index) => (
                    <tr key={index}>
                      <td>{report.empname}</td>
                      <td>{report.empid}</td>
                      <td>{report.project}</td>
                      <td>{report.leaveType}</td>
                      <td>
                        {(report.startDate)}
                      </td>
                      <td>{report.endDate}</td>
                      <td>{report.status}</td>
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
        </div>
      )}
    </div>
  );
};

export default ReportsAdmin;