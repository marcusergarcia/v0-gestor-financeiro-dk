import { type NextRequest, NextResponse } from "next/server"
import { pool } from "@/lib/database"

export async function GET(request: NextRequest, { params }: { params: Promise<{ numero: string; id: string }> }) {
  try {
    const { numero, id } = await params

    const [rows] = await pool.execute(
      `
      SELECT 
        oi.*,
        p.descricao as produto_descricao,
        p.codigo as produto_codigo,
        p.unidade as produto_unidade,
        COALESCE(oi.marca_nome, p.marca) as marca_nome
      FROM orcamentos_itens oi
      LEFT JOIN produtos p ON oi.produto_id = p.id
      WHERE oi.orcamento_numero = ? AND oi.id = ?
      `,
      [numero, id],
    )

    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ success: false, message: "Item não encontrado" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: rows[0],
    })
  } catch (error) {
    console.error("Erro ao buscar item:", error)
    return NextResponse.json({ success: false, message: "Erro ao buscar item" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ numero: string; id: string }> }) {
  try {
    const { numero, id } = await params
    const data = await request.json()

    // Verificar se o item existe e buscar a marca atual
    const [existingRows] = await pool.execute(
      `
      SELECT oi.*, COALESCE(oi.marca_nome, p.marca) as marca_atual
      FROM orcamentos_itens oi
      LEFT JOIN produtos p ON oi.produto_id = p.id
      WHERE oi.orcamento_numero = ? AND oi.id = ?
      `,
      [numero, id],
    )

    if (!Array.isArray(existingRows) || existingRows.length === 0) {
      return NextResponse.json({ success: false, message: "Item não encontrado" }, { status: 404 })
    }

    const itemExistente = existingRows[0] as any

    // Calcular valor total
    const quantidade = Number.parseFloat(data.quantidade || 0)
    const valorUnitario = Number.parseFloat(data.valor_unitario || 0)
    const valorMaoObra = Number.parseFloat(data.valor_mao_obra || 0)
    const valorTotal = quantidade * (valorUnitario + valorMaoObra)

    // Preservar a marca existente se não foi fornecida uma nova
    const marcaNome = data.marca_nome !== undefined ? data.marca_nome : itemExistente.marca_atual

    // Atualizar item preservando a marca
    await pool.execute(
      `
      UPDATE orcamentos_itens SET
        quantidade = ?,
        valor_unitario = ?,
        valor_mao_obra = ?,
        valor_total = ?,
        marca_nome = ?
      WHERE orcamento_numero = ? AND id = ?
      `,
      [quantidade, valorUnitario, valorMaoObra, valorTotal, marcaNome, numero, id],
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
    const valorMaoObraTotal = totals.total_mao_obra || 0
    const novoTotal = valorMaterial + valorMaoObraTotal

    await pool.execute(
      "UPDATE orcamentos SET valor_material = ?, valor_mao_obra = ?, valor_total = ? WHERE numero = ?",
      [valorMaterial, valorMaoObraTotal, novoTotal, numero],
    )

    return NextResponse.json({
      success: true,
      message: "Item atualizado com sucesso",
    })
  } catch (error) {
    console.error("Erro ao atualizar item:", error)
    return NextResponse.json({ success: false, message: "Erro ao atualizar item" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ numero: string; id: string }> }) {
  try {
    const { numero, id } = await params

    // Verificar se o item existe
    const [existingRows] = await pool.execute("SELECT id FROM orcamentos_itens WHERE orcamento_numero = ? AND id = ?", [
      numero,
      id,
    ])

    if (!Array.isArray(existingRows) || existingRows.length === 0) {
      return NextResponse.json({ success: false, message: "Item não encontrado" }, { status: 404 })
    }

    // Deletar item
    await pool.execute("DELETE FROM orcamentos_itens WHERE orcamento_numero = ? AND id = ?", [numero, id])

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
    const valorMaoObraTotal = totals.total_mao_obra || 0
    const novoTotal = valorMaterial + valorMaoObraTotal

    await pool.execute(
      "UPDATE orcamentos SET valor_material = ?, valor_mao_obra = ?, valor_total = ? WHERE numero = ?",
      [valorMaterial, valorMaoObraTotal, novoTotal, numero],
    )

    return NextResponse.json({
      success: true,
      message: "Item excluído com sucesso",
    })
  } catch (error) {
    console.error("Erro ao excluir item:", error)
    return NextResponse.json({ success: false, message: "Erro ao excluir item" }, { status: 500 })
  }
}
