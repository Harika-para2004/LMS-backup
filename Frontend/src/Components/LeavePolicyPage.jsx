import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  FaEdit,
  FaTrash,
  FaPlus,
  FaChevronDown,
  FaChevronUp,
} from "react-icons/fa";
import "./LeavePolicyPage.css";

function LeavePolicyPage() {
  const [formData, setFormData] = useState({
    leaveType: "",
    maxLeaves: "",
    description: "",
    policyId: "",
  });
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [policies, setPolicies] = useState([]);
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
      return setMessage("Leave type already exists.");
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
      setMessage(
        `Leave policy ${
          formData.policyId ? "updated" : "created"
        } successfully!`
      );
      setPolicies(
        (await axios.get("http://localhost:5001/api/leave-policies")).data.data
      );
      setShowForm(false);
    } catch (error) {
      setMessage("Failed to process leave policy.");
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
      setMessage("Leave policy deleted successfully!");
    } catch {
      setMessage("Failed to delete leave policy.");
    }
  };

  return (
    <div className="leave-policy-page">
      <div className="header">
        <h2 className="content-heading">Leave Policies</h2>
        <button
          className="create-policy-btn"
          onClick={() => {
            setShowForm(true);
            setFormData({
              leaveType: "",
              maxLeaves: "",
              description: "",
              policyId: "",
            }); // ✅ Clears form
          }}
        >
          <FaPlus /> Add Policy
        </button>
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
        <form onSubmit={handleSubmit} className="form-container styled-form">
          <h3 style={{ marginBottom:"20px" }} >{formData.policyId ? "Edit" : "Create"} Leave Policy</h3>
          <div className="form-group">
            <label>Leave Type</label>
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
            <label>Max Leaves</label>
            <input
              type="number"
              name="maxLeaves"
              value={formData.maxLeaves}
              onChange={handleChange}
              min="1"
              required
              placeholder="Max Leaves"
              className="input-field"
            />
          </div>
          <div className="form-group">
            <label>Description</label>
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
                  <h4>{p.leaveType}</h4>
                  <p>Total Leaves: {p.maxAllowedLeaves}</p>
                  <div className="policy-actions">
                    <button
                      onClick={() => {
                        setShowForm(true);
                        setFormData({
                          leaveType: p.leaveType,
                          maxLeaves: p.maxAllowedLeaves,
                          description: p.description,
                          policyId: p._id,
                        });
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
  );
}

export default LeavePolicyPage;
