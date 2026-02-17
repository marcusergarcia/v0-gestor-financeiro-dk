/**
 * Script para gerar um XML de exemplo da NF-e e comparar contra regras conhecidas do XSD.
 * Verifica campo por campo as restricoes do schema leiauteNFe_v4.00.xsd
 */

// Simular a geracao de XML idêntica ao xml-builder.ts
const xml = `<?xml version="1.0" encoding="UTF-8"?>
<enviNFe xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00">
<idLote>1771303925242</idLote>
<indSinc>1</indSinc>
<NFe xmlns="http://www.portalfiscal.inf.br/nfe">
<infNFe Id="NFe35260249895742000111550010000001561521415551" versao="4.00">
<ide>
<cUF>35</cUF>
<cNF>52141555</cNF>
<natOp>Venda</natOp>
<mod>55</mod>
<serie>1</serie>
<nNF>156</nNF>
<dhEmi>2026-02-17T01:52:04-03:00</dhEmi>
<dhSaiEnt>2026-02-17T01:53:04-03:00</dhSaiEnt>
<tpNF>1</tpNF>
<idDest>1</idDest>
<cMunFG>3550308</cMunFG>
<tpImp>1</tpImp>
<tpEmis>1</tpEmis>
<cDV>1</cDV>
<tpAmb>1</tpAmb>
<finNFe>1</finNFe>
<indFinal>1</indFinal>
<indPres>2</indPres>
<procEmi>0</procEmi>
<verProc>GestorFinanceiro 1.0</verProc>
</ide>
<emit>
<CNPJ>49895742000111</CNPJ>
<xNome>Macintel Seguranca Eletronica e Controle de Acesso Unipessoal LTDA</xNome>
<xFant>Macintel Seguranca Eletronica e Controle de Acesso</xFant>
<enderEmit>
<xLgr>Rua Luis Noberto Freire</xLgr>
<nro>719</nro>
<xBairro>Jd Brasilia</xBairro>
<cMun>3550308</cMun>
<xMun>SAO PAULO</xMun>
<UF>SP</UF>
<CEP>03585150</CEP>
<cPais>1058</cPais>
<xPais>BRASIL</xPais>
<fone>1141189314</fone>
</enderEmit>
<IE>138780412115</IE>
<CRT>1</CRT>
</emit>
<dest>
<CPF>47580884809</CPF>
<xNome>TESTE CLIENTE</xNome>
<enderDest>
<xLgr>Rua Teste</xLgr>
<nro>123</nro>
<xBairro>Centro</xBairro>
<cMun>3550308</cMun>
<xMun>SAO PAULO</xMun>
<UF>SP</UF>
<CEP>03433060</CEP>
<cPais>1058</cPais>
<xPais>BRASIL</xPais>
</enderDest>
<indIEDest>9</indIEDest>
</dest>
<det nItem="1">
<prod>
<cProd>001CTD01</cProd>
<cEAN>SEM GTIN</cEAN>
<xProd>TAG PASSIVO ADESIVO RFID UHF - CONTROL ID</xProd>
<NCM>85235210</NCM>
<CFOP>5102</CFOP>
<uCom>PC</uCom>
<qCom>1.0000</qCom>
<vUnCom>11.7000000000</vUnCom>
<vProd>11.70</vProd>
<cEANTrib>SEM GTIN</cEANTrib>
<uTrib>PC</uTrib>
<qTrib>1.0000</qTrib>
<vUnTrib>11.7000000000</vUnTrib>
<indTot>1</indTot>
</prod>
<imposto>
<vTotTrib>3.68</vTotTrib>
<ICMS>
<ICMSSN102>
<orig>0</orig>
<CSOSN>102</CSOSN>
</ICMSSN102>
</ICMS>
<PIS>
<PISNT>
<CST>07</CST>
</PISNT>
</PIS>
<COFINS>
<COFINSNT>
<CST>07</CST>
</COFINSNT>
</COFINS>
</imposto>
</det>
<total>
<ICMSTot>
<vBC>0.00</vBC>
<vICMS>0.00</vICMS>
<vICMSDeson>0.00</vICMSDeson>
<vFCP>0.00</vFCP>
<vBCST>0.00</vBCST>
<vST>0.00</vST>
<vFCPST>0.00</vFCPST>
<vFCPSTRet>0.00</vFCPSTRet>
<vProd>11.70</vProd>
<vFrete>0.00</vFrete>
<vSeg>0.00</vSeg>
<vDesc>0.00</vDesc>
<vII>0.00</vII>
<vIPI>0.00</vIPI>
<vIPIDevol>0.00</vIPIDevol>
<vPIS>0.00</vPIS>
<vCOFINS>0.00</vCOFINS>
<vOutro>0.00</vOutro>
<vNF>11.70</vNF>
<vTotTrib>3.68</vTotTrib>
</ICMSTot>
</total>
<transp>
<modFrete>9</modFrete>
</transp>
<pag>
<detPag>
<indPag>0</indPag>
<tPag>99</tPag>
<vPag>11.70</vPag>
</detPag>
</pag>
<infAdic>
<infCpl>teste de nota fiscal</infCpl>
</infAdic>
</infNFe>
</NFe>
</enviNFe>`;

// NF-e 4.00 XSD schema rules (from leiauteNFe_v4.00.xsd PL_008i2)
// Reference: https://www.nfe.fazenda.gov.br/portal/exibirArquivo.aspx

const errors = [];
const warnings = [];

// Helper to extract value
function getTag(xml, tag) {
  const match = xml.match(new RegExp(`<${tag}>([^<]*)</${tag}>`));
  return match ? match[1] : null;
}

function getAllTags(xml, tag) {
  const re = new RegExp(`<${tag}>([^<]*)</${tag}>`, 'g');
  const results = [];
  let m;
  while ((m = re.exec(xml)) !== null) results.push(m[1]);
  return results;
}

function checkPattern(value, pattern, fieldName) {
  if (!new RegExp(`^${pattern}$`).test(value)) {
    errors.push(`${fieldName}: value "${value}" does not match pattern /${pattern}/`);
  }
}

function checkLength(value, min, max, fieldName) {
  if (value.length < min || value.length > max) {
    errors.push(`${fieldName}: length ${value.length} not in range [${min}, ${max}] (value: "${value}")`);
  }
}

console.log("=== NF-e XML Schema Validation ===\n");

// 1. Check enviNFe structure
console.log("--- enviNFe envelope ---");
const hasEnviNFe = xml.includes('<enviNFe');
const hasNFe = xml.includes('<NFe');
const hasInfNFe = xml.includes('<infNFe');
console.log("enviNFe:", hasEnviNFe, "| NFe:", hasNFe, "| infNFe:", hasInfNFe);

// 2. Check Id format: "NFe" + 44 digits
const idMatch = xml.match(/Id="(NFe\d+)"/);
if (idMatch) {
  const id = idMatch[1];
  console.log("Id:", id, "| length:", id.length, "(expected 47 = 'NFe' + 44 digits)");
  if (id.length !== 47) errors.push(`Id: length ${id.length} != 47`);
  if (!/^NFe\d{44}$/.test(id)) errors.push(`Id: pattern mismatch`);
}

// 3. Check ide fields
console.log("\n--- ide ---");
const cUF = getTag(xml, 'cUF');
const cNF = getTag(xml, 'cNF');
const natOp = getTag(xml, 'natOp');
const mod = getTag(xml, 'mod');
const serie = getTag(xml, 'serie');
const nNF = getTag(xml, 'nNF');

console.log("cUF:", cUF, "| cNF:", cNF, "| natOp:", natOp);
console.log("mod:", mod, "| serie:", serie, "| nNF:", nNF);

if (cUF) checkPattern(cUF, '[0-9]{2}', 'cUF');
if (cNF) checkPattern(cNF, '[0-9]{8}', 'cNF');
if (natOp) checkLength(natOp, 1, 60, 'natOp');
if (mod) checkPattern(mod, '55|65', 'mod');
if (serie) checkPattern(serie, '[0-9]{1,3}', 'serie');
if (nNF) checkPattern(nNF, '[1-9][0-9]{0,8}', 'nNF');

// 4. Check date format
const dhEmi = getTag(xml, 'dhEmi');
const dhSaiEnt = getTag(xml, 'dhSaiEnt');
console.log("dhEmi:", dhEmi);
console.log("dhSaiEnt:", dhSaiEnt);
// Pattern: TDateTimeUTC - AAAA-MM-DDThh:mm:ssTZD (TZD = +hh:00 ou -hh:00)
const datePattern = '\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}[+-]\\d{2}:\\d{2}';
if (dhEmi) checkPattern(dhEmi, datePattern, 'dhEmi');
if (dhSaiEnt) checkPattern(dhSaiEnt, datePattern, 'dhSaiEnt');

// 5. Check CNPJ emit
console.log("\n--- emit ---");
const cnpjEmit = getTag(xml, 'CNPJ');
console.log("CNPJ:", cnpjEmit, "| length:", cnpjEmit?.length);
if (cnpjEmit) checkPattern(cnpjEmit, '[0-9]{14}', 'CNPJ emit');

const IE = getTag(xml, 'IE');
console.log("IE:", IE, "| length:", IE?.length);
// IE pattern: [0-9]{2,14}
if (IE) checkPattern(IE, '[0-9]{2,14}', 'IE');

const CRT = getTag(xml, 'CRT');
console.log("CRT:", CRT);
if (CRT) checkPattern(CRT, '[1-3]', 'CRT');

// 6. Check enderEmit field order
console.log("\n--- enderEmit (field order) ---");
const enderEmitMatch = xml.match(/<enderEmit>([\s\S]*?)<\/enderEmit>/);
if (enderEmitMatch) {
  const enderEmit = enderEmitMatch[1];
  // XSD sequence order: xLgr, nro, xCpl?, xBairro, cMun, xMun, UF, CEP, cPais?, xPais?, fone?
  const expectedOrder = ['xLgr', 'nro', 'xCpl', 'xBairro', 'cMun', 'xMun', 'UF', 'CEP', 'cPais', 'xPais', 'fone'];
  const actualFields = [];
  for (const tag of expectedOrder) {
    const pos = enderEmit.indexOf(`<${tag}>`);
    if (pos >= 0) actualFields.push({ tag, pos });
  }
  let lastPos = -1;
  for (const field of actualFields) {
    if (field.pos < lastPos) {
      errors.push(`enderEmit: field ${field.tag} is out of order (must follow XSD sequence)`);
    }
    lastPos = field.pos;
  }
  console.log("Fields present and order:", actualFields.map(f => f.tag).join(', '));
  console.log("Order check: PASSED (all in correct sequence)");
  
  // Check cPais value
  const cPais = getTag(enderEmit, 'cPais');
  console.log("cPais:", cPais, "(expected: 1058)");
  if (cPais && cPais !== '1058') errors.push(`cPais: ${cPais} != 1058`);
  
  // Check fone format
  const fone = getTag(enderEmit, 'fone');
  console.log("fone:", fone, "| length:", fone?.length);
  if (fone) checkPattern(fone, '[0-9]{6,14}', 'fone');
}

// 7. Check dest
console.log("\n--- dest ---");
const cpfDest = xml.match(/<dest>[\s\S]*?<CPF>([^<]+)<\/CPF>/);
const cnpjDest = xml.match(/<dest>[\s\S]*?<CNPJ>([^<]+)<\/CNPJ>/);
if (cpfDest) {
  console.log("CPF dest:", cpfDest[1], "| length:", cpfDest[1].length);
  checkPattern(cpfDest[1], '[0-9]{11}', 'CPF dest');
}
if (cnpjDest) {
  console.log("CNPJ dest:", cnpjDest[1], "| length:", cnpjDest[1].length);
  checkPattern(cnpjDest[1], '[0-9]{14}', 'CNPJ dest');
}

const indIEDest = getTag(xml, 'indIEDest');
console.log("indIEDest:", indIEDest);
if (indIEDest) checkPattern(indIEDest, '[129]', 'indIEDest');

// 8. Check det/prod
console.log("\n--- det/prod ---");
const detMatch = xml.match(/<det nItem="(\d+)">([\s\S]*?)<\/det>/);
if (detMatch) {
  const nItem = detMatch[1];
  const detContent = detMatch[2];
  console.log("nItem:", nItem);
  
  const cProd = getTag(detContent, 'cProd');
  const cEAN = getTag(detContent, 'cEAN');
  const xProd = getTag(detContent, 'xProd');
  const NCM = getTag(detContent, 'NCM');
  const CFOP = getTag(detContent, 'CFOP');
  
  console.log("cProd:", cProd, "| cEAN:", cEAN);
  console.log("xProd:", xProd?.substring(0, 40));
  console.log("NCM:", NCM, "| length:", NCM?.length, "| CFOP:", CFOP);
  
  if (cProd) checkLength(cProd, 1, 60, 'cProd');
  // cEAN: SEM GTIN or [0-9]{8}|[0-9]{12,14}
  if (cEAN && cEAN !== 'SEM GTIN') checkPattern(cEAN, '[0-9]{8}|[0-9]{12,14}', 'cEAN');
  if (xProd) checkLength(xProd, 1, 120, 'xProd');
  // NCM: pattern [0-9]{2}|[0-9]{8}
  if (NCM) checkPattern(NCM, '[0-9]{2}|[0-9]{8}', 'NCM');
  if (CFOP) checkPattern(CFOP, '[1-7][0-9]{3}', 'CFOP');
  
  const qCom = getTag(detContent, 'qCom');
  const vUnCom = getTag(detContent, 'vUnCom');
  const vProd = getTag(detContent, 'vProd');
  console.log("qCom:", qCom, "| vUnCom:", vUnCom, "| vProd:", vProd);
  
  // TDec_1104v: 0|0\.[0-9]{1,4}|[1-9]{1}[0-9]{0,10}(\.[0-9]{1,4})?
  if (qCom) checkPattern(qCom, '0|0\\.[0-9]{1,4}|[1-9]{1}[0-9]{0,10}(\\.[0-9]{1,4})?', 'qCom');
  // TDec_1110v: 0|0\.[0-9]{1,10}|[1-9]{1}[0-9]{0,10}(\.[0-9]{1,10})?
  if (vUnCom) checkPattern(vUnCom, '0|0\\.[0-9]{1,10}|[1-9]{1}[0-9]{0,10}(\\.[0-9]{1,10})?', 'vUnCom');
  // TDec_1302: 0|0\.[0-9]{2}|[1-9]{1}[0-9]{0,12}(\.[0-9]{2})?
  if (vProd) checkPattern(vProd, '0|0\\.[0-9]{2}|[1-9]{1}[0-9]{0,12}(\\.[0-9]{2})?', 'vProd');
}

// 9. Check ICMS for Simples Nacional (ICMSSN102)
console.log("\n--- imposto/ICMS ---");
const icmssn = xml.includes('<ICMSSN102>');
console.log("ICMSSN102:", icmssn);
const orig = getTag(xml, 'orig');
const CSOSN = getTag(xml, 'CSOSN');
console.log("orig:", orig, "| CSOSN:", CSOSN);
if (orig) checkPattern(orig, '[0-8]', 'orig');
if (CSOSN) checkPattern(CSOSN, '102|103|300|400|500', 'CSOSN (for ICMSSN102)');

// 10. Check PIS/COFINS
console.log("\n--- PIS/COFINS ---");
const pisCST = xml.match(/<PISNT>\s*<CST>([^<]+)<\/CST>\s*<\/PISNT>/);
const cofinsCST = xml.match(/<COFINSNT>\s*<CST>([^<]+)<\/CST>\s*<\/COFINSNT>/);
console.log("PIS CST:", pisCST?.[1], "| COFINS CST:", cofinsCST?.[1]);
// PISNT CST: 04|05|06|07|08|09
if (pisCST) checkPattern(pisCST[1], '0[4-9]', 'PISNT CST');
if (cofinsCST) checkPattern(cofinsCST[1], '0[4-9]', 'COFINSNT CST');

// 11. Check ICMSTot field order
console.log("\n--- total/ICMSTot (field order) ---");
const icmsTotMatch = xml.match(/<ICMSTot>([\s\S]*?)<\/ICMSTot>/);
if (icmsTotMatch) {
  const icmsTot = icmsTotMatch[1];
  // PL_008i2 expected order:
  // vBC, vICMS, vICMSDeson, vFCPUFDest?, vICMSUFDest?, vICMSUFRemet?, vFCP, vBCST, vST, vFCPST, vFCPSTRet, vProd, vFrete, vSeg, vDesc, vII, vIPI, vIPIDevol, vPIS, vCOFINS, vOutro, vNF, vTotTrib
  const expectedICMSTotOrder = [
    'vBC', 'vICMS', 'vICMSDeson', 'vFCPUFDest', 'vICMSUFDest', 'vICMSUFRemet',
    'vFCP', 'vBCST', 'vST', 'vFCPST', 'vFCPSTRet',
    'vProd', 'vFrete', 'vSeg', 'vDesc', 'vII', 'vIPI', 'vIPIDevol',
    'vPIS', 'vCOFINS', 'vOutro', 'vNF', 'vTotTrib'
  ];
  
  const actualICMSFields = [];
  for (const tag of expectedICMSTotOrder) {
    const pos = icmsTot.indexOf(`<${tag}>`);
    if (pos >= 0) actualICMSFields.push({ tag, pos });
  }
  console.log("Fields present:", actualICMSFields.map(f => f.tag).join(', '));
  
  // Check for missing fields in the PRESENT list (some are optional)
  const requiredICMSTot = ['vBC', 'vICMS', 'vICMSDeson', 'vFCP', 'vBCST', 'vST', 'vFCPST', 'vFCPSTRet', 'vProd', 'vFrete', 'vSeg', 'vDesc', 'vII', 'vIPI', 'vIPIDevol', 'vPIS', 'vCOFINS', 'vOutro', 'vNF', 'vTotTrib'];
  const optionalICMSTot = ['vFCPUFDest', 'vICMSUFDest', 'vICMSUFRemet'];
  
  for (const tag of requiredICMSTot) {
    if (!icmsTot.includes(`<${tag}>`)) {
      errors.push(`ICMSTot: MISSING required field <${tag}>`);
    }
  }
  
  for (const tag of optionalICMSTot) {
    if (!icmsTot.includes(`<${tag}>`)) {
      warnings.push(`ICMSTot: optional field <${tag}> not present (this is OK)`);
    }
  }
}

// 12. Check pag/detPag
console.log("\n--- pag/detPag ---");
const indPag = getTag(xml, 'indPag');
const tPag = getTag(xml, 'tPag');
const vPagTag = getTag(xml, 'vPag');
console.log("indPag:", indPag, "| tPag:", tPag, "| vPag:", vPagTag);
if (indPag) checkPattern(indPag, '[012]', 'indPag');
// tPag: pattern [0-9]{2}
if (tPag) checkPattern(tPag, '[0-9]{2}', 'tPag');

// 13. Check transp
console.log("\n--- transp ---");
const modFrete = getTag(xml, 'modFrete');
console.log("modFrete:", modFrete);
if (modFrete) checkPattern(modFrete, '[0-4|9]', 'modFrete');

// 14. Check if infAdic text exceeds 5000 chars
console.log("\n--- infAdic ---");
const infCpl = getTag(xml, 'infCpl');
console.log("infCpl:", infCpl, "| length:", infCpl?.length);
if (infCpl && infCpl.length > 5000) errors.push(`infCpl: length ${infCpl.length} > 5000`);

// === RESULTS ===
console.log("\n\n=== VALIDATION RESULTS ===");
console.log(`Errors: ${errors.length}`);
for (const e of errors) console.log("  ERROR:", e);
console.log(`Warnings: ${warnings.length}`);
for (const w of warnings) console.log("  WARN:", w);

if (errors.length === 0) {
  console.log("\nAll field validations PASSED. The schema error may be caused by:");
  console.log("1. The Signature element (xml-crypto may add invalid namespace attributes)");
  console.log("2. The SOAP envelope structure (nfeDadosMsg namespace)");
  console.log("3. A newer PL version with additional required fields");
  console.log("4. Character encoding issues (accented chars in xNome, xLgr, etc.)");
  console.log("\nChecking for common encoding issues...");
  
  // Check for characters outside the NF-e allowed range
  const textFields = ['xNome', 'xFant', 'xLgr', 'nro', 'xBairro', 'xMun', 'xProd', 'infCpl', 'natOp'];
  for (const field of textFields) {
    const allValues = getAllTags(xml, field);
    for (const val of allValues) {
      // Check for &, <, > that should be escaped
      if (val.includes('&') && !val.includes('&amp;') && !val.includes('&lt;') && !val.includes('&gt;') && !val.includes('&quot;') && !val.includes('&apos;')) {
        errors.push(`${field}: contains unescaped '&' character`);
      }
      // Check for special chars
      if (/[^\x20-\xFF]/.test(val)) {
        warnings.push(`${field}: contains characters outside \\x20-\\xFF range: "${val}"`);
      }
    }
  }
  
  if (errors.length > 0) {
    console.log("\nEncoding issues found:");
    for (const e of errors) console.log("  ERROR:", e);
  } else {
    console.log("No encoding issues found in text fields.");
  }
}
