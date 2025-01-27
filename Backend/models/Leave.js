const mongoose = require('mongoose');
const LeavePolicy = require('./LeavePolicy'); // Import LeavePolicy schema

const LeaveSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
  },
  leaveType: {
    type: String,
    required: true,
  },
  applyDate: {
    type: [Date],
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

LeaveSchema.pre('save', async function (next) {
  if (!this.isModified('leaveType')) return next();

  try {
    // Fetch the maxAllowedLeaves for the given leaveType
    const policy = await LeavePolicy.findOne({ leaveType: this.leaveType });

    if (policy) {
      this.totalLeaves = policy.maxAllowedLeaves || 0;

      // Initialize status if not already set
      if (this.status.length === 0) {
        this.status = Array(this.totalLeaves).fill('pending');
      }

      // Calculate available leaves
      this.availableLeaves = this.totalLeaves - this.usedLeaves;
    } else {
      throw new Error(`Leave policy not found for leave type: ${this.leaveType}`);
    }

    next();
  } catch (error) {
    console.error('Error in LeaveSchema pre-save:', error);
    next(error);
  }
});

module.exports = mongoose.model('Leaverequests', LeaveSchema);