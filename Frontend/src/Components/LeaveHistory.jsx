import React, { useEffect, useState, useMemo } from "react";
import { AiFillFilePdf, AiOutlineExclamationCircle } from "react-icons/ai";
import { MdCheckCircle, MdCancel, MdWatchLater } from "react-icons/md";
import { FaTrash } from "react-icons/fa";
import { formatDate } from "../utils/dateUtlis";
import { useManagerContext } from "../context/ManagerContext";
import { Button, Select, MenuItem, FormControl, Stack, Pagination } from "@mui/material";

const LeaveHistory = () => {
  const { leaveHistory, setLeaveHistory, email, setEmail, showToast } =
    useManagerContext();

  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);




  // Generate last 17 years dynamically
  const yearsRange = useMemo(
    () => Array.from({ length: 18 }, (_, i) => currentYear + 1 - i),
    [currentYear]
  );

  // ✅ Correct Year Filtering: Ensure year is properly compared
  const filteredLeaves = leaveHistory.filter(
    (leave) => leave.year === Number(selectedYear)
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
  // const itemsPerPage = 15;
  // const [currentPage, setCurrentPage] = useState(1);
  // const indexOfLastItem = currentPage * itemsPerPage;
  // const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  // const currentLeaves = filteredLeaves.slice(indexOfFirstItem, indexOfLastItem);
  // const totalPages = Math.ceil(filteredLeaves.length / itemsPerPage);


  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // Calculate the indexes for slicing the data
  const indexOfLastEmployee = currentPage * itemsPerPage;
  const indexOfFirstEmployee = indexOfLastEmployee - itemsPerPage;
  const currentItems = filteredLeaves.slice(
    indexOfFirstEmployee,
    indexOfLastEmployee
  );

  // Handle page change
  const handlePageChange = (event, value) => {
    setCurrentPage(value);
  };

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
      const response = await fetch(
        `http://localhost:5001/leave-history?email=${email}&year=${selectedYear}`
      );
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
      {/* Year Filter Dropdown */}
      <div className="history-header">
        <h2 className="content-heading">Leave History</h2>
        <div className="legend-container">
          <div className="legend-item">
            <MdWatchLater size={20} color="blue" /> <span>Pending</span>
          </div>
          <div className="legend-item">
            <MdCheckCircle size={20} color="green" /> <span>Approved</span>
          </div>
          <div className="legend-item">
            <MdCancel size={20} color="red" /> <span>Rejected</span>
          </div>
        </div>

        {/* Year Filter Dropdown (Top Right) */}
        <div className="year-filter">
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
                fontSize: "12px",
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
          {currentItems.length > 0 ? (
            currentItems
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
                      onClick={() =>
                        handleDelete(leave._id, formatDate(leave.startDate))
                      }
                      className="delete-btn"
                      disabled={leave.status !== "Pending"}
                      style={{
                        border: "none",
                        cursor:
                          leave.status !== "Pending"
                            ? "not-allowed"
                            : "pointer",
                        opacity: leave.status !== "Pending" ? 0.5 : 1,
                      }}
                    >
                      <FaTrash
                        size={18}
                        color={leave.status === "Pending" ? "red" : "gray"}
                      />
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
      <Stack spacing={2} sx={{ mt: 2, display: "flex", alignItems: "center" }}>
        <Pagination
          count={Math.ceil(filteredLeaves.length / itemsPerPage)}
          page={currentPage}
          onChange={handlePageChange}
          color="primary"
        />
      </Stack>
    </div>
  );
};

export default LeaveHistory;
