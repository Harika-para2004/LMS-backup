import React from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUser,
  faPaperPlane,
  faHistory,
  faSignOutAlt,
  faChartLine,
  faCalendarCheck,
  faFileAlt,
  faCalendarDays,
  faClipboardList,
  faEnvelopeOpenText,
  faFileLines,
} from "@fortawesome/free-solid-svg-icons";
import { FaListAlt } from "react-icons/fa";

const Sidebar = ({
  userType, // 'employee', 'manager', or 'admin'
  selectedCategory,
  setSelectedCategory,
  username,
  empid,
  handleLogout,
  logo,
  profileImage,
}) => {
  const isEmployee = userType === "employee";
  const isAdmin = userType === "admin";
  const isManager = userType === "manager";

  // Function to generate links based on user type
  const generateLinks = () => {
    if (isEmployee) {
      return (
        <>
          <li>
            <Link
              to="#"
              className={selectedCategory === "apply-leave" ? "active-tab" : ""}
              onClick={() => setSelectedCategory("apply-leave")}
            >
              <FontAwesomeIcon icon={faPaperPlane} /> Apply Leave
            </Link>
          </li>
          <li>
            <Link
              to="#"
              className={selectedCategory === "history" ? "active-tab" : ""}
              onClick={() => setSelectedCategory("history")}
            >
              <FontAwesomeIcon icon={faHistory} /> History
            </Link>
          </li>
        </>
      );
    } else if (isAdmin) {
      return (
        <div className="sidebar-comps-admin">
          <li>
            <Link
              to="#"
              className={
                selectedCategory === "holiday-calendar" ? "active-tab" : ""
              }
              onClick={() => setSelectedCategory("holiday-calendar")}
            >
              <FontAwesomeIcon icon={faCalendarDays} /> Calendar
            </Link>
          </li>
          <li>
            <Link
              to="#"
              className={selectedCategory === "employee-list" ? "active-tab" : ""}
              onClick={() => setSelectedCategory("employee-list")}
            >
              <FaListAlt style={{ marginRight: "8px" }} />
              Employee List
            </Link>
          </li>
          <li>
            <Link
              to="#"
              className={selectedCategory === "reports" ? "active-tab" : ""}
              onClick={() => setSelectedCategory("reports")}
            >
              <FontAwesomeIcon icon={faFileLines} /> Reports
            </Link>
          </li>
          <li>
            <Link
              to="#"
              className={selectedCategory === "leavepolicy" ? "active-tab" : ""}
              onClick={() => setSelectedCategory("leavepolicy")}
            >
              <FontAwesomeIcon icon={faClipboardList} /> Leave Policy
            </Link>
          </li>
          <li>
            <Link
              to="#"
              className={
                selectedCategory === "leaverequests" ? "active-tab" : ""
              }
              onClick={() => setSelectedCategory("leaverequests")}
            >
              <FontAwesomeIcon icon={faEnvelopeOpenText} /> Leave Requests
            </Link>
          </li>
        </div>
      );
    } else {
      return (
        <>
          {/* <li className="seg">Manager Actions</li> */}
          <li>
            <Link
              to="#"
              className={
                selectedCategory === "leaverequests" ? "active-tab" : ""
              }
              onClick={() => setSelectedCategory("leaverequests")}
            >
              <FontAwesomeIcon icon={faCalendarCheck} /> Leave Requests
            </Link>
          </li>
          {/* <li>
            <Link
              to="#"
              className={selectedCategory === "dashboard" ? "active-tab" : ""}
              onClick={() => setSelectedCategory("dashboard")}
            >
              <FontAwesomeIcon icon={faChartLine} /> Leave Balances
            </Link>
          </li> */}
          <li>
            <Link
              to="#"
              className={selectedCategory === "reports" ? "active-tab" : ""}
              onClick={() => setSelectedCategory("reports")}
            >
              <FontAwesomeIcon icon={faFileAlt} /> Reports
            </Link>
          </li>
          {/* <li className="seg">Employee Actions</li> */}
          <hr/>
          <li>
            <Link
              to="#"
              className={selectedCategory === "apply-leave" ? "active-tab" : ""}
              onClick={() => setSelectedCategory("apply-leave")}
            >
              <FontAwesomeIcon icon={faPaperPlane} /> Apply Leave
            </Link>
          </li>
          <li>
            <Link
              to="#"
              className={selectedCategory === "history" ? "active-tab" : ""}
              onClick={() => setSelectedCategory("history")}
            >
              <FontAwesomeIcon icon={faHistory} /> History
            </Link>
          </li>
        </>
      );
    }
  };

  return (
    <nav className={`sidebar ${isAdmin ? "admin-sidebar" : ""}`}>
      <div className="logo-cont">
        <img src={logo} alt="Quadface Logo" className="logo_das" />
      </div>

      <div className="sidebar-comps">
        {(isEmployee || isManager)  && (
          <Link
            to="#"
            className={selectedCategory === "profile" ? "active-tab" : ""}
            onClick={() => setSelectedCategory("profile")}
          >
            <div className="profile-section">
              <div className="profile-pic" style={{ marginTop: "10%" }}>
                <img src={profileImage} alt="Profile" />
              </div>
              <div className="profile-details">
                <div className="tooltip-container">
                <p className="emp-name" data-fullname={username}>{username}</p>
                {/* <span className="tooltip-text">{username}</span> */}
                </div>
                <p className="emp-id">Emp ID: {empid}</p>
              </div>
            </div>
          </Link>
        )}

        <ul>{generateLinks()}</ul>

        {(isEmployee || isManager) && (
          <div className="logout">
            <Link to="#" onClick={handleLogout}>
              <FontAwesomeIcon icon={faSignOutAlt} /> Logout
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Sidebar;
