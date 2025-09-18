const express = require('express');
const soap = require('soap');
const fs = require('fs');

const app = express();
const port = 3005;

// Middleware to log incoming request
app.use((req, res, next) => {
  console.log(`\n--- Incoming request to ${req.path} ---`);
  next();
});

// SOAP service
const qbwcService = require('./services/qbwc.js');
const qbwcXml = fs.readFileSync('./server/services/qbwc.wsdl', 'utf8');

soap.listen(app, '/qbwc', qbwcService, qbwcXml, function() {
  console.log('SOAP service initialized at /qbwc');
})

// Import routes
require('./routes')(app);

// Listen for incoming requests
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});


