module.exports = function(app) {
    var requests = require('../../controllers/Requests.js');

    app.route('/requestCollections')
      .post(requests.requestCollections);
  }
  