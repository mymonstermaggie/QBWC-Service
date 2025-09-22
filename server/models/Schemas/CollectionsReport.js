const mongoose = require('mongoose');
const config = require('../../../config/config');
const crmMongo = mongoose.createConnection(config.crmMongo,);

const CollectionsReportSchema = new mongoose.Schema({
    processedAt: { type: Date, default: Date.now },
    requestedBy: {type: mongoose.ObjectId},
    requestID: {type: mongoose.ObjectId},
    listID: {type: String, default: ''},
    rcomAccountNumber: {type: String, default: ''},
    fullName: {type: String, default: ''},
    balance: {type: Number, default: 0},
    daysOverdue: {type: Number, default: 0},
    email: {type: String, default: ''},
    phone: {type: String, default: ''},
    officerName: {type: String, default: ''},
    officerEmail: {type: String, default: ''},
});

module.exports = crmMongo.model('collectionsReport', CollectionsReportSchema, 'collectionsReports');