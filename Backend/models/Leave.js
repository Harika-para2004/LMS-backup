const mongoose = require("mongoose");
const LeavePolicy = require("./LeavePolicy");
const Holiday = require("./Holiday"); // Import Holiday Schema

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
  duration: { type: [Number] }, // Updated
  year: { type: [Number],  },
  month: { type: [Number], },
});

// ✅ Middleware to Calculate Leave Duration Excluding Holidays & Weekends
LeaveSchema.pre("save", async function (next) {
  if (!this.isModified("startDate") || !this.isModified("endDate")) return next();

  try {
    const duration = [];
    const holidays = await Holiday.find({ type: "Mandatory" });
    const holidayDates = holidays.map((holiday) => new Date(holiday.date).toDateString());

    this.startDate.forEach((start, index) => {
      const end = this.endDate[index];
      let currentDate = new Date(start);
      let totalDays = 0;

      while (currentDate <= new Date(end)) {
        const dayOfWeek = currentDate.getDay(); // 0 = Sunday, 6 = Saturday
        const formattedDate = currentDate.toDateString();

        if (dayOfWeek !== 0 && dayOfWeek !== 6 && !holidayDates.includes(formattedDate)) {
          totalDays++;
        }
        currentDate.setDate(currentDate.getDate() + 1); // Move to the next day
      }

      duration.push(totalDays);
    });

    this.duration = duration;

    // ✅ Extract and store month & year from startDate
    this.month = this.startDate.map(date => new Date(date).getMonth() + 1); // Month is 0-based, so +1
    this.year = this.startDate.map(date => new Date(date).getFullYear());

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