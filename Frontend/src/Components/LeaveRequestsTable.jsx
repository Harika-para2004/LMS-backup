import React, { useEffect, useState } from "react";
import { FormGroup, FormControlLabel, Checkbox } from "@mui/material";
import { MdCheckCircle, MdCancel, MdWatchLater } from "react-icons/md";
import { useManagerContext } from "../context/ManagerContext";
import { Modal, Box, IconButton } from "@mui/material";
import {
  AiFillFilePdf,
  AiOutlineClose,
  AiOutlineExclamationCircle,
} from "react-icons/ai";
import { useLocation } from "react-router-dom";

const LeaveRequestsTable = () =>
  //   {
  //   filteredLeaveRequests,
  //   selectedFilter,
  //   handleFilterChange,
  //   handleRowClick,
  //   getDownloadLink,
  // }
  {
    const {
      modalOpen,
      setModalOpen,
      leaveRequests,
      setLeaveRequests,
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
      // userData,
      username,
      setUsername,
      role,
      setRole,
      project,
      setProject,
      leavePolicyRef,
      setLeavePolicyRef,
      selectedFilter,
      setSelectedFilter,
      navigate,
      showToast,
    } = useManagerContext();

    
    const location = useLocation();
    const [userData, setUserData] = useState(() => {
      const storedAdmin = localStorage.getItem("admin");
      return (
        location.state?.userData ||
        (storedAdmin ? { email: JSON.parse(storedAdmin), role: "Admin" } : {})
      );
    });
    // useEffect(() => {
    //   setUserData(location.state?.userData || userData);
    // })

    const fetchLeaveRequests = async () => {
      try {
        const response = await fetch(
          `http://localhost:5001/leaverequests?userRole=${userData.role}&userEmail=${userData.email}`
        );
        // console.log("user-role: ",userData.role);
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
      if (userData.email) {
        console.log("Fetching leave requests for:", userData.email);
        fetchLeaveRequests();
      }
    }, [userData.email]); // ✅ Runs whenever userData changes


    const handleFilterChange = (e) => {
      setSelectedFilter(e.target.value);
    };

    const handleCloseModal = () => {
      setModalOpen(false); // Close the modal
      setSelectedLeave(null); // Clear selected leave
    };

    const handleRowClick = (leave, index) => {
      setSelectedLeave({ ...leave, selectedIndex: index });
      setModalOpen(true); // Open the modal
    };

    // const handleApprove = async () => {
    //   if (selectedLeave) {
    //     const { selectedIndex, ...leave } = selectedLeave;

    //     // Ensure selectedIndex is valid
    //     if (
    //       selectedIndex === undefined ||
    //       !Array.isArray(leave.duration) ||
    //       leave.duration.length === 0 ||
    //       selectedIndex >= leave.duration.length
    //     ) {
    //       console.error("Invalid leave duration or selected index:", selectedLeave);
    //       return;
    //     }

    //     const leaveDuration = leave.duration[selectedIndex];
    //     const currentStatus = leave.status[selectedIndex]?.toLowerCase();

    //     // Check if leave is already approved
    //     if (!currentStatus || (currentStatus !== "pending" && currentStatus !== "rejected")) {
    //       console.log("This leave is already approved.");
    //       return;
    //     }

    //     // Fetch the policy to check maxAllowedLeaves
    //     const policy = leavePolicyRef.find(
    //       (policy) => formatCase(policy.leaveType) === formatCase(leave.leaveType)
    //     );

    //     const maxAllowedLeaves = policy?.maxAllowedLeaves ?? null; // Null means unlimited
    //     console.log("policy",policy);
    //     // Allow approval without checking availableLeaves if maxAllowedLeaves is null (unlimited leave)
    //     if (maxAllowedLeaves === null || maxAllowedLeaves === undefined || leave.availableLeaves >= leaveDuration) {
    //       const updatedLeave = {
    //         ...leave,
    //         availableLeaves: maxAllowedLeaves !== null ? leave.availableLeaves - leaveDuration : leave.availableLeaves,
    //         usedLeaves: maxAllowedLeaves !== null ? leave.usedLeaves + leaveDuration : (leave.usedLeaves || 0) + leaveDuration, // Ensure usedLeaves is tracked
    //         status: leave.status.map((stat, index) =>
    //           index === selectedIndex && (stat.toLowerCase() === "pending" || stat.toLowerCase() === "rejected")
    //             ? "Approved"
    //             : stat
    //         ),
    //       };

    //       try {
    //         const response = await fetch(
    //           `http://localhost:5001/leaverequests/${leave._id}`,
    //           {
    //             method: "PUT",
    //             headers: { "Content-Type": "application/json" },
    //             body: JSON.stringify(updatedLeave),
    //           }
    //         );

    //         if (response.ok) {
    //           const updatedLeaveFromServer = await response.json();
    //           setLeaveRequests((prevHistory) =>
    //             prevHistory.map((item) =>
    //               item._id === updatedLeaveFromServer._id ? updatedLeaveFromServer : item
    //             )
    //           );
    //           setSelectedLeave(null);
    //           setModalOpen(false);
    //           console.log("Approved and updated in the database:", updatedLeaveFromServer);
    //         } else {
    //           console.error("Failed to update leave in the database");
    //         }
    //       } catch (error) {
    //         console.error("Error updating leave in the database:", error);
    //       }
    //     } else {
    //       console.log("Not enough available leaves.");
    //     }

    //   }
    // };

    const handleApprove = async () => {
      if (selectedLeave) {
        const { selectedIndex, ...leave } = selectedLeave;

        if (
          selectedIndex === undefined ||
          !Array.isArray(leave.duration) ||
          leave.duration.length === 0 ||
          selectedIndex >= leave.duration.length
        ) {
          console.error(
            "Invalid leave duration or selected index:",
            selectedLeave
          );
          return;
        }

        // ✅ Ensure `leaveDuration` is properly formatted
        const leaveDuration = Array.isArray(leave.duration[selectedIndex])
          ? leave.duration[selectedIndex]
          : [leave.duration[selectedIndex]];

        // ✅ Sum the total leave days while preserving structure
        const totalLeaveDays = leaveDuration.reduce(
          (sum, num) =>
            sum + (Array.isArray(num) ? num.reduce((a, b) => a + b, 0) : num),
          0
        );

        if (typeof totalLeaveDays !== "number") {
          console.error("Unexpected leave duration format:", leaveDuration);
          return;
        }

        // ✅ Validate current status
        const currentStatus = leave.status[selectedIndex]?.toLowerCase();
        if (
          !currentStatus ||
          (currentStatus !== "pending" && currentStatus !== "rejected")
        ) {
          console.log("This leave is already approved.");
          return;
        }

        try {
          const policy = leavePolicyRef.find(
            (policy) =>
              formatCase(policy.leaveType) === formatCase(leave.leaveType)
          );

          const maxAllowedLeaves = policy?.maxAllowedLeaves ?? null;
          console.log("maxAllowedLeaves", maxAllowedLeaves);

          if (maxAllowedLeaves !== null) {
            if (leave.availableLeaves < totalLeaveDays) {
              showToast("Not enough available leaves.");
              return;
            }
          }
          // if (
          //   maxAllowedLeaves === null ||
          //   leave.availableLeaves >= leaveDuration
          // ) {
            const updatedLeave = {
              availableLeaves:
                maxAllowedLeaves !== null
                  ? leave.availableLeaves - leaveDuration
                  : leave.availableLeaves,
              usedLeaves:
                maxAllowedLeaves !== null
                  ? leave.usedLeaves + leaveDuration
                  : (leave.usedLeaves || 0) + leaveDuration,
              [`status.${selectedIndex}`]: "Approved", // Only update the status at selected index
            };
          // }

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
              "Approved and updated in the database:",
              updatedLeaveFromServer
            );
          } else {
            console.error("Failed to update leave in the database");
          }
        } catch (error) {
          console.error("Error updating leave in the database:", error);
        }
      }
    };

    const handleReject = async () => {
      if (selectedLeave) {
        const { selectedIndex, ...leave } = selectedLeave;

        if (
          selectedIndex === undefined ||
          !Array.isArray(leave.duration) ||
          leave.duration.length === 0 ||
          selectedIndex >= leave.duration.length
        ) {
          console.error(
            "Invalid leave duration or selected index:",
            selectedLeave
          );
          return;
        }

        const leaveDuration = leave.duration[selectedIndex];

        const wasApproved =
          leave.status[selectedIndex]?.toLowerCase() === "approved";

        const updatedLeave = {
          ...leave,
          status: leave.status.map((stat, index) =>
            index === selectedIndex &&
            (stat.toLowerCase() === "pending" ||
              stat.toLowerCase() === "approved")
              ? "Rejected"
              : stat
          ),
          availableLeaves:
            wasApproved && maxAllowedLeaves !== null
              ? leave.availableLeaves +
                leaveDuration.reduce((sum, num) => sum + num, 0)
              : leave.availableLeaves,
          usedLeaves: wasApproved
            ? leave.usedLeaves -
              leaveDuration.reduce((sum, num) => sum + num, 0)
            : leave.usedLeaves,
          duration: leave.duration.map((dur, index) =>
            index === selectedIndex ? dur : dur
          ), // ✅ Keep duration unchanged
        };

        try {
          const response = await fetch(
            `http://localhost:5001/leaverequests/${leave._id}`,
            {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(updatedLeave),
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
          } else {
            console.error("Failed to update leave status in the database");
          }
        } catch (error) {
          console.error("Error updating leave status in the database:", error);
        }
      }
    };

    // const updatedLeave = {
    //   ...leave,
    //   status: leave.status.map((stat, index) =>
    //     index === selectedIndex &&
    //     (stat.toLowerCase() === "pending" ||
    //       stat.toLowerCase() === "approved")
    //       ? "Rejected"
    //       : stat
    //   ),
    //   availableLeaves:
    //     wasApproved && maxAllowedLeaves !== null
    //       ? leave.availableLeaves + leaveDuration
    //       : leave.availableLeaves,
    //   usedLeaves:
    //     wasApproved && maxAllowedLeaves !== null
    //       ? leave.usedLeaves - leaveDuration
    //       : leave.usedLeaves,
    // };

    const filteredLeaveRequests = leaveRequests.filter((leave) =>
      selectedFilter === "All"
        ? true
        : leave.status.some(
            (status) => status.toLowerCase() === selectedFilter.toLowerCase()
          )
    );

    const getDownloadLink = (attachments) =>
      `http://localhost:5001/${attachments}`;

    // 🔹 Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10; // Show 10 leave requests per page

    const formatCase = (text) => {
      return text.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
    };

    const truncateReason = (reason) => {
      if (!reason) return "";
      const words = reason.split(" ");
      if (words.length > 2) {
        return words.slice(0, 2).join(" ") + "...";
      }
      return reason;
    };

    // 🔹 Pagination logic

    // 🔹 Filtered data based on selected filter
    const filteredData = filteredLeaveRequests.flatMap((leave) =>
      leave.startDate.map((startDate, index) => ({
        id: `${leave._id}-${index}`,
        empid: leave.empid || "N/A",
        empname: leave.empname || "N/A",
        leaveType:
          leave.leaveType.charAt(0).toUpperCase() + leave.leaveType.slice(1),
        duration: leave.duration ? leave.duration[index] : "N/A",
        applyDate: new Date(leave.applyDate[index]).toLocaleDateString("en-GB"),
        startDate: new Date(startDate).toLocaleDateString("en-GB"),
        endDate: new Date(leave.endDate[index]).toLocaleDateString("en-GB"),
        availableLeaves: leave.availableLeaves,
        document: leave.attachments?.[index]
          ? getDownloadLink(leave.attachments[index])
          : null,
        reason: leave.reason[index] === "null" ? "N/A" : leave.reason[index],
        status: leave.status[index].toLowerCase(),
        leaveData: leave,
        leaveIndex: index,
      }))
    );

    // 🔹 Apply filter
    // 🔹 Apply filter before using displayedData
    const displayedData =
      selectedFilter === "All"
        ? filteredData
        : filteredData.filter(
            (leave) => leave.status === selectedFilter.toLowerCase()
          );

    // 🔹 Pagination logic (use displayedData after it's declared)
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const sortedItems = [...displayedData]
      .filter((item) => item.startDate) // Remove invalid dates
      .sort(
        (a, b) =>
          new Date(b.startDate.split("/").reverse().join("-")) -
          new Date(a.startDate.split("/").reverse().join("-"))
      );

    const currentItems = sortedItems.slice(indexOfFirstItem, indexOfLastItem);

    // console.log(
    //   "Sorted Items:",
    //   currentItems.map((i) => i.startDate)
    // );

    const totalPages = Math.ceil(displayedData.length / itemsPerPage);

    return (
      <div>
        <div className="history-container">
          <h2 className="content-heading">Leave Requests</h2>

          {/* Filters */}
          <div className="filter-container">
            <FormGroup row sx={{ justifyContent: "flex-end" }}>
              {["All", "Pending", "Approved", "Rejected"].map((status) => (
                <FormControlLabel
                  key={status}
                  control={
                    <Checkbox
                      value={status}
                      checked={selectedFilter === status}
                      onChange={handleFilterChange}
                      sx={{
                        "&.Mui-checked": {
                          color:
                            status === "Approved"
                              ? "green"
                              : status === "Rejected"
                              ? "red"
                              : "default",
                        },
                      }}
                    />
                  }
                  label={status}
                />
              ))}
            </FormGroup>
          </div>

          {/* Leave Requests Table */}
          <table id="tb">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Leave Type</th>
                <th>Duration</th>
                <th>From</th>
                <th>To</th>
                <th>Available</th>
                <th>Document</th>
                <th>Reason</th>
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
                    <td>{leave.totalLeaves === null ? "N/A" : leave.availableLeaves}</td>
                    <td>
                      {leave.document ? (
                        <a href={leave.document} download>
                          <AiFillFilePdf size={23} color="red" />
                        </a>
                      ) : (
                        <AiOutlineExclamationCircle
                          size={23}
                          color="rgb(114,114,114)"
                        />
                      )}
                    </td>
                    <td>{truncateReason(leave.reason)}</td>
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
                    colSpan="10"
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

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="pagination">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="pagination-btn"
              >
                ◀
              </button>

              <span className="pagination-info">
                {currentPage} / {totalPages}
              </span>

              <button
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={currentPage === totalPages}
                className="pagination-btn"
              >
                ▶
              </button>
            </div>
          )}
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

            {/* Added code: Determine current status and toggle button enable/disable */}
            {selectedLeave &&
              (() => {
                // Retrieve current status using the selected index
                const currentStatus =
                  (selectedLeave.status &&
                    selectedLeave.status[selectedLeave.selectedIndex]) ||
                  "pending";

                return (
                  <div className="action-buttons">
                    <button
                      onClick={handleApprove}
                      className="approve-btn"
                      disabled={currentStatus.toLowerCase() === "approved"}
                      style={{
                        opacity:
                          currentStatus.toLowerCase() === "approved" ? 0.5 : 1,
                        cursor:
                          currentStatus.toLowerCase() === "approved"
                            ? "not-allowed"
                            : "pointer",
                      }}
                    >
                      ✅ Approve
                    </button>
                    <button
                      onClick={handleReject}
                      className="reject-btn"
                      disabled={currentStatus.toLowerCase() === "rejected"}
                      style={{
                        opacity:
                          currentStatus.toLowerCase() === "rejected" ? 0.5 : 1,
                        cursor:
                          currentStatus.toLowerCase() === "rejected"
                            ? "not-allowed"
                            : "pointer",
                      }}
                    >
                      ❌ Reject
                    </button>
                  </div>
                );
              })()}
          </Box>
        </Modal>
      </div>
    );
  };

export default LeaveRequestsTable;
