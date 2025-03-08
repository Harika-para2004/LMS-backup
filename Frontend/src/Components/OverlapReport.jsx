import React, { useState, useEffect } from "react";
import "./overlapping.css"; // Updated styles

const CalendarView = ({ year }) => {  // Receive year as prop
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [leaveData, setLeaveData] = useState({});
  const [daysInMonth, setDaysInMonth] = useState(30);
  const [selectedDay, setSelectedDay] = useState(null);

  useEffect(() => {
    setDaysInMonth(new Date(year, selectedMonth, 0).getDate()); // Use year prop
  }, [selectedMonth, year]);

  useEffect(() => {
    fetchReports();
  }, [selectedMonth, year]);

  const fetchReports = async () => {
    try {
      const response = await fetch(
        `http://localhost:5001/data/leave-reports?month=${selectedMonth}&year=${year}` // Use year prop
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

  const getHighlightColor = (count) => {
    if (count === 2) return "#FFD700"; // Light Yellow
    if (count === 3) return "#FFA500"; // Orange
    if (count === 4) return "#FF4500"; // Dark Orange
    if (count >= 5) return "#FF0000"; // Red for 5+
    return "white"; // No color for 1 employee
  };

  return (
    <div className="calendar-container">
      <h2>Leave Overlapping Calendar</h2>

      <div className="selectors">
        {/* Keep only the month dropdown */}
        <select onChange={(e) => setSelectedMonth(Number(e.target.value))} value={selectedMonth}>
          {Array.from({ length: 12 }, (_, i) => (
            <option key={i + 1} value={i + 1}>
              {new Date(0, i).toLocaleString("default", { month: "long" })}
            </option>
          ))}
        </select>
      </div>

      {/* Wrapper to align calendar and leave details horizontally */}
      <div className="calendar-wrapper">
        {/* Calendar Box */}
        <div className="calendar-box">
          <h3>
            {new Date(year, selectedMonth - 1).toLocaleString("default", { month: "long" })} {year} {/* Use year prop */}
          </h3>
          <div className="calendar-grid">
            {Array.from({ length: daysInMonth }, (_, i) => {
              const day = i + 1;
              const employeesOnLeave = leaveData[day] || [];
              const isOverlapping = employeesOnLeave.length > 1;

              return (
                <div
                  key={day}
                  className="calendar-day"
                  style={{ backgroundColor: isOverlapping ? getHighlightColor(employeesOnLeave.length) : "white" }}
                  onClick={() => handleDayClick(day)}
                >
                  <span>{day}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Leave Details Box - Show Only If a Date is Selected */}
        {selectedDay !== null && (
          <div className="leave-details-box">
            <h3>
              Leave Details - {selectedDay} {new Date(year, selectedMonth - 1).toLocaleString("default", { month: "long" })} {year} {/* Use year prop */}
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

export default CalendarView;