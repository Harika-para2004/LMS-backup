import React, { useState } from "react";
import { AiFillFilePdf, AiOutlineExclamationCircle } from "react-icons/ai";
import { MdCheckCircle, MdCancel, MdWatchLater } from "react-icons/md";
import { FaTrash } from "react-icons/fa";
import { formatDate } from "../utils/dateUtlis";

const LeaveHistory = ({ leaveHistory, handleDelete }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentLeaves = leaveHistory.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(leaveHistory.length / itemsPerPage);

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

  return (
    <div className="history-container">
      <h2 className="content-heading">Leave History</h2>

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
            <td>     <button
  onClick={() => {
    console.log(leave);
    console.log("Deleting leave with ID:", leave._id); // Debugging
    handleDelete(leave._id, formatDate(leave.startDate));
  }}
  className="delete-btn"
  disabled={leave.status !== "Pending"} // Disable if not pending
  style={{
    border:"none",
    cursor: leave.status !== "Pending" ? "not-allowed" : "pointer", // Change cursor to 'not-allowed' when disabled
    opacity: leave.status !== "Pending" ? 0.5 : 1, // Reduce opacity when disabled
  }}
>
  <FaTrash size={18} color={leave.status === "Pending" ? "red" : "gray"} />
</button>

</td>
                </tr>
              ))
          ) : (
            <tr>
              <td colSpan="8" style={{ textAlign: "center" }}>No leave history available.</td>
            </tr>
          )}
        </tbody>
      </table>

      {totalPages > 1 && (
        <div className="pagination">
          <button onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))} disabled={currentPage === 1}>
            ◀
          </button>
          <span>{currentPage} / {totalPages}</span>
          <button onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages}>
            ▶
          </button>
        </div>
      )}
    </div>
  );
};

export default LeaveHistory;