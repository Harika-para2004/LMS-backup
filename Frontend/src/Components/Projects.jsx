import { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, TextField } from "@mui/material";
import { IconButton } from "@mui/material";
import {Add, Edit, Delete,Close } from "@mui/icons-material";
const BASE_URL = "http://localhost:5001/api"; // Adjust as needed
import { useRef } from "react";


const ProjectManager = () => {
  const [projects, setProjects] = useState([]);
  const editFormRef = useRef(null);
  const [projectName, setProjectName] = useState("");
  const [managerEmail, setManagerEmail] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await fetch(`${BASE_URL}/projects`);
      const data = await response.json();
      setProjects(data);
    } catch (error) {
      console.error("Error fetching projects:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!projectName || !managerEmail) {
      setError("Both fields are required.");
      return;
    }

    try {
      const method = editingId ? "PUT" : "POST";
      const url = editingId ? `${BASE_URL}/projects/${editingId}` : `${BASE_URL}/projects`;

      const response = await fetch(url, {
        method,
        body: JSON.stringify({ projectName, managerEmail }),
        headers: { "Content-Type": "application/json" },
      });
      const data = await response.json(); // Convert response to JSON
// ✅ Store the updated user in localStorage
if (data.updatedUser) {
  localStorage.setItem("userData", JSON.stringify(data.updatedUser));
  console.log("Updated User Data:", data.updatedUser);
}

      if (!response.ok) {
        alert(data.message || "Failed to save project.");
      }
  

      fetchProjects();
      setProjectName("");
      setManagerEmail("");
      setEditingId(null);
      setError("");
      setShowForm(false);
    } catch (error) {
      console.error("Error saving project:", error);
    }
  };

  const handleDelete = async (id) => {
    try {
      await fetch(`${BASE_URL}/projects/${id}`, { method: "DELETE" });
      fetchProjects();
    } catch (error) {
      console.error("Error deleting project:", error);
    }
  };

  const handleEdit = (project) => {
    setTimeout(() => {
      if (editFormRef.current) {
        editFormRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 100);
    setProjectName(project.projectName);
    setManagerEmail(project.managerEmail);
    setEditingId(project._id);
    setShowForm(true);
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2>Projects & Managers</h2>
        <Button
  variant="contained"
  style={{ marginTop: "20px", backgroundColor: 'var(--deep-blue)', color: "white" }}
  onClick={() => {
    setShowForm(!showForm);
    if (!showForm) {
      setProjectName(""); // Clear project name
      setManagerEmail(""); // Clear manager email
      setEditingId(null); // Reset editing state
    }
  }}
  startIcon={showForm ? <Close /> : <Add />} // Add for "Add Project", Close for "Cancel"
>
  {showForm ? "Cancel" : "Add Project"}
</Button>


      </div>

      {showForm && (
        <div     ref={editFormRef} // Attach ref here
        style={{ display: "flex", justifyContent: "center", alignItems: "center", marginTop: "20px" }}>
          <form
            onSubmit={handleSubmit}
            style={{
              width: "400px",
              padding: "20px",
              borderRadius: "10px",
              boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.2)",
              backgroundColor: "#fff",
              display: "flex",
              flexDirection: "column",
              gap: "15px",
            }}
          >
            <TextField
              label="Project Name"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              required
              fullWidth
              margin="normal"
            />
            <TextField
              label="Manager Email"
              value={managerEmail}
              onChange={(e) => setManagerEmail(e.target.value)}
              required
              fullWidth
              margin="normal"
            />
            <Button type="submit" variant="contained" color="primary"  style={{ backgroundColor: 'var(--deep-blue)', color: "white" }}>
              {editingId ? "Update" : "Add"}
            </Button>
          </form>
        </div>
      )}

      {error && <p style={{ color: "red" }}>{error}</p>}
        <TableContainer component={Paper} style={{ marginTop: "20px" }}>
  <Table>
    <TableHead>
      <TableRow sx={{ "& th": { padding: "6px 10px" } }}> {/* Reduce padding */}
        <TableCell>Project Name</TableCell>
        <TableCell>Manager Email</TableCell>
        <TableCell>Actions</TableCell>
      </TableRow>
    </TableHead>
    <TableBody>
      {projects.map((project) => (
        <TableRow key={project._id} sx={{ "& td": { padding: "6px 10px" } }}> {/* Reduce padding */}
          <TableCell>{project.projectName}</TableCell>
          <TableCell>{project.managerEmail}</TableCell>
          <TableCell>
            <IconButton color="primary" onClick={() => handleEdit(project)}>
              <Edit />
            </IconButton>
            <IconButton color="error" onClick={() => handleDelete(project._id)}>
              <Delete />
            </IconButton>
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
</TableContainer>

    </div>
  );
};

export default ProjectManager;