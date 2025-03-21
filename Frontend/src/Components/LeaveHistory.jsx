import React, { useEffect, useState, useMemo } from "react";
import { AiFillFilePdf, AiOutlineExclamationCircle } from "react-icons/ai";
import { MdCheckCircle, MdCancel, MdWatchLater } from "react-icons/md";
import { FaEdit, FaTrash } from "react-icons/fa";
import CloseIcon from "@mui/icons-material/Close";
import { formatDate } from "../utils/dateUtlis";
import { PickersDay } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faInfoCircle } from "@fortawesome/free-solid-svg-icons";
import { useManagerContext } from "../context/ManagerContext";
import {
  Button,
  Select,
  MenuItem,
  FormControl,
  Stack,
  Pagination,
  Tooltip,
  TextField,
  InputAdornment,
  IconButton,
} from "@mui/material";
import { Delete, Edit, Search } from "@mui/icons-material";
import { Modal, Box, Typography } from "@mui/material";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";

const LeaveHistory = () => {
  const {
    leaveHistory,
    setLeaveHistory,
    email,
    setEmail,
    holidays,
    leaveData,
    file,
    setFile,
    leavePolicyRef,
    setLeavePolicyRef,
    errors,
    setErrors,
    showToast,
    setHolidays,
    selectedFilterHistory,
    setSelectedFilterHistory,
    leavePolicies,
    username,
    empid,
    managerEmail,
    setLeavePolicies,
  } = useManagerContext();

  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [searchQuery, setSearchQuery] = useState("");
  const [index, setIndex] = useState(null);
  const [openModal, setOpenModal] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [fileName, setFileName] = useState("");
  const [years, setYears] = useState([]);
  const [formData, setFormData] = useState({
    leaveType: "",
    applyDate: "",
    startDate: "",
    endDate: "",
    reason: "",
  });
  const [prevFormData, setPrevFormData] = useState({});

  const handleOpenModal = (leave, index) => {
    setIndex(index);
    setSelectedLeave(leave);
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setSelectedLeave(null);
  };

  const handleSubmit = async (event, leaveId) => {
    event.preventDefault();
    console.log("index", selectedLeave);
    const { leaveType, startDate, endDate, reason } = formData;
    console.log("prevFormData", prevFormData);
    console.log("formdata", formData);
    // return;
    const today = dayjs().format("YYYY-MM-DD");

    // const startDayjs = dayjs(startDate, "DD/MM/YYYY");
    // const endDayjs = dayjs(endDate, "DD/MM/YYYY");
    const startDayjs = dayjs(startDate, "YYYY-MM-DD"); // Fixed parsing
    const endDayjs = dayjs(endDate, "YYYY-MM-DD"); // Fixed parsing

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
    // const alreadyApplied = leaveHistory.some(
    //   (leave) =>
    //     leave.leaveType === leaveType &&
    //     leave.status !== "Rejected" &&
    //     dayjs(leave.startDate).isSame(startDayjs, "day") &&
    //     dayjs(leave.endDate).isSame(endDayjs, "day") &&
    //     !(
    //       leave._id === prevFormData.leaveId &&
    //       dayjs(leave.startDate).isSame(prevFormData.startDate, "day") &&
    //       dayjs(leave.endDate).isSame(prevFormData.endDate, "day")
    //     )
    // );
    // if (alreadyApplied) {
    //   showToast(`You have already applied for ${leaveType}.`, "info");
    //   return;
    // }

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
      holiday.type == "Mandatory" &&
      dayjs(holiday.date, "DD-MMM-YYYY").isSame(currentDate, "day") 
      );

      if(leaveType == "Maternity Leave"){
        requestedDays++;
      }else{
      if (!isWeekend && !isHoliday) {
        requestedDays++;
      }
    }

      currentDate = currentDate.add(1, "day"); // Move to the next day
    }
    console.log("Final requestedDays:", requestedDays);

    if (leaveType.toLowerCase().includes("bereavement") && requestedDays > 3) {
      showToast(
        "Bereavement Leave cannot have more than 3 consecutive dates.",
        "warning"
      );
      return;
    }

    if (leaveType.toLowerCase().includes("optional")) {
      // Check if start and end date are the same for Optional Holiday
      if (!startDayjs.isSame(endDayjs, "day")) {
        showToast(
          "Optional Holiday can only be applied for a single valid optional holiday.",
          "warning"
        );
        return;
      }
    
      // Check if the selected date matches any valid Optional Holiday date
      const isOptionalHolidayValid = holidays.some(
        (holiday) =>
          holiday.type === "Optional" &&
          dayjs(holiday.date, "DD-MMM-YYYY").isSame(startDayjs, "day")
      );
    
      if (!isOptionalHolidayValid) {
        showToast(
          "Optional Holiday can only be applied on valid optional holiday dates.",
          "error"
        );
        return;
      }
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
    // const casualLeave = leaveData.find((leave) =>
    //   leave.leaveType.toLowerCase().includes("casual")
    // );
    // console.log("casual leaves count: ", casualLeave?.availableLeaves);

    // if (
    //   leaveType.toLowerCase().includes("lop") &&
    //   (!casualLeave || casualLeave.availableLeaves > 0)
    // ) {
    //   showToast(
    //     "LOP can only be applied when Casual Leaves are exhausted.",
    //     "info"
    //   );
    //   return;
    // }

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
    formDataToSend.append("prevStart",prevFormData.startDate );
    formDataToSend.append("prevEnd",prevFormData.endDate );
    formDataToSend.append("prevId",prevFormData.leaveId );



    try {
      // 🛑 Ensure overlap is checked **before** deleting the old leave
      // console.log(index);
      // const overlapResponse = await fetch(
      //   `http://localhost:5001/check-overlap?email=${encodeURIComponent(
      //     email
      //   )}&newFrom=${formattedStartDate}&newTo=${formattedEndDate}&leaveId=${leaveId}&leaveType=${leaveType}&index=${index}`
      // );
      // const overlapData = await overlapResponse.json();

      // if (overlapData.hasOverlap) {
      //   showToast(overlapData.message, "warning");
      //   // return; // 🛑 Stop deletion & update if overlap exists
      // } else{
      // // ✅ Now delete the previous leave only if there is no overlap
      
      // }

      // if (prevFormData.leaveId) {
      //   console.log("Attempting to delete previous leave entry...");

      //   await handleDelete(
      //     prevFormData.leaveId,
      //     formatDate(prevFormData.startDate),
      //     formatDate(prevFormData.endDate)
      //   );
      //   console.log("Previous leave entry deleted successfully.");
      // }

      // ✅ Proceed with submission after deletion
      const response = await fetch(
        `http://localhost:5001/apply-leave?email=${encodeURIComponent(email)}`,
        { method: "POST", body: formDataToSend }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to submit form.");
      }else{
        await handleDelete(
          prevFormData.leaveId,
          formatDate(prevFormData.startDate),
          formatDate(prevFormData.endDate)
        );
      }

      showToast("Leave application updated successfully!", "success");
    } catch (error) {
      console.error("Error submitting form:", error);
      showToast(error.message, "error");
    }

    handleCloseModal();
    fetchLeavehistory();
  };

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
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

  const handleFileChangeWithState = (event) => {
    const file = event.target.files[0];
    if (file) {
      setFileName(file.name);
    }
    handleFileChange(event);
  };

  // Generate last 17 years dynamically
  const yearsRange = useMemo(() => [...years].sort((a, b) => b - a), [years]); 

  useEffect(() => {
    const fetchYears = async () => {
      try {
        const response = await fetch("http://localhost:5001/years"); // Adjust API URL if needed
        const data = await response.json();
        setYears(data.years);
      } catch (error) {
        console.error("Error fetching years:", error);
      }
    };

    fetchYears();
  }, []);



  const truncateReason = (reason) => {
    if (!reason) return "";
    const words = reason.split(" ");
    if (words.length > 3) {
      return words.slice(0, 3).join(" ") + "...";
    }
    return reason;
  };

  const formatCase = (text) => {
    return text.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const formatReason = (text) => {
    if (!text) return "";
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
  };
  const displayedData = leaveHistory
    .filter(
      (leave) =>
        selectedFilterHistory === "All" ||
        (leave.status &&
          leave.status.toString().toLowerCase() ===
            selectedFilterHistory.toLowerCase())
    )
    .filter((leave) =>
      leave.leaveType.toLowerCase().includes(searchQuery.toLowerCase())
    );

  // ✅ Correct Year Filtering: Ensure year is properly compared
  const filteredLeaves = displayedData.filter(
    (leave) => leave.year === Number(selectedYear)
  );

  filteredLeaves.sort((a, b) => {
    const dateA = new Date(a.startDate);
    const dateB = new Date(b.startDate);

    return dateB - dateA;
  });

  const handleFilterChange = (e) => {
    setSelectedFilterHistory(e.target.value);
  };

  useEffect(() => {
    setSelectedFilterHistory("All");
  }, []);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;
  const indexOfLastEmployee = currentPage * itemsPerPage;
  const indexOfFirstEmployee = indexOfLastEmployee - itemsPerPage;
  const currentItems = filteredLeaves.slice(
    indexOfFirstEmployee,
    indexOfLastEmployee
  );

  // Handle page change
  const handlePageChange = (event, value) => {
    setCurrentPage(value);
  };

  useEffect(() => {
    setCurrentPage((prevPage) => {
      const totalPages = Math.ceil(filteredLeaves.length / itemsPerPage);
      return prevPage > totalPages ? 1 : prevPage;
    });
  }, [filteredLeaves]);

  const getStatusIcon = (status) => {
    switch (status) {
      case "Pending":
        return <MdWatchLater size={21} color="blue"/>;
      case "Approved":
        return <MdCheckCircle size={21} color="green" />;
      case "Rejected":
        return <MdCancel size={21} color="red" />;
      default:
        return null;
    }
  };

  const handleDelete = async (id, startDate, endDate) => {
    if (!id || !startDate || !endDate) {
      console.error("Error: ID or startDate or endDate is undefined");
      return;
    }
    // console.log("startdate",startDate);

    try {
      const response = await fetch(`http://localhost:5001/leaves/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startDate, endDate }),
      });

      if (!response.ok) {
        throw new Error("Failed to delete leave");
      }

      // showToast("Leave deleted successfully!", "success");
      fetchLeavehistory();
    } catch (error) {
      console.error("Error deleting leave:", error);
    }
  };

  const fetchLeavehistory = async () => {
    try {
      const response = await fetch(
        `http://localhost:5001/leave-history?email=${email}&year=${selectedYear}`
      );
      if (response.ok) {
        const data = await response.json();
        setLeaveHistory(data);
      } else {
        console.error("Failed to fetch leave history");
      }
    } catch (error) {
      console.error("Error fetching leave history:", error);
    }
  };

  useEffect(() => {
    fetchLeavehistory();
  }, [email, selectedYear]);

  useEffect(() => {
    console.log("Selected Leave Data:", selectedLeave);
  }, [selectedLeave]);

  useEffect(() => {
    if (selectedLeave) {
      setFormData({
        leaveType: selectedLeave.leaveType || "",
        startDate: selectedLeave.startDate || "",
        endDate: selectedLeave.endDate || "",
        reason: selectedLeave.reason || "",
      });
      setPrevFormData({
        leaveId: selectedLeave._id || "",
        leaveType: selectedLeave.leaveType || "",
        startDate: selectedLeave.startDate || "",
        endDate: selectedLeave.endDate || "",
        reason: selectedLeave.reason || "",
      });
    }
  }, [selectedLeave]);
  const handleRemoveFile = () => {
    setFileName("");
    setFile(null);
  };
  return (
    <div className="history-container">
      {/* Year Filter Dropdown */}
      <div className="history-header">
        <h2 className="content-heading">Leave History</h2>
        <div className="legend-container" style={{ marginLeft: "10px" }}>
          <div className="legend-item">
            <MdWatchLater size={20} color="blue" /> <span>Pending</span>
          </div>
          <div className="legend-item">
            <MdCheckCircle size={20} color="green" /> <span>Approved</span>
          </div>
          <div className="legend-item">
            <MdCancel size={20} color="red" /> <span>Rejected</span>
          </div>
        </div>

        {/* Year Filter Dropdown (Top Right) */}
        <div className="year-filter">
          <TextField
            placeholder="Search here..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            variant="outlined"
            size="small"
            sx={{
              width: 200,
              bgcolor: "white",
              borderRadius: 1,
              boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.1)",
              "& .MuiOutlinedInput-root": {
                borderRadius: "8px",
                "& fieldset": { borderColor: "#ccc" },
                "&:hover fieldset": { borderColor: "#888" },
                "&.Mui-focused fieldset": { borderColor: "#555" },
              },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search sx={{ color: "#555" }} />
                </InputAdornment>
              ),
            }}
          />
          <div className="filter-container">
            <FormControl
              sx={{
                minWidth: 120,
                bgcolor: "white",
                borderRadius: 1,
                boxShadow: "0px 2px 6px rgba(0, 0, 0, 0.1)",
              }}
            >
              <Select
                value={selectedFilterHistory}
                onChange={handleFilterChange}
                displayEmpty
                sx={{
                  fontSize: "14px",
                  fontWeight: 500,
                  color: "#333",
                  borderRadius: 1,
                  height: 40,
                  px: 1.2,
                  bgcolor: "#fafafa",
                  transition: "all 0.3s ease-in-out",
                  "&:hover": { bgcolor: "#f0f0f0" },
                  "&.Mui-focused": {
                    boxShadow: "0px 3px 8px rgba(0, 0, 0, 0.2)",
                  },
                }}
              >
                {["All", "Pending", "Approved", "Rejected"].map((status) => (
                  <MenuItem
                    key={status}
                    value={status}
                    sx={{
                      fontSize: "14px",
                      px: 1.2,
                      color:
                        status === "Approved"
                          ? "green"
                          : status === "Rejected"
                          ? "red"
                          : "#333",
                      "&:hover": { bgcolor: "#f5f5f5" },
                    }}
                  >
                    {status}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </div>
          <FormControl
            sx={{
              minWidth: 85,
              bgcolor: "white",
              borderRadius: 1,
              boxShadow: "0px 2px 6px rgba(159, 50, 178, 0.2)", // Softer purple glow for elegance
              "& .MuiOutlinedInput-notchedOutline": { border: "none" }, // Removes default border
            }}
          >
            <Select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              displayEmpty
              sx={{
                fontSize: "12px",
                fontWeight: 500,
                color: "#fff",
                background: "linear-gradient(135deg, #9F32B2 0%, #6A1B9A 100%)", // Elegant gradient
                borderRadius: 1,
                height: 40, // Slightly reduced height for compact look
                px: 1.2, // Well-balanced padding
                bgcolor: "#fafafa", // Softer background
                transition: "all 0.3s ease-in-out",
                "&:hover": { bgcolor: "#f0f0f0" },
                "&.Mui-focused": {
                  background:
                    "linear-gradient(135deg, #9F32B2 0%, #6A1B9A 100%)", // Elegant gradient
                  boxShadow: "0px 3px 8px rgba(159, 50, 178, 0.3)", // Elegant focused effect
                },
              }}
            >
              {yearsRange.map((year) => (
                <MenuItem
                  key={year}
                  value={year}
                  sx={{
                    fontSize: "12px",
                    px: 1.2,
                    "&:hover": { bgcolor: "#f5e9f7" }, // Subtle hover effect
                  }}
                >
                  {year}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Leave Type</th>
            <th>From</th>
            <th>To</th>
            <th>No Of Days</th>
            <th>Reason</th>
            <th>Document</th>
            {["All", "Rejected"].includes(selectedFilterHistory) && (
              <th>Rejection Reason</th>
            )}
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {currentItems.length > 0 ? (
            currentItems
              .sort((a, b) => new Date(b.startDate) - new Date(a.startDate))
              .map((leave, index) => (
                <tr key={index}>
                  <td>{formatCase(leave.leaveType) || "N/A"}</td>
                  <td>{formatDate(leave.startDate) || "N/A"}</td>
                  <td>{formatDate(leave.endDate) || "N/A"}</td>
                  <td>{leave.duration}</td>
                  <td>
                    {" "}
                    <Tooltip
                      title={
                        leave.reason.toLowerCase() === "n/a"
                          ? "N/A"
                          : formatReason(leave.reason)
                      }
                      arrow
                    >
                      <span>
                        {leave.reason.toLowerCase() === "n/a"
                          ? "N/A"
                          : truncateReason(formatReason(leave.reason))}
                      </span>{" "}
                    </Tooltip>
                  </td>
                  <td>
                    {leave.attachments ? (
                      <a
                        href={`data:application/pdf;base64,${leave.attachments}`}
                        download={`LeaveAttachment.pdf`}
                      >
                        <AiFillFilePdf size={23} color="red" />
                      </a>
                    ) : (
                      <AiOutlineExclamationCircle size={23} color="gray" />
                    )}
                  </td>
                  {["All", "Rejected"].includes(selectedFilterHistory) && (
                    <td>
                    <Tooltip title={formatReason(leave.rejectionComment) || "N/A"} arrow>
                      <span>
                        {leave.rejectionComment.toLowerCase() !== "n/a"
                          ? leave.rejectionComment.length > 30
                            ? truncateReason(formatReason(leave.rejectionComment).substring(0, 30)) + "..."
                            : truncateReason(formatReason(leave.rejectionComment))
                          : "N/A"}
                      </span>
                    </Tooltip>
                  </td>
                  )}

                  <td>{getStatusIcon(leave.status)}</td>
                  <td>
                    <Tooltip title="Edit Leave" arrow>
                      <span>
                        <IconButton
                          onClick={() => handleOpenModal(leave, index)}
                          disabled={leave.status !== "Pending"}
                          sx={{
                            cursor:
                              leave.status !== "Pending"
                                ? "not-allowed"
                                : "pointer",
                            opacity: leave.status !== "Pending" ? 0.5 : 1,
                          }}
                        >
                            <Edit
        sx={{
          color: leave.status === "Pending" ? "#313896" : "gray",
          fontSize: 18, 
        }}
      />
                        </IconButton>
                      </span>
                    </Tooltip>

                    <Tooltip title="Delete Leave" arrow>
                      <span>
                        <IconButton
                          onClick={() =>
                            handleDelete(
                              leave._id,
                              formatDate(leave.startDate),
                              formatDate(leave.endDate)
                            )
                          }
                          disabled={leave.status !== "Pending"}
                          sx={{
                            cursor:
                              leave.status !== "Pending"
                                ? "not-allowed"
                                : "pointer",
                            opacity: leave.status !== "Pending" ? 0.5 : 1,
                          }}
                        >
                          <Delete
                            sx={{
                              color:
                                leave.status === "Pending" ? "red" : "gray",          fontSize: 18, 
                            }}
                          />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </td>
                </tr>
              ))
          ) : (
            <tr>
              <td colSpan="10" style={{ textAlign: "center" }}>
                No leave history available for {selectedYear}.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <Modal open={openModal} onClose={handleCloseModal}>
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 500,
            bgcolor: "background.paper",
            boxShadow: 24,
            p: 3,
            borderRadius: "10px",
          }}
        >
          <Typography variant="h6" sx={{ mb: 2 }}>
            Edit Leave Request
          </Typography>

          {selectedLeave && (
            <form onSubmit={(event) => handleSubmit(event, selectedLeave._id)}>
              <label className="field-label">
                Leave Type: <span className="req">*</span>
                <br />
              </label>
              {/* Leave Type */}
              <TextField
                select
                name="leaveType"
                value={formData.leaveType}
                onChange={handleInputChange}
                fullWidth
                size="small"
                variant="outlined"
                sx={{ mb: 2 }}
              >
                {leavePolicies?.length > 0 ? (
                  leavePolicies.map((leaveType, index) => (
                    <MenuItem key={index} value={leaveType}>
                      {formatCase(leaveType)}
                    </MenuItem>
                  ))
                ) : (
                  <MenuItem disabled>No Leave Policies Available</MenuItem>
                )}
              </TextField>

              <Box sx={{ display: "flex", gap: "10px" }}>
                {/* From Date */}
                <Box>
                  <label className="field-label">
                    From: <span className="req">*</span>
                    <br />
                  </label>
                  <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <DatePicker
                      value={
                        formData?.startDate ? dayjs(formData.startDate) : null
                      }
                      onChange={(newValue) =>
                        handleInputChange({
                          target: {
                            name: "startDate",
                            value: newValue
                              ? dayjs(newValue).format("YYYY-MM-DD")
                              : "",
                          },
                        })
                      }
                      format="DD/MM/YYYY"
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
                        <TextField
                          {...params}
                          fullWidth
                          size="small"
                          sx={{ mb: 2 }}
                        />
                      )}
                    />
                  </LocalizationProvider>
                </Box>
                <Box>
                  {/* To Date */}
                  <label className="field-label">
                    To: <span className="req">*</span>
                    <br />
                  </label>
                  <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <DatePicker
                      value={formData?.endDate ? dayjs(formData.endDate) : null}
                      onChange={(newValue) =>
                        handleInputChange({
                          target: {
                            name: "endDate",
                            value: newValue
                              ? dayjs(newValue).format("YYYY-MM-DD")
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
                        <TextField
                          {...params}
                          fullWidth
                          size="small"
                          sx={{ mb: 2 }}
                        />
                      )}
                    />
                  </LocalizationProvider>
                </Box>
              </Box>
              {/* Reason */}

              <label className="field-label">
                <br />
                Reason: <span className="req">*</span>
                <br />
              </label>
              <TextField
                name="reason"
                value={formData.reason}
                onChange={handleInputChange}
                multiline
                rows={2}
                fullWidth
                variant="outlined"
                sx={{ mb: 2 }}
              />

              {/* Document */}
              <Box fullWidth sx={{ display: "flex", gap: "10px", mt: 2 }}>
  <Button
    fullWidth
    variant="outlined"
    component="label"
    sx={{
      color: "#313896",
      borderColor: "#313896",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      textTransform: "none", // To prevent text from changing height due to capitalization
      padding: "6px 12px", // Ensures consistent padding
    }}
  >
    <Tooltip title={fileName.length > 22 ? fileName : ""}>
      <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
        {fileName
          ? fileName.length > 22
            ? `${fileName.substring(0, 22)}...`
            : fileName
          : "Attach Document"}
      </span>
    </Tooltip>
    <input
      type="file"
      name="attachment"
      onChange={handleFileChangeWithState}
      hidden
      accept=".pdf"
    />
    {fileName && (
      <IconButton
        onClick={handleRemoveFile}
        sx={{
          color: "red",
          padding: "4px", // Reduce padding to prevent affecting button height
        }}
      >
        <CloseIcon fontSize="small" />
      </IconButton>
    )}
  </Button>

  <Button
    fullWidth
    type="submit"
    variant="contained"
    sx={{ bgcolor: "#313896" }}
  >
    Save Changes
  </Button>
</Box>
            </form>
          )}
        </Box>
      </Modal>

      <Stack spacing={2} sx={{ mt: 2, display: "flex", alignItems: "center" }}>
        <Pagination
          count={Math.ceil(filteredLeaves.length / itemsPerPage)}
          page={currentPage}
          onChange={handlePageChange}
          color="primary"
        />
      </Stack>
    </div>
  );
};

export default LeaveHistory;