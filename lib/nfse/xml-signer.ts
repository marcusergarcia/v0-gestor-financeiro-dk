// Assinatura digital XML (XMLDSIG) para NFS-e São Paulo
// A prefeitura de SP exige <Signature xmlns="http://www.w3.org/2000/09/xmldsig#"> no PedidoEnvioLoteRPS
//
// Implementação usando node-forge (já presente no projeto) para:
// 1. Gerar digest SHA-1 do XML canonicalizado
// 2. Assinar com RSA-SHA1 usando a chave privada do certificado A1
// 3. Incluir o certificado X.509 na assinatura

import forge from "node-forge"
import { createHash, createSign } from "crypto"

/**
 * Assina um XML de NFS-e com XMLDSIG (enveloped signature).
 * 
 * @param xml - O XML completo (ex: PedidoEnvioLoteRPS) SEM a tag Signature
 * @param certPem - Certificado em formato PEM
 * @param keyPem - Chave privada em formato PEM
 * @returns XML com a tag <Signature> inserida antes do fechamento do elemento raiz
 */
export function assinarXmlNfse(xml: string, certPem: string, keyPem: string): string {
  // Identificar o elemento raiz (ex: PedidoEnvioLoteRPS)
  const rootMatch = xml.match(/<(\w+)\s[^>]*xmlns="http:\/\/www\.prefeitura\.sp\.gov\.br\/nfe"/)
  if (!rootMatch) {
    throw new Error("Elemento raiz com namespace da prefeitura não encontrado no XML")
  }
  const rootTagName = rootMatch[1]
  const closingTag = `</${rootTagName}>`

  // Remover <?xml ...?> para o processamento (será readicionado depois)
  const xmlDeclarationMatch = xml.match(/^(<\?xml[^?]*\?>)\s*/)
  const xmlDeclaration = xmlDeclarationMatch ? xmlDeclarationMatch[1] : '<?xml version="1.0" encoding="UTF-8"?>'
  const xmlBody = xmlDeclarationMatch ? xml.substring(xmlDeclarationMatch[0].length) : xml

  // --- Passo 1: Calcular Digest do XML (sem Signature) ---
  // Canonicalização simples: remover <?xml?>, normalizar whitespace entre tags
  const canonicalXml = canonicalize(xmlBody)
  const digestValue = createHash("sha1").update(canonicalXml, "utf8").digest("base64")

  // --- Passo 2: Montar o bloco SignedInfo ---
  const signedInfo = `<SignedInfo xmlns="http://www.w3.org/2000/09/xmldsig#"><CanonicalizationMethod Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315"/><SignatureMethod Algorithm="http://www.w3.org/2000/09/xmldsig#rsa-sha1"/><Reference URI=""><Transforms><Transform Algorithm="http://www.w3.org/2000/09/xmldsig#enveloped-signature"/><Transform Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315"/></Transforms><DigestMethod Algorithm="http://www.w3.org/2000/09/xmldsig#sha1"/><DigestValue>${digestValue}</DigestValue></Reference></SignedInfo>`

  // --- Passo 3: Assinar o SignedInfo com RSA-SHA1 ---
  const sign = createSign("RSA-SHA1")
  sign.update(signedInfo, "utf8")
  const signatureValue = sign.sign(keyPem, "base64")

  // --- Passo 4: Extrair certificado X.509 (base64, sem cabeçalho PEM) ---
  const certBase64 = certPem
    .replace(/-----BEGIN CERTIFICATE-----/g, "")
    .replace(/-----END CERTIFICATE-----/g, "")
    .replace(/[\r\n\s]/g, "")

  // --- Passo 5: Montar bloco Signature completo ---
  const signatureBlock = `<Signature xmlns="http://www.w3.org/2000/09/xmldsig#">${signedInfo}<SignatureValue>${signatureValue}</SignatureValue><KeyInfo><X509Data><X509Certificate>${certBase64}</X509Certificate></X509Data></KeyInfo></Signature>`

  // --- Passo 6: Inserir Signature antes do fechamento do elemento raiz ---
  const insertPos = xml.lastIndexOf(closingTag)
  if (insertPos === -1) {
    throw new Error(`Tag de fechamento ${closingTag} não encontrada no XML`)
  }

  const xmlAssinado = xml.substring(0, insertPos) + "\n" + signatureBlock + "\n" + closingTag

  return xmlAssinado
}

/**
 * Canonicalização simples (C14N) do XML.
 * Remove declaração XML, normaliza quebras de linha.
 */
function canonicalize(xml: string): string {
  let c14n = xml
  // Remover declaração XML se presente
  c14n = c14n.replace(/<\?xml[^?]*\?>\s*/g, "")
  // Normalizar line endings para LF
  c14n = c14n.replace(/\r\n/g, "\n").replace(/\r/g, "\n")
  return c14n
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
