import React from "react";
import './Landing.css';
import styled from "styled-components";
import Logo from '../assets/img/quadfacelogo-hd.png';
import { useNavigate } from "react-router-dom";

// Styled Component for Heading
const Heading = styled.h1`
  font-size: 3em;
  margin: 10px 0;
  margin-left: 10%;
  letter-spacing: 2px;
  text-transform: uppercase;
  background: -webkit-linear-gradient(#fff, #00D7FF);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: slideIn 1.5s ease-out;
`;

// Styled Component for the Wrapper
const Wrapper = styled.div`
  height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  width:128%;
  align-items: center;
  text-align: center;
  padding: 20px;
  background: linear-gradient(120deg, #00D7FF, #9F32B2);
  color: #fff;
  overflow: hidden;
`;

const LeaveManagementSystem = () => {
  const navigate = useNavigate();

  const handleNavigate = () => {
    navigate('/login'); // Correct navigation path
  };

  return (
    <Wrapper>
      <div className="land-container">
        <img src={Logo} alt="Company Logo" className="land-logo" />
        <Heading>Leave Management System</Heading>
        <br />
        <p>Effortless Leave Tracking & Management</p>
        <a 
          onClick={handleNavigate} 
          className="land-cta-btn" 
          role="button" 
          style={{ cursor: "pointer" }}
        >
          Sign In
        </a>
      </div>
      <div className="land-circle small"></div>
      <div className="land-circle large"></div>
    </Wrapper>
  );
};

export default LeaveManagementSystem;
