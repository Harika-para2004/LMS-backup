import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import logo from "./../assets/img/quadfacelogo-hd.png";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCalendarDays,
  faFileLines,
  faGears,
  faEnvelopeOpenText,
  faClipboardList,
} from "@fortawesome/free-solid-svg-icons";
import { BASE_URL } from "../Config";
import { MdCheckCircle, MdCancel, MdHourglassEmpty } from "react-icons/md";
import AddIcon from "@mui/icons-material/Add";
import { FaEdit, FaTrash } from "react-icons/fa";

import {
  Box,
  Button,
  TextField,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Typography,
  Modal,
  ButtonBase,
} from "@mui/material";
import LeavePolicyPage from "./LeavePolicyPage";
import Sidebar from "./Sidebar";

function AdminDashboard() {
  const [selectedCategory, setSelectedCategory] = useState("holiday-calendar");
  const [holidays, setHolidays] = useState([]);
  const [leaveHistory, setLeaveHistory] = useState([]);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [editingRow, setEditingRow] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedHoliday, setSelectedHoliday] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false); // State to control form visibility
  const [formData, setFormData] = useState({
    date: null,
    holidayName: "",
    holidayType: "Mandatory",
  });
  /*Add New Employee*/
  const [showAddEmployeeModal, setShowAddEmployeeModal] = useState(false);
  const [employeeList, setEmpList] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState("All");
  const [modalOpen, setModalOpen] = useState(false);
  // const [showAddEmployeeModal, setShowAddEmployeeModal] = useState(false);

  const [empData, setEmpData] = useState({
    empname: "",
    empid: "",
    email: "",
    password: "",
    gender: "",
    project: "",
  });

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

      if (response.ok) {
        const responseData = await response.json();
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
        });
        handleAddEmployeeClose();
      } else {
        alert("Failed to add employee");
      }
    } catch (error) {
      alert("Error:", error.message);
    }
  };

  const [errors, setErrors] = useState({});

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
    // console.log(value);
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

      const response = await fetch(`${BASE_URL}holidays`, {
        method: "POST",
        body: JSON.stringify({
          date: formData.date,
          name: formData.holidayName,
          type: formData.holidayType,
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to add holiday.");
      }

      const newHoliday = await response.json();

      setHolidays((prevHolidays) => [...prevHolidays, newHoliday]);

      setFormData({
        date: "",
        holidayName: "",
        holidayType: "Mandatory",
      });

      setShowModal(false);
    } catch (error) {
      console.error("Error adding holiday:", error);
      setError("Failed to add holiday. Please try again later.");
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

  // Function to fetch leave and employee data
  const fetchLeaveAndEmployeeDetails = async () => {
    try {
      const [leaveResponse, employeeResponse] = await Promise.all([
        fetch(`${BASE_URL}leaverequests`),
        fetch(`${BASE_URL}employee-list`),
      ]);

      const leaveData = await leaveResponse.json();
      const employeeData = await employeeResponse.json();

      console.log("Leave Data:", leaveData); // Inspect structure
      console.log("Employee Data:", employeeData); // Inspect structure

      const mergedData = leaveData.map((leave) => {
        const employee = employeeData.find(
          (emp) => emp.email === leave.email // Match based on email
        );
        return {
          ...leave,
          empid: employee?.id || "N/A",
          empname: employee?.name || "N/A",
        };
      });
      console.log("merge", mergedData);
      setLeaveHistory(mergedData);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    fetchLeaveAndEmployeeDetails();
  }, []);

  useEffect(() => {
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

        setHolidays(data);
      } catch (error) {
        console.error("Error fetching holidays:", error);
        setError("Failed to fetch holidays. Please try again later."); // Update error state for UI
      }
    };

    fetchHolidays();
  }, []);

  useEffect(() => {
    const excludeEmail = "admin@gmail.com"; // Replace with the email to exclude

    const fetchEmployees = async () => {
      try {
        const response = await fetch(`${BASE_URL}employee-list`, {
          method: "GET", // Explicitly specify the HTTP method
          headers: {
            "Content-Type": "application/json", // Ensure correct headers
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        const filteredData = data.filter((item) => item.email !== excludeEmail); // Filter out records with the given email

        setEmpList(filteredData);
      } catch (error) {
        console.error("Error fetching holidays:", error);
        setError("Failed to fetch holidays. Please try again later."); // Update error state for UI
      }
    };

    fetchEmployees();
  }, []);

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
        const response = await fetch(`${BASE_URL}leaverequests/${leave._id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updatedLeave),
        });

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
        const response = await fetch(`${BASE_URL}leaverequests/${leave._id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updatedLeave),
        });

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

  const handleRowClick = (leave, index) => {
    setSelectedLeave({ ...leave, selectedIndex: index });
    setModalOpen(true); // Open the modal
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
      alert("Employee deleted successfully!");
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

      updatedHolidays[index] = { ...formData, _id: holidayId };
      setHolidays(updatedHolidays);
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
      !empData.project
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

      // Update the state with the edited employee's details
      updatedEmployeeList[index] = { ...empData, _id: employeeId };
      setEmpList(updatedEmployeeList);

      // Reset form data and exit edit mode
      setEmpData({
        empname: "",
        empid: "",
        email: "",
        password: "",
        project: "",
      });
      setEditingRow(null);
      setError(null); // Clear errors
    } catch (error) {
      console.error("Error updating employee:", error);
      setError("Failed to update employee. Please try again later.");
    }
  };
  const handleFilterChange = (e) => {
    setSelectedFilter(e.target.value);
  };

  const filteredLeaveHistory = leaveHistory.filter((leave) =>
    selectedFilter === "All"
      ? true
      : leave.status.some(
          (status) => status.toLowerCase() === selectedFilter.toLowerCase()
        )
  );

  const handleCloseModal = () => {
    setModalOpen(false); // Close the modal
    setSelectedLeave(null); // Clear selected leave
  };

  const renderContent = () => {
    switch (selectedCategory) {
      case "holiday-calendar":
        return (
          <div>
            {/* <div className="hc-head">
              <Button
                variant="contained"
                onClick={() => setShowModal(true)}
                sx={{
                  backgroundColor: "#baco95", // Align the button absolutely
                  // marginTop: "-40px", // Push it to the right edge
                  // marginRight: "35px", // Optional: Add some spacing from the right edge
                  "&:focus": {
                    outline: "none",
                  },
                }}
              >
                Add New Holiday
              </Button>
            </div> */}

            {showModal && (
              <Modal
                open={showModal}
                onClose={() => setShowModal(false)}
                aria-labelledby="holiday-modal"
                aria-describedby="holiday-form"
              >
                <Box
                  component="form"
                  onSubmit={(e) => {
                    e.preventDefault(); // Prevent default form submission
                    if (isEditMode) {
                      handleEditHoliday(); // Handle editing holiday
                    } else {
                      handleAddHoliday(); // Handle adding new holiday
                    }
                  }}
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
                  <Typography
                    variant="h5"
                    id="holiday-modal"
                    textAlign="center"
                  >
                    {isEditMode ? "Edit Holiday" : "Add Holiday"}
                  </Typography>
                  <TextField
                    label="Date"
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    InputLabelProps={{ shrink: true }}
                    error={Boolean(errors.date)}
                    helperText={errors.date}
                  />
                  <TextField
                    label="Holiday Name"
                    name="holidayName"
                    value={formData.holidayName}
                    onChange={handleInputChange}
                    error={Boolean(errors.holidayName)}
                    helperText={errors.holidayName}
                    fullWidth
                  />
                  <FormControl fullWidth>
                    <InputLabel>Holiday Type</InputLabel>
                    <Select
                      name="holidayType"
                      value={formData.holidayType}
                      onChange={handleInputChange}
                    >
                      <MenuItem value="Mandatory">Mandatory</MenuItem>
                      <MenuItem value="Optional">Optional</MenuItem>
                    </Select>
                    {errors.holidayType && (
                      <p
                        style={{
                          color: "red",
                          fontSize: "0.8rem",
                          marginTop: "0.25rem",
                        }}
                      >
                        {errors.holidayType}
                      </p>
                    )}
                  </FormControl>
                  <Box display="flex" justifyContent="flex-end">
                    <Button onClick={() => setShowModal(false)} sx={{ mr: 2 }}>
                      Cancel
                    </Button>
                    <Button
                      variant="contained"
                      type="submit" // Use type="submit" to trigger form submission
                    >
                      {isEditMode ? "Save Changes" : "Add Holiday"}
                    </Button>
                  </Box>
                </Box>
              </Modal>
            )}

            <div className="header">
              <h2 className="content-heading">Holiday Calendar</h2>
              <Button
                variant="contained"
                onClick={() => setShowModal(true)}
                sx={{
                  textTransform: "capitalize",
                  backgroundColor: "#006400", // Align the button absolutely
                  // marginTop: "-40px", // Push it to the right edge
                  // marginRight: "35px", // Optional: Add some spacing from the right edge
                  "&:focus": {
                    outline: "none",
                  },
                }}
              >
                Add Holiday
              </Button>
            </div>

            <table className="holiday-table">
              {/* <caption>Holiday Calendar</caption> */}

              <thead>
                <tr>
                  <th>Date</th>
                  <th>Day</th>
                  <th>Name of Holiday</th>
                  <th>Holiday Type</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {holidays.map((holiday, index) => (
                  <tr key={holiday._id}>
                    {editingRow === index ? (
                      <>
                        <td>
                          <input
                            type="text"
                            name="date"
                            value={formData.date}
                            onChange={handleInputChange}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            name="day"
                            value={formData.day}
                            onChange={handleInputChange}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            name="type"
                            value={formData.type}
                            onChange={handleInputChange}
                          />
                        </td>
                        <td>
                          <button onClick={() => handleSave(index)}>
                            Save
                          </button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td>{holiday.date}</td>
                        <td>{holiday.day}</td>
                        <td>{holiday.name}</td>
                        <td>{holiday.type}</td>
                        <td>
                          <button onClick={() => handleEdit(index)}>
                            Edit
                          </button>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      case "leavepolicy":
        return (
          <div>
            <LeavePolicyPage />
          </div>
        );
      case "reports":
        return <div></div>;
      
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
                    <tr
                      key={`${leave._id}-${index}`}
                      onClick={() => handleRowClick(leave, index)}
                    >
                      <td>{leave.leaveType}</td>
                      <td>{new Date(startDate).toLocaleDateString()}</td>
                      <td>
                        {new Date(leave.endDate[index]).toLocaleDateString()}
                      </td>
                      <td>{leave.reason[index]}</td>
                      <td>{leave.status[index]}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {selectedLeave && (
              <div className="details-container">
                <h3>Leave Details</h3>
                <p>Employee Email: {selectedLeave.email}</p>
                <p>Leave Type: {selectedLeave.leaveType}</p>
                <p>
                  From:{" "}
                  {new Date(
                    selectedLeave.startDate[selectedLeave.selectedIndex]
                  ).toLocaleDateString()}
                </p>
                <p>
                  To:{" "}
                  {new Date(
                    selectedLeave.endDate[selectedLeave.selectedIndex]
                  ).toLocaleDateString()}
                </p>
                <p>
                  Reason: {selectedLeave.reason[selectedLeave.selectedIndex]}
                </p>
                <p>
                  Status: {selectedLeave.status[selectedLeave.selectedIndex]}
                </p>
                <p>Total Leaves: {selectedLeave.totalLeaves}</p>
                <p>Available Leaves: {selectedLeave.availableLeaves}</p>
                <p>Used Leaves: {selectedLeave.usedLeaves}</p>
                <div className="action-buttons">
                  <button onClick={handleApprove}>Approve</button>
                  <button onClick={() => setSelectedLeave(null)}>Reject</button>
                </div>
              </div>
            )}
          </div>
        );

      case "employee-list":
        return (
          <>
            {/* <Button
              variant="contained"
              onClick={() => handleAddEmployeeClick()}
              sx={{
                position: "absolute",
                backgroundColor: "#313896",
                right: 0,

                marginRight: "35px",
                display: "flex",
                alignItems: "center",
                gap: 1, 
                "&:focus": {
                  outline: "none",
                },
              }}
            >
              <AddIcon /> Add Employee
            </Button> */}
            <div className="header">
              <h2 className="content-heading">Employee Details</h2>
              <Button
                variant="contained"
                onClick={() => handleAddEmployeeClick()}
                sx={{
                  position: "absolute",
                  backgroundColor: "#006600",
                  right: 0,
                  textTransform:"none",

                  marginRight: "35px",
                  display: "flex",
                  alignItems: "center",
                  gap: 1, // Add spacing between text and icon
                  "&:focus": {
                    outline: "none",
                  },
                }}
              >
                <AddIcon /> Add Employee
              </Button>
            </div>

            <table className="holiday-table">
              {/* <caption>Employee Details</caption> */}
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Project</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {employeeList.map((emp, index) => (
                  <tr key={emp._id}>
                    {editingRow === index ? (
                      <>
                        <td>
                          <input
                            type="text"
                            name="empname"
                            value={empData.empname}
                            onChange={handleEmployeeData}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            name="empid"
                            value={empData.empid}
                            onChange={handleEmployeeData}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            name="email"
                            value={empData.email}
                            onChange={handleEmployeeData}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            name="project"
                            value={empData.project}
                            onChange={handleEmployeeData}
                          />
                        </td>
                        <td>
                          <button onClick={() => handleSave1(index)}>
                            Save
                          </button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td>{emp.empid}</td>
                        <td>{emp.empname}</td>
                        <td>{emp.email}</td>
                        <td>{emp.project}</td>
                        <td>
                          <button
                            onClick={() => handleEditEmployee(index)}
                            style={{
                              border: "none",
                              background: "none",
                              cursor: "pointer",
                            }}
                          >
                            <FaEdit size={20} color="blue" />
                          </button>
                          <button
                            onClick={() => handleDeleteEmployee(emp._id)}
                            style={{
                              border: "none",
                              background: "none",
                              cursor: "pointer",
                            }}
                          >
                            <FaTrash size={20} color="red" />
                          </button>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        );

      default:
        return <div>Select a category to get started!</div>;
    }
  };

  return (
    <div className="dashboard-container">
      <div className="content">
        {/* <nav className="sidebar" id="side_admin">
          <img src={logo} alt="Quadface Logo" className="logo_das" />

          <ul>
            <li>
              <Link
                to="#"
                onClick={() => setSelectedCategory("holiday-calendar")}
              >
                <FontAwesomeIcon icon={faCalendarDays} /> Calendar
              </Link>
            </li>
            <li>
              <Link to="#" onClick={() => setSelectedCategory("reports")}>
                <FontAwesomeIcon icon={faFileLines} /> Reports
              </Link>
            </li>
            <li>
              <Link to="#" onClick={() => setSelectedCategory("leavepolicy")}>
                <FontAwesomeIcon icon={faClipboardList} /> Leave Policy
              </Link>
            </li>

            <li>
              <Link to="#" onClick={() => setSelectedCategory("leaverequests")}>
                <FontAwesomeIcon icon={faEnvelopeOpenText} /> Leave Requests{" "}
              </Link>
            </li>
          </ul>
        </nav> */}
        <Sidebar
          userType="admin"
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          logo={logo}
        />

        <main className="main-content">{renderContent()}</main>
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
          }}
        >
          <Typography variant="h5" id="add-employee-modal" textAlign="center">
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

      {/* <Button
        variant="contained"
        onClick={handleAddEmployeeClick}
        sx={{
          backgroundColor: "#384959",
          width: "100%",
          marginTop: "5px",
          padding: "10px",
          border: "none",
        }}
      >
        Add Employee
      </Button> */}
    </div>
  );
}

export default AdminDashboard;
