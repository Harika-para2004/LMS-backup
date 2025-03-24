import React, { useState, useEffect } from "react";
import "./overlapping.css";
import { MenuItem, Select,FormControl,InputLabel } from "@mui/material";
const backendUrl = import.meta.env.VITE_BACKEND_URL;

const Overlap = ({ year, managerEmail }) => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [leaveData, setLeaveData] = useState({});
  const [daysInMonth, setDaysInMonth] = useState(30);
  const [selectedDay, setSelectedDay] = useState(null);
  const [holidayName, setHolidayName] = useState("");
  const [holidays, setHolidays] = useState({});

  useEffect(() => {
    setDaysInMonth(new Date(year, selectedMonth, 0).getDate());
  }, [selectedMonth, year]);

  useEffect(() => {
    fetchReports();
    fetchHolidays();
  }, [selectedMonth, year, managerEmail]); // Include managerEmail in dependencies

  // Fetch leave reports
  const fetchReports = async () => {
    try {
      if (!managerEmail) return; // Prevent fetch if managerEmail is not available
      const response = await fetch(
        `${backendUrl}/data/manager-leave-reports?email=${managerEmail}&month=${selectedMonth}&year=${year}`
      );
      if (!response.ok) throw new Error("Failed to fetch reports");
      const data = await response.json();
      setLeaveData(data);
    } catch (error) {
      console.error("Error fetching reports:", error);
    }
  };

  // Fetch holidays
  const fetchHolidays = async () => {
    try {
      const monthStr = String(selectedMonth).padStart(2, "0");
      const response = await fetch(
        `${backendUrl}/data/holidays?month=${monthStr}&year=${year}`
      );
      if (!response.ok) throw new Error("Failed to fetch holidays");

      const data = await response.json();
      const holidayMap = {};
      data.forEach((holiday) => {
        const [dayStr] = holiday.date.split("-");
        const dayNumber = parseInt(dayStr, 10);
        if (!isNaN(dayNumber)) {
          holidayMap[dayNumber] = holiday.name;
        }
      });

      setHolidays(holidayMap);
    } catch (error) {
      console.error("Error fetching holidays:", error);
    }
  };

  const handleDayClick = (day) => {
    if (selectedDay === day) {
      setSelectedDay(null);
      setHolidayName(""); // Reset holiday name
    } else {
      setSelectedDay(day);
      setHolidayName(holidays[day] || ""); // Set holiday name if applicable
    }
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
        <FormControl fullWidth>
          <InputLabel id="label">Month</InputLabel>
          <Select
            label="Month"
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            value={selectedMonth}
          >
            {Array.from({ length: 12 }, (_, i) => (
              <MenuItem key={i + 1} value={i + 1}>
                {new Date(0, i).toLocaleString("default", { month: "long" })}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </div>
      <div className="calendar-wrapper">
        <div className="calendar-box">
          <h3>
            {new Date(year, selectedMonth - 1).toLocaleString("default", {
              month: "long",
            })}{" "}
            {year}
          </h3>
          <div className="weekday-row">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
              (day, index) => (
                <div key={index} className="weekday-header">
                  {day}
                </div>
              )
            )}
          </div>
          <div className="calendar-grid">
            {Array.from({ length: firstDayOfMonth }, (_, i) => (
              <div key={`empty-${i}`} className="calendar-day"></div>
            ))}
            {Array.from({ length: daysInMonth }, (_, i) => {
              const day = i + 1;
              const date = new Date(year, selectedMonth - 1, day);
              const dayOfWeek = date.getDay();
              const employeesOnLeave = leaveData[day] || [];

              return (
                <div
                  key={day}
                  className={`calendar-day ${holidays[day] ? "holiday" : ""}`}
                  style={{
                    backgroundColor: holidays[day]
                      ? "transparent"
                      : getHighlightColor(employeesOnLeave.length, dayOfWeek),
                    color: holidays[day]
                      ? "red"
                      : dayOfWeek === 0 || dayOfWeek === 6
                      ? "#aaa"
                      : "#000",
                    cursor:
                      dayOfWeek === 0 || dayOfWeek === 6
                        ? "default"
                        : "pointer",
                  }}
                  onClick={() =>
                    dayOfWeek === 0 || dayOfWeek === 6
                      ? null
                      : handleDayClick(day)
                  }
                >
                  <span>{day}</span>
                  {holidays[day] && <div className="holiday-marker">🎉</div>}
                </div>
              );
            })}
          </div>
        </div>
        {selectedDay !== null && (
          <div className="leave-details-box">
            <h3>
              {selectedDay}{" "}
              {new Date(year, selectedMonth - 1).toLocaleString("default", {
                month: "long",
              })}{" "}
              {year}
            </h3>
            {holidayName ? (
              <p>
                <strong>Holiday:</strong> {holidayName}
              </p>
            ) : leaveData[selectedDay]?.length > 0 ? (
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