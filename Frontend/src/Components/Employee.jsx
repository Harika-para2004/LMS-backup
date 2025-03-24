import React, { useEffect, useState } from "react";
import "../App.css";
import Profile from "../assets/img/profile.png";
import { Link, useLocation, useNavigate } from "react-router-dom";
import logo from "./../assets/img/quadfacelogo-hd.png";
import Grid from "@mui/material/Grid";
import axios from "axios";
import useToast from "./useToast";
import ProfilePage from "./ProfilePage";
import LeaveHistory from "./LeaveHistory";
import ApplyLeave from "./ApplyLeave";
import Sidebar from "./Sidebar";
import dayjs from "dayjs";
import EmployeeDashboard from "./EmployeeDashboard";
import { Outlet } from "react-router-dom";
import { useManagerContext } from "../context/ManagerContext";
import Navbar from "./Navbar";
const backendUrl = import.meta.env.VITE_BACKEND_URL;

const App = () => {
  // const [selectedCategory, setSelectedCategory] = useState("dashboard");
  // const [userData, setUserData] = useState(null);
  // const [username, setUsername] = useState("");
  // const [empid, setEmpid] = useState("");
  // const [email, setEmail] = useState("");
  // const [gender, setGender] = useState("");
  // const [managerEmail, setmanagerEmail] = useState("");
  // const [designation, setDesignation] = useState("");
  // const [project, setProject] = useState("");
  // const [holidays, setHolidays] = useState([]);
  // const [leaveHistory, setLeaveHistory] = useState([]);
  // const [leaveData, setLeaveData] = useState([]);
  // const [newPassword, setNewPassword] = useState("");
  // const [confirmPassword, setConfirmPassword] = useState("");
  // const [profileImage, setProfileImage] = useState(Profile);
  // const [file, setFile] = useState(null);
  // const [error, setError] = useState("");
  // const year = new Date().getFullYear();
  // const navigate = useNavigate(); // Correct usage of useNavigate
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
  // const [leavePolicies, setLeavePolicies] = useState([]);
  // const [leavePolicyRef, setLeavePolicyRef] = useState([]);

  const {
    modalOpen,
    setModalOpen,
    leaveRequests,
    setLeaveRequests,
    selectedLeave,
    setSelectedLeave,
    selectedCategory,
    setSelectedCategory,
    leaveData,
    setLeaveData,
    managerEmail,
    setManagerEmail,
    email,
    setEmail,
    gender,
    setGender,
    empid,
    setEmpid,
    username,
    setUsername,
    project,
    setProject,
    designation,
    setDesignation,
    leaveHistory,
    setLeaveHistory,
    holidays,
    setHolidays,
currentholidays,
setCurrentHolidays,
    profileImage,
    setProfileImage,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    userData,
    setUserData,
    file,
    setFile,
    selectedFilter,
    setSelectedFilter,
    error,
    setError,
    leavePolicyRef,
    setLeavePolicyRef,
    mergedLeaveData,
    setMergedLeaveData,
    errors,
    setErrors,
    formData,
    setFormData,
    leavePolicies,
    setLeavePolicies,
    navigate,
    showToast,
  } = useManagerContext();
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    const fetchLeavePolicies = async () => {
      try {
        const response = await axios.get(
          `${backendUrl}/api/leave-policies`
        );
        console.log("API Response:", response.data);

        setLeavePolicyRef(response.data.data);

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
  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };
  const handleLogout = (e) => {
    e.preventDefault();
    localStorage.clear();
    navigate("/"); // Redirects user after logout
    window.location.reload();
  };

  const formatCase = (text) => {
    return text.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
  };

  useEffect(() => {
    const storedUserData = localStorage.getItem("userData");
    if (storedUserData) {
      try {
        const parsedUserData = JSON.parse(storedUserData);
        if (parsedUserData) {
          setUserData(parsedUserData);
          setUsername(parsedUserData.empname || "");
          setEmpid(parsedUserData.empid || "");
          setGender(parsedUserData.gender || "");
          setManagerEmail(parsedUserData.managerEmail || "");
          setEmail(parsedUserData.email || "");
          setProject(parsedUserData.project || "");
        }
      } catch (error) {
        console.error("Error parsing userData from localStorage:", error);
      }
    }
  }, []);

  // console.log(username)
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
      if (monthIndexA !== monthIndexB) {
        return monthIndexA - monthIndexB;
      }
      return parseInt(dayA, 10) - parseInt(dayB, 10);
    });
  };

  useEffect(() => {
    const fetchLeaveData = async () => {
      try {
        console.log("email in emp", email);
        console.log("user email", userData.email);
        const response = await fetch(
          `${backendUrl}/leavesummary?email=${email}`
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

  useEffect(() => {
    const fetchHolidays = async () => {
      try {
        const response = await fetch(`${backendUrl}/allholidays`);
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
  useEffect(() => {
    const fetchcurrentHolidays = async () => {
      try {
        const response = await fetch(`${backendUrl}/holidays?year=${currentYear}`);
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();

        // Sort the fetched holidays before setting the state
        const sortedHolidays = sortHolidaysByMonthAndCustomDay(data);
        console.log("current",sortedHolidays)
        // Set the sorted holidays
        setCurrentHolidays(sortedHolidays);
      } catch (error) {
        console.error("Error fetching holidays:", error);
        setError("Failed to fetch holidays.");
      }
    };

    fetchcurrentHolidays();
  }, []);

  const fetchLeaveHistory = async () => {
    try {
      const response = await fetch(
        `${backendUrl}/leave-history?email=${email}`
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
    if (userData && userData.email && userData.role) {
      console.log("Fetching leave requests for:", userData.email);
      fetchLeaveHistory();
    }
  }, [userData]);

  // useEffect(() => {
  //   fetchLeaveHistory();
  // }, []);
  const handleDelete = async (id, startDate) => {
    if (!id || !startDate) {
      console.error("Error: ID or startDate is undefined");
      return;
    }

    try {
      const response = await fetch(`${backendUrl}/leaves/${id}`, {
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
      fetchLeaveHistory();
    } catch (error) {
      console.error("Error deleting leave:", error);
    }
  };

  const renderContent = () => {
    switch (selectedCategory) {
      case "dashboard":
        return <EmployeeDashboard email={email} gender={gender} />;
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
            currentholidays={currentholidays}
            getTodayDate={getTodayDate}
            leavePolicies={leavePolicies}
            leavePolicyRef={leavePolicyRef}
            leaveHistory={leaveHistory}
            leaveData={leaveData}
            gender={gender}
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
            gender={gender}
          />
        );
      case "history":
        return (
          <LeaveHistory
            leaveHistory={leaveHistory}
            handleDelete={handleDelete}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="dashboard-container">
      <div className="content">
        <Sidebar
          userType="employee"
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          username={username}
          empid={empid}
          handleLogout={handleLogout}
          logo={logo}
          Profile={Profile}
        />

        {/* <div className="main-content">{renderContent()}</div> */}
        <div className="nav-main-cont">
          {" "}
          <Navbar
            userType="employee"
            email={email}
            handleLogout={handleLogout}
          />
          <main className="main-content">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};

export default App;
