/**
 * Script que baixa os XSDs oficiais do PL_009_V4 e valida o XML da NF-e
 * contra eles para identificar o EXATO campo que causa erro 225.
 */
import { execSync } from "child_process"
import fs from "fs"
import path from "path"

// O XML EXATO que esta sendo enviado para a SEFAZ (copiado dos logs)
const xmlEnviNFe = `<enviNFe xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00"><idLote>1771306289768</idLote><indSinc>1</indSinc><NFe><infNFe Id="NFe35260249895742000111550010000001561563568518" versao="4.00"><ide><cUF>35</cUF><cNF>56356851</cNF><natOp>Venda</natOp><mod>55</mod><serie>1</serie><nNF>156</nNF><dhEmi>2026-02-17T02:31:28-03:00</dhEmi><dhSaiEnt>2026-02-17T02:32:28-03:00</dhSaiEnt><tpNF>1</tpNF><idDest>1</idDest><cMunFG>3550308</cMunFG><tpImp>1</tpImp><tpEmis>1</tpEmis><cDV>8</cDV><tpAmb>1</tpAmb><finNFe>1</finNFe><indFinal>1</indFinal><indPres>2</indPres><procEmi>0</procEmi><verProc>GestorFinanceiro 1.0</verProc></ide><emit><CNPJ>49895742000111</CNPJ><xNome>Macintel Seguranca Eletronica e Controle de Acesso Unipessoal LTDA</xNome><xFant>Macintel Seguranca Eletronica e Controle de Acesso</xFant><enderEmit><xLgr>Rua Luis Noberto Freire,</xLgr><nro>719</nro><xBairro>Jd Brasilia</xBairro><cMun>3550308</cMun><xMun>SAO PAULO</xMun><UF>SP</UF><CEP>03585150</CEP><cPais>1058</cPais><xPais>BRASIL</xPais><fone>1141189314</fone></enderEmit><IE>138780412115</IE><CRT>1</CRT></emit><dest><CNPJ>05341743000149</CNPJ><xNome>MARCUS EMERSON ROCHA GARCIA - ME</xNome><enderDest><xLgr>RUA TAGUATO, 34</xLgr><nro>S/N</nro><xBairro>VILA FERNANDES</xBairro><cMun>3550308</cMun><xMun>SAO PAULO</xMun><UF>SP</UF><CEP>03433060</CEP><cPais>1058</cPais><xPais>BRASIL</xPais></enderDest><indIEDest>9</indIEDest><email>marcus.macintel@terra.com.br</email></dest><det nItem="1"><prod><cProd>001CTD006</cProd><cEAN>SEM GTIN</cEAN><xProd>TAG PASSIVO ADESIVO RFID UHF - CONTROL ID</xProd><NCM>85235210</NCM><CFOP>5102</CFOP><uCom>PC</uCom><qCom>1.0000</qCom><vUnCom>11.7000000000</vUnCom><vProd>11.70</vProd><cEANTrib>SEM GTIN</cEANTrib><uTrib>PC</uTrib><qTrib>1.0000</qTrib><vUnTrib>11.7000000000</vUnTrib><indTot>1</indTot></prod><imposto><vTotTrib>3.68</vTotTrib><ICMS><ICMSSN102><orig>0</orig><CSOSN>102</CSOSN></ICMSSN102></ICMS><PIS><PISNT><CST>07</CST></PISNT></PIS><COFINS><COFINSNT><CST>07</CST></COFINSNT></COFINS></imposto></det><total><ICMSTot><vBC>0.00</vBC><vICMS>0.00</vICMS><vICMSDeson>0.00</vICMSDeson><vFCP>0.00</vFCP><vBCST>0.00</vBCST><vST>0.00</vST><vFCPST>0.00</vFCPST><vFCPSTRet>0.00</vFCPSTRet><vProd>11.70</vProd><vFrete>0.00</vFrete><vSeg>0.00</vSeg><vDesc>0.00</vDesc><vII>0.00</vII><vIPI>0.00</vIPI><vIPIDevol>0.00</vIPIDevol><vPIS>0.00</vPIS><vCOFINS>0.00</vCOFINS><vOutro>0.00</vOutro><vNF>11.70</vNF><vTotTrib>3.68</vTotTrib></ICMSTot></total><transp><modFrete>9</modFrete></transp><pag><detPag><indPag>0</indPag><tPag>99</tPag><vPag>11.70</vPag></detPag></pag><infAdic><infCpl>DOCUMENTO EMITIDO POR ME OU EPP OPTANTE PELO SIMPLES NACIONAL. NAO GERA DIREITO A CREDITO FISCAL DE IPI.</infCpl></infAdic></infNFe></NFe></enviNFe>`

// Testar tambem apenas a NFe interna (sem enviNFe) com Signature fake
const xmlNFe = xmlEnviNFe
  .replace(/<enviNFe[^>]*>.*?<NFe>/, '<NFe xmlns="http://www.portalfiscal.inf.br/nfe">')
  .replace(/<\/NFe><\/enviNFe>/, '</NFe>')

console.log("=== Validacao do XML da NF-e contra XSD PL_009_V4 ===\n")

// Tentar instalar libxmljs2 para validacao XSD real
try {
  console.log("Tentando instalar libxmljs2 para validacao XSD...")
  execSync("npm install libxmljs2 2>&1", { timeout: 60000 })
  console.log("libxmljs2 instalado com sucesso!\n")

  // Baixar os XSDs necessarios
  const xsdDir = "/tmp/nfe-xsd"
  fs.mkdirSync(xsdDir, { recursive: true })

  const baseUrl = "https://raw.githubusercontent.com/nfephp-org/sped-nfe/master/schemes/PL_009_V4"
  const xsdFiles = [
    "leiauteNFe_v4.00.xsd",
    "tiposBasico_v4.00.xsd",
    "xmldsig-core-schema_v1.01.xsd",
    "enviNFe_v4.00.xsd",
  ]

  console.log("Baixando XSDs...")
  for (const file of xsdFiles) {
    try {
      const url = `${baseUrl}/${file}`
      const content = execSync(`curl -sL "${url}"`, { timeout: 30000, maxBuffer: 10 * 1024 * 1024 }).toString()
      fs.writeFileSync(path.join(xsdDir, file), content)
      console.log(`  OK: ${file} (${content.length} bytes)`)
    } catch (e) {
      console.log(`  ERRO ao baixar ${file}: ${e.message}`)
    }
  }

  // Tentar validar com libxmljs2
  const libxmljs = await import("libxmljs2")

  // Validar o enviNFe
  console.log("\n--- Validando enviNFe ---")
  try {
    const enviXsdContent = fs.readFileSync(path.join(xsdDir, "enviNFe_v4.00.xsd"), "utf-8")
    const enviXsdDoc = libxmljs.parseXml(enviXsdContent)
    const xmlDoc = libxmljs.parseXml(xmlEnviNFe)
    const isValid = xmlDoc.validate(enviXsdDoc)
    if (isValid) {
      console.log("VALIDO! O XML do enviNFe e valido contra o XSD.")
    } else {
      console.log("INVALIDO! Erros encontrados:")
      const errors = xmlDoc.validationErrors
      for (const err of errors) {
        console.log(`  - Linha ${err.line}: ${err.message}`)
      }
    }
  } catch (e) {
    console.log("Erro ao validar enviNFe:", e.message)

    // Tentar validar apenas a NFe
    console.log("\n--- Validando NFe isolada ---")
    try {
      const nfeXsdContent = fs.readFileSync(path.join(xsdDir, "leiauteNFe_v4.00.xsd"), "utf-8")
      const nfeXsdDoc = libxmljs.parseXml(nfeXsdContent)
      const xmlDoc = libxmljs.parseXml(xmlNFe)
      const isValid = xmlDoc.validate(nfeXsdDoc)
      if (isValid) {
        console.log("VALIDO! O XML da NFe e valido contra o XSD.")
      } else {
        console.log("INVALIDO! Erros encontrados:")
        const errors = xmlDoc.validationErrors
        for (const err of errors) {
          console.log(`  - Linha ${err.line}: ${err.message}`)
        }
      }
    } catch (e2) {
      console.log("Erro ao validar NFe:", e2.message)
    }
  }

} catch (installErr) {
  console.log("Nao foi possivel instalar libxmljs2:", installErr.message)
  console.log("\nFazendo validacao manual detalhada...\n")
}

// Validacao manual sempre roda como backup
console.log("\n=== VALIDACAO MANUAL DETALHADA ===\n")

// Verificar cada campo do XML contra as regras do XSD
const checks = []

function checkField(name, regex, rules) {
  const match = xmlEnviNFe.match(regex)
  if (!match) {
    checks.push({ name, status: "AUSENTE", value: null, issue: "Campo nao encontrado no XML" })
    return
  }
  const value = match[1]
  for (const rule of rules) {
    if (!rule.test(value)) {
      checks.push({ name, status: "INVALIDO", value, issue: rule.message })
      return
    }
  }
  checks.push({ name, status: "OK", value })
}

function makeRule(testFn, message) {
  return { test: testFn, message }
}

// ide
checkField("cUF", /<cUF>(\d+)<\/cUF>/, [makeRule(v => v === "35", "Deve ser 35 para SP")])
checkField("cNF", /<cNF>(\d+)<\/cNF>/, [makeRule(v => /^\d{8}$/.test(v), "Deve ter exatamente 8 digitos")])
checkField("natOp", /<natOp>([^<]+)<\/natOp>/, [makeRule(v => v.length >= 1 && v.length <= 60, "1-60 chars")])
checkField("mod", /<mod>(\d+)<\/mod>/, [makeRule(v => v === "55" || v === "65", "Deve ser 55 ou 65")])
checkField("serie", /<serie>(\d+)<\/serie>/, [makeRule(v => /^[0-9]{1,3}$/.test(v), "1-3 digitos")])
checkField("nNF", /<nNF>(\d+)<\/nNF>/, [makeRule(v => /^[1-9]\d{0,8}$/.test(v), "1-9 digitos, sem zero a esquerda")])
checkField("dhEmi", /<dhEmi>([^<]+)<\/dhEmi>/, [makeRule(v => /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}$/.test(v), "Formato YYYY-MM-DDThh:mm:ss+TZD")])
checkField("tpNF", /<tpNF>(\d)<\/tpNF>/, [makeRule(v => v === "0" || v === "1", "0 ou 1")])
checkField("idDest", /<idDest>(\d)<\/idDest>/, [makeRule(v => ["1","2","3"].includes(v), "1, 2 ou 3")])
checkField("tpImp", /<tpImp>(\d)<\/tpImp>/, [makeRule(v => ["0","1","2","3","4","5"].includes(v), "0-5")])
checkField("tpEmis", /<tpEmis>(\d)<\/tpEmis>/, [makeRule(v => ["1","2","3","4","5","6","7","9"].includes(v), "1-7 ou 9")])
checkField("cDV", /<cDV>(\d)<\/cDV>/, [makeRule(v => /^\d$/.test(v), "1 digito")])
checkField("tpAmb", /<tpAmb>(\d)<\/tpAmb>/, [makeRule(v => v === "1" || v === "2", "1 ou 2")])
checkField("finNFe", /<finNFe>(\d)<\/finNFe>/, [makeRule(v => ["1","2","3","4"].includes(v), "1-4")])
checkField("indFinal", /<indFinal>(\d)<\/indFinal>/, [makeRule(v => v === "0" || v === "1", "0 ou 1")])
checkField("indPres", /<indPres>(\d)<\/indPres>/, [makeRule(v => ["0","1","2","3","4","5","9"].includes(v), "0-5 ou 9")])
checkField("procEmi", /<procEmi>(\d)<\/procEmi>/, [makeRule(v => ["0","1","2","3"].includes(v), "0-3")])
checkField("verProc", /<verProc>([^<]+)<\/verProc>/, [makeRule(v => v.length >= 1 && v.length <= 20, "1-20 chars")])

// emit
checkField("emit/CNPJ", /<emit><CNPJ>(\d+)<\/CNPJ>/, [makeRule(v => /^\d{14}$/.test(v), "Exatamente 14 digitos")])
checkField("emit/xNome", /<emit>.*?<xNome>([^<]+)<\/xNome>/s, [makeRule(v => v.length >= 2 && v.length <= 60, "2-60 chars")])
checkField("emit/IE", /<IE>(\d+)<\/IE>/, [makeRule(v => v.length >= 2 && v.length <= 14, "2-14 digitos")])
checkField("emit/CRT", /<CRT>(\d)<\/CRT>/, [makeRule(v => ["1","2","3"].includes(v), "1-3")])
checkField("CEP emit", /<enderEmit>.*?<CEP>(\d+)<\/CEP>/s, [makeRule(v => /^\d{8}$/.test(v), "8 digitos")])
checkField("cMun emit", /<enderEmit>.*?<cMun>(\d+)<\/cMun>/s, [makeRule(v => /^\d{7}$/.test(v), "7 digitos")])
checkField("cPais emit", /<enderEmit>.*?<cPais>(\d+)<\/cPais>/s, [makeRule(v => v === "1058", "1058 para Brasil")])

// dest
checkField("dest/CNPJ", /<dest><CNPJ>(\d+)<\/CNPJ>/, [makeRule(v => /^\d{14}$/.test(v) || /^\d{11}$/.test(v), "14 (CNPJ) ou 11 (CPF) digitos")])
checkField("indIEDest", /<indIEDest>(\d)<\/indIEDest>/, [makeRule(v => ["1","2","9"].includes(v), "1, 2 ou 9")])
checkField("CEP dest", /<enderDest>.*?<CEP>(\d+)<\/CEP>/s, [makeRule(v => /^\d{8}$/.test(v), "8 digitos")])

// det/prod
checkField("cProd", /<cProd>([^<]+)<\/cProd>/, [makeRule(v => v.length >= 1 && v.length <= 60, "1-60 chars")])
checkField("cEAN", /<cEAN>([^<]+)<\/cEAN>/, [makeRule(v => v === "SEM GTIN" || /^\d{8,14}$/.test(v), "SEM GTIN ou 8-14 digitos")])
checkField("xProd", /<xProd>([^<]+)<\/xProd>/, [makeRule(v => v.length >= 2 && v.length <= 120, "2-120 chars")])
checkField("NCM", /<NCM>(\d+)<\/NCM>/, [makeRule(v => /^\d{2,8}$/.test(v), "2-8 digitos")])
checkField("CFOP", /<CFOP>(\d+)<\/CFOP>/, [makeRule(v => /^\d{4}$/.test(v), "4 digitos")])
checkField("qCom", /<qCom>([^<]+)<\/qCom>/, [makeRule(v => /^\d+\.\d{1,4}$/.test(v), "Decimal com 1-4 casas")])
checkField("vUnCom", /<vUnCom>([^<]+)<\/vUnCom>/, [makeRule(v => /^\d+\.\d{1,10}$/.test(v), "Decimal com 1-10 casas")])
checkField("vProd", /<vProd>([^<]+)<\/vProd>/, [makeRule(v => /^\d+\.\d{2}$/.test(v), "Decimal com 2 casas")])

// ICMS
checkField("CSOSN", /<CSOSN>(\d+)<\/CSOSN>/, [makeRule(v => ["101","102","103","201","202","203","300","400","500","900"].includes(v), "CSOSN valido")])
checkField("orig", /<orig>(\d)<\/orig>/, [makeRule(v => ["0","1","2","3","4","5","6","7","8"].includes(v), "0-8")])

// PIS
checkField("PIS/CST", /<PISNT><CST>(\d+)<\/CST>/, [makeRule(v => ["04","05","06","07","08","09"].includes(v), "04-09 para PISNT")])

// COFINS
checkField("COFINS/CST", /<COFINSNT><CST>(\d+)<\/CST>/, [makeRule(v => ["04","05","06","07","08","09"].includes(v), "04-09 para COFINSNT")])

// total
checkField("vBC", /<vBC>([^<]+)<\/vBC>/, [makeRule(v => /^\d+\.\d{2}$/.test(v), "Decimal 2 casas")])
checkField("vNF", /<vNF>([^<]+)<\/vNF>/, [makeRule(v => /^\d+\.\d{2}$/.test(v), "Decimal 2 casas")])

// transp
checkField("modFrete", /<modFrete>(\d)<\/modFrete>/, [makeRule(v => ["0","1","2","3","4","9"].includes(v), "0-4 ou 9")])

// pag
checkField("indPag", /<indPag>(\d)<\/indPag>/, [makeRule(v => ["0","1"].includes(v), "0 ou 1")])
checkField("tPag", /<tPag>(\d+)<\/tPag>/, [makeRule(v => /^\d{2}$/.test(v), "2 digitos")])
checkField("vPag pag", /<detPag>.*?<vPag>([^<]+)<\/vPag>/s, [makeRule(v => /^\d+\.\d{2}$/.test(v), "Decimal 2 casas")])

// Resultados
console.log("Campo                    | Status    | Valor                  | Problema")
console.log("-------------------------|-----------|------------------------|-------------------")
for (const c of checks) {
  const name = c.name.padEnd(24)
  const status = c.status.padEnd(9)
  const value = (c.value || "").substring(0, 22).padEnd(22)
  const issue = c.issue || ""
  if (c.status !== "OK") {
    console.log(`${name} | ${status} | ${value} | ${issue}`)
  }
}

const invalidos = checks.filter(c => c.status !== "OK")
if (invalidos.length === 0) {
  console.log("TODOS OS CAMPOS PASSARAM NA VALIDACAO!")
  console.log("\nO problema pode estar em:")
  console.log("1. Ordem dos elementos (XSD usa xs:sequence, a ordem importa)")
  console.log("2. Caracteres especiais (acentos) no encoding")
  console.log("3. A Signature digital (xml-crypto) adicionando atributos extras")
  console.log("4. O SOAP envelope envolvendo o enviNFe")
} else {
  console.log(`\n${invalidos.length} campo(s) com problemas encontrados!`)
}

// Verificacao de ORDEM dos elementos
console.log("\n=== VERIFICACAO DE ORDEM DOS ELEMENTOS ===\n")

// Verificar a ordem dentro de <imposto>
const impostoContent = xmlEnviNFe.match(/<imposto>(.*?)<\/imposto>/s)?.[1] || ""
const impostoOrder = []
const impostoRegex = /<(vTotTrib|ICMS|IPI|II|PIS|COFINS|ISSQN|PISST|COFINSST)[\s>]/g
let m
while ((m = impostoRegex.exec(impostoContent)) !== null) {
  impostoOrder.push(m[1])
}
console.log("Ordem em <imposto>:", impostoOrder.join(" -> "))
const expectedImpostoOrder = ["vTotTrib", "ICMS", "PIS", "COFINS"]
const isCorrectOrder = JSON.stringify(impostoOrder) === JSON.stringify(expectedImpostoOrder)
console.log("Ordem correta (sem IPI):", isCorrectOrder ? "SIM" : "NAO - Problema!")

// Verificar a ordem dentro de <ICMSTot>
const icmsTotContent = xmlEnviNFe.match(/<ICMSTot>(.*?)<\/ICMSTot>/s)?.[1] || ""
const icmsTotFields = []
const icmsTotRegex = /<(v\w+|q\w+)>/g
while ((m = icmsTotRegex.exec(icmsTotContent)) !== null) {
  icmsTotFields.push(m[1])
}
console.log("\nCampos em <ICMSTot>:", icmsTotFields.join(", "))

// A ordem esperada no XSD PL_009_V4 para ICMSTot:
const expectedICMSTotOrder = [
  "vBC", "vICMS", "vICMSDeson",
  // vFCPUFDest, vICMSUFDest, vICMSUFRemet (opcionais)
  "vFCP", "vBCST", "vST", "vFCPST", "vFCPSTRet",
  // qBCMono, vICMSMono, qBCMonoReten, vICMSMonoReten, qBCMonoRet, vICMSMonoRet (opcionais)
  "vProd", "vFrete", "vSeg", "vDesc", "vII", "vIPI", "vIPIDevol", "vPIS", "vCOFINS", "vOutro", "vNF", "vTotTrib"
]
console.log("Ordem esperada:", expectedICMSTotOrder.join(", "))
const icmsTotOrderMatch = JSON.stringify(icmsTotFields) === JSON.stringify(expectedICMSTotOrder)
console.log("Ordem ICMSTot correta:", icmsTotOrderMatch ? "SIM" : "NAO - Verificar!")

// Verificar encoding de caracteres especiais
console.log("\n=== CARACTERES ESPECIAIS ===")
const specialChars = xmlEnviNFe.match(/[^\x00-\x7F]/g) || []
if (specialChars.length > 0) {
  console.log("Caracteres nao-ASCII encontrados:", [...new Set(specialChars)].join(", "))
  console.log("Total:", specialChars.length)
  // Verificar se sao UTF-8 validos
  for (const char of [...new Set(specialChars)]) {
    const code = char.charCodeAt(0)
    console.log(`  '${char}' = U+${code.toString(16).toUpperCase()} (${code})`)
  }
} else {
  console.log("Nenhum caractere nao-ASCII encontrado")
}

console.log("\n=== FIM DA VALIDACAO ===")
