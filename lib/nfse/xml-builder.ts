// Gerador de XML para NFS-e São Paulo (Padrão ABRASF/SP)
// Web Service: https://nfe.prefeitura.sp.gov.br/ws/lotenfe.asmx
//
// IMPORTANTE: O XSD da prefeitura de SP NÃO usa elementFormDefault="qualified",
// então todos os elementos locais (Cabecalho, RPS, Detalhe, etc.) devem estar
// SEM namespace (unqualified). Para isso, usamos xmlns="" nos filhos diretos
// do elemento raiz para resetar o default namespace herdado.

import { createHash, createSign } from "crypto"

function sha1Hex(data: string): string {
  return createHash("sha1").update(data, "ascii").digest("hex")
}

/**
 * Assina a string de assinatura do RPS com RSA-SHA1 conforme manual SP:
 * 1. Converte a string ASCII para bytes
 * 2. Gera o HASH (SHA-1) dos bytes
 * 3. Assina o HASH com RSA-SHA1 usando a chave privada do certificado
 * 4. Retorna o resultado em base64
 *
 * Se keyPem nao estiver disponivel, retorna apenas o SHA-1 hex (fallback).
 */
function assinarRps(data: string, keyPem?: string): string {
  if (!keyPem) {
    // Fallback: apenas SHA-1 hex (NAO aceito pela prefeitura, mas util para debug)
    return sha1Hex(data)
  }
  try {
    // Usar SHA1 (equivalente a OPENSSL_ALGO_SHA1 do PHP)
    const sign = createSign("SHA1")
    sign.update(data, "ascii")
    const result = sign.sign(keyPem, "base64")
    console.log("[v0] assinarRps: sucesso, resultado length:", result.length, "base64 chars")
    // Verificar se a assinatura pode ser decodificada (sanity check)
    const rawBytes = Buffer.from(result, "base64")
    console.log("[v0] assinarRps: raw signature bytes:", rawBytes.length, "(esperado ~128 ou ~256 para RSA-1024/2048)")
    // Log dos primeiros bytes da chave PEM para debug
    const keyHeader = keyPem.substring(0, 60).replace(/\n/g, " ")
    console.log("[v0] assinarRps: key PEM header:", keyHeader)
    return result
  } catch (err: any) {
    console.error("[v0] assinarRps: ERRO ao assinar:", err?.message)
    throw err
  }
}

export interface DadosPrestador {
  cnpj: string
  inscricaoMunicipal: string
}

export interface DadosTomador {
  tipo: "PF" | "PJ"
  cpfCnpj: string
  inscricaoMunicipal?: string
  razaoSocial: string
  email?: string
  telefone?: string
  endereco?: string
  numero?: string
  complemento?: string
  bairro?: string
  cidade?: string
  uf?: string
  cep?: string
  codigoMunicipio?: string
}

export interface DadosServico {
  codigoServico: string
  descricao: string
  codigoCnae?: string
  aliquotaIss: number
  valorServicos: number
  valorDeducoes?: number
  valorPis?: number
  valorCofins?: number
  valorInss?: number
  valorIr?: number
  valorCsll?: number
  issRetido: boolean
}

export interface DadosRps {
  numero: number
  serie: string
  tipo: number // 1=RPS, 2=RPS-Mista, 3=Cupom
  dataEmissao: string // YYYY-MM-DD
  naturezaOperacao: number // 1=Tributação no município, 2=Fora do município, etc
  regimeTributacao: number
  optanteSimples: number // 1=Sim, 2=Não
  incentivadorCultural: number // 1=Sim, 2=Não
}

export interface DadosNfse {
  rps: DadosRps
  prestador: DadosPrestador
  tomador: DadosTomador
  servico: DadosServico
}

// Gerar XML de envio de lote de RPS para SP
// Schema: PedidoEnvioLoteRPS_v02.xsd
// Estrutura: PedidoEnvioLoteRPS > Cabecalho + RPS(1..50) + ds:Signature
export function gerarXmlEnvioLoteRps(notas: DadosNfse[], numeroLote: number, keyPem?: string): string {
  const listaRps = notas.map((nota) => gerarRpsXml(nota, keyPem)).join("\n")

  // Schema ativo da SP exige ValorTotalServicos e ValorTotalDeducoes no Cabecalho
  return `<?xml version="1.0" encoding="UTF-8"?>
<PedidoEnvioLoteRPS xmlns="http://www.prefeitura.sp.gov.br/nfe" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <Cabecalho xmlns="" Versao="1">
    <CPFCNPJRemetente>
      <CNPJ>${notas[0].prestador.cnpj}</CNPJ>
    </CPFCNPJRemetente>
    <transacao>true</transacao>
    <dtInicio>${notas[0].rps.dataEmissao.substring(0, 10)}</dtInicio>
    <dtFim>${notas[0].rps.dataEmissao.substring(0, 10)}</dtFim>
    <QtdRPS>${notas.length}</QtdRPS>
    <ValorTotalServicos>${somarValores(notas, "valorServicos").toFixed(2)}</ValorTotalServicos>
    <ValorTotalDeducoes>${somarValores(notas, "valorDeducoes").toFixed(2)}</ValorTotalDeducoes>
  </Cabecalho>
${listaRps}
</PedidoEnvioLoteRPS>`
}

/**
 * Gera o elemento <EnderecoTomador> estruturado conforme schema SP.
 * Sub-elementos: TipoLogradouro, Logradouro, NumeroEndereco, ComplementoEndereco, Bairro, Cidade, UF, CEP
 */
function gerarEnderecoTomadorXml(tomador: DadosTomador): string {
  const temEndereco = tomador.endereco || tomador.numero || tomador.bairro || tomador.cidade || tomador.cep
  if (!temEndereco) return ""

  const partes: string[] = []
  if (tomador.endereco) partes.push(`      <Logradouro>${escapeXml(tomador.endereco)}</Logradouro>`)
  if (tomador.numero) partes.push(`      <NumeroEndereco>${escapeXml(tomador.numero)}</NumeroEndereco>`)
  if (tomador.complemento) partes.push(`      <ComplementoEndereco>${escapeXml(tomador.complemento)}</ComplementoEndereco>`)
  if (tomador.bairro) partes.push(`      <Bairro>${escapeXml(tomador.bairro)}</Bairro>`)
  if (tomador.cidade) partes.push(`      <Cidade>${tomador.codigoMunicipio || "3550308"}</Cidade>`)
  if (tomador.uf) partes.push(`      <UF>${tomador.uf}</UF>`)
  if (tomador.cep) partes.push(`      <CEP>${tomador.cep.replace(/\D/g, "")}</CEP>`)

  return `
    <EnderecoTomador>
${partes.join("\n")}
    </EnderecoTomador>`
}

function gerarRpsXml(nota: DadosNfse, keyPem?: string): string {
  const { rps, prestador, tomador, servico } = nota

  // SP usa formato específico para CPF/CNPJ do tomador
  const tomadorCpfCnpj =
    tomador.tipo === "PF"
      ? `<CPF>${tomador.cpfCnpj}</CPF>`
      : `<CNPJ>${tomador.cpfCnpj}</CNPJ>`

  // SP exige CodigoServico apenas com digitos (ex: "1401" e nao "14.01")
  const codigoServicoFormatado = servico.codigoServico.replace(/\D/g, "")

  // Gerar hash de assinatura do RPS conforme layout PMSP em producao
  // Layout real da prefeitura de SP (testado em producao):
  //  1. InscricaoPrestador (8)
  //  2. SerieRPS (5, pad right espacos)
  //  3. NumeroRPS (12, pad left zeros)
  //  4. DataEmissao (8, AAAAMMDD)
  //  5. TributacaoRPS (1)
  //  6. StatusRPS (1)
  //  7. ISSRetido (1) S/N
  //  8. ValorServicos (15, centavos, pad left zeros)
  //  9. ValorDeducoes (15, centavos, pad left zeros)
  //  10. CodigoServico (5, pad left zeros)
  //  11. IndicadorCPFCNPJ Tomador (1): 1=CPF, 2=CNPJ, 3=Nenhum
  //  12. CPFCNPJTomador (14, pad left zeros)
  // Total sem intermediario: 8+5+12+8+1+1+1+15+15+5+1+14 = 86
  //
  // Opcionais (intermediario):
  //  13. IndicadorCPFCNPJ Intermediario (1)
  //  14. CPFCNPJIntermediario (14)
  //  15. ISSRetidoIntermediario (1)
  const tributacao = getTributacaoSP(rps.regimeTributacao, rps.optanteSimples)
  const statusRps = "N"
  const issRetidoFlag = servico.issRetido ? "S" : "N"

  // Valor em centavos, 15 posicoes (conforme sped-nfse-prodam e manual SP)
  const valorServicosStr = Math.round(servico.valorServicos * 100).toString().padStart(15, "0")
  const valorDeducoesStr = Math.round((servico.valorDeducoes || 0) * 100).toString().padStart(15, "0")

  // Codigo servico: 5 posicoes, pad left zeros (conforme sped-nfse-prodam)
  const codServico = codigoServicoFormatado.padStart(5, "0")

  const indicadorTomador = tomador.cpfCnpj ? (tomador.tipo === "PF" ? "1" : "2") : "3"
  const cpfCnpjTomador = tomador.cpfCnpj ? tomador.cpfCnpj.replace(/\D/g, "").padStart(14, "0") : "00000000000000"
  const dataFormatada = rps.dataEmissao.substring(0, 10).replace(/-/g, "") // "2026-02-09" -> "20260209"

  // Campos 1-12 (86 posicoes - base obrigatoria)
  const assinaturaStr =
    prestador.inscricaoMunicipal.padStart(8, "0") +  // 1: IM Prestador (8)
    rps.serie.padEnd(5, " ") +                        // 2: Serie RPS (5)
    rps.numero.toString().padStart(12, "0") +          // 3: Numero RPS (12)
    dataFormatada +                                    // 4: Data (8)
    tributacao +                                       // 5: Tributacao (1)
    statusRps +                                        // 6: Status (1)
    issRetidoFlag +                                    // 7: ISS Retido (1)
    valorServicosStr +                                 // 8: Valor Servicos (15)
    valorDeducoesStr +                                 // 9: Valor Deducoes (15)
    codServico +                                       // 10: Codigo Servico (5)
    indicadorTomador +                                 // 11: Indicador CPF/CNPJ Tom (1)
    cpfCnpjTomador                                     // 12: CPF/CNPJ Tomador (14)

  // Validar comprimento da string de assinatura
  const expectedLen = 86
  if (assinaturaStr.length !== expectedLen) {
    console.error("[v0] ERRO: Assinatura string tem", assinaturaStr.length, "chars, esperado:", expectedLen)
  }
  console.log("[v0] Assinatura string length:", assinaturaStr.length, "(esperado:", expectedLen, ")")
  console.log("[v0] Assinatura string:", JSON.stringify(assinaturaStr))
  // Decomposicao para debug
  let pos = 0
  const im = assinaturaStr.substring(pos, pos += 8)
  const serie = assinaturaStr.substring(pos, pos += 5)
  const num = assinaturaStr.substring(pos, pos += 12)
  const data = assinaturaStr.substring(pos, pos += 8)
  const trib = assinaturaStr.substring(pos, pos += 1)
  const stat = assinaturaStr.substring(pos, pos += 1)
  const iss = assinaturaStr.substring(pos, pos += 1)
  const valServ = assinaturaStr.substring(pos, pos += 15)
  const valDed = assinaturaStr.substring(pos, pos += 15)
  const codS = assinaturaStr.substring(pos, pos += 5)
  const indTom = assinaturaStr.substring(pos, pos += 1)
  const cpfCnpj = assinaturaStr.substring(pos, pos += 14)
  console.log("[v0] Partes: IM=", im, "Serie=", JSON.stringify(serie), "Num=", num, "Data=", data, "Trib=", trib, "Status=", stat, "ISS=", iss, "ValServ=", valServ, "ValDed=", valDed, "CodServ=", codS, "IndTom=", indTom, "CpfCnpj=", cpfCnpj)
  // Logar SHA-1 hex para debug/comparacao
  const sha1Debug = sha1Hex(assinaturaStr)
  console.log("[v0] SHA-1 hex (debug):", sha1Debug)

  // Conforme manual SP (passos):
  // 1. Montar string ASCII (feito acima)
  // 2. Converter cadeia ASCII para bytes
  // 3. Gerar HASH SHA-1 dos bytes
  // 4. Assinar HASH com RSA-SHA1 usando chave privada do certificado
  // 5. Resultado em base64 vai na tag <Assinatura>
  const assinaturaRps = assinarRps(assinaturaStr, keyPem)
  console.log("[v0] Assinatura RPS (primeiros 60 chars):", assinaturaRps.substring(0, 60) + "...")
  console.log("[v0] Assinatura RPS usou RSA-SHA1:", !!keyPem)

  // xmlns="" reseta o namespace para unqualified (exigido pelo XSD da SP)
  // ISSRetido no XML deve ser boolean (true/false), mas no hash de assinatura usa S/N
  const issRetidoXml = servico.issRetido ? "true" : "false"

  return `  <RPS xmlns="">
    <Assinatura>${assinaturaRps}</Assinatura>
    <ChaveRPS>
      <InscricaoPrestador>${prestador.inscricaoMunicipal}</InscricaoPrestador>
      <SerieRPS>${rps.serie}</SerieRPS>
      <NumeroRPS>${rps.numero}</NumeroRPS>
    </ChaveRPS>
    <TipoRPS>${rps.tipo === 1 ? "RPS" : rps.tipo === 2 ? "RPS-M" : "RPS-C"}</TipoRPS>
    <DataEmissao>${rps.dataEmissao.substring(0, 10)}</DataEmissao>
    <StatusRPS>N</StatusRPS>
    <TributacaoRPS>${tributacao}</TributacaoRPS>
    <ValorServicos>${servico.valorServicos.toFixed(2)}</ValorServicos>
    <ValorDeducoes>${(servico.valorDeducoes || 0).toFixed(2)}</ValorDeducoes>
    <ValorPIS>${(servico.valorPis || 0).toFixed(2)}</ValorPIS>
    <ValorCOFINS>${(servico.valorCofins || 0).toFixed(2)}</ValorCOFINS>
    <ValorINSS>${(servico.valorInss || 0).toFixed(2)}</ValorINSS>
    <ValorIR>${(servico.valorIr || 0).toFixed(2)}</ValorIR>
    <ValorCSLL>${(servico.valorCsll || 0).toFixed(2)}</ValorCSLL>
    <CodigoServico>${codigoServicoFormatado}</CodigoServico>
    <AliquotaServicos>${(servico.aliquotaIss * 100).toFixed(4)}</AliquotaServicos>
    <ISSRetido>${issRetidoXml}</ISSRetido>
    <CPFCNPJTomador>
      ${tomadorCpfCnpj}
    </CPFCNPJTomador>${tomador.inscricaoMunicipal ? `
    <InscricaoMunicipalTomador>${tomador.inscricaoMunicipal}</InscricaoMunicipalTomador>` : ""}${tomador.razaoSocial ? `
    <RazaoSocialTomador>${escapeXml(tomador.razaoSocial)}</RazaoSocialTomador>` : ""}${gerarEnderecoTomadorXml(tomador)}${tomador.email ? `
    <EmailTomador>${escapeXml(tomador.email)}</EmailTomador>` : ""}
    <Discriminacao>${escapeXml(servico.descricao)}</Discriminacao>
  </RPS>`
}

// Gerar XML de consulta de NFS-e por RPS
export function gerarXmlConsultaNfseRps(
  prestadorCnpj: string,
  inscricaoMunicipal: string,
  numeroRps: number,
  serieRps: string,
): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<PedidoConsultaNFe xmlns="http://www.prefeitura.sp.gov.br/nfe">
  <Cabecalho xmlns="" Versao="1">
    <CPFCNPJRemetente>
      <CNPJ>${prestadorCnpj}</CNPJ>
    </CPFCNPJRemetente>
  </Cabecalho>
  <Detalhe xmlns="">
    <ChaveRPS>
      <InscricaoPrestador>${inscricaoMunicipal}</InscricaoPrestador>
      <SerieRPS>${serieRps}</SerieRPS>
      <NumeroRPS>${numeroRps}</NumeroRPS>
    </ChaveRPS>
  </Detalhe>
</PedidoConsultaNFe>`
}

// Gerar XML de cancelamento de NFS-e SP
// NOTA: AssinaturaCancelamento removida (SP rejeita tag vazia)
export function gerarXmlCancelamentoNfse(
  prestadorCnpj: string,
  inscricaoMunicipal: string,
  numeroNfse: string,
): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<PedidoCancelamentoNFe xmlns="http://www.prefeitura.sp.gov.br/nfe">
  <Cabecalho xmlns="" Versao="1">
    <CPFCNPJRemetente>
      <CNPJ>${prestadorCnpj}</CNPJ>
    </CPFCNPJRemetente>
    <transacao>true</transacao>
  </Cabecalho>
  <Detalhe xmlns="">
    <ChaveNFe>
      <InscricaoPrestador>${inscricaoMunicipal}</InscricaoPrestador>
      <NumeroNFe>${numeroNfse}</NumeroNFe>
    </ChaveNFe>
  </Detalhe>
</PedidoCancelamentoNFe>`
}

// Gerar XML de consulta de lote
export function gerarXmlConsultaLote(
  prestadorCnpj: string,
  numeroLote: number,
): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<PedidoConsultaLote xmlns="http://www.prefeitura.sp.gov.br/nfe">
  <Cabecalho xmlns="" Versao="1">
    <CPFCNPJRemetente>
      <CNPJ>${prestadorCnpj}</CNPJ>
    </CPFCNPJRemetente>
    <NumeroLote>${numeroLote}</NumeroLote>
  </Cabecalho>
</PedidoConsultaLote>`
}

// Gerar XML para testar envio (teste de conexão)
export function gerarXmlTesteEnvio(prestadorCnpj: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<PedidoConsultaLote xmlns="http://www.prefeitura.sp.gov.br/nfe">
  <Cabecalho xmlns="" Versao="1">
    <CPFCNPJRemetente>
      <CNPJ>${prestadorCnpj}</CNPJ>
    </CPFCNPJRemetente>
    <NumeroLote>0</NumeroLote>
  </Cabecalho>
</PedidoConsultaLote>`
}

// Helper: Mapear regime tributação para código SP
function getTributacaoSP(regime: number, optanteSimples: number): string {
  if (optanteSimples === 1) return "T" // Simples Nacional
  switch (regime) {
    case 1:
      return "M" // Microempresa municipal
    case 2:
      return "E" // Estimativa
    case 3:
      return "C" // Sociedade de profissionais
    case 4:
      return "F" // Cooperativa
    case 5:
      return "K" // MEI - Simples Nacional
    case 6:
      return "T" // ME/EPP Simples Nacional
    default:
      return "T"
  }
}

function somarValores(notas: DadosNfse[], campo: "valorServicos" | "valorDeducoes"): number {
  return notas.reduce((acc, nota) => acc + (nota.servico[campo] || 0), 0)
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}

// URLs dos webservices da Prefeitura de SP
export const SP_WEBSERVICE_URLS = {
  homologacao: "https://nfeh.prefeitura.sp.gov.br/ws/lotenfe.asmx",
  producao: "https://nfe.prefeitura.sp.gov.br/ws/lotenfe.asmx",
}

// SOAP Actions da Prefeitura de SP
export const SP_SOAP_ACTIONS = {
  envioLoteRps: "http://www.prefeitura.sp.gov.br/nfe/ws/envioLoteRPS",
  testeEnvioLoteRps: "http://www.prefeitura.sp.gov.br/nfe/ws/testeEnvioLoteRPS",
  cancelamentoNfe: "http://www.prefeitura.sp.gov.br/nfe/ws/cancelamentoNFe",
  consultaNfe: "http://www.prefeitura.sp.gov.br/nfe/ws/consultaNFe",
  consultaNfeRecebidas: "http://www.prefeitura.sp.gov.br/nfe/ws/consultaNFeRecebidas",
  consultaNFeEmitidas: "http://www.prefeitura.sp.gov.br/nfe/ws/consultaNFeEmitidas",
  consultaLote: "http://www.prefeitura.sp.gov.br/nfe/ws/consultaLote",
}
