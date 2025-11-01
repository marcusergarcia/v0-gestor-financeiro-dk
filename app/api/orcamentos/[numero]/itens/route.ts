import { type NextRequest, NextResponse } from "next/server"
import { pool } from "@/lib/database"
import { generateUUID } from "@/lib/utils"

export async function GET(request: NextRequest, { params }: { params: Promise<{ numero: string }> }) {
  try {
    const { numero } = await params

    const [rows] = await pool.execute(
      `
      SELECT 
        oi.*,
        p.descricao as produto_descricao,
        p.codigo as produto_codigo,
        p.unidade as produto_unidade,
        p.valor_unitario as produto_valor_unitario,
        p.valor_mao_obra as produto_valor_mao_obra,
        p.valor_custo as produto_valor_custo,
        p.margem_lucro as produto_margem_lucro,
        p.estoque as produto_estoque,
        p.estoque_minimo as produto_estoque_minimo,
        p.observacoes as produto_observacoes,
        p.tipo as categoria_nome,
        p.marca as produto_marca,
        COALESCE(oi.marca_nome, p.marca) as marca_nome
      FROM orcamentos_itens oi
      LEFT JOIN produtos p ON oi.produto_id = p.id
      WHERE oi.orcamento_numero = ?
      ORDER BY oi.created_at
      `,
      [numero],
    )

    return NextResponse.json({
      success: true,
      data: Array.isArray(rows) ? rows : [],
    })
  } catch (error) {
    console.error("Erro ao buscar itens do orçamento:", error)
    return NextResponse.json({ success: false, message: "Erro ao buscar itens" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ numero: string }> }) {
  try {
    const { numero } = await params
    const data = await request.json()

    // Verificar se o orçamento existe
    const [orcamentoRows] = await pool.execute("SELECT id FROM orcamentos WHERE numero = ?", [numero])

    if (!Array.isArray(orcamentoRows) || orcamentoRows.length === 0) {
      return NextResponse.json({ success: false, message: "Orçamento não encontrado" }, { status: 404 })
    }

    // Buscar informações do produto incluindo a marca
    const [produtoRows] = await pool.execute(
      `
      SELECT p.*
      FROM produtos p
      WHERE p.id = ?
      `,
      [data.produto_id],
    )

    if (!Array.isArray(produtoRows) || produtoRows.length === 0) {
      return NextResponse.json({ success: false, message: "Produto não encontrado" }, { status: 404 })
    }

    const produto = produtoRows[0] as any
    const itemId = generateUUID()

    // Inserir item com a marca do produto
    await pool.execute(
      `
      INSERT INTO orcamentos_itens (
        id, orcamento_numero, produto_id, quantidade,
        valor_unitario, valor_mao_obra, valor_total, marca_nome
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        itemId,
        numero,
        data.produto_id,
        data.quantidade,
        data.valor_unitario || produto.valor_unitario,
        data.valor_mao_obra || produto.valor_mao_obra,
        data.valor_total ||
          ((data.valor_unitario || produto.valor_unitario) + (data.valor_mao_obra || produto.valor_mao_obra)) *
            data.quantidade,
        produto.marca || null,
      ],
    )

    // Recalcular total do orçamento (material + mão de obra)
    const [totalRows] = await pool.execute(
      `SELECT 
        SUM(quantidade * valor_unitario) as total_material,
        SUM(quantidade * valor_mao_obra) as total_mao_obra
       FROM orcamentos_itens 
       WHERE orcamento_numero = ?`,
      [numero],
    )

    const totals =
      Array.isArray(totalRows) && totalRows.length > 0
        ? (totalRows[0] as any)
        : { total_material: 0, total_mao_obra: 0 }
    const valorMaterial = totals.total_material || 0
    const valorMaoObra = totals.total_mao_obra || 0
    const valorTotal = valorMaterial + valorMaoObra

    await pool.execute(
      "UPDATE orcamentos SET valor_material = ?, valor_mao_obra = ?, valor_total = ? WHERE numero = ?",
      [valorMaterial, valorMaoObra, valorTotal, numero],
    )

    return NextResponse.json({
      success: true,
      message: "Item adicionado com sucesso",
      data: { id: itemId },
    })
  } catch (error) {
    console.error("Erro ao adicionar item:", error)
    return NextResponse.json({ success: false, message: "Erro ao adicionar item" }, { status: 500 })
  }
}
