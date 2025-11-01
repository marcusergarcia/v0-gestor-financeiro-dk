import { pool } from "./db"
import type { Orcamento, OrcamentoItem, Produto, Cliente } from "@/types/orcamento"

// Atualizar a função getOrcamentos para incluir dados do cliente:

export async function getOrcamentos(limit = 50): Promise<Orcamento[]> {
  const [rows] = await pool.execute(
    `
    SELECT 
      o.*,
      c.nome as cliente_nome,
      c.codigo as cliente_codigo,
      c.cnpj as cliente_cnpj,
      c.cpf as cliente_cpf,
      c.email as cliente_email,
      c.telefone as cliente_telefone,
      c.cidade as cliente_cidade,
      c.estado as cliente_estado
    FROM orcamento o
    LEFT JOIN clientes c ON o.cliente_id = c.id
    ORDER BY o.created_at DESC 
    LIMIT ?
  `,
    [limit],
  )

  return (rows as any[]).map((row) => ({
    ...row,
    cliente: row.cliente_nome
      ? {
          id: row.cliente_id,
          nome: row.cliente_nome,
          codigo: row.cliente_codigo,
          cnpj: row.cliente_cnpj,
          cpf: row.cliente_cpf,
          email: row.cliente_email,
          telefone: row.cliente_telefone,
          cidade: row.cliente_cidade,
          estado: row.cliente_estado,
        }
      : null,
  }))
}

export async function getOrcamento(id: number): Promise<Orcamento | null> {
  const [rows] = await pool.execute(
    `
    SELECT o.*, c.nome as cliente_nome 
    FROM orcamento o
    LEFT JOIN clientes c ON o.cliente_id = c.id
    WHERE o.id = ?
  `,
    [id],
  )

  const orcamentos = rows as Orcamento[]
  return orcamentos[0] || null
}

export async function createOrcamento(orcamento: Omit<Orcamento, "id" | "created_at" | "updated_at">): Promise<number> {
  const [result] = await pool.execute(
    `
    INSERT INTO orcamento (cliente_id, numero, data_orcamento, data_validade, status, observacoes, valor_total, desconto)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `,
    [
      orcamento.cliente_id || null,
      orcamento.numero,
      orcamento.data_orcamento,
      orcamento.data_validade,
      orcamento.status,
      orcamento.observacoes || null,
      orcamento.valor_total,
      orcamento.desconto || 0,
    ],
  )

  return (result as any).insertId
}

export async function getOrcamentoItens(orcamentoId: number): Promise<OrcamentoItem[]> {
  const [rows] = await pool.execute(
    `
    SELECT oi.*, p.nome as produto_nome, p.preco as produto_preco
    FROM orcamento_itens oi
    JOIN produtos p ON oi.produto_id = p.id
    WHERE oi.orcamento_id = ?
    ORDER BY oi.id
  `,
    [orcamentoId],
  )

  return (rows as any[]).map((row) => ({
    id: row.id,
    orcamento_id: row.orcamento_id,
    produto_id: row.produto_id,
    quantidade: row.quantidade,
    valor_unitario: Number.parseFloat(row.valor_unitario),
    valor_total: Number.parseFloat(row.valor_total),
    descricao: row.descricao,
    produto: {
      id: row.produto_id,
      nome: row.produto_nome,
      preco: Number.parseFloat(row.produto_preco),
    },
  }))
}

export async function addOrcamentoItem(item: Omit<OrcamentoItem, "id">): Promise<number> {
  const [result] = await pool.execute(
    `
    INSERT INTO orcamento_itens (orcamento_id, produto_id, quantidade, valor_unitario, valor_total, descricao)
    VALUES (?, ?, ?, ?, ?, ?)
  `,
    [
      item.orcamento_id,
      item.produto_id,
      item.quantidade,
      item.valor_unitario,
      item.valor_total,
      item.descricao || null,
    ],
  )

  return (result as any).insertId
}

export async function updateOrcamentoTotal(orcamentoId: number): Promise<void> {
  await pool.execute(
    `
    UPDATE orcamento 
    SET valor_total = (
      SELECT COALESCE(SUM(valor_total), 0) 
      FROM orcamento_itens 
      WHERE orcamento_id = ?
    )
    WHERE id = ?
  `,
    [orcamentoId, orcamentoId],
  )
}

export async function getProdutos(): Promise<Produto[]> {
  const [rows] = await pool.execute(`
    SELECT * FROM produtos 
    WHERE ativo = 1 
    ORDER BY nome
  `)

  return (rows as any[]).map((row) => ({
    id: row.id,
    nome: row.nome,
    descricao: row.descricao,
    preco: Number.parseFloat(row.preco),
    categoria_id: row.categoria_id,
    ativo: row.ativo,
  }))
}

export async function getClientesForOrcamento(): Promise<Cliente[]> {
  try {
    const response = await fetch("/api/clientes?limit=1000")
    const result = await response.json()

    if (result.success) {
      return result.data || []
    }
    return []
  } catch (error) {
    console.error("Erro ao buscar clientes:", error)
    return []
  }
}
