import React, { useState, useEffect } from "react";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLock, faTimes, faUserCircle } from "@fortawesome/free-solid-svg-icons";
import "./AdminProfileModal.css";

const AdminProfileModal = ({ isOpen, onClose, adminEmail }) => {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // Reset message when modal opens
  useEffect(() => {
    if (isOpen) {
      setMessage("");  // Clear previous success/error message
      setNewPassword("");  // Clear input fields
      setConfirmPassword("");
    }
  }, [isOpen]);

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setMessage("Passwords do not match!");
      return;
    }
    
    try {
      setLoading(true);
      const response = await axios.put("http://localhost:5001/api/auth/updateAdminPassword", {
        email: adminEmail,
        newPassword: newPassword,
      });

      setMessage(response.data.message);  // Display success message
    } catch (error) {
      setMessage("Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="close-btn" onClick={onClose}>
          <FontAwesomeIcon icon={faTimes} />
        </button>

        {/* Admin Profile Section */}
        <div className="admin-profile">
          <FontAwesomeIcon icon={faUserCircle} className="profile-icon" />
          <span className="admin-title">Admin</span>
        </div>
        <p className="admin-email">Email : {adminEmail}</p>

        <h2>Reset Password</h2>
        <form onSubmit={handleResetPassword}>
          <div className="input-group">
            <FontAwesomeIcon icon={faLock} />
            <input
              type="password"
              placeholder="New Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>
          <div className="input-group">
            <FontAwesomeIcon icon={faLock} />
            <input
              type="password"
              placeholder="Confirm New Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          
          {/* Display Message */}
          {message && (
            <p className={`message ${message.includes("successfully") ? "success" : "error"}`}>
              {message}
            </p>
          )}

          <button type="submit" className="reset-btn" disabled={loading}>
            {loading ? "Updating..." : "Reset Password"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminProfileModal;