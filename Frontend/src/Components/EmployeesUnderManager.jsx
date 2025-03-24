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
// import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useManagerContext } from "../context/ManagerContext";
import { useLocation, useNavigate, useParams } from "react-router-dom";
const backendUrl = import.meta.env.VITE_BACKEND_URL;

const EmployeesUnderManager = () => {
  const { email: contextEmail, role } = useManagerContext(); // Role helps differentiate
  const { email: paramEmail } = useParams(); // Email from URL (if manager clicks)
  const navigate = useNavigate();

  const location = useLocation();
  const [userData, setUserData] = useState(location.state?.userData || {});

  const [email, setEmail] = useState(userData?.email);

  const formatCase = (text) => {
    return text.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
  };

  useEffect(() => {
    // CASE 1: If manager navigates, use paramEmail
    if (paramEmail) {
      setEmail(paramEmail);
    }
    // CASE 2: If employee logs in, use contextEmail
    else if (contextEmail) {
      setEmail(contextEmail);
    }
    // CASE 3: If no email found (e.g., direct URL access without login), redirect to login
    else {
      navigate("/login");
    }
  }, [contextEmail, paramEmail, navigate]);


  const [employees, setEmployees] = useState([]);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const response = await axios.get(
          `${backendUrl}/api/employees?managerEmail=${email}`
        );
        setEmployees(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error("Error fetching employees:", error);
        setEmployees([]);
      }
    };

    if (email) {
      fetchEmployees();
    }
  }, [email]);

  return (
    <Box p={2}>
      {/* <Typography variant="h6" gutterBottom>
        Employees List
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
              .filter(
                (emp) =>
                  emp.email.toLowerCase() !== "dummy@gmail.com" && emp.isActive
              )
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
                        navigate(`/manager/dashboard/${emp.email}`);
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
    </Box>
  );
};

export default EmployeesUnderManager;