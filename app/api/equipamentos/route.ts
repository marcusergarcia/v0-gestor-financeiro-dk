import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "50")
    const search = searchParams.get("search") || ""
    const ativo = searchParams.get("ativo")

    const offset = (page - 1) * limit

    let whereClause = "WHERE 1=1"
    const params: any[] = []

    if (search) {
      whereClause += " AND (nome LIKE ? OR descricao LIKE ? OR categoria LIKE ?)"
      params.push(`%${search}%`, `%${search}%`, `%${search}%`)
    }

    if (ativo !== null && ativo !== undefined) {
      whereClause += " AND ativo = ?"
      params.push(ativo === "true" ? 1 : 0)
    }

    // Buscar equipamentos
    const equipamentos = await query(
      `SELECT id, nome, descricao, categoria, valor_hora, ativo, created_at, updated_at
       FROM equipamentos 
       ${whereClause}
       ORDER BY nome ASC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    )

    // Contar total
    const totalResult = await query(
      `SELECT COUNT(*) as total FROM equipamentos ${whereClause}`,
      params
    )

    const total = Array.isArray(totalResult) ? (totalResult[0] as { total: number }).total : 0

    return NextResponse.json({
      success: true,
      data: equipamentos,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error("Erro ao buscar equipamentos:", error)
    return NextResponse.json({
      success: false,
      error: "Erro interno do servidor"
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { nome, descricao, categoria, valor_hora } = body

    if (!nome?.trim()) {
      return NextResponse.json({
        success: false,
        error: "Nome é obrigatório"
      }, { status: 400 })
    }

    // Verificar se já existe equipamento com o mesmo nome
    const existeResult = await query(
      "SELECT id FROM equipamentos WHERE nome = ?",
      [nome.trim()]
    )

    if (Array.isArray(existeResult) && existeResult.length > 0) {
      return NextResponse.json({
        success: false,
        error: "Já existe um equipamento com este nome"
      }, { status: 400 })
    }

    // Inserir novo equipamento
    const result = await query(
      `INSERT INTO equipamentos (nome, descricao, categoria, valor_hora, ativo) 
       VALUES (?, ?, ?, ?, 1)`,
      [
        nome.trim(),
        descricao?.trim() || null,
        categoria?.trim() || null,
        valor_hora ? parseFloat(valor_hora) : null
      ]
    )

    const insertResult = result as { insertId: number }

    return NextResponse.json({
      success: true,
      data: {
        id: insertResult.insertId,
        nome: nome.trim(),
        descricao: descricao?.trim() || null,
        categoria: categoria?.trim() || null,
        valor_hora: valor_hora ? parseFloat(valor_hora) : null,
        ativo: true
      }
    })

  } catch (error) {
    console.error("Erro ao criar equipamento:", error)
    return NextResponse.json({
      success: false,
      error: "Erro interno do servidor"
    }, { status: 500 })
  }
}
