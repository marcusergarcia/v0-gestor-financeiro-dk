import { pool } from "@/lib/db"

export interface Produto {
  id: number
  codigo: string
  descricao: string
  valor_unitario: number
  estoque: number
  categoria_id: number
  marca_id: number
  categoria_nome?: string
  marca_nome?: string
  ativo: boolean
  created_at: string
}

export async function getProdutos(limit = 100): Promise<Produto[]> {
  try {
    const [rows] = await pool.execute(
      `
      SELECT 
        p.id,
        p.codigo,
        p.descricao,
        p.valor_unitario,
        p.estoque,
        p.categoria_id,
        p.marca_id,
        c.nome as categoria_nome,
        m.nome as marca_nome,
        p.ativo,
        p.created_at
      FROM produtos p
      LEFT JOIN tipos_produtos c ON p.categoria_id = c.id
      LEFT JOIN marcas m ON p.marca_id = m.id
      WHERE p.ativo = 1
      ORDER BY p.descricao 
      LIMIT ?
    `,
      [limit],
    )

    return (rows as any[]).map((row) => ({
      ...row,
      valor_unitario: Number.parseFloat(row.valor_unitario),
      ativo: Boolean(row.ativo),
    }))
  } catch (error) {
    console.error("Erro ao buscar produtos:", error)
    throw error
  }
}

export async function getProdutoById(id: number): Promise<Produto | null> {
  try {
    const [rows] = await pool.execute(
      `
      SELECT 
        p.id,
        p.codigo,
        p.descricao,
        p.valor_unitario,
        p.estoque,
        p.categoria_id,
        p.marca_id,
        c.nome as categoria_nome,
        m.nome as marca_nome,
        p.ativo,
        p.created_at
      FROM produtos p
      LEFT JOIN tipos_produtos c ON p.categoria_id = c.id
      LEFT JOIN marcas m ON p.marca_id = m.id
      WHERE p.id = ?
    `,
      [id],
    )

    const produto = (rows as any[])[0]
    if (!produto) return null

    return {
      ...produto,
      valor_unitario: Number.parseFloat(produto.valor_unitario),
      ativo: Boolean(produto.ativo),
    }
  } catch (error) {
    console.error("Erro ao buscar produto:", error)
    throw error
  }
}

export async function createProduto(produto: Omit<Produto, "id" | "created_at">): Promise<Produto> {
  try {
    const [result] = await pool.execute(
      `
      INSERT INTO produtos (
        codigo, descricao, valor_unitario, estoque, 
        categoria_id, marca_id, ativo, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `,
      [
        produto.codigo,
        produto.descricao,
        produto.valor_unitario,
        produto.estoque,
        produto.categoria_id,
        produto.marca_id,
        produto.ativo ? 1 : 0,
      ],
    )

    const insertId = (result as any).insertId
    const novoProduto = await getProdutoById(insertId)

    if (!novoProduto) {
      throw new Error("Erro ao criar produto")
    }

    return novoProduto
  } catch (error) {
    console.error("Erro ao criar produto:", error)
    throw error
  }
}

export async function updateProduto(id: number, produto: Partial<Produto>): Promise<Produto> {
  try {
    await pool.execute(
      `
      UPDATE produtos 
      SET codigo = ?, descricao = ?, valor_unitario = ?, estoque = ?, 
          categoria_id = ?, marca_id = ?, ativo = ?, updated_at = NOW()
      WHERE id = ?
    `,
      [
        produto.codigo,
        produto.descricao,
        produto.valor_unitario,
        produto.estoque,
        produto.categoria_id,
        produto.marca_id,
        produto.ativo ? 1 : 0,
        id,
      ],
    )

    const produtoAtualizado = await getProdutoById(id)

    if (!produtoAtualizado) {
      throw new Error("Erro ao atualizar produto")
    }

    return produtoAtualizado
  } catch (error) {
    console.error("Erro ao atualizar produto:", error)
    throw error
  }
}

export async function deleteProduto(id: number): Promise<void> {
  try {
    await pool.execute("UPDATE produtos SET ativo = 0 WHERE id = ?", [id])
  } catch (error) {
    console.error("Erro ao excluir produto:", error)
    throw error
  }
}
