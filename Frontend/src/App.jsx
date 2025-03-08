// import React from "react";
// import { BrowserRouter, Routes, Route } from "react-router-dom";
// import { SnackbarProvider } from "notistack";
// import SignInPage from "./Components/Signin";
// import Employee from "./Components/Employee";
// import Manager from "./Components/Manager";
// import Admin from "./Components/Admin";
// import SessionExpired from "./Components/SessionExpired";
// import PrivateRoute from "./Components/PrivateRoute";
// import EmployeeDashboard from "./Components/EmployeeDashboard";
// import DashboardLayout from "./Components/DashboardLayout";

// function App() {
//   return (
//     <div className="App">
//       <BrowserRouter>
//         <SnackbarProvider maxSnack={5} autoHideDuration={3000}>
//           <Routes>
//             <Route path="/" element={<SignInPage />} />
//             <Route path="/session-expired" element={<SessionExpired />} />
//             <Route
//               path="/employee"
//               element={
//                 <PrivateRoute allowedRoles={["employee"]}>
//                   <Employee />
//                 </PrivateRoute>
//               }
//             />
//             <Route
//               path="/manager"
//               element={
//                 <PrivateRoute allowedRoles={["manager"]}>
//                   <Manager />
//                 </PrivateRoute>
//               }
//             />
//             <Route
//               path="/admin"
//               element={
//                 <PrivateRoute allowedRoles={["admin"]}>
//                   <Admin />
//                 </PrivateRoute>
//               }
//             />
//             <Route path="/employee-dashboard" element={<DashboardLayout />}>
//               <Route path=":email" element={<EmployeeDashboard />} />
//             </Route>
//           </Routes>
//         </SnackbarProvider>
//       </BrowserRouter>
//     </div>
//   );
// }

// export default App;

import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SnackbarProvider } from "notistack";
import PrivateRoute from "./Components/PrivateRoute";
import { ManagerProvider } from "./context/ManagerContext";

// Layouts
import Employee from "./Components/Employee";
import LeaveRequests from "./Components/Manager";
import AdminDashboard from "./Components/Admin";

// Pages
import SignInPage from "./Components/Signin";
import SessionExpired from "./Components/SessionExpired";
import EmployeeDashboard from "./Components/EmployeeDashboard";
import ApplyLeave from "./Components/ApplyLeave";
import LeaveHistory from "./Components/LeaveHistory";
import ProfilePage from "./Components/ProfilePage";
import LeaveRequestsTable from "./Components/LeaveRequestsTable";
import ManagerDashboard from "./Components/ManagerDashboard";
import ManagerEmployeeDashboard from "./Components/ManagerEmployeeDashboard";
import Reports from "./Components/Reports";
import EmployeesUnderManager from "./Components/EmployeesUnderManager";
import LeavePolicyPage from "./Components/LeavePolicyPage";
import AdminTrends from "./Components/AdminTrends";
import HolidayCalendar from "./Components/HolidayCalendar";
import TotalEmployees from "./Components/TotalEmployees";
import ReportsAdmin from "./Components/ReportsAdmin";
import ManagersList from "./Components/ManagersList";
import AdminToManager from "./Components/AdminToManager";
import EmployeesUnderManagerinAdmin from "./Components/EmployeesUnderManagerinAdmin";
import InActiveEmp from "./Components/InActiveEmp";
import Project from "./Components/Projects"
function App() {
  return (
    <BrowserRouter>
      <SnackbarProvider maxSnack={5} autoHideDuration={3000}>
        <ManagerProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<SignInPage />} />
            <Route path="/session-expired" element={<SessionExpired />} />

            {/* Employee Routes */}

            <Route
              path="/employee"
              element={
                <PrivateRoute allowedRoles={["employee"]}>
                  <Employee />
                </PrivateRoute>
              }
            >
              <Route index element={<EmployeeDashboard />} />
              <Route path="apply-leave" element={<ApplyLeave />} />
              <Route path="history" element={<LeaveHistory />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="dashboard" element={<EmployeeDashboard />} />
            </Route>

            {/* Manager Routes */}
            {/* <Route element={<PrivateRoute allowedRoles={["Manager"]} />}> */}
            <Route
              path="/manager"
              element={
                <PrivateRoute allowedRoles={["manager"]}>
                  <LeaveRequests />
                </PrivateRoute>
              }
            >
              <Route index element={<LeaveRequestsTable />} />
              <Route path="analytics" element={<ManagerDashboard />}>
                <Route index element={<EmployeeDashboard />} />
                <Route path="self" element={<EmployeeDashboard />} />
                <Route path="reports" element={<Reports />} />
                <Route path="employees" element={<EmployeesUnderManager />} />
              </Route>
              <Route path="dashboard/:email?" element={<EmployeeDashboard />} />
              <Route path="apply-leave" element={<ApplyLeave />} />
              <Route path="history" element={<LeaveHistory />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="leave-requests" element={<LeaveRequestsTable />} />
            </Route>
            {/* </Route> */}

            {/* Admin Routes */}
            <Route
              path="/admin"
              element={
                <PrivateRoute allowedRoles={["admin"]}>
                  <AdminDashboard />
                </PrivateRoute>
              }
            >
              <Route index element={<HolidayCalendar />} />
              <Route path="all-employees" element={<TotalEmployees />} />
              {/* <Route path="all-reports" element={<AdminTrends />} /> */}
              <Route path="analytics/:email" element={<AdminToManager />}>
                <Route index element={<EmployeeDashboard />} />
                <Route path="self" element={<EmployeeDashboard />} />
                <Route path="reports" element={<Reports />} />
                <Route path="employees" element={<EmployeesUnderManagerinAdmin />} />
                <Route path="inactive-employees" element={<InActiveEmp />} />
              </Route>

              <Route path="all-reports" element={<AdminTrends />}>
                <Route index element={<ReportsAdmin />} />
                <Route path="managers" element={<ManagersList />} />
                <Route path="reports" element={<ReportsAdmin />} />
              </Route>

              <Route path="dashboard/:managerEmail/:email?" element={<EmployeeDashboard />} />
              <Route path="leave-requests" element={<LeaveRequestsTable />} />
              <Route path="leave-policies" element={<LeavePolicyPage />} />
              <Route path="projects" element={<Project/>}/>
              <Route path="calendar" element={<HolidayCalendar />} />
            </Route>
          </Routes>
        </ManagerProvider>
      </SnackbarProvider>
    </BrowserRouter>
  );
}

export default App;