import { type NextRequest, NextResponse } from "next/server"
import { pool } from "@/lib/db"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    // Buscar NF-e com dados do cliente
    const [nfeRows] = await pool.execute(
      `SELECT ne.*, c.nome as cliente_nome
       FROM nfe_emitidas ne
       LEFT JOIN clientes c ON ne.cliente_id = c.id
       WHERE ne.id = ?`,
      [id],
    )
    const nfes = nfeRows as any[]
    if (nfes.length === 0) {
      return NextResponse.json({ success: false, message: "NF-e nao encontrada" }, { status: 404 })
    }
    const nfe = nfes[0]

    // Buscar itens da NF-e
    const [itensRows] = await pool.execute(
      "SELECT * FROM nfe_itens WHERE nfe_id = ? ORDER BY numero_item",
      [id]
    )

    // Buscar config do emitente (NF-e)
    const [configRows] = await pool.execute(
      "SELECT * FROM nfe_config WHERE ativo = 1 LIMIT 1"
    )
    const configs = configRows as any[]
    const config = configs.length > 0 ? configs[0] : null

    // Buscar Logo do Sistema
    let logoBase64 = null
    try {
      const [logoRows] = await pool.execute(
        "SELECT dados, formato FROM logos_sistema WHERE tipo = 'sistema' AND ativo = 1 LIMIT 1"
      )
      const logos = logoRows as any[]
      if (logos.length > 0) {
        const logo = logos[0]
        if (logo.dados) {
          const mimeType = logo.formato === "jpg" || logo.formato === "jpeg" ? "image/jpeg"
            : logo.formato === "gif" ? "image/gif"
            : logo.formato === "webp" ? "image/webp"
            : "image/png"
          logoBase64 = logo.dados.startsWith("data:")
            ? logo.dados
            : `data:${mimeType};base64,${logo.dados}`
        }
      }
    } catch {
      // Tabela pode nao existir
    }

    return NextResponse.json({
      success: true,
      data: {
        nfe,
        itens: itensRows,
        emitente: config,
        logo: logoBase64,
      },
    })
  } catch (error: any) {
    console.error("Erro ao buscar dados DANFE:", error)
    return NextResponse.json(
      { success: false, message: "Erro: " + error.message },
      { status: 500 },
    )
  }
}
