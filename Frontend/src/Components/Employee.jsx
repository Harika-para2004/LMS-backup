/*imports*/
import React, { useEffect, useState } from "react";
import "../App.css";
import Profile from "../assets/img/profile.png";
import { Link } from "react-router-dom";
import logo from "./../assets/img/quadfacelogo-hd.png";
import Grid from "@mui/material/Grid";
import axios from "axios";
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
  faHistory,
  faUser,
  faSignOutAlt,
  faUserCircle,
  faKey,
} from "@fortawesome/free-solid-svg-icons";
import ProfilePage from "./ProfilePage";
import LeaveHistory from "./LeaveHistory";
import ApplyLeave from "./ApplyLeave";
import Sidebar from "./Sidebar";

const App = () => {
  const [selectedCategory, setSelectedCategory] = useState("apply-leave");
  const [userData, setUserData] = useState(null);
  const [username, setUsername] = useState("");
  const [empid, setEmpid] = useState("");
  const [email, setEmail] = useState("");
  const [designation, setDesignation] = useState("");
  const [project, setProject] = useState("");
  const [holidays, setHolidays] = useState([]);
  const [leaveHistory, setLeaveHistory] = useState([]);
  const [leaveData, setLeaveData] = useState([]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [profileImage, setProfileImage] = useState(Profile);
  const [file, setFile] = useState(null);
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

  const handleBlur = (e) => {
    const { name, value } = e.target;
    if (!value || value == "Select Leave Type") {
      setErrors({
        ...errors,
        [name]: "Required field",
      });
    }
  };

  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  };

  // const handleFileChange = (event) => {
  //   const file = event.target.files[0];
  //   if (file) {
  //     console.log("Selected file:", file);
  //     // Update the state or form data as needed
  //   }
  // };

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  // const handleLogout = () => {
  //   window.location.href = "/login";
  // };
  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");  // Redirects user after logout
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
    }else {
      // If no file, append null value
      formDataToSend.append("attachment", null);
    }
    if (reason) {
      formDataToSend.append("reason", reason);
    }else{
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
        throw new Error("Failed to submit form. Please try again later.");
      }

      const result = await response.json();
      alert(result.message);
    } catch (error) {
      console.error("Error submitting form:", error);
      alert("An error occurred while submitting the form.");
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
    const fetchLeaveData = async () => {
      try {
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
  }, [email]);

  console.log(leaveData);

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
    if (selectedCategory === "history") {
      fetchLeaveHistory();
    }
  }, [selectedCategory]);

  const handleUpdateProfile = async () => {
    try {
      const response = await fetch(`http://localhost:5001/update-profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          designation,
          project,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        alert(data.message || "Profile updated successfully!");
        setUserData((prevData) => ({
          ...prevData,
          email,
          designation,
          project,
        }));
        localStorage.setItem(
          "userData",
          JSON.stringify({
            ...userData,
            email,
            designation,
            project,
          })
        );
      } else {
        alert("Failed to update profile. Please try again.");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("An error occurred. Please try again.");
    }
  };

 

  const renderContent = () => {
    switch (selectedCategory) {
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
          leavePolicies={leavePolicies} 
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

      case "history":
        return (
          <LeaveHistory leaveHistory={leaveHistory} />

        );
      default:
        return null;
    }
  };

  return (
    <div className="dashboard-container">
      {/* <header className="header">
        
      </header> */}
      <div className="content">
        <Sidebar
          userType="employee"
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          username={username}
          empid={empid}
          handleLogout={handleLogout}
          logo={logo}
          profileImage={profileImage}
        />

        <div className="main-content">{renderContent()}</div>
      </div>
    </div>
  );
};

export default App;
