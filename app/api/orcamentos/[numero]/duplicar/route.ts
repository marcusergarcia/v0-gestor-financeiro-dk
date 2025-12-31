import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { generateUUID } from "@/lib/utils"

export async function POST(request: NextRequest, { params }: { params: Promise<{ numero: string }> }) {
  try {
    const { numero } = await params

    // Buscar orçamento original
    const orcamentoQuery = `
      SELECT * FROM orcamentos WHERE numero = ?
    `
    const orcamentos = await query(orcamentoQuery, [numero])

    if (!orcamentos || orcamentos.length === 0) {
      return NextResponse.json({ success: false, message: "Orçamento não encontrado" }, { status: 404 })
    }

    const orcamentoOriginal = orcamentos[0]

    // Gerar novo número do orçamento
    const dataAtual = new Date()
    const ano = dataAtual.getFullYear()
    const mes = String(dataAtual.getMonth() + 1).padStart(2, "0")
    const dia = String(dataAtual.getDate()).padStart(2, "0")

    const ultimoOrcamentoQuery = `
      SELECT numero FROM orcamentos 
      WHERE numero LIKE '${ano}${mes}${dia}%' 
      ORDER BY numero DESC 
      LIMIT 1
    `

    const ultimosOrcamentos = await query(ultimoOrcamentoQuery)
    let sequencial = 1

    if (ultimosOrcamentos && ultimosOrcamentos.length > 0) {
      const ultimoNumero = ultimosOrcamentos[0].numero
      sequencial = Number.parseInt(ultimoNumero.slice(-3)) + 1
    }

    const novoNumero = `${ano}${mes}${dia}${String(sequencial).padStart(3, "0")}`

    // Criar novo orçamento duplicado
    const insertQuery = `
      INSERT INTO orcamentos (
        id,
        numero,
        cliente_id,
        tipo_servico,
        detalhes_servico,
        valor_material,
        valor_mao_obra,
        desconto,
        valor_total,
        validade,
        observacoes,
        situacao,
        data_orcamento,
        data_inicio,
        distancia_km,
        valor_boleto,
        prazo_dias,
        juros_am,
        imposto_servico,
        imposto_material,
        desconto_mdo_percent,
        desconto_mdo_valor,
        parcelamento_mdo,
        parcelamento_material,
        material_a_vista,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `

    const novoOrcamentoId = generateUUID()

    await query(insertQuery, [
      novoOrcamentoId,
      novoNumero,
      orcamentoOriginal.cliente_id,
      orcamentoOriginal.tipo_servico,
      orcamentoOriginal.detalhes_servico,
      orcamentoOriginal.valor_material,
      orcamentoOriginal.valor_mao_obra,
      orcamentoOriginal.desconto,
      orcamentoOriginal.valor_total,
      orcamentoOriginal.validade,
      orcamentoOriginal.observacoes,
      "pendente", // Novo orçamento sempre começa como pendente
      orcamentoOriginal.data_inicio,
      orcamentoOriginal.distancia_km,
      orcamentoOriginal.valor_boleto,
      orcamentoOriginal.prazo_dias,
      orcamentoOriginal.juros_am,
      orcamentoOriginal.imposto_servico,
      orcamentoOriginal.imposto_material,
      orcamentoOriginal.desconto_mdo_percent,
      orcamentoOriginal.desconto_mdo_valor,
      orcamentoOriginal.parcelamento_mdo,
      orcamentoOriginal.parcelamento_material,
      orcamentoOriginal.material_a_vista,
    ])

    // Buscar itens do orçamento original
    const itensQuery = `
      SELECT * FROM orcamentos_itens WHERE orcamento_numero = ?
    `
    const itens = await query(itensQuery, [numero])

    // Duplicar itens
    if (itens && itens.length > 0) {
      const insertItensQuery = `
        INSERT INTO orcamentos_itens (
          id,
          orcamento_numero,
          produto_id,
          quantidade,
          valor_unitario,
          valor_mao_obra,
          valor_total,
          marca_nome,
          produto_ncm,
          descricao_personalizada,
          valor_unitario_ajustado,
          valor_total_ajustado,
          created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
      `

      for (const item of itens) {
        const itemId = generateUUID()
        await query(insertItensQuery, [
          itemId,
          novoNumero, // Usar o novo número do orçamento
          item.produto_id,
          item.quantidade,
          item.valor_unitario,
          item.valor_mao_obra,
          item.valor_total,
          item.marca_nome,
          item.produto_ncm,
          item.descricao_personalizada,
          item.valor_unitario_ajustado,
          item.valor_total_ajustado,
        ])
      }
    }

    return NextResponse.json({
      success: true,
      message: "Orçamento duplicado com sucesso",
      data: { id: novoOrcamentoId, numero: novoNumero },
    })
  } catch (error) {
    console.error("Erro ao duplicar orçamento:", error)
    return NextResponse.json({ success: false, message: "Erro interno do servidor" }, { status: 500 })
  }
}
