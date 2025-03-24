import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import logo from "./../assets/img/logo.jpg";
import authImage from "./../assets/img/authentication.svg";
import "./../assets/css/styles.css";
import { useManagerContext } from "../context/ManagerContext";
const backendUrl = import.meta.env.VITE_BACKEND_URL;

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [numbers, setNumbers] = useState([]);
  const [correctNumber, setCorrectNumber] = useState(null);
  const navigate = useNavigate();
  const { showToast } = useManagerContext();

  // ✅ Handle Email Submission
  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(`${backendUrl}/api/auth/forgot/forgot-password`, { email });

      setNumbers(response.data.numbers); // Store random numbers
      setCorrectNumber(response.data.correctNumber); // Store correct number
      setStep(2); // Move to step 2
      showToast(response.data.message, "success");
    } catch (error) {
      showToast(error.response?.data?.message || "Something went wrong", "error");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Handle Number Selection
  const handleNumberClick = (num) => {
    if (num === correctNumber) {
      showToast("Code verified! Proceeding to reset password.", "success");
      navigate(`/reset-password/${email}`);
    } else {
      showToast("Incorrect code, try again!", "error");
    }
  };

  return (
    <div className="l-form">
      <div className="shape2"></div>
      <div className="shape1"></div>

      <div className="form">
        <div className="circle"></div>
        <img src={logo} alt="Quadface Logo" className="logo1" />
        <h2 style={{ textAlign: "center", marginRight: "-70%", color: "var(--deep-blue)", fontSize: "36px" }}>
          Leave Management System
        </h2>
        <br /><br />

        <img src={authImage} alt="Authentication" className="form__img" />

        {/* Step 1: Email Input */}
        {step === 1 && (
          <form onSubmit={handleEmailSubmit} className="form__content">
            <div>
              <h2 className="welcome-text">Forgot Password?</h2>
              <p className="form__forgot-text">Enter your email</p>
              <br />
            </div>

            <div className="form__div">
              <div className="form__icon">
                <i className="bx bx-envelope"></i>
              </div>
              <div className="form__div-input">
                <input
                  type="email"
                  name="email"
                  className="form__input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder=" "
                  required
                />
                <label htmlFor="email" className="form__label">Email</label>
              </div>
            </div>

            <input type="submit" className="form__button" value={loading ? "Sending..." : "Reset Password"} disabled={loading} />
            <a href="/" className="form__forgot">Back to Login</a>
          </form>
        )}

        {/* Step 2: Select Correct Number */}
        {step === 2 && (
          <div className="form__content">
            <h2 className="welcome-text">Select the correct number</h2>
            <p className="form__forgot-text">Click the correct code sent to your email</p>
            <br />
            <div className="number-options">
              {numbers.map((num, index) => (
                <button key={index} className="form__button" onClick={() => handleNumberClick(num)}>
                  {num}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
