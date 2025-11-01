import { type NextRequest, NextResponse } from "next/server"
import { pool } from "@/lib/db"

export async function GET() {
  try {
    const [result] = await pool.execute(`
      SELECT * FROM configuracao_valor_km 
      WHERE ativo = 1 
      ORDER BY created_at DESC 
      LIMIT 1
    `)

    const config = (result as any[])[0] || {
      valor_por_km: 1.5,
      descricao: "Valor padrão por quilômetro rodado",
      aplicacao: "Usado em orçamentos e contratos",
    }

    return NextResponse.json({
      success: true,
      data: config,
    })
  } catch (error) {
    console.error("Erro ao buscar configuração de valor por km:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Erro interno do servidor",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { valor_por_km, descricao, aplicacao } = body

    if (!valor_por_km || valor_por_km <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Valor por km deve ser maior que zero",
        },
        { status: 400 },
      )
    }

    // Verifica se já existe uma configuração ativa
    const [existing] = await pool.execute(`
      SELECT id FROM configuracao_valor_km WHERE ativo = 1 LIMIT 1
    `)

    let result
    if ((existing as any[]).length > 0) {
      // Atualiza a configuração existente
      const configId = (existing as any[])[0].id
      await pool.execute(
        `
        UPDATE configuracao_valor_km 
        SET valor_por_km = ?, descricao = ?, aplicacao = ?, updated_at = NOW()
        WHERE id = ?
      `,
        [valor_por_km, descricao || "Configuração de valor por km", aplicacao || "Geral", configId],
      )

      // Busca a configuração atualizada
      const [updated] = await pool.execute(`SELECT * FROM configuracao_valor_km WHERE id = ?`, [configId])
      result = (updated as any[])[0]
    } else {
      // Cria nova configuração se não existir nenhuma
      const [insertResult] = await pool.execute(
        `
        INSERT INTO configuracao_valor_km (valor_por_km, descricao, aplicacao, ativo, created_at, updated_at)
        VALUES (?, ?, ?, 1, NOW(), NOW())
      `,
        [valor_por_km, descricao || "Configuração de valor por km", aplicacao || "Geral"],
      )

      const insertId = (insertResult as any).insertId
      const [newConfig] = await pool.execute(`SELECT * FROM configuracao_valor_km WHERE id = ?`, [insertId])
      result = (newConfig as any[])[0]
    }

    return NextResponse.json({
      success: true,
      data: result,
      message: "Configuração salva com sucesso",
    })
  } catch (error) {
    console.error("Erro ao salvar configuração de valor por km:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Erro interno do servidor",
      },
      { status: 500 },
    )
  }
}
