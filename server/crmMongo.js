var mongoose = require('mongoose');
const config = require('../config/config');
mongoose.set('strictQuery', false);
mongoose.connect(config.crmMongo)
module.exports = exports = mongoose;
