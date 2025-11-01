import { NextResponse } from "next/server"
import { pool } from "@/lib/database"

export async function GET() {
  try {
    // Busca estatísticas gerais
    const [statsResult] = await pool.execute(`
      SELECT 
        (SELECT COUNT(*) FROM clientes WHERE ativo = 1) as total_clientes,
        (SELECT COUNT(*) FROM produtos WHERE ativo = 1) as total_produtos,
        (SELECT COUNT(*) FROM boletos) as total_boletos,
        (SELECT COUNT(*) FROM recibos) as total_recibos,
        (SELECT COALESCE(SUM(valor_total), 0) FROM boletos WHERE status = 'pago' AND MONTH(data_emissao) = MONTH(CURRENT_DATE()) AND YEAR(data_emissao) = YEAR(CURRENT_DATE())) as faturamento_mes,
        (SELECT COUNT(*) FROM boletos WHERE status = 'pendente' AND data_vencimento < CURRENT_DATE()) as boletos_vencidos,
        (SELECT COUNT(*) FROM produtos WHERE ativo = 1 AND estoque_atual <= estoque_minimo) as estoque_minimo,
        (SELECT COUNT(*) FROM clientes WHERE ativo = 1) as clientes_ativos
    `)

    const stats = (statsResult as any[])[0]

    // Busca boletos recentes
    const [boletosResult] = await pool.execute(`
      SELECT 
        b.id,
        b.numero,
        c.nome as cliente_nome,
        b.valor_total,
        b.data_vencimento,
        b.status
      FROM boletos b
      LEFT JOIN clientes c ON b.cliente_id = c.id
      ORDER BY b.created_at DESC
      LIMIT 5
    `)

    // Busca clientes recentes
    const [clientesResult] = await pool.execute(`
      SELECT 
        id,
        codigo,
        nome,
        email,
        telefone,
        created_at
      FROM clientes
      WHERE ativo = 1
      ORDER BY created_at DESC
      LIMIT 5
    `)

    // Busca estatísticas financeiras
    const [financialResult] = await pool.execute(`
      SELECT 
        (SELECT COALESCE(SUM(valor_total), 0) FROM boletos WHERE status = 'pago') as total_income,
        (SELECT COUNT(*) FROM boletos WHERE status = 'pendente') as pending_boletos,
        (SELECT COUNT(*) FROM boletos WHERE status = 'pago') as paid_boletos,
        (SELECT COUNT(*) FROM boletos WHERE status = 'pendente' AND data_vencimento < CURRENT_DATE()) as overdue_boletos
    `)

    const financial = (financialResult as any[])[0]
    const financialStats = {
      totalIncome: financial.total_income,
      totalExpenses: 0,
      netProfit: financial.total_income,
      pendingBoletos: financial.pending_boletos,
      paidBoletos: financial.paid_boletos,
      overdueBoletos: financial.overdue_boletos,
    }

    return NextResponse.json({
      stats,
      recentBoletos: boletosResult,
      recentClientes: clientesResult,
      financialStats,
    })
  } catch (error) {
    console.error("Erro ao buscar dados completos do dashboard:", error)
    return NextResponse.json({ error: "Erro ao buscar dados do dashboard" }, { status: 500 })
  }
}
