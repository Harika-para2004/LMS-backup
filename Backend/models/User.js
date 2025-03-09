const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  empname: { type: String, required: true },
  empid: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  project: { type: [String] }, // Changed to array to store multiple projects
  gender: { type: String },
  role: {
    type: String,
    enum: ["Employee", "Manager", "Admin"],
    required: true,
  },
  managerEmail: { type: String },
  isActive:{type: Boolean, default: true},
  yearlyLeavesTaken: {
    type: Map,
    of: Number,
    default: {},
  },

  // 🔹 Add these fields for Forgot Password feature
  resetCode: { type: Number }, // Temporary reset code
  resetCodeExpires: { type: Date }, // Expiration time for the reset code
});

const User = mongoose.model("signups_cols", userSchema);

module.exports = User;
