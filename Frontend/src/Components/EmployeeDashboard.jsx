//Employee Dashboard

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
  Box,
} from "@mui/material";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useManagerContext } from "../context/ManagerContext";
import LeaveStatusChart from "./LeaveStatusChart";
import LeaveBalanceChart from "./LeaveBalanceChart";
import LeaveTrendChart from "./LeaveTrendChart";
import TotalLeaveSummary from "./TotalLeaveSummary";
const EmployeeDashboard = () => {
  const { email: contextEmail ,gender,setGender} = useManagerContext();
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
    } else if (role === "Admin" && managerEmail !== "dummy@gmail.com") {
      navigate(`/admin/analytics/${managerEmail}/employees`);
    } else if (managerEmail === "dummy@gmail.com") {
      navigate(`/admin/analytics/${managerEmail}/inactive-employees`);
    }
  };

  // console.log("mg1 email", email);
  // console.log("mg2 email", paramEmail);
  // console.log("mg3 email", contextEmail);
  // console.log("mg4 email", userData?.email);

  const yearsRange = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 15 }, (_, i) => currentYear + 1 - i);
  }, []);

  return (
    <Grid container direction="column" sx={{ p: 3 }}>
      {/* Year Selection - Styled Officially */}
      <Grid container justifyContent="space-between" alignItems="center">
        {!location.pathname.includes("/analytics") &&
          (role === "Manager" || role === "Admin") && (
            <Button
              variant="contained"
              startIcon={
                <ArrowBackIcon sx={{ fontSize: 18, color: "white" }} />
              }
              onClick={handleBack}
              sx={{
                textTransform: "none",
                fontSize: "13px",
                fontWeight: 500,
                borderRadius: "8px",
                height: 36,
                minWidth: 100,
                px: 2,
                background: "linear-gradient(135deg, #9F32B2 0%, #6A1B9A 100%)", // Elegant gradient
                color: "white",
                "&:hover": {
                  background:
                    "linear-gradient(135deg, #83289A 0%, #5A1780 100%)", // Slightly darker hover effect
                },
                boxShadow: "0px 3px 6px rgba(159, 50, 178, 0.3)", // Subtle glow effect
                transition: "all 0.3s ease-in-out", // Smooth animation
              }}
            >
              Back
            </Button>
          )}

        <Typography variant="h6" fontWeight={500} color="textSecondary">
          Leave details for the selected year
        </Typography>

        <FormControl
          sx={{
            minWidth: 85,
            bgcolor: "white",
            borderRadius: 1,
            mb: 1,
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
              height: 36, // Slightly reduced height for compact look
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
      </Grid>

      {/* Leave Charts */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={7}>
          <LeaveTrendChart email={email} year={selectedYear} />
        </Grid>
        <Grid
          item
          xs={12}
          md={5}
        >
            <TotalLeaveSummary email={email} year={selectedYear}/>
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mt: 3 }}>
        <Grid
          item
          xs={12}
          md={6}
        >
            <LeaveStatusChart email={email} year={selectedYear} />
        </Grid>
        <Grid
          item
          xs={12}
          md={6}
        >
            <LeaveBalanceChart email={email} year={selectedYear} gender={gender}/>
        </Grid>
       
      </Grid>
     
    </Grid>
  );
};

export default EmployeeDashboard;
