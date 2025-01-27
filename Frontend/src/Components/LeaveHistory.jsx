import React from "react";

const LeaveHistory = ({ leaveHistory }) => {
  return (
    <div className="history-container">
      <h2 className="content-heading">Leave History</h2>
      <table>
        <thead>
          <tr>
            <th>Leave Type</th>
            <th>Start Date</th>
            <th>End Date</th>
            <th>Reason</th>
            <th>Leave Status</th>
          </tr>
        </thead>
        <tbody>
          {leaveHistory.length > 0 ? (
            leaveHistory.map((leave, index) => (
              <tr key={index}>
                <td>{leave.leaveType}</td>
                <td>{leave.startDate}</td>
                <td>{leave.endDate}</td>
                <td>{leave.reason}</td>
                <td>{leave.status || "Pending"}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="5" style={{ textAlign: "center" }}>
                No leave history available.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default LeaveHistory;
