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
    billingType: {type: String, default: ''},
    email: {type: String, default: ''},
    phone: {type: String, default: ''},
    officerName: {type: String, default: ''},
    officerEmail: {type: String, default: ''},
    processed: {type: Boolean, default: false},
    lastPaymentDate: {type: Date, default: null},
    lastPaymentAmount: {type: Number, default: 0},
    totalRecentAmount: {type: Number, default: 0},
});

module.exports = crmMongo.model('collectionsReport', CollectionsReportSchema, 'collectionsReports');