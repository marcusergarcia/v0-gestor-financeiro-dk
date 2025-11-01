import { type NextRequest, NextResponse } from "next/server"
import { pool } from "@/lib/database"

export async function GET() {
  try {
    const [rows] = await pool.execute(`
      SELECT 
        id,
        nome,
        categoria,
        valor_hora,
        descricao,
        ativo,
        created_at,
        updated_at
      FROM equipamentos 
      ORDER BY categoria, nome
    `)

    return NextResponse.json(Array.isArray(rows) ? rows : [])
  } catch (error) {
    console.error("Erro ao buscar equipamentos:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { nome, categoria, valor_hora, descricao } = await request.json()

    const [result] = await pool.execute(
      `INSERT INTO equipamentos (nome, categoria, valor_hora, descricao, ativo, created_at, updated_at)
       VALUES (?, ?, ?, ?, 1, NOW(), NOW())`,
      [nome, categoria || "basicos", valor_hora, descricao || null],
    )

    // Buscar o equipamento criado
    const [newEquipamento] = await pool.execute("SELECT * FROM equipamentos WHERE id = ?", [(result as any).insertId])

    return NextResponse.json(Array.isArray(newEquipamento) ? newEquipamento[0] : null)
  } catch (error) {
    console.error("Erro ao criar equipamento:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
