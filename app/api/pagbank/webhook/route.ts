import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET(request: NextRequest) {
  return NextResponse.json({
    status: "online",
    timestamp: new Date().toISOString(),
    environment: process.env.PAGSEGURO_ENVIRONMENT || "sandbox",
    message: "Webhook PagBank está ativo e pronto para receber notificações",
  })
}

export async function POST(request: NextRequest) {
  console.log("[v0][PagBank Webhook] ===== WEBHOOK RECEBIDO =====")
  console.log("[v0][PagBank Webhook] Timestamp:", new Date().toISOString())

  try {
    const contentType = request.headers.get("content-type") || ""
    console.log("[v0][PagBank Webhook] Content-Type:", contentType)

    if (!contentType.includes("application/json")) {
      console.log("[v0][PagBank Webhook] Ignorando webhook não-JSON (API v3 antiga)")
      return NextResponse.json({ success: true }, { status: 200 })
    }

    const payload = await request.json()
    console.log("[v0][PagBank Webhook] Payload recebido:", JSON.stringify(payload, null, 2))

    const charges = payload.charges || []
    console.log("[v0][PagBank Webhook] Total de charges:", charges.length)

    for (const charge of charges) {
      const chargeId = charge.id // CHAR_XXXX
      const status = charge.status // PAID, WAITING, etc
      const paidAt = charge.paid_at

      console.log("[v0][PagBank Webhook] Processando charge:", chargeId, "Status:", status)

      if (status === "PAID") {
        console.log("[v0][PagBank Webhook] Buscando boleto com charge_id =", chargeId)

        const boletos = await query(`SELECT id, numero, status FROM boletos WHERE charge_id = ?`, [chargeId])

        if (boletos.length === 0) {
          console.log("[v0][PagBank Webhook] AVISO: Boleto não encontrado para charge_id =", chargeId)
          continue
        }

        const boleto = boletos[0]
        console.log("[v0][PagBank Webhook] Boleto encontrado:", boleto.numero, "Status atual:", boleto.status)

        const result = await query(
          `UPDATE boletos 
           SET status = 'pago',
               data_pagamento = ?,
               updated_at = CURRENT_TIMESTAMP
           WHERE id = ?`,
          [paidAt || new Date().toISOString(), boleto.id],
        )

        console.log("[v0][PagBank Webhook] Boleto atualizado para PAGO:", {
          numero: boleto.numero,
          affectedRows: result.affectedRows,
        })

        // Processar cashback
        await processarCashback(boleto.id)
      }
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error("[v0][PagBank Webhook] ERRO:", error)
    return NextResponse.json({ success: true }, { status: 200 })
  }
}

async function processarCashback(boletoId: number) {
  try {
    const boletos = await query(
      `SELECT b.*, c.telefone, c.id as cliente_id
       FROM boletos b
       JOIN clientes c ON b.cliente_id = c.id
       WHERE b.id = ?`,
      [boletoId],
    )

    if (boletos.length === 0) return

    const boleto = boletos[0]

    const configs = await query(`SELECT valor FROM configuracoes_pagseguro WHERE chave = 'cashback_ativo'`)

    if (configs.length === 0 || configs[0].valor !== "true") return

    const percentualConfigs = await query(
      `SELECT valor FROM configuracoes_pagseguro WHERE chave = 'cashback_percentual_padrao'`,
    )

    const percentual = percentualConfigs.length > 0 ? Number.parseFloat(percentualConfigs[0].valor) : 2.0
    const valorCashback = (boleto.valor * percentual) / 100

    await query(
      `INSERT INTO cashback 
       (cliente_id, telefone, valor_compra, percentual_cashback, valor_cashback, status, boleto_id, data_compra)
       VALUES (?, ?, ?, ?, ?, 'disponivel', ?, CURRENT_TIMESTAMP)`,
      [boleto.cliente_id, boleto.telefone, boleto.valor, percentual, valorCashback, boletoId],
    )

    console.log(`[v0][Cashback] Registrado R$ ${valorCashback.toFixed(2)} para cliente ${boleto.cliente_id}`)
  } catch (error) {
    console.error("[v0][Cashback] Erro ao processar:", error)
  }
}
