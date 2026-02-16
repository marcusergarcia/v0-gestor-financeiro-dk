// Assinatura digital XML (XMLDSIG) para NF-e SEFAZ
// Usa xml-crypto para canonicalizacao C14N e assinatura XMLDSIG enveloped
//
// A SEFAZ exige:
// - Transforms: enveloped-signature + C14N
// - DigestMethod: SHA-1
// - SignatureMethod: RSA-SHA1
// - CanonicalizationMethod: C14N
// - Reference URI="#NFe..." (referencia ao Id da infNFe)
// - X509Certificate no KeyInfo

import { SignedXml } from "xml-crypto"
import forge from "node-forge"

/**
 * Assina o XML da NF-e com XMLDSIG (enveloped signature)
 * A assinatura referencia o elemento infNFe pelo seu atributo Id
 *
 * @param xml - XML da NFe completo (sem Signature)
 * @param certPem - Certificado PEM
 * @param keyPem - Chave privada PEM
 * @returns XML com Signature inserida dentro do elemento NFe
 */
export function assinarXmlNFe(xml: string, certPem: string, keyPem: string): string {
  // Remover declaracao XML
  const xmlDeclarationMatch = xml.match(/^(<\?xml[^?]*\?>)\s*/)
  const xmlBody = xmlDeclarationMatch ? xml.substring(xmlDeclarationMatch[0].length) : xml

  // Extrair Id da infNFe
  const idMatch = xmlBody.match(/Id="(NFe\d+)"/)
  if (!idMatch) {
    throw new Error("Id da infNFe nao encontrado no XML")
  }
  const infNFeId = idMatch[1]

  // Extrair certificado X.509 base64
  const certBase64 = certPem
    .replace(/-----BEGIN CERTIFICATE-----/g, "")
    .replace(/-----END CERTIFICATE-----/g, "")
    .replace(/[\r\n\s]/g, "")

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

  // Referencia ao infNFe por URI="#NFe..."
  sig.addReference({
    xpath: `//*[local-name(.)='infNFe']`,
    transforms: [
      "http://www.w3.org/2000/09/xmldsig#enveloped-signature",
      "http://www.w3.org/TR/2001/REC-xml-c14n-20010315",
    ],
    digestAlgorithm: "http://www.w3.org/2000/09/xmldsig#sha1",
    uri: `#${infNFeId}`,
  })

  // Inserir Signature dentro de <NFe> (apos </infNFe>)
  sig.computeSignature(xmlBody, {
    location: {
      reference: `//*[local-name(.)='NFe']`,
      action: "append",
    },
  })

  return sig.getSignedXml()
}

/**
 * Assina o XML de evento (cancelamento) com XMLDSIG
 * A assinatura referencia o elemento infEvento pelo seu atributo Id
 */
export function assinarXmlEvento(xml: string, certPem: string, keyPem: string): string {
  const xmlDeclarationMatch = xml.match(/^(<\?xml[^?]*\?>)\s*/)
  const xmlBody = xmlDeclarationMatch ? xml.substring(xmlDeclarationMatch[0].length) : xml

  const idMatch = xmlBody.match(/Id="(ID\d+)"/)
  if (!idMatch) {
    throw new Error("Id do infEvento nao encontrado no XML")
  }
  const infEventoId = idMatch[1]

  const certBase64 = certPem
    .replace(/-----BEGIN CERTIFICATE-----/g, "")
    .replace(/-----END CERTIFICATE-----/g, "")
    .replace(/[\r\n\s]/g, "")

  const sig = new SignedXml({
    privateKey: keyPem,
    publicCert: certPem,
    signatureAlgorithm: "http://www.w3.org/2000/09/xmldsig#rsa-sha1",
    canonicalizationAlgorithm: "http://www.w3.org/TR/2001/REC-xml-c14n-20010315",
    getKeyInfoContent: () => {
      return `<X509Data><X509Certificate>${certBase64}</X509Certificate></X509Data>`
    },
  })

  sig.addReference({
    xpath: `//*[local-name(.)='infEvento']`,
    transforms: [
      "http://www.w3.org/2000/09/xmldsig#enveloped-signature",
      "http://www.w3.org/TR/2001/REC-xml-c14n-20010315",
    ],
    digestAlgorithm: "http://www.w3.org/2000/09/xmldsig#sha1",
    uri: `#${infEventoId}`,
  })

  sig.computeSignature(xmlBody, {
    location: {
      reference: `//*[local-name(.)='evento']`,
      action: "append",
    },
  })

  return sig.getSignedXml()
}

/**
 * Extrai certificado e chave privada de um PFX (base64) usando node-forge.
 * Compativel com cifras legadas (RC2, 3DES) comuns em certificados A1 ICP-Brasil
 */
export function extrairCertKeyDoPfx(
  pfxBase64: string,
  senha: string
): { certPem: string; keyPem: string; validade: string } {
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
  const validade = cert.validity.notAfter.toISOString()

  return { certPem, keyPem, validade }
}
