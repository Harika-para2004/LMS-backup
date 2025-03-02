import React, { useState, useEffect, useMemo } from "react";
import { formatDate } from "../utils/dateUtlis";
import ManagerEmployeeDashboard from "./ManagerEmployeeDashboard";
import { Button, Select, MenuItem } from "@mui/material";
import { useManagerContext } from "../context/ManagerContext";
import { useLocation, useNavigate, useParams } from "react-router-dom";

const Reports = () => {
  const { email: contextEmail, role } = useManagerContext();
  const { email: paramEmail } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [userData, setUserData] = useState(location.state?.userData || {});
  const [email, setEmail] = useState(userData?.email);
  const [reports, setReports] = useState([]);
  const [project, setProject] = useState("");
  const [search, setSearch] = useState("");
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const currentYear = new Date().getFullYear();

  const yearsRange = useMemo(() => {
    return Array.from({ length: 17 }, (_, i) => currentYear - (i - 1));
  }, [currentYear]);
  

  useEffect(() => {
    if (paramEmail) {
      setEmail(paramEmail);
    } else if (contextEmail) {
      setEmail(contextEmail);
    } else {
      navigate("/login");
    }
  }, [contextEmail, paramEmail, navigate]);

  useEffect(() => {
    if (email) {
      fetchReports();
    }
  }, [email, project, search, selectedYear]);

  const fetchReports = async () => {
    try {
      const response = await fetch(
        `http://localhost:5001/reports?project=${project}&search=${search}&email=${email}&year=${selectedYear}`
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
            startDate: formatDate(leave.startDate),
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
              startDate: "N/A",
              endDate: "N/A",
              status: "No Leaves",
            },
          ]
    )
    .sort((a, b) => a.empname.localeCompare(b.empname) || a.startDate - b.startDate);

  return (
    <div className="reports-container">
<h2 className="content-heading">Annual Approved Leave Summary</h2>
<div className="filters">
        <input
          type="text"
          placeholder="Search by name, email, project or ID"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className="year-select">
          {yearsRange.map((year) => (
            <MenuItem key={year} value={year}>
              {year}
            </MenuItem>
          ))}
        </Select>
      
        <Button onClick={() => setShowAnalytics(!showAnalytics)} sx={{ textTransform: "none" }} className="btn-analytics">
          {showAnalytics ? "Show Reports" : "Show Analytics"}
        </Button>
      </div>
      {showAnalytics ? (
        <ManagerEmployeeDashboard email={email} selectedYear={selectedYear} />
      ) : (
        <div className="table-container" id="table-container">
                      <h2 className="table-heading">Export the Annual Approved Leave Data</h2>

                      {!showAnalytics && (
        <div className="export-buttons" id="export-buttons">
          <button
            onClick={() => exportFile(`http://localhost:5001/reports/export-excel?year=${selectedYear}`, `leave_reports_${selectedYear}.xlsx`)}
            className="btn-excel" id="btn-excel"
          >
            Export Excel
          </button>
        </div>)}
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
                      <td>{report.startDate}</td>
                      <td>{report.endDate}</td>
                      <td>{report.status}</td>
                    </tr>
                  ))
              ) : (
                <tr>
                  <td className="no-reports" colSpan="7">
                    No reports found for {selectedYear}.
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

export default Reports;
