// Description: Example QBXML request to query customers with a total balance greater than or equal to 1000.00
function createQbxmlRequest(requestID) {
  return `
<?xml version="1.0" encoding="utf-8"?>
<?qbxml version="13.0"?>
<QBXML>
  <QBXMLMsgsRq onError="stopOnError">
    <CustomerQueryRq requestID="${requestID}">
      <ActiveStatus>ActiveOnly</ActiveStatus>
      <TotalBalanceFilter> 
          <Operator>GreaterThanEqual</Operator> 
          <Amount>1000.00</Amount>
      </TotalBalanceFilter>
      <OwnerID>0</OwnerID>
    </CustomerQueryRq>
  </QBXMLMsgsRq>
</QBXML>`.trim();
}

module.exports = createQbxmlRequest;