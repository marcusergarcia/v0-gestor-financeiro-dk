import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const notas = await query(
      `
      SELECT 
        nf.*,
        c.nome as cliente_nome,
        c.cnpj as cliente_cnpj,
        c.cpf as cliente_cpf,
        c.email as cliente_email
      FROM notas_fiscais nf
      LEFT JOIN clientes c ON nf.cliente_id = c.id
      WHERE nf.id = ?
    `,
      [id]
    )

    if ((notas as any[]).length === 0) {
      return NextResponse.json(
        { success: false, message: "Nota fiscal nao encontrada" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: (notas as any[])[0],
    })
  } catch (error) {
    console.error("Erro ao buscar nota fiscal:", error)
    return NextResponse.json(
      { success: false, message: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()

    const {
      valor,
      descricao_servico,
      observacoes,
      data_emissao,
      data_competencia,
      municipal_service_id,
      municipal_service_code,
      municipal_service_name,
      iss_percentual,
      cofins_percentual,
      csll_percentual,
      inss_percentual,
      ir_percentual,
      pis_percentual,
      reter_iss,
      deducoes,
    } = body

    await query(
      `
      UPDATE notas_fiscais SET
        valor = COALESCE(?, valor),
        descricao_servico = COALESCE(?, descricao_servico),
        observacoes = ?,
        data_emissao = COALESCE(?, data_emissao),
        data_competencia = COALESCE(?, data_competencia),
        municipal_service_id = ?,
        municipal_service_code = ?,
        municipal_service_name = ?,
        iss_percentual = COALESCE(?, iss_percentual),
        cofins_percentual = COALESCE(?, cofins_percentual),
        csll_percentual = COALESCE(?, csll_percentual),
        inss_percentual = COALESCE(?, inss_percentual),
        ir_percentual = COALESCE(?, ir_percentual),
        pis_percentual = COALESCE(?, pis_percentual),
        reter_iss = COALESCE(?, reter_iss),
        deducoes = COALESCE(?, deducoes),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND status = 'rascunho'
    `,
      [
        valor,
        descricao_servico,
        observacoes || null,
        data_emissao,
        data_competencia,
        municipal_service_id || null,
        municipal_service_code || null,
        municipal_service_name || null,
        iss_percentual,
        cofins_percentual,
        csll_percentual,
        inss_percentual,
        ir_percentual,
        pis_percentual,
        reter_iss !== undefined ? (reter_iss ? 1 : 0) : undefined,
        deducoes,
        id,
      ]
    )

    return NextResponse.json({
      success: true,
      message: "Nota fiscal atualizada com sucesso",
    })
  } catch (error) {
    console.error("Erro ao atualizar nota fiscal:", error)
    return NextResponse.json(
      { success: false, message: "Erro ao atualizar nota fiscal" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    // Verificar se pode excluir (apenas rascunho ou erro)
    const notas = await query(
      `SELECT id, status, asaas_id FROM notas_fiscais WHERE id = ?`,
      [id]
    )

    if ((notas as any[]).length === 0) {
      return NextResponse.json(
        { success: false, message: "Nota fiscal nao encontrada" },
        { status: 404 }
      )
    }

    const nota = (notas as any[])[0]

    if (nota.status !== "rascunho" && nota.status !== "erro") {
      return NextResponse.json(
        { success: false, message: "Apenas notas em rascunho ou com erro podem ser excluidas" },
        { status: 400 }
      )
    }

    await query(`DELETE FROM notas_fiscais WHERE id = ?`, [id])

    return NextResponse.json({
      success: true,
      message: "Nota fiscal excluida com sucesso",
    })
  } catch (error) {
    console.error("Erro ao excluir nota fiscal:", error)
    return NextResponse.json(
      { success: false, message: "Erro ao excluir nota fiscal" },
      { status: 500 }
    )
  }
}
