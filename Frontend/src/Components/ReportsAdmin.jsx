import React, { useState, useEffect } from "react";
import { formatDate } from "../utils/dateUtlis";

const Reports = ({email}) => {
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
              startDate: new Date(0),
              endDate: "N/A",
              status: "No Leaves",
            },
          ]
    )
    .sort((a, b) => a.empname.localeCompare(b.empname) || a.startDate - b.startDate);

  return (
    <div className="reports-container">
      <h2 className="content-heading">Leave Reports</h2>

      <div className="filters">
        <input
          type="text"
          placeholder="Search by name, email, project or ID"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="export-buttons">
          <button onClick={() => exportFile(`http://localhost:5001/reports/export-excel`, "leave_reports.xlsx")} className="btn-excel">
            Export Excel
          </button>
        </div>
       
      </div>


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
              sortedReports
                .filter((report) => report.email !== "admin@gmail.com")
                .map((report, index) => (
                  <tr key={index}>
                    <td>{report.empname}</td>
                    <td>{report.empid}</td>
                    <td>{report.email}</td>
                    <td>{report.project}</td>
                    <td>{report.leaveType}</td>
                    <td>{report.startDate.getTime() === 0 ? "N/A" : formatDate(report.startDate)}</td>
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