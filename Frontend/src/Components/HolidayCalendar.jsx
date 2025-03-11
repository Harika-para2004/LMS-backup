import React, { useState, useEffect } from "react";
import logo from "./../assets/img/quadfacelogo-hd.png";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
// import { BASE_URL } from "../Config";
const BASE_URL = "http://localhost:5001/";

import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import axios from "axios";
import { FaEdit, FaTrash } from "react-icons/fa";
import { Outlet, useNavigate } from "react-router-dom";
import { AiOutlineClose } from "react-icons/ai";
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
  Tooltip,
} from "@mui/material";
import Sidebar from "./Sidebar";
import { Delete, Edit } from "@mui/icons-material";

const HolidayCalendar = () => {
  const [holidays, setHolidays] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [file, setFile] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const year = new Date().getFullYear();
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [editingRow, setEditingRow] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [error, setError] = useState(null);
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  /*Add New Employee*/
  const [showAddEmployeeModal, setShowAddEmployeeModal] = useState(false);
  const [employeeList, setEmpList] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState("All");
  const [modalOpen, setModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const excludeEmail = "admin@gmail.com"; // Email to exclude from the list
  // const [showAddEmployeeModal, setShowAddEmployeeModal] = useState(false);
  const [formData, setFormData] = useState({
    date: "",
    holidayName: "",
    holidayType: "Mandatory",
  });
  const [empData, setEmpData] = useState({
    empname: "",
    empid: "",
    email: "",
    password: "",
    gender: "",
    project: "",
    role: "",
    managerEmail: "",
  });

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

  const handleEdit = (index) => {
    setEditingRow(index);
    setFormData(holidays[index]);
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

  const formatCase = (text) => {
    return text.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const handleAddHoliday = async () => {
    if (!validateForm()) return;

    try {
      const { date, holidayName, holidayType } = formData;

      // Convert date format (dd-MMM-yyyy)
      const [year, month, day] = date.split("-");
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
      }-${year}`;

      // Send API request
      const response = await fetch(`${BASE_URL}holidays`, {
        method: "POST",
        body: JSON.stringify({
          date: formattedDate,
          name: holidayName,
          type: holidayType,
        }),
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message); //  Show alert if holiday already exists
        return;
      }

      // Update state with the new holiday
      setHolidays((prevHolidays) =>
        sortHolidaysByMonthAndCustomDay([...prevHolidays, data])
      );

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

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  return (
    <div className="holiday-cal-container">
      {showModal && (
        <Modal
          open={showModal}
          onClose={() => {
            setShowModal(false);
            setFormData({
              date: "",
              holidayName: "",
              holidayType: "Mandatory",
            });
          }}
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
              overflowY: "auto",
            }}
          >
            <Typography variant="h5" id="holiday-modal" textAlign="center">
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
              <Button
                onClick={() => {
                  setShowModal(false);
                  setFormData({
                    date: "",
                    holidayName: "",
                    holidayType: "Mandatory",
                  });
                }}
                sx={{ mr: 2 }}
              >
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

      <div className="head">
        <h2 className="content-heading">Holiday Calendar {year}</h2>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Button
            id="file-input"
            variant="text"
            component="label"
            sx={{
              borderRadius: "5px",
              "&:focus": { outline: "none" },
              textTransform: "none",
            }}
            startIcon={<CloudUploadIcon />}
          >
            {/* <CloudUploadIcon fontSize="small" /> */}
            Upload Holidays
            <input
              type="file"
              accept=".xlsx, .xls"
              hidden
              onChange={(e) => {
                handlefileChange(e);
                setSelectedFile(e.target.files[0]); // Update selected file state
              }}
            />
          </Button>
          <Button
            variant="contained"
            onClick={() => setShowModal(true)}
            sx={{
              fontSize: "13px",
              fontWeight: 500,
              color: "#fff",
              background:
                "linear-gradient(135deg, #9F32B2 0%, #6A1B9A 100%)", // Elegant gradient
              borderRadius: 1,
              bgcolor: "#fafafa", // Softer background
              transition: "all 0.3s ease-in-out",
              "&:hover": { bgcolor: "#f0f0f0" },
              "&.Mui-focused": {
                background:
                  "linear-gradient(135deg, #9F32B2 0%, #6A1B9A 100%)", // Elegant gradient
                boxShadow: "0px 3px 8px rgba(159, 50, 178, 0.3)", // Elegant focused effect
              },
            }}
          >
            Add Holiday
          </Button>

          {/* Show file name only if selected */}
          {selectedFile && (
            <Typography variant="body2" sx={{ fontWeight: "bold" }}>
              {selectedFile.name}
            </Typography>
          )}
        </div>
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
          {holidays.length > 0 ? (
            holidays.map((holiday, index) => (
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
                      <button
                        className="save-btn"
                        onClick={() => handleSave(index)}
                      >
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
                    <td>{formatCase(holiday.name)}</td>
                    <td>{holiday.type}</td>
                    <td>
                      <button onClick={() => handleEdit(index)}>
                        <Tooltip title="Edit">
                          <IconButton size="small" >
                            <Edit color="primary" fontSize="small" />
                          </IconButton>
                        </Tooltip>{" "}
                      </button>
                      <button
                        onClick={() => handleDeleteHoliday(holiday._id)}
                        style={{
                          border: "none",
                          background: "none",
                          cursor: "pointer",
                        }}
                      >
                        <Tooltip title="Delete">
                          <IconButton size="small">
                            <Delete color="error" fontSize="small" />
                          </IconButton>
                        </Tooltip>{" "}
                      </button>
                    </td>
                  </>
                )}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="5" style={{ textAlign: "center", padding: "10px" }}>
                No holidays available
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default HolidayCalendar;
