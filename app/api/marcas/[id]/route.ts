import { type NextRequest, NextResponse } from "next/server"
import { pool } from "@/lib/db"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const [rows] = await pool.execute(
      "SELECT id, nome, sigla, contador, descricao, ativo, created_at, updated_at FROM marcas WHERE id = ?",
      [id],
    )

    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ success: false, message: "Marca não encontrada" }, { status: 404 })
    }

    const marca = rows[0] as any

    return NextResponse.json({
      success: true,
      data: {
        id: marca.id,
        nome: marca.nome,
        sigla: marca.sigla,
        contador: Number(marca.contador) || 0,
        descricao: marca.descricao,
        ativo: Boolean(marca.ativo),
        created_at: marca.created_at,
        updated_at: marca.updated_at,
      },
    })
  } catch (error) {
    console.error("❌ Erro ao buscar marca:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Erro interno do servidor",
      },
      { status: 500 },
    )
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const { nome, sigla, descricao, ativo } = body

    if (!nome) {
      return NextResponse.json({ success: false, message: "Nome é obrigatório" }, { status: 400 })
    }

    // Verificar se a marca existe
    const [existing] = await pool.execute("SELECT id FROM marcas WHERE id = ?", [id])

    if (!Array.isArray(existing) || existing.length === 0) {
      return NextResponse.json({ success: false, message: "Marca não encontrada" }, { status: 404 })
    }

    // Verificar se já existe outra marca com este nome
    const [duplicate] = await pool.execute("SELECT id FROM marcas WHERE nome = ? AND id != ?", [nome, id])

    if (Array.isArray(duplicate) && duplicate.length > 0) {
      return NextResponse.json({ success: false, message: "Já existe uma marca com este nome" }, { status: 400 })
    }

    const [result] = await pool.execute(
      `UPDATE marcas 
       SET nome = ?, sigla = ?, descricao = ?, ativo = ?, updated_at = NOW()
       WHERE id = ?`,
      [nome, sigla, descricao || "", ativo ? 1 : 0, id],
    )

    return NextResponse.json({
      success: true,
      data: { id, nome, sigla, descricao, ativo },
      message: "Marca atualizada com sucesso",
    })
  } catch (error) {
    console.error("❌ Erro ao atualizar marca:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Erro interno do servidor",
      },
      { status: 500 },
    )
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    // Verificar se a marca existe
    const [existing] = await pool.execute("SELECT id FROM marcas WHERE id = ?", [id])

    if (!Array.isArray(existing) || existing.length === 0) {
      return NextResponse.json({ success: false, message: "Marca não encontrada" }, { status: 404 })
    }

    // Verificar se há produtos vinculados usando o campo 'marca' da tabela produtos
    const [products] = await pool.execute("SELECT id FROM produtos WHERE marca = ? AND ativo = 1", [id])

    if (Array.isArray(products) && products.length > 0) {
      return NextResponse.json(
        { success: false, message: "Não é possível excluir marca com produtos vinculados" },
        { status: 400 },
      )
    }

    const [result] = await pool.execute("DELETE FROM marcas WHERE id = ?", [id])

    return NextResponse.json({
      success: true,
      message: "Marca excluída com sucesso",
    })
  } catch (error) {
    console.error("❌ Erro ao excluir marca:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Erro interno do servidor",
      },
      { status: 500 },
    )
  }
}
