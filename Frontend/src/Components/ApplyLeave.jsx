import React from "react";
import {
  Grid,
  TextField,
  MenuItem,
  Button,
  TextareaAutosize,
} from "@mui/material";

const ApplyLeave = ({
  formData,
  errors,
  handleInputChange,
  handleBlur,
  handleSubmit,
  handleFileChange,
  holidays,
  getTodayDate,
  leavePolicies
}) => {
  const disabledDates = ["2024-02-10", "2024-02-15", "2024-02-20"];

  return (
    <div className="leave-management-container">
      <div className="apply-leave-section">
        <h2 className="section-title">Apply Leave</h2>
        {/* Apply Leave form code goes here */}
        <form onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            {/* Leave Type */}
            <Grid item xs={12} sm={4}>
              <label>
                Leave Type: <span className="req">*</span>
                {errors.leaveType && (
                  <span className="req">{errors.leaveType}</span>
                )}<TextField
                select
                name="leaveType"
                value={formData.leaveType}
                onChange={handleInputChange}
                onBlur={handleBlur}
                fullWidth
                size="small"
                variant="outlined"
              >
                <MenuItem value="Select Leave Type" disabled>
                  Select Leave Type
                </MenuItem>
                {leavePolicies.length > 0 ? (
                  leavePolicies.map((leaveType, index) => (
                    <MenuItem key={index} value={leaveType}>
                      {leaveType}
                    </MenuItem>
                  ))
                ) : (
                  <MenuItem disabled>No Leave Policies Available</MenuItem>
                )}
              </TextField>
              
              
              </label>
            </Grid>

            {/* From Date */}
            <Grid item xs={12} sm={4}>
              <label>
                From: <span className="req">*</span>
                {errors.from && <span className="req">{errors.from}</span>}
                <TextField
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleInputChange}
                  inputProps={{
                    max: formData.endDate,
                    min: getTodayDate(),
                  }}
                  
                  fullWidth
                  size="small"
                  variant="outlined"
                />
                
              </label>
            </Grid>

            {/* To Date */}
            <Grid item xs={12} sm={4}>
              <label>
                To: <span className="req">*</span>
                {errors.to && <span className="req">{errors.to}</span>}
                <TextField
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleInputChange}
                  inputProps={{ min: formData.startDate }}
                  fullWidth
                  size="small"
                  variant="outlined"
                />
              </label>
            </Grid>

            {/* Reason */}
            <Grid item xs={12}>
              <label>
                Reason:
                <TextareaAutosize
                  name="reason"
                  value={formData.reason}
                  onChange={handleInputChange}
                  maxRows={1}
                  style={{
                    width: "100%",
                    padding: "8px",
                    border: "1px solid #ccc",
                    borderRadius: "4px",
                  }}
                />
              </label>
            </Grid>

            {/* Attach Document Button */}
            <Grid item xs={12}>
              <Button
                variant="contained"
                component="label"
                sx={{
                  backgroundColor: "transparent",
                  border: "1px solid var(--dark-blue)",
                  color: "#000",
                  margin: "10px 0",
                }}
              >
                Attach
                <input
                  type="file"
                  name="attachment"
                  onChange={handleFileChange}
                  hidden
                />
              </Button>
              <Button
                type="submit"
                variant="contained"
                sx={{ marginLeft: "10px" }}
              >
                Submit
              </Button>
            </Grid>
          </Grid>
        </form>
      </div>

      <div className="holiday-table-section apply-leave-container">
        <h2 className="section-title">Holiday Calendar</h2>
        {/* Holiday Table code goes here */}
        <table className="holiday-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Day</th>
              <th>Name of Holiday</th>
              <th>Holiday Type</th>
            </tr>
          </thead>
          <tbody>
            {holidays.length > 0 ? (
              holidays.map((holiday) => (
                <tr key={holiday._id}>
                  <td>{holiday.date.split("-").slice(0, 2).join("-")}</td>
                  <td>{holiday.day}</td>
                  <td>{holiday.name}</td>
                  <td>{holiday.type}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4">No holidays found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ApplyLeave;
