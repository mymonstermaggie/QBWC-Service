var Requests = require('../models/Requests.js');

exports.requestCollections = function(req, res) {
  Requests.requestCollections(req, function(err, resp) {
    if (err) res.send(err);
    res.send(resp);
  });
};