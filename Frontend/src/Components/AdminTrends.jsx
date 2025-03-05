// import { useState } from "react";
// import { Box, Button, Stack } from "@mui/material";

// import ManagersList from "./ManagersList";
// import ReportsAdmin from "./ReportsAdmin";

// const AdminTrends = ({ email }) => {
//   const [selectedTab, setSelectedTab] = useState(1);
//   return (
//     <Box sx={{ width: "100%", typography: "body1", p: 2 }}>
//       {/* Tabs Navigation as Buttons */}
//       <Stack direction="row" spacing={2} justifyContent="center" sx={{ mb: 3 }}>
//       <Button
//           variant={selectedTab === 1 ? "contained" : "outlined"}
//           onClick={() => setSelectedTab(1)}
//           sx={{
//             backgroundColor:
//               selectedTab === 1 ? "var(--deep-blue)" : "transparent",
//             color: selectedTab === 1 ? "white" : "var(--deep-blue)",
//             minWidth: "200px",
//             "&:hover": {
//               backgroundColor:
//                 selectedTab === 1 ? "var(--deep-blue)" : "rgba(0, 0, 255, 0.1)", // Slight hover effect
//             },
//           }}
//         >
//           Manager List
//         </Button>
//         <Button
//           variant={selectedTab === 2 ? "contained" : "outlined"}
//           onClick={() => setSelectedTab(2)}
//           sx={{
//             backgroundColor:
//               selectedTab === 2 ? "var(--deep-blue)" : "transparent",
//             color: selectedTab === 2 ? "white" : "var(--deep-blue)",
//             minWidth: "200px",
//             "&:hover": {
//               backgroundColor:
//                 selectedTab === 2 ? "var(--deep-blue)" : "rgba(0, 0, 255, 0.1)", // Slight hover effect
//             },
//           }}
//         >
//           Reports
//         </Button>
        
//       </Stack>

//       {/* Tab Content */}
//       {selectedTab === 1 && <ManagersList email={email} />}
//       {selectedTab === 2 && <ReportsAdmin email={email} />}
//       {/* {selectedTab === 3 && <EmployeesUnderManager email={email} />} */}
//     </Box>
//   );
// };

// export default AdminTrends;


import { useLocation, useNavigate, Outlet } from "react-router-dom";
import { Box, Button, Stack } from "@mui/material";

const ManagerDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  return (
    <Box sx={{ width: "100%", typography: "body1", p: 2 }}>
      {/* Navigation Tabs as Buttons */}
      <Stack direction="row" spacing={2} justifyContent="center" sx={{ mb: 3 }}>
        
        <Button
          variant={location.pathname.includes("/all-reports/reports") ? "contained" : "outlined"}
          onClick={() => navigate("/admin/all-reports/reports")}
          sx={{
            backgroundColor:
            ["/all-reports","/all-reports/reports"].some(path => location.pathname.includes(path)) && !location.pathname.includes("/managers") ? "var(--deep-blue)" : "transparent",
            color: ["/all-reports","/all-reports/reports"].some(path => location.pathname.includes(path)) && !location.pathname.includes("/managers")  ? "white" : "var(--deep-blue)",
            minWidth: "200px",
            textTransform:"none",
          }}
        >
          Reports
        </Button>
        <Button
          variant={location.pathname.includes("/all-reports/managers") ? "contained" : "outlined"}
          onClick={() => navigate("/admin/all-reports/managers")}
          sx={{
            backgroundColor:
            [ "/all-reports/managers"].some(path => location.pathname.includes(path)) && !location.pathname.includes("/reports") ? "var(--deep-blue)" : "transparent",
            color:  [ "/all-reports/managers"].some(path => location.pathname.includes(path)) && !location.pathname.includes("/reports") ? "white" : "var(--deep-blue)",
            minWidth: "200px",
            textTransform:"none",
          }}
        >
          Manager Dashboards
        </Button>
        
      </Stack>

      {/* Render the nested route components */}
      <Outlet />
    </Box>
  );
};

export default ManagerDashboard;
