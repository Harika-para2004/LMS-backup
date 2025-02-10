import React, { useState } from "react";
import { DatePicker } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import dayjs from "dayjs";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faInfoCircle } from "@fortawesome/free-solid-svg-icons";
import {
  Grid,
  TextField,
  MenuItem,
  Button,
  Box,
  TextareaAutosize,
  Card,
  CardContent,
  Typography,
  Modal,
  Tooltip,
  IconButton,
} from "@mui/material";

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  bgcolor: "background.paper",
  borderRadius: "8px",
  boxShadow: 24,
  p: 4,
};

const ApplyLeave = ({
  formData,
  errors,
  handleInputChange,
  handleBlur,
  handleSubmit,
  handleFileChange,
  holidays,
  getTodayDate,
  leavePolicies,
  leavepolicyRef,
}) => {
  const [showHolidays, setShowHolidays] = useState(false);
  const [showLeavePolicies, setShowLeavePolicies] = useState(false);
  const [openDescription, setOpenDescription] = useState(false);
  const [currentDescription, setCurrentDescription] = useState("");

  const handleToggleDescription = (policy) => {
    // Check if the description exists and then set the current description
    if (policy.description && policy.description.trim() !== "") {
      setCurrentDescription(policy.description); // Set the description to show in the modal
      setOpenDescription(policy._id); // Set the policy._id to indicate which policy's description is open
    } else {
      // If no description, set a fallback text
      setCurrentDescription("No description available for this leave policy.");
      setOpenDescription(policy._id);
    }
  };

  return (
    <div className="leave-management-container">
      <div className="apply-leave-section apply-leave-container">
        <h2 className="section-title">Apply Leave</h2>
        {/* Apply Leave form code goes here */}
        <form onSubmit={handleSubmit}>
          <Box display="flex" justifyContent="space-between" gap={2}>
            {/* Leave Type */}
            <Box flex={1}>
              <label className="field-label">
                Leave Type: <span className="req">*</span>
                <br />
              </label>
              {errors.leaveType && (
                <span className="req">{errors.leaveType}</span>
              )}
              <TextField
                select
                name="leaveType"
                value={formData.leaveType}
                onChange={handleInputChange}
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
                      {leaveType
                        .toLowerCase()
                        .replace(/\b\w/g, (char) => char.toUpperCase())}
                    </MenuItem>
                  ))
                ) : (
                  <MenuItem disabled>No Leave Policies Available</MenuItem>
                )}
              </TextField>
            </Box>

            {/* From Date */}
            <Box flex={1} sx={{ ml: 6 }}>
              <label className="field-label">
                From: <span className="req">*</span>
                <br />
              </label>
              {errors.from && <span className="req">{errors.from}</span>}
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  value={
                    formData.startDate
                      ? dayjs(formData.startDate, "DD/MM/YYYY")
                      : null
                  }
                  onChange={(newValue) =>
                    handleInputChange({
                      target: {
                        name: "startDate",
                        value: newValue
                          ? dayjs(newValue).format("DD/MM/YYYY")
                          : "",
                      },
                    })
                  }
                  format="DD/MM/YYYY"
                  shouldDisableDate={(date) =>
                    holidays.some(
                      (holiday) =>
                        holiday.type === "Mandatory" &&
                        dayjs(holiday.date).isSame(date, "day")
                    )
                  }
                  disablePast
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      fullWidth
                      size="small"
                      sx={{
                        "& .MuiOutlinedInput-input": {
                          fontSize: "small",
                        },
                      }}
                    />
                  )}
                />
              </LocalizationProvider>
            </Box>

            {/* To Date */}
            <Box flex={1} sx={{ ml: 4 }}>
              <label className="field-label">
                To: <span className="req">*</span>
                <br />
              </label>
              {errors.to && <span className="req">{errors.to}</span>}
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  value={
                    formData.startDate
                      ? dayjs(formData.startDate, "DD/MM/YYYY")
                      : null
                  }
                  onChange={(newValue) =>
                    handleInputChange({
                      target: {
                        name: "startDate",
                        value: newValue
                          ? dayjs(newValue).format("DD/MM/YYYY")
                          : "",
                      },
                    })
                  }
                  format="DD/MM/YYYY"
                  shouldDisableDate={(date) =>
                    holidays.some(
                      (holiday) =>
                        holiday.type === "Mandatory" &&
                        dayjs(holiday.date).isSame(date, "day")
                    )
                  }
                  disablePast
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      fullWidth
                      size="small"
                      sx={{
                        "& .MuiOutlinedInput-input": {
                          fontSize: "small",
                        },
                      }}
                    />
                  )}
                />
              </LocalizationProvider>
            </Box>
          </Box>

          <Box mt={2}>
            <label className="field-label">Reason:</label>
            <TextField
              name="reason"
              value={formData.reason}
              onChange={handleInputChange}
              multiline
              rows={2}
              fullWidth
              variant="outlined"
              sx={{
                mt: 1,
                "& .MuiOutlinedInput-root": {
                  borderRadius: "8px",
                },
              }}
            />
          </Box>

          <Box display="flex" alignItems="center" gap={2} mt={2}>
            {/* Attach Button */}
            <Button
              variant="outlined"
              component="label"
              className="attach-button"
            >
              Attach
              <input
                type="file"
                name="attachment"
                onChange={handleFileChange}
                hidden
              />
            </Button>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="contained"
              sx={{ textTransform: "none" }}
            >
              Submit
            </Button>
          </Box>
        </form>
      </div>

      {/* Holiday Calendar (Hover to Show) */}
      <div
        className="holiday-container"
        onMouseEnter={() => setShowHolidays(true)}
        onMouseLeave={() => setShowHolidays(false)}
      >
        <h2 className="section-title">Holiday Calendar</h2>
        <hr className="holiday-divider" />

        {showHolidays && (
          <div className="holiday-table-section apply-leave-container">
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
        )}
      </div>

      {/* Leave Policies (Hover to Show) */}
      <div
        className="leave-policy-container"
        onMouseEnter={() => setShowLeavePolicies(true)}
        onMouseLeave={() => setShowLeavePolicies(false)}
      >
        <h2 className="section-title">Leave Policies</h2>
        <hr className="leave-policy-divider" />
        {showLeavePolicies && (
          <div className="leave-policy-section apply-leave-container">
            <Grid container spacing={2}>
              {leavepolicyRef?.length > 0 ? (
                leavepolicyRef.map((policy, index) => (
                  <Grid item xs={12} sm={6} md={4} key={policy._id || index}>
                    <Card
                      sx={{
                        backgroundColor: "#f8f9fa",
                        borderRadius: "8px",
                        padding: "10px",
                      }}
                    >
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          {policy.leaveType}
                          <Tooltip title="View Description" arrow>
                            <IconButton
                              onClick={() => handleToggleDescription(policy)}
                              sx={{ marginLeft: "8px" }}
                            >
                              <FontAwesomeIcon icon={faInfoCircle} />
                            </IconButton>
                          </Tooltip>
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Max Allowed Leaves:{" "}
                          <strong>{policy.maxAllowedLeaves}</strong>
                        </Typography>
                        {/* Show description if this policy's description is open */}
                        {openDescription === policy._id && (
                          <Typography variant="body2" mt={1}>
                            {policy.description || "No description available"}
                            <Button
                              size="small"
                              sx={{ marginLeft: "8px" }}
                              onClick={() => setOpenDescription(null)} // Close description
                            >
                              Close
                            </Button>
                          </Typography>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                ))
              ) : (
                <Typography variant="body1">
                  No leave policies available
                </Typography>
              )}
            </Grid>
          </div>
        )}
      </div>
      {/* Modal for Leave Policy Description */}
      {/* Modal for Leave Policy Description */}
      <Modal
        open={openDescription}
        onClose={() => setOpenDescription(false)}
        aria-labelledby="leave-policy-description"
        aria-describedby="leave-policy-description-modal"
      >
        <Box sx={{ ...style, width: 400 }}>
          <Typography variant="h6" gutterBottom>
            Leave Policy Description
          </Typography>
          <Typography variant="body1" style={{ whiteSpace: "pre-line" }}>
            {
              currentDescription
                .replace(/^[•●▪■★▶►▸*\-]+\s*/g, "") // Remove existing bullets at the start
                .replace(/\n[•●▪■★▶►▸*\-]+\s*/g, "\n") // Remove bullets from new lines
                .replace(/\s{2,}/g, " ") // Remove extra spaces
                .trim() // Trim leading/trailing spaces
                .toLowerCase() // Convert everything to lowercase
                .replace(
                  /(^|\.\s+|\n)([a-z])/g,
                  (match, separator, char) => separator + char.toUpperCase()
                ) // Capitalize first letter after '.', '\n'
                .replace(/\n(?![-•])/g, "\n- ") // Add '-' at the start of every new line (if not already present)
            }
          </Typography>

          {/* Display the description */}
          <Button onClick={() => setOpenDescription(false)} sx={{ mt: 2 }}>
            Close
          </Button>
        </Box>
      </Modal>
    </div>
  );
};

export default ApplyLeave;
