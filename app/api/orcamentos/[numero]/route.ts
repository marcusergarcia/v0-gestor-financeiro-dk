import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET(request: NextRequest, { params }: { params: { numero: string } }) {
  try {
    const { numero } = params

    const orcamentoQuery = `
      SELECT 
        o.*,
        c.nome as cliente_nome,
        c.codigo as cliente_codigo,
        c.cnpj as cliente_cnpj,
        c.cpf as cliente_cpf,
        c.endereco as cliente_endereco,
        c.bairro as cliente_bairro,
        c.cidade as cliente_cidade,
        c.estado as cliente_estado,
        c.cep as cliente_cep,
        c.email as cliente_email,
        c.telefone as cliente_telefone,
        c.distancia_km,
        c.nome_adm,
        c.contato_adm,
        c.telefone_adm,
        c.email_adm
      FROM orcamentos o
      LEFT JOIN clientes c ON o.cliente_id = c.id
      WHERE o.numero = ?
    `

    const orcamentos = await query(orcamentoQuery, [numero])

    if (!orcamentos || orcamentos.length === 0) {
      return NextResponse.json({ success: false, message: "Orçamento não encontrado" }, { status: 404 })
    }

    const orcamento = orcamentos[0]

    const itensQuery = `
      SELECT 
        oi.*,
        p.codigo as produto_codigo,
        p.descricao as produto_descricao,
        p.unidade as produto_unidade,
        p.ncm as produto_ncm
      FROM orcamentos_itens oi
      LEFT JOIN produtos p ON oi.produto_id = p.id
      WHERE oi.orcamento_numero = ?
      ORDER BY oi.created_at
    `

    const itens = await query(itensQuery, [numero])

    return NextResponse.json({
      success: true,
      data: {
        ...orcamento,
        itens: itens || [],
      },
    })
  } catch (error) {
    console.error("Erro ao buscar orçamento:", error)
    return NextResponse.json({ success: false, message: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { numero: string } }) {
  try {
    const { numero } = params
    const data = await request.json()

    // Formatar data para MySQL (YYYY-MM-DD)
    const formatDateForMySQL = (dateString: string | null | undefined): string | null => {
      if (!dateString) return null

      try {
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
          return dateString
        }

        const dateOnly = dateString.split("T")[0]
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateOnly)) {
          return dateOnly
        }

        return null
      } catch {
        return null
      }
    }

    const dataOrcamentoFormatada = formatDateForMySQL(data.data_orcamento)
    const dataInicioFormatada = formatDateForMySQL(data.data_inicio)

    // Atualizar orçamento
    const updateQuery = `
      UPDATE orcamentos SET
        cliente_id = ?,
        tipo_servico = ?,
        detalhes_servico = ?,
        valor_material = ?,
        valor_mao_obra = ?,
        desconto = ?,
        valor_total = ?,
        validade = ?,
        observacoes = ?,
        situacao = ?,
        data_orcamento = ?,
        data_inicio = ?,
        distancia_km = ?,
        valor_boleto = ?,
        prazo_dias = ?,
        juros_am = ?,
        imposto_servico = ?,
        imposto_material = ?,
        desconto_mdo_percent = ?,
        desconto_mdo_valor = ?,
        parcelamento_mdo = ?,
        parcelamento_material = ?,
        material_a_vista = ?,
        custo_deslocamento = ?,
        valor_juros = ?,
        taxa_boleto_mdo = ?,
        taxa_boleto_material = ?,
        valor_imposto_servico = ?,
        valor_imposto_material = ?,
        subtotal_mdo = ?,
        subtotal_material = ?,
        updated_at = NOW()
      WHERE numero = ?
    `

    await query(updateQuery, [
      data.cliente_id,
      data.tipo_servico,
      data.detalhes_servico || null,
      data.valor_material || 0,
      data.valor_mao_obra || 0,
      data.desconto || 0,
      data.valor_total || 0,
      data.validade || 30,
      data.observacoes || null,
      data.situacao || "pendente",
      dataOrcamentoFormatada,
      dataInicioFormatada,
      data.distancia_km || 0,
      data.valor_boleto || 0,
      data.prazo_dias || 0,
      data.juros_am || 0,
      data.imposto_servico || 0,
      data.imposto_material || 0,
      data.desconto_mdo_percent || 0,
      data.desconto_mdo_valor || 0,
      data.parcelamento_mdo || 1,
      data.parcelamento_material || 1,
      data.material_a_vista ? 1 : 0,
      data.custo_deslocamento || 0,
      data.valor_juros || 0,
      data.taxa_boleto_mdo || 0,
      data.taxa_boleto_material || 0,
      data.valor_imposto_servico || 0,
      data.valor_imposto_material || 0,
      data.subtotal_mdo || 0,
      data.subtotal_material || 0,
      numero,
    ])

    // Deletar itens existentes
    await query("DELETE FROM orcamentos_itens WHERE orcamento_numero = ?", [numero])

    // Inserir novos itens
    if (data.itens && data.itens.length > 0) {
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

      const { generateUUID } = await import("@/lib/utils")

      for (const item of data.itens) {
        const itemId = item.id || generateUUID()
        await query(insertItensQuery, [
          itemId,
          numero,
          item.produto_id,
          item.quantidade,
          item.valor_unitario,
          item.valor_mao_obra || 0,
          item.valor_total,
          item.marca_nome || null,
          item.produto_ncm || null,
          item.descricao_personalizada || null,
          item.valor_unitario_ajustado || null,
          item.valor_total_ajustado || null,
        ])
      }
    }

    return NextResponse.json({
      success: true,
      message: "Orçamento atualizado com sucesso",
      data: { numero },
    })
  } catch (error) {
    console.error("Erro ao atualizar orçamento:", error)
    return NextResponse.json({ success: false, message: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { numero: string } }) {
  try {
    const { numero } = params
    const data = await request.json()

    if (!data.situacao) {
      return NextResponse.json({ success: false, message: "Campo 'situacao' é obrigatório" }, { status: 400 })
    }

    await query("UPDATE orcamentos SET situacao = ?, updated_at = NOW() WHERE numero = ?", [data.situacao, numero])

    return NextResponse.json({
      success: true,
      message: "Situação atualizada com sucesso",
      data: { numero, situacao: data.situacao },
    })
  } catch (error) {
    console.error("Erro ao atualizar situação:", error)
    return NextResponse.json({ success: false, message: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { numero: string } }) {
  try {
    const { numero } = params

    // Deletar itens primeiro (por causa da foreign key)
    await query("DELETE FROM orcamentos_itens WHERE orcamento_numero = ?", [numero])

    // Deletar orçamento
    await query("DELETE FROM orcamentos WHERE numero = ?", [numero])

    return NextResponse.json({
      success: true,
      message: "Orçamento excluído com sucesso",
    })
  } catch (error) {
    console.error("Erro ao excluir orçamento:", error)
    return NextResponse.json({ success: false, message: "Erro interno do servidor" }, { status: 500 })
  }
}
