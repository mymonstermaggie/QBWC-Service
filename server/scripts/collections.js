// Description: Example QBXML request to query customers with a total balance greater than or equal to 1000.00
function createQbxmlRequest(requestID) {
  return `
<?xml version="1.0" encoding="utf-8"?>
<?qbxml version="13.0"?>
<QBXML>
  <QBXMLMsgsRq onError="stopOnError">
    <CustomerQueryRq requestID="${requestID}">
    <TotalBalanceFilter> <!-- optional -->
        <!-- Operator may have one of the following values: LessThan, LessThanEqual, Equal, GreaterThan, GreaterThanEqual -->
        <Operator>GreaterThanEqual</Operator> <!-- required -->
        <Amount>4000.00</Amount> <!-- required -->
    </TotalBalanceFilter>
    <IncludeRetElement>ListID</IncludeRetElement> <!-- optional, may repeat -->
    <IncludeRetElement>FullName</IncludeRetElement> <!-- optional, may repeat -->
    <IncludeRetElement>TotalBalance</IncludeRetElement> <!-- optional, may repeat -->
    </CustomerQueryRq>
  </QBXMLMsgsRq>
</QBXML>`.trim();
}

module.exports = createQbxmlRequest;