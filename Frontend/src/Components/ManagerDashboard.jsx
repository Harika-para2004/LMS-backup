import { useState } from "react";
import { Box, Button, Stack } from "@mui/material";
import ManagerAnalytics from "./EmployeeDashboard";
import Reports from "./Reports";
import EmployeeAnalytics from "./EmployeeDashboard";
import EmployeesUnderManager from "./EmployeesUnderManager";
import { useManagerContext } from "../context/ManagerContext";

const ManagerDashboard = () => {
  const {
        email, 
        userData, setUserData,
        error, setError,
        navigate,
        showToast
  } = useManagerContext();

  const [selectedTab, setSelectedTab] = useState(1);
  return (
    <Box sx={{ width: "100%", typography: "body1", p: 2 }}>
      {/* Tabs Navigation as Buttons */}
      <Stack direction="row" spacing={2} justifyContent="center" sx={{ mb: 3 }}>
      <Button
          variant={selectedTab === 1 ? "contained" : "outlined"}
          onClick={() => setSelectedTab(1)}
          sx={{
            backgroundColor:
              selectedTab === 1 ? "var(--deep-blue)" : "transparent",
            color: selectedTab === 1 ? "white" : "var(--deep-blue)",
            minWidth: "200px",
            "&:hover": {
              backgroundColor:
                selectedTab === 1 ? "var(--deep-blue)" : "rgba(0, 0, 255, 0.1)", // Slight hover effect
            },
          }}
        >
          Manager Analytics
        </Button>
        <Button
          variant={selectedTab === 2 ? "contained" : "outlined"}
          onClick={() => setSelectedTab(2)}
          sx={{
            backgroundColor:
              selectedTab === 2 ? "var(--deep-blue)" : "transparent",
            color: selectedTab === 2 ? "white" : "var(--deep-blue)",
            minWidth: "200px",
            "&:hover": {
              backgroundColor:
                selectedTab === 2 ? "var(--deep-blue)" : "rgba(0, 0, 255, 0.1)", // Slight hover effect
            },
          }}
        >
          Reports
        </Button>
        <Button
          variant={selectedTab === 3 ? "contained" : "outlined"}
          onClick={() => setSelectedTab(3)}
          sx={{
            backgroundColor:
              selectedTab === 3 ? "var(--deep-blue)" : "transparent",
            color: selectedTab === 3 ? "white" : "var(--deep-blue)",
            minWidth: "200px",
            "&:hover": {
              backgroundColor:
                selectedTab === 3 ? "var(--deep-blue)" : "rgba(0, 0, 255, 0.1)", // Slight hover effect
            },
          }}
        >
          Employee List
        </Button>
      </Stack>

      {/* Tab Content */}
      {selectedTab === 1 && <ManagerAnalytics email={email} />}
      {selectedTab === 2 && <Reports email={email} />}
      {selectedTab === 3 && <EmployeesUnderManager email={email} />}
    </Box>
  );
};

export default ManagerDashboard;
