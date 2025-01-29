import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import logo from "./../assets/img/quadfacelogo-hd.png";
import { Modal, Box } from "@mui/material";
import Profile from "../assets/img/profile.png";
import { useNavigate } from "react-router-dom";

import {
  TextField,
  MenuItem,
  Button,
  TextareaAutosize,
  Typography,
} from "@mui/material";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChartLine,
  faPaperPlane,
  faCalendarPlus,
  faCalendarCheck,
  faFileAlt,
  faHistory,
  faUser,
  faSignOutAlt,
  faUserCircle,
  faKey,
} from "@fortawesome/free-solid-svg-icons";
import LeaveHistory from "./LeaveHistory";
import ApplyLeave from "./ApplyLeave";
import Sidebar from "./Sidebar";
import ProfilePage from "./ProfilePage";

function LeaveRequests() {
  const [modalOpen, setModalOpen] = useState(false);
  const [leaveHistory, setLeaveHistory] = useState([]);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("leaverequests");
  const [leaveData, setLeaveData] = useState([]);
  const [email, setEmail] = useState("");
  const [empid, setEmpid] = useState("");
  const [username, setUsername] = useState("");
  const [project, setProject] = useState("");
  const [designation, setDesignation] = useState("");
  const [leavehistory, setLeavehistory] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [profileImage, setProfileImage] = useState(Profile);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [userData, setUserData] = useState(null);
  const [file, setFile] = useState(null);
  const navigate = useNavigate();

  const [errors, setErrors] = useState({
    leaveType: "",
    from: "",
    to: "",
    reason: "",
    mismatch: "",
  });
  const [formData, setFormData] = useState({
    leaveType: "",
    applyDate: "",
    startDate: "",
    endDate: "",
    reason: "",
  });
  const [mergedLeaveData, setMergedLeaveData] = useState([]);

  useEffect(() => {
    const fetchLeavePolicies = async () => {
      try {
        // Fetch leave policies (default leave types)
        const policyResponse = await axios.get("http://localhost:5001/api/leave-policies");
        const leavePolicies = policyResponse.data.data;

        // Convert applied leave data (leaveData) into a map for easy lookup
        const appliedLeavesMap = {};
        leaveData.forEach((leave) => {
          appliedLeavesMap[leave.leaveType] = leave;
        });

        // Merge applied leaves with policies
        const finalLeaveData = leavePolicies.map((policy) => {
          if (appliedLeavesMap[policy.leaveType]) {
            return appliedLeavesMap[policy.leaveType]; // Use applied leave data
          } else {
            return {
              leaveType: policy.leaveType,
              totalLeaves: policy.maxAllowedLeaves,
              availableLeaves: policy.maxAllowedLeaves, // Default available = maxAllowed
            };
          }
        });

        setMergedLeaveData(finalLeaveData);
      } catch (error) {
        console.error("Error fetching leave policies:", error);
      }
    };

    fetchLeavePolicies();
  }, [leaveData]); 
  const [leavePolicies, setLeavePolicies] = useState([]);
  useEffect(() => {
    const fetchLeavePolicies = async () => {
      try {
        const response = await axios.get("http://localhost:5001/api/leave-policies");
        console.log("API Response:", response.data);
  
        // Check if response.data is an array
        if (Array.isArray(response.data)) {
          const leaveTypes = response.data.map((policy) => policy.leaveType);
          setLeavePolicies(leaveTypes);
        }
        // Check if data is nested
        else if (response.data.data && Array.isArray(response.data.data)) {
          const leaveTypes = response.data.data.map((policy) => policy.leaveType);
          setLeavePolicies(leaveTypes);
        }
        // Handle single object response
        else if (response.data.leaveType) {
          setLeavePolicies([response.data.leaveType]);
        } else {
          console.error("Unexpected response format:", response.data);
          setLeavePolicies([]); // Set to empty array if the format is unexpected
        }
      } catch (error) {
        console.error("Error fetching leave policies:", error);
        setLeavePolicies([]);
      }
    };
  
    fetchLeavePolicies();
  }, []);
  const sortHolidaysByMonthAndCustomDay = (holidayList) => {
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  
    return [...holidayList].sort((a, b) => {
      const [dayA, monthA] = a.date.split("-");
      const [dayB, monthB] = b.date.split("-");
  
      const monthIndexA = monthNames.indexOf(monthA);
      const monthIndexB = monthNames.indexOf(monthB);
  
      // First, compare months
      if (monthIndexA !== monthIndexB) {
        return monthIndexA - monthIndexB;
      }
  
      // If months are the same, compare days (numerically)
      return parseInt(dayA, 10) - parseInt(dayB, 10);
    });
  };
  useEffect(() => {
    const fetchHolidays = async () => {
      try {
        const response = await fetch("http://localhost:5001/holidays");
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
  
        // Sort the fetched holidays before setting the state
        const sortedHolidays = sortHolidaysByMonthAndCustomDay(data);
  
        // Set the sorted holidays
        setHolidays(sortedHolidays);
      } catch (error) {
        console.error("Error fetching holidays:", error);
        setError("Failed to fetch holidays.");
      }
    };
  
    fetchHolidays();
  }, []);

  const fetchLeavehistory = async () => {
    try {
      const response = await fetch(
        `http://localhost:5001/leave-history?email=${email}`
      );
      if (response.ok) {
        const data = await response.json();
        setLeavehistory(data);
      } else {
        console.error("Failed to fetch leave history");
      }
    } catch (error) {
      console.error("Error fetching leave history:", error);
    }
  };

  useEffect(() => {
    if (selectedCategory === "history") {
      fetchLeavehistory();
    }
  }, [selectedCategory]);

  const fetchLeaveHistory = async () => {
    const excludeEmail = "manager@gmail.com"; // Replace with the email to exclude
    try {
      const response = await fetch("http://localhost:5001/leaverequests");
      if (response.ok) {
        const data = await response.json();
        const filteredData = data.filter((item) => item.email !== excludeEmail); // Filter out records with the given email
        setLeaveHistory(filteredData); // Update state with filtered data
      } else {
        console.error("Failed to fetch leave history");
      }
    } catch (error) {
      console.error("Error fetching leave history:", error);
    }
  };

  useEffect(() => {
    const storedUserData = JSON.parse(localStorage.getItem("userData"));
    if (storedUserData) {
      setEmail(storedUserData.email || "");
    }
  }, []);

  useEffect(() => {
    if (email) {
      const fetchLeaveData = async () => {
        try {
          const response = await fetch(
            `http://localhost:5001/leavesummary?email=${email}`
          );
          if (response.ok) {
            const data = await response.json();
            console.log(data);
            setLeaveData(data);
          } else {
            console.error("Failed to fetch leave data");
          }
        } catch (error) {
          console.error("Error fetching leave data:", error);
        }
      };
      fetchLeaveData();
    }
  }, [email]);

  useEffect(() => {
    fetchLeaveHistory();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (value) {
      setErrors({
        ...errors,
        [name]: "",
      });
    }
  };

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    if (!value || value == "Select Leave Type") {
      setErrors({
        ...errors,
        [name]: "Required field",
      });
    }
  };

  // const handleLogout = () => {
  //   window.location.href = "/login";
  // };
  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");  // Redirects user after logout
  };

  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const { leaveType, startDate, endDate, reason } = formData;
    if (!leaveType || !startDate || !endDate) {
      setErrors({
        leaveType: leaveType ? "" : "Required field",
        from: startDate ? "" : "Required field",
        to: endDate ? "" : "Required field",
      });
      return;
    }

    if (new Date(endDate) < new Date(startDate)) {
      setErrors((prevErrors) => ({
        ...prevErrors,
        to: "End Date cannot be before Start Date",
      }));
      return;
    }
    const applyDate = getTodayDate();
    const formDataToSend = new FormData();
    formDataToSend.append("email", email);
    formDataToSend.append("leaveType", leaveType);
    formDataToSend.append("applyDate", applyDate);
    formDataToSend.append("startDate", startDate);
    formDataToSend.append("endDate", endDate);

    if (file) {
      formDataToSend.append("attachment", file);
    }
    if (reason) {
      formDataToSend.append("reason", reason);
    }else{
      formDataToSend.append("reason", "N/A");
    }

    try {
      const response = await fetch(
        `http://localhost:5001/apply-leave?email=${email}`,
        {
          method: "POST",
          body: formDataToSend,
        }
      );

      if (!response.ok) {
        throw new Error("Failed to submit form. Please try again later.");
      }

      const result = await response.json();
      alert(result.message);
    } catch (error) {
      console.error("Error submitting form:", error);
      alert("An error occurred while submitting the form.");
    }
  };

  const handleReject = async () => {
    if (selectedLeave) {
      const { selectedIndex, ...leave } = selectedLeave;

      const updatedLeave = {
        ...leave,
        status: leave.status.map((stat, index) =>
          index === selectedIndex && stat === "pending" ? "Rejected" : stat
        ),
      };

      try {
        const response = await fetch(
          `http://localhost:5001/leaverequests/${leave._id}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(updatedLeave),
          }
        );

        if (response.ok) {
          const updatedLeaveFromServer = await response.json();
          setLeaveHistory((prevHistory) =>
            prevHistory.map((item) =>
              item._id === updatedLeaveFromServer._id
                ? updatedLeaveFromServer
                : item
            )
          );
          setSelectedLeave(null); // Close the selected leave details
          setModalOpen(false); // Close the modal

          console.log(
            "Rejected and updated in the database:",
            updatedLeaveFromServer
          );
        } else {
          console.error("Failed to update leave status in the database");
        }
      } catch (error) {
        console.error("Error updating leave status in the database:", error);
      }
    }
  };

  const handleApprove = async () => {
    if (selectedLeave) {
      const { selectedIndex, ...leave } = selectedLeave;
      const updatedLeave = {
        ...leave,
        availableLeaves: leave.availableLeaves - 1,
        usedLeaves: leave.usedLeaves + 1,
        status: leave.status.map((stat, index) =>
          index === selectedIndex && stat === "pending" ? "Approved" : stat
        ),
      };

      try {
        const response = await fetch(
          `http://localhost:5001/leaverequests/${leave._id}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(updatedLeave),
          }
        );

        if (response.ok) {
          const updatedLeaveFromServer = await response.json();
          setLeaveHistory((prevHistory) =>
            prevHistory.map((item) =>
              item._id === updatedLeaveFromServer._id
                ? updatedLeaveFromServer
                : item
            )
          );
          setSelectedLeave(null);
          setModalOpen(false);
          console.log(
            "Approved and updated in the database:",
            updatedLeaveFromServer
          );
        } else {
          console.error("Failed to update leave in the database");
        }
      } catch (error) {
        console.error("Error updating leave in the database:", error);
      }
    }
  };

  const handleRowClick = (leave, index) => {
    setSelectedLeave({ ...leave, selectedIndex: index });
    setModalOpen(true); // Open the modal
  };
  const handleCloseModal = () => {
    setModalOpen(false); // Close the modal
    setSelectedLeave(null); // Clear selected leave
  };

  const renderContent = () => {
    switch (selectedCategory) {
      case "dashboard":
        return (
          <div>
            <div className="leave-types-container">
              <h2
                style={{ textAlign: "center", marginTop: "-30px" }}
                className="leavebalance"
              >
                Leave Balances
              </h2>
              <div className="leave-cards">
                {mergedLeaveData.map((leave, index) => (
                  <div key={index} className="leave-card">
                    <div className="leave-card-header">
                      <h3 className="leave-type">{leave.leaveType}</h3>
                    </div>
                    <div className="leave-count">
                      <div className="count-item">
                        <span className="count-number">
                          {leave.availableLeaves}
                        </span>
                        <span className="count-label">Available</span>
                      </div>
                      <div className="count-item">
                        <span className="count-number">
                          {leave.totalLeaves}
                        </span>
                        <span className="count-label">Total</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* <table className="holiday-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Day</th>
                  <th>Name of Holiday</th>
                  <th>Holiday Type</th>
                </tr>
              </thead>
              <tbody>
                {holidays.length > 0 ? (
                  holidays.map((holiday) => (
                    <tr key={holiday._id}>
                      <td>{holiday.date}</td>
                      <td>{holiday.day}</td>
                      <td>{holiday.name}</td>
                      <td>{holiday.type}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4">No holidays found.</td>
                  </tr>
                )}
              </tbody>
            </table> */}
          </div>
        );
      case "apply-leave":
        return (
          <ApplyLeave
            formData={formData}
            errors={errors}
            handleInputChange={handleInputChange}
            handleBlur={handleBlur}
            handleSubmit={handleSubmit}
            handleFileChange={handleFileChange}
            holidays={holidays}
            getTodayDate={getTodayDate}
            leavePolicies={leavePolicies} // Pass leave policies here

          />
        );

        case "profile":
        return (
          <ProfilePage
            Profile={Profile}
            username={username}
            empid={empid}
            project={project}
            leaveData={leaveData}
          />
        );

      case "leaverequests":
        return (
          <div className="history-container">
          <h2 className="content-heading">Leave Requests</h2>
          <table id="tb">
            <thead>
              <tr>
                <th>Leave Type</th>
                <th>From</th>
                <th>To</th>
                <th>Reason</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {leaveHistory.map((leave) =>
                leave.startDate.map((startDate, index) => (
                  <tr key={`${leave._id}-${index}`}>
                    <td>{leave.leaveType}</td>
                    <td>{new Date(startDate).toLocaleDateString()}</td>
                    <td>{new Date(leave.endDate[index]).toLocaleDateString()}</td>
                    <td>{leave.reason[index]}</td>
                    <td onClick={() => handleRowClick(leave, index)}>
                      <button
                        style={{ color: "white", backgroundColor: "#313896" }}
                      >
                        {leave.status[index]}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          
          <Modal open={modalOpen} onClose={handleCloseModal}>
            <Box
              sx={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                width: 400,
                bgcolor: "var(--dark-blue)",
                boxShadow: 24,
                p: 4,
                borderRadius: "8px",
              }}
            >
              {selectedLeave && (
                <>
                  <h3>Leave Details</h3>
                  <p>Employee Email: {selectedLeave.email}</p>
                  <p>Leave Type: {selectedLeave.leaveType}</p>
                  <p>
                    From:{" "}
                    {new Date(selectedLeave.startDate[selectedLeave.selectedIndex]).toLocaleDateString()}
                  </p>
                  <p>
                    To:{" "}
                    {new Date(selectedLeave.endDate[selectedLeave.selectedIndex]).toLocaleDateString()}
                  </p>
                  <p>
                    Reason:{" "}
                    {selectedLeave.reason[selectedLeave.selectedIndex]}
                  </p>
                  <p>
                    Status:{" "}
                    {selectedLeave.status[selectedLeave.selectedIndex]}
                  </p>
                  <p>Total Leaves: {selectedLeave.totalLeaves}</p>
                  <p>Available Leaves: {selectedLeave.availableLeaves}</p>
                  <p>Used Leaves: {selectedLeave.usedLeaves}</p>
        
                  {selectedLeave.attachments &&
                    selectedLeave.attachments[selectedLeave.selectedIndex] && (
                      <div className="pdf-container">
                        <a
                          href={`http://localhost:5001/${
                            selectedLeave.attachments[selectedLeave.selectedIndex]
                          }`}
                          download
                        >
                          View Document
                        </a>
                      </div>
                    )}
        
                  <div className="action-buttons">
                    {/* Disable Approve button if Available Leaves are 0 */}
                    <button 
                      onClick={handleApprove} 
                      disabled={selectedLeave.availableLeaves === 0}
                      style={{ backgroundColor: selectedLeave.availableLeaves === 0 ? 'gray' : '#28a745' }}
                    >
                      Approve
                    </button>
                    <button onClick={handleReject}>Reject</button>
                    <button onClick={handleCloseModal}>Close</button>
                  </div>
                </>
              )}
            </Box>
          </Modal>
        </div>
        
        );
      case "reports":
        return <div className="profile-content">Reports Content</div>;
      case "history":
        return (
          <div className="history-container">
            <h2 className="content-heading" >Leave History</h2>
            <table>
              <thead>
                <tr>
                  <th>Leave Type</th>
                  <th>From</th>
                  <th>To</th>
                  <th>Reason</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {leavehistory.map((leave, index) => (
                  <tr key={index}>
                    <td>{leave.leaveType}</td>
                    <td>{leave.startDate}</td>
                    <td>{leave.endDate}</td>
                    <td>{leave.reason}</td>
                    <td>{leave.status || "Pending"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="dashboard-container">
      <div className="content">
        {/* <Sidebar
          userType="manager"
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          logo={logo}
        /> */}
        <Sidebar
          userType="manager"
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          username={username}
          empid={empid}
          handleLogout={handleLogout}
          logo={logo}
          profileImage={profileImage}
        />
        <main className="main-content">{renderContent()}</main>
      </div>
    </div>
  );
}

export default LeaveRequests;
