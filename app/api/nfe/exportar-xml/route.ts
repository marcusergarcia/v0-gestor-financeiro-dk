import { NextRequest, NextResponse } from "next/server"
import { pool } from "@/lib/database"

// API para exportar XMLs autorizados das NF-e no formato padrao SEFAZ
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
      `SELECT id, numero_nfe, chave_acesso, xml_protocolo, xml_envio, status 
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
      // Preferir xml_protocolo (nfeProc completo), senao usar xml_envio
      let xml = nfe.xml_protocolo || nfe.xml_envio || ""
      
      // Se o XML nao tem o envelope nfeProc, adicionar
      if (xml && !xml.includes("<nfeProc")) {
        // Tentar extrair o NFe do xml_envio se necessario
        const nfeMatch = xml.match(/<NFe[^>]*>[\s\S]*<\/NFe>/)
        if (nfeMatch) {
          xml = `<nfeProc xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00">${nfeMatch[0]}</nfeProc>`
        }
      }
      
      // Garantir que o XML tenha a declaracao XML no inicio
      if (xml && !xml.startsWith("<?xml")) {
        xml = `<?xml version="1.0" encoding="UTF-8"?>${xml}`
      }
      
      return {
        id: nfe.id,
        numero: nfe.numero_nfe,
        chaveAcesso: nfe.chave_acesso,
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
