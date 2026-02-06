// Cliente SOAP para comunicacao com o Web Service da Prefeitura de SP
// Ref: Manual de Utilizacao do Web Service v2.1 - nfe.prefeitura.sp.gov.br/arquivos/nfews.pdf
// Producao: https://nfe.prefeitura.sp.gov.br/ws/lotenfe.asmx
// Homologacao: https://nfeh.prefeitura.sp.gov.br/ws/lotenfe.asmx
//
// A autenticacao e feita via TLS mutuo (mTLS) com certificado A1 (.pfx)
// Usa node-forge para extrair cert+key do PFX (compativel com cifras legadas ICP-Brasil)
// e depois passa como PEM para o https.Agent do Node.js

import https from "https"
import forge from "node-forge"
import { SP_WEBSERVICE_URLS, SP_SOAP_ACTIONS } from "./xml-builder"

interface SoapResponse {
  success: boolean
  xml: string
  httpStatus: number
  tempoMs: number
  erro?: string
}

/**
 * Extrai certificado e chave privada de um PFX usando node-forge
 * Compativel com cifras legadas (RC2, 3DES) comuns em certificados A1 ICP-Brasil
 */
function extrairCertificadoPfx(
  pfxBase64: string,
  senha: string
): { certPem: string; keyPem: string; validade: string } {
  // Limpar base64
  let cleanBase64 = pfxBase64
  if (cleanBase64.includes(",")) {
    cleanBase64 = cleanBase64.split(",")[1]
  }
  cleanBase64 = cleanBase64.replace(/[\s\r\n]/g, "")

  // Decodificar base64 para DER (binary)
  const derBuffer = forge.util.decode64(cleanBase64)

  // Converter DER para ASN1 e depois para PKCS12
  const asn1 = forge.asn1.fromDer(derBuffer)
  const p12 = forge.pkcs12.pkcs12FromAsn1(asn1, senha)

  // Extrair certificados
  const certBags = p12.getBags({ bagType: forge.pki.oids.certBag })
  const certBagList = certBags[forge.pki.oids.certBag] || []

  if (certBagList.length === 0) {
    throw new Error("Nenhum certificado encontrado no arquivo PFX")
  }

  // Pegar o certificado principal (geralmente o primeiro)
  const cert = certBagList[0].cert
  if (!cert) {
    throw new Error("Certificado invalido no arquivo PFX")
  }

  // Extrair chave privada
  const keyBags = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag })
  const keyBagList = keyBags[forge.pki.oids.pkcs8ShroudedKeyBag] || []

  if (keyBagList.length === 0) {
    throw new Error("Nenhuma chave privada encontrada no arquivo PFX")
  }

  const key = keyBagList[0].key
  if (!key) {
    throw new Error("Chave privada invalida no arquivo PFX")
  }

  // Converter para PEM
  const certPem = forge.pki.certificateToPem(cert)
  const keyPem = forge.pki.privateKeyToPem(key)
  const validade = cert.validity.notAfter.toISOString()

  return { certPem, keyPem, validade }
}

/**
 * Envia requisicao SOAP para a Prefeitura de SP com autenticacao por certificado A1
 */
export async function enviarSoap(
  xmlBody: string,
  soapAction: string,
  ambiente: number, // 1=Producao, 2=Homologacao
  certificadoBase64?: string,
  certificadoSenha?: string,
): Promise<SoapResponse> {
  const url = ambiente === 1 ? SP_WEBSERVICE_URLS.producao : SP_WEBSERVICE_URLS.homologacao
  const inicio = Date.now()

  const soapEnvelope = `<?xml version="1.0" encoding="UTF-8"?>
<soap12:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap12="http://www.w3.org/2003/05/soap-envelope">
  <soap12:Body>
    <${getSoapMethodName(soapAction)}Request xmlns="http://www.prefeitura.sp.gov.br/nfe">
      <VersaoSchema>1</VersaoSchema>
      <MensagemXML><![CDATA[${xmlBody}]]></MensagemXML>
    </${getSoapMethodName(soapAction)}Request>
  </soap12:Body>
</soap12:Envelope>`

  try {
    // Configurar agente HTTPS
    const agentOptions: https.AgentOptions = {
      rejectUnauthorized: true,
    }

    if (certificadoBase64 && certificadoSenha) {
      // Usar node-forge para extrair cert e key do PFX
      // Isso contorna o problema do OpenSSL 3.x com cifras legadas (RC2/3DES)
      // que sao comuns em certificados A1 emitidos por ICP-Brasil
      console.log("[v0] Extraindo certificado do PFX com node-forge...")
      const { certPem, keyPem } = extrairCertificadoPfx(certificadoBase64, certificadoSenha)
      console.log("[v0] Certificado extraido com sucesso, cert PEM length:", certPem.length)

      agentOptions.cert = certPem
      agentOptions.key = keyPem
    }

    const agent = new https.Agent(agentOptions)

    console.log("[v0] SOAP Request para:", url)
    console.log("[v0] SOAPAction:", soapAction)

    // Fazer a requisicao HTTPS com o certificado
    const xmlRetorno = await new Promise<{ body: string; statusCode: number }>((resolve, reject) => {
      const parsedUrl = new URL(url)

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
        res.on("data", (chunk) => {
          data += chunk
        })
        res.on("end", () => {
          resolve({ body: data, statusCode: res.statusCode || 0 })
        })
      })

      req.on("error", (error) => {
        reject(error)
      })

      req.setTimeout(30000, () => {
        req.destroy()
        reject(new Error("Timeout de 30s na comunicacao com a prefeitura"))
      })

      req.write(soapEnvelope)
      req.end()
    })

    const tempoMs = Date.now() - inicio
    console.log("[v0] SOAP Response status:", xmlRetorno.statusCode, "tempo:", tempoMs, "ms")
    console.log("[v0] SOAP Response body (primeiros 500 chars):", xmlRetorno.body.substring(0, 500))

    if (xmlRetorno.statusCode < 200 || xmlRetorno.statusCode >= 300) {
      return {
        success: false,
        xml: xmlRetorno.body,
        httpStatus: xmlRetorno.statusCode,
        tempoMs,
        erro: `HTTP ${xmlRetorno.statusCode}: Erro na comunicacao com o webservice da prefeitura`,
      }
    }

    // Verificar se o retorno contem erro
    const temErro =
      xmlRetorno.body.includes("<Erro>") ||
      xmlRetorno.body.includes("<soap:Fault>") ||
      xmlRetorno.body.includes("<soap12:Fault>")

    return {
      success: !temErro,
      xml: xmlRetorno.body,
      httpStatus: xmlRetorno.statusCode,
      tempoMs,
      erro: temErro ? extrairErroSoap(xmlRetorno.body) : undefined,
    }
  } catch (error: any) {
    const tempoMs = Date.now() - inicio
    console.error("[v0] SOAP Error:", error?.message || error)

    // Mensagens de erro mais claras
    let erroMsg = error?.message || "Erro desconhecido na comunicacao SOAP"

    if (erroMsg.includes("Invalid password") || erroMsg.includes("PKCS#12 MAC could not be verified")) {
      erroMsg = "Senha do certificado digital incorreta. Verifique a senha do seu certificado A1."
    } else if (erroMsg.includes("Nenhum certificado") || erroMsg.includes("Nenhuma chave")) {
      erroMsg = "Arquivo PFX invalido. Verifique se o arquivo do certificado esta correto."
    } else if (erroMsg.includes("DEPTH_ZERO_SELF_SIGNED_CERT") || erroMsg.includes("self signed")) {
      erroMsg = "Erro de certificado SSL do servidor da prefeitura. Verifique se o ambiente esta correto."
    } else if (erroMsg.includes("ERR_OSSL") || erroMsg.includes("wrong password") || erroMsg.includes("mac verify failure")) {
      erroMsg = "Senha do certificado digital incorreta. Verifique a senha do certificado A1."
    } else if (erroMsg.includes("ECONNREFUSED") || erroMsg.includes("ENOTFOUND")) {
      erroMsg = "Nao foi possivel conectar ao webservice da prefeitura. Verifique sua conexao."
    } else if (erroMsg.includes("Timeout")) {
      erroMsg = "Timeout de 30 segundos na comunicacao com a prefeitura. Tente novamente."
    }

    return {
      success: false,
      xml: "",
      httpStatus: 0,
      tempoMs,
      erro: erroMsg,
    }
  }
}

/**
 * Extrai o nome do metodo SOAP a partir da action
 */
function getSoapMethodName(soapAction: string): string {
  const parts = soapAction.split("/")
  const method = parts[parts.length - 1]
  return method.charAt(0).toUpperCase() + method.slice(1)
}

// Enviar lote de RPS
export async function enviarLoteRps(
  xml: string,
  ambiente: number,
  certificadoBase64?: string,
  certificadoSenha?: string,
): Promise<SoapResponse> {
  return enviarSoap(xml, SP_SOAP_ACTIONS.envioLoteRps, ambiente, certificadoBase64, certificadoSenha)
}

// Teste de envio de lote
export async function testeEnvioLoteRps(
  xml: string,
  ambiente: number,
  certificadoBase64?: string,
  certificadoSenha?: string,
): Promise<SoapResponse> {
  return enviarSoap(xml, SP_SOAP_ACTIONS.testeEnvioLoteRps, ambiente, certificadoBase64, certificadoSenha)
}

// Consultar NFS-e
export async function consultarNfse(
  xml: string,
  ambiente: number,
  certificadoBase64?: string,
  certificadoSenha?: string,
): Promise<SoapResponse> {
  return enviarSoap(xml, SP_SOAP_ACTIONS.consultaNfe, ambiente, certificadoBase64, certificadoSenha)
}

// Cancelar NFS-e
export async function cancelarNfse(
  xml: string,
  ambiente: number,
  certificadoBase64?: string,
  certificadoSenha?: string,
): Promise<SoapResponse> {
  return enviarSoap(xml, SP_SOAP_ACTIONS.cancelamentoNfe, ambiente, certificadoBase64, certificadoSenha)
}

// Consultar lote
export async function consultarLote(
  xml: string,
  ambiente: number,
  certificadoBase64?: string,
  certificadoSenha?: string,
): Promise<SoapResponse> {
  return enviarSoap(xml, SP_SOAP_ACTIONS.consultaLote, ambiente, certificadoBase64, certificadoSenha)
}

// Extrair mensagem de erro do XML de retorno
function extrairErroSoap(xml: string): string {
  const codigoMatch = xml.match(/<Codigo>(\d+)<\/Codigo>/)
  const mensagemMatch = xml.match(/<Descricao>(.*?)<\/Descricao>/s)

  if (codigoMatch && mensagemMatch) {
    return `Erro ${codigoMatch[1]}: ${mensagemMatch[1]}`
  }

  const faultMatch = xml.match(/<faultstring>(.*?)<\/faultstring>/s)
  if (faultMatch) {
    return faultMatch[1]
  }

  const msgRetorno = xml.match(/<MensagemRetorno>(.*?)<\/MensagemRetorno>/s)
  if (msgRetorno) {
    return msgRetorno[1]
  }

  return "Erro desconhecido no retorno do webservice"
}

/**
 * Extrair dados da NFS-e do XML de retorno
 */
export function extrairDadosNfseRetorno(xml: string): {
  numeroNfse?: string
  codigoVerificacao?: string
  dataEmissao?: string
  sucesso: boolean
  erros: string[]
} {
  const erros: string[] = []

  // Extrair erros
  const erroRegex = /<Erro>.*?<Codigo>(\d+)<\/Codigo>.*?<Descricao>(.*?)<\/Descricao>.*?<\/Erro>/gs
  let match
  while ((match = erroRegex.exec(xml)) !== null) {
    erros.push(`Erro ${match[1]}: ${match[2]}`)
  }

  // Alertas
  const alertaRegex = /<Alerta>.*?<Codigo>(\d+)<\/Codigo>.*?<Descricao>(.*?)<\/Descricao>.*?<\/Alerta>/gs
  while ((match = alertaRegex.exec(xml)) !== null) {
    console.log("[v0] Alerta da prefeitura:", match[1], match[2])
  }

  if (erros.length > 0) {
    return { sucesso: false, erros }
  }

  const nfseNumero =
    xml.match(/<NumeroNFe>(\d+)<\/NumeroNFe>/) ||
    xml.match(/<NumeroNota>(\d+)<\/NumeroNota>/)
  const codigoVerificacao =
    xml.match(/<CodigoVerificacao>([^<]+)<\/CodigoVerificacao>/) ||
    xml.match(/<CodigoVerificacaoNFe>([^<]+)<\/CodigoVerificacaoNFe>/)
  const dataEmissao =
    xml.match(/<DataEmissaoNFe>([^<]+)<\/DataEmissaoNFe>/) ||
    xml.match(/<DataEmissaoRPS>([^<]+)<\/DataEmissaoRPS>/)

  // Se nao encontrou numero de NFS-e, pode ser processamento assincrono
  if (!nfseNumero && erros.length === 0) {
    const numLote = xml.match(/<NumeroLote>(\d+)<\/NumeroLote>/)
    if (numLote) {
      return {
        sucesso: true,
        erros: [],
        numeroNfse: undefined,
        codigoVerificacao: undefined,
        dataEmissao: undefined,
      }
    }
  }

  return {
    numeroNfse: nfseNumero?.[1],
    codigoVerificacao: codigoVerificacao?.[1],
    dataEmissao: dataEmissao?.[1],
    sucesso: !!nfseNumero || erros.length === 0,
    erros: [],
  }
}
