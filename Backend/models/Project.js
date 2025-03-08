const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema({
  projectName: {
    type: String,
    required: true,
    trim: true,
  },
  managerEmail: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
  },
}, { timestamps: true });

module.exports = mongoose.model("Project", projectSchema);
