'use strict';
const mongoose = require('mongoose');
var QBRequest = require('./schemas/QBRequest.js');

var Requests = {}; 

Requests.requestCollections = async function requestColletions(req, callback) {

  await QBRequest.create(
    {
      requestedBy: new mongoose.Types.ObjectId(req.user),
      requestType: 'Collections',
      processed: false
    }
  ).then((doc) => {
    return callback(null, { success: true, message: 'Request for Collections has been logged.' });
  }).catch((err) => {
    return callback(err, null);
  });

};

module.exports= Requests;

