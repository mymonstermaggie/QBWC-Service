// Description: Example QBXML request to query customers with a total balance greater than or equal to 1000.00
const qbxmlRequest = `
<?xml version="1.0" encoding="utf-8"?>
<?qbxml version="13.0"?>
<QBXML>
  <QBXMLMsgsRq onError="stopOnError">
    <CustomerQueryRq requestID="1">
    <TotalBalanceFilter> <!-- optional -->
        <!-- Operator may have one of the following values: LessThan, LessThanEqual, Equal, GreaterThan, GreaterThanEqual -->
        <Operator >GreaterThanEqual</Operator> <!-- required -->
        <Amount>1000.00</Amount> <!-- required -->
    </TotalBalanceFilter>
    </CustomerQueryRq>
  </QBXMLMsgsRq>
</QBXML>`.trim();

module.exports = qbxmlRequest;