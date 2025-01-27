import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faKey } from "@fortawesome/free-solid-svg-icons";

const ProfilePage = ({ Profile, username, empid, project, mergedLeaveData }) => {
  return (
    <div className="profile-page">
      <div className="profile-container">
        <div className="profile-header">
          <img src={Profile} alt="Profile" width={"100px"} />
          <div className="profile-details">
            <h2 className="employee-name">{username}</h2>
            <p className="employee-id">
              <span>Employee ID:</span> {empid}
            </p>
            <p className="project-name">
              <span>Project:</span> {project}
            </p>
          </div>
        </div>
        <button className="update-password-btn">
          <FontAwesomeIcon icon={faKey} /> Update Password
        </button>
      </div>

      <div className="leave-types-container">
        <h2 className="content-heading">Leave Balances</h2>
        <div className="leave-cards">
          {mergedLeaveData.map((leave, index) => (
            <div key={index} className="leave-card">
              <div className="leave-card-header">
                <h3 className="leave-type">{leave.leaveType}</h3>
              </div>
              <div className="leave-count">
                <div className="count-item">
                  <span className="count-number">{leave.availableLeaves}</span>
                  <span className="count-label">Available</span>
                </div>
                <div className="count-item">
                  <span className="count-number">{leave.totalLeaves}</span>
                  <span className="count-label">Total</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
