const mongoose = require('mongoose');
const QBRequest = require('../../models/Schemas/QBRequest'); 
const CollectionsReport = require('../../models/Schemas/CollectionsReport'); 

async function collectionsPayments(responseData, requestID) {
    if(requestID){
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
                const daysOverdue = mostRecent.TxnDate ? Math.floor((new Date() - new Date(mostRecent.TxnDate)) / (1000 * 60 * 60 * 24)) : null;


                // Mark the request as processed
                await CollectionsReport.findOneAndUpdate(
                { listID: requestID},
                {
                    processed: true,
                    lastPaymentDate: new Date(mostRecent.TxnDate),
                    lastPaymentAmount: parseFloat(mostRecent.TotalAmount),
                    totalRecentAmount: totalRecentAmount,
                    daysOverdue: daysOverdue
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
            const daysOverdue = mostRecent.TxnDate ? Math.floor((new Date() - new Date(mostRecent.TxnDate)) / (1000 * 60 * 60 * 24)) : null;
    
            // Mark the request as processed
            CollectionsReport.findOneAndUpdate(
                { listID: requestID},
                {
                processed: true,
                lastPaymentDate: new Date(mostRecent.TxnDate),
                lastPaymentAmount: parseFloat(mostRecent.TotalAmount),
                totalRecentAmount: totalRecentAmount,
                daysOverdue: daysOverdue
                },
                { new: true })
            .then((response) => {console.log("Added to reports table")})
            .catch((updateErr) => {console.error('Error updating request status:', updateErr)});
            }
        }
        else if(responseData.$.statusCode === '1') {
            // Mark the request as processed
            await CollectionsReport.findOneAndUpdate(
            { listID: requestID},
            {
                processed: true,
                lastPaymentDate: null,
                lastPaymentAmount: null,
                daysOverdue: null,
            },
            { new: true })
            .then((response) => {console.log("Added to reports table")})
            .catch((updateErr) => {console.error('Error updating request status:', updateErr)});
        }
        

        let thisClient = await CollectionsReport.findOne({ listID: requestID})
            .then((response) => {return response})
            .catch((updateErr) => {console.log('Error finding listID:', updateErr); return null});

        if (thisClient){
            let noticeType = null
            let balance = thisClient.balance || 0;
            let daysOverdue = thisClient.daysOverdue === 0 ?  thisClient.daysOverdue : Math.floor((new Date() - new Date(thisClient.startDate)));
            let deviceCount = thisClient.deviceCount || 0;
            let billingType = thisClient.billingType || null;
            let startDate = thisClient.startDate || null;
            
            let lastPaymentDate = thisClient.lastPaymentDate || null;
            let lastPaymentAmount = thisClient.lastPaymentAmount || 0;
            let totalRecentAmount = thisClient.totalRecentAmount || 0;


            const agencyRegex = new RegExp("agency", 'i'); // 'i' flag for case-insensitive
            const pendingRegex = new RegExp("pending", 'i'); // 'i' flag for case-insensitive
            const closedRegex = new RegExp("closed", 'i'); // 'i' flag for case-insensitive


            if (billingType && agencyRegex.test(billingType)){
                noticeType = null
            }
            else if (!billingType || pendingRegex.test(billingType)){
                noticeType = 0;
            } 
            else if(billingType && closedRegex.test(billingType)){
                noticeType = 1;
            } 
            else if (balance >= 500){
                noticeType = 6;
            } 
            else {
                useDate = startDate < lastPaymentDate ? lastPaymentDate : startDate;
                
                if (useDate >= 90){
                    noticeType = 5;
                } else if (useDate >= 60){
                    noticeType = 4;
                } else if (useDate >= 30){
                    noticeType = 3;
                } else if (useDate >= 1){
                    totalRecentAmount <= deviceCount * 40
                    noticeType = 2;
                } 
            }

            await CollectionsReport.findOneAndUpdate(
                { listID: requestID},
                {
                    noticeType: noticeType
                },
                { new: true })
                .then((response) => {console.log("Updated notice type in reports table")})
                .catch((updateErr) => {console.error('Error updating notice type:', updateErr)});

        }
        else {
            console.log("no this client or not processed yet")
        }
    }









    else {
    console.warn('Collections payment response error for requestID:', requestID, 'Status Code:', responseData.$.statusCode);
    }
}

module.exports = collectionsPayments;