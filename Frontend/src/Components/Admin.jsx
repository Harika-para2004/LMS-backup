import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import logo from "./../assets/img/logo.jpg";

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
  // ... other states

  const handleAddEmployeeClick = () => {
    setShowAddEmployeeModal(true);
  };

  const handleAddEmployeeClose = () => {
    setShowAddEmployeeModal(false);
  };
  const [empData, setEmpData] = useState({
    empname: '',
    empid: '',
    email: '',
    password: '',
    project: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEmpData({ ...empData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:5001/api/auth/addEmployee', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(empData)
      });
  
      if (response.ok) {
        const responseData = await response.json();
        alert(responseData.message);
  
        if (response.status === 200 || response.status === 201) {
          const userDataResponse = await fetch(`http://localhost:5001/api/auth/user/${responseData.userId}`);
          
          if (userDataResponse.ok) {
            const userData = await userDataResponse.json();
            localStorage.setItem("userData", JSON.stringify(userData));
          } else {
            alert('Failed to fetch user data');
          }
        }
      } else {
        alert('Failed to add employee');
      }
    } catch (error) {
      alert('Error:', error.message);
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
  
      const response = await fetch("http://localhost:5001/holidays", {
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
        const response = await fetch("http://localhost:5001/holidays", {
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
  };
  const handleEdit = (index) => {
    setEditingRow(index);
    setFormData(holidays[index]);
  };

  const handleSave = async (index) => {
    if (!formData.date || !formData.day || !formData.name || !formData.type) {
      setError("All fields are required.");
      return;
    }

    const updatedHolidays = [...holidays];
    const holidayId = updatedHolidays[index]._id;

    try {
      const response = await fetch(
        `http://localhost:5001/holidays/${holidayId}`,
        {
          method: "PUT",
          body: JSON.stringify(formData),
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

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

  const renderContent = () => {
    switch (selectedCategory) {
      case "holiday-calendar":
        return (
          <div>
            <Typography variant="h4">Holiday Calendar</Typography>
            <Button
  variant="contained"
  onClick={() => setShowModal(true)}
  sx={{
    position: "absolute",
    backgroundColor:'#313896', // Align the button absolutely
    right: 0,
    marginTop:'-40px', // Push it to the right edge
    marginRight: "35px", // Optional: Add some spacing from the right edge
    "&:focus": {
      outline: "none",
    },
  }}
>
  Add New Holiday
</Button>


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

            <table className="holiday-table">
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
        return <div></div>;
      case "reports":
        return <div></div>;
      case "leaverequests":
        return (
          <div className="history-container">
            <h2>Leave Requests</h2>
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
      default:
        return <div>Select a category to get started!</div>;
    }
  };

  return (
    <div className="dashboard-container">
  

      <div className="content">
        
        <nav className="sidebar" id="side_admin">
        <img src={logo} alt="Quadface Logo" className="logo_das" />

          <ul>
            <li>
              <Link
                to="#"
                onClick={() => setSelectedCategory("holiday-calendar")}
              >
                Holiday Calendar
              </Link>
            </li>
            <li>
              <Link to="#" onClick={() => setSelectedCategory("reports")}>
                Reports
              </Link>
            </li>
            <li>
              <Link to="#" onClick={() => setSelectedCategory("leavepolicy")}>
                Leave Policy Configuration
              </Link>
            </li>

            <li>
              <Link to="#" onClick={() => setSelectedCategory("leaverequests")}>
                Leave Requests{" "}
              </Link>
            </li>
          </ul>
        </nav>
        
        <main className="main-content">{renderContent()}</main>
      </div>

      <Button
          variant="contained"
          onClick={handleAddEmployeeClick}
          sx={{backgroundColor:'#9F32B2', width:'100%',marginTop:'5px',padding:'10px',border:'none' }}
        >
          Add Employee
        </Button>
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
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 400,
          bgcolor: 'background.paper',
          borderRadius: 2,
          boxShadow: 24,
          p: 4,
          display: 'flex',
          flexDirection: 'column',
          gap: 2
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

export default AdminDashboard;
