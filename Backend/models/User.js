const mongoose=require("mongoose")
const userSchema = new mongoose.Schema({
  empname: { type: String, required: true },
  empid: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  project: { type: String },
  gender: { type: String },
  role: { type: String, required: true },
  managerEmail: { type: String, required: function () { return this.role === 'Employee'; } },
  isActive:{type: Boolean, default: true},
  yearlyLeavesTaken: {
    type: Map,
    of: Number, 
    default: {},
  },
});

const User = mongoose.model('signups_cols', userSchema);

module.exports = User;
