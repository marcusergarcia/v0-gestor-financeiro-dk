import { type NextRequest, NextResponse } from "next/server"
import { pool } from "@/lib/db"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const [rows] = await pool.execute(
      `
      SELECT 
        b.id,
        b.numero,
        b.cliente_id,
        c.nome as cliente_nome,
        b.valor,
        b.data_vencimento,
        b.data_pagamento,
        b.status,
        b.numero_parcela,
        b.total_parcelas,
        b.observacoes,
        b.created_at,
        b.updated_at
      FROM boletos b
      LEFT JOIN clientes c ON b.cliente_id = c.id
      WHERE b.id = ?
      `,
      [id],
    )

    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Boleto não encontrado",
        },
        { status: 404 },
      )
    }

    return NextResponse.json({
      success: true,
      data: rows[0],
    })
  } catch (error) {
    console.error("Erro ao buscar boleto:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Erro ao buscar boleto",
        error: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 },
    )
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { valor, data_vencimento, data_pagamento, status, observacoes } = await request.json()

    // Validações
    if (!valor || !data_vencimento || !status) {
      return NextResponse.json(
        {
          success: false,
          message: "Campos obrigatórios não fornecidos",
        },
        { status: 400 },
      )
    }

    if (isNaN(Number.parseFloat(valor)) || Number.parseFloat(valor) <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Valor deve ser um número positivo",
        },
        { status: 400 },
      )
    }

    // Validar data de pagamento se status for "pago"
    if (status === "pago" && !data_pagamento) {
      return NextResponse.json(
        {
          success: false,
          message: "Data de pagamento é obrigatória quando o status é 'Pago'",
        },
        { status: 400 },
      )
    }

    // Verificar se o boleto existe
    const [existingRows] = await pool.execute("SELECT id FROM boletos WHERE id = ?", [id])

    if (!Array.isArray(existingRows) || existingRows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Boleto não encontrado",
        },
        { status: 404 },
      )
    }

    // Atualizar o boleto
    await pool.execute(
      `
      UPDATE boletos 
      SET 
        valor = ?,
        data_vencimento = ?,
        data_pagamento = ?,
        status = ?,
        observacoes = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
      `,
      [valor, data_vencimento, data_pagamento, status, observacoes, id],
    )

    return NextResponse.json({
      success: true,
      message: "Boleto atualizado com sucesso!",
    })
  } catch (error) {
    console.error("Erro ao atualizar boleto:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Erro ao atualizar boleto",
        error: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 },
    )
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    await pool.execute("DELETE FROM boletos WHERE id = ?", [id])

    return NextResponse.json({
      success: true,
      message: "Boleto excluído com sucesso!",
    })
  } catch (error) {
    console.error("Erro ao excluir boleto:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Erro ao excluir boleto",
        error: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 },
    )
  }
}
