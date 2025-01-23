const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  empname: { type: String, required: true },
  empid: { type: String, required: true,unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  project: { type: String },

});

const User = mongoose.model('signups_col', userSchema);

module.exports = User;
