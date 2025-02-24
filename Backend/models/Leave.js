const mongoose = require("mongoose");
const LeavePolicy = require("./LeavePolicy");
const Holiday = require("./Holiday");

const LeaveSchema = new mongoose.Schema({
  email: { type: String, required: true },
  empname: { type: String, required: true },
  empid: { type: String, required: true },
  managerEmail: { type: String },
  leaveType: { type: String, required: true },
  applyDate: { type: [Date], required: true },
  startDate: { type: [Date], required: true },
  endDate: { type: [Date], required: true },
  reason: { type: [String] },
  status: { type: [String], default: [] },
  totalLeaves: { type: Number, default: 0 },
  usedLeaves: { type: Number, default: 0 },
  availableLeaves: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  attachments: { type: [String] },
  duration: { type: [[Number]] }, // Store duration as a nested array per month
  year: { type: [[Number]] },
  month: { type: [[Number]] },
});

LeaveSchema.pre("save", async function (next) {
  if (!this.isNew && this.isModified("status") && !this.isModified("startDate") && !this.isModified("endDate")) {
    return next(); // Skip recalculation when approving/rejecting leave
  }

  try {
    const durationArray = [];
    const monthsArray = [];
    const yearsArray = [];
    const holidays = await Holiday.find({ type: "Mandatory" });
    const holidayDates = holidays.map((holiday) => new Date(holiday.date).toDateString());

    this.startDate.forEach((start, index) => {
      const end = this.endDate[index];
      let currentDate = new Date(start);
      let durationPerMonth = {};

      while (currentDate <= new Date(end)) {
        const dayOfWeek = currentDate.getDay();
        const formattedDate = currentDate.toDateString();
        const currentMonth = currentDate.getMonth() + 1;
        const currentYear = currentDate.getFullYear();

        if (dayOfWeek !== 0 && dayOfWeek !== 6 && !holidayDates.includes(formattedDate)) {
          if (!durationPerMonth[currentYear]) {
            durationPerMonth[currentYear] = {};
          }
          if (!durationPerMonth[currentYear][currentMonth]) {
            durationPerMonth[currentYear][currentMonth] = 0;
          }
          durationPerMonth[currentYear][currentMonth]++;
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }

      const sortedYears = [...new Set(Object.keys(durationPerMonth).map(Number))].sort((a, b) => a - b);
      const sortedMonths = sortedYears.map(year => Object.keys(durationPerMonth[year]).map(Number).sort((a, b) => a - b));
      const sortedDurations = sortedYears.map(year => sortedMonths[sortedYears.indexOf(year)].map(month => durationPerMonth[year][month]));

      // ✅ Fix: Store [[2025, 2025]] for same-year multiple months
      if (sortedYears.length === 1 && sortedMonths.flat().length > 1) {
        yearsArray.push(new Array(sortedMonths.flat().length).fill(sortedYears[0]));
      } else if (sortedYears.length === 2 && sortedMonths.flat().includes(1)) {
        // Handle year transition (e.g., [11, 12, 1] should be [2025, 2025, 2026])
        const expandedYears = sortedMonths.flat().map(month => (month === 1 ? sortedYears[1] : sortedYears[0]));
        yearsArray.push(expandedYears);
      } else {
        yearsArray.push(sortedYears);
      }
      
    

      monthsArray.push(sortedMonths.flat());
      durationArray.push(sortedDurations.flat());
    });

    this.duration = durationArray;
    this.month = monthsArray;
    this.year = yearsArray;

    // ✅ Fetch Leave Policy and Set Leave Limits
    const policy = await LeavePolicy.findOne({ leaveType: this.leaveType });
    if (policy) {
      this.totalLeaves = policy.maxAllowedLeaves || 0;
      if (this.availableLeaves === 0) {
        this.availableLeaves = this.totalLeaves;
      }
      this.availableLeaves = Math.max(0, this.totalLeaves - this.usedLeaves);
    } else {
      throw new Error(`Leave policy not found for: ${this.leaveType}`);
    }

    next();
  } catch (error) {
    console.error("Error in LeaveSchema pre-save:", error);
    next(error);
  }
});

module.exports = mongoose.model("Leaverequests", LeaveSchema);
