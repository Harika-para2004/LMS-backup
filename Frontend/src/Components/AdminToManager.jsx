import { useLocation, useNavigate, Outlet, useParams } from "react-router-dom";
import { Box, Button, Stack } from "@mui/material";
import { useManagerContext } from "../context/ManagerContext";
import { useEffect, useState } from "react";

const AdminToManager = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { email: paramEmail } = useParams();
  const { email: contextEmail, role } = useManagerContext(); // role will be "admin"

  const [email, setEmail] = useState(paramEmail || contextEmail);
  console.log("admin email",email)
  useEffect(() => {
    if (!email) {
      navigate("/login");
    }
  }, [email, navigate]);

  return (
    <Box sx={{ width: "100%", typography: "body1", p: 2 }}>
      {/* Navigation Buttons */}
      <Stack direction="row" spacing={2} justifyContent="center" sx={{ mb: 3 }}>
        <Button
          variant={location.pathname.includes(`/admin/analytics/${email}/self`) ? "contained" : "outlined"}
          onClick={() => navigate(`/admin/analytics/${email}/self`)}
          sx={{
            backgroundColor: location.pathname.includes(`/admin/analytics/${email}/self`) ? "var(--deep-blue)" : "transparent",
            color: location.pathname.includes(`/admin/analytics/${email}/self`) ? "white" : "var(--deep-blue)",
            minWidth: "200px",
          }}
        >
          Personal Dashboard
        </Button>
        <Button
          variant={location.pathname.includes(`/analytics/${email}/reports`) ? "contained" : "outlined"}
          onClick={() => navigate(`/admin/analytics/${email}/reports`)}
          sx={{
            backgroundColor: location.pathname.includes(`/analytics/${email}/reports`) ? "var(--deep-blue)" : "transparent",
            color: location.pathname.includes(`/analytics/${email}/reports`) ? "white" : "var(--deep-blue)",
            minWidth: "200px",
          }}
        >
          Reports
        </Button>
        <Button
          variant={location.pathname.includes(`/admin/analytics/${email}/employees`) ? "contained" : "outlined"}
          onClick={() => navigate(`/admin/analytics/${email}/employees`)}
          sx={{
            backgroundColor: location.pathname.includes(`/admin/analytics/${email}/employees`) ? "var(--deep-blue)" : "transparent",
            color: location.pathname.includes(`/admin/analytics/${email}/employees`) ? "white" : "var(--deep-blue)",
            minWidth: "200px",
          }}
        >
          Employee Dashboards
        </Button>
      </Stack>

      {/* Renders the nested routes */}
      <Outlet />
    </Box>
  );
};

export default AdminToManager;
