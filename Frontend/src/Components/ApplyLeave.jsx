import React, { useEffect, useState } from "react";
import { DatePicker, PickersDay } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import dayjs from "dayjs";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faInfoCircle } from "@fortawesome/free-solid-svg-icons";
// import Tooltip from "@mui/material/Tooltip";
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
import { useManagerContext } from "../context/ManagerContext";
import axios from "axios";

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

const ApplyLeave = () =>
  //   {
  //   formData,
  //   errors,
  //   handleInputChange,
  //   handleBlur,
  //   handleSubmit,
  //   handleFileChange,
  //   holidays,
  //   getTodayDate,
  //   leavePolicies,
  //   leavePolicyRef,
  //   leaveHistory,
  //   leaveData,
  //   gender,
  // }
  {
    const [showHolidays, setShowHolidays] = useState(false);
    const [showLeavePolicies, setShowLeavePolicies] = useState(false);
    const [openDescription, setOpenDescription] = useState(false);
    const [currentDescription, setCurrentDescription] = useState("");
    const [fileName, setFileName] = useState("");
    const year = new Date().getFullYear();
    const {
      modalOpen,
      setModalOpen,
      leaveHistory,
      setLeaveHistory,
      selectedLeave,
      setSelectedLeave,
      selectedCategory,
      setSelectedCategory,
      leaveData,
      setLeaveData,
      managerEmail,
      setManagerEmail,
      email,
      setEmail,
      gender,
      setGender,
      empid,
      setEmpid,
      username,
      setUsername,
      project,
      setProject,
      designation,
      setDesignation,
      leavehistory,
      setLeavehistory,
      holidays,
      setHolidays,
      profileImage,
      setProfileImage,
      newPassword,
      setNewPassword,
      confirmPassword,
      setConfirmPassword,
      userData,
      setUserData,
      file,
      setFile,
      selectedFilter,
      setSelectedFilter,
      error,
      setError,
      leavePolicyRef,
      setLeavePolicyRef,
      mergedLeaveData,
      setMergedLeaveData,
      errors,
      setErrors,
      formData,
      setFormData,
      leavePolicies,
      setLeavePolicies,
      navigate,
      showToast,
    } = useManagerContext();

    const handleSubmit = async (event) => {
      event.preventDefault();

      const { leaveType, startDate, endDate, reason } = formData;
      const today = dayjs().format("YYYY-MM-DD");
      const startDayjs = dayjs(startDate, "DD/MM/YYYY");
      const endDayjs = dayjs(endDate, "DD/MM/YYYY");
      const formattedStartDate = startDayjs.format("YYYY-MM-DD");
      const formattedEndDate = endDayjs.format("YYYY-MM-DD");

      // **✅ Required Fields Check**
      if (!leaveType || !startDate || !endDate) {
        showToast("All fields are required.", "warning");
        return;
      }

      // **✅ Valid Date Range Check**
      if (endDayjs.isBefore(startDayjs)) {
        showToast("End Date cannot be before Start Date.", "error");
        return;
      }

      // ❌ Restrict only if Start Date or End Date is a weekend
      if (startDayjs.day() === 0 || startDayjs.day() === 6) {
        showToast("Start Date cannot be on a weekend.", "warning");
        return;
      }
      if (endDayjs.day() === 0 || endDayjs.day() === 6) {
        showToast("End Date cannot be on a weekend.", "warning");
        return;
      }
   
      let currentDate = startDayjs;

      // ✅ Loop through the date range but only check for holidays (ignore weekends in between)
      while (currentDate.isBefore(endDayjs.add(1, "day"))) {
        const isHoliday = holidays.some(
          (holiday) =>
            holiday.type === "Mandatory" &&
            dayjs(holiday.date).isSame(currentDate, "day")
        );

        currentDate = currentDate.add(1, "day"); // Move to the next day
      }

      // **✅ No Duplicate Leave Requests**
      const alreadyApplied = leaveHistory.some(
        (leave) =>
          leave.leaveType === leaveType &&
          dayjs(leave.startDate).isSame(startDayjs, "day") &&
          dayjs(leave.endDate).isSame(endDayjs, "day")
      );
      if (alreadyApplied) {
        showToast(`You have already applied for ${leaveType}.`, "info");
        return;
      }

      // **✅ Leave Balance Check**
      const appliedLeave = leaveData.find(
        (leave) => formatCase(leave.leaveType) === formatCase(leaveType)
      );

      const policy = leavePolicyRef.find(
        (policy) => formatCase(policy.leaveType) === formatCase(leaveType)
      );

      const leaveBalance =
        appliedLeave?.availableLeaves ??
        (policy?.maxAllowedLeaves !== null ? policy?.maxAllowedLeaves : null); // ✅ Preserve `null` for unlimited leaves

      // const requestedDays = endDayjs.diff(startDayjs, "day") + 1;
      // let currentDate = startDayjs;
      // Initialize requestedDays
      let requestedDays = 0;

      currentDate = startDayjs.clone();
      const endLimit = endDayjs.clone().add(1, "day"); 

      while (currentDate.isBefore(endLimit, "day")) {
        const isWeekend = currentDate.day() === 0 || currentDate.day() === 6;
        const isHoliday = holidays.some((holiday) =>
        dayjs(holiday.date, "DD-MMM-YYYY").isSame(currentDate, "day") // Corrected date format
        );

        if (!isWeekend && !isHoliday) {
          requestedDays++;
        }

        currentDate = currentDate.add(1, "day"); // Move to the next day
      }

      console.log("Final requestedDays:", requestedDays);

      if (
        leaveType.toLowerCase().includes("bereavement") &&
        requestedDays > 3
      ) {
        showToast(
          "Bereavement Leave cannot have more than 3 consecutive dates.",
          "warning"
        );
        return;
      }

      // ✅ Allow Bereavement and LOP without limit checks
      const isUnlimitedLeave =
        leaveType.toLowerCase().includes("bereavement") ||
        leaveType.toLowerCase().includes("lop");

      if (
        !isUnlimitedLeave &&
        leaveBalance !== null &&
        requestedDays > leaveBalance
      ) {
        showToast(
          `Only ${leaveBalance} ${leaveType} leaves are available.`,
          "error"
        );
        return;
      }

      // **✅ Gender-Based Leave Restrictions**

      // **✅ Sick Leave Past or Current Dates Only**
      if (leaveType === "Sick Leave" && startDayjs.isAfter(today)) {
        showToast(
          "Sick Leave can only be applied for past or current dates.",
          "warning"
        );
        return;
      }

      // **✅ LOP (Unpaid Leave) only when Casual Leaves are exhausted**
      const casualLeave = leaveData.find((leave) =>
        leave.leaveType.toLowerCase().includes("casual")
      );
      console.log("casual leaves count: ",casualLeave?.availableLeaves )

      if (
        leaveType.toLowerCase().includes("lop") &&
        (!casualLeave || casualLeave.availableLeaves > 0)
        ) {
        showToast(
          "LOP can only be applied when Casual Leaves are exhausted.",
          "info"
        );
        return;
      }

      // **✅ File Validation (New Check)**
      if (file) {
        const maxSize = 5 * 1024 * 1024; // 5MB limit
        if (file.size > maxSize) {
          showToast("File size should be less than 5MB.", "error");
          return;
        }

        const allowedTypes = ["image/png", "image/jpeg", "application/pdf"];
        if (!allowedTypes.includes(file.type)) {
          showToast("Only PNG, JPEG, or PDF files are allowed.", "error");
          return;
        }
      }

      // **✅ Proceed with submission**
      const formDataToSend = new FormData();
      formDataToSend.append("email", email);
      formDataToSend.append("empname", username);
      formDataToSend.append("empid", empid);
      formDataToSend.append("managerEmail", managerEmail);
      formDataToSend.append("leaveType", leaveType);
      formDataToSend.append("applyDate", today);
      formDataToSend.append("startDate", formattedStartDate);
      formDataToSend.append("endDate", formattedEndDate);
      if (file) formDataToSend.append("attachment", file);
      formDataToSend.append("reason", reason || "N/A");

      try {
        const response = await fetch(
          `http://localhost:5001/apply-leave?email=${encodeURIComponent(
            email
          )}`,
          { method: "POST", body: formDataToSend }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to submit form.");
        }

        showToast("Leave application submitted successfully!", "success");
        setFormData({ leaveType: "", startDate: "", endDate: "", reason: "" });
        setFile(null);
        setFileName("")
        setErrors({});
      } catch (error) {
        console.error("Error submitting form:", error);
        showToast(error.message, "error");
      }
    };

    const handleFileChange = (event) => {
      const selectedFile = event.target.files[0];
      if (selectedFile) {
        setFile(selectedFile);
      }
    };

    const getTodayDate = () => {
      const today = new Date();
      return today.toISOString().split("T")[0];
    };

    const handleBlur = (e) => {
      const { name, value } = e.target;
      if (!value || value == "Select Leave Type") {
        setErrors({
          ...errors,
          [name]: "Required field",
        });
      }
    };

    const handleInputChange = (e) => {
      const { name, value } = e.target;
      setFormData({ ...formData, [name]: value });
      if (value) {
        setErrors({
          ...errors,
          [name]: "",
        });
      }
    };

    const formatCase = (text) => {
      return text.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
    };

    const handleToggleDescription = (policy) => {
      // Check if the description exists and then set the current description
      if (policy.description && policy.description.trim() !== "") {
        setCurrentDescription(policy.description); // Set the description to show in the modal
        setOpenDescription(policy._id); // Set the policy._id to indicate which policy's description is open
      } else {
        // If no description, set a fallback text
        setCurrentDescription(
          "No description available for this leave policy."
        );
        setOpenDescription(policy._id);
      }
    };

    useEffect(() => {
      const fetchLeavePolicies = async () => {
        try {
          // Fetch leave policies (default leave types)
          const policyResponse = await axios.get(
            "http://localhost:5001/api/leave-policies"
          );
          setLeavePolicyRef(policyResponse.data.data);
          const leavePolicies = policyResponse.data.data;

          // Convert applied leave data (leaveData) into a map for easy lookup
          const appliedLeavesMap = {};
          leaveData.forEach((leave) => {
            appliedLeavesMap[leave.leaveType] = leave;
          });

          // Merge applied leaves with policies
          const finalLeaveData = leavePolicies.map((policy) => {
            if (appliedLeavesMap[policy.leaveType]) {
              return appliedLeavesMap[policy.leaveType]; // Use applied leave data
            } else {
              return {
                leaveType: policy.leaveType,
                totalLeaves: policy.maxAllowedLeaves ?? null, // ✅ Keep null for unlimited leaves (LOP, Bereavement)
                availableLeaves: policy.maxAllowedLeaves ?? null, // ✅ Keep null for unlimited leaves
              };
            }
          });

          setMergedLeaveData(finalLeaveData);
        } catch (error) {
          console.error("Error fetching leave policies:", error);
        }
      };

      fetchLeavePolicies();
    }, []);

    const handleFileChangeWithState = (event) => {
      const file = event.target.files[0];
      if (file) {
        setFileName(file.name);
      }
      handleFileChange(event);
    };

    return (
      <div className="leave-management-container">
        <div className="left-section">
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
                    {leavePolicies?.length > 0 ? (
                      leavePolicies.map((leaveType, index) => (
                        <MenuItem
                          key={index}
                          value={leaveType}
                          disabled={
                            (gender === "Male" &&
                              leaveType.toLowerCase().includes("maternity")) ||
                            (gender === "Female" &&
                              leaveType.toLowerCase().includes("paternity leave"))
                          }
                        >
                          {formatCase(leaveType)}
                        </MenuItem>
                      ))
                    ) : (
                      <MenuItem disabled>No Leave Policies Available</MenuItem>
                    )}
                  </TextField>
                </Box>

                {/* From Date */}
                <Box flex={1}>
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
                      // shouldDisableDate={(date) => {
                      //   return (
                      //     date.day() === 0 || // Disable Sundays
                      //     date.day() === 6 || // Disable Saturdays
                      //     holidays.some(
                      //       (holiday) =>
                      //         holiday.type === "Mandatory" &&
                      //         dayjs(holiday.date).isSame(date, "day")
                      //     )
                      //   );
                      // }}
                      shouldDisableDate={(date) => {
                        const today = dayjs().startOf("day"); // Get today's date
                        return (
                          (formData.leaveType.toLowerCase() === "sick leave" &&
                            dayjs(date).isAfter(today, "day")) || // Disable future dates for Sick Leave
                          date.day() === 0 || // Disable Sundays
                          date.day() === 6 || // Disable Saturdays
                          holidays.some(
                            (holiday) =>
                              holiday.type === "Mandatory" &&
                              dayjs(holiday.date).isSame(date, "day")
                          )
                        );
                      }}
                      slots={{
                        day: (props) => {
                          const { day, outsideCurrentMonth, selected } = props;
                          const holiday = holidays.find(
                            (holiday) =>
                              holiday.type === "Mandatory" &&
                              dayjs(holiday.date).isSame(day, "day")
                          );

                          return (
                            <Tooltip title={holiday ? holiday.name : ""} arrow>
                              <span>
                                <PickersDay
                                  {...props}
                                  disabled={
                                    outsideCurrentMonth || selected || !!holiday
                                  }
                                  sx={{
                                    ...(holiday && {
                                      backgroundColor: "#ffcccc", // Light red for holidays
                                      color: "#d32f2f", // Dark red text
                                      "&:hover": { backgroundColor: "#ffb3b3" },
                                    }),
                                    ...(day.day() === 0 || day.day() === 6
                                      ? {
                                          backgroundColor: "#f0f0f0", // Light gray for weekends
                                          color: "#9e9e9e",
                                        }
                                      : {}),
                                  }}
                                />
                              </span>
                            </Tooltip>
                          );
                        },
                      }}
                      renderInput={(params) => (
                        <TextField {...params} fullWidth size="small" />
                      )}
                    />
                  </LocalizationProvider>
                </Box>

                {/* To Date */}
                <Box flex={1}>
                  <label className="field-label">
                    To: <span className="req">*</span>
                    <br />
                  </label>
                  {errors.to && <span className="req">{errors.to}</span>}
                  <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <DatePicker
                      value={
                        formData.endDate
                          ? dayjs(formData.endDate, "DD/MM/YYYY")
                          : null
                      }
                      onChange={(newValue) =>
                        handleInputChange({
                          target: {
                            name: "endDate",
                            value: newValue
                              ? dayjs(newValue).format("DD/MM/YYYY")
                              : "",
                          },
                        })
                      }
                      format="DD/MM/YYYY"
                      shouldDisableDate={(date) => {
                        return (
                          date.day() === 0 || // Disable Sundays
                          date.day() === 6 || // Disable Saturdays
                          holidays.some(
                            (holiday) =>
                              holiday.type === "Mandatory" &&
                              dayjs(holiday.date).isSame(date, "day")
                          )
                        );
                      }}
                      slots={{
                        day: (props) => {
                          const { day, outsideCurrentMonth, selected } = props;
                          const holiday = holidays.find(
                            (holiday) =>
                              holiday.type === "Mandatory" &&
                              dayjs(holiday.date).isSame(day, "day")
                          );

                          return (
                            <Tooltip title={holiday ? holiday.name : ""} arrow>
                              <span>
                                <PickersDay
                                  {...props}
                                  disabled={
                                    outsideCurrentMonth || selected || !!holiday
                                  }
                                  sx={{
                                    ...(holiday && {
                                      backgroundColor: "#ffcccc", // Light red for holidays
                                      color: "#d32f2f", // Dark red text
                                      "&:hover": { backgroundColor: "#ffb3b3" },
                                    }),
                                    ...(day.day() === 0 || day.day() === 6
                                      ? {
                                          backgroundColor: "#f0f0f0", // Light gray for weekends
                                          color: "#9e9e9e",
                                        }
                                      : {}),
                                  }}
                                />
                              </span>
                            </Tooltip>
                          );
                        },
                      }}
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

              <Box display="flex" alignItems="center" gap={2} mt={2}>
                {/* Attach Button */}
                <Button
                  variant="outlined"
                  component="label"
                  className="attach-button"
                >
                  {fileName ? fileName : "Attach"}
                  <input
                    type="file"
                    name="attachment"
                    onChange={handleFileChangeWithState}
                    hidden
                    accept="image/*, .pdf"
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
            <h2 className="section-title">Holiday Calendar {year}</h2>
            {/* <hr className="holiday-divider" /> */}

            {
              // showHolidays &&
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
                          <td>
                            {holiday.date.split("-").slice(0, 2).join("-")}
                          </td>
                          <td>{holiday.day}</td>
                          <td>{formatCase(holiday.name)}</td>
                          <td>{formatCase(holiday.type)}</td>
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
            }
          </div>
        </div>

        {/* Leave Policies (Hover to Show) */}
        <div className="right-section">
          <div
            className="leave-policy-container"
            onMouseEnter={() => setShowLeavePolicies(true)}
            onMouseLeave={() => setShowLeavePolicies(false)}
          >
            <h2 className="section-title">Leave Policies</h2>
            {/* <hr className="leave-policy-divider" /> */}
            {
              // showLeavePolicies &&
              <div className="leave-policy-section apply-leave-container">
                <Grid container spacing={2} direction="column">
                  {leavePolicyRef?.length > 0 ? (
                    leavePolicyRef.map((policy, index) => (
                      <Grid
                        item
                        xs={12}
                        sm={6}
                        md={4}
                        key={policy._id || index}
                      >
                        <Card
                          sx={{
                            backgroundColor: "#f8f9fa",
                            borderRadius: "8px",
                            padding: "10px",
                          }}
                        >
                          <CardContent>
                            <Typography
                              variant="body1"
                              gutterBottom
                              sx={{
                                display: "flex",
                                alignItems: "center",
                              }} // Adjust font size
                            >
                              {formatCase(policy.leaveType)}

                              <Tooltip title="View Description" arrow>
                                <IconButton
                                  onClick={() =>
                                    handleToggleDescription(policy)
                                  }
                                  sx={{
                                    marginLeft: "6px", // Reduce space between text & icon
                                    fontSize: "10px", // Reduce icon size
                                    padding: "4px", // Reduce clickable area
                                  }}
                                >
                                  <FontAwesomeIcon
                                    size="xl"
                                    icon={faInfoCircle}
                                  />
                                </IconButton>
                              </Tooltip>
                            </Typography>

                            <Typography
                              variant="body1"
                              color="textSecondary"
                              sx={{ fontSize: "10px" }}
                            >
                              Max Allowed Leaves:{" "}
                              {policy.maxAllowedLeaves || "N/A"}
                            </Typography>
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
            }

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
                        (match, separator, char) =>
                          separator + char.toUpperCase()
                      ) // Capitalize first letter after '.', '\n'
                      .replace(/\n(?![-•])/g, "\n- ") // Add '-' at the start of every new line (if not already present)
                  }
                </Typography>

                {/* Display the description */}
                <Button
                  onClick={() => setOpenDescription(false)}
                  sx={{ mt: 2 }}
                >
                  Close
                </Button>
              </Box>
            </Modal>
          </div>
        </div>
        {/* Modal for Leave Policy Description */}
        {/* Modal for Leave Policy Description */}
      </div>
    );
  };

export default ApplyLeave;