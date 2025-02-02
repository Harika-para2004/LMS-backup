import React, { useState } from "react";
import { AiFillFilePdf, AiOutlineExclamationCircle } from "react-icons/ai";
import { MdCheckCircle, MdCancel,MdWatchLater } from "react-icons/md";
import { FiSlash } from "react-icons/fi";
import { FiChevronLeft, FiChevronRight, FiSkipBack, FiSkipForward } from "react-icons/fi";
import { Pagination } from "@mui/material";

const LeaveHistory = ({ leaveHistory }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8; // Number of items per page

  const totalPages = Math.ceil(leaveHistory.length / itemsPerPage);

  const currentLeaves = leaveHistory.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const calculateDuration = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const durationInMs = end - start;
    const durationInDays = durationInMs / (1000 * 60 * 60 * 24) + 1;
    return durationInDays > 0 ? durationInDays.toFixed(0) : 0;
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "pending":
        return <MdWatchLater  size={30} color="blue" />;
      case "Approved":
        return <MdCheckCircle size={30} color="green" />;
      case "Rejected":
        return <MdCancel size={30} color="red" />;
      default:
        return null;
    }
  };

  const truncateReason = (reason) => {
    if (!reason) return '';
    const words = reason.split(" ");
    if (words.length > 1) {
      return words.slice(0, 1).join(" ") + "...";
    }
    return reason;
  };

  const getDownloadLink = (attachments) => `http://localhost:5001/${attachments}`;

  const changePage = (page) => {
    setCurrentPage(page);
  };

  // Pagination buttons
  const getPaginationRange = () => {
    let pageNumbers = [];

    if (totalPages <= 3) {
      pageNumbers = [...Array(totalPages)].map((_, i) => i + 1);
    } else {
      if (currentPage === 1) {
        pageNumbers = [1, 2, 3];
      } else if (currentPage === totalPages) {
        pageNumbers = [totalPages - 2, totalPages - 1, totalPages];
      } else {
        pageNumbers = [currentPage - 1, currentPage, currentPage + 1];
      }
    }
    return pageNumbers;
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
          </tr>
        </thead>
        <tbody>
          {currentLeaves.length > 0 ? (
            currentLeaves.map((leave, index) => (
              <tr key={index}>
                <td>{leave.leaveType || "N/A"}</td>
                <td>{leave.startDate || "N/A"}</td>
                <td>{leave.endDate || "N/A"}</td>
                <td>{leave.duration }</td>
                <td>{leave.reason === "null" || !leave.reason ? (
"N/A"                  ) : (
                    <span className="reason-text" title={leave.reason}>
                      {truncateReason(leave.reason)}
                    </span>
                  )}</td>
                <td>
                  {leave.attachments ? (
                    <a href={getDownloadLink(leave.attachments)} download>
                      <AiFillFilePdf size={30} color="red" />
                    </a>
                  ) : (
                    <AiOutlineExclamationCircle size={30} color="gray" />
                  )}
                </td>
                <td>{getStatusIcon(leave.status)}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="7" style={{ textAlign: "center", fontStyle: "italic" }}>
                No leave history available.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Pagination Controls (Positioned at Bottom Right) */}
      <div className="pagination-numbered">
        <button
        className="arrow"
          onClick={() => changePage(1)}
          disabled={currentPage === 1}
        >
          <FiSkipBack size={20} />
        </button>
        <button
        className="arrow"
          onClick={() => changePage(currentPage - 1)}
          disabled={currentPage === 1}
        >
          <FiChevronLeft size={20} />
        </button>

        <div className="page-numbers">
          {getPaginationRange().map((pageNumber) => (
            <button
              key={pageNumber}
              onClick={() => changePage(pageNumber)}
              className={currentPage === pageNumber ? "active" : ""}
              disabled={currentPage === pageNumber}
            >
              {pageNumber}
            </button>
          ))}
        </div>

        <button
        className="arrow"
          onClick={() => changePage(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          <FiChevronRight size={20} />
        </button>
        <button
        className="arrow"
          onClick={() => changePage(totalPages)}
          disabled={currentPage === totalPages}
        >
          <FiSkipForward size={20} />
        </button>
      </div>
    </div>
  );
};

export default LeaveHistory;
