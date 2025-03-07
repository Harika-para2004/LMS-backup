import { useLocation, useNavigate, Outlet, useParams } from "react-router-dom";
import { Box, Button, Stack } from "@mui/material";
import { useManagerContext } from "../context/ManagerContext";
import { useEffect, useState } from "react";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

const AdminToManager = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { email: paramEmail } = useParams();
  const { email: contextEmail } = useManagerContext(); // role will be "admin"  
  const [email, setEmail] = useState(paramEmail || contextEmail);
  console.log("admin email",email)

  const role = localStorage.getItem("role");

  useEffect(() => {
    if (!email) {
      navigate("/");
    }
  }, [email, navigate]);

  const handleBack = () => {

    if (role === "Admin") {
      navigate("/admin/all-reports/managers");
    } 
  };

  return (
    <Box sx={{ width: "100%", typography: "body1", p: 2 }}>
      {/* Navigation Buttons */}
      {    
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
        //  background: "linear-gradient(135deg, #9F32B2 0%, #6A1B9A 100%)", // Elegant gradient
         color: "white",
        //  "&:hover": {
        //   //  background: "transparent",
        //     //  "linear-gradient(135deg, #83289A 0%, #5A1780 100%)", // Slightly darker hover effect
        //  },
        //  boxShadow: "0px 3px 6px rgba(159, 50, 178, 0.3)", // Subtle glow effect
         transition: "all 0.3s ease-in-out", // Smooth animation
       }}
     >
       Back
     </Button>
        }
      <Stack direction="row" spacing={2} justifyContent="center" sx={{ mb: 3 }}>
        <Button
          variant={location.pathname.includes(`/admin/analytics/${email}/self`) ? "contained" : "outlined"}
          onClick={() => navigate(`/admin/analytics/${email}/self`)}
          sx={{
            backgroundColor:
            [`/admin/analytics`,`/admin/analytics/${email}/self`].some(path => location.pathname.includes(path)) && !location.pathname.includes("/reports") &&  !location.pathname.includes("/employees") ? "var(--deep-blue)" : "transparent",
            color:  [`/admin/analytics`,`/admin/analytics/${email}/self`].some(path => location.pathname.includes(path)) && !location.pathname.includes("/reports")  && !location.pathname.includes("/employees") ? "white" : "var(--deep-blue)",
            //location.pathname.includes(`/admin/analytics/${email}/self`) ? "var(--deep-blue)" : "transparent",
            //color: location.pathname.includes(`/admin/analytics/${email}/self`) ? "white" : "var(--deep-blue)",
            minWidth: "200px",
            textTransform:"none",
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
            textTransform:"none",
          }}
        >
          Reports
        </Button>
        <Button
          variant={location.pathname.includes(`/admin/analytics/${email}/employees`) ? "contained" : "outlined"}
          onClick={() => 
            navigate(email === "dummy@gmail.com" 
              ? `/admin/analytics/${email}/inactive-employees` 
              : `/admin/analytics/${email}/employees`
            )
          }          sx={{
            backgroundColor: location.pathname.includes(`/admin/analytics/${email}/employees`) ? "var(--deep-blue)" : "transparent",
            color: location.pathname.includes(`/admin/analytics/${email}/employees`) ? "white" : "var(--deep-blue)",
            minWidth: "200px",
            textTransform:"none",
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