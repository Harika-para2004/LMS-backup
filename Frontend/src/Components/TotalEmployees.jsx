import React, { useState, useEffect } from "react";
import logo from "./../assets/img/quadfacelogo-hd.png";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { BASE_URL } from "../Config";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import axios from "axios";
import { FaEdit, FaTrash } from "react-icons/fa";
import { Outlet, useNavigate } from "react-router-dom";
import { AiOutlineClose } from "react-icons/ai";
import { faSearch } from "@fortawesome/free-solid-svg-icons";
import Pagination from "@mui/material/Pagination";
import Stack from "@mui/material/Stack";
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

const TotalEmployees = () => {
  const [selectedCategory, setSelectedCategory] = useState("holiday-calendar");
  const [editingRow, setEditingRow] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState(null);
  const [errors, setErrors] = useState({});
  const [showAddEmployeeModal, setShowAddEmployeeModal] = useState(false);
  const [employeeList, setEmpList] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState("All");
  const [modalOpen, setModalOpen] = useState(false);
  const year = new Date().getFullYear();
  const [searchTerm, setSearchTerm] = useState("");
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const excludeEmail = "admin@gmail.com"; // Email to exclude from the list
  // const [showAddEmployeeModal, setShowAddEmployeeModal] = useState(false);
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

  const filteredEmployees = employeeList
    .slice() // Create a shallow copy to avoid mutating original data
    .sort((a, b) =>
      a.empid.localeCompare(b.empid, undefined, { numeric: true })
    )
    .filter((emp) =>
      emp.empname.toLowerCase().includes(searchTerm.toLowerCase())
    );

  const [currentPage, setCurrentPage] = useState(1);
  const employeesPerPage = 15;

  // Calculate the indexes for slicing the data
  const indexOfLastEmployee = currentPage * employeesPerPage;
  const indexOfFirstEmployee = indexOfLastEmployee - employeesPerPage;
  const currentEmployees = filteredEmployees.slice(
    indexOfFirstEmployee,
    indexOfLastEmployee
  );

  // Handle page change
  const handlePageChange = (event, value) => {
    setCurrentPage(value);
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

  const handleDeactivateEmployee = async (id) => {
    const isConfirmed = window.confirm(
      "Are you sure you want to deactivate this employee?"
    );

    if (!isConfirmed) return;

    try {
      const response = await fetch(`${BASE_URL}employee-del/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isActive: false }),
      });

      if (!response.ok) {
        throw new Error("Failed to deactivate employee.");
      }

      alert("Employee deactivated successfully!");

      // Update UI state to reflect the deactivation
      setEmpList((prevEmployees) =>
        prevEmployees.map((emp) =>
          emp._id === id ? { ...emp, isActive: false } : emp
        )
      );
    } catch (error) {
      console.error("Error deactivating employee:", error);
      setError("Failed to deactivate employee. Please try again later.");
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

  const handleEmployeeData = (e) => {
    const { name, value } = e.target;
    setEmpData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleAddEmployeeClick = () => {
    setShowAddEmployeeModal(true);
  };

  const handleAddEmployeeClose = () => {
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
    setShowAddEmployeeModal(false);
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
          .map((entry) => `• ${entry.email}: ${entry.reason}`)
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

      if (
        error.response &&
        error.response.data.message.includes("Missing required columns")
      ) {
        alert(error.response.data.message); // Alert user about missing columns
      } else {
        setMessage("Error uploading file");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="emp-list-container">
      <div className="head">
        <h2 className="content-heading">Employee Details</h2>
        <TextField
          variant="outlined"
          size="small"
          placeholder="Search Employee"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <FontAwesomeIcon
                icon={faSearch}
                style={{ marginRight: "10px" }}
              />
            ),
          }}
        />
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "16px",
          }}
        >
          <div>
            <Tooltip title="Upload Employees" arrow>
              <Button
                component="label"
                variant="contained"
                color="primary"
                startIcon={<CloudUploadIcon />}
                sx={{ textTransform: "none" }}
              >
                Upload Excel
                <input
                  type="file"
                  accept=".xlsx, .xls"
                  onChange={handleFileChange}
                  id="file-input"
                  hidden
                />
              </Button>
            </Tooltip>
            {file && (
              <Button
                onClick={handleUpload}
                variant="contained"
                color="secondary"
                disabled={loading}
                startIcon={!loading && <CloudUploadIcon />}
                sx={{ marginLeft: 2 }}
              >
                {loading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  "Upload"
                )}
              </Button>
            )}
          </div>
          <Button
            variant="contained"
            onClick={() => handleAddEmployeeClick()}
            // onClick={() => setShowModal(true)}
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
            Add Employee
          </Button>
        </div>
      </div>

      {message && <p>{message}</p>}

      <table className="holiday-table">
        {/* <caption>Employee Details</caption> */}
        <thead>
          <tr>
            <th>Employee ID</th>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Project</th>
            <th>Is Active</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {currentEmployees.length > 0 ? (
            currentEmployees.map((emp, index) => (
              <tr key={emp._id}>
                {editingRow === index ? (
                  <>
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
                        value={empData.project
                          .toLowerCase()
                          .replace(/\b\w/g, (char) => char.toUpperCase())}
                        onChange={handleEmployeeData}
                      />
                    </td>
                    <td>{emp.isActive ? "Yes" : "No"}</td>
                    <td>
                      <button
                        className="save-btn"
                        onClick={() => handleSave1(index)}
                      >
                        Save
                      </button>
                    </td>
                  </>
                ) : (
                  <>
                    <td>{emp.empid}</td>
                    <td>
                      {emp.empname
                        .toLowerCase()
                        .replace(/\b\w/g, (char) => char.toUpperCase())}
                    </td>
                    <td>{emp.email}</td>
                    <td>{emp.role}</td>
                    <td>
                      {emp.project
                        .toLowerCase()
                        .replace(/\b\w/g, (char) => char.toUpperCase())}
                    </td>
                    <td style={{ color: !emp.isActive ? "red" : "green" }}>
                      {emp.isActive ? "Yes" : "No"}
                    </td>{" "}
                    <td>
                      <button
                        onClick={() => handleEditEmployee(index)}
                        style={{
                          border: "none",
                          background: "none",
                          cursor: "pointer",
                        }}
                      >
                        <FaEdit className="edit-icon" size={20} color="blue" />
                      </button>
                      <button
                        onClick={() => handleDeactivateEmployee(emp._id)}
                        disabled={!emp.isActive}
                        style={{
                          border: "none",
                          background: "none",
                          cursor: emp.isActive ? "pointer" : "not-allowed",
                          opacity: emp.isActive ? 1 : 0.2,
                        }}
                      >
                        <FaTrash className="del-icon" size={20} color="red" />
                      </button>
                    </td>
                  </>
                )}
              </tr>
            ))
          ) : (
            <tr>
              <td>No Employees Available</td>
            </tr>
          )}
        </tbody>
      </table>

      <Stack spacing={2} sx={{ mt: 2, display: "flex", alignItems: "center" }}>
        <Pagination
          count={Math.ceil(filteredEmployees.length / employeesPerPage)}
          page={currentPage}
          onChange={handlePageChange}
          color="primary"
        />
      </Stack>

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
          <Typography
            variant="h5"
            id="add-employee-modal"
            textTransform="capitalize"
            textAlign="center"
          >
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
};

export default TotalEmployees;
