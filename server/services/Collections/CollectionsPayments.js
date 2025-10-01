const mongoose = require('mongoose');
const QBRequest = require('../../models/Schemas/QBRequest'); 
const CollectionsReport = require('../../models/Schemas/CollectionsReport'); 

async function collectionsPayments(responseData, requestID) {
    if (responseData.$.statusCode === '0') {
        console.log('Processing Collections Payment response for requestID:', requestID);
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
    else if(responseData.$.statusCode === '1') {
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
    console.warn('Collections payment response error for requestID:', requestID, 'Status Code:', responseData.$.statusCode);
    }
}

module.exports = collectionsPayments;