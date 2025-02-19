import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { IconButton } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useEffect, useState } from "react";

const DashboardLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [previousPage, setPreviousPage] = useState(null);

  // useEffect(() => {
  //   setPreviousPage(sessionStorage.getItem("previousPage"));
  // }, []);

  const handleBack = () => {
      // sessionStorage.setItem("previousPage", "reports");
      navigate("/manager");
      // sessionStorage.removeItem("previousPage"); // Clear after navigating
    
  };

  return (
    <div className="dashboard-container">
      <div className="content">
          <IconButton
            onClick={handleBack}
            sx={{ position: "absolute", top: 10, left: 10 }}
          >
            <ArrowBackIcon />
          </IconButton>

        <div className="main-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;
