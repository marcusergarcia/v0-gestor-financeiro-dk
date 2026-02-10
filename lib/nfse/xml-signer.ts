// Assinatura digital XML (XMLDSIG) para NFS-e São Paulo
// Usa xml-crypto para canonicalização C14N e assinatura XMLDSIG enveloped correta.
//
// A prefeitura de SP exige:
// - Transforms: enveloped-signature + C14N
// - DigestMethod: SHA-1
// - SignatureMethod: RSA-SHA1
// - CanonicalizationMethod: C14N
// - Reference URI="" (documento inteiro)
// - X509Certificate no KeyInfo
//
// A FAQ da SP diz sobre erro 1057:
// "Verifique se está aplicando todas as transformações necessárias no XML
//  antes da assinatura, seguindo todas as orientações do manual,
//  NÃO modificando nenhum valor do XML após a assinatura,
//  ou realizando INDENTAÇÃO no XML."

import { SignedXml } from "xml-crypto"
import forge from "node-forge"

/**
 * Assina um XML de NFS-e com XMLDSIG (enveloped signature) usando xml-crypto.
 *
 * @param xml - O XML completo (ex: PedidoEnvioLoteRPS) SEM a tag Signature
 * @param certPem - Certificado em formato PEM
 * @param keyPem - Chave privada em formato PEM
 * @returns XML com a tag <Signature> inserida corretamente
 */
export function assinarXmlNfse(xml: string, certPem: string, keyPem: string): string {
  // Remover <?xml ...?> para o processamento - xml-crypto lida melhor sem
  const xmlDeclarationMatch = xml.match(/^(<\?xml[^?]*\?>)\s*/)
  const xmlDeclaration = xmlDeclarationMatch ? xmlDeclarationMatch[1] : '<?xml version="1.0" encoding="UTF-8"?>'
  const xmlBody = xmlDeclarationMatch ? xml.substring(xmlDeclarationMatch[0].length) : xml

  // Extrair certificado X.509 (base64, sem cabeçalho PEM) para KeyInfo
  const certBase64 = certPem
    .replace(/-----BEGIN CERTIFICATE-----/g, "")
    .replace(/-----END CERTIFICATE-----/g, "")
    .replace(/[\r\n\s]/g, "")

  // Identificar o elemento raiz para posicionar a Signature
  const rootMatch = xmlBody.match(/^<(\w+)[\s>]/)
  if (!rootMatch) {
    throw new Error("Elemento raiz não encontrado no XML")
  }
  const rootTagName = rootMatch[1]

  // Criar assinador xml-crypto
  const sig = new SignedXml({
    privateKey: keyPem,
    publicCert: certPem,
    signatureAlgorithm: "http://www.w3.org/2000/09/xmldsig#rsa-sha1",
    canonicalizationAlgorithm: "http://www.w3.org/TR/2001/REC-xml-c14n-20010315",
    getKeyInfoContent: () => {
      return `<X509Data><X509Certificate>${certBase64}</X509Certificate></X509Data>`
    },
  })

  // Adicionar referência ao documento inteiro (URI="")
  // Transforms: enveloped-signature + C14N (conforme manual SP)
  sig.addReference({
    xpath: `//*[local-name(.)='${rootTagName}']`,
    transforms: [
      "http://www.w3.org/2000/09/xmldsig#enveloped-signature",
      "http://www.w3.org/TR/2001/REC-xml-c14n-20010315",
    ],
    digestAlgorithm: "http://www.w3.org/2000/09/xmldsig#sha1",
    isEmptyUri: true,
  })

  // Computar assinatura - inserir antes do fechamento do elemento raiz
  sig.computeSignature(xmlBody, {
    location: {
      reference: `//*[local-name(.)='${rootTagName}']`,
      action: "append",
    },
  })

  const signedXml = sig.getSignedXml()

  console.log("[v0] XMLDSIG assinado com xml-crypto, length:", signedXml.length)

  // Readicionar declaração XML
  return xmlDeclaration + signedXml
}

/**
 * Extrai certificado e chave privada de um PFX (base64) usando node-forge.
 * Reutiliza a mesma lógica do soap-client.ts mas retorna PEM para assinatura.
 */
export function extrairCertKeyDoPfx(
  pfxBase64: string,
  senha: string
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
  if (!cert) {
    throw new Error("Certificado invalido no arquivo PFX")
  }

  const keyBags = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag })
  const keyBagList = keyBags[forge.pki.oids.pkcs8ShroudedKeyBag] || []
  if (keyBagList.length === 0) {
    throw new Error("Nenhuma chave privada encontrada no arquivo PFX")
  }

  const key = keyBagList[0].key
  if (!key) {
    throw new Error("Chave privada invalida no arquivo PFX")
  }

  const certPem = forge.pki.certificateToPem(cert)
  const keyPem = forge.pki.privateKeyToPem(key)

  return { certPem, keyPem }
}
