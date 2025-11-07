import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const situacao = searchParams.get("situacao") || "todas"
    const limit = Number.parseInt(searchParams.get("limit") || "50")
    const offset = Number.parseInt(searchParams.get("offset") || "0")

    let whereClause = "WHERE 1=1"
    const queryParams: any[] = []

    if (situacao !== "todas") {
      whereClause += " AND os.situacao = ?"
      queryParams.push(situacao)
    }

    const ordensQuery = `
      SELECT 
        os.id,
        os.numero,
        os.cliente_id,
        c.nome as cliente_nome,
        c.codigo as cliente_codigo,
        os.contrato_id,
        os.contrato_numero,
        os.tecnico_name,
        os.tecnico_email,
        os.solicitado_por,
        os.data_atual,
        os.data_agendamento,
        os.periodo_agendamento,
        os.data_execucao,
        os.horario_entrada,
        os.horario_saida,
        os.tipo_servico,
        os.relatorio_visita,
        os.descricao_defeito,
        os.necessidades_cliente,
        os.servico_realizado,
        os.observacoes,
        os.responsavel,
        os.nome_responsavel,
        COALESCE(os.situacao, 'rascunho') as situacao,
        os.created_at,
        os.updated_at,
        (SELECT COUNT(*) FROM ordens_servico_itens WHERE ordem_servico_id = os.id) as total_equipamentos,
        (SELECT COUNT(*) FROM ordens_servico_fotos WHERE ordem_servico_id = os.id) as total_fotos,
        (SELECT COUNT(*) FROM ordens_servico_assinaturas WHERE ordem_servico_id = os.id) as total_assinaturas
      FROM ordens_servico os
      LEFT JOIN clientes c ON os.cliente_id = c.id
      ${whereClause}
      ORDER BY os.updated_at DESC
      LIMIT ? OFFSET ?
    `

    queryParams.push(limit, offset)

    const countQuery = `
      SELECT COUNT(*) as total
      FROM ordens_servico os
      ${whereClause}
    `

    const [ordensResult, countResult] = await Promise.all([
      query(ordensQuery, queryParams),
      query(countQuery, queryParams.slice(0, -2)), // Remove limit e offset do count
    ])

    const total = (countResult as any[])[0]?.total || 0

    return NextResponse.json({
      success: true,
      data: ordensResult,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    })
  } catch (error) {
    console.error("Erro ao buscar ordens de serviço:", error)
    return NextResponse.json({ success: false, error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      numero,
      cliente_id,
      contrato_id,
      contrato_numero,
      tecnico_name,
      tecnico_email,
      solicitado_por,
      data_atual,
      data_agendamento,
      periodo_agendamento,
      data_execucao,
      horario_entrada,
      horario_saida,
      tipo_servico,
      relatorio_visita,
      descricao_defeito,
      necessidades_cliente,
      servico_realizado,
      observacoes,
      responsavel,
      nome_responsavel,
      situacao = "rascunho",
      equipamentos = [],
      fotos = [],
      assinaturas = [],
    } = body

    console.log("[v0] Dados recebidos para criar ordem:", {
      numero,
      cliente_id,
      tecnico_name,
      data_atual,
      tipo_servico,
      situacao,
      equipamentos_count: equipamentos.length,
    })

    // Validações básicas
    if (!numero || !cliente_id || !tecnico_name || !tipo_servico) {
      console.log("[v0] Validação falhou: campos obrigatórios faltando")
      return NextResponse.json(
        { success: false, error: "Campos obrigatórios: número, cliente, técnico e tipo de serviço" },
        { status: 400 },
      )
    }

    if (!data_atual && !data_agendamento) {
      console.log("[v0] Validação falhou: nenhuma data informada")
      return NextResponse.json(
        { success: false, error: "É necessário informar pelo menos uma data (atual ou agendamento)" },
        { status: 400 },
      )
    }

    // Verificar se o número já existe
    const existingOrder = await query("SELECT id FROM ordens_servico WHERE numero = ?", [numero])

    if ((existingOrder as any[]).length > 0) {
      console.log("[v0] Validação falhou: número já existe")
      return NextResponse.json(
        { success: false, error: "Já existe uma ordem de serviço com este número" },
        { status: 400 },
      )
    }

    const insertResult = await query(
      `INSERT INTO ordens_servico 
       (numero, cliente_id, contrato_id, contrato_numero, tecnico_name, tecnico_email, 
        solicitado_por, data_atual, data_agendamento, periodo_agendamento, data_execucao, 
        horario_entrada, horario_saida, tipo_servico, relatorio_visita, descricao_defeito, 
        necessidades_cliente, servico_realizado, observacoes, responsavel, 
        nome_responsavel, situacao) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        numero,
        cliente_id,
        contrato_id || null,
        contrato_numero || null,
        tecnico_name,
        tecnico_email || null,
        solicitado_por || null,
        data_atual || null,
        data_agendamento || null,
        periodo_agendamento || null,
        data_execucao || null,
        horario_entrada || null,
        horario_saida || null,
        tipo_servico,
        relatorio_visita || null,
        descricao_defeito || null,
        necessidades_cliente || null,
        servico_realizado || null,
        observacoes || null,
        responsavel || null,
        nome_responsavel || null,
        situacao,
      ],
    )

    const ordemId = (insertResult as any).insertId
    console.log("[v0] Ordem criada com ID:", ordemId)

    // Inserir equipamentos
    if (equipamentos && equipamentos.length > 0) {
      console.log("[v0] Inserindo", equipamentos.length, "equipamentos")
      for (const equipamento of equipamentos) {
        await query(
          `INSERT INTO ordens_servico_itens 
           (ordem_servico_id, equipamento_id, equipamento_nome, quantidade, observacoes, situacao) 
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            ordemId,
            equipamento.equipamento_id,
            equipamento.equipamento_nome,
            equipamento.quantidade || 1,
            equipamento.observacoes || null,
            equipamento.situacao || "pendente",
          ],
        )
      }
      console.log("[v0] Equipamentos inseridos com sucesso")
    }

    // Inserir fotos
    if (fotos && fotos.length > 0) {
      console.log("[v0] Inserindo", fotos.length, "fotos")
      for (const foto of fotos) {
        await query(
          `INSERT INTO ordens_servico_fotos 
           (ordem_servico_id, nome_arquivo, caminho_arquivo, tipo_foto, descricao) 
           VALUES (?, ?, ?, ?, ?)`,
          [ordemId, foto.nome_arquivo, foto.caminho_arquivo, foto.tipo_foto, foto.descricao || null],
        )
      }
    }

    // Inserir assinaturas
    if (assinaturas && assinaturas.length > 0) {
      console.log("[v0] Inserindo", assinaturas.length, "assinaturas")
      for (const assinatura of assinaturas) {
        await query(
          `INSERT INTO ordens_servico_assinaturas 
           (ordem_servico_id, tipo_assinatura, assinatura_base64, nome_assinante, data_assinatura) 
           VALUES (?, ?, ?, ?, NOW())`,
          [ordemId, assinatura.tipo_assinatura, assinatura.assinatura_base64, assinatura.nome_assinante],
        )
      }
    }

    console.log("[v0] Ordem de serviço criada com sucesso:", { id: ordemId, numero })

    return NextResponse.json({
      success: true,
      message: "Ordem de serviço criada com sucesso",
      data: { id: ordemId, numero },
    })
  } catch (error) {
    console.error("[v0] Erro ao criar ordem de serviço:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Erro interno do servidor",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
