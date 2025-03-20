import React, { useEffect, useState, useMemo } from "react";
import {
  FormGroup,
  FormControlLabel,
  Checkbox,
  FormControl,
  Stack,
  Pagination,
  Tooltip,
  InputAdornment,
  TextField,
} from "@mui/material";
import { MdCheckCircle, MdCancel, MdWatchLater } from "react-icons/md";
import { useManagerContext } from "../context/ManagerContext";
import { Modal, Box, IconButton } from "@mui/material";
import { Button, Select, MenuItem } from "@mui/material";
import { BASE_URL } from "../Config";
import {
  AiFillFilePdf,
  AiOutlineClose,
  AiOutlineExclamationCircle,
} from "react-icons/ai";
import { useLocation } from "react-router-dom";
import { FaSearch } from "react-icons/fa";
import { Search } from "@mui/icons-material";

const LeaveRequestsTable = () => {
  const {
    modalOpen,
    setModalOpen,
    leaveRequests,
    setLeaveRequests,
    selectedLeave,
    setSelectedLeave,
    selectedFilter,
    setSelectedFilter,
    email,
    role,
    showToast,
  } = useManagerContext();
  const [searchQuery, setSearchQuery] = useState("");
  const [years, setYears] = useState([]);
  const location = useLocation();
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const admincred = localStorage.getItem("admin");
  const [rejectionComment, setRejectionComment] = useState("");
  const [showCommentBox, setShowCommentBox] = useState(false);

  
  const handleRejectClick = () => {
    setShowCommentBox(true); // Show comment box when rejecting
  };

  const handleConfirmReject = () => {
    if (!rejectionComment.trim()) {
      alert("Please enter a comment before rejecting.");
      return;
    }
    handleReject(rejectionComment); // Pass comment to reject function
    setRejectionComment("");
    setShowCommentBox(false);
  };
  // console.log("admincred",admincred);
  const [userData, setUserData] = useState(() => {
    const storedAdmin = localStorage.getItem("admin");
    return (
      (storedAdmin ? { email: JSON.parse(storedAdmin), role: "Admin" } : {}) ||
      location.state?.userData ||
      {}
    );
  });

  // Effect to update userData when location.state or localStorage changes
  useEffect(() => {
    const storedAdmin = localStorage.getItem("admin");

    if (storedAdmin) {
      setUserData({ email: JSON.parse(storedAdmin), role: "Admin" });
    } else if (location.state?.userData) {
      setUserData(location.state.userData);
    } else {
      setUserData({});
    }
  }, [location.state?.userData, localStorage.getItem("admin")]);

  // const fetchLeaveRequests = async () => {
  //   try {
  //     const response = await fetch(
  //       `http://localhost:5001/leaverequests?userRole=${userData.role}&userEmail=${userData.email}&year=${selectedYear}`
  //     );
  //     if (response.ok) {
  //       const data = await response.json();
  //       const sortedData = data.sort(
  //         (a, b) => new Date(b.applyDate) - new Date(a.applyDate)
  //       );
  //       setLeaveRequests(sortedData);
  //     } else {
  //       console.error("Failed to fetch leave history");
  //     }
  //   } catch (error) {
  //     console.error("Error fetching leave history:", error);
  //   }
  // };

  // useEffect(() => {
  //   if (userData.role !== "Admin" && userData.email && selectedYear && userData.role === "Manager" ) {
  //     console.log(`Fetching leave requests for ${userData.email} in ${selectedYear} role is ${userData.role}`);
  //     fetchLeaveRequests();
  //   }
  // }, [userData.email, selectedYear,userData.role]);

  const fetchLeaveRequestsAdmin = async () => {
    const userDataResponse = await fetch(
      `${BASE_URL}api/auth/user/${userData.userId}`
    );
    const excludeEmail = "Admin"; // Replace with the email to exclude
    try {
      const response = await fetch(`http://localhost:5001/leaverequests`);
      if (response.ok) {
        const data = await response.json();
        const filteredData = data.filter((item) => item.role !== excludeEmail); // Filter out records with the given email
        setLeaveRequests(filteredData); // Update state with filtered data
      } else {
        console.error("Failed to fetch leave history");
      }
    } catch (error) {
      console.error("Error fetching leave history:", error);
    }
  };

  useEffect(() => {
    if (admincred && selectedYear) fetchLeaveRequestsAdmin();
  }, [admincred, selectedYear]);
  const fetchLeaveRequests = async () => {
    try {
      const response = await fetch(
        `http://localhost:5001/leaverequests?userRole=${role}&userEmail=${email}&year=${selectedYear}`
      );
      if (response.ok) {
        const data = await response.json();
        const sortedData = data.sort(
          (a, b) => new Date(b.applyDate) - new Date(a.applyDate)
        );
        setLeaveRequests(sortedData);
      } else {
        console.error("Failed to fetch leave history");
      }
    } catch (error) {
      console.error("Error fetching leave history:", error);
    }
  };

  useEffect(() => {
    if (email && selectedYear && role) {
      console.log(
        `Fetching leave requests for ${email} in ${selectedYear} role is ${role}`
      );
      fetchLeaveRequests();
    }
  }, [email, selectedYear, role]);

  const handleFilterChange = (e) => {
    setSelectedFilter(e.target.value);
  };

  useEffect(() => {
    setSelectedFilter("Pending");
  },[])

  const handleCloseModal = () => {
    setModalOpen(false); // Close the modal
    setRejectionComment("");
    setShowCommentBox(false)
    setSelectedLeave(null); // Clear selected leave
    
  };
  const handleRowClick = (leave, index) => {
    setSelectedLeave({ ...leave, selectedIndex: index });
    setModalOpen(true); // Open the modal
  };
  const handleApprove = async () => {
    if (selectedLeave) {
      const { selectedIndex, ...leave } = selectedLeave;
      if (
        selectedIndex === undefined ||
        !Array.isArray(leave.duration) ||
        leave.duration.length === 0 ||
        selectedIndex >= leave.duration.length
      ) {
        console.error("Invalid leave duration or selected index:", selectedLeave);
        return;
      }
  
      const leaveDuration = Array.isArray(leave.duration[selectedIndex])
        ? leave.duration[selectedIndex]
        : [leave.duration[selectedIndex]];
  
      const totalLeaveDays = leaveDuration.reduce(
        (sum, num) =>
          sum + (Array.isArray(num) ? num.reduce((a, b) => a + b, 0) : num),
        0
      );
  
      if (typeof totalLeaveDays !== "number") {
        console.error("Unexpected leave duration format:", leaveDuration);
        return;
      }
  
      const currentStatus = leave.status[selectedIndex]?.toLowerCase();
      if (!currentStatus || (currentStatus !== "pending" && currentStatus !== "rejected")) {
        console.log("This leave is already approved.");
        return;
      }
  
      if (leave.totalLeaves && leave.availableLeaves < totalLeaveDays) {
        showToast("Not enough available leaves.");
        return;
      }

  
      let chilNumber = null;
  
      // Fetch maternity leave limits if applicable
      if (leave.leaveType === "Maternity Leave") {
        try {
          const response = await fetch(`http://localhost:5001/maternity-limit`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: leave.email, leaveType: "Maternity Leave", continous: leave.continous }),
          });
          
          if (!response.ok) {
            console.error("Server error:", response.status, await response.text());
            return;
          }
          
          const data = await response.json();
          console.log("Mat Response:", data.totalSplits, "Child Number:", data.chilNumber);
          
          chilNumber = data.chilNumber; // Use the fetched child number
       
        } catch (error) {
          console.error("Error getting maternity limit:", error);
          return;
        }
      }
  if(chilNumber>2 && totalLeaveDays>84){
    showToast("Not enough available leaves.");
        return;
  }
      // Validation for Paternity Leave and Adoption Leave (Max 2 splits)
      if (leave.leaveType === "Paternity Leave" || leave.leaveType === "Adoption Leave") {
        let approvedCount = leave.status.filter((status) => status === "Approved").length;
        if (approvedCount >= 2) {
          showToast("Exceeding maximum splits.");
          return;
        }
      }
  
      // Construct updated leave data
      const updatedLeave = {
        availableLeaves: leave.totalLeaves === 0 ? 0 : leave.availableLeaves - totalLeaveDays,
        usedLeaves: leave.usedLeaves + totalLeaveDays,
        [`status.${selectedIndex}`]: "Approved",
        [`rejectionComment.${selectedIndex}`]: "",
        ...(leave.leaveType === "Maternity Leave" ? { childNumber: chilNumber } : {}),  // ✅ Properly assigning chilNumber
      };
      
  
      // Update leave record in the backend
      try {
        const response = await fetch(`http://localhost:5001/leaverequests/${leave._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ $set: updatedLeave }), // ✅ Use `$set` to prevent modifying `duration`
        });
  
        if (response.ok) {
          const updatedLeaveFromServer = await response.json();
          console.log("Updated leave:", updatedLeaveFromServer);
  
          setLeaveRequests((prevHistory) =>
            prevHistory.map((item) =>
              item._id === updatedLeaveFromServer._id ? updatedLeaveFromServer : item
            )
          );
  
          setSelectedLeave(null);
          setModalOpen(false);
          console.log("Approved and updated in the database:", updatedLeaveFromServer);
          fetchLeaveRequests();
        } else {
          console.error("Failed to update leave in the database");
        }
      } catch (error) {
        console.error("Error updating leave in the database:", error);
      }
    }
  };
  
  const handleReject = async (comment) => {
    if (selectedLeave) {
      const { selectedIndex, ...leave } = selectedLeave;
  
      if (
        selectedIndex === undefined ||
        !Array.isArray(leave.duration) ||
        leave.duration.length === 0 ||
        selectedIndex >= leave.duration.length
      ) {
        console.error("Invalid leave duration or selected index:", selectedLeave);
        return;
      }
  
      // Extract the leave duration for the selected index
      const leaveDuration = Array.isArray(leave.duration[selectedIndex])
        ? leave.duration[selectedIndex]
        : [leave.duration[selectedIndex]];
  
      const totalLeaveDays = leaveDuration.reduce(
        (sum, num) =>
          sum + (Array.isArray(num) ? num.reduce((a, b) => a + b, 0) : num),
        0
      );
  
      if (typeof totalLeaveDays !== "number") {
        console.error("Unexpected leave duration format:", leaveDuration);
        return;
      }
  
      const currentStatus = leave.status[selectedIndex]?.toLowerCase();
      if (
        !currentStatus ||
        (currentStatus !== "pending" && currentStatus !== "approved")
      ) {
        console.log("This leave is already rejected.");
        return;
      }
  
      const wasApproved = currentStatus === "approved";
  
      const updatedLeave = {
        availableLeaves:
          wasApproved && leave.totalLeaves
            ? leave.availableLeaves + totalLeaveDays
            : leave.availableLeaves,
        usedLeaves: wasApproved
          ? leave.usedLeaves - totalLeaveDays
          : leave.usedLeaves,
        [`status.${selectedIndex}`]: "Rejected", // ✅ Only update the status at selected index
        [`rejectionComment.${selectedIndex}`]: comment, // ✅ Add the rejection comment
      };
  
      try {
        const response = await fetch(
          `http://localhost:5001/leaverequests/${leave._id}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ $set: updatedLeave }), // ✅ Use `$set` to prevent modifying `duration`
          }
        );
  
        if (response.ok) {
          const updatedLeaveFromServer = await response.json();
          setLeaveRequests((prevHistory) =>
            prevHistory.map((item) =>
              item._id === updatedLeaveFromServer._id
                ? updatedLeaveFromServer
                : item
            )
          );
          setSelectedLeave(null);
          setModalOpen(false);
          console.log(
            "Rejected and updated in the database:",
            updatedLeaveFromServer
          );
          fetchLeaveRequests();
        } else {
          console.error("Failed to update leave status in the database");
        }
      } catch (error) {
        console.error("Error updating leave status in the database:", error);
      }
    }
  };
  
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

  const filteredLeaves = leaveRequests.filter((leave) => {
    const yearValues = leave.year.flat(2); // Flatten nested arrays
    return yearValues.includes(Number(selectedYear)); // Check if selectedYear exists in the array
  });

  const filteredLeaveRequests = leaveRequests.filter((leave) =>
    selectedFilter === "All"
      ? true
      : leave.status.some(
          (status) => status.toLowerCase() === selectedFilter.toLowerCase()
        )
  );

  const getDownloadLink = (attachments) =>
    `http://localhost:5001/${attachments}`;

  const formatCase = (text) => {
    return text.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
  };
  const truncateReason = (reason) => {
    if (!reason) return "";
    const words = reason.split(" ");
    if (words.length > 3) {
      return words.slice(0, 3).join(" ") + "...";
    }
    return reason;
  };

  const formatReason = (text) => {
    if (!text) return "";
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
  };

  const filteredData = filteredLeaves.flatMap((leave) =>
    leave.startDate.map((startDate, index) => ({
      id: `${leave._id}-${index}`,
      empid: leave.empid || "N/A",
      empname: leave.empname || "N/A",
      role:leave.role,
    managerEmail: leave.managerEmail || "N/A",

      leaveType:
        leave.leaveType.charAt(0).toUpperCase() + leave.leaveType.slice(1),
      duration: leave.duration ? leave.duration[index] : "N/A",
      applyDate: new Date(leave.applyDate[index]).toLocaleDateString("en-GB"),
      startDate: new Date(startDate).toLocaleDateString("en-GB"),
      endDate: new Date(leave.endDate[index]).toLocaleDateString("en-GB"),
      availableLeaves: leave.availableLeaves,
      document: leave.attachments?.[index] ? leave.attachments[index] : null,
      reason: leave.reason[index] === "null" ? "N/A" : leave.reason[index],
      status: leave.status[index].toLowerCase(),
      rejectionComment:leave.rejectionComment[index] || "N/A",
      leaveData: leave,
      leaveIndex: index,
    }))
  );

  // 🔹 Apply filter
  // 🔹 Apply filter before using displayedData
  // const displayedData =
  //   selectedFilter === "All"
  //     ? filteredData
  //     : filteredData.filter(
  //         (leave) => leave.status === selectedFilter.toLowerCase()
  //       );
  const displayedData = filteredData
    .filter(
      (leave) =>
        selectedFilter === "All" ||
        leave.status === selectedFilter.toLowerCase()
    )
    .filter(
      (leave) =>
        leave.role!=="Admin"&&
        leave.empname.toLowerCase().includes(searchQuery.toLowerCase()) ||
        leave.empid.toString().includes(searchQuery) ||
        leave.leaveType.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const sortedItems = [...displayedData]
    .filter((item) => item.startDate) 
    .sort(
      (a, b) =>
        new Date(b.startDate.split("/").reverse().join("-")) -
        new Date(a.startDate.split("/").reverse().join("-"))
    );

  // 🔹 Pagination logic (use displayedData after it's declared)
  // const [currentPage, setCurrentPage] = useState(1);
  // const itemsPerPage = 15;
  // const indexOfLastItem = currentPage * itemsPerPage;
  // const indexOfFirstItem = indexOfLastItem - itemsPerPage;

  // const currentItems = sortedItems.slice(indexOfFirstItem, indexOfLastItem);

  // const totalPages = Math.ceil(displayedData.length / itemsPerPage);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // Calculate the indexes for slicing the data
  const indexOfLastEmployee = currentPage * itemsPerPage;
  const indexOfFirstEmployee = indexOfLastEmployee - itemsPerPage;
  const currentItems = sortedItems.slice(
    indexOfFirstEmployee,
    indexOfLastEmployee
  );

  // Handle page change
  const handlePageChange = (event, value) => {
    setCurrentPage(value);
  };

  useEffect(() => {
    setCurrentPage((prevPage) => {
      const totalPages = Math.ceil(sortedItems.length / itemsPerPage);
      return prevPage > totalPages ? 1 : prevPage;
    });
  }, [sortedItems]);

  return (
    <div>
      <div className="history-container">
        <div className="history-header">
          <h2 className="content-heading">Leave Requests</h2>
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
          <div className="year-filter">
            {/* <input
              type="text"
              placeholder="Search here..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                padding: "8px 12px",
                borderRadius: "5px",
                border: "1px solid #ccc",
                fontSize: "14px",
                width: "180px",
                boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.1)",
              }}
            /> */}
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
            {/* Filters */}
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
                  value={selectedFilter}
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
            {/* year filter */}
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
                  background:
                    "linear-gradient(135deg, #9F32B2 0%, #6A1B9A 100%)", // Elegant gradient
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
                      "&:hover": { bgcolor: "#f5e9f7" },
                    }}
                  >
                    {year}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </div>
        </div>

        {/* Leave Requests Table */}
        <table id="tb">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Leave Type</th>
              <th>No Of Days</th>
              <th>From</th>
              <th>To</th>
              <th>Available</th>
              <th>Document</th>
              <th>Reason</th>
              {["All", "Rejected"].includes(selectedFilter) && <th>Rejection Reason</th>}
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.length > 0 ? (
              
              currentItems.map((leave) => (
                <tr key={leave.id}>
                  <td>{leave.empid}</td>
                  <td>{formatCase(leave.empname)}</td>
                  <td>{formatCase(leave.leaveType)}</td>
                  <td>{leave.duration}</td>
                  <td>{leave.startDate}</td>
                  <td>{leave.endDate}</td>
                  <td>{leave.availableLeaves ? leave.availableLeaves : "-"}</td>
                  <td>
                    {leave.document && leave.document.trim() !== "" ? (
                      <a
                        href={`data:application/pdf;base64,${leave.document}`}
                        download={`LeaveAttachment_${leave.empid}.pdf`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <AiFillFilePdf size={23} color="red" />
                      </a>
                    ) : (
                      <AiOutlineExclamationCircle
                        size={23}
                        color="rgb(114,114,114)"
                      />
                    )}
                  </td>

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
                  {["All", "Rejected"].includes(selectedFilter) && (
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
             <td>
                    {leave.status === "approved" && (
                      <button
                        onClick={() =>
                          handleRowClick(leave.leaveData, leave.leaveIndex)
                        }
                        style={{
                          color: "green",
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                        }}
                      >
                        <MdCheckCircle size={24} />
                      </button>
                    )}
                    {leave.status === "rejected" && (
                      <button
                        onClick={() =>
                          handleRowClick(leave.leaveData, leave.leaveIndex)
                        }
                        style={{
                          color: "red",
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                        }}
                      >
                        <MdCancel size={24} />
                      </button>
                    )}
                    {leave.status !== "approved" &&
                      leave.status !== "rejected" && (
                        <button
                          onClick={() =>
                            handleRowClick(leave.leaveData, leave.leaveIndex)
                          }
                          style={{
                            color: "blue",
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                          }}
                        >
                          <MdWatchLater size={24} />
                        </button>
                      )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="12"
                  style={{
                    textAlign: "center",
                    padding: "15px",
                    color: "#555",
                  }}
                >
                  No leave requests found
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <Stack
          spacing={2}
          sx={{ mt: 2, display: "flex", alignItems: "center" }}
        >
          <Pagination
            count={Math.ceil(sortedItems.length / itemsPerPage)}
            page={currentPage}
            onChange={handlePageChange}
            color="primary"
          />
        </Stack>
      </div>
      <Modal open={modalOpen} onClose={handleCloseModal}>
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 400,
          bgcolor: "background.paper",
          boxShadow: 24,
          p: 4,
          borderRadius: "10px",
          textAlign: "center",
        }}
      >
        {/* Close Icon */}
        <IconButton
          onClick={handleCloseModal}
          sx={{
            position: "absolute",
            top: 10,
            right: 10,
            color: "gray",
            "&:hover": { color: "black" },
          }}
        >
          <AiOutlineClose size={24} />
        </IconButton>
        <h3 style={{ marginBottom: "20px" }}>Approve or Reject Request?</h3>

        {selectedLeave && (() => {
          const currentStatus =
            (selectedLeave.status &&
              selectedLeave.status[selectedLeave.selectedIndex]) ||
            "pending";

          return (
            <div className="action-buttons">
              <Button
                onClick={handleApprove}
                variant="outlined"
                color="success"
                disabled={currentStatus.toLowerCase() === "approved"}
                sx={{
                  opacity: currentStatus.toLowerCase() === "approved" ? 0.5 : 1,
                  cursor: currentStatus.toLowerCase() === "approved" ? "not-allowed" : "pointer",
                  marginRight: "10px",
                  "&:hover": {
                    borderColor: "green", 
                  },
                }}
              >
              Approve
              </Button>

              <Button
                onClick={handleRejectClick}
                variant="outlined"
                color="error"
                disabled={currentStatus.toLowerCase() === "rejected"}
                sx={{
                  opacity: currentStatus.toLowerCase() === "rejected" ? 0.5 : 1,
                  cursor: currentStatus.toLowerCase() === "rejected" ? "not-allowed" : "pointer",
                  "&:hover": {
                    borderColor: "red", 
                  },
                }}
              >
               Reject
              </Button>
            </div>
          );
        })()}

        {/* Comment Box for Rejection */}
        {showCommentBox && (
          <div style={{ marginTop: "20px" }}>
            <TextField
              label="Enter Rejection Comment"
              multiline
              rows={3}
              fullWidth
              variant="outlined"
              value={rejectionComment}
              onChange={(e) => setRejectionComment(e.target.value)}
            />
            <Button
              onClick={handleConfirmReject}
              variant="contained"
              color="error"
              sx={{ marginTop: "10px" }}
            >
              Confirm Reject
            </Button>
          </div>
        )}
      </Box>
    </Modal>
    </div>
  );
};

export default LeaveRequestsTable;