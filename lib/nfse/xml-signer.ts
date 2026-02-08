/**
 * Assinatura digital de XML para NFS-e da Prefeitura de São Paulo.
 *
 * Dois tipos de assinatura são necessários:
 *
 * 1. Hash do RPS (<Assinatura>) — string padded de campos do RPS, assinada com RSA-SHA1
 * 2. XMLDSIG (<Signature>) — assinatura W3C XML Digital Signature sobre o XML inteiro
 *
 * Ambos usam o certificado A1 (.pfx) já extraído via node-forge no soap-client.
 *
 * Referência: Manual NFS-e SP v2.4 — "Assinatura Digital"
 */

import forge from "node-forge"

// ---------------------------------------------------------------------------
// 1. Hash de assinatura do RPS (campo <Assinatura> dentro de cada <RPS>)
// ---------------------------------------------------------------------------

export interface DadosAssinaturaRps {
  inscricaoPrestador: string
  serieRps: string
  numeroRps: number
  dataEmissao: string        // YYYY-MM-DD
  tributacaoRps: string      // T, M, E, C, F, K, etc.
  statusRps: string          // N = Normal, C = Cancelado
  issRetido: boolean
  valorServicos: number      // em reais (ex: 100.00)
  valorDeducoes: number      // em reais
  codigoServico: string      // apenas dígitos (ex: "1401")
  tomadorCpfCnpj: string     // apenas dígitos
  tomadorTipo: "PF" | "PJ"   // indica CPF ou CNPJ
}

/**
 * Gera a string de hash do RPS conforme layout SP:
 *
 * InscricaoPrestador   8 dígitos (pad left '0')
 * SerieRPS             5 chars  (pad right ' ')
 * NumeroRPS           12 dígitos (pad left '0')
 * DataEmissao          8 dígitos (YYYYMMDD)
 * TributacaoRPS        1 char
 * StatusRPS            1 char
 * ISSRetido            1 char (S/N)
 * ValorServicos       15 dígitos (centavos, pad left '0')
 * ValorDeducoes       15 dígitos (centavos, pad left '0')
 * CodigoServico        5 dígitos (pad left '0')
 * IndicadorCPFCNPJ     1 char (1=CPF, 2=CNPJ, 3=sem)
 * CPFCNPJTomador      14 chars (pad left '0')
 */
function montarStringAssinaturaRps(dados: DadosAssinaturaRps): string {
  const pad = (s: string, len: number, char = "0", right = false) =>
    right ? s.padEnd(len, char) : s.padStart(len, char)

  const inscricao = pad(dados.inscricaoPrestador.replace(/\D/g, ""), 8)
  const serie = pad(dados.serieRps, 5, " ", true)
  const numero = pad(String(dados.numeroRps), 12)
  const dataEmissao = dados.dataEmissao.replace(/-/g, "") // YYYYMMDD
  const tributacao = dados.tributacaoRps.charAt(0)
  const status = dados.statusRps.charAt(0)
  const issRetido = dados.issRetido ? "S" : "N"

  // Valores em centavos (multiplicar por 100 e truncar decimais)
  const valorServicos = pad(String(Math.round(dados.valorServicos * 100)), 15)
  const valorDeducoes = pad(String(Math.round(dados.valorDeducoes * 100)), 15)

  const codigoServico = pad(dados.codigoServico.replace(/\D/g, ""), 5)

  // Indicador e documento do tomador
  let indicador: string
  let documento: string
  const cpfCnpj = dados.tomadorCpfCnpj.replace(/\D/g, "")
  if (!cpfCnpj) {
    indicador = "3"
    documento = pad("", 14)
  } else if (dados.tomadorTipo === "PF" || cpfCnpj.length <= 11) {
    indicador = "1"
    documento = pad(cpfCnpj, 14)
  } else {
    indicador = "2"
    documento = pad(cpfCnpj, 14)
  }

  return (
    inscricao +
    serie +
    numero +
    dataEmissao +
    tributacao +
    status +
    issRetido +
    valorServicos +
    valorDeducoes +
    codigoServico +
    indicador +
    documento
  )
}

/**
 * Assina a string do RPS com SHA1 + RSA usando a chave privada do certificado A1.
 * Retorna a assinatura em Base64.
 */
export function gerarAssinaturaRps(
  dados: DadosAssinaturaRps,
  keyPem: string,
): string {
  const texto = montarStringAssinaturaRps(dados)

  // SHA1 digest
  const md = forge.md.sha1.create()
  md.update(texto, "utf8")

  // Assinar com RSA PKCS#1 v1.5
  const privateKey = forge.pki.privateKeyFromPem(keyPem)
  const signature = privateKey.sign(md)

  // Retornar em base64
  return forge.util.encode64(signature)
}

// ---------------------------------------------------------------------------
// 2. Hash de cancelamento (<AssinaturaCancelamento>)
// ---------------------------------------------------------------------------

export interface DadosAssinaturaCancelamento {
  inscricaoPrestador: string
  numeroNfse: string
}

/**
 * Gera a assinatura de cancelamento:
 *   InscricaoPrestador (8 dígitos, pad left '0')
 *   NumeroNFe         (12 dígitos, pad left '0')
 */
export function gerarAssinaturaCancelamento(
  dados: DadosAssinaturaCancelamento,
  keyPem: string,
): string {
  const inscricao = dados.inscricaoPrestador.replace(/\D/g, "").padStart(8, "0")
  const numero = dados.numeroNfse.replace(/\D/g, "").padStart(12, "0")
  const texto = inscricao + numero

  const md = forge.md.sha1.create()
  md.update(texto, "utf8")

  const privateKey = forge.pki.privateKeyFromPem(keyPem)
  const signature = privateKey.sign(md)

  return forge.util.encode64(signature)
}

// ---------------------------------------------------------------------------
// 3. XMLDSIG — Assinatura digital W3C no XML inteiro
// ---------------------------------------------------------------------------

/**
 * Aplica assinatura digital XMLDSIG (enveloped) ao XML.
 *
 * - Canonicalização: C14N (simplificada, suficiente para o schema SP)
 * - Digest: SHA-1
 * - Assinatura: RSA-SHA1
 * - Insere <Signature> como último filho do elemento raiz
 *
 * @param xml      XML completo (com <?xml ...?> declaration)
 * @param keyPem   Chave privada PEM do certificado A1
 * @param certPem  Certificado público PEM (vai no <X509Certificate>)
 */
export function assinarXmlDigital(
  xml: string,
  keyPem: string,
  certPem: string,
): string {
  // 1. Identificar a tag raiz e preparar o XML sem a declaração
  const xmlSemDecl = xml.replace(/<\?xml[^?]*\?>\s*/, "")

  // 2. Encontrar a tag de fechamento da raiz para inserir o Signature antes dela
  const rootCloseMatch = xmlSemDecl.match(/<\/(\w+)>\s*$/)
  if (!rootCloseMatch) {
    throw new Error("Nao foi possivel encontrar a tag de fechamento do XML raiz")
  }
  const rootCloseTag = `</${rootCloseMatch[1]}>`

  // 3. Obter o conteúdo do XML que será assinado (sem o Signature, que ainda não existe)
  const xmlParaAssinar = xmlSemDecl

  // 4. Canonicalizar (C14N simplificado para SP)
  const xmlCanonical = canonicalize(xmlParaAssinar)

  // 5. Calcular digest SHA-1 do XML canonicalizado
  const digestMd = forge.md.sha1.create()
  digestMd.update(xmlCanonical, "utf8")
  const digestValue = forge.util.encode64(digestMd.digest().bytes())

  // 6. Montar o <SignedInfo>
  const signedInfo = `<SignedInfo xmlns="http://www.w3.org/2000/09/xmldsig#"><CanonicalizationMethod Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315"></CanonicalizationMethod><SignatureMethod Algorithm="http://www.w3.org/2000/09/xmldsig#rsa-sha1"></SignatureMethod><Reference URI=""><Transforms><Transform Algorithm="http://www.w3.org/2000/09/xmldsig#enveloped-signature"></Transform><Transform Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315"></Transform></Transforms><DigestMethod Algorithm="http://www.w3.org/2000/09/xmldsig#sha1"></DigestMethod><DigestValue>${digestValue}</DigestValue></Reference></SignedInfo>`

  // 7. Canonicalizar o SignedInfo e assinar com RSA-SHA1
  const signedInfoCanonical = canonicalize(signedInfo)
  const sigMd = forge.md.sha1.create()
  sigMd.update(signedInfoCanonical, "utf8")

  const privateKey = forge.pki.privateKeyFromPem(keyPem)
  const signatureBytes = privateKey.sign(sigMd)
  const signatureValue = forge.util.encode64(signatureBytes)

  // 8. Extrair certificado X509 (apenas o conteúdo base64, sem headers PEM)
  const x509Content = certPem
    .replace(/-----BEGIN CERTIFICATE-----/g, "")
    .replace(/-----END CERTIFICATE-----/g, "")
    .replace(/[\s\r\n]/g, "")

  // 9. Montar elemento <Signature> completo
  const signatureElement = `<Signature xmlns="http://www.w3.org/2000/09/xmldsig#">${signedInfo}<SignatureValue>${signatureValue}</SignatureValue><KeyInfo><X509Data><X509Certificate>${x509Content}</X509Certificate></X509Data></KeyInfo></Signature>`

  // 10. Inserir <Signature> antes da tag de fechamento do elemento raiz
  const xmlAssinado = xml.replace(
    rootCloseTag,
    `${signatureElement}\n${rootCloseTag}`,
  )

  return xmlAssinado
}

// ---------------------------------------------------------------------------
// Canonicalization (C14N simplificado)
// ---------------------------------------------------------------------------

/**
 * Canonicalização C14N simplificada, suficiente para o XML da NFS-e SP.
 *
 * - Remove declaração XML
 * - Normaliza line endings para LF
 * - Remove espaços desnecessários entre tags
 * - Expande tags auto-fechantes (<Tag/> → <Tag></Tag>)
 */
function canonicalize(xml: string): string {
  let c = xml

  // Remover declaração XML
  c = c.replace(/<\?xml[^?]*\?>\s*/g, "")

  // Normalizar line endings para LF
  c = c.replace(/\r\n/g, "\n")
  c = c.replace(/\r/g, "\n")

  // Remover espaço em branco entre tags (preservar espaço em conteúdo de texto)
  c = c.replace(/>\s+</g, "><")

  // Expandir tags auto-fechantes: <Tag/> → <Tag></Tag>
  c = c.replace(/<(\w+)([^>]*?)\/>/g, "<$1$2></$1>")

  // Remover whitespace no início e fim
  c = c.trim()

  return c
}

// ---------------------------------------------------------------------------
// Helpers para extrair cert/key do PFX (reutiliza a lógica do soap-client)
// ---------------------------------------------------------------------------

/**
 * Extrai certificado e chave privada de um PFX usando node-forge.
 * Retorna certPem e keyPem prontos para uso nas funções de assinatura.
 */
export function extrairCertificadoParaAssinatura(
  pfxBase64: string,
  senha: string,
): { certPem: string; keyPem: string } {
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
  if (certBagList.length === 0) {
    throw new Error("Nenhum certificado encontrado no arquivo PFX")
  }
  const cert = certBagList[0].cert
  if (!cert) throw new Error("Certificado invalido no arquivo PFX")

  const keyBags = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag })
  const keyBagList = keyBags[forge.pki.oids.pkcs8ShroudedKeyBag] || []
  if (keyBagList.length === 0) {
    throw new Error("Nenhuma chave privada encontrada no arquivo PFX")
  }
  const key = keyBagList[0].key
  if (!key) throw new Error("Chave privada invalida no arquivo PFX")

  return {
    certPem: forge.pki.certificateToPem(cert),
    keyPem: forge.pki.privateKeyToPem(key),
  }
}
