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
import { useRef } from "react";
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
  const editFormRef = useRef(null);
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
  const handleManagerChange = (e) => {
    const selectedValue = e.target.value;
    setSelectedManager(selectedValue);
    setEmpData((prevData) => ({
      ...prevData,
      managerEmail: selectedValue, // Assuming manager is identified by email
    }));
  };
  
  const handleProjectChange = (event) => {
    setSelectedProject(event.target.value);
    setEmpData((prev) => ({ ...prev, project: event.target.value })); // ✅ Replace, not append
  };
  
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
  const [managers, setManagers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedManager, setSelectedManager] = useState(""); // Default to empty string
  const [selectedProject, setSelectedProject] = useState(""); // Default empty value
  const [projectDetails,setProjectDetails]=useState([]);
  useEffect(() => {
    fetchProjects();
  }, []);

 ;const fetchProjects = async () => {
    try {
      const response = await fetch(`${BASE_URL}api/projects`);
      const data = await response.json();
      setProjects(data);
    } catch (error) {
      console.error("Error fetching projects", error);
    }
  };
  
  useEffect(() => {
    const fetchProjectsAndManagers = async () => {
      try {
        const response = await axios.get(`${BASE_URL}api/fetchprojects`, {
          params: { managerEmail: selectedManager || undefined },
        });

        setProjects(response.data.projects); // Update projects when manager changes
        setManagers(response.data.managers);

        setSelectedProject(""); // Reset project selection when manager changes
      } catch (error) {
        console.error("Error fetching projects and managers:", error);
      }
    };

    fetchProjectsAndManagers();
  }, [selectedManager]); // Refetch projects when manager changes


  useEffect(() => {
   
  
    fetchManagers();
  }, []);
  const fetchManagers = async () => {
    try {
      const response = await fetch(`${BASE_URL}getManagers`);
      if (!response.ok) {
        throw new Error("Failed to fetch managers.");
      }
      const data = await response.json();
      setManagers(data); // Assuming API returns an array of managers
    } catch (error) {
      console.error("Error fetching managers:", error);
    }
  };
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
  const handleSave1 = async (id) => {
    if (
      !empData.email ||
      !empData.empid ||
      !empData.empname ||
      (empData.role === "Employee" && (!empData.project || empData.project.length === 0)) || 
      !empData.role
    ) {
      setError("All fields are required.");
      return;
    }
  
    const requestBody = {
      ...empData,
      project: empData.role === "Manager" ? empData.project : empData.project,
      managerEmail: empData.managerEmail
    };
    
  
    console.log("Request Payload:", requestBody); // ✅ Debugging Line
  
    try {
      const response = await fetch(`${BASE_URL}updateEmployeeList/${id}`, {
        method: "PUT",
        body: JSON.stringify(requestBody),
        headers: {
          "Content-Type": "application/json",
        },
      });
  
      if (!response.ok) {
        const errorMessage = await response.text(); // Read the error message
        throw new Error(`Failed to update employee. Server Response: ${errorMessage}`);
      }
  
      fetchEmployees();
      setEditingRow(null);
      setError(null);
      setEmpData({});
      setSelectedManager("");
      setSelectedProject("");
    } catch (error) {
      console.error("Error updating employee:", error);
      setError(error.message);
    }
  };
  
  
  const handleChange = (e) => {
    const { name, value } = e.target;
  
    setEmpData((prevData) => {
      const updatedData = { ...prevData, [name]: value };
  
      // If role is "Manager" and managerEmail is empty, auto-assign project
      if (name === "role" && value === "Manager" && !prevData.managerEmail) {
        const assignedProject = projectDetails.find(
          (project) => project.managerEmail === prevData.email && !project.managerAssigned
        );
  
        if (assignedProject) {
          updatedData.project = assignedProject.projectName;
        }
      }
  
      return updatedData;
    });
  };
  

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { empname, empid, email, password, project, gender, role } = empData;
      if(!empname || !empid){
        alert("Please Enter Required Fields *")
        return
      }



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
            setEmpList((prevList) => [...prevList, userData]);
            fetchEmployees();
            fetchManagers();
            // Update employee list immediately
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
      fetchEmployees();
    } catch (error) {
      console.error("Error deactivating employee:", error);
      setError("Failed to deactivate employee. Please try again later.");
    }
  };
  const handleEditEmployee = (id) => {
    // Find the employee using _id
    console.log("id",id)
    const selectedEmployee = employeeList.find((emp) => emp._id === id);
  
    if (selectedEmployee) {
      // Set editing row to the found employee's _id
      setEditingRow(id);
      setTimeout(() => {
        if (editFormRef.current) {
          editFormRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 100);
      // Populate the form data with the selected employee's details
      setEmpData({
        empname: selectedEmployee.empname,
        empid: selectedEmployee.empid,
        email: selectedEmployee.email,
        project: selectedEmployee.project,
        role: selectedEmployee.role,
        managerEmail: selectedEmployee.managerEmail,
      });
      handleSave1(id)
    }
  };
  const handleCancel = () => {
    setEditingRow(null); // Exit edit mode
    setEmpData({}); // Reset form data (optional, if needed)
    setSelectedManager("");
    setSelectedProject("");
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
  const toCamelCase = (str) => {
    return str
      .toLowerCase()
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };
  
  const formatCase = (text) => {
    return text.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
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
      {showAddEmployeeModal && !editingRow && (
  <div style={{ display: "flex", justifyContent: "center", alignItems: "center", marginTop: "20px" }}>
    <form
      onSubmit={handleSubmit}
      style={{
        width: "700px",
        backgroundColor: "white",
        borderRadius: "8px",
        boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)",
        padding: "20px",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
        overflowY: "auto",
        margin: "10px auto",
      }}
    >
      <Typography variant="h5" id="add-employee-form" textTransform="capitalize" textAlign="center">
      Add Employee / Manager
      </Typography>

      <div style={{ display: "flex", gap: "16px" }}>
        <TextField label="Name *" name="empname" value={empData.empname} onChange={handleChange} fullWidth />
        <TextField label="Id *" name="empid" value={empData.empid} onChange={handleChange} fullWidth />
      </div>
      <div style={{ display: "flex", gap: "16px" }}>
        <TextField label="Email *" name="email" value={empData.email} onChange={handleChange} fullWidth />
        <TextField label="Password *" name="password" value={empData.password} onChange={handleChange} fullWidth />
      </div>
      <div style={{ display: "flex", gap: "16px" }}>
        <FormControl fullWidth>
          <InputLabel id="gender-label" sx={{ backgroundColor: "white", paddingX: "4px" }}>Gender *</InputLabel>
          <Select labelId="gender-label" id="gender" name="gender" value={empData.gender} onChange={handleChange}>
            <MenuItem value="Male">Male</MenuItem>
            <MenuItem value="Female">Female</MenuItem>
            <MenuItem value="Other">Other</MenuItem>
          </Select>
        </FormControl>
        <FormControl fullWidth>
          <InputLabel id="role-label" sx={{ backgroundColor: "white", paddingX: "4px" }}>Role *</InputLabel>
          <Select 
            labelId="role-label" 
            id="role" 
            name="role" 
            value={empData.role} 
            onChange={(e) => {
              handleChange(e);
              if (e.target.value === "Employee") {
                fetchProjects();
              }
            }}
          >
            <MenuItem value="Manager">Manager</MenuItem>
            <MenuItem value="Employee">Employee</MenuItem>
          </Select>
        </FormControl>
      </div>
      <div style={{ display: "flex", gap: "16px" }}>
        {empData.role === "Employee" && (
          <FormControl fullWidth>
            <InputLabel sx={{ backgroundColor: "white", paddingX: "4px" }}>Manager Email *</InputLabel>
            <Select value={selectedManager} onChange={handleManagerChange}>
              <MenuItem value="">All Managers</MenuItem>
              {managers.map((manager) => (
                <MenuItem key={manager._id} value={manager.email}>
                  {manager.empname} ({manager.email})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}

{empData.role === "Manager" && (
  <FormControl fullWidth>
    <InputLabel sx={{ backgroundColor: "white", paddingX: "4px" }}>
      Project
    </InputLabel>
    <Select
      value={empData.project || ""}
      onChange={(e) =>
        setEmpData({ ...empData, project: e.target.value })
      }
    >
      {projects.length > 0 ? (
        projects.map((project) => (
          <MenuItem
            key={project._id}
            value={project.projectName.toLowerCase()} // ✅ Store in lowercase
          >
            {toCamelCase(project.projectName)} {/* ✅ Display in camel case */}
          </MenuItem>
        ))
      ) : (
        <MenuItem disabled>No projects available</MenuItem>
      )}
    </Select>
  </FormControl>
)}

      </div>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <Button variant="contained" type="submit">
          Add Employee
        </Button>
        <Button onClick={handleAddEmployeeClose} style={{ marginRight: "8px" }}>
          Cancel
        </Button>
      </div>
    </form>
  </div>
)}
{editingRow && (
  <div
    ref={editFormRef}
    style={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      padding: "20px",
    }}
  >
    <div
      style={{
        background: "#f9f9f9",
        padding: "24px",
        borderRadius: "8px",
        boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)",
        width: "700px",
      }}
    >
      <Typography
        variant="h5"
        textTransform="capitalize"
        textAlign="center"
      >
        Update Employee
      </Typography>
      <br/>

      {/* Employee ID and Name */}
      <div style={{ display: "flex", gap: "16px", marginBottom: "16px" }}>
        <TextField
          label="Employee Name"
          name="empname"
          value={empData.empname}
          onChange={handleEmployeeData}
          fullWidth
        />
        <TextField
          label="Employee ID"
          name="empid"
          value={empData.empid}
          onChange={handleEmployeeData}
          fullWidth
        />
      </div>

      {/* Email and Role */}
      <div style={{ display: "flex", gap: "16px", marginBottom: "16px" }}>
        <TextField
          label="Email"
          name="email"
          value={empData.email}
          onChange={handleEmployeeData}
          fullWidth
        />
        <FormControl fullWidth variant="outlined">
          <InputLabel sx={{ backgroundColor: "white", paddingX: "4px" }}>Role</InputLabel>
          <Select
            name="role"
            value={empData.role}
            onChange={(e) => {
              handleEmployeeData(e);
              if (e.target.value === "Employee") {
                fetchProjects(); // ✅ Fetch projects for Employees
              }
            }}
          >
            <MenuItem value="Manager">Manager</MenuItem>
            <MenuItem value="Employee">Employee</MenuItem>
          </Select>
        </FormControl>
      </div>

      {/* Manager Email */}
      {empData.role === "Employee" && (
        <FormControl fullWidth>
          <InputLabel sx={{ backgroundColor: "white", paddingX: "4px" }}>Manager Email</InputLabel>
          <Select 
            value={selectedManager || empData.managerEmail} 
            onChange={handleManagerChange}
          >
            <MenuItem value="">All Managers</MenuItem>
            {managers.map((manager) => (
              <MenuItem key={manager._id} value={manager.email}>
                {manager.empname} ({manager.email})
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}

      {/* ✅ Project Dropdown for Manager */}
      {empData.role === "Manager" && (
  <FormControl fullWidth>
    <InputLabel sx={{ backgroundColor: "white", paddingX: "4px" }}>
      Project
    </InputLabel>
    <Select
      value={empData.project || ""}
      onChange={(e) =>
        setEmpData({ ...empData, project: e.target.value })
      }
    >
      {projects.length > 0 ? (
        projects.map((project) => (
          <MenuItem
            key={project._id}
            value={project.projectName.toLowerCase()} // ✅ Store in lowercase
          >
            {toCamelCase(project.projectName)} {/* ✅ Display in camel case */}
          </MenuItem>
        ))
      ) : (
        <MenuItem disabled>No projects available</MenuItem>
      )}
    </Select>
  </FormControl>
)}


      <div style={{ display: "flex", justifyContent: "center", gap: "16px", marginTop: "20px" }}>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={() => handleSave1(editingRow)}
        >
          Update Employee
        </Button>
        <Button onClick={handleCancel} style={{ marginRight: "8px" }}>
          Cancel
        </Button>
      </div>
    </div>
  </div>
)}



<div className="employee-container">
  <table className="holiday-table">
    <thead>
      <tr>
        <th>Employee ID</th>
        <th>Name</th>
        <th>Email</th>
        <th>Role</th>
        <th>Project</th>
        <th>Is Active</th>
        <th>Manager Name</th>
        <th>Manager Email</th>
        <th>Actions</th>
      </tr>
    </thead>
    <tbody>
      {currentEmployees.length > 0 ? (
        currentEmployees
        .filter(emp => emp.email !== "dummy@gmail.com")
        .map((emp) => (
          <tr key={emp._id} className="employee-row">
            <td>{emp.empid}</td>
            <td>{emp.empname.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase())}</td>
            <td>{emp.email}</td>
            <td>{emp.role}</td>
     
            <td>{emp.project.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase())}</td>


            <td style={{ color: !emp.isActive ? "red" : "green" }}>
              {emp.isActive ? "Yes" : "No"}
            </td>
            <td> {emp.role === "Employee"
    ? emp.managerEmail === "dummy@gmail.com"
      ? "Not Assigned"
      : emp.managerName || "-"
    : emp.managerName || "-"}</td>
            <td>
  {emp.role === "Employee"
    ? emp.managerEmail === "dummy@gmail.com"
      ? "Not Assigned"
      : emp.managerEmail || "-"
    : emp.managerEmail || "-"}
</td>
            <td>
              <button
                onClick={() => handleEditEmployee(emp._id)}
                style={{ border: "none", background: "none", cursor: "pointer" }}
              >
                <FaEdit className="edit-icon" size={20} color="blue" />
              </button>
              <button
                onClick={() => handleDeactivateEmployee(emp._id)}
                disabled={!emp.isActive}
                style={{ border: "none", background: "none", cursor: emp.isActive ? "pointer" : "not-allowed", opacity: emp.isActive ? 1 : 0.2 }}
              >
                <FaTrash className="del-icon" size={20} color="red" />
              </button>
            </td>
          </tr>
        ))
      ) : (
        <tr>
          <td colSpan="9">No Employees Available</td>
        </tr>
      )}
    </tbody>
  </table>
</div>


      <Stack spacing={2} sx={{ mt: 2, display: "flex", alignItems: "center" }}>
        <Pagination
          count={Math.ceil(filteredEmployees.length / employeesPerPage)}
          page={currentPage}
          onChange={handlePageChange}
          color="primary"
        />
      </Stack>

    
    </div>
  );
};

export default TotalEmployees;
