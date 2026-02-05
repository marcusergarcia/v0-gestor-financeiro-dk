import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const cliente_id = searchParams.get("cliente_id")

    let sql = `
      SELECT 
        nf.*,
        c.nome as cliente_nome,
        c.cnpj as cliente_cnpj,
        c.cpf as cliente_cpf,
        c.email as cliente_email
      FROM notas_fiscais nf
      LEFT JOIN clientes c ON nf.cliente_id = c.id
    `

    const conditions: string[] = []
    const params: any[] = []

    if (status && status !== "all") {
      conditions.push("nf.status = ?")
      params.push(status)
    }

    if (cliente_id) {
      conditions.push("nf.cliente_id = ?")
      params.push(cliente_id)
    }

    if (conditions.length > 0) {
      sql += " WHERE " + conditions.join(" AND ")
    }

    sql += " ORDER BY nf.created_at DESC"

    const notas = await query(sql, params)

    return NextResponse.json({
      success: true,
      data: notas,
    })
  } catch (error) {
    console.error("Erro ao buscar notas fiscais:", error)
    return NextResponse.json(
      { success: false, message: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      cliente_id,
      valor,
      descricao_servico,
      observacoes,
      data_emissao,
      data_competencia,
      municipal_service_id,
      municipal_service_code,
      municipal_service_name,
      iss_percentual = 0,
      cofins_percentual = 0,
      csll_percentual = 0,
      inss_percentual = 0,
      ir_percentual = 0,
      pis_percentual = 0,
      reter_iss = false,
      deducoes = 0,
      boleto_id,
      orcamento_numero,
    } = body

    if (!cliente_id || !valor || !descricao_servico) {
      return NextResponse.json(
        { success: false, message: "Cliente, valor e descricao do servico sao obrigatorios" },
        { status: 400 }
      )
    }

    const result = await query(
      `
      INSERT INTO notas_fiscais (
        cliente_id, valor, descricao_servico, observacoes,
        data_emissao, data_competencia,
        municipal_service_id, municipal_service_code, municipal_service_name,
        iss_percentual, cofins_percentual, csll_percentual,
        inss_percentual, ir_percentual, pis_percentual,
        reter_iss, deducoes, status,
        boleto_id, orcamento_numero,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'rascunho', ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `,
      [
        cliente_id,
        valor,
        descricao_servico,
        observacoes || null,
        data_emissao || new Date().toISOString().split("T")[0],
        data_competencia || data_emissao || new Date().toISOString().split("T")[0],
        municipal_service_id || null,
        municipal_service_code || null,
        municipal_service_name || null,
        iss_percentual,
        cofins_percentual,
        csll_percentual,
        inss_percentual,
        ir_percentual,
        pis_percentual,
        reter_iss ? 1 : 0,
        deducoes,
        boleto_id || null,
        orcamento_numero || null,
      ]
    )

    return NextResponse.json({
      success: true,
      message: "Nota fiscal criada com sucesso",
      data: { id: (result as any).insertId },
    })
  } catch (error) {
    console.error("Erro ao criar nota fiscal:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Erro ao criar nota fiscal",
        error: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 }
    )
  }
}
