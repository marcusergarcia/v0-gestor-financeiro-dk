import { type NextRequest, NextResponse } from "next/server"
import { pool } from "@/lib/db"

export async function GET() {
  try {
    const [result] = await pool.execute(`
      SELECT * FROM feriados 
      WHERE ativo = 1 
      ORDER BY data ASC
    `)

    return NextResponse.json({
      success: true,
      data: result,
    })
  } catch (error) {
    console.error("Erro ao buscar feriados:", error)
    return NextResponse.json({ success: false, error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { data, nome, tipo, recorrente } = await request.json()

    // Validações
    if (!data || !nome || !tipo) {
      return NextResponse.json({ success: false, error: "Data, nome e tipo são obrigatórios" }, { status: 400 })
    }

    // Verifica se a data é válida
    const dataObj = new Date(data + "T00:00:00")
    if (isNaN(dataObj.getTime())) {
      return NextResponse.json({ success: false, error: "Data inválida" }, { status: 400 })
    }

    const [result] = await pool.execute(
      `
      INSERT INTO feriados (data, nome, tipo, recorrente, ativo, created_at, updated_at)
      VALUES (?, ?, ?, ?, 1, NOW(), NOW())
    `,
      [data, nome, tipo, recorrente ? 1 : 0],
    )

    // Busca o registro inserido
    const [inserted] = await pool.execute(
      `
      SELECT * FROM feriados WHERE id = ?
    `,
      [(result as any).insertId],
    )

    return NextResponse.json({
      success: true,
      data: (inserted as any[])[0],
      message: "Feriado adicionado com sucesso",
    })
  } catch (error) {
    console.error("Erro ao adicionar feriado:", error)
    return NextResponse.json({ success: false, error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, data, nome, tipo, recorrente } = await request.json()

    // Validações
    if (!id || !data || !nome || !tipo) {
      return NextResponse.json({ success: false, error: "ID, data, nome e tipo são obrigatórios" }, { status: 400 })
    }

    // Verifica se a data é válida
    const dataObj = new Date(data + "T00:00:00")
    if (isNaN(dataObj.getTime())) {
      return NextResponse.json({ success: false, error: "Data inválida" }, { status: 400 })
    }

    const [result] = await pool.execute(
      `
      UPDATE feriados 
      SET data = ?, nome = ?, tipo = ?, recorrente = ?, updated_at = NOW()
      WHERE id = ?
    `,
      [data, nome, tipo, recorrente ? 1 : 0, id],
    )

    if ((result as any).affectedRows === 0) {
      return NextResponse.json({ success: false, error: "Feriado não encontrado" }, { status: 404 })
    }

    // Busca o registro atualizado
    const [updated] = await pool.execute(
      `
      SELECT * FROM feriados WHERE id = ?
    `,
      [id],
    )

    return NextResponse.json({
      success: true,
      data: (updated as any[])[0],
      message: "Feriado atualizado com sucesso",
    })
  } catch (error) {
    console.error("Erro ao atualizar feriado:", error)
    return NextResponse.json({ success: false, error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ success: false, error: "ID é obrigatório" }, { status: 400 })
    }

    const [result] = await pool.execute(
      `
      DELETE FROM feriados 
      WHERE id = ?
    `,
      [id],
    )

    if ((result as any).affectedRows === 0) {
      return NextResponse.json({ success: false, error: "Feriado não encontrado" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: "Feriado removido com sucesso",
    })
  } catch (error) {
    console.error("Erro ao remover feriado:", error)
    return NextResponse.json({ success: false, error: "Erro interno do servidor" }, { status: 500 })
  }
}
