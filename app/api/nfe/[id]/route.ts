import { type NextRequest, NextResponse } from "next/server"
import { pool } from "@/lib/db"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const [nfeRows] = await pool.execute(
      `SELECT ne.*, c.nome as cliente_nome
       FROM nfe_emitidas ne
       LEFT JOIN clientes c ON ne.cliente_id = c.id
       WHERE ne.id = ?`,
      [id]
    )
    const nfes = nfeRows as any[]
    if (nfes.length === 0) {
      return NextResponse.json({ success: false, message: "NF-e nao encontrada" }, { status: 404 })
    }

    // Buscar itens
    const [itensRows] = await pool.execute(
      "SELECT * FROM nfe_itens WHERE nfe_id = ? ORDER BY numero_item",
      [id]
    )

    // Buscar transmissoes
    const [transmissoesRows] = await pool.execute(
      "SELECT * FROM nfe_transmissoes WHERE nfe_id = ? ORDER BY created_at DESC",
      [id]
    )

    return NextResponse.json({
      success: true,
      data: {
        ...nfes[0],
        itens: itensRows,
        transmissoes: transmissoesRows,
      },
    })
  } catch (error: any) {
    console.error("Erro ao buscar NF-e:", error)
    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }
}
