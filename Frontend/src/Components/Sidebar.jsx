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
  userType,
  selectedCategory,
  setSelectedCategory,
  username,
  empid,
  handleLogout,
  logo,
  Profile,
}) => {
  const isEmployee = userType === "employee";
  const isAdmin = userType === "admin";
  const isManager = userType === "manager";

  const generateLinks = () => {
    if (isEmployee) {
      return (
        <>
          <li>
            <Link to="/employee/dashboard" className={selectedCategory === "dashboard" ? "active-tab" : ""}>
              <FontAwesomeIcon icon={faChartLine} /> Dashboard
            </Link>
          </li>
          <li>
            <Link to="/employee/apply-leave" className={selectedCategory === "apply-leave" ? "active-tab" : ""}>
              <FontAwesomeIcon icon={faPaperPlane} /> Apply Leave
            </Link>
          </li>
          <li>
            <Link to="/employee/history" className={selectedCategory === "history" ? "active-tab" : ""}>
              <FontAwesomeIcon icon={faHistory} />Leave History
            </Link>
          </li>
        </>
      );
    } else if (isAdmin) {
      return (
         <div className="sidebar-comps-admin">
          <ul>
         <li>
           <Link
             to="/admin/calendar"
             className={
               selectedCategory === "holiday-calendar" ? "active-tab" : ""
             }
           >
             <FontAwesomeIcon icon={faCalendarDays} /> Calendar
           </Link>
         </li>
         <li>
           <Link
             to="/admin/all-employees"
             className={selectedCategory === "employee-list" ? "active-tab" : ""}
           >
             <FaListAlt style={{ marginRight: "8px" }} />
             Employee List
           </Link>
         </li>
         <li>
           <Link
             to="/admin/all-reports"
             className={selectedCategory === "reports" ? "active-tab" : ""}
           >
             <FontAwesomeIcon icon={faFileLines} /> Reports
           </Link>
         </li>
         <li>
           <Link
             to="/admin/leave-policies"
             className={selectedCategory === "leavepolicy" ? "active-tab" : ""}
           >
             <FontAwesomeIcon icon={faClipboardList} /> Leave Policy
           </Link>
         </li>
         <li>
           <Link
             to="/admin/leave-requests"
             className={
               selectedCategory === "leaverequests" ? "active-tab" : ""
             }
           >
             <FontAwesomeIcon icon={faEnvelopeOpenText} /> Leave Requests
           </Link>
         </li>
         </ul>
       </div>
     );
    } else {
      return (
        <>
          <li>
            <Link to="/manager/leave-requests" className={selectedCategory === "leaverequests" ? "active-tab" : ""}>
              <FontAwesomeIcon icon={faCalendarCheck} /> Leave Requests
            </Link>
          </li>
          <li>
            <Link to="/manager/analytics" className={selectedCategory === "dashboard" ? "active-tab" : ""}>
              <FontAwesomeIcon icon={faChartLine} /> Dashboard
            </Link>
          </li>
          <hr />
          <li>
            <Link to="/manager/apply-leave" className={selectedCategory === "apply-leave" ? "active-tab" : ""}>
              <FontAwesomeIcon icon={faPaperPlane} /> Apply Leave
            </Link>
          </li>
          <li>
            <Link to="/manager/history" className={selectedCategory === "history" ? "active-tab" : ""}>
              <FontAwesomeIcon icon={faHistory} /> Leave History
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
        {(isEmployee) && (
          <Link to="/employee/profile" className={selectedCategory === "profile" ? "active-tab" : ""}>
            <div className="profile-section">
              <div className="profile-pic" style={{ marginTop: "10%" }}>
                <img src={Profile} alt="Profile" />
              </div>
              <div className="profile-details">
                <p className="emp-name" data-fullname={username}>{username}</p>
                <p className="emp-id">Emp ID: {empid}</p>
              </div>
            </div>
          </Link>
        )}
        {(isManager) && (
          <Link to="/manager/profile" className={selectedCategory === "profile" ? "active-tab" : ""}>
            <div className="profile-section">
              <div className="profile-pic" style={{ marginTop: "10%" }}>
                <img src={Profile} alt="Profile" />
              </div>
              <div className="profile-details">
                <p className="emp-name" data-fullname={username}>{username}</p>
                <p className="emp-id">Emp ID: {empid}</p>
              </div>
            </div>
          </Link>
        )}
        <ul>{generateLinks()}</ul>
        {(isEmployee || isManager || isAdmin) && (
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
