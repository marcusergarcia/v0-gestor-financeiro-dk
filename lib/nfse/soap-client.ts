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
    console.log("[v0] SOAP Response body length:", xmlRetorno.body.length)
    console.log("[v0] SOAP Response body (primeiros 1000 chars):", xmlRetorno.body.substring(0, 1000))

    if (xmlRetorno.statusCode < 200 || xmlRetorno.statusCode >= 300) {
      return {
        success: false,
        xml: xmlRetorno.body,
        httpStatus: xmlRetorno.statusCode,
        tempoMs,
        erro: `HTTP ${xmlRetorno.statusCode}: Erro na comunicacao com o webservice da prefeitura`,
      }
    }

    // Extrair o XML interno do SOAP envelope (pode estar em CDATA ou encodado)
    const xmlInterno = extrairXmlInternoSoap(xmlRetorno.body)
    console.log("[v0] XML interno extraido, length:", xmlInterno.length)
    console.log("[v0] XML interno (primeiros 1000 chars):", xmlInterno.substring(0, 1000))

    // Verificar SOAP Fault (erro de protocolo)
    const temSoapFault =
      xmlRetorno.body.includes("<soap:Fault>") ||
      xmlRetorno.body.includes("<soap12:Fault>")

    if (temSoapFault) {
      return {
        success: false,
        xml: xmlInterno,
        httpStatus: xmlRetorno.statusCode,
        tempoMs,
        erro: extrairErroSoap(xmlRetorno.body),
      }
    }

    // Para o retorno da prefeitura SP, verificar <Sucesso> no cabecalho
    // A tag <Erro> pode estar presente em retornos de sucesso parcial (alertas)
    // O que determina sucesso e a tag <Sucesso>true</Sucesso>
    const sucessoMatch = xmlInterno.match(/<Sucesso>(true|false)<\/Sucesso>/i)
    const temSucesso = sucessoMatch ? sucessoMatch[1].toLowerCase() === "true" : !xmlInterno.includes("<Erro>")
    console.log("[v0] Tag <Sucesso> encontrada:", sucessoMatch?.[1], "-> sucesso:", temSucesso)

    // Verificar se ha erros criticos
    const temErro = xmlInterno.includes("<Erro>")
    if (temErro) {
      console.log("[v0] XML contem <Erro> tags, extraindo detalhes...")
      const erroMsg = extrairErroSoap(xmlInterno)
      console.log("[v0] Erro extraido:", erroMsg)
    }

    return {
      success: temSucesso,
      xml: xmlInterno,
      httpStatus: xmlRetorno.statusCode,
      tempoMs,
      erro: (!temSucesso && temErro) ? extrairErroSoap(xmlInterno) : undefined,
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

/**
 * Extrai o XML de negocio de dentro do envelope SOAP.
 * 
 * A prefeitura de SP retorna o XML dentro do SOAP envelope de varias formas:
 * 
 * 1. CDATA dentro do elemento *Result:
 *    <EnvioLoteRPSResult><![CDATA[<?xml ...><RetornoEnvioLoteRPS>...</RetornoEnvioLoteRPS>]]></EnvioLoteRPSResult>
 * 
 * 2. HTML entities dentro do elemento *Result:
 *    <EnvioLoteRPSResult>&lt;?xml ...&gt;&lt;RetornoEnvioLoteRPS&gt;...&lt;/RetornoEnvioLoteRPS&gt;</EnvioLoteRPSResult>
 * 
 * 3. XML direto dentro do Body/Response (menos comum):
 *    <RetornoEnvioLoteRPS>...</RetornoEnvioLoteRPS>
 * 
 * 4. Texto simples dentro do Result (string XML):
 *    <EnvioLoteRPSResult>string com XML</EnvioLoteRPSResult>
 */
function extrairXmlInternoSoap(soapXml: string): string {
  console.log("[v0] extrairXmlInternoSoap - tentando extrair XML interno...")
  console.log("[v0] Contem CDATA?", soapXml.includes("<![CDATA["))
  console.log("[v0] Contem &lt;?", soapXml.includes("&lt;"))
  console.log("[v0] Contem Result?", /\w+Result/.test(soapXml))
  console.log("[v0] Contem RetornoEnvioLoteRPS?", soapXml.includes("RetornoEnvioLoteRPS"))
  console.log("[v0] Contem RetornoConsulta?", soapXml.includes("RetornoConsulta"))

  // METODO 1: Buscar elemento *Result e extrair conteudo
  // O nome do Result depende do metodo SOAP chamado:
  // - EnvioLoteRPSResult, TesteEnvioLoteRPSResult, ConsultaNFeResult, ConsultaLoteResult, CancelamentoNFeResult
  const resultPattern = /<(\w+Result)[^>]*>([\s\S]*)<\/\1>/
  const resultMatch = soapXml.match(resultPattern)

  if (resultMatch) {
    const resultName = resultMatch[1]
    let inner = resultMatch[2].trim()
    console.log("[v0] Encontrou elemento Result:", resultName, "conteudo length:", inner.length)
    console.log("[v0] Result inner (primeiros 300 chars):", inner.substring(0, 300))

    // 1a. Se contem CDATA, extrair o conteudo de dentro do CDATA
    // Usar greedy match para pegar todo o CDATA (pode conter ]]> internos escapados, mas improvavel)
    const cdataInResult = inner.match(/<!\[CDATA\[([\s\S]*)\]\]>/)
    if (cdataInResult) {
      console.log("[v0] Extraido conteudo de CDATA dentro do Result")
      return cdataInResult[1].trim()
    }

    // 1b. Se contem HTML entities, decodificar
    if (inner.includes("&lt;")) {
      console.log("[v0] Decodificando HTML entities dentro do Result...")
      inner = decodeHtmlEntities(inner)
      console.log("[v0] Decodificado, primeiros 300 chars:", inner.substring(0, 300))
    }

    // 1c. Se o conteudo parece ser XML valido, retornar
    if (inner.includes("<Retorno") || inner.includes("<Cabecalho") || inner.includes("<Sucesso") || inner.includes("<Erro") || inner.includes("<NFe")) {
      console.log("[v0] Conteudo do Result parece ser XML de retorno valido")
      return inner
    }

    // 1d. Se tem qualquer coisa que comeca com <, retornar
    if (inner.startsWith("<")) {
      console.log("[v0] Conteudo do Result comeca com <, retornando como XML")
      return inner
    }

    console.log("[v0] Conteudo do Result nao parece XML, continuando busca...")
  }

  // METODO 2: Buscar CDATA em qualquer lugar do SOAP (pode haver multiplos, pegar o ultimo que e a resposta)
  const allCdata = [...soapXml.matchAll(/<!\[CDATA\[([\s\S]*?)\]\]>/g)]
  if (allCdata.length > 0) {
    // O ultimo CDATA geralmente e a resposta (o primeiro pode ser o request ecoado)
    const lastCdata = allCdata[allCdata.length - 1][1].trim()
    if (lastCdata.includes("<Retorno") || lastCdata.includes("<Cabecalho") || lastCdata.includes("<Sucesso")) {
      console.log("[v0] XML extraido do ultimo CDATA encontrado")
      return lastCdata
    }
    // Se ha apenas 1 CDATA e parece XML, usar
    if (allCdata.length === 1 && lastCdata.startsWith("<")) {
      console.log("[v0] XML extraido do unico CDATA encontrado")
      return lastCdata
    }
  }

  // METODO 3: Buscar o XML de retorno diretamente (sem estar em Result/CDATA)
  // Ordem de prioridade: RetornoEnvioLoteRPS, RetornoConsulta, RetornoCancelamentoNFe
  const retornoPatterns = [
    /(<RetornoEnvioLoteRPS[\s>][\s\S]*<\/RetornoEnvioLoteRPS>)/,
    /(<RetornoConsulta[\s>][\s\S]*<\/RetornoConsulta>)/,
    /(<RetornoCancelamentoNFe[\s>][\s\S]*<\/RetornoCancelamentoNFe>)/,
    /(<RetornoConsultaLote[\s>][\s\S]*<\/RetornoConsultaLote>)/,
  ]
  for (const pattern of retornoPatterns) {
    const match = soapXml.match(pattern)
    if (match) {
      console.log("[v0] XML de retorno encontrado diretamente no SOAP:", match[1].substring(0, 100))
      return match[1]
    }
  }

  // METODO 4: Buscar dentro do Body do SOAP
  const bodyMatch = soapXml.match(/<(?:soap12?:)?Body[^>]*>([\s\S]*)<\/(?:soap12?:)?Body>/)
  if (bodyMatch) {
    let bodyContent = bodyMatch[1].trim()
    // Remover o wrapper *Response se presente
    const responseMatch = bodyContent.match(/<\w+Response[^>]*>([\s\S]*)<\/\w+Response>/)
    if (responseMatch) {
      bodyContent = responseMatch[1].trim()
      // Verificar se e Result com entities
      if (bodyContent.includes("&lt;")) {
        bodyContent = decodeHtmlEntities(bodyContent)
      }
    }
    if (bodyContent.includes("<Sucesso") || bodyContent.includes("<Retorno") || bodyContent.includes("<NFe")) {
      console.log("[v0] XML extraido do Body do SOAP")
      return bodyContent
    }
  }

  // METODO 5: Se tem HTML entities no XML inteiro, decodificar e buscar
  if (soapXml.includes("&lt;Retorno") || soapXml.includes("&lt;Cabecalho")) {
    console.log("[v0] XML inteiro parece ter HTML entities, decodificando...")
    const decoded = decodeHtmlEntities(soapXml)
    // Buscar novamente apos decodificar
    for (const pattern of retornoPatterns) {
      const match = decoded.match(pattern)
      if (match) {
        console.log("[v0] XML de retorno encontrado apos decodificacao")
        return match[1]
      }
    }
  }

  // Fallback: retornar o XML completo
  console.log("[v0] FALLBACK: Nao foi possivel extrair XML interno, retornando XML completo")
  console.log("[v0] XML completo (ultimos 500 chars):", soapXml.substring(soapXml.length - 500))
  return soapXml
}

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
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
 * Extrair dados da NFS-e do XML de retorno da Prefeitura de SP.
 * 
 * Formatos de retorno esperados:
 * 
 * 1. RetornoEnvioLoteRPS (envio sincrono):
 *    <RetornoEnvioLoteRPS>
 *      <Cabecalho><Sucesso>true</Sucesso>...</Cabecalho>
 *      <ChaveNFeRPS>
 *        <ChaveNFe><InscricaoPrestador>...</InscricaoPrestador><NumeroNFe>732</NumeroNFe><CodigoVerificacao>XXXX</CodigoVerificacao></ChaveNFe>
 *        <ChaveRPS>...</ChaveRPS>
 *      </ChaveNFeRPS>
 *    </RetornoEnvioLoteRPS>
 * 
 * 2. RetornoConsulta (consulta por RPS/NFe):
 *    <RetornoConsulta>
 *      <Cabecalho><Sucesso>true</Sucesso></Cabecalho>
 *      <NFe>
 *        <ChaveNFe><InscricaoPrestador>...</InscricaoPrestador><NumeroNFe>732</NumeroNFe><CodigoVerificacao>XXXX</CodigoVerificacao></ChaveNFe>
 *        <DataEmissaoNFe>...</DataEmissaoNFe>
 *        ...
 *      </NFe>
 *    </RetornoConsulta>
 */
export function extrairDadosNfseRetorno(xml: string): {
  numeroNfse?: string
  codigoVerificacao?: string
  dataEmissao?: string
  sucesso: boolean
  erros: string[]
} {
  const erros: string[] = []

  console.log("[v0] extrairDadosNfseRetorno - XML length:", xml.length)
  console.log("[v0] extrairDadosNfseRetorno - XML (primeiros 2000 chars):", xml.substring(0, 2000))

  // Verificar <Sucesso> no cabecalho
  const sucessoTag = xml.match(/<Sucesso>(true|false)<\/Sucesso>/i)
  const sucesso = sucessoTag ? sucessoTag[1].toLowerCase() === "true" : false
  console.log("[v0] Tag <Sucesso>:", sucessoTag?.[1], "-> sucesso:", sucesso)

  // Extrair erros
  const erroRegex = /<Erro>[\s\S]*?<Codigo>(\d+)<\/Codigo>[\s\S]*?<Descricao>([\s\S]*?)<\/Descricao>[\s\S]*?<\/Erro>/g
  let match
  while ((match = erroRegex.exec(xml)) !== null) {
    erros.push(`Erro ${match[1]}: ${match[2].trim()}`)
  }

  // Alertas (nao sao erros, apenas informativos)
  const alertaRegex = /<Alerta>[\s\S]*?<Codigo>(\d+)<\/Codigo>[\s\S]*?<Descricao>([\s\S]*?)<\/Descricao>[\s\S]*?<\/Alerta>/g
  while ((match = alertaRegex.exec(xml)) !== null) {
    console.log("[v0] Alerta da prefeitura:", match[1], match[2].trim())
  }

  if (erros.length > 0) {
    console.log("[v0] Erros encontrados:", erros)
    // Se <Sucesso> e false e ha erros, retornar com erro
    if (!sucesso) {
      return { sucesso: false, erros }
    }
    // Se <Sucesso> e true mas ha "erros", podem ser alertas/avisos - continuar
    console.log("[v0] Sucesso=true com erros - tratando como alertas")
  }

  // Extrair numero da NFS-e - Varios formatos possiveis da prefeitura SP
  // Formato 1: <ChaveNFe><InscricaoPrestador>X</InscricaoPrestador><NumeroNFe>732</NumeroNFe>...
  // Formato 2: <Numero>732</Numero> dentro de <ChaveNFe>
  // Formato 3: <NumeroNota>732</NumeroNota>
  const nfseNumero =
    xml.match(/<NumeroNFe>(\d+)<\/NumeroNFe>/) ||
    xml.match(/<ChaveNFe>[\s\S]*?<Numero>(\d+)<\/Numero>[\s\S]*?<\/ChaveNFe>/) ||
    xml.match(/<NumeroNota>(\d+)<\/NumeroNota>/)

  const codigoVerificacao =
    xml.match(/<CodigoVerificacao>([^<]+)<\/CodigoVerificacao>/) ||
    xml.match(/<CodigoVerificacaoNFe>([^<]+)<\/CodigoVerificacaoNFe>/)

  const dataEmissao =
    xml.match(/<DataEmissaoNFe>([^<]+)<\/DataEmissaoNFe>/) ||
    xml.match(/<DataEmissaoRPS>([^<]+)<\/DataEmissaoRPS>/)

  console.log("[v0] NumeroNFe match:", nfseNumero?.[1] || "NAO ENCONTRADO")
  console.log("[v0] CodigoVerificacao match:", codigoVerificacao?.[1] || "NAO ENCONTRADO")
  console.log("[v0] DataEmissao match:", dataEmissao?.[1] || "NAO ENCONTRADO")

  // Se <Sucesso>true e tem numero, perfeito
  if (nfseNumero) {
    console.log("[v0] NFS-e encontrada! Numero:", nfseNumero[1])
    return {
      numeroNfse: nfseNumero[1],
      codigoVerificacao: codigoVerificacao?.[1],
      dataEmissao: dataEmissao?.[1],
      sucesso: true,
      erros: [],
    }
  }

  // Se <Sucesso>true mas sem numero - pode ser que o lote foi aceito (retorno de envio com NumeroLote)
  if (sucesso && !nfseNumero) {
    const numLote = xml.match(/<NumeroLote>(\d+)<\/NumeroLote>/)
    console.log("[v0] Sucesso=true sem NumeroNFe. NumeroLote:", numLote?.[1] || "NAO ENCONTRADO")
    
    // Verificar se ha ChaveNFeRPS (formato do RetornoEnvioLoteRPS com NFS-e inline)
    const chaveNFeRPS = xml.match(/<ChaveNFeRPS>/)
    if (chaveNFeRPS) {
      console.log("[v0] Encontrou <ChaveNFeRPS> mas nao extraiu NumeroNFe - verificar formato")
      // Tentar formato alternativo do numero
      const numAlt = xml.match(/<ChaveNFe>[\s\S]*?<\/ChaveNFe>/)
      if (numAlt) {
        console.log("[v0] ChaveNFe encontrada:", numAlt[0].substring(0, 200))
      }
    }
    
    return {
      sucesso: true,
      erros: [],
      numeroNfse: undefined,
      codigoVerificacao: undefined,
      dataEmissao: undefined,
    }
  }

  // Se nao encontrou <Sucesso> e nao encontrou numero, verificar se o XML tem algo util
  // Pode ser que a extracao do SOAP envelope nao funcionou
  if (!sucessoTag) {
    console.log("[v0] ATENCAO: Tag <Sucesso> NAO encontrada no XML!")
    console.log("[v0] XML pode estar com formato inesperado. Primeiros 500 chars:", xml.substring(0, 500))
    console.log("[v0] Ultimos 500 chars:", xml.substring(Math.max(0, xml.length - 500)))
    
    // Ultima tentativa: buscar NumeroNFe mesmo sem tag Sucesso
    // Pode acontecer se o SOAP envelope nao foi removido corretamente
    const numDireto = xml.match(/<NumeroNFe>(\d+)<\/NumeroNFe>/)
    if (numDireto) {
      const codDireto = xml.match(/<CodigoVerificacao>([^<]+)<\/CodigoVerificacao>/)
      console.log("[v0] NumeroNFe encontrado mesmo sem tag Sucesso:", numDireto[1])
      return {
        numeroNfse: numDireto[1],
        codigoVerificacao: codDireto?.[1],
        sucesso: true,
        erros: [],
      }
    }
  }

  // Sucesso=false, sem numero e com ou sem erros
  return {
    sucesso: sucesso,
    erros: erros.length > 0 ? erros : ["Retorno inesperado da prefeitura. Verifique os logs para detalhes do XML recebido."],
    numeroNfse: undefined,
    codigoVerificacao: undefined,
    dataEmissao: undefined,
  }
}
