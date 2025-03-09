import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import logo from "./../assets/img/logo.jpg";
import authImage from "./../assets/img/authentication.svg";
import "./../assets/css/styles.css";
import { AiFillEye, AiFillEyeInvisible } from "react-icons/ai";
import { useManagerContext } from "../context/ManagerContext";

const ResetPassword = () => {
  const { email } = useParams(); // Get email from URL
  const navigate = useNavigate();
  const { showToast } = useManagerContext();
  
  const [formData, setFormData] = useState({ password: "", confirmPassword: "" });
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const togglePasswordVisibility = () => {
    setPasswordVisible(!passwordVisible);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      showToast("Passwords do not match", "error");
      return;
    }

    setLoading(true);
    try {
        const response = await axios.post(`http://localhost:5001/api/auth/reset-password`, {
          email,  // Send email
          newPassword: formData.password, // Use "newPassword" instead of "password"
        });

      showToast("Password reset successful! Redirecting to login...", "success");

      setTimeout(() => navigate("/"), 2000);
    } catch (error) {
      showToast(error.response?.data?.message || "Something went wrong", "error");
    } finally {
      setLoading(false);
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

        <form onSubmit={handleSubmit} className="form__content">
          <div>
            <h2 className="welcome-text">Reset Password</h2>
            <p className="form__forgot-text">Enter a new password for {email}</p>
            <br />
          </div>

          {/* New Password Field */}
          <div className="form__div">
            <div className="form__icon">
              <i className="bx bx-lock"></i>
            </div>
            <div className="form__div-input">
              <input
                type={passwordVisible ? "text" : "password"}
                name="password"
                className="form__input"
                value={formData.password}
                onChange={handleChange}
                placeholder=" "
                required
              />
              <label className="form__label">New Password</label>
              <span className="eye-icon" onClick={togglePasswordVisibility}>
                {passwordVisible ? <AiFillEyeInvisible /> : <AiFillEye />}
              </span>
            </div>
          </div>

          {/* Confirm Password Field */}
          <div className="form__div">
            <div className="form__icon">
              <i className="bx bx-lock"></i>
            </div>
            <div className="form__div-input">
              <input
                type="password"
                name="confirmPassword"
                className="form__input"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder=" "
                required
              />
              <label className="form__label">Confirm Password</label>
            </div>
          </div>

          <input type="submit" className="form__button" value={loading ? "Resetting..." : "Reset Password"} disabled={loading} />
          <a href="/" className="form__forgot">Back to Login</a>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
