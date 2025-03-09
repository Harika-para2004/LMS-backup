import React, { useState, useEffect } from "react";
import logo from "./../assets/img/quadfacelogo-hd.png";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
// import { BASE_URL } from "../Config";
const BASE_URL = "http://localhost:5001/";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import axios from "axios";
import { FaEdit, FaTrash } from "react-icons/fa";
import { Outlet, useNavigate } from "react-router-dom";
import {
  AiOutlineClose,
} from "react-icons/ai";
import { faSearch } from "@fortawesome/free-solid-svg-icons";

import {
  Box,
  Button,
  TextField,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  RadioGroup,
  FormLabel,
  Radio,
  Select,
  IconButton,
  Typography,
  Modal,
  CircularProgress,
} from "@mui/material";
import LeavePolicyPage from "./LeavePolicyPage";
import Sidebar from "./Sidebar";
import ReportsAdmin from "./ReportsAdmin";
import LeaveRequestsTable from "./LeaveRequestsTable";
import AdminTrends from "./AdminTrends";
import HolidayCalendar from "./HolidayCalendar";
import TotalEmployees from "./TotalEmployees";

function AdminDashboard() {
  const [Email,setEmail] = useState("");
  useEffect(() => {
      const storedUserData = localStorage.getItem("userData");
      if (storedUserData) {
        try {
          const parsedUserData = JSON.parse(storedUserData);
          if (parsedUserData && parsedUserData.role === "Admin") {
            setEmail(parsedUserData.email || "");
          }
          console.log("admin email is :",Email);
        } catch (error) {
          console.error("Error parsing userData from localStorage:", error);
        }
      }
    }, []);
  const [selectedCategory, setSelectedCategory] = useState("holiday-calendar");
  const [holidays, setHolidays] = useState([]);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [editingRow, setEditingRow] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState(null);
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  /*Add New Employee*/
  const [showAddEmployeeModal, setShowAddEmployeeModal] = useState(false);
  const [employeeList, setEmpList] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState("All");
  const [modalOpen, setModalOpen] = useState(false);
  const year = new Date().getFullYear();
  const [searchTerm, setSearchTerm] = useState("");
  const excludeEmail = Email; // Email to exclude from the list
  // const [showAddEmployeeModal, setShowAddEmployeeModal] = useState(false);
  const [empData, setEmpData] = useState({
    empname: "",
    empid: "",
    email: "",
    password: "",
    gender: "",
    project: "",
    role: "",
    managerEmail:""
  });
  const [formData, setFormData] = useState({
    date: "",
    holidayName: "",
    holidayType: "Mandatory",
  });
  
  const filteredEmployees = employeeList.filter((emp)=> emp.empname.toLowerCase().includes(searchTerm.toLowerCase()));


  const handleLogout = (e) => {
    e.preventDefault();
    localStorage.clear();
    navigate("/"); 
    window.location.reload(); 

  };

  useEffect(() => {
    fetchEmployees();
  }, []);
  const fetchEmployees = async () => {
    try {
      const response = await fetch(`${BASE_URL}employee-list`, {
        method: "GET", // Explicitly specify the HTTP method
        headers: {
          "Content-Type": "application/json", // Set appropriate headers
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();

      // Exclude specific email and sort by employee ID
      const filteredAndSortedData = data
        .filter((item) => item.email !== excludeEmail)
        .sort((a, b) => a.empid.localeCompare(b.empid));

      setEmpList(filteredAndSortedData); // Update state with filtered and sorted data
    } catch (error) {
      console.error("Error fetching employees:", error);
      setError("Failed to fetch employees. Please try again later."); // Update error state for UI
    }
  };
  
    const handleFileChange = (event) => {
      const selectedFile = event.target.files[0];
      if (selectedFile) {
        setFile(selectedFile);
      }
    };
   
    const handleUpload = async () => {
     if (!file) {
       alert("Please select a file first!");
       return;
     }
   
     setLoading(true);
     const formData = new FormData();
     formData.append("file", file);
   
     try {
       const response = await axios.post(
         `${BASE_URL}excel/uploadEmployees`,
         formData,
         { headers: { "Content-Type": "multipart/form-data" } }
       );
   
       setMessage(response.data.message);
       if (response.data.failedEntries.length > 0) {
        const failureMessages = response.data.failedEntries
          .map(entry => `• ${entry.email}: ${entry.reason}`)
          .join("\n");
        
        alert(`Some entries were skipped:\n${failureMessages}`);
      }
       setFile(null);
       document.getElementById("file-input").value = null;
       fetchEmployees();
       setTimeout(() => {
         setMessage("");
       }, 3000);
     } catch (error) {
       console.error("Error uploading file:", error);
       
       if (error.response && error.response.data.message.includes("Missing required columns")) {
         alert(error.response.data.message); // Alert user about missing columns
       } else {
         setMessage("Error uploading file");
       }
     } finally {
       setLoading(false);
     }
   };

    const handlefileChange = (event) => {
      const file = event.target.files[0];
      if (file) {
        setSelectedFile(file); // Store the actual file
        handleHolidayUpload(file); // Call upload function
      }
      // Reset file input after a successful upload
      if (!file) {
        event.target.value = "";
      }
    };
    
  
    const handleHolidayUpload = async (file) => {
      if (!file) {
        alert("Please select a file first.");
        return;
      }
    
      const formData = new FormData();
      formData.append("file", file);
    
      try {
        const response = await fetch(`${BASE_URL}excel/uploadHolidays`, {
          method: "POST",
          body: formData,
        });
    
        const result = await response.json();
        console.log("Server Response:", result);
    
        if (!response.ok) {
          if (result.message.includes("Wrong format")) {
            alert("Wrong format! Please upload a file with correct format.");
          } else {
            alert(`Error: ${result.message}`);
          }
          return;
        }
    
        alert(`${result.insertedCount} holidays were successfully added.`);
        setFile(null); // Reset file state
        setSelectedFile(null); // Clear selected file display
        fetchHolidays(); // Refresh holidays list
    
      } catch (error) {
        console.error("Error uploading holidays:", error);
        alert("Failed to upload holidays. Please try again.");
      }
    };


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

  const sortEmployeeList = (employees) => {
    return [...employees].sort((a, b) => a.empid.localeCompare(b.empid));
  };

  const handleAddEmployeeClick = () => {
    setShowAddEmployeeModal(true);
  };

  const handleAddEmployeeClose = () => {
    setShowAddEmployeeModal(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEmpData({ ...empData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${BASE_URL}api/auth/addEmployee`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(empData),
      });
  
      const responseData = await response.json(); // Parse JSON response
  
      if (response.ok) {
        alert(responseData.message);
  
        if (response.status === 200 || response.status === 201) {
          const userDataResponse = await fetch(
            `${BASE_URL}api/auth/user/${responseData.userId}`
          );
  
          if (userDataResponse.ok) {
            const userData = await userDataResponse.json();
  
            // Update employee list immediately
            setEmpList((prevList) => [...prevList, userData]);
  
            // Set active category to "employee-list" (to navigate to the employee list view)
            setSelectedCategory("employee-list");
  
            // Store user data in local storage
            localStorage.setItem("userData", JSON.stringify(userData));
          } else {
            alert("Failed to fetch user data");
          }
        }
  
        // Clear the form and close the modal
        setEmpData({
          empname: "",
          empid: "",
          email: "",
          password: "",
          project: "",
          gender: "",
          role: "",
          managerEmail: "",
        });
        handleAddEmployeeClose();
      } else {
        // Display specific error message from the backend
        alert(responseData.message || "Failed to add employee");
      }
    } catch (error) {
      alert("Error: " + error.message);
    }
  };
  


  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setFormData((prevState) => ({
      ...prevState,
      [name]:
        name === "holidayName"
          ? value
              .split(" ")
              .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
              .join(" ")
          : value,
    }));
  };

  const handleEmployeeData = (e) => {
    const { name, value } = e.target;
    setEmpData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.date) newErrors.date = "Date is required";
    if (!formData.holidayName)
      newErrors.holidayName = "Holiday Name is required";
    if (!formData.holidayType)
      newErrors.holidayType = "Holiday Type is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddHoliday = async () => {
    if (!validateForm()) return;
  
    try {
      const { date, holidayName, holidayType } = formData;
  
      // Convert date format (dd-MMM-yyyy)
      const [year, month, day] = date.split("-");
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const formattedDate = `${day}-${monthNames[parseInt(month, 10) - 1]}-${year}`;
  
      // Send API request
      const response = await fetch(`${BASE_URL}holidays`, {
        method: "POST",
        body: JSON.stringify({ date: formattedDate, name: holidayName, type: holidayType }),
        headers: { "Content-Type": "application/json" },
      });
  
      const data = await response.json();
  
      if (!response.ok) {
        alert(data.message); //  Show alert if holiday already exists
        return;
      }
  
      // Update state with the new holiday
      setHolidays((prevHolidays) => sortHolidaysByMonthAndCustomDay([...prevHolidays, data]));
  
      // Reset form
      setFormData({ date: "", holidayName: "", holidayType: "Mandatory" });
      setShowModal(false);
    } catch (error) {
      console.error("Error adding holiday:", error);
      alert("Failed to add holiday. Please try again later."); //  Show alert on error
    }
  };
  
  

  const handleEditHoliday = () => {
    if (!validateForm()) return; // Don't proceed if validation fails

    setFormData({
      date: "",
      holidayName: "",
      holidayType: "Mandatory",
    });

    // Close modal after editing
    setShowModal(false);
  };



  useEffect(() => {
    fetchHolidays();
  }, []);
  const fetchHolidays = async () => {
    try {
      const response = await fetch(`${BASE_URL}holidays`, {
        method: "GET", // Explicitly specify the HTTP method
        headers: {
          "Content-Type": "application/json", // Ensure correct headers
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      const sortedHolidays = sortHolidaysByMonthAndCustomDay(data);

      // Set the sorted holidays
      setHolidays(sortedHolidays);
    } catch (error) {
      console.error("Error fetching holidays:", error);
      setError("Failed to fetch holidays. Please try again later."); // Update error state for UI
    }
  };

 
  
  const handleReject = async () => {
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
  
      const leaveDuration = leave.duration[selectedIndex]; // Fix: Ensure valid duration
  
      const wasApproved = leave.status[selectedIndex]?.toLowerCase() === "approved"; // Add optional chaining
  
      
      const updatedLeave = {
        ...leave,
        status: leave.status.map((stat, index) =>
          index === selectedIndex && (stat.toLowerCase() === "pending" || stat.toLowerCase() === "approved")
            ? "Rejected"
            : stat
        ),
        ...(leave.totalLeaves !== null && leave.totalLeaves !== undefined
          ? {
              availableLeaves: wasApproved ? leave.availableLeaves + leaveDuration : leave.availableLeaves,
              usedLeaves: wasApproved ? leave.usedLeaves - leaveDuration : leave.usedLeaves,
            }
          : {} // ✅ Do not update availableLeaves & usedLeaves if there's no totalLeaves
        )
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
  
      const leaveDuration = leave.duration[selectedIndex]; // Fix: Use 'duration' (not 'durations')
  
      const currentStatus = leave.status[selectedIndex]?.toLowerCase(); // Add optional chaining
  
      if (!currentStatus || (currentStatus !== "pending" && currentStatus !== "rejected")) {
        console.log("This leave is already approved.");
        return;
      }
  
      if (
        leave.totalLeaves !== 0 && // ✅ Only check if there's a totalLeaves limit
        leave.availableLeaves < leaveDuration
      ) {
        console.log("Not enough available leaves.");
        return;
      }
  
      const updatedLeave = {
        ...leave,
        availableLeaves:
          leave.totalLeaves !== 0
            ? Math.max(0, leave.availableLeaves - leaveDuration) // ✅ Prevent negative available leaves
            : leave.availableLeaves, // ✅ Do not decrease if leave type is unlimited
        usedLeaves: leave.usedLeaves + leaveDuration,
        status: leave.status.map((stat, index) =>
          index === selectedIndex &&
          (stat.toLowerCase() === "pending" || stat.toLowerCase() === "rejected")
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
    }
  };
  const handleEdit = (index) => {
    setEditingRow(index);
    setFormData(holidays[index]);
  };
  
  const handleDeleteEmployee = async (id) => {
    // Ask for confirmation before proceeding
    const isConfirmed = window.confirm(
      "Are you sure you want to delete this employee? This action cannot be undone."
    );

    if (!isConfirmed) {
      return; // Exit the function if the user cancels
    }

    try {
      const response = await fetch(`${BASE_URL}employee-del/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete employee.");
      }

      // Update the state by removing the deleted employee
      setEmpList((prevEmployees) =>
        prevEmployees.filter((emp) => emp._id !== id)
      );
      alert("Employee deleted successfully!");
    } catch (error) {
      console.error("Error deleting employee:", error);
      setError("Failed to delete employee. Please try again later.");
    }
  };

  const handleDeleteHoliday = async (id) => {
    // Ask for confirmation before proceeding
    const isConfirmed = window.confirm(
      "Are you sure you want to delete this holiday? This action cannot be undone."
    );

    if (!isConfirmed) {
      return; // Exit the function if the user cancels
    }

    try {
      const response = await fetch(`${BASE_URL}holidays/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete employee.");
      }

      // Update the state by removing the deleted employee
      setHolidays((prevHolidays) =>
        prevHolidays.filter((holiday) => holiday._id !== id)
      );
      alert("Holiday deleted successfully!");
    } catch (error) {
      console.error("Error deleting employee:", error);
      setError("Failed to delete employee. Please try again later.");
    }
  };

  const handleEditEmployee = (index) => {
    // Enter edit mode for the selected row
    setEditingRow(index);

    // Populate the form data with the selected employee's details
    setEmpData({
      empname: employeeList[index].empname,
      empid: employeeList[index].empid,
      email: employeeList[index].email,
      project: employeeList[index].project,
      role: employeeList[index].role,
    });
  };

  const handleSave = async (index) => {
    if (!formData.date || !formData.day || !formData.name || !formData.type) {
      setError("All fields are required.");
      return;
    }

    const updatedHolidays = [...holidays];
    const holidayId = updatedHolidays[index]._id;

    try {
      const response = await fetch(`${BASE_URL}holidays/${holidayId}`, {
        method: "PUT",
        body: JSON.stringify(formData),
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to update holiday.");
      }

      const updatedHoliday = await response.json();

      // Update the holiday in the array
      updatedHolidays[index] = { ...updatedHoliday };

      // Sort holidays by month and custom day order
      const sortedHolidays = sortHolidaysByMonthAndCustomDay(updatedHolidays);

      // Update the state
      setHolidays(sortedHolidays);
      setEditingRow(null);
      setError(null);
    } catch (error) {
      console.error("Error updating holiday:", error);
      setError("Failed to update holiday. Please try again later.");
    }
  };

  const handleSave1 = async (index) => {
    // Validate all required fields
    if (
      !empData.email ||
      !empData.empid ||
      !empData.empname ||
      !empData.project ||
      !empData.role
    ) {
      setError("All fields are required.");
      return;
    }

    const updatedEmployeeList = [...employeeList];
    const employeeId = updatedEmployeeList[index]._id;

    try {
      // API call to update employee details
      const response = await fetch(
        `${BASE_URL}updateEmployeeList/${employeeId}`,
        {
          method: "PUT",
          body: JSON.stringify(empData),
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update employee.");
      }

      // Update the employee in the list
      updatedEmployeeList[index] = { ...empData, _id: employeeId };

      // Sort the updated list by employee ID (or any other criteria)
      const sortedEmployeeList = updatedEmployeeList.sort((a, b) =>
        a.empid.localeCompare(b.empid)
      );

      // Update the state with the sorted list
      setEmpList(sortedEmployeeList);

      // Reset form data and exit edit mode
      setEmpData({
        empname: "",
        empid: "",
        email: "",
        password: "",
        project: "",
        role: "",
      });
      setEditingRow(null);
      setError(null); // Clear errors
    } catch (error) {
      console.error("Error updating employee:", error);
      setError("Failed to update employee. Please try again later.");
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
  const getDownloadLink = (attachments) =>
    `http://localhost:5001/${attachments}`;

  const renderContent = () => {
    switch (selectedCategory) {
      case "holiday-calendar":
        return (
          <HolidayCalendar />
        );
      case "leavepolicy":
        return (
          <div>
            <LeavePolicyPage />
          </div>
        );
      case "reports":
        return <AdminTrends />;

      case "leaverequests":
        return (
          <div>
          <LeaveRequestsTable
            filteredLeaveRequests={filteredLeaveRequests}
            selectedFilter={selectedFilter}
            handleFilterChange={handleFilterChange}
            handleRowClick={handleRowClick}
            getDownloadLink={getDownloadLink}
            Email={Email}
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

      case "employee-list":
        return (
          <TotalEmployees />
        );


      default:
        return <div>Select a category to get started!</div>;
    }
  };

  return (
    <div className="dashboard-container">
      <div className="content">
      <Sidebar
          userType="admin"
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          logo={logo}
          handleLogout={handleLogout}
        />

        {/* <main className="main-content">{renderContent()}</main> */}
        <div className="main-content">
        <Outlet />
      </div>

      </div>

      <Modal
        open={showAddEmployeeModal}
        onClose={handleAddEmployeeClose}
        aria-labelledby="add-employee-modal"
        aria-describedby="add-employee-form"
      >
        <Box
          component="form"
          onSubmit={handleSubmit}
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
            overflowY: "auto",
            height: "100vh",
            margin: "10px 0",
          }}
        >
          <Typography variant="h5" id="add-employee-modal" textTransform="capitalize" textAlign="center">
            Add Employee
          </Typography>
          <TextField
            label="Employee Name"
            name="empname"
            value={empData.empname}
            onChange={handleChange}
            fullWidth
          />
          <TextField
            label="Employee Id"
            name="empid"
            value={empData.empid}
            onChange={handleChange}
            fullWidth
          />
          <TextField
            label="Email"
            name="email"
            value={empData.email}
            onChange={handleChange}
            fullWidth
          />
          <TextField
            label="Password"
            name="password"
            value={empData.password}
            onChange={handleChange}
            fullWidth
          />
          <FormControl fullWidth>
            <InputLabel id="gender-label">Gender</InputLabel>
            <Select
              labelId="gender-label"
              id="gender"
              name="gender"
              value={empData.gender}
              onChange={handleChange}
              label="Gender"
            >
              <MenuItem value="Male">Male</MenuItem>
              <MenuItem value="Female">Female</MenuItem>
              <MenuItem value="Other">Other</MenuItem>
            </Select>
          </FormControl>
          <FormControl fullWidth>
  <InputLabel id="role-label">Role</InputLabel>
  <Select
    labelId="role-label"
    id="role"
    name="role"
    value={empData.role}
    onChange={handleChange}
    label="Role"
  >
    <MenuItem value="Manager">Manager</MenuItem>
    <MenuItem value="Employee">Employee</MenuItem>
  </Select>
</FormControl>

{/* Show Manager Email input only if role is Employee */}
{empData.role === "Employee" && (
  <TextField
    fullWidth
    margin="normal"
    label="Manager Email"
    name="managerEmail"
    value={empData.managerEmail || ""}
    onChange={handleChange}
  />
)}

          <TextField
            label="Project"
            name="project"
            value={empData.project}
            onChange={handleChange}
            fullWidth
          />

          <Box display="flex" justifyContent="flex-end">
            <Button onClick={handleAddEmployeeClose} sx={{ mr: 2 }}>
              Cancel
            </Button>
            <Button variant="contained" type="submit">
              Add Employee
            </Button>
          </Box>
        </Box>
      </Modal>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "1rem",
    padding: "1.5rem",
    border: "1px solid #ddd",
    borderRadius: "8px",
    backgroundColor: "#f9f9f9",
    width: "300px",
    boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)",
    marginBottom: "20px",
  },
  fileInputLabel: {
    backgroundColor: "#007bff",
    color: "#fff",
    padding: "10px 20px",
    borderRadius: "5px",
    cursor: "pointer",
    fontWeight: "bold",
    transition: "background 0.3s ease",
    textAlign: "center",
    width: "100%",
  },
  fileInputLabelHover: {
    backgroundColor: "#0056b3",
  },
  fileInput: {
    display: "none",
  },
  uploadButton: {
    width: "100%",
    padding: "10px",
  },
};

export default AdminDashboard;