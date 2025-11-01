import { pool } from "./db"
import type { DashboardStats, RecentBoleto, RecentCliente, FinancialStats } from "@/types"

// Função sql para compatibilidade com código existente
export const sql = {
  unsafe: async (query: string, params: any[] = []) => {
    const [rows] = await pool.execute(query, params)
    return rows
  },
}

// Template literal function para queries SQL
export async function sqlQuery(strings: TemplateStringsArray, ...values: any[]) {
  let query = strings[0]
  const params: any[] = []

  for (let i = 0; i < values.length; i++) {
    query += "?" + strings[i + 1]
    params.push(values[i])
  }

  const [rows] = await pool.execute(query, params)
  return rows
}

// Função para executar queries SQL com parâmetros
export async function executeQuery<T = any>(query: string, params: any[] = []): Promise<T[]> {
  const [rows] = await pool.execute(query, params)
  return rows as T[]
}

export async function getDashboardStats(): Promise<DashboardStats> {
  try {
    // Total de clientes ativos
    const [clientesResult] = await pool.execute("SELECT COUNT(*) as total FROM clientes WHERE ativo = 1")
    const totalClientes = (clientesResult as any[])[0].total

    // Total de produtos ativos
    const [produtosResult] = await pool.execute("SELECT COUNT(*) as total FROM produtos WHERE ativo = 1")
    const totalProdutos = (produtosResult as any[])[0].total

    // Total de boletos
    const [boletosResult] = await pool.execute("SELECT COUNT(*) as total FROM boletos")
    const totalBoletos = (boletosResult as any[])[0].total

    // Total de recibos
    const [recibosResult] = await pool.execute("SELECT COUNT(*) as total FROM recibos")
    const totalRecibos = (recibosResult as any[])[0].total

    // Faturamento do mês atual
    const [faturamentoResult] = await pool.execute(`
      SELECT COALESCE(SUM(valor_total), 0) as total 
      FROM boletos 
      WHERE status = 'pago' 
      AND MONTH(data_emissao) = MONTH(CURRENT_DATE()) 
      AND YEAR(data_emissao) = YEAR(CURRENT_DATE())
    `)
    const faturamentoMes = (faturamentoResult as any[])[0].total

    // Boletos vencidos
    const [vencidosResult] = await pool.execute(`
      SELECT COUNT(*) as total 
      FROM boletos 
      WHERE status = 'pendente' 
      AND data_vencimento < CURRENT_DATE()
    `)
    const boletosVencidos = (vencidosResult as any[])[0].total

    // Produtos com estoque mínimo
    const [estoqueResult] = await pool.execute(`
      SELECT COUNT(*) as total 
      FROM produtos 
      WHERE ativo = 1 
      AND estoque_atual <= estoque_minimo
    `)
    const estoqueMinimo = (estoqueResult as any[])[0].total

    // Clientes ativos
    const [ativosResult] = await pool.execute("SELECT COUNT(*) as total FROM clientes WHERE ativo = 1")
    const clientesAtivos = (ativosResult as any[])[0].total

    return {
      totalClientes,
      totalProdutos,
      totalBoletos,
      totalRecibos,
      faturamentoMes,
      boletosVencidos,
      estoqueMinimo,
      clientesAtivos,
    }
  } catch (error) {
    console.error("Erro ao buscar estatísticas do dashboard:", error)
    throw error
  }
}

export async function getRecentBoletos(limit = 5): Promise<RecentBoleto[]> {
  try {
    const [rows] = await pool.execute(
      `
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
      LIMIT ?
    `,
      [limit],
    )

    return rows as RecentBoleto[]
  } catch (error) {
    console.error("Erro ao buscar boletos recentes:", error)
    throw error
  }
}

export async function getRecentClientes(limit = 5): Promise<RecentCliente[]> {
  try {
    const [rows] = await pool.execute(
      `
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
      LIMIT ?
    `,
      [limit],
    )

    return rows as RecentCliente[]
  } catch (error) {
    console.error("Erro ao buscar clientes recentes:", error)
    throw error
  }
}

export async function getFinancialStats(): Promise<FinancialStats> {
  try {
    // Total de receitas (boletos pagos)
    const [receitasResult] = await pool.execute(`
      SELECT COALESCE(SUM(valor_total), 0) as total 
      FROM boletos 
      WHERE status = 'pago'
    `)
    const totalIncome = (receitasResult as any[])[0].total

    // Total de despesas (se houver tabela de despesas)
    const totalExpenses = 0 // Implementar quando houver tabela de despesas

    // Lucro líquido
    const netProfit = totalIncome - totalExpenses

    // Boletos pendentes
    const [pendentesResult] = await pool.execute(`
      SELECT COUNT(*) as total 
      FROM boletos 
      WHERE status = 'pendente'
    `)
    const pendingBoletos = (pendentesResult as any[])[0].total

    // Boletos pagos
    const [pagosResult] = await pool.execute(`
      SELECT COUNT(*) as total 
      FROM boletos 
      WHERE status = 'pago'
    `)
    const paidBoletos = (pagosResult as any[])[0].total

    // Boletos vencidos
    const [vencidosResult] = await pool.execute(`
      SELECT COUNT(*) as total 
      FROM boletos 
      WHERE status = 'pendente' 
      AND data_vencimento < CURRENT_DATE()
    `)
    const overdueBoletos = (vencidosResult as any[])[0].total

    return {
      totalIncome,
      totalExpenses,
      netProfit,
      pendingBoletos,
      paidBoletos,
      overdueBoletos,
    }
  } catch (error) {
    console.error("Erro ao buscar estatísticas financeiras:", error)
    throw error
  }
}

export { pool }
