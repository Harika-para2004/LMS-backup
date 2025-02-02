import React, { useState, useEffect } from "react";
import axios from "axios";
import "./LeavePolicyPage.css";
import { FaEdit, FaTrash } from "react-icons/fa";

function LeavePolicyPage() {
  const [formData, setFormData] = useState({
    leaveType: "",
    maxLeaves: "",
    policyId: "", // Add this field to track the policy being edited
  });

  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState(""); // State for message display
  const [isLoading, setIsLoading] = useState(false);
  const [policies, setPolicies] = useState([]); // State to hold policies

  // Fetch existing leave policies on component mount
  useEffect(() => {
    async function fetchPolicies() {
      try {
        const response = await axios.get(
          "http://localhost:5001/api/leave-policies"
        );
        setPolicies(response.data.data);
      } catch (error) {
        console.error("Error fetching leave policies:", error);
      }
    }

    fetchPolicies();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
  
    setFormData({
      ...formData,
      [name]:  value, // Convert leaveType to uppercase
    });
  };
  

  // Check for duplicate leave types before submitting
  const isDuplicateLeaveType = (leaveType) => {
    return policies.some(
      (policy) => policy.leaveType.toLowerCase() === leaveType.toLowerCase()
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(""); // Clear any previous messages

    // Check if leaveType already exists
    if (isDuplicateLeaveType(formData.leaveType) && !formData.policyId) {
      setMessage("Leave type already exists.");
      setIsLoading(false);
      setTimeout(() => setMessage(""), 3000); // Clear message after 3 seconds
      return;
    }

    try {
      let response;
      if (formData.policyId) {
        // Edit existing policy
        response = await axios.put(
          `http://localhost:5001/api/leave-policies/update/${formData.policyId}`,
          {
            leaveType: formData.leaveType
            .toLowerCase()
            .replace(/\b\w/g, (char) => char.toUpperCase()),
            maxAllowedLeaves: formData.maxLeaves,
          }
        );
        setMessage("Leave policy updated successfully!");
      } else {
        // Create new policy
        response = await axios.post(
          "http://localhost:5001/api/leave-policies/create",
          {
            leaveType: formData.leaveType,
            maxAllowedLeaves: formData.maxLeaves,
          }
        );
        setMessage("Leave policy created successfully!");
      }

      if (response.status === 200 || response.status === 201) {
        // Fetch updated leave policies after creating or updating one
        const updatedPolicies = await axios.get(
          "http://localhost:5001/api/leave-policies"
        );
        setPolicies(updatedPolicies.data.data);

        // Clear form after submission
        setFormData({ leaveType: "", maxLeaves: "", policyId: "" });
        setShowForm(false);
      }
    } catch (error) {
      console.error("API Error:", error.response?.data || error.message);
      setMessage("Failed to process leave policy.");
    } finally {
      setIsLoading(false);
      setTimeout(() => setMessage(""), 3000); // Clear message after 3 seconds
    }
  };

  const handleCreatePolicyClick = () => {
    setMessage(""); // Clear message when creating new policy
    setShowForm(true);
    setFormData({ leaveType: "", maxLeaves: "", policyId: "" }); // Reset form for new policy
  };

  const handleCancel = () => {
    setFormData({ leaveType: "", maxLeaves: "", policyId: "" });
    setShowForm(false);
  };

  const handleDelete = async (id) => {
    try {
      const response = await axios.delete(
        `http://localhost:5001/api/leave-policies/delete/${id}`
      );
      setMessage("Leave policy deleted successfully!");
      setPolicies(policies.filter((policy) => policy._id !== id)); // Remove deleted policy from UI
    } catch (error) {
      console.error("Error deleting policy:", error);
      setMessage("Failed to delete leave policy.");
    }
    setTimeout(() => setMessage(""), 3000); // Clear message after 3 seconds
  };

  const handleEdit = (id) => {
    const policyToEdit = policies.find((policy) => policy._id === id);
    setFormData({
      leaveType: policyToEdit.leaveType,
      maxLeaves: policyToEdit.maxAllowedLeaves,
      policyId: policyToEdit._id, // Set the policyId for the edit
    });
    setShowForm(true);
  };

  return (
    <div className="leave-policy-page">
      <div className="header">
        <h2 className="content-heading">Leave Policies</h2>
        <button className="create-policy-btn" onClick={handleCreatePolicyClick}>
          Create Policy
        </button>
      </div>

      {/* Display message */}
      {message && (
        <div
          className={`message ${
            message.includes("successfully") ? "success" : "error"
          }`}
        >
          {message}
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div className="form-container">
          <form onSubmit={handleSubmit}>
            <h3>
              {formData.policyId ? "Edit Leave Policy" : "Create Leave Policy"}
            </h3>
            <div className="form-group">
              <label htmlFor="leaveType">Leave Type:</label>
              <input
                type="text"
                id="leaveType"
                name="leaveType"
                value={formData.leaveType}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="maxLeaves">Max Leaves:</label>
              <input
                type="number"
                id="maxLeaves"
                name="maxLeaves"
                value={formData.maxLeaves}
                onChange={handleChange}
                min="1"
                required
              />
            </div>
            <div className="form-actions">
              <button type="submit" className="submit-btn" disabled={isLoading}>
                {isLoading
                  ? "Saving..."
                  : formData.policyId
                  ? "Update Policy"
                  : "Add Policy"}
              </button>
              <button
                type="button"
                className="cancel-btn"
                onClick={handleCancel}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Display Existing Policies */}
      <div className="policy-list">
        {policies.length === 0 ? (
          <p>No leave policies available.</p>
        ) : (
          policies.map((policy) => (
            <div key={policy._id} className="policy-item">
              <div className="policy-details">
                <h4>{policy.leaveType.toLowerCase()
            .replace(/\b\w/g, (char) => char.toUpperCase())}</h4>
                <p>Total Leaves: {policy.maxAllowedLeaves}</p>
                {/* <p>Created: {new Date(policy.createdAt).toLocaleDateString()}</p> */}
              </div>
              <div className="policy-actions">
                <button className="edit-btn" onClick={() => handleEdit(policy._id)}> <FaEdit size={20} color="blue"  /> </button>
                <button className="delete-btn" onClick={() => handleDelete(policy._id)}>  <FaTrash size={20} color="red" /> </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default LeavePolicyPage;
