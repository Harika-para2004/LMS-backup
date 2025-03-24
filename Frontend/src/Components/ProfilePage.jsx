import React, { useEffect, useState } from "react";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faKey } from "@fortawesome/free-solid-svg-icons";
import {
  Box,
  Button,
  TextField,
  Typography,
  Modal,
} from "@mui/material";
import { useManagerContext } from "../context/ManagerContext";
const backendUrl = import.meta.env.VITE_BACKEND_URL;

const ProfilePage = () => {
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
        leavehistory, setLeavehistory,
        holidays, setHolidays,
        profileImage, setProfileImage,
        newPassword, setNewPassword,
        confirmPassword, setConfirmPassword,
        userData, setUserData,
        file, setFile,
        selectedFilter, setSelectedFilter,
        error, setError,
        leavePolicyRef, setLeavePolicyRef,
        navigate,
        showToast,
        // mergedLeaveData, setMergedLeaveData
  } = useManagerContext();
  const [mergedLeaveData, setMergedLeaveData] = useState([]);
  const [open, setOpen] = useState(false);
  const currentYear = new Date().getFullYear();
  const [formData, setFormData] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});

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
        const response = await fetch(
          `${backendUrl}/leavesummary?email=${email}`
        );
        if (response.ok) {
          const data = await response.json();
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
    const fetchLeavePolicies = async () => {
      try {
        const policyResponse = await axios.get(`${backendUrl}/api/leave-policies`);
        const leavePolicies = policyResponse.data.data;

        const appliedLeavesMap = {};
        leaveData?.forEach((leave) => {
          appliedLeavesMap[leave.leaveType] = leave;
        });

        const finalLeaveData = leavePolicies.map((policy) => {
          return appliedLeavesMap[policy.leaveType]
            ? appliedLeavesMap[policy.leaveType]
            : {
                leaveType: policy.leaveType,
                totalLeaves: policy.maxAllowedLeaves,
                availableLeaves: policy.maxAllowedLeaves,
              };
        });

        setMergedLeaveData(finalLeaveData);
      } catch (error) {
        console.error("Error fetching leave policies:", error);
      }
    };
    if(email)
    fetchLeavePolicies();
  }, [leaveData,email]);

  // Open and Close Modal functions
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  // Handle Input Change
  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
  
    // Validation: Ensure passwords match
    if (formData.newPassword !== formData.confirmPassword) {
      setErrors({ confirmPassword: "Passwords do not match" });
      return;
    }  
    try {
      const response = await axios.put(`${backendUrl}/updatepassword`, {
        email,
        newPassword: formData.newPassword,
      });  
      if (response.status === 200) {
        showToast("Password updated successfully!","success");
        handleClose();
      } else {
        showToast("Failed to update password. Try again.","error");
      }
    } catch (error) {
      showToast(error.response?.data?.message || "An error occurred while updating the password.","error");
    }
  };
  

  return (
    <div className="profile-page">
      <div className="profile-container">
        <div className="profile-header">
          <img src={profileImage} alt="Profile" width={"100px"} />
          <div className="profile-details">
            <h2 className="employee-name">{username}</h2>
            <p className="employee-id"><span>Employee ID:</span> {empid}</p>
            <p className="project-name"><span>Project:</span> {project}</p>
          </div>
        </div>

        {/* Open Modal on Button Click */}
        <button className="update-password-btn" onClick={handleOpen}>
          <FontAwesomeIcon icon={faKey} /> Update Password
        </button>
      </div>


      <div className="leave-types-container">
      <h2 className="content-heading">Leave Balances - {currentYear}</h2>
      <div className="leave-cards">
          {mergedLeaveData?.filter(
            (leave) => !((gender === "Male" && leave.leaveType.toLowerCase() === "maternity leave")|| (gender==="Female" && leave.leaveType.toLowerCase()==="paternity leave"))
          )
          .map((leave, index) => (
            <div key={index} className="leave-card">
              <div className="leave-card-header">
                <h3 className="leave-type">{formatCase(leave.leaveType)}</h3>
              </div>
              <div className="leave-count">
                <div className="count-item">
                  <span className="count-number">{leave.availableLeaves || "-"}</span>
                  <span className="count-label">Available</span>
                </div>
                <div className="count-item">
                  <span className="count-number">{leave.totalLeaves || "-"}</span>
                  <span className="count-label">Total</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MUI Modal for Password Update */}
      <Modal open={open} onClose={handleClose} aria-labelledby="password-modal">
        <Box
          component="form"
          onSubmit={handleUpdatePassword}
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 400,
            bgcolor: "background.paper",
            borderRadius: 2,
            boxShadow: 24,
            p: 4,
            display: "flex",
            flexDirection: "column",
            gap: 2,
          }}
        >
          <Typography variant="h5" textAlign="center">
            Update Password
          </Typography>

          <TextField
            label="New Password"
            type="password"
            name="newPassword"
            value={formData.newPassword}
            onChange={handleInputChange}
            fullWidth
            error={Boolean(errors.newPassword)}
            helperText={errors.newPassword}
          />

          <TextField
            label="Confirm Password"
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleInputChange}
            fullWidth
            error={Boolean(errors.confirmPassword)}
            helperText={errors.confirmPassword}
          />

          <Box display="flex" justifyContent="flex-end">
            <Button onClick={handleClose} sx={{ mr: 2 }}>
              Cancel
            </Button>
            <Button variant="contained" type="submit">
              Update
            </Button>
          </Box>
        </Box>
      </Modal>
    </div>
  );
};

export default ProfilePage;