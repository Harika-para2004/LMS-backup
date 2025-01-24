import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import logo from "./../assets/img/logo.jpg";
import { Modal, Box } from "@mui/material";

import {
  TextField,
  MenuItem,
  Button,
  TextareaAutosize,
  Typography,
} from "@mui/material";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChartLine,
  faPaperPlane,
  faCalendarPlus,
  faCalendarCheck, faFileAlt,
  faHistory,
  faUser,
  faSignOutAlt,
  faUserCircle,
  faKey,
} from "@fortawesome/free-solid-svg-icons";
function LeaveRequests() {
  const [modalOpen, setModalOpen] = useState(false);
  const [leaveHistory, setLeaveHistory] = useState([]);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("dashboard");
  const [leaveData, setLeaveData] = useState([]);
  const [email, setEmail] = useState("");
  const [leavehistory, setLeavehistory] = useState([]);
  const [holidays, setHolidays] = useState([]);
  useEffect(() => {
    const fetchHolidays = async () => {
      try {
        const response = await fetch("http://localhost:5001/holidays");
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        setHolidays(data); 
      } catch (error) {
        console.error("Error fetching holidays:", error);
        setError("Failed to fetch holidays.");
      }
    };
  
    fetchHolidays();
  }, []);
  const fetchLeavehistory = async () => {
    try {
      const response = await fetch(`http://localhost:5001/leave-history?email=${email}`);
      if (response.ok) {
        const data = await response.json();
        setLeavehistory(data);
      } else {
        console.error("Failed to fetch leave history");
      }
    } catch (error) {
      console.error("Error fetching leave history:", error);
    }
  };

  useEffect(() => {
    if (selectedCategory === "history") {
      fetchLeavehistory();
    }
  }, [selectedCategory]);
  const [formData, setFormData] = useState({
    leaveType: "",
    startDate: "",
    endDate: "",
    reason: "",
  });
  const fetchLeaveHistory = async () => {
    const excludeEmail = "manager@gmail.com"; // Replace with the email to exclude
    try {
      const response = await fetch("http://localhost:5001/leaverequests");
      if (response.ok) {
        const data = await response.json();
        const filteredData = data.filter((item) => item.email !== excludeEmail); // Filter out records with the given email
        setLeaveHistory(filteredData); // Update state with filtered data
      } else {
        console.error("Failed to fetch leave history");
      }
    } catch (error) {
      console.error("Error fetching leave history:", error);
    }
  };
  
  useEffect(() => {
    const storedUserData = JSON.parse(localStorage.getItem("userData"));
    if (storedUserData) {
     
      setEmail(storedUserData.email || "");
      
    }
  }, []);

  useEffect(() => {
    if (email) {
      const fetchLeaveData = async () => {
        try {
          const response = await fetch(`http://localhost:5001/leavesummary?email=${email}`);
          if (response.ok) {
            const data = await response.json();
            setLeaveData(data);
          } else {
            console.error("Failed to fetch leave data");
          }
        } catch (error) {
          console.error("Error fetching leave data:", error);
        }
      };
      fetchLeaveData();
    }
  }, [email]);
  
  
  useEffect(() => {
    fetchLeaveHistory();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const { leaveType, applyDate, startDate, endDate, reason } = formData;

    // Check for missing required fields
    if (!leaveType  || !startDate || !endDate ) {
      setErrors({
        leaveType: leaveType ? "" : "Required field",
        from: startDate ? "" : "Required field",
        to: endDate ? "" : "Required field",

      });
      return;
    }

    // Check if end date is before start date
    if (new Date(endDate) < new Date(startDate)) {
      setErrors((prevErrors) => ({
        ...prevErrors,
        to: "End Date cannot be before Start Date",
      }));
      return;
    }

    // Prepare form data
    const formDataToSend = new FormData();
    formDataToSend.append("email", email);
    formDataToSend.append("leaveType", leaveType);
    formDataToSend.append("applyDate", applyDate);
    formDataToSend.append("startDate", startDate);
    formDataToSend.append("endDate", endDate);

    if(reason){
      formDataToSend.append("reason", reason);

    }

    try {
      const response = await fetch(
        `http://localhost:5001/apply-leave?email=${email}`,
        {
          method: "POST",
          body: formDataToSend,
        }
      );

      if (!response.ok) {
        throw new Error("Failed to submit form. Please try again later.");
      }

      const result = await response.json();
      alert(result.message);
    } catch (error) {
      console.error("Error submitting form:", error);
      alert("An error occurred while submitting the form.");
    }
  };
  const handleReject = async () => {
    if (selectedLeave) {
      const { selectedIndex, ...leave } = selectedLeave;
  
      const updatedLeave = {
        ...leave,
        status: leave.status.map((stat, index) =>
          index === selectedIndex && stat === "pending" ? "Rejected" : stat
        ),
      };
  
      try {
        const response = await fetch(
          `http://localhost:5001/leaverequests/${leave._id}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(updatedLeave),
          }
        );
  
        if (response.ok) {
          const updatedLeaveFromServer = await response.json();
          setLeaveHistory((prevHistory) =>
            prevHistory.map((item) =>
              item._id === updatedLeaveFromServer._id
                ? updatedLeaveFromServer
                : item
            )
          );
          setSelectedLeave(null); // Close the selected leave details
          setModalOpen(false); // Close the modal

          console.log("Rejected and updated in the database:", updatedLeaveFromServer);
        } else {
          console.error("Failed to update leave status in the database");
        }
      } catch (error) {
        console.error("Error updating leave status in the database:", error);
      }
    }
  };
  
  const handleApprove = async () => {
    if (selectedLeave) {
      const { selectedIndex, ...leave } = selectedLeave;
      const updatedLeave = {
        ...leave,
        availableLeaves: leave.availableLeaves - 1,
        usedLeaves: leave.usedLeaves + 1,
        status: leave.status.map((stat, index) =>
          index === selectedIndex && stat === "pending" ? "Approved" : stat
        ),
      };

      try {
        const response = await fetch(
          `http://localhost:5001/leaverequests/${leave._id}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(updatedLeave),
          }
        );

        if (response.ok) {
          const updatedLeaveFromServer = await response.json();
          setLeaveHistory((prevHistory) =>
            prevHistory.map((item) =>
              item._id === updatedLeaveFromServer._id
                ? updatedLeaveFromServer
                : item
            )
          );
          setSelectedLeave(null);
          setModalOpen(false)
          console.log("Approved and updated in the database:", updatedLeaveFromServer);
        } else {
          console.error("Failed to update leave in the database");
        }
      } catch (error) {
        console.error("Error updating leave in the database:", error);
      }
    }
  };

  const handleRowClick = (leave, index) => {
    setSelectedLeave({ ...leave, selectedIndex: index });
    setModalOpen(true); // Open the modal

  };
  const handleCloseModal = () => {
    setModalOpen(false); // Close the modal
    setSelectedLeave(null); // Clear selected leave
  };
  const defaultLeaveData = [
    { leaveType: "sick", availableLeaves: 14, totalLeaves: 14 },
    { leaveType: "maternity", availableLeaves: 26, totalLeaves: 26 },
    { leaveType: "paternity ", availableLeaves: 10, totalLeaves: 10 },
    { leaveType: "adoption Leave", availableLeaves: 10, totalLeaves: 10 },
    { leaveType: "bereavement", availableLeaves: 3, totalLeaves: 3 },
    { leaveType: "Compensatory Off", availableLeaves: 3, totalLeaves: 3 },
    { leaveType: "Loss of Pay (LOP)", availableLeaves: 3, totalLeaves: 3 },
  ];
  
  const mergedLeaveData = defaultLeaveData.map(defaultLeave => {
    const leaveFromDB = leaveData.find(leave => leave.leaveType === defaultLeave.leaveType);
    return leaveFromDB ? leaveFromDB : defaultLeave;
  });

  const renderContent = () => {
    switch (selectedCategory) {
      case "dashboard":
        return  <div>
         <div className="leave-types-container">
         <h2 style={{ textAlign: 'center',marginTop:'-30px' }} className="leavebalance">Leave Balances</h2>
         <div className="leave-cards">
              {mergedLeaveData.map((leave, index) => (
      <div key={index} className="leave-card">
        <div className="leave-card-header">
          <h3 className="leave-type">{leave.leaveType}</h3>
        </div>
        <div className="leave-count">
          <div className="count-item">
            <span className="count-number">{leave.availableLeaves}</span>
            <span className="count-label">Available</span>
          </div>
          <div className="count-item">
            <span className="count-number">{leave.totalLeaves}</span>
            <span className="count-label">Total</span>
          </div>
        </div>
      </div>
    ))}
              </div>
            </div>
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
                <td>{holiday.date}</td>
                <td>{holiday.day}</td>
                <td>{holiday.name}</td>
                <td>{holiday.type}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="4">No holidays found.</td>
            </tr>
          )}
        </tbody>
      </table>
      
</div>;
      case "apply-leave":
        return (
          <div className="apply-leave-container">
            <h2>Apply Leave</h2>
            <form onSubmit={handleSubmit}>
              <label>
                Leave Type:
                <select name="leaveType" value={formData.leaveType} onChange={handleInputChange}>
  <option value="">Select Leave Type</option>
  <option value="sick">Sick/casual/Earned Leave</option>
  <option value="maternity">Maternity Leave</option>
  <option value="paternity">Paternity Leave</option>
  <option value="adoption">Adoption Leave</option>
  <option value="bereavement">Bereavement Leave</option>
  <option value="compensatory">Compensatory Off</option>
  <option value="lop">Loss of Pay (LOP)</option>
</select>

              </label>
              <br />
            
              <label>
                From Date:
                <input type="date" name="startDate" value={formData.startDate} onChange={handleInputChange} />
              </label>
              <br />
              <label>
                To Date:
                <input type="date" name="endDate" value={formData.endDate} onChange={handleInputChange} />
              </label>
              <br />
              <label>
                Reason:
                <textarea name="reason" value={formData.reason} onChange={handleInputChange} />
              </label>
              <br />
              <button type="submit" style={{backgroundColor:' #2c3e50',width:'100%'}}>Submit</button>
            </form>
          </div>);

      case "leaverequests":
        return (
          <div className="history-container">
            <h2>Leave Requests</h2>
            <table id="tb">
              <thead>
                <tr>
                  <th>Leave Type</th>
                  <th>From</th>
                  <th>To</th>
                  <th>Reason</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {leaveHistory.map((leave) =>
                  leave.startDate.map((startDate, index) => (
                    <tr
                      
                    >
                      <td>{leave.leaveType}</td>

                      <td>{new Date(startDate).toLocaleDateString()}</td>
                      <td>
                        {new Date(leave.endDate[index]).toLocaleDateString()}
                      </td>
                      <td>{leave.reason[index]}</td>
                      <td key={`${leave._id}-${index}`}
                      onClick={() => handleRowClick(leave, index)}><button style={{color:'white',backgroundColor:'#313896'}}>{leave.status[index]}</button></td>
                      
                    </tr>
                  ))
                )}
              </tbody>
            </table>
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
            borderRadius: "8px",
          }}
        >
          {selectedLeave && (
            <>
              <h3>Leave Details</h3>
              <p>Employee Email: {selectedLeave.email}</p>
              <p>Leave Type: {selectedLeave.leaveType}</p>
              <p>
                From:{" "}
                {new Date(
                  selectedLeave.startDate[selectedLeave.selectedIndex]
                ).toLocaleDateString()}
              </p>
              <p>
                To:{" "}
                {new Date(
                  selectedLeave.endDate[selectedLeave.selectedIndex]
                ).toLocaleDateString()}
              </p>
              <p>Reason: {selectedLeave.reason[selectedLeave.selectedIndex]}</p>
              <p>Status: {selectedLeave.status[selectedLeave.selectedIndex]}</p>
              <p>Total Leaves: {selectedLeave.totalLeaves}</p>
              <p>Available Leaves: {selectedLeave.availableLeaves}</p>
              <p>Used Leaves: {selectedLeave.usedLeaves}</p>

              {selectedLeave.attachments &&
                selectedLeave.attachments[selectedLeave.selectedIndex] && (
                  <div className="pdf-container">
                    <a
                      href={`http://localhost:5001/${selectedLeave.attachments[selectedLeave.selectedIndex]}`}
                      download
                    >
                      View Document
                    </a>
                  </div>
                )}

              <div className="action-buttons">
                <button onClick={handleApprove}>Approve</button>
                <button onClick={handleReject}>Reject</button>
                <button onClick={handleCloseModal}>Close</button>
              </div>
            </>
          )}
        </Box>
      </Modal>
          </div>
        );
        case "reports":
          return <div className="profile-content">Reports Content</div>;
        case "history":
          return  <div className="history-container">
          <h2>Leave History</h2>
          <table>
            <thead>
              <tr>
                <th>Leave Type</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Reason</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {leavehistory.map((leave, index) => (
                <tr key={index}>
                  <td>{leave.leaveType}</td>
                  <td>{leave.startDate}</td>
                  <td>{leave.endDate}</td>
                  <td>{leave.reason}</td>
                  <td>{leave.status || "Pending"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>;
      default:
        return null;
    }
  };

  return (
    <div className="dashboard-container">

      <div className="content">
        <nav className="sidebar" id="side"  >
        <img src={logo} alt="Quadface Logo" className="logo_das" />

          <ul >
         
            <li>
              <Link to="#" onClick={() => setSelectedCategory("dashboard")}>
              <FontAwesomeIcon icon={faChartLine} /> Dashboard
              </Link>
            </li>
            <li>
              <Link to="#" onClick={() => setSelectedCategory("leaverequests")}>
              <FontAwesomeIcon icon={faCalendarCheck} /> Leave Requests
              </Link>
            </li>
            <li>
              <Link to="#" onClick={() => setSelectedCategory("reports")}>
              <FontAwesomeIcon icon={faFileAlt} />Reports
              </Link>
            </li>
            <li>
              <Link to="#" onClick={() => setSelectedCategory("apply-leave")}>
              <FontAwesomeIcon icon={faPaperPlane} />  Apply Leave
              </Link>
            </li>
        
            <li>
              <Link to="#" onClick={() => setSelectedCategory("history")}>
              <FontAwesomeIcon icon={faHistory} /> History
              </Link>
            </li>
          </ul>
        </nav>
        <main className="main-content">{renderContent()}</main>
      </div>
    </div>
  );
}

export default LeaveRequests;


