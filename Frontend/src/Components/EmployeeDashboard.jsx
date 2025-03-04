import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useEffect, useState, useMemo } from "react";
import {
  Grid,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
} from "@mui/material";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useManagerContext } from "../context/ManagerContext";
import LeaveStatusChart from "./LeaveStatusChart";
import LeaveBalanceChart from "./LeaveBalanceChart";
import LeaveTrendChart from "./LeaveTrendChart";

const EmployeeDashboard = () => {
  const { email: contextEmail } = useManagerContext();
  const { managerEmail, email: paramEmail } = useParams(); // Access both params
  const location = useLocation();
  const [userData, setUserData] = useState(location.state?.userData || {});
  const [email, setEmail] = useState(userData?.email);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    if (paramEmail) {
      setEmail(paramEmail);
    } else if (contextEmail) {
      setEmail(contextEmail);
    }
  }, [contextEmail, paramEmail]);

  const navigate = useNavigate();

  const role = localStorage.getItem("role"); // Retrieve role from localStorage

  const handleBack = () => {

    if (role === "Manager") {
      navigate("/manager/analytics/employees");
    } else if (role === "Admin") {
      navigate(`/admin/analytics/${managerEmail}/employees`);
    }
  };

  console.log("mg1 email" ,email);
  console.log("mg2 email" ,paramEmail);
  console.log("mg3 email" ,contextEmail);
  console.log("mg4 email" ,userData?.email);





  const yearsRange = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 15 }, (_, i) => currentYear + 1 - i);
  }, []);

  return (
    <Grid container direction="column" sx={{ p: 3 }}>
      {/* Year Selection - Styled Officially */}
      <Grid container justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>

        { !location.pathname.includes("/analytics") && (role === "Manager" || role === "Admin") &&   <Button
          variant="contained"
          color="primary"
          startIcon={<ArrowBackIcon />}
          onClick={handleBack}
          sx={{
            textTransform: "none",
            fontSize: "1rem",
            fontWeight: 500,
            borderRadius: 2,
            px: 3,
            py: 1,
            bgcolor: "#1976d2",
            "&:hover": { bgcolor: "#1565c0" },
          }}
        >
          Back
        </Button>}

        <FormControl sx={{ minWidth: 150 }}>
          <InputLabel>Select Year</InputLabel>
          <Select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            label="Select Year"
            sx={{
              fontSize: "1rem",
              fontWeight: 500,
              textAlign: "center",
              bgcolor: "#f5f5f5",
              borderRadius: 2,
            }}
          >
            {yearsRange.map((year) => (
              <MenuItem key={year} value={year}>
                {year}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>

      {/* Leave Charts */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <LeaveStatusChart email={email} year={selectedYear} />
        </Grid>
        <Grid item xs={12} md={6}>
          <LeaveTrendChart email={email} year={selectedYear} />
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mt: 3 }}>
        <Grid item xs={12}>
          <LeaveBalanceChart email={email} year={selectedYear} />
        </Grid>
      </Grid>
    </Grid>
  );
};

export default EmployeeDashboard;