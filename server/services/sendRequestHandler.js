const QBRequest = require('../models/schemas/QBRequest.js');
const CollectionsReport = require('../models/schemas/CollectionsReport.js');


const sendRequestXML = async function(args, callback) {
  const requestQueue = [];
  requestQueue.length = 0;

  let unprocessedRequests = await QBRequest.find({ processed: false })
  unprocessedRequests.forEach(ticket => {requestQueue.push(ticket);});

  let lastPaymentRequests = await CollectionsReport.find({ processed: false })
  lastPaymentRequests.forEach(ticket => {requestQueue.push({_id: ticket.listID, processed: ticket.processed, requestType: 'CollectionsPayments'});});

  console.log('Requests in queue:', requestQueue.length);
  const nextJob = requestQueue.shift();

  if (nextJob && nextJob.processed === false) {
    console.log('Processing request:', nextJob._id.toString(), 'Type:', nextJob.requestType);
    if(nextJob.requestType == 'Collections') {
      const collectionsRequest = require('../scripts/collections.js');
      callback({sendRequestXMLResult: collectionsRequest(nextJob.requestType+"."+nextJob._id.toString())});
    }
    else if(nextJob && nextJob.requestType == 'CollectionsPayments') {
      const lastPaymentRequest = require('../scripts/lastPayment.js');
      callback({sendRequestXMLResult: lastPaymentRequest(nextJob._id, nextJob.requestType+"."+nextJob._id)});
    }
  }
  else callback({
    sendRequestXMLResult: ''
  })
};

module.exports = sendRequestXML;