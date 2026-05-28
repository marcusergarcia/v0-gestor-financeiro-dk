import { executeQuery } from "./database"

export interface DashboardStats {
  totalClientes: number
  clientesComContrato: number
  totalEmpresas: number
  totalBoletos: number
  valorTotalBoletos: number
  boletosPendentes: number
  boletosVencidos: number
}

export interface RecentBoleto {
  id: number
  numero: string
  cliente_nome: string
  valor: number
  data_vencimento: string
  status: string
}

export interface RecentCliente {
  id: string
  codigo: string
  nome: string
  cidade?: string
  tem_contrato: boolean
  created_at: string
}

export async function getDashboardStats(): Promise<DashboardStats> {
  try {
    // Estatísticas dos clientes
    const clientesStats = await executeQuery(`
      SELECT 
        COUNT(*) as total_clientes,
        SUM(CASE WHEN tem_contrato = 1 THEN 1 ELSE 0 END) as clientes_com_contrato,
        SUM(CASE WHEN cnpj IS NOT NULL AND cnpj != '' THEN 1 ELSE 0 END) as total_empresas
      FROM clientes 
      WHERE status = 'ativo'
    `)

    // Estatísticas dos boletos
    const boletosStats = await executeQuery(`
      SELECT 
        COUNT(*) as total_boletos,
        SUM(valor) as valor_total,
        SUM(CASE WHEN status = 'pendente' THEN 1 ELSE 0 END) as boletos_pendentes,
        SUM(CASE WHEN status = 'pendente' AND data_vencimento < CURDATE() THEN 1 ELSE 0 END) as boletos_vencidos
      FROM boletos
    `)

    const clienteData = clientesStats[0] || {}
    const boletoData = boletosStats[0] || {}

    return {
      totalClientes: Number(clienteData.total_clientes) || 0,
      clientesComContrato: Number(clienteData.clientes_com_contrato) || 0,
      totalEmpresas: Number(clienteData.total_empresas) || 0,
      totalBoletos: Number(boletoData.total_boletos) || 0,
      valorTotalBoletos: Number(boletoData.valor_total) || 0,
      boletosPendentes: Number(boletoData.boletos_pendentes) || 0,
      boletosVencidos: Number(boletoData.boletos_vencidos) || 0,
    }
  } catch (error) {
    console.error("Erro ao buscar estatísticas do dashboard:", error)
    return {
      totalClientes: 0,
      clientesComContrato: 0,
      totalEmpresas: 0,
      totalBoletos: 0,
      valorTotalBoletos: 0,
      boletosPendentes: 0,
      boletosVencidos: 0,
    }
  }
}

export async function getRecentBoletos(limit = 5): Promise<RecentBoleto[]> {
  try {
    const boletos = await executeQuery(
      `
      SELECT 
        b.id,
        b.numero,
        c.nome as cliente_nome,
        b.valor,
        b.data_vencimento,
        b.status
      FROM boletos b
      LEFT JOIN clientes c ON b.cliente_id = c.id
      ORDER BY b.created_at DESC
      LIMIT ?
    `,
      [limit],
    )

    return boletos.map((boleto: any) => ({
      id: boleto.id,
      numero: boleto.numero,
      cliente_nome: boleto.cliente_nome || "Cliente não encontrado",
      valor: Number(boleto.valor),
      data_vencimento: boleto.data_vencimento,
      status: boleto.status,
    }))
  } catch (error) {
    console.error("Erro ao buscar boletos recentes:", error)
    return []
  }
}

export async function getRecentClientes(limit = 5): Promise<RecentCliente[]> {
  try {
    const clientes = await executeQuery(
      `
      SELECT 
        id,
        codigo,
        nome,
        cidade,
        tem_contrato,
        created_at
      FROM clientes
      WHERE status = 'ativo'
      ORDER BY created_at DESC
      LIMIT ?
    `,
      [limit],
    )

    return clientes.map((cliente: any) => ({
      id: cliente.id,
      codigo: cliente.codigo,
      nome: cliente.nome,
      cidade: cliente.cidade,
      tem_contrato: Boolean(cliente.tem_contrato),
      created_at: cliente.created_at,
    }))
  } catch (error) {
    console.error("Erro ao buscar clientes recentes:", error)
    return []
  }
}
