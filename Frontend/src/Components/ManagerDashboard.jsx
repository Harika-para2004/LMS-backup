import { useLocation, useNavigate, Outlet, useParams } from "react-router-dom";
import { Box, Button, Stack } from "@mui/material";
import { useManagerContext } from "../context/ManagerContext";
import { useEffect, useState } from "react";

const ManagerDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const { email: contextEmail, role } = useManagerContext(); // Role helps differentiate
  const { email: paramEmail } = useParams(); // Email from URL (if manager clicks)
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

  const baseRoute = role.toLowerCase() === "manager" ? "/manager/analytics" : "/admin/analytics";

  return (
    <Box sx={{ width: "100%", typography: "body1", p: 2 }}>
      {/* Navigation Tabs as Buttons */}
      <Stack direction="row" spacing={2} justifyContent="center" sx={{ mb: 3 }}>
        <Button
          variant={location.pathname.includes(`${baseRoute}/self`) ? "contained" : "outlined"}
          onClick={() => navigate(`${baseRoute}/self`)}
          sx={{

            backgroundColor: 
            [`${baseRoute}/self`,`${baseRoute}`].some(path => location.pathname.includes(path)) && !location.pathname.includes("/reports") &&  !location.pathname.includes("/employees") ? "var(--deep-blue)" : "transparent",
            color:  [`${baseRoute}/self`,`${baseRoute}`].some(path => location.pathname.includes(path)) && !location.pathname.includes("/reports")  && !location.pathname.includes("/employees") ? "white" : "var(--deep-blue)",
            // location.pathname.includes(`${baseRoute}/self`) ? "var(--deep-blue)" : "transparent",
            // color: location.pathname.includes(`${baseRoute}/self`) ? "white" : "var(--deep-blue)",
            minWidth: "200px",
            textTransform:"none",
          }}
        >
          Personal Dashboard
        </Button>
        <Button
          variant={location.pathname.includes(`${baseRoute}/reports`) ? "contained" : "outlined"}
          onClick={() => navigate(`${baseRoute}/reports`)}
          sx={{
            backgroundColor: location.pathname.includes(`${baseRoute}/reports`) ? "var(--deep-blue)" : "transparent",
            color: location.pathname.includes(`${baseRoute}/reports`) ? "white" : "var(--deep-blue)",
            minWidth: "200px",
            textTransform:"none",
          }}
        >
          Reports
        </Button>
        <Button
          variant={location.pathname.includes(`${baseRoute}/employees`) ? "contained" : "outlined"}
          onClick={() => navigate(`${baseRoute}/employees`)}
          sx={{
            backgroundColor: location.pathname.includes(`${baseRoute}/employees`) ? "var(--deep-blue)" : "transparent",
            color: location.pathname.includes(`${baseRoute}/employees`) ? "white" : "var(--deep-blue)",
            minWidth: "200px",
            textTransform:"none",
          }}
        >
          Employee Dashboards
        </Button>
      </Stack>

      {/* Render the nested route components */}
      <Outlet />
    </Box>
  );
};

export default ManagerDashboard;