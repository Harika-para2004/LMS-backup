import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { Link, Outlet, useLocation } from "react-router-dom";
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
import useToast from "./useToast";
import ManagerDashboard from "./ManagerDashboard";

import {
  AiFillFilePdf,
  AiOutlineClose,
  AiOutlineExclamationCircle,
} from "react-icons/ai";
import Reports from "./Reports";
import { formatDate } from "../utils/dateUtlis";
import LeaveRequestsTable from "./LeaveRequestsTable";
import dayjs from "dayjs";

import { useManagerContext } from "../context/ManagerContext";


function LeaveRequests() {
  // const [modalOpen, setModalOpen] = useState(false);
  // const [leaveHistory, setLeaveHistory] = useState([]);
  // const [selectedLeave, setSelectedLeave] = useState(null);
  // const [selectedCategory, setSelectedCategory] = useState("leaverequests");
  // const [leaveData, setLeaveData] = useState([]);
  // const [managerEmail, setmanagerEmail] = useState("");
  // const [email, setEmail] = useState("");
  // const [gender, setGender] = useState("");
  // const [empid, setEmpid] = useState("");
  // const [username, setUsername] = useState("");
  // const [project, setProject] = useState("");
  // const [designation, setDesignation] = useState("");
  // const [leavehistory, setLeavehistory] = useState([]);
  // const [holidays, setHolidays] = useState([]);
  // const [profileImage, setProfileImage] = useState(Profile);
  // const [newPassword, setNewPassword] = useState("");
  // const [confirmPassword, setConfirmPassword] = useState("");
  // const [userData, setUserData] = useState(null);
  // const [file, setFile] = useState(null);
  // const [selectedFilter, setSelectedFilter] = useState("All");
  // const [error, setError] = useState("");
  // const navigate = useNavigate();
  // const [leavePolicyRef, setLeavePolicyRef] = useState([]);
  // const year = new Date().getFullYear();
  // const showToast = useToast();

  // const [errors, setErrors] = useState({
  //   leaveType: "",
  //   from: "",
  //   to: "",
  //   reason: "",
  //   mismatch: "",
  // });
  // const [formData, setFormData] = useState({
  //   leaveType: "",
  //   applyDate: "",
  //   startDate: "",
  //   endDate: "",
  //   reason: "",
  // });
  // const [mergedLeaveData, setMergedLeaveData] = useState([]);

  const {
    modalOpen, setModalOpen,
    leaveRequests, setLeaveRequests,
        selectedLeave, setSelectedLeave,
        selectedCategory, setSelectedCategory,
        leaveData, setLeaveData,
        managerEmail, setManagerEmail,
        email, setEmail,
        gender, setGender,
        empid, setEmpid,
        username, setUsername,
        role,setRole,
        project, setProject,
        designation, setDesignation,
        leaveHistory, setLeaveHistory,
        holidays, setHolidays,
        profileImage, setProfileImage,
        newPassword, setNewPassword,
        confirmPassword, setConfirmPassword,
        // userData, setUserData,
        file, setFile,
        selectedFilter, setSelectedFilter,
        error, setError,
        leavePolicyRef, setLeavePolicyRef,
        mergedLeaveData, setMergedLeaveData,
        errors, setErrors,
        formData, setFormData,
        leavePolicies,setLeavePolicies,
        navigate,
        showToast
  } = useManagerContext();
  const location = useLocation();
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [userData, setUserData] = useState(() => {
    const storedAdmin = localStorage.getItem("admin");
    return (
      (storedAdmin ? { email: JSON.parse(storedAdmin), role: "Admin" } : {}) ||
      location.state?.userData ||
      {}
    );
  });


  const yearsRange = useMemo(() => Array.from({ length: 18 }, (_, i) => currentYear + 1 - i), [currentYear]);
  const filteredLeaves = leaveRequests.filter((leave) => {
    const yearValues = leave.year.flat(2); // Flatten nested arrays
    return yearValues.includes(Number(selectedYear)); // Check if selectedYear exists in the array
  });

  useEffect(() => {
    const fetchLeavePoliciesData = async () => {
      try {
        const response = await axios.get(
          "http://localhost:5001/api/leave-policies"
        );
        console.log("leave policy Response:", response.data);

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

    fetchLeavePoliciesData();
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

  const fetchLeaveHistory = async () => {
    try {
      const response = await fetch(
        `http://localhost:5001/leave-history?email=${email}`
      );
      if (response.ok) {
        const data = await response.json();
        setLeaveHistory(data);
      } else {
        console.error("Failed to fetch leave history");
      }
    } catch (error) {
      console.error("Error fetching leave history:", error);
    }
  };

  useEffect(() => {
    if(email){
      fetchLeaveHistory();}
  }, [email]);

  const fetchLeaveRequests = async () => {
    try {
      const response = await fetch(
        `http://localhost:5001/leaverequests?userRole=${userData.role}&userEmail=${userData.email}&year=${selectedYear}`
      );
      if (response.ok) {
        const data = await response.json();
        const sortedData = data.sort(
          (a, b) => new Date(b.applyDate) - new Date(a.applyDate)
        );
        setLeaveRequests(sortedData);
      } else {
        console.error("Failed to fetch leave history");
      }
    } catch (error) {
      console.error("Error fetching leave history:", error);
    }
  };
  

  useEffect(() => {
    if (userData.role !== "Admin" && userData.email && selectedYear && userData.role === "Manager" ) {
      console.log(`Fetching leave requests for ${userData.email} in ${selectedYear} role is ${userData.role}`);
      fetchLeaveRequests();
    }
  }, [userData.email, selectedYear,userData.role]); 
  
  useEffect(() => {
    const storedUserData = localStorage.getItem("userData");
    console.log("storedUserData",storedUserData);
    if (storedUserData) {
      try {
        const parsedUserData = JSON.parse(storedUserData);
        if (parsedUserData) {
          setUserData(parsedUserData);
          setUsername(parsedUserData.empname || "");
          setEmpid(parsedUserData.empid || "");
          setManagerEmail(parsedUserData.managerEmail || "")
          setEmail(parsedUserData.email || "");
          setGender(parsedUserData.gender || "");
          setProject(parsedUserData.project || "");
          setRole(parsedUserData.role || "");
        }
      } catch (error) {
        console.error("Error parsing userData from localStorage:", error);
      }
    }
  }, []);

  useEffect(() => {
    const fetchLeaveData = async () => {
      try {
        console.log("email in emp",email);
        console.log("user email",userData.email)
        const response = await fetch(
          `http://localhost:5001/leavesummary?email=${email}`
        );
        if (response.ok) {
          const data = await response.json();
          console.log("Fetched Data:", data);
          setLeaveData(data);
        } else {
          console.error("Failed to fetch leave data");
        }
      } catch (error) {
        console.error("Error fetching leave data:", error);
      }
    };

    fetchLeaveData();
  }, []); 
  
  //   // if (email) {
  //     const fetchLeaveData = async () => {
  //       try {
  //         const response = await fetch(
  //           `http://localhost:5001/leavesummary?email=${email}`
  //         );
  //         if (response.ok) {
  //           const data = await response.json();
  //           console.log(data);
  //           setLeaveData(data);
  //         } else {
  //           console.error("Failed to fetch leave data");
  //         }
  //       } catch (error) {
  //         console.error("Error fetching leave data:", error);
  //       }
  //     };
  //     fetchLeaveData();
  //   // }
  // }, [leaveData]);
  
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
  const handleLogout = (e) => {
    e.preventDefault();
    localStorage.clear();
    navigate("/"); 
    window.location.reload(); 
  };

  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  };

  const formatCase = (text) => {
    return text.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
  };
  
  const handleReject = async () => {
    if (selectedLeave) {
      const { selectedIndex, ...leave } = selectedLeave;
  
      if (
        selectedIndex === undefined ||
        !Array.isArray(leave.duration) ||
        leave.duration.length === 0 ||
        selectedIndex >= leave.duration.length
      ) {
        console.error("Invalid leave duration or selected index:", selectedLeave);
        return;
      }
  
      const leaveDuration = leave.duration[selectedIndex]; 
      const wasApproved = leave.status[selectedIndex]?.toLowerCase() === "approved"; 
  
      // Fetch the policy to check maxAllowedLeaves
      const policy = leavePolicyRef.find(
        (policy) => formatCase(policy.leaveType) === formatCase(leave.leaveType)
      );
  
      const maxAllowedLeaves = policy?.maxAllowedLeaves ?? null; // Null means unlimited
  
      // Update availableLeaves only if leave type has a limit
      const updatedLeave = {
        ...leave,
        status: leave.status.map((stat, index) =>
          index === selectedIndex && (stat.toLowerCase() === "pending" || stat.toLowerCase() === "approved")
            ? "Rejected"
            : stat
        ),
        availableLeaves: wasApproved && maxAllowedLeaves !== null ? leave.availableLeaves + leaveDuration : leave.availableLeaves,
        usedLeaves: wasApproved && maxAllowedLeaves !== null ? leave.usedLeaves - leaveDuration : leave.usedLeaves,
      };
  
      try {
        const response = await fetch(
          `http://localhost:5001/leaverequests/${leave._id}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updatedLeave),
          }
        );
  
        if (response.ok) {
          const updatedLeaveFromServer = await response.json();
          setLeaveRequests((prevHistory) =>
            prevHistory.map((item) =>
              item._id === updatedLeaveFromServer._id ? updatedLeaveFromServer : item
            )
          );
          setSelectedLeave(null);
          setModalOpen(false);
          console.log("Rejected and updated in the database:", updatedLeaveFromServer);
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
  
      // Ensure selectedIndex is valid
      if (
        selectedIndex === undefined ||
        !Array.isArray(leave.duration) ||
        leave.duration.length === 0 ||
        selectedIndex >= leave.duration.length
      ) {
        console.error("Invalid leave duration or selected index:", selectedLeave);
        return;
      }
  
      const leaveDuration = leave.duration[selectedIndex]; 
      const currentStatus = leave.status[selectedIndex]?.toLowerCase();
      
      // Check if leave is already approved
      if (!currentStatus || (currentStatus !== "pending" && currentStatus !== "rejected")) {
        console.log("This leave is already approved.");
        return;
      }
  
      // Fetch the policy to check maxAllowedLeaves
      const policy = leavePolicyRef.find(
        (policy) => formatCase(policy.leaveType) === formatCase(leave.leaveType)
      );
  
      const maxAllowedLeaves = policy?.maxAllowedLeaves ?? 0; // Null means unlimited
  
      // Allow approval without checking availableLeaves if maxAllowedLeaves is null (unlimited leave)
      if (maxAllowedLeaves === 0 || leave.availableLeaves >= leaveDuration) {
        const updatedLeave = {
          ...leave,
          availableLeaves: maxAllowedLeaves !== 0 ? leave.availableLeaves - leaveDuration : leave.availableLeaves, 
          usedLeaves: maxAllowedLeaves !== 0 ? leave.usedLeaves + leaveDuration : leave.usedLeaves,
          status: leave.status.map((stat, index) =>
            index === selectedIndex && (stat.toLowerCase() === "pending" || stat.toLowerCase() === "rejected")
              ? "Approved"
              : stat
          ),
        };
  
        try {
          const response = await fetch(
            `http://localhost:5001/leaverequests/${leave._id}`,
            {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(updatedLeave),
            }
          );
  
          if (response.ok) {
            const updatedLeaveFromServer = await response.json();
            setLeaveRequests((prevHistory) =>
              prevHistory.map((item) =>
                item._id === updatedLeaveFromServer._id ? updatedLeaveFromServer : item
              )
            );
            setSelectedLeave(null);
            setModalOpen(false);
            console.log("Approved and updated in the database:", updatedLeaveFromServer);
          } else {
            console.error("Failed to update leave in the database");
          }
        } catch (error) {
          console.error("Error updating leave in the database:", error);
        }
      } else {
        console.log("Not enough available leaves.");
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
  const filteredLeaveRequests = leaveRequests.filter((leave) =>
    selectedFilter === "All"
      ? true
      : leave.status.some(
          (status) => status.toLowerCase() === selectedFilter.toLowerCase()
        )
  );

  const handleDelete = async (id, startDate) => {
    if (!id || !startDate) {
      console.error("Error: ID or startDate is undefined");
      return;
    }
  
    try {
      const response = await fetch(`http://localhost:5001/leaves/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ startDate }), // Pass startDate in the body for matching
      });
  
      if (!response.ok) {
        throw new Error("Failed to delete leave");
      }
  
      showToast("Leave deleted successfully!", "success");
      // Remove the deleted leave from the state
 fetchLeaveHistory()
    } catch (error) {
      console.error("Error deleting leave:", error);
    }
  };
  
  const getDownloadLink = (attachments) =>
    `http://localhost:5001/${attachments}`;

  const renderContent = () => {
    switch (selectedCategory) {
      case "dashboard":
        return(
        <ManagerDashboard email={email} /> );
      case "profile":
        return (
          <div>
              <ProfilePage
            Profile={Profile}
            username={username}
            empid={empid}
            email={email}
            project={project}
            leaveData={leaveData}
            userData={userData}
            gender={gender}
          />
           
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
            leavePolicyRef={leavePolicyRef}
            leaveHistory={leaveHistory}
            leaveData={leaveData}
            gender={gender}
          />
        );

     

      case "leaverequests":
        return (


          <div>
          <LeaveRequestsTable
            filteredLeaveHistory={filteredLeaveHistory}
            selectedFilter={selectedFilter}
            handleFilterChange={handleFilterChange}
            handleRowClick={handleRowClick}
            getDownloadLink={getDownloadLink}
          />
    
          {/* Modal for Approve/Reject */}
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

      case "history":
        return <LeaveHistory leaveHistory={leaveHistory} handleDelete={handleDelete}/>;
        
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
          Profile={Profile}
        />
        {/* <main className="main-content">{renderContent()}</main> */}
        <div className="main-content">
        <Outlet />
      </div>
      </div>
    </div>
  );
}

export default LeaveRequests;