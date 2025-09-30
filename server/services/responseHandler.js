const xml2js = require('xml2js');
const mongoose = require('mongoose');
const QBRequest = require('../models/Schemas/QBRequest'); // Adjust the path as needed
const CollectionsReport = require('../models/Schemas/CollectionsReport'); // Adjust the path as needed

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

        // Handle different response types and statuses
        if (responseType === 'CustomerQueryRs' && responseData.$.statusCode === '0') {
        let requestTicket = await QBRequest.findOne({ _id: requestID });
        if (requestTicket.requestType === 'Collections') {
          console.log('Processing Collections response for requestID:', requestID);
            const reportEntries = responseData.CustomerRet
            .filter(customer => customer.ParentRef === undefined) // Exclude sub-customers
            .map(customer => {
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
              billingType: customer.CustomerTypeRef.FullName || '',
              email: customer.Email || '',
              phone: customer.Phone || '',
              officerName: '',
              officerEmail: '',
              processed: false,
            }});

            console.log('Customer Count', reportEntries.length || 0);

            CollectionsReport.insertMany(reportEntries)
              .then(() => {console.log('Inserted collections report entries for request:', requestID)})
              .catch((insertErr) => {console.error('Error inserting collections report entries:', insertErr)});
            
            // Mark the request as processed
            QBRequest.findOneAndUpdate(
                { _id: requestID},
                {processed: true },
                { new: true })
              .then((response) => {console.log("Added to reports table")})
              .catch((updateErr) => {console.error('Error updating request status:', updateErr)});
          } 
        else {
            console.warn('Request type is not Collections for requestID:', requestID);
          }
        }
        else if (responseType === 'ReceivePaymentQueryRs' && responseData.$.statusCode === '0') {  
          if(Array.isArray(responseData.ReceivePaymentRet)){
            const payments = responseData.ReceivePaymentRet.sort((a, b) => new Date(b.TxnDate) - new Date(a.TxnDate))
            const mostRecent = payments[0]
            const now = new Date();
            let last15th = new Date(now.getFullYear(), now.getMonth(), 15);

            // If today is before the 15th, use the 15th of the previous month
            if (now.getDate() < 15) {
              last15th = new Date(now.getFullYear(), now.getMonth() - 1, 15);
            }
          
            const recentPayments = payments.filter(payment => {
              const paymentDate = new Date(payment.TxnDate);
              return paymentDate >= last15th;
            });

            const totalRecentAmount = recentPayments.reduce((sum, payment) => sum + parseFloat(payment.TotalAmount), 0);

            // Mark the request as processed
            CollectionsReport.findOneAndUpdate(
              { listID: requestID},
              {
                processed: true,
                lastPaymentDate: new Date(mostRecent.TxnDate),
                lastPaymentAmount: parseFloat(mostRecent.TotalAmount),
                totalRecentAmount: totalRecentAmount
              },
              { new: true })
            .then((response) => {console.log("Added to reports table")})
            .catch((updateErr) => {console.error('Error updating request status:', updateErr)});
          }
          else{
            const mostRecent = responseData.ReceivePaymentRet;
            const now = new Date();
            let last15th = new Date(now.getFullYear(), now.getMonth(), 15);

            // If today is before the 15th, use the 15th of the previous month
            if (now.getDate() < 15) {
              last15th = new Date(now.getFullYear(), now.getMonth() - 1, 15);
            }
          
            const paymentDate = new Date(mostRecent.TxnDate);
            const totalRecentAmount = paymentDate >= last15th ? parseFloat(mostRecent.TotalAmount) : 0;

            // Mark the request as processed
            CollectionsReport.findOneAndUpdate(
              { listID: requestID},
              {
                processed: true,
                lastPaymentDate: new Date(mostRecent.TxnDate),
                lastPaymentAmount: parseFloat(mostRecent.TotalAmount),
                totalRecentAmount: totalRecentAmount
              },
              { new: true })
            .then((response) => {console.log("Added to reports table")})
            .catch((updateErr) => {console.error('Error updating request status:', updateErr)});
          }
        }
        else if (responseType === 'ReceivePaymentQueryRs' && responseData.$.statusCode === '1') {
          // Mark the request as processed
          CollectionsReport.findOneAndUpdate(
            { listID: requestID},
            {
              processed: true,
              lastPaymentDate: null,
              lastPaymentAmount: null
            },
            { new: true })
          .then((response) => {console.log("Added to reports table")})
          .catch((updateErr) => {console.error('Error updating request status:', updateErr)});
        }
        else {
          console.warn('Unexpected response type or error status:', responseType, responseData);
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