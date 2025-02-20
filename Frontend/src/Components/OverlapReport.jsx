import React, { useState, useEffect } from "react";
import axios from "axios";
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, MenuItem, Select, FormControl, InputLabel, Typography } from "@mui/material";

const OverlapReport = () => {
  const [overlapReport, setOverlapReport] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState("");

  useEffect(() => {
    // Fetch available projects for selection
    const fetchProjects = async () => {
      try {
        const response = await axios.get("http://localhost:5001/admin/projects"); // Adjust based on your backend
        setProjects(response.data);
      } catch (error) {
        console.error("Error fetching projects:", error);
      }
    };
    fetchProjects();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      fetchOverlapReport(selectedProject);
    }
  }, [selectedProject]);

  const fetchOverlapReport = async (project) => {
    try {
      const response = await axios.get(`http://localhost:5001/admin/leaves/overlap-report?project=${project}`);
      setOverlapReport(response.data.overlapReport);
    } catch (error) {
      console.error("Error fetching overlap report:", error);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <Typography variant="h5" gutterBottom>Leave Overlap Report</Typography>

      <FormControl  style={{ margin: "20px",width:"50%" }}>
        <InputLabel>Select Project</InputLabel>
        <Select value={selectedProject} label="Select Project" onChange={(e) => setSelectedProject(e.target.value)}>
          {projects.map((project) => (
            <MenuItem key={project.id} value={project.name}>{project.name}</MenuItem>
          ))}
        </Select>
      </FormControl>

      <TableContainer component={Paper} size="small">
        <Table>
          <TableHead sx={{ backgroundColor: "var(--deep-blue) !important"  }} >
            <TableRow >
              <TableCell><b>Employee 1</b></TableCell>
              <TableCell><b>Employee 2</b></TableCell>
              <TableCell><b>Overlapped Start Date</b></TableCell>
              <TableCell><b>Overlapped End Date</b></TableCell>
              <TableCell><b>Leave Type</b></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {overlapReport.length > 0 ? (
              overlapReport.map((entry, index) => (
                <TableRow key={index}>
                  <TableCell>{entry.employee1}</TableCell>
                  <TableCell>{entry.employee2}</TableCell>
                  <TableCell>{new Date(entry.overlappedStart).toLocaleDateString()}</TableCell>
                  <TableCell>{new Date(entry.overlappedEnd).toLocaleDateString()}</TableCell>
                  <TableCell>{entry.leaveType}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} align="center">No overlapping leaves found</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  );
};

export default OverlapReport;
