// Cliente SOAP para comunicação com o Web Service da Prefeitura de SP
// Ref: Manual de Utilização do Web Service v2.1 - nfe.prefeitura.sp.gov.br/arquivos/nfews.pdf
// Produção: https://nfe.prefeitura.sp.gov.br/ws/lotenfe.asmx
// Homologação: https://nfeh.prefeitura.sp.gov.br/ws/lotenfe.asmx
//
// A autenticação é feita via TLS mútuo (mutual TLS/mTLS) com certificado A1 (.pfx)
// O Node.js https.Agent é usado para passar o certificado na conexão

import https from "https"
import { SP_WEBSERVICE_URLS, SP_SOAP_ACTIONS } from "./xml-builder"

interface SoapResponse {
  success: boolean
  xml: string
  httpStatus: number
  tempoMs: number
  erro?: string
}

/**
 * Envia requisição SOAP para a Prefeitura de SP com autenticação por certificado A1
 */
export async function enviarSoap(
  xmlBody: string,
  soapAction: string,
  ambiente: number, // 1=Produção, 2=Homologação
  certificadoBase64?: string,
  certificadoSenha?: string,
): Promise<SoapResponse> {
  const url = ambiente === 1 ? SP_WEBSERVICE_URLS.producao : SP_WEBSERVICE_URLS.homologacao
  const inicio = Date.now()

  // O XML do pedido vai dentro do VersaoArg do SOAP
  // A Prefeitura de SP espera o XML encapsulado em CDATA dentro do envelope SOAP
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
    // Configurar o agente HTTPS com o certificado A1 para mTLS
    const agentOptions: https.AgentOptions = {
      rejectUnauthorized: true,
    }

    if (certificadoBase64 && certificadoSenha) {
      const pfxBuffer = Buffer.from(certificadoBase64, "base64")
      agentOptions.pfx = pfxBuffer
      agentOptions.passphrase = certificadoSenha
    }

    const agent = new https.Agent(agentOptions)

    console.log("[v0] SOAP Request para:", url)
    console.log("[v0] SOAPAction:", soapAction)
    console.log("[v0] Certificado presente:", !!certificadoBase64)
    console.log("[v0] Envelope tamanho:", soapEnvelope.length)

    // Fazer a requisição HTTPS com o certificado
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

    // Verificar se o retorno contém erro
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
    if (erroMsg.includes("DEPTH_ZERO_SELF_SIGNED_CERT") || erroMsg.includes("self signed")) {
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
 * Extrai o nome do método SOAP a partir da action
 */
function getSoapMethodName(soapAction: string): string {
  // http://www.prefeitura.sp.gov.br/nfe/ws/envioLoteRPS -> EnvioLoteRPS
  const parts = soapAction.split("/")
  const method = parts[parts.length - 1]
  // Capitalizar primeira letra
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
  // Tentar extrair código e mensagem de erro do padrão SP
  const codigoMatch = xml.match(/<Codigo>(\d+)<\/Codigo>/)
  const mensagemMatch = xml.match(/<Descricao>(.*?)<\/Descricao>/s)

  if (codigoMatch && mensagemMatch) {
    return `Erro ${codigoMatch[1]}: ${mensagemMatch[1]}`
  }

  // Tentar extrair SOAP Fault
  const faultMatch = xml.match(/<faultstring>(.*?)<\/faultstring>/s)
  if (faultMatch) {
    return faultMatch[1]
  }

  // Tentar extrair MensagemRetorno
  const msgRetorno = xml.match(/<MensagemRetorno>(.*?)<\/MensagemRetorno>/s)
  if (msgRetorno) {
    return msgRetorno[1]
  }

  return "Erro desconhecido no retorno do webservice"
}

/**
 * Extrair dados da NFS-e do XML de retorno (após emissão bem-sucedida)
 * O retorno da Prefeitura de SP usa tags como:
 * - <ChaveNFeRPS><ChaveNFe><NumeroNFe> para o número
 * - <CodigoVerificacao> para o código de verificação
 */
export function extrairDadosNfseRetorno(xml: string): {
  numeroNfse?: string
  codigoVerificacao?: string
  dataEmissao?: string
  sucesso: boolean
  erros: string[]
} {
  const erros: string[] = []

  // Extrair erros se houver
  const erroRegex = /<Erro>.*?<Codigo>(\d+)<\/Codigo>.*?<Descricao>(.*?)<\/Descricao>.*?<\/Erro>/gs
  let match
  while ((match = erroRegex.exec(xml)) !== null) {
    erros.push(`Erro ${match[1]}: ${match[2]}`)
  }

  // Alertas (também podem conter informações importantes)
  const alertaRegex = /<Alerta>.*?<Codigo>(\d+)<\/Codigo>.*?<Descricao>(.*?)<\/Descricao>.*?<\/Alerta>/gs
  while ((match = alertaRegex.exec(xml)) !== null) {
    // Alertas não são erros fatais, mas registramos
    console.log("[v0] Alerta da prefeitura:", match[1], match[2])
  }

  if (erros.length > 0) {
    return { sucesso: false, erros }
  }

  // Extrair dados da NFS-e emitida - padrão SP
  // Pode estar em <ChaveNFeRPS><ChaveNFe><NumeroNFe> ou diretamente <NumeroNFe>
  const nfseNumero =
    xml.match(/<NumeroNFe>(\d+)<\/NumeroNFe>/) ||
    xml.match(/<NumeroNota>(\d+)<\/NumeroNota>/)
  const codigoVerificacao =
    xml.match(/<CodigoVerificacao>([^<]+)<\/CodigoVerificacao>/) ||
    xml.match(/<CodigoVerificacaoNFe>([^<]+)<\/CodigoVerificacaoNFe>/)
  const dataEmissao =
    xml.match(/<DataEmissaoNFe>([^<]+)<\/DataEmissaoNFe>/) ||
    xml.match(/<DataEmissaoRPS>([^<]+)<\/DataEmissaoRPS>/)

  // Se não encontrou número de NFS-e mas também não tem erros,
  // pode ser que o lote esteja em processamento assíncrono
  if (!nfseNumero && erros.length === 0) {
    // Verificar se tem número de lote (processamento assíncrono)
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
