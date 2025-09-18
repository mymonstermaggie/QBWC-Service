module.exports = function(app) {
  app.route('/qbwc')
    .get(function(req, res) {
      res.send('QuickBooks Web Connector endpoint is running.');
    });
}
