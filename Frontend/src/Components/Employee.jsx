import React, { useEffect, useState } from "react";
import "../App.css";
import Profile from "../assets/img/profile.png";
import { Link, useNavigate } from "react-router-dom";
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
        project, setProject,
        designation, setDesignation,
        leaveHistory, setLeaveHistory,
        holidays, setHolidays,
        profileImage, setProfileImage,
        newPassword, setNewPassword,
        confirmPassword, setConfirmPassword,
        userData, setUserData,
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



  useEffect(() => {
    const fetchLeavePolicies = async () => {
      try {
        const response = await axios.get(
          "http://localhost:5001/api/leave-policies"
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
  };

  const formatCase = (text) => {
    return text.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
  };

  

  const handleSubmit = async (event) => {
    event.preventDefault();

    const { leaveType, startDate, endDate, reason } = formData;
    const today = dayjs().format("YYYY-MM-DD");
    const formattedStartDate = dayjs(startDate, "DD/MM/YYYY").format(
      "YYYY-MM-DD"
    );
    const formattedEndDate = dayjs(endDate, "DD/MM/YYYY").format("YYYY-MM-DD");

    // **✅ Required Fields Check**
    if (!leaveType || !startDate || !endDate) {
      showToast("All fields are required.", "warning");
      return;
    }

    // **✅ Valid Date Range Check**
    if (new Date(formattedEndDate) < new Date(formattedStartDate)) {
      showToast("End Date cannot be before Start Date.", "error");
      return;
    }

    // **✅ No Holidays or Weekends**
    const isHoliday = holidays.some(
      (holiday) =>
        holiday.type === "Mandatory" &&
        dayjs(holiday.date).isSame(formattedStartDate, "day")
    );
    if (isHoliday) {
      showToast("You cannot apply leave on company holidays.", "warning");
      return;
    }

    const isWeekend =
      dayjs(formattedStartDate).day() === 0 ||
      dayjs(formattedStartDate).day() === 6;
    if (isWeekend) {
      showToast("Weekends are not allowed for leave.", "warning");
      return;
    }

    // **✅ Cannot Apply for Same Leave Twice**
    const alreadyApplied = leaveHistory.some(
      (leave) =>
        leave.leaveType === leaveType &&
        dayjs(leave.startDate).isSame(formattedStartDate, "day") &&
        dayjs(leave.endDate).isSame(formattedEndDate, "day")
    );
    if (alreadyApplied) {
      showToast(`You have already applied for ${leaveType}.`, "info");
      return;
    }

    // **✅ Leave Balance Check**
    const appliedLeave = leaveData.find(
      (leave) => formatCase(leave.leaveType) === formatCase(leaveType)
    );
    const leaveBalance =
      appliedLeave?.availableLeaves ??
      leavePolicyRef.find(
        (policy) => formatCase(policy.leaveType) === formatCase(leaveType)
      )?.maxAllowedLeaves ??
      0;

    const requestedDays =
      dayjs(formattedEndDate).diff(dayjs(formattedStartDate), "day") + 1;

    if (requestedDays > leaveBalance && leaveType !== "LOP") {
      showToast(
        `Only ${leaveBalance} ${leaveType} leaves are available.`,
        "error"
      );
      return;
    }

    // **✅ Gender-Based Leave Restrictions**
    if (leaveType.includes("Maternity") && gender !== "Female") {
      showToast("Maternity Leave is only for female employees.", "error");
      return;
    }
    if (leaveType.includes("Paternity") && gender !== "Male") {
      showToast("Paternity Leave is only for male employees.", "error");
      return;
    }

    // **✅ Sick Leave Past or Current Dates Only**
    if (
      leaveType === "Sick Leave" &&
      dayjs(formattedStartDate).isAfter(today)
    ) {
      showToast(
        "Sick Leave can only be applied for past or current dates.",
        "warning"
      );
      return;
    }

    // **✅ No Overlapping Leaves**
    const hasOverlap = leaveHistory.some(
      (leave) =>
        dayjs(leave.startDate, "DD/MM/YYYY").isBefore(
          dayjs(formattedEndDate, "YYYY-MM-DD")
        ) &&
        dayjs(leave.endDate, "DD/MM/YYYY").isAfter(
          dayjs(formattedStartDate, "YYYY-MM-DD")
        )
    );
    if (hasOverlap) {
      showToast(
        "Your selected leave dates overlap with an existing leave.",
        "error"
      );
      return;
    }    if (
      leaveType === "LOP" &&
      leaveData.find((leave) => leave.leaveType === "Casual Leave")
        ?.availableLeaves > 0
    ) {
      showToast(
        "LOP can only be applied when Casual Leaves are exhausted.",
        "info"
      );
      return;}    const formDataToSend = new FormData();
    formDataToSend.append("email", email);
    formDataToSend.append("empname", username);
    formDataToSend.append("empid", empid);
    formDataToSend.append("managerEmail", managerEmail);
    formDataToSend.append("leaveType", leaveType);
    formDataToSend.append("applyDate", today);
    formDataToSend.append("startDate", formattedStartDate);
    formDataToSend.append("endDate", formattedEndDate);
    if (file) formDataToSend.append("attachment", file);
    formDataToSend.append("reason", reason || "N/A");

    try {
      const response = await fetch(
        `http://localhost:5001/apply-leave?email=${encodeURIComponent(email)}`,
        { method: "POST", body: formDataToSend }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to submit form.");
      }

      showToast("Leave application submitted successfully!", "success");
      setFormData({ leaveType: "", startDate: "", endDate: "", reason: "" });
      setFile(null);
      setErrors({});
    } catch (error) {
      console.error("Error submitting form:", error);
      showToast(error.message, "error");
    }
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
      }      return parseInt(dayA, 10) - parseInt(dayB, 10);
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
      fetchLeaveHistory();
  }, []);

  useEffect(() => {
    fetchLeaveHistory();
  }, []);
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
  
  
  const renderContent = () => {
    switch (selectedCategory) {
      case "dashboard":
        return(
        <EmployeeDashboard email={email} /> );
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
        return <LeaveHistory leaveHistory={leaveHistory} handleDelete={handleDelete}/>;
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
        <main className="main-content">
  <Outlet />
</main>
      </div>
    </div>

  );
};

export default App;