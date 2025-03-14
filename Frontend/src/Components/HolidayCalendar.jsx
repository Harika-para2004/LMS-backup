import React, { useState, useEffect, useMemo } from "react";
const BASE_URL = "http://localhost:5001/";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import {
  Box,
  Button,
  TextField,
  FormControl,
  FormControlLabel,
  Select,
  MenuItem,
  RadioGroup,
  FormLabel,
  Radio,
  IconButton,
  Typography,
  Modal,
  Tooltip,
} from "@mui/material";
import { Delete, Edit } from "@mui/icons-material";
import { FaInfoCircle } from "react-icons/fa";
import useToast from "./useToast";
import * as XLSX from "xlsx";
const HolidayCalendar = () => {
  const [holidays, setHolidays] = useState([]);
  const [showTooltip, setShowTooltip] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [file, setFile] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const year = new Date().getFullYear();
  const [editingRow, setEditingRow] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [error, setError] = useState(null);
  const [errors, setErrors] = useState({});
  const showToast = useToast();
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [formData, setFormData] = useState({
    date: "",
    holidayName: "",
    holidayType: "Mandatory",
  });
  const yearsRange = useMemo(() => {
    return Array.from({ length: 17 }, (_, i) => currentYear - (i - 1));
  }, [currentYear]);
  console.log(selectedYear);

  const handlefileChange = (event) => {
    const file = event.target.files[0];

    if (file) {
      setSelectedFile(file); // Store the actual file
      handleHolidayUpload(file); // Call upload function

      // ✅ Reset the input field to allow re-uploading the same file
      event.target.value = null;
    }
  };

  const handleHolidayUpload = async (file) => {
    if (!file) {
      alert("Please select a file first.");
      return;
    }

    const reader = new FileReader();

    reader.onload = async (e) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const holidays = XLSX.utils.sheet_to_json(sheet);

      // ✅ Handle different date formats
      const filteredHolidays = holidays.filter((holiday) => {
        if (!holiday.date) return false; // Ensure date exists

        let holidayYear;

        if (typeof holiday.date === "string") {
          // If date is a string in "DD/MM/YYYY" format
          const [day, month, year] = holiday.date.split("/").map(Number);
          holidayYear = year;
        } else if (typeof holiday.date === "number") {
          // If date is an Excel serial number, convert it to a JS Date object
          const excelDate = new Date((holiday.date - 25569) * 86400000);
          holidayYear = excelDate.getFullYear();
        } else if (holiday.date instanceof Date) {
          // If already a Date object
          holidayYear = holiday.date.getFullYear();
        }

        return holidayYear === selectedYear;
      });

      if (filteredHolidays.length === 0) {
        alert(`No holidays found for ${selectedYear}.`);
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
          alert(`Error: ${result.message}`);
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

    reader.readAsArrayBuffer(file);
  };

  useEffect(() => {
    if (selectedYear) {
      fetchHolidays();
    }
  }, [selectedYear]); // ✅ Depend on selectedYear

  const fetchHolidays = async () => {
    if (!selectedYear) {
      console.error("Selected year is missing!"); // ✅ Debugging log
      return;
    }

    const requestUrl = `${BASE_URL}holidays?year=${selectedYear}`;
    console.log("Fetching from:", requestUrl); // ✅ Log the full API URL

    try {
      const response = await fetch(requestUrl, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Fetched holidays:", data); // ✅ Debugging log

      const sortedHolidays = sortHolidaysByMonthAndCustomDay(data);
      setHolidays(sortedHolidays);
    } catch (error) {
      console.error("Error fetching holidays:", error);
      setError("Failed to fetch holidays. Please try again later.");
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
    const holidayToEdit = holidays[index];
    if (!holidayToEdit) return;

    const [day, monthText, year] = holidayToEdit.date.split("-");
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
    const monthIndex = monthNames.indexOf(monthText) + 1;

    if (monthIndex === 0) {
      console.error("Invalid month:", monthText);
      return;
    }

    const formattedDate = `${year}-${String(monthIndex).padStart(
      2,
      "0"
    )}-${day.padStart(2, "0")}`;

    setFormData({
      date: formattedDate,
      holidayName: holidayToEdit.name,
      holidayType: holidayToEdit.type,
    });

    setEditingRow(index);
    setIsEditMode(true);
    setShowModal(true);
  };

  const handleDownloadHolidayTemplate = async () => {
    try {
      const response = await fetch(`${BASE_URL}excel/downloadHolidayTemplate`);
      const blob = await response.blob();

      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(blob);
      link.download = "Holiday_Template.xlsx";
      link.click();
    } catch (error) {
      console.error("Error downloading holiday template:", error);
      alert("Failed to download template. Try again.");
    }
  };

  const handleDeleteHoliday = async (id) => {
    const isConfirmed = window.confirm(
      "Are you sure you want to delete this holiday? This action cannot be undone."
    );
    if (!isConfirmed) {
      return;
    }
    try {
      const response = await fetch(`${BASE_URL}holidays/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete employee.");
      }
      setHolidays((prevHolidays) =>
        prevHolidays.filter((holiday) => holiday._id !== id)
      );
      showToast("Holiday deleted successfully!");
      fetchHolidays();
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
  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      const [year, month, day] = formData.date.split("-");
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

      const requestData = {
        date: formattedDate,
        name: formData.holidayName,
        type: formData.holidayType,
      };

      // ✅ Normalize dates for consistent comparison
      const normalizeDate = (dateStr) => dateStr.toLowerCase().trim();

      const duplicateDate = holidays.find(
        (holiday) =>
          normalizeDate(holiday.date) === normalizeDate(formattedDate) &&
          (!isEditMode || holiday._id !== holidays[editingRow]._id) // ✅ Allow self-update
      );

      const duplicateName = holidays.find(
        (holiday) =>
          holiday.name.toLowerCase().trim() ===
            formData.holidayName.toLowerCase().trim() &&
          (!isEditMode || holiday._id !== holidays[editingRow]._id) // ✅ Allow self-update
      );

      if (duplicateDate) {
        showToast("A holiday with this date already exists!");
        return;
      }

      if (duplicateName) {
        ShowToast("A holiday with this name already exists!");
        return;
      }

      const url = isEditMode
        ? `${BASE_URL}holidays/${holidays[editingRow]._id}`
        : `${BASE_URL}/holidays`;
      const method = isEditMode ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestData),
      });

      const updatedHoliday = await response.json();
      if (!response.ok)
        throw new Error(updatedHoliday.message || "Failed to update holiday.");

      const updatedHolidays = isEditMode
        ? holidays.map((holiday, idx) =>
            idx === editingRow ? updatedHoliday : holiday
          )
        : [...holidays, updatedHoliday];

      setHolidays(sortHolidaysByMonthAndCustomDay(updatedHolidays));

      setShowModal(false);
      setEditingRow(null);
      setFormData({ date: "", holidayName: "", holidayType: "Mandatory" });
      setIsEditMode(false);
    } catch (error) {
      console.error("Error updating holiday:", error);
      showToast("Failed to update holiday.");
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
      if (monthIndexA !== monthIndexB) {
        return monthIndexA - monthIndexB;
      }
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

      // ✅ Normalize date format (yyyy-mm-dd → dd-MMM-yyyy)
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

      // ✅ Normalize name (trim spaces & convert to lowercase)
      const trimmedName = holidayName.trim().toLowerCase();

      // ✅ Check for duplicate **date** in local state
      const isDuplicateDate = holidays.some(
        (holiday) => holiday.date === formattedDate
      );
      if (isDuplicateDate) {
        showToast(`A holiday already exists on ${formattedDate}!`);
        return;
      }

      // ✅ Check for duplicate **name** in local state
      const isDuplicateName = holidays.some(
        (holiday) => holiday.name.trim().toLowerCase() === trimmedName
      );
      if (isDuplicateName) {
        showToast(
          `A holiday with the name "${holidayName.trim()}" already exists!`
        );
        return;
      }

      // ✅ Send request to backend
      const response = await fetch(`${BASE_URL}holidays`, {
        method: "POST",
        body: JSON.stringify({
          date: formattedDate,
          name: holidayName.trim(), // Trim before sending to backend
          type: holidayType,
        }),
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json();

      if (!response.ok) {
        showToast(data.message); // 🔴 Show backend error message
        return;
      }

      // ✅ Update holidays state & sort
      setHolidays((prevHolidays) =>
        sortHolidaysByMonthAndCustomDay([...prevHolidays, data])
      );

      // ✅ Reset form & close modal
      setFormData({ date: "", holidayName: "", holidayType: "Mandatory" });
      setShowModal(false);
    } catch (error) {
      console.error("Error adding holiday:", error);
      showToast("Failed to add holiday. Please try again later."); // 🔴 Handle unexpected errors
    }
  };

  const handleEditHoliday = () => {
    if (!validateForm()) return; // Don't proceed if validation fails

    setFormData({
      date: "",
      holidayName: "",
      holidayType: "Mandatory",
    });
    setShowModal(false);
  };

  return (
    <div className="holiday-cal-container">
      {showModal && (
        <Modal
          open={showModal}
          onClose={() => {
            setShowModal(false);
            setEditingRow(null);
            setIsEditMode(false);
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
              e.preventDefault();
              if (isEditMode) {
                handleSave(editingRow); // Correct function call
              } else {
                handleAddHoliday();
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
              inputProps={{
                min: `${selectedYear}-01-01`, // Start of the selected year
                max: `${selectedYear}-12-31`, // End of the selected year
              }}
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
                  setEditingRow(null);
                  setIsEditMode(false);
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
              <Button variant="contained" type="submit">
                {isEditMode ? "Save Changes" : "Add Holiday"}
              </Button>
            </Box>
          </Box>
        </Modal>
      )}

      <div className="head">
        <h2 className="content-heading">Holiday Calendar {year}</h2>
        <FormControl
          sx={{
            minWidth: 85,
            bgcolor: "white",
            borderRadius: 1,
            boxShadow: "0px 2px 6px rgba(159, 50, 178, 0.2)", // Softer purple glow for elegance
            "& .MuiOutlinedInput-notchedOutline": { border: "none" }, // Removes default border
          }}
        >
          <Select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            displayEmpty
            sx={{
              fontSize: "12px",
              fontWeight: 500,
              color: "#fff",
              background: "linear-gradient(135deg, #9F32B2 0%, #6A1B9A 100%)", // Elegant gradient
              borderRadius: 1,
              height: 40, // Slightly reduced height for compact look
              px: 1.2, // Well-balanced padding
              bgcolor: "#fafafa", // Softer background
              transition: "all 0.3s ease-in-out",
              "&:hover": { bgcolor: "#f0f0f0" },
              "&.Mui-focused": {
                background: "linear-gradient(135deg, #9F32B2 0%, #6A1B9A 100%)", // Elegant gradient
                boxShadow: "0px 3px 8px rgba(159, 50, 178, 0.3)", // Elegant focused effect
              },
            }}
          >
            {yearsRange.map((year) => (
              <MenuItem
                key={year}
                value={year}
                sx={{
                  fontSize: "12px",
                  px: 1.2,
                  "&:hover": { bgcolor: "#f5e9f7" }, // Subtle hover effect
                }}
              >
                {year}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              background: "#fff",
              border: "1px solid #ddd",
              borderRadius: "6px",
              whiteSpace: "nowrap",
            }}
          >
            <Button
              onClick={handleDownloadHolidayTemplate}
              sx={{ color: "#313896" }}
            >
              ⬇️ Template
            </Button>
          </div>
          <Button
            id="file-input"
            variant="outlined"
            component="label"
            disabled={selectedYear < new Date().getFullYear()}
            sx={{
              color: "#313896",
              borderColor: "#313896",
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
          {/* <div style={{ position: "relative", display: "inline-block" }}>
            <div
              className="cursor-pointer p-2 rounded-full bg-blue-100 hover:bg-blue-200 transition duration-300 shadow-md inline-flex items-center justify-center"
              onClick={() => setShowTooltip(!showTooltip)}
            >
              <FaInfoCircle size={24} />
            </div>

            {showTooltip && (
              <div
                style={{
                  position: "absolute",
                  background: "#fff",
                  border: "1px solid #ddd",
                  padding: "8px 12px",
                  borderRadius: "6px",
                  top: "30px", // Positions below the "i" icon
                  left: "50%",
                  transform: "translateX(-50%)",
                  boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.15)",
                  whiteSpace: "nowrap",
                  transition: "opacity 0.3s ease-in-out",
                  zIndex: 1000, // Ensures visibility
                }}
                onClick={() => setShowTooltip(false)}
              >
                <button
                  onClick={handleDownloadHolidayTemplate}
                  style={{
                    background: "#007bff",
                    border: "none",
                    color: "white",
                    fontSize: "14px",
                    padding: "8px 14px",
                    borderRadius: "5px",
                    cursor: "pointer",
                    fontWeight: "500",
                    transition: "background 0.3s ease",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                  }}
                  onMouseEnter={(e) => (e.target.style.background = "#0056b3")}
                  onMouseLeave={(e) => (e.target.style.background = "#007bff")}
                >
                  ⬇️ Download Template
                </button>
              </div>
            )}
          </div> */}

          <Button
            variant="contained"
            onClick={() => setShowModal(true)}
            disabled={selectedYear < new Date().getFullYear()}
            sx={{
              // fontSize: "13px",
              // fontWeight: 500,
              // color: "#313896",
              color: "white",
              bgcolor: "#313896",

              "&:hover": { bgcolor: "#313896" },
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
                <td>
                  {holiday.date.split("-").slice(0, 2).join("-")}{" "}
                  {/* Display without the year */}
                </td>
                <td>{holiday.day}</td>
                <td>{formatCase(holiday.name)}</td>
                <td>{holiday.type}</td>
                <td>
                  <button
                    onClick={() =>
                      selectedYear >= new Date().getFullYear() &&
                      handleEdit(index)
                    }
                    disabled={selectedYear < new Date().getFullYear()} // Disable for past years
                    style={{
                      background: "transparent",
                      border: "none",
                      cursor:
                        selectedYear < new Date().getFullYear()
                          ? "not-allowed"
                          : "pointer", // Show "not-allowed" cursor for past years
                      opacity:
                        selectedYear < new Date().getFullYear() ? 0.5 : 1, // Dim button for past years
                    }}
                  >
                    <Tooltip title="Edit">
                      <IconButton
                        size="small"
                        disabled={selectedYear < new Date().getFullYear()}
                      >
                        <Edit
                          color={
                            selectedYear < new Date().getFullYear()
                              ? "disabled"
                              : "primary"
                          }
                          fontSize="small"
                        />
                      </IconButton>
                    </Tooltip>
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
                      <IconButton
                        size="small"
                        disabled={selectedYear < new Date().getFullYear()}
                      >
                        <Delete
                          color={
                            selectedYear < new Date().getFullYear()
                              ? "disabled"
                              : "error"
                          }
                          fontSize="small"
                        />
                      </IconButton>
                    </Tooltip>{" "}
                  </button>
                </td>
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
