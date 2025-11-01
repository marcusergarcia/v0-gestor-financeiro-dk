import { type NextRequest, NextResponse } from "next/server"
import { pool } from "@/lib/db"

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { titulo, conteudo, versao, obrigatorio } = await request.json()

    if (!titulo || !conteudo) {
      return NextResponse.json({ success: false, error: "Título e conteúdo são obrigatórios" }, { status: 400 })
    }

    // Atualizar o termo
    const [result] = await pool.execute(
      `
      UPDATE termos_contratos 
      SET titulo = ?, conteudo = ?, versao = ?, obrigatorio = ?, updated_at = NOW()
      WHERE id = ? AND ativo = 1
    `,
      [titulo, conteudo, versao || "1.0", obrigatorio || 0, id],
    )

    if (result.affectedRows === 0) {
      return NextResponse.json({ success: false, error: "Termo não encontrado ou inativo" }, { status: 404 })
    }

    // Buscar o termo atualizado
    const [updatedTermo] = await pool.execute(
      `
      SELECT * FROM termos_contratos WHERE id = ?
    `,
      [id],
    )

    return NextResponse.json({
      success: true,
      data: updatedTermo[0],
      message: "Termo atualizado com sucesso",
    })
  } catch (error) {
    console.error("Erro ao atualizar termo:", error)
    return NextResponse.json({ success: false, error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    // Soft delete - marcar como inativo
    const [result] = await pool.execute(
      `
      UPDATE termos_contratos 
      SET ativo = 0, updated_at = NOW()
      WHERE id = ?
    `,
      [id],
    )

    if (result.affectedRows === 0) {
      return NextResponse.json({ success: false, error: "Termo não encontrado" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: "Termo removido com sucesso",
    })
  } catch (error) {
    console.error("Erro ao remover termo:", error)
    return NextResponse.json({ success: false, error: "Erro interno do servidor" }, { status: 500 })
  }
}
