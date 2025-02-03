import React from "react";
import Landing from "./Components/Landing";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Admin from "./Components/Admin";
import Employee from "./Components/Employee";
import Manager from "./Components/Manager";
import SignInPage from "./Components/Signin";

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<SignInPage />} />
          <Route path="/employee" element={<Employee />} />
          <Route path="/manager" element={<Manager />} />
          <Route path="/admin" element={<Admin />} />
          {/* <Route path="/login" element={<SignInPage />} /> */}
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
