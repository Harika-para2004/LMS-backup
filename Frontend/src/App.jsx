import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SnackbarProvider } from "notistack";
import SignInPage from "./Components/Signin";
import Employee from "./Components/Employee";
import Manager from "./Components/Manager";
import Admin from "./Components/Admin";
import SessionExpired from "./Components/SessionExpired";
import PrivateRoute from "./Components/PrivateRoute";

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <SnackbarProvider maxSnack={5} autoHideDuration={3000}>
          <Routes>
            <Route path="/" element={<SignInPage />} />
            <Route path="/session-expired" element={<SessionExpired />} />
            <Route
              path="/employee"
              element={<PrivateRoute allowedRoles={["employee"]}><Employee /></PrivateRoute>}
            />
            <Route
              path="/manager"
              element={<PrivateRoute allowedRoles={["manager"]}><Manager /></PrivateRoute>}
            />
            <Route
              path="/admin"
              element={<PrivateRoute allowedRoles={["admin"]}><Admin /></PrivateRoute>}
            />
          </Routes>
        </SnackbarProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;