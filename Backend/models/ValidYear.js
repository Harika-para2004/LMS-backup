const mongoose = require('mongoose');

const yearSchema = new mongoose.Schema({
    year: { 
        type: [Number], 
        validate: {
            validator: function (years) {
                return years.every(y => y > 1900 && y < 2100);
            },
            message: props => `${props.value} contains an invalid year!`
        }
    }
});

const ValidYear = mongoose.model('ValidYear', yearSchema);

module.exports = ValidYear;
