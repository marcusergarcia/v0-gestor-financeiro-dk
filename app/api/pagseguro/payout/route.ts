import { type NextRequest, NextResponse } from "next/server"
import { pool } from "@/lib/database"

export async function POST(request: NextRequest) {
  try {
    const { descricao, valor, tipoPagamento, chavePix, contaBancaria, beneficiario, dataAgendamento, observacoes } =
      await request.json()

    if (!descricao || !valor || !tipoPagamento || !beneficiario) {
      return NextResponse.json({ success: false, message: "Dados obrigatórios não fornecidos" }, { status: 400 })
    }

    if (tipoPagamento === "PIX" && !chavePix) {
      return NextResponse.json({ success: false, message: "Chave PIX é obrigatória" }, { status: 400 })
    }

    if (tipoPagamento === "TRANSFERENCIA" && !contaBancaria) {
      return NextResponse.json({ success: false, message: "Dados bancários são obrigatórios" }, { status: 400 })
    }

    // Gerar reference_id único
    const referenceId = `PAYOUT-${Date.now()}`

    // Criar payout no banco
    const [result] = await pool.execute(
      `
      INSERT INTO payouts (
        reference_id,
        descricao,
        valor,
        tipo_pagamento,
        chave_pix,
        conta_bancaria,
        beneficiario,
        status,
        data_agendamento,
        observacoes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'pendente', ?, ?)
    `,
      [
        referenceId,
        descricao,
        valor,
        tipoPagamento,
        chavePix || null,
        contaBancaria ? JSON.stringify(contaBancaria) : null,
        JSON.stringify(beneficiario),
        dataAgendamento || null,
        observacoes || null,
      ],
    )

    const payoutId = (result as any).insertId

    // Se não tem data de agendamento, processar imediatamente
    if (!dataAgendamento) {
      try {
        const { getPagSeguroAPI } = await import("@/lib/pagseguro")
        const pagseguro = getPagSeguroAPI()

        const payoutData: any = {
          reference_id: referenceId,
          description: descricao,
          amount: {
            value: Math.round(valor * 100), // em centavos
            currency: "BRL",
          },
          payment_method: {
            type: tipoPagamento === "PIX" ? "PIX" : "BANK_ACCOUNT",
          },
          destination: {
            holder: beneficiario,
          },
        }

        if (tipoPagamento === "PIX") {
          payoutData.payment_method.pix_key = chavePix
        } else {
          payoutData.payment_method.bank_account = contaBancaria
        }

        const payoutPagSeguro = await pagseguro.criarPayout(payoutData)

        // Atualizar com ID do PagSeguro
        await pool.execute(
          `
          UPDATE payouts 
          SET 
            pagseguro_id = ?,
            status = 'processando',
            data_processamento = CURRENT_TIMESTAMP
          WHERE id = ?
        `,
          [payoutPagSeguro.id, payoutId],
        )

        return NextResponse.json({
          success: true,
          message: "Payout criado e processado com sucesso",
          data: { id: payoutId, pagseguro_id: payoutPagSeguro.id },
        })
      } catch (error) {
        console.error("[Payout] Erro ao processar no PagSeguro:", error)

        await pool.execute(`UPDATE payouts SET status = 'falhou', observacoes = ? WHERE id = ?`, [
          `Erro: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
          payoutId,
        ])

        return NextResponse.json(
          {
            success: false,
            message: "Erro ao processar payout no PagSeguro",
            error: error instanceof Error ? error.message : "Erro desconhecido",
          },
          { status: 500 },
        )
      }
    }

    return NextResponse.json({
      success: true,
      message: "Payout agendado com sucesso",
      data: { id: payoutId },
    })
  } catch (error) {
    console.error("[Payout] Erro ao criar:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Erro ao criar payout",
        error: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 },
    )
  }
}

export async function GET() {
  try {
    const [payouts] = await pool.execute(`
      SELECT * FROM payouts 
      ORDER BY created_at DESC 
      LIMIT 100
    `)

    return NextResponse.json({ success: true, data: payouts })
  } catch (error) {
    console.error("[Payout] Erro ao listar:", error)
    return NextResponse.json({ success: false, message: "Erro ao listar payouts" }, { status: 500 })
  }
}
