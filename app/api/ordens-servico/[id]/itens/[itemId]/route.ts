import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string; itemId: string }> }) {
  try {
    const { itemId } = await params
    const data = await request.json()

    console.log("Atualizando item ID:", itemId)
    console.log("Novos dados:", data)

    await query(
      `
      UPDATE ordens_servico_itens 
      SET 
        observacoes = ?,
        situacao = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `,
      [data.observacoes || null, data.situacao || "pendente", itemId],
    )

    return NextResponse.json({
      success: true,
      message: "Item atualizado com sucesso",
    })
  } catch (error) {
    console.error("Erro ao atualizar item:", error)
    return NextResponse.json(
      { success: false, message: "Erro interno do servidor", error: String(error) },
      { status: 500 },
    )
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string; itemId: string }> }) {
  try {
    const { itemId } = await params

    console.log("Deletando item ID:", itemId)

    await query("DELETE FROM ordens_servico_itens WHERE id = ?", [itemId])

    return NextResponse.json({
      success: true,
      message: "Item deletado com sucesso",
    })
  } catch (error) {
    console.error("Erro ao deletar item:", error)
    return NextResponse.json(
      { success: false, message: "Erro interno do servidor", error: String(error) },
      { status: 500 },
    )
  }
}
