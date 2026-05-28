import { type NextRequest, NextResponse } from "next/server"
import { pool } from "@/lib/db"

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { cliente_id, valor, descricao, observacoes } = await request.json()

    if (!cliente_id || !valor || !descricao) {
      return NextResponse.json(
        {
          success: false,
          error: "Dados obrigatórios não informados",
        },
        { status: 400 },
      )
    }

    await pool.execute(
      `
      UPDATE recibos 
      SET cliente_id = ?, valor = ?, descricao = ?, observacoes = ?, updated_at = NOW()
      WHERE id = ?
    `,
      [cliente_id, valor, descricao, observacoes || "", id],
    )

    // Buscar o recibo atualizado
    const [updatedRecibo] = await pool.execute(
      `
      SELECT 
        r.id,
        r.numero,
        r.cliente_id,
        c.nome as cliente_nome,
        r.valor,
        r.data_emissao,
        r.descricao,
        r.observacoes,
        r.created_at
      FROM recibos r
      LEFT JOIN clientes c ON r.cliente_id = c.id
      WHERE r.id = ?
    `,
      [id],
    )

    return NextResponse.json({
      success: true,
      data: (updatedRecibo as any[])[0],
    })
  } catch (error) {
    console.error("Erro ao atualizar recibo:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Erro ao atualizar recibo",
      },
      { status: 500 },
    )
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    await pool.execute(
      `
      UPDATE recibos SET ativo = 0, updated_at = NOW() WHERE id = ?
    `,
      [id],
    )

    return NextResponse.json({
      success: true,
      message: "Recibo excluído com sucesso",
    })
  } catch (error) {
    console.error("Erro ao excluir recibo:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Erro ao excluir recibo",
      },
      { status: 500 },
    )
  }
}
