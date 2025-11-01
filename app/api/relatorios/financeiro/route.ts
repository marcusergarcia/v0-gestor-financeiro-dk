import { type NextRequest, NextResponse } from "next/server"
import { pool } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const dataInicio = searchParams.get("dataInicio")
    const dataFim = searchParams.get("dataFim")
    const tipo = searchParams.get("tipo") || "geral"

    let whereClause = "WHERE 1=1"
    const params: any[] = []

    if (dataInicio) {
      whereClause += " AND DATE(created_at) >= ?"
      params.push(dataInicio)
    }

    if (dataFim) {
      whereClause += " AND DATE(created_at) <= ?"
      params.push(dataFim)
    }

    let query = ""

    switch (tipo) {
      case "boletos":
        query = `
          SELECT 
            b.id,
            b.numero,
            b.valor,
            b.data_vencimento,
            b.status,
            c.nome as cliente_nome,
            b.created_at
          FROM boletos b
          LEFT JOIN clientes c ON b.cliente_id = c.id
          ${whereClause}
          ORDER BY b.created_at DESC
        `
        break

      case "orcamentos":
        query = `
          SELECT 
            o.id,
            o.numero,
            o.valor_total,
            o.status,
            c.nome as cliente_nome,
            o.created_at
          FROM orcamentos o
          LEFT JOIN clientes c ON o.cliente_id = c.id
          ${whereClause}
          ORDER BY o.created_at DESC
        `
        break

      default:
        // Relatório geral
        const [boletos] = await pool.execute(
          `
          SELECT 
            COUNT(*) as total_boletos,
            COALESCE(SUM(CASE WHEN status = 'pago' THEN valor ELSE 0 END), 0) as receita_boletos,
            COALESCE(SUM(CASE WHEN status = 'pendente' THEN valor ELSE 0 END), 0) as pendente_boletos,
            COALESCE(SUM(CASE WHEN status = 'vencido' THEN valor ELSE 0 END), 0) as vencido_boletos
          FROM boletos 
          ${whereClause}
        `,
          params,
        )

        const [orcamentos] = await pool.execute(
          `
          SELECT 
            COUNT(*) as total_orcamentos,
            COALESCE(SUM(CASE WHEN status = 'aprovado' THEN valor_total ELSE 0 END), 0) as aprovado_orcamentos,
            COALESCE(SUM(CASE WHEN status = 'pendente' THEN valor_total ELSE 0 END), 0) as pendente_orcamentos
          FROM orcamentos 
          ${whereClause}
        `,
          params,
        )

        const [resumo] = await pool.execute(`
          SELECT 
            (SELECT COUNT(*) FROM clientes WHERE ativo = true) as total_clientes,
            (SELECT COUNT(*) FROM produtos WHERE ativo = true) as total_produtos
        `)

        return NextResponse.json({
          success: true,
          data: {
            boletos: (boletos as any[])[0],
            orcamentos: (orcamentos as any[])[0],
            resumo: (resumo as any[])[0],
          },
        })
    }

    const [result] = await pool.execute(query, params)

    return NextResponse.json({
      success: true,
      data: result,
    })
  } catch (error) {
    console.error("Erro ao gerar relatório financeiro:", error)
    return NextResponse.json({ success: false, error: "Erro interno do servidor" }, { status: 500 })
  }
}
