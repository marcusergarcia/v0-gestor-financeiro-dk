import { type NextRequest, NextResponse } from "next/server"
import { pool } from "@/lib/db"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const [notaRows] = await pool.execute(
      `SELECT nf.*, c.nome as cliente_nome, c.codigo as cliente_codigo
       FROM notas_fiscais nf
       LEFT JOIN clientes c ON nf.cliente_id = c.id
       WHERE nf.id = ?`,
      [id],
    )
    const notas = notaRows as any[]
    if (notas.length === 0) {
      return NextResponse.json({ success: false, message: "Nota nao encontrada" }, { status: 404 })
    }

    // Buscar transmissões
    const [transmissoes] = await pool.execute(
      "SELECT id, tipo, sucesso, codigo_erro, mensagem_erro, tempo_resposta_ms, created_at FROM nfse_transmissoes WHERE nota_fiscal_id = ? ORDER BY created_at DESC",
      [id],
    )

    return NextResponse.json({
      success: true,
      data: {
        ...notas[0],
        transmissoes,
      },
    })
  } catch (error: any) {
    console.error("Erro ao buscar nota fiscal:", error)
    return NextResponse.json(
      { success: false, message: "Erro: " + error.message },
      { status: 500 },
    )
  }
}
