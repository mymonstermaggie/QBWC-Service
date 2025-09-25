const xml2js = require('xml2js');
const mongoose = require('mongoose');
const QBRequest = require('../models/Schemas/QBRequest'); // Adjust the path as needed
const CollectionsReport = require('../models/Schemas/CollectionsReport'); // Adjust the path as needed

async function handleResponseXML(args, callback) {
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
          let requestTicket = await QBRequest.findOne({ _id: requestID });
          if (requestTicket.requestType === 'Collections') {
            console.log('Processing Collections response for requestID:', requestID);
            const reportEntries = responseData.CustomerRet.map(customer => {
              const customFields = Array.isArray(customer.DataExtRet)
              ? customer.DataExtRet.reduce((fields, ext) => {
                  fields[ext.DataExtName] = ext.DataExtValue;
                  return fields;
                }, {})
              : {}
              return {
              requestID: new mongoose.Types.ObjectId(requestID),
              listID: customer.ListID || '',
              rcomAccountNumber: customFields['Account Number'] || '',
              fullName: customer.FullName || '',
              balance: parseFloat(customer.TotalBalance) || 0,
              daysOverdue: 0,
              billingType: customer.CustomerTypeRefFullName || '',
              email: customer.Email || '',
              phone: customer.Phone || '',
              officerName: '',
              officerEmail: '',
            }});
            CollectionsReport.insertMany(reportEntries)
              .then(() => {
                console.log('Inserted collections report entries for request:', requestID);
              })
              .catch((insertErr) => {
                console.error('Error inserting collections report entries:', insertErr);
              });
          } else {
            console.warn('Request type is not Collections for requestID:', requestID);
          }
        } else {
          console.warn('Unexpected response type or error status:', responseType, responseData.$.statusCode);
        }

        // Mark the request as processed
        QBRequest.findOneAndUpdate(
            { _id: requestID},
            {processed: true },
            { new: true }
        ).then((response) => {console.log(response)}).catch((updateErr) => {
          console.error('Error updating request status:', updateErr);
        });
      }
      callback({ receiveResponseXMLResult: 0 }); // Success
    }
  });
}

module.exports = handleResponseXML;