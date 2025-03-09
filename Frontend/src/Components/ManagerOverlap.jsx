import React, { useState, useEffect } from "react";
import "./overlapping.css";

const Overlap = ({ year ,managerEmail}) => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [leaveData, setLeaveData] = useState({});
  const [daysInMonth, setDaysInMonth] = useState(30);
  const [selectedDay, setSelectedDay] = useState(null);

  useEffect(() => {
    setDaysInMonth(new Date(year, selectedMonth, 0).getDate());
  }, [selectedMonth, year]);

  useEffect(() => {
    fetchReports();
  }, [selectedMonth, year, managerEmail]); // Include managerEmail as a dependency
  
  const fetchReports = async () => {
    try {
        console.log(managerEmail);
      if (!managerEmail) return; // Prevent fetch if managerEmail is not available
  
      const response = await fetch(
        `http://localhost:5001/data/manager-leave-reports?email=${managerEmail}&month=${selectedMonth}&year=${year}`
      );
  
      if (!response.ok) throw new Error("Failed to fetch reports");
  
      const data = await response.json();
      setLeaveData(data);
    } catch (error) {
      console.error("Error fetching reports:", error);
    }
  };
  

  const handleDayClick = (day) => {
    setSelectedDay(selectedDay === day ? null : day);
  };

  const getHighlightColor = (count, dayOfWeek) => {
    if (dayOfWeek === 0 || dayOfWeek === 6) return "#f9f9f9"; // No highlight for weekends
    if (count === 2) return "#FFD700";
    if (count === 3) return "#FFA500";
    if (count === 4) return "#FF4500";
    if (count >= 5) return "#FF0000";
    return "white";
  };
  const firstDayOfMonth = new Date(year, selectedMonth - 1, 1).getDay(); // Get the starting weekday index

  return (
    <div className="calendar-container">
      <h2>Leave Overlapping Calendar</h2>
      <div className="selectors">
        <select onChange={(e) => setSelectedMonth(Number(e.target.value))} value={selectedMonth}>
          {Array.from({ length: 12 }, (_, i) => (
            <option key={i + 1} value={i + 1}>
              {new Date(0, i).toLocaleString("default", { month: "long" })}
            </option>
          ))}
        </select>
      </div>
      <div className="calendar-wrapper">
        <div className="calendar-box">
          <h3>
            {new Date(year, selectedMonth - 1).toLocaleString("default", { month: "long" })} {year}
          </h3>
          <div className="weekday-row">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, index) => (
              <div key={index} className="weekday-header">
                {day}
              </div>
            ))}
          </div>
          <div className="calendar-grid">
  {Array.from({ length: firstDayOfMonth }, (_, i) => (
    <div key={`empty-${i}`} className="calendar-day"></div> // Empty placeholders
  ))}
  {Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1;
    const date = new Date(year, selectedMonth - 1, day);
    const dayOfWeek = date.getDay();
    const employeesOnLeave = leaveData[day] || [];

    return (
      <div
        key={day}
        className="calendar-day"
        style={{
          backgroundColor: getHighlightColor(employeesOnLeave.length, dayOfWeek),
          color: dayOfWeek === 0 || dayOfWeek === 6 ? "#aaa" : "#000",
          cursor: dayOfWeek === 0 || dayOfWeek === 6 ? "default" : "pointer",
        }}
        onClick={() => (dayOfWeek === 0 || dayOfWeek === 6 ? null : handleDayClick(day))}
      >
        <span>{day}</span>
      </div>
    );
  })}
</div>

        </div>
        {selectedDay !== null && (
          <div className="leave-details-box">
            <h3>
              Leave Details - {selectedDay} {new Date(year, selectedMonth - 1).toLocaleString("default", { month: "long" })} {year}
            </h3>
            {leaveData[selectedDay]?.length > 0 ? (
              <ul className="employee-list">
                {leaveData[selectedDay].map((emp, index) => (
                  <li key={index}>{emp}</li>
                ))}
              </ul>
            ) : (
              <p>No leaves on this day</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Overlap;
