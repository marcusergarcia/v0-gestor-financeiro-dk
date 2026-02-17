// Cliente SOAP para comunicacao com os Web Services da SEFAZ SP - NF-e v4.00
// Ref: Manual de Orientacao do Contribuinte (MOC) v7.0
//
// A autenticacao e feita via TLS mutuo (mTLS) com certificado A1 (.pfx)
// Usa node-forge para extrair cert+key do PFX (compativel com cifras legadas ICP-Brasil)

import https from "https"
import forge from "node-forge"
import { SEFAZ_SP_URLS, NFE_SOAP_ACTIONS } from "./xml-builder"

interface SoapResponse {
  success: boolean
  xml: string
  httpStatus: number
  tempoMs: number
  erro?: string
}

/**
 * Extrai certificado, chave privada e cadeia CA de um PFX usando node-forge.
 * Certificados A1 ICP-Brasil geralmente incluem a cadeia completa de CAs
 * (AC intermediaria + AC Raiz) no arquivo PFX.
 * Precisamos extrair todos para que o Node.js consiga validar o certificado SSL
 * da SEFAZ, que tambem usa ICP-Brasil.
 */
function extrairCertificadoPfx(
  pfxBase64: string,
  senha: string
): { certPem: string; keyPem: string; caCerts: string[] } {
  let cleanBase64 = pfxBase64
  if (cleanBase64.includes(",")) {
    cleanBase64 = cleanBase64.split(",")[1]
  }
  cleanBase64 = cleanBase64.replace(/[\s\r\n]/g, "")

  const derBuffer = forge.util.decode64(cleanBase64)
  const asn1 = forge.asn1.fromDer(derBuffer)
  const p12 = forge.pkcs12.pkcs12FromAsn1(asn1, senha)

  const certBags = p12.getBags({ bagType: forge.pki.oids.certBag })
  const certBagList = certBags[forge.pki.oids.certBag] || []
  if (certBagList.length === 0) throw new Error("Nenhum certificado encontrado no arquivo PFX")

  // Extrair chave privada
  const keyBags = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag })
  const keyBagList = keyBags[forge.pki.oids.pkcs8ShroudedKeyBag] || []
  if (keyBagList.length === 0) throw new Error("Nenhuma chave privada encontrada no arquivo PFX")

  const key = keyBagList[0].key
  if (!key) throw new Error("Chave privada invalida no arquivo PFX")

  // Separar certificado do cliente (end-entity) dos CAs intermediarios/raiz
  // O certificado do cliente e aquele que corresponde a chave privada
  let clientCertPem = ""
  const caCerts: string[] = []

  for (const bag of certBagList) {
    if (bag.cert) {
      const pem = forge.pki.certificateToPem(bag.cert)
      // Verificar se este certificado e o do cliente (possui a chave privada correspondente)
      // ou se e um CA (issuer != subject, ou e auto-assinado CA)
      const isCA = bag.cert.extensions?.some(
        (ext: any) => ext.name === "basicConstraints" && ext.cA === true
      )

      if (!clientCertPem && !isCA) {
        clientCertPem = pem
      } else {
        caCerts.push(pem)
      }
    }
  }

  // Se nao encontrou nenhum cert como "nao-CA", pegar o primeiro como cliente
  if (!clientCertPem && certBagList[0].cert) {
    clientCertPem = forge.pki.certificateToPem(certBagList[0].cert)
  }

  console.log(`[v0] NF-e PFX: ${certBagList.length} certificado(s) encontrado(s), ${caCerts.length} CA(s)`)

  return {
    certPem: clientCertPem,
    keyPem: forge.pki.privateKeyToPem(key),
    caCerts,
  }
}

/**
 * Monta o envelope SOAP 1.2 para a SEFAZ
 * Diferente da NFS-e (SP Prefeitura), a NF-e SEFAZ usa o padrao nfeDadosMsg
 */
function montarEnvelopeSoap(xmlConteudo: string, servico: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?><soap12:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap12="http://www.w3.org/2003/05/soap-envelope"><soap12:Body><nfeDadosMsg xmlns="http://www.portalfiscal.inf.br/nfe/wsdl/${servico}">${xmlConteudo}</nfeDadosMsg></soap12:Body></soap12:Envelope>`
}

/**
 * Envia requisicao SOAP para a SEFAZ SP com autenticacao por certificado A1
 */
export async function enviarSoapSefaz(
  xmlConteudo: string,
  servico: string,
  soapAction: string,
  ambiente: number, // 1=Producao, 2=Homologacao
  certificadoBase64: string,
  certificadoSenha: string,
): Promise<SoapResponse> {
  const urls = ambiente === 1 ? SEFAZ_SP_URLS.producao : SEFAZ_SP_URLS.homologacao
  const url = (urls as Record<string, string>)[servico.replace("NFeRet", "ret").replace("NFe", "").replace("4", "").toLowerCase()] || urls.autorizacao
  
  // Determinar URL correta pelo servico
  let serviceUrl: string
  switch (servico) {
    case "NFeAutorizacao4":
      serviceUrl = urls.autorizacao
      break
    case "NFeRetAutorizacao4":
      serviceUrl = urls.retAutorizacao
      break
    case "NFeConsultaProtocolo4":
      serviceUrl = urls.consultaProtocolo
      break
    case "NFeInutilizacao4":
      serviceUrl = urls.inutilizacao
      break
    case "NFeRecepcaoEvento4":
      serviceUrl = urls.evento
      break
    case "NFeStatusServico4":
      serviceUrl = urls.statusServico
      break
    default:
      serviceUrl = urls.autorizacao
  }

  const soapEnvelope = montarEnvelopeSoap(xmlConteudo, servico)
  const inicio = Date.now()

  try {
    console.log("[v0] NF-e SOAP: Extraindo certificado do PFX...")
    const { certPem, keyPem, caCerts } = extrairCertificadoPfx(certificadoBase64, certificadoSenha)

    // Montar o agente HTTPS com mTLS
    // - cert: certificado do cliente (para autenticacao mTLS com a SEFAZ)
    // - key: chave privada do cliente
    // - rejectUnauthorized: false porque a SEFAZ usa certificados ICP-Brasil
    //   que NAO estao no trust store padrao do Node.js/Vercel.
    //   Os CAs intermediarios do PFX sozinhos nao sao suficientes para
    //   completar a cadeia ate o CA raiz do ICP-Brasil.
    //   Isso e seguro pois estamos comunicando com URLs fixas e conhecidas da SEFAZ.
    const agentOptions: https.AgentOptions = {
      cert: certPem,
      key: keyPem,
      rejectUnauthorized: false,
    }

    if (caCerts.length > 0) {
      agentOptions.ca = caCerts
      console.log("[v0] NF-e SOAP: Usando", caCerts.length, "CA(s) do PFX + rejectUnauthorized=false")
    } else {
      console.log("[v0] NF-e SOAP: Sem CAs no PFX, usando rejectUnauthorized=false")
    }

    const agent = new https.Agent(agentOptions)

    console.log("[v0] NF-e SOAP Request para:", serviceUrl)
    console.log("[v0] NF-e SOAP Action:", soapAction)
    console.log("[v0] NF-e SOAP Envelope tamanho:", soapEnvelope.length, "bytes")
    console.log("[v0] NF-e SOAP Envelope (primeiros 500):", soapEnvelope.substring(0, 500))

    const result = await new Promise<{ body: string; statusCode: number }>((resolve, reject) => {
      const parsedUrl = new URL(serviceUrl)

      const options: https.RequestOptions = {
        hostname: parsedUrl.hostname,
        port: 443,
        path: parsedUrl.pathname,
        method: "POST",
        agent,
        headers: {
          "Content-Type": "application/soap+xml; charset=utf-8",
          "Content-Length": Buffer.byteLength(soapEnvelope, "utf-8"),
          SOAPAction: soapAction,
        },
      }

      const req = https.request(options, (res) => {
        let data = ""
        res.on("data", (chunk) => { data += chunk })
        res.on("end", () => { resolve({ body: data, statusCode: res.statusCode || 0 }) })
      })

      req.on("error", (error) => { reject(error) })
      req.setTimeout(60000, () => { req.destroy(); reject(new Error("Timeout de 60s na comunicacao com a SEFAZ")) })
      req.write(soapEnvelope)
      req.end()
    })

    const tempoMs = Date.now() - inicio
    console.log("[v0] NF-e SOAP Response status:", result.statusCode, "tempo:", tempoMs, "ms")
    // Debug: log first 2000 chars of raw response for troubleshooting
    console.log("[v0] NF-e SOAP Raw Response (truncated):", result.body.substring(0, 2000))

    if (result.statusCode < 200 || result.statusCode >= 300) {
      return {
        success: false,
        xml: result.body,
        httpStatus: result.statusCode,
        tempoMs,
        erro: `HTTP ${result.statusCode}: Erro na comunicacao com a SEFAZ`,
      }
    }

    // Extrair XML interno do envelope SOAP
    const xmlInterno = extrairXmlInternoSoap(result.body)

    // O retorno da SEFAZ para autorizacao sincrona (indSinc=1) tem DOIS niveis de cStat:
    // 1) cStat do LOTE (retEnviNFe): ex 104 = "Lote processado"
    // 2) cStat da NF-e (protNFe > infProt): ex 100 = "Autorizado" ou codigo de rejeicao
    //
    // Para autorizacao, o que importa e o cStat DENTRO de <protNFe><infProt>,
    // nao o cStat do lote. O lote pode retornar 104 (processado) mas a NF-e pode
    // ter sido rejeitada dentro do protNFe.

    // Primeiro extrair o cStat do lote (primeiro match)
    const cStatLoteMatch = xmlInterno.match(/<cStat>(\d+)<\/cStat>/)
    const cStatLote = cStatLoteMatch ? parseInt(cStatLoteMatch[1]) : 0

    // Tentar extrair o cStat de dentro de <protNFe><infProt> (status real da NF-e)
    const protNFeMatch = xmlInterno.match(/<protNFe[^>]*>[\s\S]*?<infProt[^>]*>([\s\S]*?)<\/infProt>[\s\S]*?<\/protNFe>/)
    let cStatNFe = 0
    let xMotivoNFe = ""
    let nProtNFe = ""
    if (protNFeMatch) {
      const infProtContent = protNFeMatch[1]
      const cStatNFeMatch = infProtContent.match(/<cStat>(\d+)<\/cStat>/)
      const xMotivoNFeMatch = infProtContent.match(/<xMotivo>([^<]+)<\/xMotivo>/)
      const nProtMatch = infProtContent.match(/<nProt>([^<]+)<\/nProt>/)
      cStatNFe = cStatNFeMatch ? parseInt(cStatNFeMatch[1]) : 0
      xMotivoNFe = xMotivoNFeMatch ? xMotivoNFeMatch[1] : ""
      nProtNFe = nProtMatch ? nProtMatch[1] : ""
    }

    // Se encontramos protNFe, usar o cStat da NF-e; caso contrario, usar o cStat do lote
    const cStat = cStatNFe > 0 ? cStatNFe : cStatLote
    const xMotivo = cStatNFe > 0 ? xMotivoNFe : (xmlInterno.match(/<xMotivo>([^<]+)<\/xMotivo>/)?.[1] || "")

    // Codigos de sucesso da SEFAZ:
    // 100 = Autorizado o uso da NF-e
    // 104 = Lote processado (quando sincrono E tem protNFe com 100, ok)
    // 128 = Lote de Evento processado
    // 135 = Evento registrado e vinculado a NF-e
    // 107 = Servico em operacao
    const codigosSucessoNFe = [100, 107, 135]
    const codigosSucessoLote = [104, 128]

    let temSucesso = false
    if (cStatNFe > 0) {
      // Temos protNFe: verificar o cStat da NF-e diretamente
      temSucesso = codigosSucessoNFe.includes(cStatNFe)
    } else {
      // Sem protNFe: verificar cStat do lote (104 = processado, pode ser necessario consultar retorno)
      temSucesso = codigosSucessoNFe.includes(cStatLote) || codigosSucessoLote.includes(cStatLote)
    }

    console.log("[v0] NF-e cStat LOTE:", cStatLote, "| cStat NF-e (protNFe):", cStatNFe, "xMotivo:", xMotivo, "nProt:", nProtNFe, "sucesso:", temSucesso)

    return {
      success: temSucesso,
      xml: xmlInterno,
      httpStatus: result.statusCode,
      tempoMs,
      erro: !temSucesso ? `SEFAZ ${cStat}: ${xMotivo}` : undefined,
    }
  } catch (error: any) {
    const tempoMs = Date.now() - inicio
    console.error("[v0] NF-e SOAP Error:", error?.message || error)

    let erroMsg = error?.message || "Erro desconhecido na comunicacao SOAP"

    // Se o erro for de certificado SSL, tentar novamente sem verificacao estrita
    if (
      erroMsg.includes("unable to get local issuer certificate") ||
      erroMsg.includes("unable to verify the first certificate") ||
      erroMsg.includes("self signed certificate in certificate chain") ||
      erroMsg.includes("UNABLE_TO_GET_ISSUER_CERT_LOCALLY") ||
      erroMsg.includes("CERT_HAS_EXPIRED") ||
      erroMsg.includes("DEPTH_ZERO_SELF_SIGNED_CERT")
    ) {
      console.log("[v0] NF-e SOAP: Erro SSL, tentando novamente sem verificacao estrita...")
      try {
        const { certPem: retrycert, keyPem: retrykey } = extrairCertificadoPfx(certificadoBase64, certificadoSenha)
        const retryAgent = new https.Agent({
          cert: retrycert,
          key: retrykey,
          rejectUnauthorized: false,
        })

        const retryResult = await new Promise<{ body: string; statusCode: number }>((resolve, reject) => {
          const parsedUrl = new URL(serviceUrl)
          const options: https.RequestOptions = {
            hostname: parsedUrl.hostname,
            port: 443,
            path: parsedUrl.pathname,
            method: "POST",
            agent: retryAgent,
            headers: {
              "Content-Type": "application/soap+xml; charset=utf-8",
              "Content-Length": Buffer.byteLength(soapEnvelope, "utf-8"),
              SOAPAction: soapAction,
            },
          }
          const req = https.request(options, (res) => {
            let data = ""
            res.on("data", (chunk) => { data += chunk })
            res.on("end", () => { resolve({ body: data, statusCode: res.statusCode || 0 }) })
          })
          req.on("error", (err) => { reject(err) })
          req.setTimeout(60000, () => { req.destroy(); reject(new Error("Timeout retry")) })
          req.write(soapEnvelope)
          req.end()
        })

        const retryTempoMs = Date.now() - inicio
        console.log("[v0] NF-e SOAP Retry: status:", retryResult.statusCode, "tempo:", retryTempoMs, "ms")

        if (retryResult.statusCode >= 200 && retryResult.statusCode < 300) {
          const xmlInterno = extrairXmlInternoSoap(retryResult.body)

          // Mesma logica de parsing: extrair cStat do protNFe se disponivel
          const retryCStatLoteMatch = xmlInterno.match(/<cStat>(\d+)<\/cStat>/)
          const retryCStatLote = retryCStatLoteMatch ? parseInt(retryCStatLoteMatch[1]) : 0

          const retryProtNFeMatch = xmlInterno.match(/<protNFe[^>]*>[\s\S]*?<infProt[^>]*>([\s\S]*?)<\/infProt>[\s\S]*?<\/protNFe>/)
          let retryCStatNFe = 0
          let retryXMotivoNFe = ""
          if (retryProtNFeMatch) {
            const infProtContent = retryProtNFeMatch[1]
            const cStatM = infProtContent.match(/<cStat>(\d+)<\/cStat>/)
            const xMotivoM = infProtContent.match(/<xMotivo>([^<]+)<\/xMotivo>/)
            retryCStatNFe = cStatM ? parseInt(cStatM[1]) : 0
            retryXMotivoNFe = xMotivoM ? xMotivoM[1] : ""
          }

          const cStat = retryCStatNFe > 0 ? retryCStatNFe : retryCStatLote
          const xMotivo = retryCStatNFe > 0 ? retryXMotivoNFe : (xmlInterno.match(/<xMotivo>([^<]+)<\/xMotivo>/)?.[1] || "")

          let temSucesso = false
          if (retryCStatNFe > 0) {
            temSucesso = [100, 107, 135].includes(retryCStatNFe)
          } else {
            temSucesso = [100, 104, 107, 128, 135].includes(retryCStatLote)
          }

          console.log("[v0] NF-e Retry cStat LOTE:", retryCStatLote, "| cStat NF-e:", retryCStatNFe, "xMotivo:", xMotivo, "sucesso:", temSucesso)
          return {
            success: temSucesso,
            xml: xmlInterno,
            httpStatus: retryResult.statusCode,
            tempoMs: retryTempoMs,
            erro: !temSucesso ? `SEFAZ ${cStat}: ${xMotivo}` : undefined,
          }
        }
      } catch (retryError: any) {
        console.error("[v0] NF-e SOAP Retry also failed:", retryError?.message)
      }
    }

    if (erroMsg.includes("Invalid password") || erroMsg.includes("PKCS#12 MAC could not be verified")) {
      erroMsg = "Senha do certificado digital incorreta."
    } else if (erroMsg.includes("ECONNREFUSED") || erroMsg.includes("ENOTFOUND")) {
      erroMsg = "Nao foi possivel conectar a SEFAZ. Verifique sua conexao."
    } else if (erroMsg.includes("Timeout")) {
      erroMsg = "Timeout na comunicacao com a SEFAZ. Tente novamente."
    } else if (erroMsg.includes("unable to get local issuer certificate") || erroMsg.includes("unable to verify")) {
      erroMsg = "Erro de certificado SSL na comunicacao com a SEFAZ. O certificado da SEFAZ nao pode ser verificado."
    }

    return { success: false, xml: "", httpStatus: 0, tempoMs, erro: erroMsg }
  }
}

/**
 * Extrai o conteudo XML interno do envelope SOAP de retorno
 */
function extrairXmlInternoSoap(soapXml: string): string {
  // Tentar extrair de nfeResultMsg ou do Body diretamente
  const resultMsgMatch = soapXml.match(/<nfeResultMsg[^>]*>([\s\S]*?)<\/nfeResultMsg>/i)
  if (resultMsgMatch) return resultMsgMatch[1].trim()

  const bodyMatch = soapXml.match(/<soap12:Body[^>]*>([\s\S]*?)<\/soap12:Body>/i)
    || soapXml.match(/<Body[^>]*>([\s\S]*?)<\/Body>/i)
  if (bodyMatch) return bodyMatch[1].trim()

  return soapXml
}

// ==================== FUNCOES DE ALTO NIVEL ====================

/** Enviar NF-e para autorizacao (sincrono) */
export async function autorizarNFe(
  xmlEnviNFe: string,
  ambiente: number,
  certificadoBase64: string,
  certificadoSenha: string,
): Promise<SoapResponse> {
  return enviarSoapSefaz(
    xmlEnviNFe,
    "NFeAutorizacao4",
    NFE_SOAP_ACTIONS.autorizacao,
    ambiente,
    certificadoBase64,
    certificadoSenha,
  )
}

/** Consultar protocolo da NF-e pela chave de acesso */
export async function consultarProtocoloNFe(
  xmlConsulta: string,
  ambiente: number,
  certificadoBase64: string,
  certificadoSenha: string,
): Promise<SoapResponse> {
  return enviarSoapSefaz(
    xmlConsulta,
    "NFeConsultaProtocolo4",
    NFE_SOAP_ACTIONS.consultaProtocolo,
    ambiente,
    certificadoBase64,
    certificadoSenha,
  )
}

/** Consultar status do servico SEFAZ */
export async function consultarStatusServico(
  xmlStatus: string,
  ambiente: number,
  certificadoBase64: string,
  certificadoSenha: string,
): Promise<SoapResponse> {
  return enviarSoapSefaz(
    xmlStatus,
    "NFeStatusServico4",
    NFE_SOAP_ACTIONS.statusServico,
    ambiente,
    certificadoBase64,
    certificadoSenha,
  )
}

/** Enviar evento (cancelamento, etc) */
export async function enviarEventoNFe(
  xmlEvento: string,
  ambiente: number,
  certificadoBase64: string,
  certificadoSenha: string,
): Promise<SoapResponse> {
  return enviarSoapSefaz(
    xmlEvento,
    "NFeRecepcaoEvento4",
    NFE_SOAP_ACTIONS.evento,
    ambiente,
    certificadoBase64,
    certificadoSenha,
  )
}
