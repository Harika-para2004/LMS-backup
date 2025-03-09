const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema({
  projectName: {
    type: String,
    required: true,
    trim: true,
  },
}, { timestamps: true });

module.exports = mongoose.model("ConfigProject", projectSchema);
