const mongoose = require('mongoose');
const xml2js = require('xml2js');

const QBRequest = require('../models/Schemas/QBRequest'); 

const collectionsClients = require('./Collections/CollectionsClients');
const collectionsPayments = require('./Collections/CollectionsPayments');


async function handleResponseXML(args, callback) {
  const xmlResponse = args.response;

  xml2js.parseString(xmlResponse, { explicitArray: false }, async (err, result) => {

    if (err) {
      console.error('Error parsing XML:', err);
      callback({ receiveResponseXMLResult: -1 }); // Return error code
    } 
    
    else {
      // Process the parsed XML data here
      if (result && result.QBXML && result.QBXML.QBXMLMsgsRs) {
        const responseType = Object.keys(result.QBXML.QBXMLMsgsRs)[0];
        const responseData = result.QBXML.QBXMLMsgsRs[responseType];
        const requestID = responseData.$.requestID;

        console.log('Received response for requestID:', requestID);

        if (responseData.$.statusCode === '-1') {
          console.warn('Error in response for requestID:', requestID, 'Status Message:', responseData.$.statusMessage);
        }
        else {
            const parts = requestID.split('.');
            const requestType = parts[0];
            const actualRequestID = parts[1];

          if(requestType === 'Collections') {
            collectionsClients(responseData, actualRequestID);
          }
          else if(requestType === 'CollectionsPayments') {
            collectionsPayments(responseData, actualRequestID);
          }
        }
      }
      else {
        console.warn('Invalid response structure:', args);
      }
      callback({ receiveResponseXMLResult: 0 }); // Success
    }
  });
}

module.exports = handleResponseXML;