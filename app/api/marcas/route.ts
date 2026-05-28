import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search") || ""
    const limit = Number.parseInt(searchParams.get("limit") || "50")
    const offset = Number.parseInt(searchParams.get("offset") || "0")

    let sql = `
      SELECT 
        id,
        nome,
        sigla,
        contador,
        ativo,
        (SELECT COUNT(*) FROM produtos WHERE marca = marcas.nome AND ativo = 1) as total_produtos
      FROM marcas 
      WHERE ativo = 1
    `

    const params: any[] = []

    if (search) {
      sql += ` AND (nome LIKE ? OR sigla LIKE ?)`
      params.push(`%${search}%`, `%${search}%`)
    }

    sql += ` ORDER BY nome ASC`

    if (limit > 0) {
      sql += ` LIMIT ? OFFSET ?`
      params.push(limit, offset)
    }

    const marcas = await query(sql, params)

    // Contar total de registros para paginação
    let countSql = `SELECT COUNT(*) as total FROM marcas WHERE ativo = 1`
    const countParams: any[] = []

    if (search) {
      countSql += ` AND (nome LIKE ? OR sigla LIKE ?)`
      countParams.push(`%${search}%`, `%${search}%`)
    }

    const countResult = (await query(countSql, countParams)) as any[]
    const total = countResult[0]?.total || 0

    return NextResponse.json({
      success: true,
      data: marcas,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    })
  } catch (error) {
    console.error("Erro ao buscar marcas:", error)
    return NextResponse.json({ success: false, message: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { nome, sigla } = body

    if (!nome?.trim()) {
      return NextResponse.json({ success: false, message: "Nome da marca é obrigatório" }, { status: 400 })
    }

    // Verificar se já existe uma marca com o mesmo nome
    const existingMarca = (await query("SELECT id FROM marcas WHERE nome = ? AND ativo = 1", [nome.trim()])) as any[]

    if (existingMarca.length > 0) {
      return NextResponse.json({ success: false, message: "Já existe uma marca com este nome" }, { status: 400 })
    }

    // Gerar sigla automaticamente se não fornecida
    let finalSigla = sigla?.trim()
    if (!finalSigla) {
      // Extrair consoantes do nome para gerar sigla
      const consoantes = nome
        .trim()
        .replace(/[aeiouAEIOU\s]/g, "")
        .substring(0, 4)
        .toUpperCase()
      finalSigla = consoantes || nome.trim().substring(0, 3).toUpperCase()
    }

    // Inserir nova marca
    const result = (await query(
      `INSERT INTO marcas (nome, sigla, contador, ativo, created_at, updated_at) 
       VALUES (?, ?, 1, 1, NOW(), NOW())`,
      [nome.trim(), finalSigla],
    )) as any

    // Buscar a marca criada
    const novaMarca = (await query("SELECT * FROM marcas WHERE id = ?", [result.insertId])) as any[]

    return NextResponse.json({
      success: true,
      data: novaMarca[0],
      message: "Marca criada com sucesso",
    })
  } catch (error) {
    console.error("Erro ao criar marca:", error)
    return NextResponse.json({ success: false, message: "Erro interno do servidor" }, { status: 500 })
  }
}
