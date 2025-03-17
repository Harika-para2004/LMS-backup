const mongoose = require("mongoose");

const LeavePolicySchema = new mongoose.Schema({
  leaveType: {
    type: String,
    required: true,
    trim: true,
    maxlength: 255,
  },
  maxAllowedLeaves: {
    type: Number,
    default: null,
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000, // Allow long descriptions up to 1000 characters
  },
  validYear: {
    type: Number,
    default: new Date().getFullYear(),
  },
  carryForward: {
    type: Boolean,
    default: false, // ✅ Default to false if not provided
  },
  carryForwardLimit: {
    type: Number,
    default: null, // ✅ Only used if carryForward is true
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Middleware to update the `updatedAt` field on each update
LeavePolicySchema.pre("findOneAndUpdate", function (next) {
  this.set({ updatedAt: Date.now() });
  next();
});

const LeavePolicy = mongoose.model("LeavePolicy", LeavePolicySchema);

module.exports = LeavePolicy;
