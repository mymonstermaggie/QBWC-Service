const mongoose = require('mongoose');
const config = require('../../../config/config');
const crmMongo = mongoose.createConnection(config.crmMongo,);

const QBRequestSchema = new mongoose.Schema({
    requestedAt: { type: Date, default: Date.now },
    requestType: {type: String, default: ''},
    requestedBy: {type: mongoose.ObjectId},
    processed: {type: Boolean, default: false},
});

module.exports = crmMongo.model('qbRequest', QBRequestSchema, 'qbRequests');