import React, { useEffect, useState, useMemo } from "react";
import { AiFillFilePdf, AiOutlineExclamationCircle } from "react-icons/ai";
import { MdCheckCircle, MdCancel, MdWatchLater } from "react-icons/md";
import { FaTrash } from "react-icons/fa";
import { formatDate } from "../utils/dateUtlis";
import { useManagerContext } from "../context/ManagerContext";
import {
  Button,
  Select,
  MenuItem,
  FormControl,
  Stack,
  Pagination,
  Tooltip,
  TextField,
  InputAdornment,
} from "@mui/material";
import { Search } from "@mui/icons-material";

const LeaveHistory = () => {
  const {
    leaveHistory,
    setLeaveHistory,
    email,
    setEmail,
    showToast,
    selectedFilterHistory,setSelectedFilterHistory,
  } = useManagerContext();

  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [searchQuery, setSearchQuery] = useState("");

  // Generate last 17 years dynamically
  const yearsRange = useMemo(
    () => Array.from({ length: 18 }, (_, i) => currentYear + 1 - i),
    [currentYear]
  );

  const truncateReason = (reason) => {
    if (!reason) return "";
    const words = reason.split(" ");
    if (words.length > 3) {
      return words.slice(0, 3).join(" ") + "...";
    }
    return reason;
  };

  const formatCase = (text) => {
    return text.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const formatReason = (text) => {
    if (!text) return "";
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
  };

  // const filteredLeaveRequests = leaveHistory.filter((leave) =>
  //   selectedFilter === "All"
  //     ? true
  //     : leave.status.some(
  //         (status) => status.toLowerCase() === selectedFilter.toLowerCase()
  //       )
  // );

  const displayedData = leaveHistory
    .filter(
      (leave) =>
      selectedFilterHistory === "All" ||
        (leave.status &&
          leave.status.toString().toLowerCase() ===
          selectedFilterHistory.toLowerCase())
    )
    .filter((leave) =>
      leave.leaveType.toLowerCase().includes(searchQuery.toLowerCase())
    );

  // ✅ Correct Year Filtering: Ensure year is properly compared
  const filteredLeaves = displayedData.filter(
    (leave) => leave.year === Number(selectedYear)
  );

  filteredLeaves.sort((a, b) => {
    const dateA = new Date(a.startDate);
    const dateB = new Date(b.startDate);

    // Subtracting returns the difference in milliseconds
    // If dateB is later than dateA, the result will be positive,
    // so b comes before a, which sorts in descending order.
    return dateB - dateA;
  });

  const handleFilterChange = (e) => {
    setSelectedFilterHistory(e.target.value);
  };

  useEffect(() => {
    setSelectedFilterHistory("Pending");
  },[])

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

  useEffect(() => {
    setCurrentPage((prevPage) => {
      const totalPages = Math.ceil(filteredLeaves.length / itemsPerPage);
      return prevPage > totalPages ? 1 : prevPage;
    });
  }, [filteredLeaves]);

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
        <div className="legend-container" style={{ marginLeft: "10px" }}>
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
          <TextField
            placeholder="Search here..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            variant="outlined"
            size="small"
            sx={{
              width: 200,
              bgcolor: "white",
              borderRadius: 1,
              boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.1)",
              "& .MuiOutlinedInput-root": {
                borderRadius: "8px",
                "& fieldset": { borderColor: "#ccc" },
                "&:hover fieldset": { borderColor: "#888" },
                "&.Mui-focused fieldset": { borderColor: "#555" },
              },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search sx={{ color: "#555" }} />
                </InputAdornment>
              ),
            }}
          />
          <div className="filter-container">
            <FormControl
              sx={{
                minWidth: 120,
                bgcolor: "white",
                borderRadius: 1,
                boxShadow: "0px 2px 6px rgba(0, 0, 0, 0.1)",
              }}
            >
              <Select
                value={selectedFilterHistory}
                onChange={handleFilterChange}
                displayEmpty
                sx={{
                  fontSize: "14px",
                  fontWeight: 500,
                  color: "#333",
                  borderRadius: 1,
                  height: 40,
                  px: 1.2,
                  bgcolor: "#fafafa",
                  transition: "all 0.3s ease-in-out",
                  "&:hover": { bgcolor: "#f0f0f0" },
                  "&.Mui-focused": {
                    boxShadow: "0px 3px 8px rgba(0, 0, 0, 0.2)",
                  },
                }}
              >
                {["All", "Pending", "Approved", "Rejected"].map((status) => (
                  <MenuItem
                    key={status}
                    value={status}
                    sx={{
                      fontSize: "14px",
                      px: 1.2,
                      color:
                        status === "Approved"
                          ? "green"
                          : status === "Rejected"
                          ? "red"
                          : "#333",
                      "&:hover": { bgcolor: "#f5f5f5" },
                    }}
                  >
                    {status}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </div>
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
            <th>From</th>
            <th>To</th>
            <th>No Of Days</th>
            <th>Reason</th>
            <th>Document</th>
            {["All", "Rejected"].includes(selectedFilterHistory) && <th>Rejection Reason</th>}
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
                  <td>{formatCase(leave.leaveType) || "N/A"}</td>
                  <td>{formatDate(leave.startDate) || "N/A"}</td>
                  <td>{formatDate(leave.endDate) || "N/A"}</td>
                  <td>{leave.duration}</td>
                  <td>
                    {" "}
                    <Tooltip
                      title={
                        leave.reason.toLowerCase() === "n/a"
                          ? "N/A"
                          : formatReason(leave.reason)
                      }
                      arrow
                    >
                      <span>
                        {leave.reason.toLowerCase() === "n/a"
                          ? "N/A"
                          : truncateReason(formatReason(leave.reason))}
                      </span>{" "}
                    </Tooltip>
                  </td>
                  <td>
                    {leave.attachments ? (
                      <a
                        href={`data:application/pdf;base64,${leave.attachments}`}
                        download={`LeaveAttachment.pdf`}
                      >
                        <AiFillFilePdf size={23} color="red" />
                      </a>
                    ) : (
                      <AiOutlineExclamationCircle size={23} color="gray" />
                    )}
                  </td>
                  {["All", "Rejected"].includes(selectedFilterHistory) && (
  <td>
    <Tooltip title={leave.rejectionComment || "N/A"} arrow>
      <span>
     {leave.rejectionComment
          ? leave.rejectionComment.length > 30
            ?  truncateReason(formatReason(leave.rejectionComment.substring(0, 30) + "..."))
            :  truncateReason(formatReason(leave.rejectionComment))
          : "N/A"}
      </span>
    </Tooltip>
  </td>
)}

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
              <td colSpan="10" style={{ textAlign: "center" }}>
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