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
  telefone?: string // Telefone do emitente (somente digitos)
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
  // Data/hora de emissao no fuso de Sao Paulo (America/Sao_Paulo)
  // Formato: YYYY-MM-DD (usado para chave de acesso e datas)
  dataEmissaoSP?: string // YYYY-MM-DD no fuso SP
  dhEmiSP?: string // YYYY-MM-DDTHH:mm:ss-03:00 completo no fuso SP
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
  // Usar data pre-computada no fuso de SP (passada pela API route) ou gerar localmente
  // A Vercel roda em UTC, entao new Date() pode retornar o dia seguinte quando em SP
  // ainda e o dia anterior (ex: 22h SP = 01h UTC do dia seguinte).
  let dhEmi: string
  let dhSaiEnt: string
  let dataParaChave: string // YYYY-MM-DD no fuso SP

  if (dados.dhEmiSP && dados.dataEmissaoSP) {
    // Usar data ja calculada no fuso correto de SP
    dhEmi = dados.dhEmiSP
    // dhSaiEnt: incrementar 1 minuto no segundo campo
    const emiDate = new Date(dados.dhEmiSP)
    emiDate.setMinutes(emiDate.getMinutes() + 1)
    dhSaiEnt = formatDateTimeSP(emiDate)
    dataParaChave = dados.dataEmissaoSP
  } else {
    // Fallback: calcular localmente (pode estar errado em UTC)
    const dataEmissao = new Date()
    dhEmi = formatDateTimeSP(dataEmissao)
    dhSaiEnt = formatDateTimeSP(new Date(dataEmissao.getTime() + 60000))
    dataParaChave = getDateStringSP(dataEmissao)
  }

  // Gerar chave de acesso
  const { chave, cNF, cDV } = gerarChaveAcesso({
    cUF: "35", // SP
    dataEmissao: dataParaChave,
    cnpj: dados.emitente.cnpj,
    mod: "55",
    serie: dados.serie,
    nNF: dados.numeroNF,
    tpEmis: 1, // Normal
  })

  const idNFe = `NFe${chave}`

  // Calcular totais
  const vProd = dados.itens.reduce((acc, item) => acc + item.valorTotal, 0)
  const vNF = vProd // Simples Nacional sem outros impostos

  // Calcular valor aproximado dos tributos (IBPT) - estimativa
  const vTotTrib = dados.itens.reduce((acc, item) => {
    // Estimativa de carga tributaria media para materiais: ~31.45%
    return acc + item.valorTotal * 0.3145
  }, 0)

  let xml = ""
  xml += `<NFe xmlns="http://www.portalfiscal.inf.br/nfe">`
  xml += `<infNFe Id="${idNFe}" versao="4.00">`

  // === ide - Identificacao da NF-e ===
  xml += `<ide>`
  xml += `<cUF>35</cUF>` // SP
  xml += `<cNF>${cNF}</cNF>`
  xml += `<natOp>${escapeXml(dados.naturezaOperacao || "Venda", 60)}</natOp>`
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
  // indIntermed omitido: sem intermediador (NT 2020.006 - campo opcional, omitir quando nao ha intermediario)
  xml += `<procEmi>0</procEmi>` // 0=Aplicativo do contribuinte
  xml += `<verProc>GestorFinanceiro 1.0</verProc>`
  xml += `</ide>`

  // === emit - Emitente ===
  xml += `<emit>`
  xml += `<CNPJ>${dados.emitente.cnpj.replace(/\D/g, "").padStart(14, "0")}</CNPJ>`
  xml += `<xNome>${escapeXml(dados.emitente.razaoSocial, 60)}</xNome>`
  if (dados.emitente.nomeFantasia) {
    xml += `<xFant>${escapeXml(dados.emitente.nomeFantasia, 60)}</xFant>`
  }
  xml += `<enderEmit>`
  xml += `<xLgr>${escapeXml(dados.emitente.endereco.logradouro, 60)}</xLgr>`
  xml += `<nro>${escapeXml(dados.emitente.endereco.numero, 60)}</nro>`
  if (dados.emitente.endereco.complemento) {
    xml += `<xCpl>${escapeXml(dados.emitente.endereco.complemento, 60)}</xCpl>`
  }
  xml += `<xBairro>${escapeXml(dados.emitente.endereco.bairro, 60)}</xBairro>`
  xml += `<cMun>${dados.emitente.endereco.codigoMunicipio}</cMun>`
  xml += `<xMun>${escapeXml(dados.emitente.endereco.municipio, 60)}</xMun>`
  xml += `<UF>${dados.emitente.endereco.uf}</UF>`
  xml += `<CEP>${dados.emitente.endereco.cep.replace(/\D/g, "").padStart(8, "0")}</CEP>`
  xml += `<cPais>1058</cPais>`
  xml += `<xPais>BRASIL</xPais>`
  if (dados.emitente.telefone) {
    const foneDigits = dados.emitente.telefone.replace(/\D/g, "")
    if (foneDigits.length >= 6 && foneDigits.length <= 14) {
      xml += `<fone>${foneDigits}</fone>`
    }
  }
  xml += `</enderEmit>`
  xml += `<IE>${dados.emitente.inscricaoEstadual.replace(/\D/g, "")}</IE>`
  xml += `<CRT>${dados.emitente.crt}</CRT>`
  xml += `</emit>`

  // === dest - Destinatario ===
  xml += `<dest>`
  if (dados.destinatario.tipo === "PJ") {
    xml += `<CNPJ>${dados.destinatario.cpfCnpj.replace(/\D/g, "").padStart(14, "0")}</CNPJ>`
  } else {
    xml += `<CPF>${dados.destinatario.cpfCnpj.replace(/\D/g, "").padStart(11, "0")}</CPF>`
  }
  xml += `<xNome>${escapeXml(dados.destinatario.razaoSocial, 60)}</xNome>`
  if (dados.destinatario.endereco) {
    xml += `<enderDest>`
    xml += `<xLgr>${escapeXml(dados.destinatario.endereco.logradouro, 60)}</xLgr>`
    xml += `<nro>${escapeXml(dados.destinatario.endereco.numero, 60)}</nro>`
    if (dados.destinatario.endereco.complemento) {
      xml += `<xCpl>${escapeXml(dados.destinatario.endereco.complemento, 60)}</xCpl>`
    }
    xml += `<xBairro>${escapeXml(dados.destinatario.endereco.bairro, 60)}</xBairro>`
    xml += `<cMun>${dados.destinatario.endereco.codigoMunicipio}</cMun>`
    xml += `<xMun>${escapeXml(dados.destinatario.endereco.municipio, 60)}</xMun>`
    xml += `<UF>${dados.destinatario.endereco.uf}</UF>`
    xml += `<CEP>${dados.destinatario.endereco.cep.replace(/\D/g, "").padStart(8, "0")}</CEP>`
    xml += `<cPais>1058</cPais>`
    xml += `<xPais>BRASIL</xPais>`
    if (dados.destinatario.telefone) {
      const foneDigits = dados.destinatario.telefone.replace(/\D/g, "")
      if (foneDigits.length >= 6 && foneDigits.length <= 14) {
        xml += `<fone>${foneDigits}</fone>`
      }
    }
    xml += `</enderDest>`
  }
  xml += `<indIEDest>${dados.destinatario.indicadorIE}</indIEDest>`
  if (dados.destinatario.email) {
    xml += `<email>${escapeXml(dados.destinatario.email, 60)}</email>`
  }
  xml += `</dest>`

  // === det - Detalhes dos itens ===
  for (const item of dados.itens) {
    const ean = item.ean || "SEM GTIN"
    const vTotTribItem = item.valorTotal * 0.3145

    xml += `<det nItem="${item.numero}">`

    // prod - Dados do produto
    xml += `<prod>`
    xml += `<cProd>${escapeXml(item.codigoProduto, 60)}</cProd>`
    xml += `<cEAN>${ean}</cEAN>`
    xml += `<xProd>${escapeXml(item.descricao, 120)}</xProd>`
    xml += `<NCM>${item.ncm.replace(/\D/g, "").padStart(8, "0")}</NCM>`
    xml += `<CFOP>${item.cfop}</CFOP>`
    xml += `<uCom>${escapeXml(item.unidade, 6)}</uCom>`
    xml += `<qCom>${Number(item.quantidade).toFixed(4)}</qCom>`
    xml += `<vUnCom>${Number(item.valorUnitario).toFixed(10)}</vUnCom>`
    xml += `<vProd>${Number(item.valorTotal).toFixed(2)}</vProd>`
    xml += `<cEANTrib>${ean}</cEANTrib>`
    xml += `<uTrib>${escapeXml(item.unidade, 6)}</uTrib>`
    xml += `<qTrib>${Number(item.quantidade).toFixed(4)}</qTrib>`
    xml += `<vUnTrib>${Number(item.valorUnitario).toFixed(10)}</vUnTrib>`
    xml += `<indTot>1</indTot>` // 1=Compoe total
    xml += `</prod>`

    // imposto - Simples Nacional CSOSN 102
    xml += `<imposto>`
    xml += `<vTotTrib>${vTotTribItem.toFixed(2)}</vTotTrib>`
    xml += `<ICMS>`
    xml += `<ICMSSN102>`
    xml += `<orig>0</orig>` // 0=Nacional
    xml += `<CSOSN>102</CSOSN>` // 102=Tributada sem permissao de credito
    xml += `</ICMSSN102>`
    xml += `</ICMS>`
    // IPI omitido para Simples Nacional (CRT=1) com CSOSN 102
    // A SEFAZ nao exige IPI para operacoes do Simples Nacional
    xml += `<PIS>`
    xml += `<PISNT>`
    xml += `<CST>07</CST>` // 07=Operacao Isenta da Contribuicao (Simples Nacional)
    xml += `</PISNT>`
    xml += `</PIS>`
    xml += `<COFINS>`
    xml += `<COFINSNT>`
    xml += `<CST>07</CST>` // 07=Operacao Isenta da Contribuicao (Simples Nacional)
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
  // vFCPUFDest, vICMSUFDest, vICMSUFRemet omitidos (opcionais, operacao interna sem DIFAL)
  xml += `<vFCP>0.00</vFCP>`
  xml += `<vBCST>0.00</vBCST>`
  xml += `<vST>0.00</vST>`
  xml += `<vFCPST>0.00</vFCPST>`
  xml += `<vFCPSTRet>0.00</vFCPSTRet>`
  xml += `<vProd>${vProd.toFixed(2)}</vProd>`
  xml += `<vFrete>0.00</vFrete>`
  xml += `<vSeg>0.00</vSeg>`
  xml += `<vDesc>0.00</vDesc>`
  xml += `<vII>0.00</vII>`
  xml += `<vIPI>0.00</vIPI>`
  xml += `<vIPIDevol>0.00</vIPIDevol>`
  xml += `<vPIS>0.00</vPIS>`
  xml += `<vCOFINS>0.00</vCOFINS>`
  xml += `<vOutro>0.00</vOutro>`
  xml += `<vNF>${vNF.toFixed(2)}</vNF>`
  xml += `<vTotTrib>${vTotTrib.toFixed(2)}</vTotTrib>`
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
  xml += `<xPag>Outros</xPag>` // Descricao obrigatoria quando tPag=99 (rejeicao 441)
  xml += `<vPag>${vNF.toFixed(2)}</vPag>`
  xml += `</detPag>`
  xml += `</pag>`

  // === infAdic - Informacoes adicionais ===
  if (dados.informacoesAdicionais) {
    xml += `<infAdic>`
    xml += `<infCpl>${escapeXml(dados.informacoesAdicionais, 5000)}</infCpl>`
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
  // Remover xmlns duplicado do <NFe> quando ja esta declarado no <enviNFe>
  // O SEFAZ pode rejeitar (erro 225) se houver declaracao de namespace redundante
  const xmlNFeLimpo = xmlNFeAssinado.replace(
    '<NFe xmlns="http://www.portalfiscal.inf.br/nfe">',
    "<NFe>"
  )
  return `<enviNFe xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00"><idLote>${idLote}</idLote><indSinc>1</indSinc>${xmlNFeLimpo}</enviNFe>`
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
  const dhEvento = formatDateTimeSP(new Date())
  const idEvento = `ID110111${dados.chaveAcesso}${nSeqEvento.toString().padStart(2, "0")}`

  let xml = `<envEvento xmlns="http://www.portalfiscal.inf.br/nfe" versao="1.00">`
  xml += `<idLote>1</idLote>`
  xml += `<evento versao="1.00">`
  xml += `<infEvento Id="${idEvento}">`
  xml += `<cOrgao>35</cOrgao>`
  xml += `<tpAmb>${dados.tipoAmbiente}</tpAmb>`
  xml += `<CNPJ>${dados.cnpj.replace(/\D/g, "").padStart(14, "0")}</CNPJ>`
  xml += `<chNFe>${dados.chaveAcesso}</chNFe>`
  xml += `<dhEvento>${dhEvento}</dhEvento>`
  xml += `<tpEvento>110111</tpEvento>`
  xml += `<nSeqEvento>${nSeqEvento}</nSeqEvento>`
  xml += `<verEvento>1.00</verEvento>`
  xml += `<detEvento versao="1.00">`
  xml += `<descEvento>Cancelamento</descEvento>`
  xml += `<nProt>${dados.protocolo}</nProt>`
  xml += `<xJust>${escapeXml(dados.justificativa, 255)}</xJust>`
  xml += `</detEvento>`
  xml += `</infEvento>`
  xml += `</evento>`
  xml += `</envEvento>`

  return xml
}

// ==================== HELPERS ====================

function escapeXml(str: string, maxLength?: number): string {
  let s = str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
  // Truncar para respeitar maxLength do XSD (SEFAZ rejeita com erro 225)
  if (maxLength && s.length > maxLength) {
    s = s.substring(0, maxLength)
  }
  return s
}

/**
 * Formata uma data no formato ISO com fuso de Sao Paulo (-03:00)
 * Usa Intl.DateTimeFormat para obter a hora correta em SP, independente do TZ do servidor.
 * Em producao (Vercel), o servidor roda em UTC, entao new Date().getHours() retorna hora UTC.
 * Formato de saida: 2026-02-10T22:23:01-03:00
 */
function formatDateTimeSP(date: Date): string {
  const spFormatter = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  })
  const parts = spFormatter.formatToParts(date)
  const get = (type: string) => parts.find((p) => p.type === type)?.value || ""

  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}:${get("second")}-03:00`
}

/**
 * Retorna a data no formato YYYY-MM-DD no fuso de Sao Paulo
 */
function getDateStringSP(date: Date): string {
  const spFormatter = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
  const parts = spFormatter.formatToParts(date)
  const get = (type: string) => parts.find((p) => p.type === type)?.value || ""
  return `${get("year")}-${get("month")}-${get("day")}`
}
