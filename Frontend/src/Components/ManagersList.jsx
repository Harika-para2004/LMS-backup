import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Paper,
  Box,
  Typography,
} from "@mui/material";
import DashboardIcon from "@mui/icons-material/Dashboard";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const ManagersList = () => {
  const [employees, setEmployees] = useState([]);
  const navigate = useNavigate();

  const formatCase = (text) => {
    return text.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
  };

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const response = await axios.get("http://localhost:5001/managers-list");
        setEmployees(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error("Error fetching employees:", error);
        setEmployees([]);
      }
    };

    fetchEmployees();
  }, []);
  // console.log("employees",employees);

  return (
    <Box>
      {/* <Typography variant="h6" gutterBottom>
          Managers List
        </Typography> */}
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ backgroundColor: "var(--deep-blue)" }}>
              <TableCell sx={{ fontWeight: "bold", color: "#fff" }}>
                Employee ID
              </TableCell>
              <TableCell sx={{ fontWeight: "bold", color: "#fff" }}>
                Name
              </TableCell>
              <TableCell sx={{ fontWeight: "bold", color: "#fff" }}>
                Project
              </TableCell>
              <TableCell sx={{ fontWeight: "bold", color: "#fff" }}>
                Gender
              </TableCell>
              <TableCell sx={{ fontWeight: "bold", color: "#fff" }}>
                Is Active
              </TableCell>
              <TableCell sx={{ fontWeight: "bold", color: "#fff" }}>
                Dashboard
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {employees.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} align="center">
                No employees available
              </TableCell>
            </TableRow>
          ) : ([...employees]
              .filter((emp) => emp.email.toLowerCase() !== "dummy@gmail.com" && emp.isActive)
              .sort((a, b) =>
                a.empid.localeCompare(b.empid, undefined, { numeric: true })
              )
              .map((emp) => (
                <TableRow key={emp.empid}>
                  <TableCell>{emp.empid}</TableCell>
                  <TableCell>{formatCase(emp.empname)}</TableCell>
                  <TableCell>{emp.project ? formatCase(emp.project) : "-"}</TableCell>
                  <TableCell>{formatCase(emp.gender)}</TableCell>
                  <TableCell style={{ color: !emp.isActive ? "red" : "green" }}>
                    {emp.isActive ? "Yes" : "No"}
                  </TableCell>
                  <TableCell>
                    <IconButton
                      onClick={() => {
                        navigate(`/admin/analytics/${emp.email}`);
                      }}
                    >
                      <DashboardIcon color="primary" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              )))}
          </TableBody>
        </Table>
      </TableContainer>
      <Typography
        sx={{
          fontSize: "1.2rem",
          fontWeight: "bold",
          color: "red",
          textAlign: "center",
          mt: 2,
        }}
      >
        Inactive Employees
      </Typography>
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ backgroundColor: "var(--deep-blue)" }}>
              <TableCell sx={{ fontWeight: "bold", color: "#fff" }}>
                Employee ID
              </TableCell>
              <TableCell sx={{ fontWeight: "bold", color: "#fff" }}>
                Name
              </TableCell>
              <TableCell sx={{ fontWeight: "bold", color: "#fff" }}>
                Project
              </TableCell>
              <TableCell sx={{ fontWeight: "bold", color: "#fff" }}>
                Gender
              </TableCell>
              <TableCell sx={{ fontWeight: "bold", color: "#fff" }}>
                Is Active
              </TableCell>
              <TableCell sx={{ fontWeight: "bold", color: "#fff" }}>
                Dashboard
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {[...employees]
              .filter((emp) => emp.email.toLowerCase() === "dummy@gmail.com")
              .map((emp) => (
                <TableRow key={emp.empid }>
                  <TableCell>{emp.empid || "N/A"}</TableCell>
                  <TableCell>{formatCase(emp.empname)}</TableCell>
                  <TableCell>{emp.project || "N/A"}</TableCell>
                  <TableCell>{emp.gender || "N/A"}</TableCell>
                  <TableCell style={{ color: !emp.isActive ? "red" : "green" }}>
                    {emp.isActive ? "Yes" : "No"}
                  </TableCell>
                  <TableCell>
                    <IconButton
                      onClick={() => {
                        navigate(`/admin/analytics/${emp.email}`);
                      }}
                    >
                      <DashboardIcon color="primary" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default ManagersList;