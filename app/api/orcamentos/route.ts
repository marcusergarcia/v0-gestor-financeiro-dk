import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { generateUUID } from "@/lib/utils"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const situacao = searchParams.get("situacao")

    let orcamentosQuery = `
      SELECT 
        o.id,
        o.numero,
        o.cliente_id,
        o.tipo_servico,
        o.detalhes_servico,
        o.valor_material,
        o.valor_mao_obra,
        o.desconto,
        o.valor_total,
        o.validade,
        o.observacoes,
        o.situacao,
        DATE_FORMAT(o.data_orcamento, '%Y-%m-%d') as data_orcamento,
        DATE_FORMAT(o.data_inicio, '%Y-%m-%d') as data_inicio,
        DATE_FORMAT(o.created_at, '%Y-%m-%d %H:%i:%s') as created_at,
        DATE_FORMAT(o.updated_at, '%Y-%m-%d %H:%i:%s') as updated_at,
        o.distancia_km,
        o.valor_boleto,
        o.prazo_dias,
        o.juros_am,
        o.imposto_servico,
        o.imposto_material,
        o.desconto_mdo_percent,
        o.desconto_mdo_valor,
        o.parcelamento_mdo,
        o.parcelamento_material,
        c.nome as cliente_nome,
        c.codigo as cliente_codigo,
        c.cnpj as cliente_cnpj,
        c.cpf as cliente_cpf,
        c.tem_contrato
      FROM orcamentos o
      LEFT JOIN clientes c ON o.cliente_id = c.id
    `

    const params: any[] = []

    if (situacao) {
      orcamentosQuery += " WHERE o.situacao = ?"
      params.push(situacao)
    }

    orcamentosQuery += " ORDER BY o.created_at DESC"

    const orcamentos = await query(orcamentosQuery, params)

    return NextResponse.json({
      success: true,
      data: orcamentos || [],
    })
  } catch (error) {
    console.error("Erro ao buscar orçamentos:", error)
    return NextResponse.json({ success: false, message: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()

    // Gerar número do orçamento
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

    const numero = `${ano}${mes}${dia}${String(sequencial).padStart(3, "0")}`

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

    // Inserir orçamento - AJUSTADO para corresponder exatamente à estrutura da tabela
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
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `

    const orcamentoId = generateUUID()

    await query(insertQuery, [
      orcamentoId,
      numero,
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
      data.material_a_vista ? 1 : 0, // Adicionado material_a_vista
    ])

    // Inserir itens
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

      for (const item of data.itens) {
        const itemId = generateUUID()
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
      message: "Orçamento criado com sucesso",
      data: { id: orcamentoId, numero },
    })
  } catch (error) {
    console.error("Erro ao criar orçamento:", error)
    return NextResponse.json({ success: false, message: "Erro interno do servidor" }, { status: 500 })
  }
}
