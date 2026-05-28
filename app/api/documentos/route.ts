import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const search = searchParams.get("search") || ""
    const status = searchParams.get("status") || ""
    const tipo = searchParams.get("tipo") || ""

    const offset = (page - 1) * limit

    let whereClause = "WHERE 1=1"
    const params: any[] = []

    if (search) {
      whereClause += " AND (d.titulo LIKE ? OR d.codigo LIKE ? OR d.cliente_nome LIKE ? OR d.tags LIKE ?)"
      const searchTerm = `%${search}%`
      params.push(searchTerm, searchTerm, searchTerm, searchTerm)
    }

    if (status && status !== "all") {
      whereClause += " AND d.status = ?"
      params.push(status)
    }

    if (tipo && tipo !== "all") {
      whereClause += " AND d.tipo_documento = ?"
      params.push(tipo)
    }

    // Buscar documentos com paginação
    const queryText = `
      SELECT 
        d.*,
        c.nome as cliente_nome_completo,
        c.codigo as cliente_codigo
      FROM documentos d
      LEFT JOIN clientes c ON d.cliente_id = c.id
      ${whereClause}
      ORDER BY d.created_at DESC
      LIMIT ? OFFSET ?
    `

    const documentos = await query(queryText, [...params, limit, offset])

    // Contar total de registros
    const countQuery = `
      SELECT COUNT(*) as total
      FROM documentos d
      LEFT JOIN clientes c ON d.cliente_id = c.id
      ${whereClause}
    `

    const countResult = await query(countQuery, params)
    const total = (countResult as any[])[0]?.total || 0

    return NextResponse.json({
      success: true,
      data: documentos,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Erro ao buscar documentos:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Erro ao buscar documentos",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { codigo, titulo, conteudo, cliente_id, tipo_documento, status, tags, observacoes, created_by } = body

    // Validações básicas
    if (!codigo || !titulo) {
      return NextResponse.json(
        {
          success: false,
          message: "Código e título são obrigatórios",
        },
        { status: 400 },
      )
    }

    // Verificar se o código já existe
    const codigoExistente = await query("SELECT id FROM documentos WHERE codigo = ?", [codigo])

    if ((codigoExistente as any[]).length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Código já existe. Gere um novo código.",
        },
        { status: 400 },
      )
    }

    // Buscar nome do cliente se fornecido
    let cliente_nome = null
    let cliente_endereco = null
    let cliente_telefone = null
    let cliente_email = null

    if (cliente_id) {
      const clienteResult = await query("SELECT nome, endereco, telefone, email FROM clientes WHERE id = ?", [
        cliente_id,
      ])
      const cliente = (clienteResult as any[])[0]

      if (cliente) {
        cliente_nome = cliente.nome
        cliente_endereco = cliente.endereco
        cliente_telefone = cliente.telefone
        cliente_email = cliente.email
      }
    }

    // Inserir documento
    const result = await query(
      `
      INSERT INTO documentos (
        codigo, titulo, conteudo, cliente_id, cliente_nome, 
        cliente_endereco, cliente_telefone, cliente_email,
        tipo_documento, status, tags, versao, observacoes, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
    `,
      [
        codigo,
        titulo,
        conteudo,
        cliente_id,
        cliente_nome,
        cliente_endereco,
        cliente_telefone,
        cliente_email,
        tipo_documento || "documento",
        status || "rascunho",
        tags,
        observacoes,
        created_by,
      ],
    )

    const documentoId = (result as any).insertId
    const novoDocumento = await query("SELECT * FROM documentos WHERE id = ?", [documentoId])

    return NextResponse.json({
      success: true,
      data: (novoDocumento as any[])[0],
      message: "Documento criado com sucesso",
    })
  } catch (error) {
    console.error("Erro ao criar documento:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Erro ao criar documento",
      },
      { status: 500 },
    )
  }
}
