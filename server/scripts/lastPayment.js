function createQbxmlRequest(requestID) {
  return `
<?xml version="1.0" encoding="utf-8"?>
<?qbxml version="13.0"?>
<QBXML>
  <QBXMLMsgsRq onError="stopOnError">
    <ReceivePaymentQueryRq requestID="${requestID}">
      <EntityFilter>
          <ListID>${requestID}</ListID>
      </EntityFilter>
      <OwnerID>0</OwnerID>
    </ReceivePaymentQueryRq>
  </QBXMLMsgsRq>
</QBXML>`.trim();
}

module.exports = createQbxmlRequest;