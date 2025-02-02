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
import { MdCheckCircle, MdCancel,MdWatchLater  } from "react-icons/md";
import AddIcon from "@mui/icons-material/Add";
import { FaEdit, FaTrash } from "react-icons/fa";
import { AiFillFilePdf,AiOutlineClose, AiOutlineExclamationCircle } from "react-icons/ai";

import {
  Box,
  Button,
  TextField,
  FormControl,
  FormGroup,
  FormControlLabel,
  Checkbox,
  InputLabel,
  MenuItem,
  RadioGroup,
  FormLabel,
  Radio,
  Select,
  IconButton,
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
    date: "",
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
    role: "",
  });
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
          gender: "",
          role: "",
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

      // Convert date to "dd-MMM" format (e.g., "10-Jan")
      const [year, month, day] = date.split("-"); // Split the date into year, month, and day
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
      const formattedDate = `${day}-${
        monthNames[parseInt(month, 10) - 1]
      }-${year}`; // Format the date

      const response = await fetch(`${BASE_URL}holidays`, {
        method: "POST",
        body: JSON.stringify({
          date: formattedDate, // Send the formatted date
          name: holidayName,
          type: holidayType,
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to add holiday.");
      }

      const newHoliday = await response.json();

      // Update state with the sorted holidays after adding
      setHolidays(
        (prevHolidays) =>
          sortHolidaysByMonthAndCustomDay([...prevHolidays, newHoliday]) // Sort after adding the new holiday
      );

      // Reset the form
      setFormData({
        date: "",
        holidayName: "",
        holidayType: "Mandatory",
      });

      setShowModal(false); // Close the modal
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


  const fetchLeaveHistory = async () => {
    const excludeEmail = "admin@gmail.com"; // Replace with the email to exclude
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
    fetchLeaveHistory();
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
    const excludeEmail = "admin@gmail.com"; // Email to exclude from the list

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

    fetchEmployees();
  }, []);

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
      availableLeaves: wasApproved ? leave.availableLeaves + 1 : leave.availableLeaves,
      usedLeaves: wasApproved ? leave.usedLeaves - 1 : leave.usedLeaves,
    };

    try {
      const response = await fetch(`http://localhost:5001/leaverequests/${leave._id}`, {
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

    const currentStatus = leave.status[selectedIndex].toLowerCase();

    if (currentStatus !== "pending" && currentStatus !== "rejected") {
      console.log("This leave is already approved.");
      return;
    }

    const updatedLeave = {
      ...leave,
      availableLeaves: leave.availableLeaves > 0 ? leave.availableLeaves - 1 : leave.availableLeaves,
      usedLeaves: leave.usedLeaves + 1,
      status: leave.status.map((stat, index) =>
        index === selectedIndex && (stat.toLowerCase() === "pending" || stat.toLowerCase() === "rejected")
          ? "Approved"
          : stat
      ),
    };

    try {
      const response = await fetch(`http://localhost:5001/leaverequests/${leave._id}`, {
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
  const filteredLeaveHistory = leaveHistory.filter((leave) =>
    selectedFilter === "All"
      ? true
      : leave.status.some((status) => status.toLowerCase() === selectedFilter.toLowerCase())
  );
  const getDownloadLink = (attachments) => `http://localhost:5001/${attachments}`;

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
                 <FormControl component="fieldset">
  <FormLabel component="legend">Holiday Type</FormLabel>
  <RadioGroup
    name="holidayType"
    value={formData.holidayType}
    onChange={handleInputChange}
    row
  >
    <FormControlLabel
      value="Mandatory"
      control={<Radio />}
      label="Mandatory"
    />
    <FormControlLabel
      value="Optional"
      control={<Radio />}
      label="Optional"
    />
  </RadioGroup>
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
                {holidays ? holidays.map((holiday, index) => (
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
                            value={formData.name.toLowerCase()
                              .replace(/\b\w/g, (char) => char.toUpperCase())}
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
                        <td>
                          {holiday.date.split("-").slice(0, 2).join("-")}{" "}
                          {/* Display without the year */}
                        </td>
                        <td>{holiday.day}</td>
                        <td>{holiday.name}</td>
                        <td>{holiday.type}</td>
                        <td>
                          <button onClick={() => handleEdit(index)}>
                            <FaEdit size={20} color="blue" />
                          </button>
                          <button
                            onClick={() => handleDeleteHoliday(holiday._id)}
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
                )) : 
                <tr><td>No Holidays available</td></tr>
                }
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
          <h2>Leave Requests</h2>
    
          <div className="filter-container">
 
      <FormGroup row sx={{ justifyContent: 'flex-end' }}>
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
                '&.Mui-checked': {
                  color: selectedFilter === 'Approved' ? 'green' : 'default', // Changes checkbox color to green when checked
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
                '&.Mui-checked': {
                  color: selectedFilter === 'Rejected' ? 'red' : 'default', // Changes checkbox color to green when checked
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
        leave.status[index].toLowerCase() === selectedFilter.toLowerCase()
      ) {
        return (
          <tr key={`${leave._id}-${index}`}>
<td>{leave.empid || "N/A"}</td> {/* Access empid */}
<td>{leave.empname || "N/A"}</td> {/* Access empname */}

            <td>{leave.leaveType}</td>
            <td>{leave.duration ? leave.duration[index] : "N/A"}</td>
            <td>{new Date(startDate).toLocaleDateString()}</td>
            <td>{new Date(leave.endDate[index]).toLocaleDateString()}</td>
            <td>{leave.availableLeaves}</td>
            <td>
            {leave.attachments?.[index] ? (
              <a href={getDownloadLink(leave.attachments[index])} download>
                <AiFillFilePdf size={30} color="red" />
              </a>
            ) : (
<AiOutlineExclamationCircle size={30} color="orange" style={{ cursor: 'default' }} />
            )}
          </td>
            
            <td>{leave.reason[index]}</td>
            
            <td>
            {leave.status[index].toLowerCase() === "approved" && (
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
<MdCheckCircle size={24} style={{ marginRight: "5px" }} />
</button>
  )}
  {leave.status[index].toLowerCase() === "rejected" && (
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
      <MdCancel size={24} style={{ marginRight: "5px" }} /> 
    </button>
  )}
                {leave.status[index].toLowerCase() !== "approved" &&
    leave.status[index].toLowerCase() !== "rejected" && (
      <button
        onClick={() => handleRowClick(leave, index)}
        style={{
          display: "flex",
          color:"blue",
          alignItems: "center",
          background: "none",
          border: "none",
          cursor: "pointer",
        }}
      >
      <MdWatchLater size={24}/>
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
    <h3 style={{ marginBottom: "20px" }}>Approve or Reject Request?</h3>

    {/* Added code: Determine current status and toggle button enable/disable */}
    {selectedLeave && (() => {
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
              opacity: currentStatus.toLowerCase() === "approved" ? 0.5 : 1,
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
              opacity: currentStatus.toLowerCase() === "rejected" ? 0.5 : 1,
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
                  textTransform: "none",

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
                  <th>Employee ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Project</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                { employeeList ? employeeList.map((emp, index) => (
                  <tr key={emp._id}>
                    {editingRow === index ? (
                      <>
                        <td>
                          <input
                            type="text"
                            name="empname"
                            value={empData.empname.toLowerCase()
                              .replace(/\b\w/g, (char) => char.toUpperCase())}
                            onChange={handleEmployeeData}
                          />
                        </td>
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
                            name="email"
                            value={empData.email}
                            onChange={handleEmployeeData}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            name="role"
                            value={empData.role}
                            onChange={handleEmployeeData}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            name="project"
                            value={empData.project.toLowerCase()
                              .replace(/\b\w/g, (char) => char.toUpperCase())}
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
                        <td>{emp.role}</td>
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
                )) : 
                <tr>
                  <td>No Employees Available</td>
                </tr>
                }
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
