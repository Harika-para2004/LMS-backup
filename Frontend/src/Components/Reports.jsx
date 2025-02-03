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
    await exportFile("http://localhost:5001/reports/export-excel", "leave_reports.xlsx");
  };

  const exportPDF = async () => {
    await exportFile("http://localhost:5001/reports/export-pdf", "leave_reports.pdf");
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
      <h2 className="content-heading">Leave Reports</h2>

      {/* Filters */}
      <div className="filters">
        <input
          type="text"
          placeholder="Search by name, email, or ID"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={project} onChange={(e) => setProject(e.target.value)}>
          <option value="">All Projects</option>
          <option value="Project A">Project A</option>
          <option value="Project B">Project B</option>
        </select>
      </div>

      {/* Export Buttons */}
      <div className="export-buttons">
        <button onClick={exportExcel} className="btn-excel">Export Excel</button>
        <button onClick={exportPDF} className="btn-pdf">Export PDF</button>
      </div>

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
            {reports.length > 0 ? (
              reports.map((report, index) =>
                report.leaves.length > 0 ? (
                  report.leaves.map((leave, leaveIndex) => (
                    <tr key={`${index}-${leaveIndex}`}>
                      <td>{report.empname.toLowerCase()
          .replace(/\b\w/g, (char) => char.toUpperCase())}</td>
                      <td>{report.empid}</td>
                      <td>{report.email || "N/A"}</td>
                      <td>{report.project.toLowerCase()
          .replace(/\b\w/g, (char) => char.toUpperCase())}</td>
                      <td>{leave.leaveType.toLowerCase()
          .replace(/\b\w/g, (char) => char.toUpperCase())}</td>
                      <td>{leave.startDate}</td>
                      <td>{formatDate(leave.endDate)}</td>
                      <td>{leave.status.toLowerCase()
          .replace(/\b\w/g, (char) => char.toUpperCase())}</td>
                    </tr>
                  ))
                ) : (
                  <tr key={index}>
                    <td>{report.empname.toLowerCase()
          .replace(/\b\w/g, (char) => char.toUpperCase())}</td>
                    <td>{report.empid}</td>
                    <td>{report.email || "N/A"}</td>
                    <td>{report.project.toLowerCase()
          .replace(/\b\w/g, (char) => char.toUpperCase())}</td>
                    <td colSpan="4" className="no-leaves">
                      No Leaves
                    </td>
                  </tr>
                )
              )
            ) : (
              <tr>
                <td className="no-reports" colSpan="7">
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
