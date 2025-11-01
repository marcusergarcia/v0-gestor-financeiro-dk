import { type NextRequest, NextResponse } from "next/server"
import { pool } from "@/lib/database"

export async function GET() {
  try {
    const [rows] = await pool.execute(`
      SELECT id, codigo, nome, descricao, ativo, created_at, updated_at 
      FROM tipos_produtos 
      WHERE ativo = 1 
      ORDER BY nome ASC
    `)

    return NextResponse.json({
      success: true,
      data: rows,
    })
  } catch (error) {
    console.error("Erro ao buscar categorias:", error)
    return NextResponse.json({ success: false, message: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { codigo, nome, descricao } = await request.json()

    if (!codigo || !nome) {
      return NextResponse.json({ success: false, message: "Código e nome são obrigatórios" }, { status: 400 })
    }

    // Verificar se código já existe
    const [existingRows] = await pool.execute("SELECT id FROM tipos_produtos WHERE codigo = ?", [codigo])

    if (Array.isArray(existingRows) && existingRows.length > 0) {
      return NextResponse.json({ success: false, message: "Código já existe" }, { status: 400 })
    }

    // Inserir nova categoria
    const [result] = await pool.execute(
      "INSERT INTO tipos_produtos (codigo, nome, descricao, ativo) VALUES (?, ?, ?, 1)",
      [codigo, nome, descricao || null],
    )

    const insertResult = result as any

    return NextResponse.json({
      success: true,
      data: {
        id: insertResult.insertId,
        codigo,
        nome,
        descricao,
        ativo: true,
      },
    })
  } catch (error) {
    console.error("Erro ao criar categoria:", error)
    return NextResponse.json({ success: false, message: "Erro interno do servidor" }, { status: 500 })
  }
}
