/**
 * Test what xml-crypto generates for the Signature element.
 * We use a self-signed test cert to see the exact XML structure.
 */
import { SignedXml } from "xml-crypto";
import forge from "node-forge";

// Generate a self-signed test cert for testing only
const keys = forge.pki.rsa.generateKeyPair(2048);
const cert = forge.pki.createCertificate();
cert.publicKey = keys.publicKey;
cert.serialNumber = "01";
cert.validity.notBefore = new Date();
cert.validity.notAfter = new Date();
cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 1);
const attrs = [{ name: "commonName", value: "Test" }];
cert.setSubject(attrs);
cert.setIssuer(attrs);
cert.sign(keys.privateKey, forge.md.sha256.create());

const certPem = forge.pki.certificateToPem(cert);
const keyPem = forge.pki.privateKeyToPem(keys.privateKey);
const certBase64 = certPem
  .replace(/-----BEGIN CERTIFICATE-----/g, "")
  .replace(/-----END CERTIFICATE-----/g, "")
  .replace(/[\r\n\s]/g, "");

// Minimal NF-e XML (same structure as our builder)
const xmlBody = `<NFe xmlns="http://www.portalfiscal.inf.br/nfe"><infNFe Id="NFe35260249895742000111550010000001561521415551" versao="4.00"><ide><cUF>35</cUF><cNF>52141555</cNF><natOp>Venda</natOp><mod>55</mod><serie>1</serie><nNF>156</nNF><dhEmi>2026-02-17T01:52:04-03:00</dhEmi><tpNF>1</tpNF><idDest>1</idDest><cMunFG>3550308</cMunFG><tpImp>1</tpImp><tpEmis>1</tpEmis><cDV>1</cDV><tpAmb>1</tpAmb><finNFe>1</finNFe><indFinal>1</indFinal><indPres>2</indPres><procEmi>0</procEmi><verProc>GestorFinanceiro 1.0</verProc></ide><emit><CNPJ>49895742000111</CNPJ><xNome>Test</xNome><enderEmit><xLgr>Rua Test</xLgr><nro>1</nro><xBairro>Centro</xBairro><cMun>3550308</cMun><xMun>SAO PAULO</xMun><UF>SP</UF><CEP>03585150</CEP><cPais>1058</cPais><xPais>BRASIL</xPais></enderEmit><IE>138780412115</IE><CRT>1</CRT></emit><dest><CPF>47580884809</CPF><xNome>Dest Test</xNome><enderDest><xLgr>Rua Test</xLgr><nro>1</nro><xBairro>Centro</xBairro><cMun>3550308</cMun><xMun>SAO PAULO</xMun><UF>SP</UF><CEP>03433060</CEP><cPais>1058</cPais><xPais>BRASIL</xPais></enderDest><indIEDest>9</indIEDest></dest><det nItem="1"><prod><cProd>001</cProd><cEAN>SEM GTIN</cEAN><xProd>TESTE PRODUTO</xProd><NCM>85235210</NCM><CFOP>5102</CFOP><uCom>PC</uCom><qCom>1.0000</qCom><vUnCom>10.0000000000</vUnCom><vProd>10.00</vProd><cEANTrib>SEM GTIN</cEANTrib><uTrib>PC</uTrib><qTrib>1.0000</qTrib><vUnTrib>10.0000000000</vUnTrib><indTot>1</indTot></prod><imposto><vTotTrib>3.00</vTotTrib><ICMS><ICMSSN102><orig>0</orig><CSOSN>102</CSOSN></ICMSSN102></ICMS><PIS><PISNT><CST>07</CST></PISNT></PIS><COFINS><COFINSNT><CST>07</CST></COFINSNT></COFINS></imposto></det><total><ICMSTot><vBC>0.00</vBC><vICMS>0.00</vICMS><vICMSDeson>0.00</vICMSDeson><vFCP>0.00</vFCP><vBCST>0.00</vBCST><vST>0.00</vST><vFCPST>0.00</vFCPST><vFCPSTRet>0.00</vFCPSTRet><vProd>10.00</vProd><vFrete>0.00</vFrete><vSeg>0.00</vSeg><vDesc>0.00</vDesc><vII>0.00</vII><vIPI>0.00</vIPI><vIPIDevol>0.00</vIPIDevol><vPIS>0.00</vPIS><vCOFINS>0.00</vCOFINS><vOutro>0.00</vOutro><vNF>10.00</vNF><vTotTrib>3.00</vTotTrib></ICMSTot></total><transp><modFrete>9</modFrete></transp><pag><detPag><indPag>0</indPag><tPag>99</tPag><vPag>10.00</vPag></detPag></pag><infAdic><infCpl>teste</infCpl></infAdic></infNFe></NFe>`;

console.log("=== Testing xml-crypto Signature output ===\n");

const sig = new SignedXml({
  privateKey: keyPem,
  publicCert: certPem,
  signatureAlgorithm: "http://www.w3.org/2000/09/xmldsig#rsa-sha1",
  canonicalizationAlgorithm: "http://www.w3.org/TR/2001/REC-xml-c14n-20010315",
  getKeyInfoContent: () => {
    return `<X509Data><X509Certificate>${certBase64}</X509Certificate></X509Data>`;
  },
});

sig.addReference({
  xpath: `//*[local-name(.)='infNFe']`,
  transforms: [
    "http://www.w3.org/2000/09/xmldsig#enveloped-signature",
    "http://www.w3.org/TR/2001/REC-xml-c14n-20010315",
  ],
  digestAlgorithm: "http://www.w3.org/2000/09/xmldsig#sha1",
  uri: `#NFe35260249895742000111550010000001561521415551`,
});

sig.computeSignature(xmlBody, {
  location: {
    reference: `//*[local-name(.)='NFe']`,
    action: "append",
  },
});

const signedXml = sig.getSignedXml();

// Extract just the Signature element
const sigMatch = signedXml.match(/<Signature[\s\S]*?<\/Signature>/);
if (sigMatch) {
  console.log("--- Signature element (FULL) ---");
  console.log(sigMatch[0].substring(0, 2000));
  console.log("\n--- Signature opening tag ---");
  const openTag = sigMatch[0].match(/<Signature[^>]*>/);
  console.log(openTag?.[0]);
  
  // Check for extra xmlns attributes
  const hasExtraNs = openTag?.[0].includes('xmlns:');
  const hasDefaultNs = openTag?.[0].includes('xmlns=');
  console.log("\nHas extra xmlns: prefixed:", hasExtraNs);
  console.log("Has default xmlns:", hasDefaultNs);
  
  // Check what namespaces are on the Signature element
  const nsMatches = openTag?.[0].match(/xmlns[^=]*="[^"]+"/g);
  if (nsMatches) {
    console.log("\nNamespace declarations on Signature:");
    for (const ns of nsMatches) {
      console.log("  ", ns);
    }
  }
  
  // Check if the Signature element has the NF-e namespace
  if (openTag?.[0].includes('http://www.portalfiscal.inf.br/nfe')) {
    console.log("\n*** PROBLEM FOUND: Signature has NF-e namespace declaration!");
    console.log("*** The NF-e XSD does not expect Signature to declare the NF-e namespace.");
    console.log("*** This namespace is inherited from the parent <NFe> element.");
    console.log("*** xml-crypto is copying the parent namespace to the Signature element.");
  }
} else {
  console.log("ERROR: Signature element not found in signed XML");
}

// Also check the full structure around </infNFe> and <Signature>
const infNFeEnd = signedXml.indexOf('</infNFe>');
const nfeEnd = signedXml.indexOf('</NFe>');
if (infNFeEnd >= 0 && nfeEnd >= 0) {
  const between = signedXml.substring(infNFeEnd, nfeEnd + 6);
  console.log("\n--- Content between </infNFe> and </NFe> ---");
  console.log(between.substring(0, 500));
}

console.log("\n--- Full signed XML (first 3000 chars) ---");
console.log(signedXml.substring(0, 3000));
