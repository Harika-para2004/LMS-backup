const mongoose = require("mongoose");

const LeaveSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
  },
  leaveType: {
    type: String,
    required: true,
  },
  
  startDate: {
    type: [Date],
    required: true,
  },
  endDate: {
    type: [Date],
    required: true,
  },
  reason: {
    type: [String],
    required: false,
  },
  status: {
    type: [String],
    default: [],
  },
  totalLeaves: {
    type: Number,
    default: 0,
  },
  usedLeaves: {
    type: Number,
    default: 0,
  },
  availableLeaves: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  attachments: {
    type: [String],
    required: false,
  },
});

LeaveSchema.pre("save", function (next) {
  if (!this.isModified("leaveType")) return next();
  const leaveTypeDefaults = {
    sick: 14,
    maternity: 26,
    paternity: 10,
    adoption: 10,
    bereavement: 3,
    compensatory: 3,
    lop: 3,
  };

  this.totalLeaves = leaveTypeDefaults[this.leaveType] || 0;

  if (this.status.length === 0) {
    this.status = Array(this.totalLeaves).fill("pending");
  }

  this.availableLeaves = this.totalLeaves - this.usedLeaves;

  next();
});

module.exports = mongoose.model("Leaverequests", LeaveSchema);
