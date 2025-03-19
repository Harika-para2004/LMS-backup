import { useState, useEffect, useRef } from "react";
import {
  Grid,
  Card,
  CardContent,
  Typography,
  IconButton,
  Button,
  TextField,
  Tooltip,
} from "@mui/material";
import { Add, Edit, Delete, Close } from "@mui/icons-material";
import { useManagerContext } from "../context/ManagerContext";

const BASE_URL = "http://localhost:5001/api";

const ProjectManager = () => {
  const [projects, setProjects] = useState([]);
  const { showToast } = useManagerContext();
  const editFormRef = useRef(null);
  const [projectName, setProjectName] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);

  const formatCase = (text) => {
    return text.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
  };

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
    if (!projectName) {
      setError("Project Name is required.");
      return;
    }
  
    try {
      const method = editingId ? "PUT" : "POST";
      const url = editingId ? `${BASE_URL}/projects/${editingId}` : `${BASE_URL}/projects`;
  
      const response = await fetch(url, {
        method,
        body: JSON.stringify({ projectName }),
        headers: { "Content-Type": "application/json" },
      });
  
      const data = await response.json();
  
      if (!response.ok) {
        if (response.status === 400 && data.message === "Project") {
          showToast("Project already exists.","warning");
        } else {
          showToast(data.message || "Failed to save project.");
        }
        return;
      }
  
      fetchProjects();
      setProjectName("");
      setEditingId(null);
      setError("");
      setShowForm(false);
    } catch (error) {
      console.error("Error saving project:", error);
    }
  };
  

  // const handleDelete = async (id) => {
  //   try {
  //     await fetch(`${BASE_URL}/projects/${id}`, { method: "DELETE" });
  //     showToast("Project deleted successfully","success");
  //     fetchProjects();
  //   } catch (error) {
  //     console.error("Error deleting project:", error);
  //   }
  // };

  const handleDelete = async (id) => {
    try {
      const response = await fetch(`${BASE_URL}/projects/${id}`, { method: "DELETE" });
      const data = await response.json(); // Parse response JSON
  
      if (response.ok) {
        showToast(data.message, "success"); // Show success message
        fetchProjects(); // Refresh project list
      } else {
        showToast(data.message, "error"); // Show error message from backend
      }
    } catch (error) {
      showToast("An error occurred while deleting the project.", "error"); // Handle unexpected errors
    }
  };
  

  const handleEdit = (project) => {
    setTimeout(() => {
      if (editFormRef.current) {
        editFormRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 100);
    setProjectName(project.projectName);
    setEditingId(project._id);
    setShowForm(true);
  };

  return (
    <div
      style={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "20px",
        height: "700px",
        overflow: "auto"
      }}
    >
      <div className="header">
          <h2 className="content-heading">Projects</h2>
          <Button
        variant="contained"
        style={{ backgroundColor: 'var(--deep-blue)', color: "white" }}
        onClick={() => {
          setShowForm(!showForm);
          if (!showForm) {
            setProjectName("");
            setEditingId(null);
          }
        }}
        startIcon={showForm ? <Close /> : <Add />}
      >
        {showForm ? "Cancel" : "Add Project"}
      </Button>
        </div>



      {showForm && (
        <form
          ref={editFormRef}
          onSubmit={handleSubmit}
          style={{
            width: "100%",
            backgroundColor: "#ffffff",
            borderRadius: "10px",
            padding: "15px",
            boxShadow: "0 2px 10px rgba(0, 0, 0, 0.1)",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            marginBottom: "10px",
          }}
        >
          <TextField
            label="Project Name"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            required
            fullWidth
          />
          <Button type="submit" variant="contained" color="primary">
            {editingId ? "Update" : "Add"}
          </Button>
        </form>
      )}

<Grid container spacing={2} style={{ maxWidth: "100%" }}>
  {projects.length > 0 ? (
    projects.map((project) => (
      <Grid item xs={12} sm={12} md={12} lg={12} key={project._id}>
        <Card
          style={{
            backgroundColor: "#f9f9f9",
            borderRadius: "10px",
            boxShadow: "0 2px 10px rgba(0, 0, 0, 0.1)",
            padding: "5px 10px",
          }}
        >
          <CardContent
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "5px 10px",
            }}
          >
           <Tooltip title={project.projectName}>
  <Typography
    variant="body1"
    style={{
      fontWeight: "bold",
      fontSize: "14px",
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis",
    }}
  >
   {project.projectName.length > 15
  ? project.projectName.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase()).slice(0, 15) + "..."
  : project.projectName.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase())
   }
  </Typography>
</Tooltip>

            <div>
              <Tooltip title="Edit">
                <IconButton onClick={() => handleEdit(project)} size="small">
                  <Edit color="primary" fontSize="small" />
                </IconButton>
              </Tooltip>

              <Tooltip title="Delete">
                <IconButton onClick={() => handleDelete(project._id)} size="small">
                  <Delete color="error" fontSize="small" />
                </IconButton>
              </Tooltip>
            </div>
          </CardContent>
        </Card>
      </Grid>
    ))
  ) : (
    <Typography variant="body1">No projects available</Typography>
  )}
</Grid>
    </div>
  );
};

export default ProjectManager;