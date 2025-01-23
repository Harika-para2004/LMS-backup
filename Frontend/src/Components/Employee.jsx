/*imports*/
import React, { useEffect, useState } from "react";
import "../App.css";
import Profile from "../assets/img/profile.png";
import { Link } from "react-router-dom";
import logo from "./../assets/img/logo.jpg";
import Grid from '@mui/material/Grid';

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
  const [profileImage, setProfileImage] = useState(null);
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



  const handleLogout = () => {

    window.location.href = "/login";
  };

    const handleSubmit = async (event) => {
    event.preventDefault();

    const { leaveType, applyDate, startDate, endDate, reason } = formData;
    if (!leaveType  || !startDate || !endDate ) {
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

    const formDataToSend = new FormData();
    formDataToSend.append("email", email);
    formDataToSend.append("leaveType", leaveType);
    formDataToSend.append("applyDate", applyDate);
    formDataToSend.append("startDate", startDate);
    formDataToSend.append("endDate", endDate);

    if (file) {
      formDataToSend.append("attachment", file);
    }
    if(reason){
      formDataToSend.append("reason", reason);

    }

    try {
      const response = await fetch(
        `http://localhost:5001/leave?email=${email}`,
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
    console.log(storedUserData)
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
        setHolidays(data);
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
  const defaultLeaveData = [
    { leaveType: "sick", availableLeaves: 14, totalLeaves: 14 },
    { leaveType: "maternity", availableLeaves: 26, totalLeaves: 26 },
    { leaveType: "paternity ", availableLeaves: 10, totalLeaves: 10 },
    { leaveType: "adoption Leave", availableLeaves: 10, totalLeaves: 10 },
    { leaveType: "bereavement", availableLeaves: 3, totalLeaves: 3 },
    { leaveType: "Compensatory Off", availableLeaves: 3, totalLeaves: 3 },
    { leaveType: "Loss of Pay (LOP)", availableLeaves: 3, totalLeaves: 3 },
  ];
  
  const mergedLeaveData = defaultLeaveData.map(defaultLeave => {
    const leaveFromDB = leaveData.find(leave => leave.leaveType === defaultLeave.leaveType);
    return leaveFromDB ? leaveFromDB : defaultLeave;
  });

  const renderContent = () => {
    switch (selectedCategory) {
     
      case "apply-leave":
        return (
<div>
<h2 style={{ textAlign: 'center' }} className="applyleave">Apply Leave</h2>

  <form onSubmit={handleSubmit}>
    <Grid container spacing={2}>
      {/* Leave Type */}
      <Grid item xs={12} sm={4}>
        <label>
          Leave Type: <span className="req">*</span>
          {errors.leaveType && <span className="req">{errors.leaveType}</span>}
          <TextField
            select
            name="leaveType"
            value={formData.leaveType}
            onChange={handleInputChange}
            onBlur={handleBlur}
            fullWidth
            size="small"
            variant="outlined"
            sx={{ backgroundColor: "#fff" }}
          >
            <MenuItem value="sick">Sick/Casual/Earned Leave</MenuItem>
            <MenuItem value="maternity">Maternity Leave</MenuItem>
            <MenuItem value="paternity">Paternity Leave</MenuItem>
            <MenuItem value="adoption">Adoption Leave</MenuItem>
            <MenuItem value="bereavement">Bereavement Leave</MenuItem>
            <MenuItem value="compensatory">Compensatory Off</MenuItem>
            <MenuItem value="lop">Loss of Pay (LOP)</MenuItem>
          </TextField>
        </label>
      </Grid>

      {/* From Date */}
      <Grid item xs={12} sm={4}>
        <label>
          From: <span className="req">*</span>
          {errors.from && <span className="req">{errors.from}</span>}
          <TextField
            type="date"
            name="startDate"
            value={formData.startDate}
            onChange={handleInputChange}
            inputProps={{ max: formData.endDate, min: getTodayDate() }}
            fullWidth
            size="small"
            variant="outlined"
          />
        </label>
      </Grid>

      {/* To Date */}
      <Grid item xs={12} sm={4}>
        <label>
          To: <span className="req">*</span>
          {errors.to && <span className="req">{errors.to}</span>}
          <TextField
            type="date"
            name="endDate"
            value={formData.endDate}
            onChange={handleInputChange}
            inputProps={{ min: formData.startDate }}
            fullWidth
            size="small"
            variant="outlined"
          />
        </label>
      </Grid>

      {/* Reason */}
      <Grid item xs={12}>
        <label>
          Reason:
          <TextareaAutosize
            name="reason"
            value={formData.reason}
            onChange={handleInputChange}
            maxRows={1}
            style={{
              width: "100%",
              padding: "8px",
              border: "1px solid #ccc",
              borderRadius: "4px",
            }}
          />
        </label>
      </Grid>

      {/* Attach Document Button */}
      <Grid item xs={12}>
        <Button
          variant="contained"
          component="label"
          sx={{
            backgroundColor: "#9F32B2",
            color: "#000",
            margin: "10px 0",
          }}
        >
          Attach
          <input type="file" name="attachment" onChange={handleFileChange} hidden />
        </Button>
        <Button type="submit" variant="contained" sx={{ marginLeft: "10px" }}>
          Submit
        </Button>
      </Grid>
    </Grid>
  </form>

            <table className="holiday-table">
                <caption>Holiday Calendar</caption>

                <thead>
                  <tr>
                    <th>DATE</th>
                    <th>DAY</th>
                    <th>OCCATION</th>
                    <th>TYPE</th>
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
              </table>
          </div>
        );
      case "profile":
        return (
          <div className="profile-page">
            <div className="profile-container">
              <div className="profile-header">
              <img src={Profile} alt="Profile" width={'100px'} />
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
              <h2 className="leave-types-heading">Leave Balances</h2>
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

      case "history":
        return (
          <div className="history-container">
            <h2>Leave History </h2>
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
                {leaveHistory.map((leave, index) => (
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
      {/* <header className="header">
        
      </header> */}
      <div className="content">
        <nav className="sidebar" id="sidebar">
        <img src={logo} alt="Quadface Logo" className="logo_das" />

          <Link
            to="#"
            className={selectedCategory === "profile" ? "active-tab" : ""}
            onClick={() => setSelectedCategory("profile")}
          >
            <div className="profile-section">
              <div className="profile-pic" style={{marginTop:'10%'}}>
                {/* <FontAwesomeIcon icon={faUser} /> */}
                <img src={Profile} alt="Profile" />
              </div>
              <div className="profile-details">
                <p className="emp-name">{username}</p>
                <p className="emp-id">Emp ID: {empid}</p>
              </div>
            </div>
          </Link>
          <ul>
          
            <li>
              <Link
                to="#"
                className={
                  selectedCategory === "apply-leave" ? "active-tab" : ""
                }
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
          </ul>
          <div className="logout">
            <Link to="#" onClick={handleLogout}>
              <FontAwesomeIcon icon={faSignOutAlt} /> Logout
            </Link>
          </div>
        </nav>

        <div className="main-content">{renderContent()}</div>
      </div>
    </div>
  );
};

export default App;