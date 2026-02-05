// Cliente SOAP para comunicação com o Web Service da Prefeitura de SP
// O certificado A1 (.pfx) é usado para autenticação via HTTPS/TLS mutual auth
import { SP_WEBSERVICE_URLS, SP_SOAP_ACTIONS } from "./xml-builder"

interface SoapResponse {
  success: boolean
  xml: string
  httpStatus: number
  tempoMs: number
  erro?: string
}

// Enviar requisição SOAP para a Prefeitura de SP
// NOTA: Em ambiente serverless (Vercel), o certificado A1 é passado como PFX em buffer
// Para produção real, é necessário configurar o agente HTTPS com o certificado
export async function enviarSoap(
  xmlBody: string,
  soapAction: string,
  ambiente: number, // 1=Produção, 2=Homologação
  _certificadoBase64?: string,
  _certificadoSenha?: string,
): Promise<SoapResponse> {
  const url = ambiente === 1 ? SP_WEBSERVICE_URLS.producao : SP_WEBSERVICE_URLS.homologacao
  const inicio = Date.now()

  // Envelope SOAP
  const soapEnvelope = `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema">
  <soap:Body>
    ${xmlBody}
  </soap:Body>
</soap:Envelope>`

  try {
    // NOTA IMPORTANTE: 
    // Em um ambiente Node.js padrão, usaríamos https.Agent com pfx/passphrase
    // para autenticação mútua TLS com o certificado A1.
    // Em ambiente serverless (Vercel Edge/Functions), o suporte a certificado 
    // client-side TLS é limitado. Para produção, recomenda-se:
    // 1. Usar um proxy/gateway que faça a autenticação com certificado
    // 2. Ou usar a API da prefeitura via serviço intermediário (ex: NFE.io, Enotas, etc.)
    //
    // Por enquanto, fazemos a chamada HTTP padrão que funciona no ambiente de homologação
    // e para testes iniciais.
    
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "text/xml; charset=utf-8",
        SOAPAction: soapAction,
      },
      body: soapEnvelope,
    })

    const tempoMs = Date.now() - inicio
    const xmlRetorno = await response.text()

    if (!response.ok) {
      return {
        success: false,
        xml: xmlRetorno,
        httpStatus: response.status,
        tempoMs,
        erro: `HTTP ${response.status}: ${response.statusText}`,
      }
    }

    // Verificar se o retorno contém erro SOAP
    const temErro = xmlRetorno.includes("<Erro>") || xmlRetorno.includes("<soap:Fault>")

    return {
      success: !temErro,
      xml: xmlRetorno,
      httpStatus: response.status,
      tempoMs,
      erro: temErro ? extrairErroSoap(xmlRetorno) : undefined,
    }
  } catch (error: any) {
    return {
      success: false,
      xml: "",
      httpStatus: 0,
      tempoMs: Date.now() - inicio,
      erro: error.message || "Erro desconhecido na comunicação SOAP",
    }
  }
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
  // Tentar extrair código e mensagem de erro
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

  return "Erro desconhecido no retorno do webservice"
}

// Extrair dados da NFS-e do XML de retorno (após emissão bem-sucedida)
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

  // Alertas
  const alertaRegex = /<Alerta>.*?<Codigo>(\d+)<\/Codigo>.*?<Descricao>(.*?)<\/Descricao>.*?<\/Alerta>/gs
  while ((match = alertaRegex.exec(xml)) !== null) {
    erros.push(`Alerta ${match[1]}: ${match[2]}`)
  }

  if (erros.length > 0) {
    return { sucesso: false, erros }
  }

  // Extrair dados da NFS-e emitida
  const nfseNumero = xml.match(/<NumeroNFe>(\d+)<\/NumeroNFe>/)
  const codigoVerificacao = xml.match(/<CodigoVerificacao>([^<]+)<\/CodigoVerificacao>/)
  const dataEmissao = xml.match(/<DataEmissaoNFe>([^<]+)<\/DataEmissaoNFe>/)

  return {
    numeroNfse: nfseNumero?.[1],
    codigoVerificacao: codigoVerificacao?.[1],
    dataEmissao: dataEmissao?.[1],
    sucesso: !!nfseNumero,
    erros: [],
  }
}
