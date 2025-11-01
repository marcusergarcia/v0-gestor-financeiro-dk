import { type NextRequest, NextResponse } from "next/server"
import { pool } from "@/lib/database"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const [rows] = await pool.execute("SELECT * FROM equipamentos WHERE id = ?", [id])

    const equipamento = Array.isArray(rows) && rows.length > 0 ? rows[0] : null

    if (!equipamento) {
      return NextResponse.json({ error: "Equipamento não encontrado" }, { status: 404 })
    }

    return NextResponse.json(equipamento)
  } catch (error) {
    console.error("Erro ao buscar equipamento:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { nome, categoria, valor_hora, descricao, ativo } = await request.json()

    await pool.execute(
      `UPDATE equipamentos 
       SET nome = ?, categoria = ?, valor_hora = ?, descricao = ?, ativo = ?, updated_at = NOW()
       WHERE id = ?`,
      [nome, categoria, valor_hora, descricao, ativo !== undefined ? ativo : 1, id],
    )

    // Buscar o equipamento atualizado
    const [updatedEquipamento] = await pool.execute("SELECT * FROM equipamentos WHERE id = ?", [id])

    return NextResponse.json(Array.isArray(updatedEquipamento) ? updatedEquipamento[0] : null)
  } catch (error) {
    console.error("Erro ao atualizar equipamento:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    // Soft delete - marcar como inativo
    await pool.execute("UPDATE equipamentos SET ativo = 0, updated_at = NOW() WHERE id = ?", [id])

    return NextResponse.json({ message: "Equipamento excluído com sucesso" })
  } catch (error) {
    console.error("Erro ao excluir equipamento:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
