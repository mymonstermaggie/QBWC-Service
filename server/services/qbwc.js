require('dotenv').config();
const mongoose = require('mongoose');
const xml2js = require('xml2js');

const QBWC_USERNAME = process.env.QBWC_USERNAME;
const QBWC_PASSWORD = process.env.QBWC_PASSWORD;

const collectionsRequest = require('../scripts/collections.js');

var QBRequest = require('../models/schemas/QBRequest.js');
var CollectionsReport = require('../models/Schemas/CollectionsReport.js');
const { request } = require('http');

const requestQueue = [];

// Define the SOAP service
const qbwcService = {
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
          console.log('authenticate called');
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
        },
        sendRequestXML: async function(args, callback) {
          console.log('sendRequestXML called');
          requestQueue.length = 0;

          let unprocessedRequests = await QBRequest.find({ processed: false })
          unprocessedRequests.forEach(ticket => {requestQueue.push(ticket);});

          console.log('Requests in queue:', requestQueue.length);
          const nextJob = requestQueue.shift();

          if (nextJob && nextJob.processed === false) {
            console.log('Processing request:', nextJob._id.toString(), 'Type:', nextJob.requestType);
            callback({sendRequestXMLResult: collectionsRequest(nextJob._id.toString())});
          }
          else callback({
            sendRequestXMLResult: ''
          })
        },
        receiveResponseXML: async function(args, callback) {
          console.log('receiveResponseXML');
          const xmlResponse = args.response;

          xml2js.parseString(xmlResponse, { explicitArray: false }, async (err, result) => {
            if (err) {
                console.error('Error parsing XML:', err);
                callback({ receiveResponseXMLResult: -1 }); // Return error code
            } else {
                console.log('Parsed XML:', result);
                
                // Process the parsed XML data here
                if (result && result.QBXML && result.QBXML.QBXMLMsgsRs) {
                  const responseType = Object.keys(result.QBXML.QBXMLMsgsRs)[0];
                  const responseData = result.QBXML.QBXMLMsgsRs[responseType];
                  const requestID = responseData.$.requestID;

                  // Handle different response types and statuses
                  if (responseType === 'CustomerQueryRs' && responseData.$.statusCode === '0') {
                    let requestTicket = await QBRequest.findOne({_id: requestID})
                    if(requestTicket.requestType === 'Collections') {
                      console.log('Processing Collections response for requestID:', requestID);
                      const reportEntries = responseData.CustomerRet.map(customer => ({
                        requestID: new mongoose.Types.ObjectId(requestID),
                        listID: customer.ListID || '',
                        rcomAccountNumber: customer.AccountNumber || '',
                        fullName: customer.FullName || '',
                        balance: parseFloat(customer.TotalBalance) || 0,
                        daysOverdue: 0,
                        email: customer.Email || '',
                        phone: customer.Phone || '',
                        officerName: '',
                        officerEmail: '',
                      }));
                      CollectionsReport.insertMany(reportEntries)
                        .then(() => {
                          console.log('Inserted collections report entries for request:', requestID);
                        })
                        .catch((insertErr) => {
                          console.error('Error inserting collections report entries:', insertErr);
                        });
                    }
                    else {
                      console.warn('Request type is not Collections for requestID:', requestID);
                    }
                  } else {
                    console.warn('Unexpected response type or error status:', responseType, responseData.$.statusCode);
                  }
                  
                  
                  // Mark the request as processed
                  QBRequest.findOneAndUpdate(
                    { _id: new mongoose.Types.ObjectId(responseData.$.requestID)},
                    { processed: true },
                  ).then((updatedRequest) => {
                    if (updatedRequest) {
                      console.log('Marked request as processed:', updatedRequest._id);
                    } else {
                      console.warn('No unprocessed request found to mark as processed.');
                    }
                  }).catch((updateErr) => {
                    console.error('Error updating request status:', updateErr);
                  });
                } else {
                  console.warn('Invalid response structure:', result);
                }
                callback({ receiveResponseXMLResult: 100 }); // Return success code
            }
        });
        },
        getLastError: function(args, callback) {
          console.log('getLastError called with args:', args);
          callback({
            getLastErrorResult: 'No Error'
          });
        },
        closeConnection: function(args, callback) {
          console.log('closeConnection called with args:', args);
          callback({
            closeConnectionResult: 'OK'
          });
        },
      }
    }
  };

  module.exports = qbwcService;