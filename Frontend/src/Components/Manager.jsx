import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import logo from "./../assets/img/quadfacelogo-hd.png";
import { Modal, Box, IconButton } from "@mui/material";
import Profile from "../assets/img/profile.png";
import { useNavigate } from "react-router-dom";
import { BASE_URL } from "../Config";
import { MdCheckCircle, MdCancel, MdWatchLater } from "react-icons/md";
import { FormGroup, FormControlLabel, Checkbox } from "@mui/material";
import LeaveHistory from "./LeaveHistory";
import ApplyLeave from "./ApplyLeave";
import Sidebar from "./Sidebar";
import ProfilePage from "./ProfilePage";
import {
  AiFillFilePdf,
  AiOutlineClose,
  AiOutlineExclamationCircle,
} from "react-icons/ai";
import Reports from "./Reports";

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
  const [selectedFilter, setSelectedFilter] = useState("All");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const [leavepolicyRef, setLeavePolicyRef] = useState([]);

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
        const policyResponse = await axios.get(
          "http://localhost:5001/api/leave-policies"
        );
        setLeavePolicyRef(policyResponse.data.data);
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
        const response = await axios.get(
          "http://localhost:5001/api/leave-policies"
        );
        console.log("API Response:", response.data);

        // Check if response.data is an array
        if (Array.isArray(response.data)) {
          const leaveTypes = response.data.map((policy) => policy.leaveType);
          setLeavePolicies(leaveTypes);
        }
        // Check if data is nested
        else if (response.data.data && Array.isArray(response.data.data)) {
          const leaveTypes = response.data.data.map(
            (policy) => policy.leaveType
          );
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
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

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
    const storedUserData = localStorage.getItem("userData");
    console.log(storedUserData);
    if (storedUserData) {
      try {
        const parsedUserData = JSON.parse(storedUserData);
        if (parsedUserData) {
          setUserData(parsedUserData);
          setUsername(parsedUserData.empname || "");
          setEmpid(parsedUserData.empid || "");

          setEmail(parsedUserData.email || "");
          setProject(parsedUserData.project || "");
        }
      } catch (error) {
        console.error("Error parsing userData from localStorage:", error);
      }
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
    navigate("/"); // Redirects user after logout
  };
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const { leaveType, startDate, endDate, reason } = formData;

    // Validate required fields
    if (!leaveType || !startDate || !endDate) {
      setErrors({
        leaveType: leaveType ? "" : "Required field",
        from: startDate ? "" : "Required field",
        to: endDate ? "" : "Required field",
      });
      return;
    }

    // Validate date logic
    if (new Date(endDate) < new Date(startDate)) {
      setErrors((prevErrors) => ({
        ...prevErrors,
        to: "End Date cannot be before Start Date",
      }));
      return;
    }
    // Prepare form data to send
    const applyDate = getTodayDate();
    const formDataToSend = new FormData();
    formDataToSend.append("email", email);
    formDataToSend.append("empname", username);
    formDataToSend.append("empid", empid);
    formDataToSend.append("leaveType", leaveType);
    formDataToSend.append("applyDate", applyDate);
    formDataToSend.append("startDate", startDate);
    formDataToSend.append("endDate", endDate);

    // Append file and reason if they exist

    if (file) {
      formDataToSend.append("attachment", file);
    } else {
      // If no file, append an empty string (or null if you prefer)
      formDataToSend.append("attachment", "");
    }

    if (reason) {
      formDataToSend.append("reason", reason);
    } else {
      formDataToSend.append("reason", null);
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
        const errorData = await response.json();
        throw new Error(
          errorData.message || "Failed to submit form. Please try again later."
        );
      }

      const result = await response.json();
      alert(result.message);
      // Optionally reset form data or perform any other necessary actions after submission
    } catch (error) {
      console.error("Error submitting form:", error);
      alert(error.message); // Display the error message to the user
    }
  };
  const handleReject = async () => {
    if (selectedLeave) {
      const { selectedIndex, ...leave } = selectedLeave;

      const wasApproved = leave.status[selectedIndex] === "Approved";

      const updatedLeave = {
        ...leave,
        status: leave.status.map((stat, index) =>
          index === selectedIndex && (stat === "pending" || stat === "Approved")
            ? "Rejected"
            : stat
        ),
        availableLeaves: wasApproved
          ? leave.availableLeaves + 1
          : leave.availableLeaves,
        usedLeaves: wasApproved ? leave.usedLeaves - 1 : leave.usedLeaves,
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

      const currentStatus = leave.status[selectedIndex].toLowerCase();

      if (currentStatus !== "pending" && currentStatus !== "rejected") {
        console.log("This leave is already approved.");
        return;
      }

      const updatedLeave = {
        ...leave,
        availableLeaves:
          leave.availableLeaves > 0
            ? leave.availableLeaves - 1
            : leave.availableLeaves,
        usedLeaves: leave.usedLeaves + 1,
        status: leave.status.map((stat, index) =>
          index === selectedIndex &&
          (stat.toLowerCase() === "pending" ||
            stat.toLowerCase() === "rejected")
            ? "Approved"
            : stat
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
  const handleFilterChange = (e) => {
    setSelectedFilter(e.target.value);
  };

  // Filter the leave history based on the selected filter
  const filteredLeaveHistory = leaveHistory.filter((leave) =>
    selectedFilter === "All"
      ? true
      : leave.status.some(
          (status) => status.toLowerCase() === selectedFilter.toLowerCase()
        )
  );
  const getDownloadLink = (attachments) =>
    `http://localhost:5001/${attachments}`;

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
            leavepolicyRef={leavepolicyRef}
          />
        );

      case "profile":
        return (
          <ProfilePage
            Profile={Profile}
            username={username}
            empid={empid}
            email={email}
            project={project}
            leaveData={leaveData}
          />
        );

      case "leaverequests":
        return (
          <div className="history-container">
            <h2>Leave Requests</h2>

            <div className="filter-container">
              <FormGroup row sx={{ justifyContent: "flex-end" }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      value="All"
                      checked={selectedFilter === "All"}
                      onChange={handleFilterChange}
                    />
                  }
                  label="All"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      value="Pending"
                      checked={selectedFilter === "Pending"}
                      onChange={handleFilterChange}
                    />
                  }
                  label="Pending"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      value="Approved"
                      checked={selectedFilter === "Approved"}
                      onChange={handleFilterChange}
                      sx={{
                        "&.Mui-checked": {
                          color:
                            selectedFilter === "Approved" ? "green" : "default", // Changes checkbox color to green when checked
                        },
                      }}
                    />
                  }
                  label="Approved"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      value="Rejected"
                      checked={selectedFilter === "Rejected"}
                      onChange={handleFilterChange}
                      sx={{
                        "&.Mui-checked": {
                          color:
                            selectedFilter === "Rejected" ? "red" : "default", // Changes checkbox color to green when checked
                        },
                      }}
                    />
                  }
                  label="Rejected"
                />
              </FormGroup>
            </div>

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
                {filteredLeaveHistory.map((leave) =>
                  leave.startDate.map((startDate, index) => {
                    // Only render rows where the specific status matches the selected filter
                    if (
                      selectedFilter === "All" ||
                      leave.status[index].toLowerCase() ===
                        selectedFilter.toLowerCase()
                    ) {
                      return (
                        <tr key={`${leave._id}-${index}`}>
                          <td>{leave.empid || "N/A"}</td> {/* Access empid */}
                          <td>{leave.empname || "N/A"}</td>{" "}
                          {/* Access empname */}
                          <td>{leave.leaveType.toLowerCase()
          .replace(/\b\w/g, (char) => char.toUpperCase())}</td>
                          <td>
                            {leave.duration ? leave.duration[index] : "N/A"}
                          </td>
                          <td>{new Date(startDate).toLocaleDateString()}</td>
                          <td>
                            {new Date(
                              leave.endDate[index]
                            ).toLocaleDateString()}
                          </td>
                          <td>{leave.availableLeaves}</td>
                          <td>
                            {leave.attachments?.[index] ? (
                              <a
                                href={getDownloadLink(leave.attachments[index])}
                                download
                              >
                                <AiFillFilePdf size={30} color="red" />
                              </a>
                            ) : (
                              <AiOutlineExclamationCircle
                                size={30}
                                color="orange"
                                style={{ cursor: "default" }}
                              />
                            )}
                          </td>
                          <td>{leave.reason ? leave.reason[index] : "N/A"}</td>
                          <td>
                            {leave.status[index].toLowerCase() ===
                              "approved" && (
                              <button
                                onClick={() => handleRowClick(leave, index)}
                                style={{
                                  color: "green",
                                  display: "flex",
                                  alignItems: "center",
                                  background: "none",
                                  border: "none",
                                  cursor: "pointer",
                                }}
                              >
                                <MdCheckCircle
                                  size={24}
                                  style={{ marginRight: "5px" }}
                                />
                              </button>
                            )}
                            {leave.status[index].toLowerCase() ===
                              "rejected" && (
                              <button
                                onClick={() => handleRowClick(leave, index)}
                                style={{
                                  color: "red",
                                  display: "flex",
                                  alignItems: "center",
                                  background: "none",
                                  border: "none",
                                  cursor: "pointer",
                                }}
                              >
                                <MdCancel
                                  size={24}
                                  style={{ marginRight: "5px" }}
                                />
                              </button>
                            )}
                            {leave.status[index].toLowerCase() !== "approved" &&
                              leave.status[index].toLowerCase() !==
                                "rejected" && (
                                <button
                                  onClick={() => handleRowClick(leave, index)}
                                  style={{
                                    display: "flex",
                                    color: "blue",
                                    alignItems: "center",
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
                      );
                    }
                    return null; // Skip rows that don't match the filter
                  })
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
                  bgcolor: "background.paper",
                  boxShadow: 24,
                  p: 4,
                  borderRadius: "10px",
                  textAlign: "center",
                }}
              >
                {/* Close Icon */}
                <IconButton
                  onClick={handleCloseModal}
                  sx={{
                    position: "absolute",
                    top: 10,
                    right: 10,
                    color: "gray",
                    "&:hover": { color: "black" },
                  }}
                >
                  <AiOutlineClose size={24} />
                </IconButton>
                <h3 style={{ marginBottom: "20px" }}>
                  Approve or Reject Request?
                </h3>

                {/* Added code: Determine current status and toggle button enable/disable */}
                {selectedLeave &&
                  (() => {
                    // Retrieve current status using the selected index
                    const currentStatus =
                      (selectedLeave.status &&
                        selectedLeave.status[selectedLeave.selectedIndex]) ||
                      "pending";

                    return (
                      <div className="action-buttons">
                        <button
                          onClick={handleApprove}
                          className="approve-btn"
                          disabled={currentStatus.toLowerCase() === "approved"}
                          style={{
                            opacity:
                              currentStatus.toLowerCase() === "approved"
                                ? 0.5
                                : 1,
                            cursor:
                              currentStatus.toLowerCase() === "approved"
                                ? "not-allowed"
                                : "pointer",
                          }}
                        >
                          ✅ Approve
                        </button>
                        <button
                          onClick={handleReject}
                          className="reject-btn"
                          disabled={currentStatus.toLowerCase() === "rejected"}
                          style={{
                            opacity:
                              currentStatus.toLowerCase() === "rejected"
                                ? 0.5
                                : 1,
                            cursor:
                              currentStatus.toLowerCase() === "rejected"
                                ? "not-allowed"
                                : "pointer",
                          }}
                        >
                          ❌ Reject
                        </button>
                      </div>
                    );
                  })()}
              </Box>
            </Modal>
          </div>
        );
      case "reports":
        return (
          <div className="profile-content">
            <Reports />
          </div>
        );
      case "history":
        return <LeaveHistory leaveHistory={leavehistory} />;
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
