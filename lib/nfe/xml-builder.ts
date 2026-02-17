// Gerador de XML para NF-e (Nota Fiscal Eletronica de Produto/Material)
// SEFAZ SP - Modelo 55 - Versao 4.00
// Ref: Manual de Orientacao do Contribuinte - MOC 7.0
// Layout: nfe_v4.00.xsd
// Namespace: http://www.portalfiscal.inf.br/nfe
//
// Empresa enquadrada no Simples Nacional (CRT=1)
// CSOSN 102 - Tributada pelo Simples Nacional sem permissao de credito
// CFOP 5102 - Venda de mercadoria adquirida de terceiros (operacao interna)
// Origem 0 - Nacional

import { createHash } from "crypto"

// ==================== INTERFACES ====================

export interface DadosEmitente {
  cnpj: string
  razaoSocial: string
  nomeFantasia?: string
  inscricaoEstadual: string
  crt: number // 1=Simples Nacional, 2=SN excesso, 3=Regime Normal
  endereco: {
    logradouro: string
    numero: string
    complemento?: string
    bairro: string
    codigoMunicipio: string // IBGE 7 digitos
    municipio: string
    uf: string
    cep: string
  }
}

export interface DadosDestinatario {
  tipo: "PF" | "PJ"
  cpfCnpj: string
  razaoSocial: string
  inscricaoEstadual?: string
  indicadorIE: number // 1=Contribuinte, 2=Isento, 9=Nao contribuinte
  email?: string
  telefone?: string
  endereco?: {
    logradouro: string
    numero: string
    complemento?: string
    bairro: string
    codigoMunicipio: string
    municipio: string
    uf: string
    cep: string
  }
}

export interface ItemNFe {
  numero: number // nItem sequencial 1, 2, 3...
  codigoProduto: string // cProd
  descricao: string // xProd
  ncm: string // NCM 8 digitos
  cfop: string // 5102 padrao
  unidade: string // uCom / uTrib
  quantidade: number // qCom / qTrib
  valorUnitario: number // vUnCom / vUnTrib
  valorTotal: number // vProd
  ean?: string // cEAN / cEANTrib - default "SEM GTIN"
}

export interface DadosNFe {
  emitente: DadosEmitente
  destinatario: DadosDestinatario
  itens: ItemNFe[]
  informacoesAdicionais?: string
  // Controle interno
  serie: number
  numeroNF: number
  naturezaOperacao: string // "Venda" padrao
  tipoAmbiente: number // 1=Producao, 2=Homologacao
}

// ==================== CONSTANTES ====================

// URLs dos Web Services SEFAZ SP - NF-e v4.00
// Fonte: https://www.nfe.fazenda.gov.br/portal/webServices.aspx
export const SEFAZ_SP_URLS = {
  homologacao: {
    autorizacao: "https://homologacao.nfe.fazenda.sp.gov.br/ws/nfeautorizacao4.asmx",
    retAutorizacao: "https://homologacao.nfe.fazenda.sp.gov.br/ws/nferetautorizacao4.asmx",
    consultaProtocolo: "https://homologacao.nfe.fazenda.sp.gov.br/ws/nfeconsultaprotocolo4.asmx",
    inutilizacao: "https://homologacao.nfe.fazenda.sp.gov.br/ws/nfeinutilizacao4.asmx",
    evento: "https://homologacao.nfe.fazenda.sp.gov.br/ws/nferecepcaoevento4.asmx",
    statusServico: "https://homologacao.nfe.fazenda.sp.gov.br/ws/nfestatusservico4.asmx",
  },
  producao: {
    autorizacao: "https://nfe.fazenda.sp.gov.br/ws/nfeautorizacao4.asmx",
    retAutorizacao: "https://nfe.fazenda.sp.gov.br/ws/nferetautorizacao4.asmx",
    consultaProtocolo: "https://nfe.fazenda.sp.gov.br/ws/nfeconsultaprotocolo4.asmx",
    inutilizacao: "https://nfe.fazenda.sp.gov.br/ws/nfeinutilizacao4.asmx",
    evento: "https://nfe.fazenda.sp.gov.br/ws/nferecepcaoevento4.asmx",
    statusServico: "https://nfe.fazenda.sp.gov.br/ws/nfestatusservico4.asmx",
  },
}

// SOAP Actions para NF-e v4.00
export const NFE_SOAP_ACTIONS = {
  autorizacao: "http://www.portalfiscal.inf.br/nfe/wsdl/NFeAutorizacao4/nfeAutorizacaoLote",
  retAutorizacao: "http://www.portalfiscal.inf.br/nfe/wsdl/NFeRetAutorizacao4/nfeRetAutorizacaoLote",
  consultaProtocolo: "http://www.portalfiscal.inf.br/nfe/wsdl/NFeConsultaProtocolo4/nfeConsultaNF",
  inutilizacao: "http://www.portalfiscal.inf.br/nfe/wsdl/NFeInutilizacao4/nfeInutilizacaoNF",
  evento: "http://www.portalfiscal.inf.br/nfe/wsdl/NFeRecepcaoEvento4/nfeRecepcaoEvento",
  statusServico: "http://www.portalfiscal.inf.br/nfe/wsdl/NFeStatusServico4/nfeStatusServicoNF",
}

// ==================== FUNCOES XML ====================

/**
 * Gera a chave de acesso da NF-e (44 digitos)
 * Formato: cUF(2) + AAMM(4) + CNPJ(14) + mod(2) + serie(3) + nNF(9) + tpEmis(1) + cNF(8) + cDV(1)
 */
export function gerarChaveAcesso(dados: {
  cUF: string      // 35 = SP
  dataEmissao: string // YYYY-MM-DD
  cnpj: string
  mod: string       // 55
  serie: number
  nNF: number
  tpEmis: number    // 1 = Normal
  cNF?: string      // 8 digitos random, se nao informado gera automatico
}): { chave: string; cNF: string; cDV: string } {
  const aamm = dados.dataEmissao.substring(2, 4) + dados.dataEmissao.substring(5, 7)
  const cnpj = dados.cnpj.replace(/\D/g, "").padStart(14, "0")
  const serie = dados.serie.toString().padStart(3, "0")
  const nNF = dados.nNF.toString().padStart(9, "0")
  const tpEmis = dados.tpEmis.toString()

  // cNF: 8 digitos - codigo numerico aleatorio
  const cNF = dados.cNF || Math.floor(Math.random() * 99999999).toString().padStart(8, "0")

  // Montar chave sem digito verificador (43 digitos)
  const chaveSemDV = `${dados.cUF}${aamm}${cnpj}${dados.mod}${serie}${nNF}${tpEmis}${cNF}`

  // Calcular digito verificador (modulo 11)
  const cDV = calcularDVMod11(chaveSemDV)

  return {
    chave: chaveSemDV + cDV,
    cNF,
    cDV,
  }
}

/**
 * Calcula digito verificador modulo 11 (peso 2 a 9)
 */
function calcularDVMod11(chave: string): string {
  let soma = 0
  let peso = 2
  for (let i = chave.length - 1; i >= 0; i--) {
    soma += parseInt(chave[i]) * peso
    peso = peso >= 9 ? 2 : peso + 1
  }
  const resto = soma % 11
  const dv = resto < 2 ? 0 : 11 - resto
  return dv.toString()
}

/**
 * Gera o XML da NF-e (infNFe) sem assinatura
 * Segue a estrutura exata do XML de referencia fornecido
 */
export function gerarXmlNFe(dados: DadosNFe): {
  xml: string
  chaveAcesso: string
  cNF: string
  cDV: string
} {
  const dataEmissao = new Date()
  const dhEmi = formatDateTimeISO(dataEmissao)
  const dhSaiEnt = formatDateTimeISO(new Date(dataEmissao.getTime() + 60000)) // +1 min

  // Gerar chave de acesso
  const { chave, cNF, cDV } = gerarChaveAcesso({
    cUF: "35", // SP
    dataEmissao: dataEmissao.toISOString().substring(0, 10),
    cnpj: dados.emitente.cnpj,
    mod: "55",
    serie: dados.serie,
    nNF: dados.numeroNF,
    tpEmis: 1, // Normal
  })

  const idNFe = `NFe${chave}`

  // Calcular totais - SEFAZ valida que vProd total = soma dos vProd de cada item
  // Cada vProd de item deve ser arredondado para 2 casas antes de somar
  const vProd = dados.itens.reduce((acc, item) => {
    const vProdItem = Math.round(item.valorTotal * 100) / 100
    return acc + vProdItem
  }, 0)
  const vNF = Math.round(vProd * 100) / 100 // Simples Nacional sem outros impostos

  // Calcular valor aproximado dos tributos (IBPT) - estimativa
  const vTotTrib = dados.itens.reduce((acc, item) => {
    // Estimativa de carga tributaria media para materiais: ~31.45%
    const vProdItem = Math.round(item.valorTotal * 100) / 100
    return acc + vProdItem * 0.3145
  }, 0)

  let xml = ""
  xml += `<NFe xmlns="http://www.portalfiscal.inf.br/nfe">`
  xml += `<infNFe Id="${idNFe}" versao="4.00">`

  // === ide - Identificacao da NF-e ===
  xml += `<ide>`
  xml += `<cUF>35</cUF>` // SP
  xml += `<cNF>${cNF}</cNF>`
  xml += `<natOp>${escapeXml(dados.naturezaOperacao || "Venda")}</natOp>`
  xml += `<mod>55</mod>`
  xml += `<serie>${dados.serie}</serie>`
  xml += `<nNF>${dados.numeroNF}</nNF>`
  xml += `<dhEmi>${dhEmi}</dhEmi>`
  xml += `<dhSaiEnt>${dhSaiEnt}</dhSaiEnt>`
  xml += `<tpNF>1</tpNF>` // 1=Saida
  xml += `<idDest>1</idDest>` // 1=Operacao interna
  xml += `<cMunFG>${dados.emitente.endereco.codigoMunicipio}</cMunFG>`
  xml += `<tpImp>1</tpImp>` // 1=DANFE normal retrato
  xml += `<tpEmis>1</tpEmis>` // 1=Emissao normal
  xml += `<cDV>${cDV}</cDV>`
  xml += `<tpAmb>${dados.tipoAmbiente}</tpAmb>`
  xml += `<finNFe>1</finNFe>` // 1=NF-e normal
  xml += `<indFinal>1</indFinal>` // 1=Consumidor final
  xml += `<indPres>2</indPres>` // 2=Nao presencial (internet)
  xml += `<indIntermed>0</indIntermed>` // 0=Sem intermediador
  xml += `<procEmi>0</procEmi>` // 0=Aplicativo do contribuinte
  xml += `<verProc>GestorFinanceiro 1.0</verProc>`
  xml += `</ide>`

  // === emit - Emitente ===
  xml += `<emit>`
  xml += `<CNPJ>${dados.emitente.cnpj.replace(/\D/g, "")}</CNPJ>`
  xml += `<xNome>${escapeXml(dados.emitente.razaoSocial)}</xNome>`
  if (dados.emitente.nomeFantasia) {
    xml += `<xFant>${escapeXml(dados.emitente.nomeFantasia)}</xFant>`
  }
  xml += `<enderEmit>`
  xml += `<xLgr>${escapeXml(dados.emitente.endereco.logradouro)}</xLgr>`
  xml += `<nro>${escapeXml(dados.emitente.endereco.numero)}</nro>`
  if (dados.emitente.endereco.complemento) {
    xml += `<xCpl>${escapeXml(dados.emitente.endereco.complemento)}</xCpl>`
  }
  xml += `<xBairro>${escapeXml(dados.emitente.endereco.bairro)}</xBairro>`
  xml += `<cMun>${dados.emitente.endereco.codigoMunicipio}</cMun>`
  xml += `<xMun>${escapeXml(dados.emitente.endereco.municipio)}</xMun>`
  xml += `<UF>${dados.emitente.endereco.uf}</UF>`
  xml += `<CEP>${dados.emitente.endereco.cep.replace(/\D/g, "")}</CEP>`
  xml += `<cPais>1058</cPais>`
  xml += `<xPais>BRASIL</xPais>`
  xml += `</enderEmit>`
  xml += `<IE>${dados.emitente.inscricaoEstadual.replace(/\D/g, "")}</IE>`
  xml += `<CRT>${dados.emitente.crt}</CRT>`
  xml += `</emit>`

  // === dest - Destinatario ===
  xml += `<dest>`
  if (dados.destinatario.tipo === "PJ") {
    xml += `<CNPJ>${dados.destinatario.cpfCnpj.replace(/\D/g, "")}</CNPJ>`
  } else {
    xml += `<CPF>${dados.destinatario.cpfCnpj.replace(/\D/g, "")}</CPF>`
  }
  xml += `<xNome>${escapeXml(dados.destinatario.razaoSocial)}</xNome>`
  if (dados.destinatario.endereco) {
    xml += `<enderDest>`
    xml += `<xLgr>${escapeXml(dados.destinatario.endereco.logradouro)}</xLgr>`
    xml += `<nro>${escapeXml(dados.destinatario.endereco.numero)}</nro>`
    if (dados.destinatario.endereco.complemento) {
      xml += `<xCpl>${escapeXml(dados.destinatario.endereco.complemento)}</xCpl>`
    }
    xml += `<xBairro>${escapeXml(dados.destinatario.endereco.bairro)}</xBairro>`
    xml += `<cMun>${dados.destinatario.endereco.codigoMunicipio}</cMun>`
    xml += `<xMun>${escapeXml(dados.destinatario.endereco.municipio)}</xMun>`
    xml += `<UF>${dados.destinatario.endereco.uf}</UF>`
    xml += `<CEP>${dados.destinatario.endereco.cep.replace(/\D/g, "")}</CEP>`
    xml += `</enderDest>`
  }
  xml += `<indIEDest>${dados.destinatario.indicadorIE}</indIEDest>`
  if (dados.destinatario.email) {
    xml += `<email>${escapeXml(dados.destinatario.email)}</email>`
  }
  xml += `</dest>`

  // === det - Detalhes dos itens ===
  for (const item of dados.itens) {
    const ean = item.ean || "SEM GTIN"
    const vTotTribItem = item.valorTotal * 0.3145

    xml += `<det nItem="${item.numero}">`

    // prod - Dados do produto
    // SEFAZ exige formatacao numerica estrita:
    // qCom/qTrib: ate 4 casas decimais
    // vUnCom/vUnTrib: ate 10 casas decimais (min 2)
    // vProd: exatamente 2 casas decimais
    xml += `<prod>`
    xml += `<cProd>${escapeXml(item.codigoProduto)}</cProd>`
    xml += `<cEAN>${ean}</cEAN>`
    xml += `<xProd>${escapeXml(item.descricao)}</xProd>`
    xml += `<NCM>${item.ncm.replace(/\D/g, "").padEnd(8, "0")}</NCM>`
    xml += `<CFOP>${item.cfop}</CFOP>`
    xml += `<uCom>${escapeXml(item.unidade)}</uCom>`
    xml += `<qCom>${fmtQtd(item.quantidade)}</qCom>`
    xml += `<vUnCom>${fmtValUnit(item.valorUnitario)}</vUnCom>`
    xml += `<vProd>${fmtVal(Math.round(item.valorTotal * 100) / 100)}</vProd>`
    xml += `<cEANTrib>${ean}</cEANTrib>`
    xml += `<uTrib>${escapeXml(item.unidade)}</uTrib>`
    xml += `<qTrib>${fmtQtd(item.quantidade)}</qTrib>`
    xml += `<vUnTrib>${fmtValUnit(item.valorUnitario)}</vUnTrib>`
    xml += `<indTot>1</indTot>` // 1=Compoe total
    xml += `</prod>`

    // imposto - Simples Nacional CSOSN 102
    xml += `<imposto>`
    xml += `<vTotTrib>${fmtVal(vTotTribItem)}</vTotTrib>`
    xml += `<ICMS>`
    xml += `<ICMSSN102>`
    xml += `<orig>0</orig>` // 0=Nacional
    xml += `<CSOSN>102</CSOSN>` // 102=Tributada sem permissao de credito
    xml += `</ICMSSN102>`
    xml += `</ICMS>`
    xml += `<IPI>`
    xml += `<cEnq>999</cEnq>` // 999=Outros
    xml += `<IPINT>`
    xml += `<CST>53</CST>` // 53=Saida nao tributada
    xml += `</IPINT>`
    xml += `</IPI>`
    xml += `<PIS>`
    xml += `<PISNT>`
    xml += `<CST>99</CST>` // 99=Outras operacoes
    xml += `</PISNT>`
    xml += `</PIS>`
    xml += `<COFINS>`
    xml += `<COFINSNT>`
    xml += `<CST>99</CST>`
    xml += `</COFINSNT>`
    xml += `</COFINS>`
    xml += `</imposto>`

    xml += `</det>`
  }

  // === total - Totais ===
  xml += `<total>`
  xml += `<ICMSTot>`
  xml += `<vBC>0.00</vBC>`
  xml += `<vICMS>0.00</vICMS>`
  xml += `<vICMSDeson>0.00</vICMSDeson>`
  xml += `<vFCPUFDest>0.00</vFCPUFDest>`
  xml += `<vICMSUFDest>0.00</vICMSUFDest>`
  xml += `<vICMSUFRemet>0.00</vICMSUFRemet>`
  xml += `<vFCP>0.00</vFCP>`
  xml += `<vBCST>0.00</vBCST>`
  xml += `<vST>0.00</vST>`
  xml += `<vFCPST>0.00</vFCPST>`
  xml += `<vFCPSTRet>0.00</vFCPSTRet>`
  xml += `<vProd>${fmtVal(vProd)}</vProd>`
  xml += `<vFrete>0.00</vFrete>`
  xml += `<vSeg>0.00</vSeg>`
  xml += `<vDesc>0.00</vDesc>`
  xml += `<vII>0.00</vII>`
  xml += `<vIPI>0.00</vIPI>`
  xml += `<vIPIDevol>0.00</vIPIDevol>`
  xml += `<vPIS>0.00</vPIS>`
  xml += `<vCOFINS>0.00</vCOFINS>`
  xml += `<vOutro>0.00</vOutro>`
  xml += `<vNF>${fmtVal(vNF)}</vNF>`
  xml += `<vTotTrib>${fmtVal(vTotTrib)}</vTotTrib>`
  xml += `</ICMSTot>`
  xml += `</total>`

  // === transp - Transporte ===
  xml += `<transp>`
  xml += `<modFrete>9</modFrete>` // 9=Sem frete
  xml += `</transp>`

  // === pag - Pagamento ===
  xml += `<pag>`
  xml += `<detPag>`
  xml += `<indPag>0</indPag>` // 0=A vista
  xml += `<tPag>99</tPag>` // 99=Outros
  xml += `<vPag>${fmtVal(vNF)}</vPag>`
  xml += `</detPag>`
  xml += `</pag>`

  // === infAdic - Informacoes adicionais ===
  if (dados.informacoesAdicionais) {
    xml += `<infAdic>`
    xml += `<infCpl>${escapeXml(dados.informacoesAdicionais)}</infCpl>`
    xml += `</infAdic>`
  }

  xml += `</infNFe>`
  xml += `</NFe>`

  return { xml, chaveAcesso: chave, cNF, cDV }
}

/**
 * Gera o XML do lote de envio (enviNFe)
 * Envelope para enviar ao web service NFeAutorizacao4
 */
export function gerarXmlEnviNFe(xmlNFeAssinado: string, idLote: string): string {
  return `<enviNFe xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00"><idLote>${idLote}</idLote><indSinc>1</indSinc>${xmlNFeAssinado}</enviNFe>`
}

/**
 * Gera o XML de consulta de protocolo (consSitNFe)
 */
export function gerarXmlConsultaProtocolo(chaveAcesso: string, tipoAmbiente: number): string {
  return `<consSitNFe xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00"><tpAmb>${tipoAmbiente}</tpAmb><xServ>CONSULTAR</xServ><chNFe>${chaveAcesso}</chNFe></consSitNFe>`
}

/**
 * Gera o XML de consulta status servico (consStatServ)
 */
export function gerarXmlStatusServico(tipoAmbiente: number): string {
  return `<consStatServ xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00"><tpAmb>${tipoAmbiente}</tpAmb><cUF>35</cUF><xServ>STATUS</xServ></consStatServ>`
}

/**
 * Gera o XML de cancelamento (evento 110111)
 */
export function gerarXmlCancelamento(dados: {
  chaveAcesso: string
  cnpj: string
  tipoAmbiente: number
  protocolo: string
  justificativa: string
  sequenciaEvento?: number
}): string {
  const nSeqEvento = dados.sequenciaEvento || 1
  const dhEvento = formatDateTimeISO(new Date())
  const idEvento = `ID110111${dados.chaveAcesso}${nSeqEvento.toString().padStart(2, "0")}`

  let xml = `<envEvento xmlns="http://www.portalfiscal.inf.br/nfe" versao="1.00">`
  xml += `<idLote>1</idLote>`
  xml += `<evento versao="1.00">`
  xml += `<infEvento Id="${idEvento}">`
  xml += `<cOrgao>35</cOrgao>`
  xml += `<tpAmb>${dados.tipoAmbiente}</tpAmb>`
  xml += `<CNPJ>${dados.cnpj.replace(/\D/g, "")}</CNPJ>`
  xml += `<chNFe>${dados.chaveAcesso}</chNFe>`
  xml += `<dhEvento>${dhEvento}</dhEvento>`
  xml += `<tpEvento>110111</tpEvento>`
  xml += `<nSeqEvento>${nSeqEvento}</nSeqEvento>`
  xml += `<verEvento>1.00</verEvento>`
  xml += `<detEvento versao="1.00">`
  xml += `<descEvento>Cancelamento</descEvento>`
  xml += `<nProt>${dados.protocolo}</nProt>`
  xml += `<xJust>${escapeXml(dados.justificativa)}</xJust>`
  xml += `</detEvento>`
  xml += `</infEvento>`
  xml += `</evento>`
  xml += `</envEvento>`

  return xml
}

// ==================== HELPERS ====================

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}

function formatDateTimeISO(date: Date): string {
  // Formato: 2026-02-10T22:23:01-03:00
  // Forcando timezone de Brasilia (-03:00) para consistencia
  const pad = (n: number) => n.toString().padStart(2, "0")

  // Calcular horario de Brasilia (UTC-3)
  const utcMs = date.getTime() + date.getTimezoneOffset() * 60000
  const brasiliaMs = utcMs - 3 * 3600000
  const brasilia = new Date(brasiliaMs)

  const year = brasilia.getFullYear()
  const month = pad(brasilia.getMonth() + 1)
  const day = pad(brasilia.getDate())
  const hours = pad(brasilia.getHours())
  const minutes = pad(brasilia.getMinutes())
  const seconds = pad(brasilia.getSeconds())

  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}-03:00`
}

/**
 * Formata valor monetario para NF-e (2 casas decimais)
 * SEFAZ exige formato com ponto decimal e exatamente 2 casas
 */
function fmtVal(val: number): string {
  return val.toFixed(2)
}

/**
 * Formata quantidade (4 casas decimais)
 * SEFAZ permite ate 4 casas para qCom/qTrib
 */
function fmtQtd(val: number): string {
  return val.toFixed(4)
}

/**
 * Formata valor unitario (ate 10 casas decimais)
 * SEFAZ permite ate 10 casas para vUnCom/vUnTrib
 * Remove zeros desnecessarios no final
 */
function fmtValUnit(val: number): string {
  // Usar ate 10 casas, mas remover zeros no final (minimo 2 casas)
  const str = val.toFixed(10)
  // Remove trailing zeros but keep at least 2 decimal places
  const parts = str.split(".")
  let decimals = parts[1].replace(/0+$/, "")
  if (decimals.length < 2) decimals = decimals.padEnd(2, "0")
  return `${parts[0]}.${decimals}`
}
