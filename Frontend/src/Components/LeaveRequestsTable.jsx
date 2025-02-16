import React, { useState } from "react";
import { FormGroup, FormControlLabel, Checkbox } from "@mui/material";
import { AiFillFilePdf, AiOutlineExclamationCircle } from "react-icons/ai";
import { MdCheckCircle, MdCancel, MdWatchLater } from "react-icons/md";

const LeaveRequestsTable = ({
  filteredLeaveHistory,
  selectedFilter,
  handleFilterChange,
  handleRowClick,
  getDownloadLink,
}) => {
  // 🔹 Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7; // Show 5 leave requests per page

  // 🔹 Pagination logic

  // 🔹 Filtered data based on selected filter
  const filteredData = filteredLeaveHistory.flatMap((leave) =>
    leave.startDate.map((startDate, index) => ({
      id: `${leave._id}-${index}`,
      empid: leave.empid || "N/A",
      empname: leave.empname || "N/A",
      leaveType:
        leave.leaveType.charAt(0).toUpperCase() + leave.leaveType.slice(1),
      duration: leave.duration ? leave.duration[index] : "N/A",
      applyDate: new Date(leave.applyDate[index]).toLocaleDateString(),
      startDate: new Date(startDate).toLocaleDateString(),
      endDate: new Date(leave.endDate[index]).toLocaleDateString(),
      availableLeaves: leave.availableLeaves,
      document: leave.attachments?.[index]
        ? getDownloadLink(leave.attachments[index])
        : null,
      reason: leave.reason[index] === "null" ? "N/A" : leave.reason[index],
      status: leave.status[index].toLowerCase(),
      leaveData: leave,
      leaveIndex: index,
    }))
  );

  // 🔹 Apply filter
  // 🔹 Apply filter before using displayedData
  const displayedData =
    selectedFilter === "All"
      ? filteredData
      : filteredData.filter(
          (leave) => leave.status === selectedFilter.toLowerCase()
        );

  // 🔹 Pagination logic (use displayedData after it's declared)
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const sortedItems = [...displayedData]
    .filter((item) => item.startDate) // Remove invalid dates
    .sort(
      (a, b) =>
        new Date(b.startDate.split("/").reverse().join("-")) -
        new Date(a.startDate.split("/").reverse().join("-"))
    );

  const currentItems = sortedItems.slice(indexOfFirstItem, indexOfLastItem);

  console.log(
    "Sorted Items:",
    currentItems.map((i) => i.startDate)
  );

  const totalPages = Math.ceil(displayedData.length / itemsPerPage);

  return (
    <div className="history-container">
      <h2 className="content-heading">Leave Requests</h2>

      {/* Filters */}
      <div className="filter-container">
        <FormGroup row sx={{ justifyContent: "flex-end" }}>
          {["All", "Pending", "Approved", "Rejected"].map((status) => (
            <FormControlLabel
              key={status}
              control={
                <Checkbox
                  value={status}
                  checked={selectedFilter === status}
                  onChange={handleFilterChange}
                  sx={{
                    "&.Mui-checked": {
                      color:
                        status === "Approved"
                          ? "green"
                          : status === "Rejected"
                          ? "red"
                          : "default",
                    },
                  }}
                />
              }
              label={status}
            />
          ))}
        </FormGroup>
      </div>

      {/* Leave Requests Table */}
      <table id="tb">
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Leave Type</th>
            <th>Duration</th>
            <th>From</th>
            <th>To</th>
            <th>Available</th>
            <th>Document</th>
            <th>Reason</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {currentItems.length > 0 ? (
            currentItems.map((leave) => (
              <tr key={leave.id}>
                <td>{leave.empid}</td>
                <td>{leave.empname}</td>
                <td>{leave.leaveType}</td>
                <td>{leave.duration}</td>
                <td>{leave.startDate}</td>
                <td>{leave.endDate}</td>
                <td>{leave.availableLeaves}</td>
                <td>
                  {leave.document ? (
                    <a href={leave.document} download>
                      <AiFillFilePdf size={23} color="red" />
                    </a>
                  ) : (
                    <AiOutlineExclamationCircle
                      size={23}
                      color="rgb(114,114,114)"
                    />
                  )}
                </td>
                <td>{leave.reason}</td>
                <td>
                  {leave.status === "approved" && (
                    <button
                      onClick={() =>
                        handleRowClick(leave.leaveData, leave.leaveIndex)
                      }
                      style={{
                        color: "green",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                      }}
                    >
                      <MdCheckCircle size={24} />
                    </button>
                  )}
                  {leave.status === "rejected" && (
                    <button
                      onClick={() =>
                        handleRowClick(leave.leaveData, leave.leaveIndex)
                      }
                      style={{
                        color: "red",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                      }}
                    >
                      <MdCancel size={24} />
                    </button>
                  )}
                  {leave.status !== "approved" &&
                    leave.status !== "rejected" && (
                      <button
                        onClick={() =>
                          handleRowClick(leave.leaveData, leave.leaveIndex)
                        }
                        style={{
                          color: "blue",
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                        }}
                      >
                        <MdWatchLater size={24} />
                      </button>
                    )}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td
                colSpan="10"
                style={{ textAlign: "center", padding: "15px", color: "#555" }}
              >
                No leave requests found
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Pagination Controls */}
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

export default LeaveRequestsTable;
