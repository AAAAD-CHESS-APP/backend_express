const mongoose = require('mongoose');

const ReportSchema = new mongoose.Schema({
    reportedBy : {
        type : String,
    },
    reportedTo : {
        type : String,
    },
    reportedReason : {
        type : String
    },
    reportingTime :{
        type: Date,
        default: Date.now,
        immutable: true
    }
})

const Report = mongoose.model('Report', ReportSchema);
module.exports = Report;