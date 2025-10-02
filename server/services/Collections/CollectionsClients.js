const mongoose = require('mongoose');
const QBRequest = require('../../models/Schemas/QBRequest'); 
const ScoutClient = require('../../models/Schemas/ScoutClient');
const CollectionsReport = require('../../models/Schemas/CollectionsReport'); 

async function collectionsClients(responseData, requestID) {
  if (responseData.$.statusCode === '0') {
    console.log('Processing Collections response for requestID:', requestID);

    const reportEntries = await Promise.all(
    responseData.CustomerRet
    .filter(customer => customer.ParentRef === undefined)
    .map(async(customer) => {
      const customFields = Array.isArray(customer.DataExtRet)
      ? customer.DataExtRet.reduce((fields, ext) => {
          fields[ext.DataExtName] = ext.DataExtValue;
          return fields;
        }, {})
      : {}

      let deviceCount = 0;

      let clientRegex = customFields['Account Number'] ? new RegExp(customFields['Account Number'], 'i') : null;
      if(clientRegex){
        let devices = await ScoutClient.aggregate([
          {
              "$match" : {
                  "remoteCOMAccount" : clientRegex
              }
          },
          { $limit: 1 },
          {
              "$lookup" : {
                  "from" : "devices",
                  "localField" : "_id",
                  "foreignField" : "client",
                  "pipeline": [
                    {
                      "$match": { "enabled":  true }
                    }
                  ],
                  "as" : "devices"
              }
          },
          {
              "$addFields" : {
                  "deviceCount" : {
                      "$size" : "$devices"
                  }
              }
          }
        ])
        deviceCount = devices[0] ? devices[0].deviceCount : 0
      } else{
        deviceCount = 0
      }
      
      return {
      requestID: new mongoose.Types.ObjectId(requestID),
      listID: customer.ListID || '',
      rcomAccountNumber: customFields['Account Number'] || '',
      fullName: customer.FullName || '',
      balance: parseFloat(customer.TotalBalance) || 0,
      daysOverdue: 0,
      billingType: customer.CustomerTypeRef?.FullName || '',
      email: customer.Email || '',
      phone: customer.Phone || '',
      officerName: '',
      officerEmail: '',
      processed: false,
      deviceCount: deviceCount
    }}))

    console.log('Customer Count', reportEntries.length || 0);

    await CollectionsReport.insertMany(reportEntries)
      .then(() => {console.log('Inserted collections report entries for request:', requestID)})
      .catch((insertErr) => {console.error('Error inserting collections report entries:', insertErr)});
    
    // Mark the request as processed
    await QBRequest.findOneAndUpdate(
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