import React, { useState } from "react";
import { AiFillFilePdf, AiOutlineExclamationCircle } from "react-icons/ai";
import { MdCheckCircle, MdCancel, MdWatchLater } from "react-icons/md";
import { FiSlash } from "react-icons/fi";
import {
  FiChevronLeft,
  FiChevronRight,
  FiSkipBack,
  FiSkipForward,
} from "react-icons/fi";
import { Pagination } from "@mui/material";
import { formatDate } from "../utils/dateUtlis";

const LeaveHistory = ({ leaveHistory }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // 🔹 Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentLeaves = leaveHistory.slice(indexOfFirstItem, indexOfLastItem);

  const totalPages = Math.ceil(leaveHistory.length / itemsPerPage);

  // const currentLeaves = leaveHistory.slice(
  //   (currentPage - 1) * itemsPerPage,
  //   currentPage * itemsPerPage
  // );

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

  const truncateReason = (reason) => {
    if (!reason) return "";
    const words = reason.split(" ");
    if (words.length > 2) {
      return words.slice(0, 2).join(" ") + "...";
    }
    return reason;
  };

  const getDownloadLink = (attachments) =>
    `http://localhost:5001/${attachments}`;

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
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h2 className="content-heading">Leave History</h2>

        <span className="status-icons">
          <span className="status-item">
            <MdWatchLater size={25} color="blue" title="Pending" />
            <span>Pending</span>
          </span>
          <span className="status-item">
            <MdCheckCircle size={25} color="green" title="Approved" />
            <span>Approved</span>
          </span>
          <span className="status-item">
            <MdCancel size={25} color="red" title="Rejected" />
            <span>Rejected</span>
          </span>
        </span>

        {/* <div className="pagination-numbered">
        <button
          className="arrow"
          onClick={() => changePage(1)}
          disabled={currentPage === 1}
        >
          <FiSkipBack size={14} />
        </button>
        <button
          className="arrow"
          onClick={() => changePage(currentPage - 1)}
          disabled={currentPage === 1}
        >
          <FiChevronLeft size={14} />
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
          <FiChevronRight size={14} />
        </button>
        <button
          className="arrow"
          onClick={() => changePage(totalPages)}
          disabled={currentPage === totalPages}
        >
          <FiSkipForward size={14} />
        </button>
      </div> */}
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
          </tr>
        </thead>
        <tbody>
          {currentLeaves.length > 0 ? (
            currentLeaves
              .sort((a, b) => new Date(b.startDate) - new Date(a.startDate)) // Sorting in descending order
              .map((leave, index) => (
                <tr key={index}>
                  <td>{leave.leaveType || "N/A"}</td>
                  <td>{formatDate(leave.startDate) || "N/A"}</td>
                  <td>{formatDate(leave.endDate) || "N/A"}</td>
                  <td>{leave.duration}</td>
                  <td>
                    {leave.reason === "null" || !leave.reason ? (
                      "N/A"
                    ) : (
                      <span
                        className="reason-text"
                        title={
                          leave.reason.charAt(0).toUpperCase() +
                          leave.reason.slice(1).toLowerCase()
                        }
                      >
                        {truncateReason(
                          leave.reason
                            ? leave.reason.charAt(0).toUpperCase() +
                                leave.reason.slice(1).toLowerCase()
                            : "N/A"
                        )}
                      </span>
                    )}
                  </td>
                  <td>
                    {leave.attachments ? (
                      <a href={getDownloadLink(leave.attachments)} download>
                        <AiFillFilePdf size={23} color="red" />
                      </a>
                    ) : (
                      <AiOutlineExclamationCircle size={23} color="gray" />
                    )}
                  </td>
                  <td>{getStatusIcon(leave.status)}</td>
                </tr>
              ))
          ) : (
            <tr>
              <td
                colSpan="7"
                style={{ textAlign: "center", fontStyle: "italic" }}
              >
                No leave history available.
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

      {/* Pagination Controls (Positioned at Bottom Right) */}
    </div>
  );
};

export default LeaveHistory;
