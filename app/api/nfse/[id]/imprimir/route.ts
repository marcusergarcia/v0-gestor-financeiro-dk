import { type NextRequest, NextResponse } from "next/server"
import { pool } from "@/lib/db"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    // Buscar nota fiscal com dados do cliente
    const [notaRows] = await pool.execute(
      `SELECT nf.*, c.nome as cliente_nome
       FROM notas_fiscais nf
       LEFT JOIN clientes c ON nf.cliente_id = c.id
       WHERE nf.id = ?`,
      [id],
    )
    const notas = notaRows as any[]
    if (notas.length === 0) {
      return NextResponse.json({ success: false, message: "Nota nao encontrada" }, { status: 404 })
    }
    const nota = notas[0]

    // Buscar config do prestador
    const [configRows] = await pool.execute(
      "SELECT razao_social, cnpj, inscricao_municipal, endereco, numero_endereco, complemento, bairro, cidade, uf, cep, codigo_servico, descricao_servico FROM nfse_config WHERE ativo = 1 LIMIT 1"
    )
    const configs = configRows as any[]
    const config = configs.length > 0 ? configs[0] : null

    // Buscar logo da empresa (tabela logos_sistema)
    // Prioridade: impressao > sistema > menu
    let logoBase64 = null
    try {
      const [logoRows] = await pool.execute(
        "SELECT dados, formato FROM logos_sistema WHERE tipo IN ('impressao', 'sistema', 'menu') AND ativo = 1 ORDER BY FIELD(tipo, 'impressao', 'sistema', 'menu') LIMIT 1"
      )
      const logos = logoRows as any[]
      if (logos.length > 0) {
        const logo = logos[0]
        if (logo.dados) {
          const mimeType = logo.formato === "jpg" || logo.formato === "jpeg" ? "image/jpeg"
            : logo.formato === "gif" ? "image/gif"
            : logo.formato === "webp" ? "image/webp"
            : logo.formato === "svg" ? "image/svg+xml"
            : "image/png"
          logoBase64 = logo.dados.startsWith("data:")
            ? logo.dados
            : `data:${mimeType};base64,${logo.dados}`
        }
      }
    } catch {
      // Tabela logos_sistema pode nao existir
    }

    return NextResponse.json({
      success: true,
      data: {
        nota,
        prestador: config,
        logo: logoBase64,
      },
    })
  } catch (error: any) {
    console.error("Erro ao buscar dados para impressao:", error)
    return NextResponse.json(
      { success: false, message: "Erro: " + error.message },
      { status: 500 },
    )
  }
}
