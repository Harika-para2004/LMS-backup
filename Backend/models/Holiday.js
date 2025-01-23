const mongoose=require('mongoose')
const holidaySchema = new mongoose.Schema({
        date: { type: String, required: true },
        day: { type: String, required: true },
        name: { type: String, required: true },
        type: { type: String, required: true },
      });
  
const Holiday = mongoose.model('Holiday', holidaySchema);
module.exports = Holiday;
