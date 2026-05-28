import { type NextRequest, NextResponse } from "next/server"
import { pool } from "@/lib/db"

export async function GET() {
  try {
    const [rows] = await pool.execute(`
      SELECT * FROM termos_contratos 
      WHERE ativo = 1
      ORDER BY tipo, created_at DESC
    `)

    return NextResponse.json({
      success: true,
      data: rows || [],
    })
  } catch (error) {
    console.error("Erro ao buscar termos:", error)
    return NextResponse.json({ success: false, error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { tipo, titulo, conteudo, versao, obrigatorio } = await request.json()

    if (!tipo || !titulo || !conteudo) {
      return NextResponse.json({ success: false, error: "Tipo, título e conteúdo são obrigatórios" }, { status: 400 })
    }

    // Verificar se já existe um termo ativo do mesmo tipo
    const [existing] = await pool.execute(
      `
      SELECT id FROM termos_contratos 
      WHERE tipo = ? AND ativo = 1
    `,
      [tipo],
    )

    if (existing.length > 0) {
      // Desativar o termo existente
      await pool.execute(
        `
        UPDATE termos_contratos 
        SET ativo = 0, updated_at = NOW()
        WHERE tipo = ? AND ativo = 1
      `,
        [tipo],
      )
    }

    // Inserir novo termo
    const [result] = await pool.execute(
      `
      INSERT INTO termos_contratos (tipo, titulo, conteudo, versao, obrigatorio, ativo, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, 1, NOW(), NOW())
    `,
      [tipo, titulo, conteudo, versao || "1.0", obrigatorio || 0],
    )

    // Buscar o termo criado
    const [newTermo] = await pool.execute(
      `
      SELECT * FROM termos_contratos WHERE id = ?
    `,
      [result.insertId],
    )

    return NextResponse.json({
      success: true,
      data: newTermo[0],
      message: "Termo criado com sucesso",
    })
  } catch (error) {
    console.error("Erro ao criar termo:", error)
    return NextResponse.json({ success: false, error: "Erro interno do servidor" }, { status: 500 })
  }
}
