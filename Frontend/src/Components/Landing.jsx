import React from "react";
import "../App.css";
import LogImage from "../assets/img/logo.jpg";
import Landing from '../assets/img/landing.jpeg';
import Approve from '../assets/img/approve.jpg';
import Leave from '../assets/img/apply.png';
import { useNavigate } from "react-router-dom";

function App() {
  const navigate = useNavigate();

  return (
    <div className="app">
      {/* Header Section */}
      <header className="header_land">
        <div className="logo-container">
          <img
            src={LogImage}
            alt="QuadFace Logo"
            className="logo"
          />
          <h3 className="header-title">Leave Management System</h3>
          <button
  className="login-button"
  style={{
    fontSize: "18px",
    fontWeight: "bold",
    color: "#fff",
    backgroundColor: "#9F32B2",
    border: "none",
    borderRadius: "30px",
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
    cursor: "pointer",
    transition: "all 0.3s ease",
  }}
  onMouseOver={(e) => {
    e.target.style.backgroundColor = "#0056b3";
    e.target.style.transform = "scale(1.05)";
  }}
  onMouseOut={(e) => {
    e.target.style.backgroundColor = "#007BFF";
    e.target.style.transform = "scale(1)";
  }}
  onClick={() => navigate("/login")}

>
  Sign In
</button>
        </div>
      </header>

      {/* Main Section */}
      <main className="main">
        {/* Left Half: Content */}
        <div className="left-half">
          <div className="image-container">
            <img
              src={Leave}
              alt="Top Image"
              className="grid-image top-image"
            />
            <img
              src={Landing}
              alt="Bottom Image 1"
              className="grid-image bottom-image"
            />
            <img
              src={Approve}
              alt="Bottom Image 2"
              className="grid-image bottom-image"
            />
          </div>
        </div>

      {/* Right Half: Attractive Content */}
<div
  className="right-half"
  style={{
    padding: "20px",
    color: "#333",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "flex-start",
  }}
>
  <h2 style={{ fontSize: "28px", color: "#216B88", marginBottom: "15px" }}>
  Benefits of Using Our Leave Management System
  </h2>

  <p style={{ fontSize: "16px", lineHeight: "1.6", marginBottom: "20px" }}>
    Our Leave Management System is designed to simplify the process of managing employee leaves. With user-friendly features, Employees can request leaves, and managers can approve or reject them quickly.</p>

  <h3 style={{ marginBottom: "15px", fontSize: "22px", color: "navy" }}>
    Key Features:
  </h3>

  <ul
    style={{
      listStyleType: "disc",
      paddingLeft: "20px",
      marginBottom: "20px",
      fontSize: "16px",
      lineHeight: "1.6",
    }}
  >
    <li>Simple leave request submissions</li>
    <li>Real-time approval</li>
    <li>Leave Type Configuration</li>
    <li>Detailed reports and analytics</li>
    <li>Leave Balance Tracking</li>
  </ul>

  
</div>

      </main>
    </div>
  );
}

export default App;
