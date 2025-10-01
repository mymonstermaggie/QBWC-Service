const mongoose = require('mongoose');
const QBRequest = require('../../models/Schemas/QBRequest'); 
const CollectionsReport = require('../../models/Schemas/CollectionsReport'); 

async function collectionsClients(responseData, requestID) {
  if (responseData.$.statusCode === '0') {
    console.log('Processing Collections response for requestID:', requestID);

    const reportEntries = responseData.CustomerRet
    .filter(customer => customer.ParentRef === undefined)
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
    console.warn('Collections response error for requestID:', requestID, 'Status Code:', responseData.$.statusCode);
  }
}

module.exports = collectionsClients;