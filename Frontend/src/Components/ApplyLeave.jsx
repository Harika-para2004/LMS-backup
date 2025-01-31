import React from "react";
import {
  Grid,
  TextField,
  MenuItem,
  Button,
  Box,
  TextareaAutosize,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import dayjs from "dayjs";

// const disabledDates = ["2025-02-14", "2025-02-20", "2025-02-25"];
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
}) => {
  // const disabledDates = ["2025-02-10", "2024-02-15", "2024-02-20"];

  return (
    <div className="leave-management-container">
      <div className="apply-leave-section apply-leave-container">
        <h2 className="section-title">Apply Leave</h2>
        {/* Apply Leave form code goes here */}
        <form onSubmit={handleSubmit}  >
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
                      {leaveType.toLowerCase()
            .replace(/\b\w/g, (char) => char.toUpperCase())}
                    </MenuItem>
                  ))
                ) : (
                  <MenuItem disabled>No Leave Policies Available</MenuItem>
                )}
              </TextField>
            </Box>

            {/* From Date */}
            <Box flex={1} sx={{ml:6}}>
              <label className="field-label">
                From: <span className="req">*</span>
                <br />
              </label>
              {errors.from && <span className="req">{errors.from}</span>}
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  value={formData.startDate ? dayjs(formData.startDate) : null}
                  onChange={(newValue) =>
                    handleInputChange({
                      target: { name: "startDate", value: newValue },
                    })
                  }
                  shouldDisableDate={(date) =>
                    holidays.some((holiday) =>
                      dayjs(holiday.date).isSame(date, "day")
                    )
                  }
                  disablePast
                  renderInput={(params) => (
                    <TextField {...params} fullWidth size="small" sx={{
                      "& .MuiOutlinedInput-input": {
                        fontSize: "small", 
                      },
                    }} />
                  )}
                />
              </LocalizationProvider>
            </Box>

            {/* To Date */}
            <Box flex={1} sx={{ml:4}}>
              <label className="field-label">
                To: <span className="req">*</span>
                <br />
              </label>
              {errors.to && <span className="req">{errors.to}</span>}
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  value={formData.endDate ? dayjs(formData.endDate) : null}
                  onChange={(newValue) =>
                    handleInputChange({
                      target: { name: "endDate", value: newValue },
                    })
                  }
                  shouldDisableDate={(date) =>
                    holidays.some((holiday) =>
                      dayjs(holiday.date).isSame(date, "day")
                    )
                  }
                  minDate={
                    formData.startDate ? dayjs(formData.startDate) : dayjs()
                  }
                  disablePast
                  renderInput={(params) => (
                    <TextField {...params} fullWidth size="small" />
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

          <Box
            display="flex"
            alignItems="center"
            gap={2}
            mt={2}
          >
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
