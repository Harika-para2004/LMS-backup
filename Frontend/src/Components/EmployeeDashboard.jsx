import { useEffect, useState, useMemo } from "react";
import { Grid, Typography, Select, MenuItem, FormControl, InputLabel } from "@mui/material";
import { useLocation, useParams } from "react-router-dom";
import { useManagerContext } from "../context/ManagerContext";
import LeaveStatusChart from "./LeaveStatusChart";
import LeaveBalanceChart from "./LeaveBalanceChart";
import LeaveTrendChart from "./LeaveTrendChart";

const EmployeeDashboard = () => {
  const { email: contextEmail } = useManagerContext();
  const { email: paramEmail } = useParams();
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

  const yearsRange = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 15 }, (_, i) => currentYear + 1 - i);
  }, []);

  return (
    <Grid container direction="column" sx={{ p: 3 }}>
      {/* Year Selection - Styled Officially */}
      <Grid container justifyContent="center" sx={{ mb: 3 }}>
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
