const express = require('express');
const soap = require('soap');
const fs = require('fs');
require('dotenv').config();

const app = express();
const port = 3005;
const xml = fs.readFileSync('qbwc.wsdl', 'utf8');
const QBWC_USERNAME = process.env.QBWC_USERNAME;
const QBWC_PASSWORD = process.env.QBWC_PASSWORD;

// Define the SOAP service
const service = {
  QBWebConnectorSvc: {
    QBWebConnectorSvcSoap: {
      serverVersion: function(args, callback) {
        console.log('serverVersion called with args:', args);
        callback({
          serverVersionResult: '1.0.0'
        });
      },
      clientVersion: function(args, callback) {
        console.log('clientVersion called with args:', args);
        const clientVersion = args.strVersion;
        console.log('QBWC Client Version:', clientVersion);
        
        // Response format:
        // 'O:<QBWC_Version_Supported_By_Server>' if compatible.
        // 'W:<URL_for_update>' if an update is required.
        // 'E:<error_message>' if there is an error.
        
        if (clientVersion && clientVersion >= '34') {
          // This server supports the client version.
          callback({
            clientVersionResult: '' 
          });
        } else {
          // You could respond with a warning to instruct the user to update.
          callback({
            clientVersionResult: 'W:Update your server to support this QBWC version.'
          });
        }
      },
      authenticate: function(args, callback) {
        console.log('authenticate called with args:', args);
        const username = args.strUserName;
        const password = args.strPassword;

        if (username === QBWC_USERNAME && password === QBWC_PASSWORD) {
          // Authentication successful
          const ticket = '{' + require('crypto').randomUUID().toUpperCase() + '}'; // Generate a unique ticket
          console.log('Authentication successful for user:', username);
          callback({ authenticateResult: { string: [ticket, '']} });
        } else {
          // Authentication failed
          console.log('Authentication failed for user:', username);
          callback({ authenticateResult: {string: ['nvu', '']} }); // 'nvu' indicates not valid user
        }
      }
    }
  }
};

// Middleware to log incoming requests
app.use((req, res, next) => {
  console.log(`\n--- Incoming request to ${req.path} ---`);
  next();
});

// require('./routes')(app);

// Listen for incoming requests
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
  const soapServer = soap.listen(app, '/qbwc', service, xml);
  console.log(`SOAP server listening on /qbwc`);
});


