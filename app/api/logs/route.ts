import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()

    // Log apenas em desenvolvimento ou para ações importantes
    if (process.env.NODE_ENV === "development" && data.tipo === "login") {
      console.log(`📝 Registrando log: ${data.acao}`)
    }

    const insertQuery = `
      INSERT INTO logs_sistema (
        usuario_id, usuario_nome, usuario_email, acao, modulo, tipo,
        detalhes, ip_address, user_agent, sessao_id, tempo_sessao,
        dados_anteriores, dados_novos, data_hora
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, UTC_TIMESTAMP())
    `

    const result = await query(insertQuery, [
      data.usuario_id,
      data.usuario_nome,
      data.usuario_email,
      data.acao,
      data.modulo,
      data.tipo,
      data.detalhes,
      data.ip_address,
      data.user_agent,
      data.sessao_id,
      data.tempo_sessao || null,
      data.dados_anteriores || null,
      data.dados_novos || null,
    ])

    return NextResponse.json({
      success: true,
      message: "Log registrado com sucesso",
      data: { id: result.insertId },
    })
  } catch (error) {
    console.error("❌ Erro ao registrar log:", error)
    return NextResponse.json({ success: false, message: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "50")
    const offset = (page - 1) * limit

    const logsQuery = `
      SELECT * FROM logs_sistema 
      ORDER BY data_hora DESC 
      LIMIT ? OFFSET ?
    `

    const logs = await query(logsQuery, [limit, offset])

    const countQuery = "SELECT COUNT(*) as total FROM logs_sistema"
    const countResult = await query(countQuery)
    const total = countResult[0]?.total || 0

    return NextResponse.json({
      success: true,
      data: logs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("❌ Erro ao buscar logs:", error)
    return NextResponse.json({ success: false, message: "Erro interno do servidor" }, { status: 500 })
  }
}
