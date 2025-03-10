import React, { useState, useEffect } from "react";
import axios from "axios";
import Projects from "./Projects";
import { useRef } from "react";
import {
  FaEdit,
  FaTrash,
  FaPlus,
  FaChevronDown,
  FaChevronUp,
} from "react-icons/fa";
import "./LeavePolicyPage.css";
import useToast from "./useToast";
import { Button } from "@mui/material";
import { Add } from "@mui/icons-material";

function LeavePolicyPage() {
  const [formData, setFormData] = useState({
    leaveType: "",
    maxLeaves: "",
    description: "",
    policyId: "",
  });
  const showToast = useToast();

  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [policies, setPolicies] = useState([]);
  const formRef = useRef(null); // ✅ Ref for the form
  const [expandedPolicy, setExpandedPolicy] = useState(null);

  useEffect(() => {
    axios
      .get("http://localhost:5001/api/leave-policies")
      .then((res) => setPolicies(res.data.data))
      .catch(console.error);
  }, []);

  const toggleDescription = (policyId) => {
    setExpandedPolicy((prevId) => (prevId === policyId ? null : policyId));
  };

  const formatCase = (text) => {
    return text.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const isDuplicate = (leaveType) => {
    return policies.some(
      (p) => p.leaveType.toLowerCase() === leaveType.toLowerCase()
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isDuplicate(formData.leaveType) && !formData.policyId) {
      return showToast("Leave type already exists.");
    }

    setIsLoading(true);
    try {
      const url = formData.policyId ? `update/${formData.policyId}` : "create";
      await axios[formData.policyId ? "put" : "post"](
        `http://localhost:5001/api/leave-policies/${url}`,
        {
          leaveType: formData.leaveType.replace(/\b\w/g, (c) =>
            c.toUpperCase()
          ),
          maxAllowedLeaves: formData.maxLeaves,
          description: formData.description,
        }
      );
      showToast(
        `Leave policy ${
          formData.policyId ? "updated" : "created"
        } successfully!`
      );
      setPolicies(
        (await axios.get("http://localhost:5001/api/leave-policies")).data.data
      );
      setShowForm(false);
    } catch (error) {
      showToast("Failed to process leave policy.");
    }
    setIsLoading(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this policy?")) return;
    try {
      await axios.delete(
        `http://localhost:5001/api/leave-policies/delete/${id}`
      );
      setPolicies(policies.filter((p) => p._id !== id));
      showToast("Leave policy deleted successfully!");
    } catch {
      showToast("Failed to delete leave policy.");
    }
  };

  return (
    <div className="leave-policy-container1">
      <div className="left-section">
        <div className="header">
          <h2 className="content-heading">Leave Policies</h2>
          <Button
            className="create-policy-btn"
            sx={{bgcolor:"#313896",color:"white"}}
            onClick={() => {
              setShowForm(true);
              setFormData({
                leaveType: "",
                maxLeaves: "",
                description: "",
                policyId: "",
              }); // ✅ Clears form
            }}
            startIcon = {<Add />}
          >
             Add Policy
          </Button>
        </div>

        {message && (
          <div
            className={`message ${
              message.includes("successfully") ? "success" : "error"
            }`}
          >
            {message}
          </div>
        )}

        {showForm && (
          <form
            ref={formRef}
            onSubmit={handleSubmit}
            className="form-container styled-form"
          >
            <h3 style={{ marginBottom: "20px" }}>
              {formData.policyId ? "Edit" : "Create"} Leave Policy
            </h3>
            <div className="form-group">
              <label>Leave Type</label> <br/>
              <input
                type="text"
                name="leaveType"
                value={formData.leaveType}
                onChange={handleChange}
                required
                placeholder="Leave Type"
                className="input-field"
              />
            </div>
            <div className="form-group">
              <label>Max Leaves</label> <br/>
              <input
                type="number"
                name="maxLeaves"
                value={formData.maxLeaves}
                onChange={handleChange}
                // min="1"
                // required
                placeholder="Max Leaves"
                className="input-field"
              />
            </div>
            <div className="form-group">
              <label>Description</label> <br/>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                placeholder="Enter leave policy description..."
                className="input-field"
                rows="4"
              />
            </div>

            <div className="form-actions">
              <button type="submit" disabled={isLoading} className="submit-btn">
                {isLoading ? "Saving..." : formData.policyId ? "Update" : "Add"}{" "}
                Policy
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="cancel-btn"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        <div className="policy-slider">
          <div className="policy-list">
            {policies.length === 0 ? (
              <p>No leave policies available.</p>
            ) : (
              policies.map((p) => (
                <div
                  key={p._id}
                  className={`policy-item ${
                    expandedPolicy === p._id ? "expanded" : ""
                  }`} // ✅ Add class for expansion
                >
                  <div className="policy-header">
                    <h4>{formatCase(p.leaveType)}</h4>

                    <div className="policy-actions">
                      <p>
                        Total Leaves:{" "}
                        {p.maxAllowedLeaves !== null
                          ? p.maxAllowedLeaves
                          : "N/A"}
                      </p>
                      <button
                        onClick={() => {
                          setShowForm(true);
                          setFormData({
                            leaveType: p.leaveType,
                            maxLeaves: p.maxAllowedLeaves,
                            description: p.description,
                            policyId: p._id,
                          });
                          setTimeout(() => {
                            formRef.current.scrollIntoView({
                              behavior: "smooth",
                            });
                          }, 100);
                        }}
                      >
                        <FaEdit />
                      </button>
                      <button onClick={() => handleDelete(p._id)}>
                        <FaTrash />
                      </button>
                      <button onClick={() => toggleDescription(p._id)}>
                        {expandedPolicy === p._id ? (
                          <FaChevronUp />
                        ) : (
                          <FaChevronDown />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* ✅ Move description outside .policy-header */}
                  {expandedPolicy === p._id && (
                    <p className="policy-description">{p.description}</p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="right-section">
        <Projects />
      </div>
    </div>
  );
}

export default LeavePolicyPage;
