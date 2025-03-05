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

const EmployeesUnderManager = () => {
  const { email: contextEmail, role } = useManagerContext(); // Role helps differentiate
  const { email: paramEmail } = useParams(); // Email from URL (if manager clicks)
  const navigate = useNavigate();

  const location = useLocation();
  const [userData, setUserData] = useState(location.state?.userData || {});

  const [email, setEmail] = useState(userData?.email);

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

  console.log("location", location);
  console.log("dash email", email);

  console.log("email in emp dash",email);
  console.log("role",userData.role );

  const [employees, setEmployees] = useState([]);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const response = await axios.get(
          `http://localhost:5001/api/employees?managerEmail=${email}`
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
              <TableCell sx={{ fontWeight: "bold", color: "#fff" }}>Name</TableCell>
              <TableCell sx={{ fontWeight: "bold", color: "#fff" }}>Project</TableCell>
              <TableCell sx={{ fontWeight: "bold", color: "#fff" }}>Gender</TableCell>
              <TableCell sx={{ fontWeight: "bold", color: "#fff" }}>Dashboard</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {employees.map((emp) => (
              <TableRow key={emp.empid}>
                <TableCell>{emp.empid}</TableCell>
                <TableCell>{emp.empname}</TableCell>
                <TableCell>{emp.project}</TableCell>
                <TableCell>{emp.gender}</TableCell>
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
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default EmployeesUnderManager;
