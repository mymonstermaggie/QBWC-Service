const QBRequest = require('../models/schemas/QBRequest.js');
const collectionsRequest = require('../scripts/collections.js');

const sendRequestXML = async function(args, callback) {
  const requestQueue = [];
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
};

module.exports = sendRequestXML;