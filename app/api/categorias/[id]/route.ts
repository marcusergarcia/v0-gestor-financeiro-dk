import { type NextRequest, NextResponse } from "next/server"
import { pool } from "@/lib/database"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id

    const [rows] = await pool.execute("SELECT * FROM tipos_produtos WHERE id = ?", [id])

    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ success: false, message: "Categoria não encontrada" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: rows[0],
    })
  } catch (error) {
    console.error("Erro ao buscar categoria:", error)
    return NextResponse.json({ success: false, message: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    const { codigo, nome, descricao, ativo } = await request.json()

    if (!codigo || !nome) {
      return NextResponse.json({ success: false, message: "Código e nome são obrigatórios" }, { status: 400 })
    }

    // Verificar se código já existe em outra categoria
    const [existingRows] = await pool.execute("SELECT id FROM tipos_produtos WHERE codigo = ? AND id != ?", [
      codigo,
      id,
    ])

    if (Array.isArray(existingRows) && existingRows.length > 0) {
      return NextResponse.json({ success: false, message: "Código já existe" }, { status: 400 })
    }

    // Atualizar categoria
    await pool.execute("UPDATE tipos_produtos SET codigo = ?, nome = ?, descricao = ?, ativo = ? WHERE id = ?", [
      codigo,
      nome,
      descricao || null,
      ativo ? 1 : 0,
      id,
    ])

    return NextResponse.json({
      success: true,
      data: {
        id: Number.parseInt(id),
        codigo,
        nome,
        descricao,
        ativo,
      },
    })
  } catch (error) {
    console.error("Erro ao atualizar categoria:", error)
    return NextResponse.json({ success: false, message: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id

    // Verificar se categoria está sendo usada
    const [produtosRows] = await pool.execute(
      "SELECT COUNT(*) as count FROM produtos WHERE tipo = (SELECT nome FROM tipos_produtos WHERE id = ?)",
      [id],
    )
    const produtosCount = (produtosRows as any)[0]?.count || 0

    if (produtosCount > 0) {
      return NextResponse.json(
        { success: false, message: "Não é possível excluir categoria que possui produtos vinculados" },
        { status: 400 },
      )
    }

    // Excluir categoria
    await pool.execute("DELETE FROM tipos_produtos WHERE id = ?", [id])

    return NextResponse.json({
      success: true,
      message: "Categoria excluída com sucesso",
    })
  } catch (error) {
    console.error("Erro ao excluir categoria:", error)
    return NextResponse.json({ success: false, message: "Erro interno do servidor" }, { status: 500 })
  }
}
