import React, { useState, useEffect } from "react";
// import "./Reports.css";
import { formatDate } from "../utils/dateUtlis";

const Reports = () => {
  const [reports, setReports] = useState([]);
  const [project, setProject] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchReports();
  }, [project, search]);

  const fetchReports = async () => {
    try {
      const response = await fetch(
        `http://localhost:5001/reports?project=${project}&search=${search}`
      );
      if (!response.ok) throw new Error("Failed to fetch reports");
      const data = await response.json();
      setReports(data);
    } catch (error) {
      console.error("Error fetching reports:", error);
    }
  };

  const exportExcel = async () => {
    await exportFile(
      `http://localhost:5001/reports/export-excel?reports=${JSON.stringify(reports)}`,
      "leave_reports.xlsx"
    );
  };

  const exportPDF = async () => {
    await exportFile(
      `http://localhost:5001/reports/export-pdf?reports=${reports}`,
      "leave_reports.pdf"
    );
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

  // Helper function to format names like in the frontend
  const formatName = (str) =>
    str
      ? str.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase())
      : "N/A";

  // Helper function to format dates properly
  const formatDate = (date) =>
    date ? new Date(date).toLocaleDateString("en-GB") : "N/A";

  const sortedReports = reports
    .flatMap((report) =>
      report.leaves.length > 0
        ? report.leaves.map((leave) => ({
            empname: formatName(report.empname),
            empid: report.empid,
            email: report.email || "N/A",
            project: formatName(report.project),
            leaveType: formatName(leave.leaveType),
            startDate: new Date(leave.startDate),
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
              startDate: new Date(0), // Default earliest date for sorting
              endDate: "N/A",
              status: "No Leaves",
            },
          ]
    )
    .sort((a, b) => {
      // const empidA = Number(a.empid);
      // const empidB = Number(b.empid);
      if (a.empid < b.empid) return -1;
      if (a.empid > b.empid) return 1;
      return a.startDate - b.startDate; // Sort by start date if names are same
    });

  return (
    <div className="reports-container">
      <h2 className="content-heading">Leave Reports</h2>

      {/* Filters */}
      <div className="filters">
        <input
          type="text"
          placeholder="Search by name, email, or ID"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="export-buttons">
          <button onClick={exportExcel} className="btn-excel">
            Export Excel
          </button>
          <button onClick={exportPDF} className="btn-pdf">
            Export PDF
          </button>
        </div>
        {/* <select value={project} onChange={(e) => setProject(e.target.value)}>
          <option value="">All Projects</option>
          <option value="Project A">Project A</option>
          <option value="Project B">Project B</option>
        </select> */}
      </div>

      {/* Export Buttons */}

      {/* Table */}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Employee</th>
              <th>Employee ID</th>
              <th>Email</th>
              <th>Project</th>
              <th>Leave Type</th>
              <th>Start Date</th>
              <th>End Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {sortedReports.length > 0 ? (
              sortedReports.map((report, index) => (
                <tr key={index}>
                  <td>{report.empname}</td>
                  <td>{report.empid}</td>
                  <td>{report.email}</td>
                  <td>{report.project}</td>
                  <td>{report.leaveType}</td>
                  <td>
                    {report.startDate.getTime() === 0
                      ? "N/A"
                      : formatDate(report.startDate)}
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
    </div>
  );
};

export default Reports;
