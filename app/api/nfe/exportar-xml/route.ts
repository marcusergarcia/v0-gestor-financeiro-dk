import { NextRequest, NextResponse } from "next/server"
import { pool } from "@/lib/database"

/**
 * API para exportar XMLs autorizados das NF-e no formato padrao SEFAZ.
 * 
 * PADRAO SEFAZ (PL_009_V4):
 * Cada NF-e autorizada deve ser um arquivo XML individual com a estrutura:
 * 
 * <?xml version="1.0" encoding="UTF-8"?>
 * <nfeProc xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00">
 *   <NFe xmlns="http://www.portalfiscal.inf.br/nfe">
 *     <infNFe Id="NFe..." versao="4.00">...</infNFe>
 *     <Signature xmlns="http://www.w3.org/2000/09/xmldsig#">...</Signature>
 *   </NFe>
 *   <protNFe versao="4.00" xmlns="http://www.portalfiscal.inf.br/nfe">
 *     <infProt Id="ID...">...</infProt>
 *   </protNFe>
 * </nfeProc>
 * 
 * IMPORTANTE: 
 * - O namespace xmlns="http://www.portalfiscal.inf.br/nfe" DEVE estar no <nfeProc>
 * - A versao="4.00" DEVE estar no <nfeProc>
 * - O <NFe> interno PODE ter o xmlns repetido (valido no XSD)
 * - O <protNFe> tambem PODE ter xmlns e versao
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { nfeIds } = body

    if (!nfeIds || !Array.isArray(nfeIds) || nfeIds.length === 0) {
      return NextResponse.json(
        { success: false, message: "IDs das NF-e nao informados" },
        { status: 400 }
      )
    }

    // Buscar os XMLs autorizados das NF-e
    const placeholders = nfeIds.map(() => "?").join(", ")
    const [rows] = await pool.execute(
      `SELECT id, numero_nfe, serie, chave_acesso, xml_protocolo, xml_envio, xml_retorno, status, data_emissao
       FROM nfe_emitidas 
       WHERE id IN (${placeholders}) AND status = 'autorizada'`,
      nfeIds
    )

    const nfes = rows as any[]

    if (nfes.length === 0) {
      return NextResponse.json(
        { success: false, message: "Nenhuma NF-e autorizada encontrada" },
        { status: 404 }
      )
    }

    // Retornar os XMLs das NF-e autorizadas no formato padrao SEFAZ
    const xmls = nfes.map((nfe) => {
      // O xml_protocolo ja deve conter o nfeProc completo no padrao SEFAZ
      let xml = nfe.xml_protocolo || ""
      
      // Se nao tem xml_protocolo, tentar montar a partir do xml_envio + xml_retorno
      if (!xml && nfe.xml_envio) {
        xml = montarNfeProcPadrao(nfe.xml_envio, nfe.xml_retorno || "")
      }
      
      // Normalizar o XML para o padrao SEFAZ correto
      xml = normalizarXmlSefaz(xml)
      
      // Garantir que o XML tenha a declaracao XML no inicio
      if (xml && !xml.startsWith("<?xml")) {
        xml = `<?xml version="1.0" encoding="UTF-8"?>\n${xml}`
      }
      
      // Nome do arquivo no padrao SEFAZ: NFe + chave de acesso (44 digitos)
      const nomeArquivo = `NFe${nfe.chave_acesso}.xml`
      
      return {
        id: nfe.id,
        numero: nfe.numero_nfe,
        serie: nfe.serie,
        chaveAcesso: nfe.chave_acesso,
        nomeArquivo,
        dataEmissao: nfe.data_emissao,
        xml: xml,
      }
    })

    return NextResponse.json({
      success: true,
      data: xmls,
      total: xmls.length,
    })
  } catch (error) {
    console.error("Erro ao exportar XMLs:", error)
    return NextResponse.json(
      { success: false, message: "Erro interno ao exportar XMLs" },
      { status: 500 }
    )
  }
}

/**
 * Monta o nfeProc a partir do XML de envio e retorno da SEFAZ.
 * Extrai o <NFe> assinado do enviNFe e o <protNFe> do retorno.
 */
function montarNfeProcPadrao(xmlEnvio: string, xmlRetorno: string): string {
  // Extrair o <NFe> assinado do enviNFe
  const nfeMatch = xmlEnvio.match(/<NFe[^>]*>[\s\S]*?<\/NFe>/)
  if (!nfeMatch) {
    return ""
  }
  const nfeAssinado = nfeMatch[0]
  
  // Extrair o <protNFe> do retorno
  let protNFe = ""
  if (xmlRetorno) {
    const protMatch = xmlRetorno.match(/<protNFe[^>]*>[\s\S]*?<\/protNFe>/)
    if (protMatch) {
      protNFe = protMatch[0]
    }
  }
  
  // Montar o nfeProc no padrao SEFAZ
  return `<nfeProc xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00">${nfeAssinado}${protNFe}</nfeProc>`
}

/**
 * Normaliza um XML de NF-e para o padrao SEFAZ correto.
 * 
 * Corrige problemas comuns:
 * 1. Remove envelope <nfeProcs> (plural) invalido
 * 2. Garante que o <nfeProc> tenha xmlns e versao corretos
 * 3. Remove xmlns duplicados desnecessarios
 * 4. Formata corretamente a estrutura
 */
function normalizarXmlSefaz(xml: string): string {
  if (!xml) return ""
  
  // Se o XML ja esta no formato correto, retornar como esta
  if (xml.includes("<nfeProc") && !xml.includes("<nfeProcs")) {
    // Garantir que tenha xmlns e versao no nfeProc
    if (!xml.match(/<nfeProc[^>]*xmlns=/)) {
      xml = xml.replace(
        /<nfeProc([^>]*)>/,
        '<nfeProc xmlns="http://www.portalfiscal.inf.br/nfe"$1>'
      )
    }
    if (!xml.match(/<nfeProc[^>]*versao=/)) {
      xml = xml.replace(
        /<nfeProc([^>]*)>/,
        '<nfeProc$1 versao="4.00">'
      )
    }
    return xml
  }
  
  // Se esta dentro de <nfeProcs> (plural), extrair o primeiro <nfeProc>
  if (xml.includes("<nfeProcs")) {
    const nfeProcMatch = xml.match(/<nfeProc[^s][^>]*>[\s\S]*?<\/nfeProc>/)
    if (nfeProcMatch) {
      xml = nfeProcMatch[0]
      // Garantir xmlns e versao
      if (!xml.match(/<nfeProc[^>]*xmlns=/)) {
        xml = xml.replace(
          /<nfeProc([^>]*)>/,
          '<nfeProc xmlns="http://www.portalfiscal.inf.br/nfe"$1>'
        )
      }
      if (!xml.match(/<nfeProc[^>]*versao=/)) {
        xml = xml.replace(
          /<nfeProc([^>]*)>/,
          '<nfeProc$1 versao="4.00">'
        )
      }
      return xml
    }
  }
  
  // Se nao tem nfeProc, tentar extrair NFe e protNFe e montar
  const nfeMatch = xml.match(/<NFe[^>]*>[\s\S]*?<\/NFe>/)
  const protMatch = xml.match(/<protNFe[^>]*>[\s\S]*?<\/protNFe>/)
  
  if (nfeMatch) {
    const nfe = nfeMatch[0]
    const prot = protMatch ? protMatch[0] : ""
    return `<nfeProc xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00">${nfe}${prot}</nfeProc>`
  }
  
  return xml
}
