import React, { useEffect, useState, useMemo } from "react";
import { AiFillFilePdf, AiOutlineExclamationCircle } from "react-icons/ai";
import { MdCheckCircle, MdCancel, MdWatchLater } from "react-icons/md";
import { FaTrash } from "react-icons/fa";
import { formatDate } from "../utils/dateUtlis";
import { useManagerContext } from "../context/ManagerContext";
import { Button, Select, MenuItem } from "@mui/material";

const LeaveHistory = () => {
  const {
    leaveHistory, setLeaveHistory,
    email, setEmail,
    showToast
  } = useManagerContext();

  const [currentPage, setCurrentPage] = useState(1);
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);

  const itemsPerPage = 10;

  // Generate last 17 years dynamically
  const yearsRange = useMemo(() => Array.from({ length: 18 }, (_, i) => currentYear + 1 - i), [currentYear]);

  // ✅ Correct Year Filtering: Ensure year is properly compared
  const filteredLeaves = leaveHistory.filter((leave) =>
    leave.year === Number(selectedYear)
  );
  filteredLeaves.sort((a, b) => {
    // Convert the startDate strings to Date objects
    const dateA = new Date(a.startDate);
    const dateB = new Date(b.startDate);
  
    // Subtracting returns the difference in milliseconds
    // If dateB is later than dateA, the result will be positive,
    // so b comes before a, which sorts in descending order.
    return dateB - dateA;
  });
  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentLeaves = filteredLeaves.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredLeaves.length / itemsPerPage);

  const getStatusIcon = (status) => {
    switch (status) {
      case "Pending":
        return <MdWatchLater size={23} color="blue" />;
      case "Approved":
        return <MdCheckCircle size={23} color="green" />;
      case "Rejected":
        return <MdCancel size={23} color="red" />;
      default:
        return null;
    }
  };

  const handleDelete = async (id, startDate) => {
    if (!id || !startDate) {
      console.error("Error: ID or startDate is undefined");
      return;
    }

    try {
      const response = await fetch(`http://localhost:5001/leaves/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startDate }),
      });

      if (!response.ok) {
        throw new Error("Failed to delete leave");
      }

      showToast("Leave deleted successfully!", "success");
      fetchLeavehistory();
    } catch (error) {
      console.error("Error deleting leave:", error);
    }
  };

  const fetchLeavehistory = async () => {
    try {
      const response = await fetch(`http://localhost:5001/leave-history?email=${email}&year=${selectedYear}`);
      if (response.ok) {
        const data = await response.json();
        setLeaveHistory(data);
      } else {
        console.error("Failed to fetch leave history");
      }
    } catch (error) {
      console.error("Error fetching leave history:", error);
    }
  };
  
  
  useEffect(() => {
    fetchLeavehistory();
  }, [email, selectedYear]);

  return (
    <div className="history-container">
      <h2 className="content-heading">Leave History</h2>

      {/* Year Filter Dropdown */}
      <div className="history-header">
  <h2 className="content-heading"></h2>

  {/* Year Filter Dropdown (Top Right) */}
  <div className="year-filter">
    <Select
      value={selectedYear}
      onChange={(e) => setSelectedYear(e.target.value)}
      className="year-select"
    >
      {yearsRange.map((year) => (
        <MenuItem key={year} value={year}>
          {year}
        </MenuItem>
      ))}</Select></div></div>
      <table>
        <thead>
          <tr>
            <th>Leave Type</th>
            <th>Start Date</th>
            <th>End Date</th>
            <th>Duration</th>
            <th>Reason</th>
            <th>Document</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {currentLeaves.length > 0 ? (
            currentLeaves
              .sort((a, b) => new Date(b.startDate) - new Date(a.startDate))
              .map((leave, index) => (
                <tr key={index}>
                  <td>{leave.leaveType || "N/A"}</td>
                  <td>{formatDate(leave.startDate) || "N/A"}</td>
                  <td>{formatDate(leave.endDate) || "N/A"}</td>
                  <td>{leave.duration}</td>
                  <td>{leave.reason || "N/A"}</td>
                  <td>
                    {leave.attachments ? (
                      <a href={leave.attachments} download>
                        <AiFillFilePdf size={23} color="red" />
                      </a>
                    ) : (
                      <AiOutlineExclamationCircle size={23} color="gray" />
                    )}
                  </td>
                  <td>{getStatusIcon(leave.status)}</td>
                  <td>
                    <button
                      onClick={() => handleDelete(leave._id, formatDate(leave.startDate))}
                      className="delete-btn"
                      disabled={leave.status !== "Pending"}
                      style={{
                        border: "none",
                        cursor: leave.status !== "Pending" ? "not-allowed" : "pointer",
                        opacity: leave.status !== "Pending" ? 0.5 : 1,
                      }}
                    >
                      <FaTrash size={18} color={leave.status === "Pending" ? "red" : "gray"} />
                    </button>
                  </td>
                </tr>
              ))
          ) : (
            <tr>
              <td colSpan="8" style={{ textAlign: "center" }}>
                No leave history available for {selectedYear}.
              </td>
            </tr>
          )}
        </tbody>
      </table>
      {totalPages > 1 && (
        <div className="pagination">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="pagination-btn"
          >
            ◀
          </button>

          <span className="pagination-info">
            {currentPage} / {totalPages}
          </span>

          <button
            onClick={() =>
              setCurrentPage((prev) => Math.min(prev + 1, totalPages))
            }
            disabled={currentPage === totalPages}
            className="pagination-btn"
          >
            ▶
          </button>
        </div>
      )}
    </div>
  );
};

export default LeaveHistory;