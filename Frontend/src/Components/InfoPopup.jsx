import React, { useState } from "react";
import { FaInfoCircle } from "react-icons/fa";

const InfoPopup = ({ handleDownloadTemplate }) => {
  const [showPopup, setShowPopup] = useState(false);

  return (
    <div style={{ display: "inline-block" }}>
      {/* ℹ️ Info Icon */}
      <div className="info-icon" onClick={() => setShowPopup(true)}>
        <FaInfoCircle size={20} color="#007bff" style={{ cursor: "pointer" }} />
      </div>

      {/* Popup (Modal) */}
      {showPopup && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0, 0, 0, 0.5)", // Dark overlay
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 2000,
          }}
          onClick={() => setShowPopup(false)} // Clicking outside closes popup
        >
          <div
            style={{
              background: "#fff",
              padding: "20px",
              borderRadius: "10px",
              width: "320px",
              textAlign: "left",
              boxShadow: "0px 5px 15px rgba(0,0,0,0.3)",
              position: "relative",
            }}
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
          >
            {/* Close Button */}
            <button
              onClick={() => setShowPopup(false)}
              style={{
                position: "absolute",
                top: "10px",
                right: "15px",
                background: "none",
                border: "none",
                fontSize: "18px",
                cursor: "pointer",
                color: "#555",
              }}
            >
              ✖
            </button>

            {/* Instructions */}
            <h3 style={{ fontSize: "16px", color: "#007bff", marginBottom: "10px" }}>
              ⚠️ Instructions
            </h3>

            <ol style={{ fontSize: "14px", color: "#333", lineHeight: "1.6" }}>
              <li>
                For <b>Managers</b>, leave the <b>Manager Email</b> column <i>empty</i>.
              </li>
              <li>
                For <b>Employees</b>, leave the <b>Project</b> column <i>empty</i>.The <b>Project</b> Automatically assigned from <b>Manager</b>
              </li>
              <li>
                Ensure all required fields like <b>Email</b> and <b>Password</b> are filled.
              </li>
        
            </ol>
            <small style={{ color: "red" }}>
    Must follow Above Instructions, Otherwise Employee details are skipped
  </small>
            {/* Download Button */}
            <button
              onClick={handleDownloadTemplate}
              style={{
                background: "#007bff",
                color: "#fff",
                border: "none",
                padding: "10px 15px",
                fontSize: "14px",
                fontWeight: "600",
                borderRadius: "6px",
                cursor: "pointer",
                marginTop: "15px",
                width: "100%",
                transition: "background 0.3s ease",
              }}
              onMouseEnter={(e) => (e.target.style.background = "#0056b3")}
              onMouseLeave={(e) => (e.target.style.background = "#007bff")}
            >
              ⬇️ Download Template
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default InfoPopup;