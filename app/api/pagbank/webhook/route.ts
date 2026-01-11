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
  console.log("[PagBank Webhook] ===== WEBHOOK RECEBIDO =====")
  console.log("[PagBank Webhook] Timestamp:", new Date().toISOString())

  try {
    const contentType = request.headers.get("content-type") || ""
    console.log("[PagBank Webhook] Content-Type:", contentType)

    if (!contentType.includes("application/json")) {
      console.log("[PagBank Webhook] Ignorando webhook não-JSON (API v3 antiga)")
      return NextResponse.json({ ok: true }, { status: 200 })
    }

    const payload = await request.json()
    console.log("[PagBank Webhook] Payload recebido:", JSON.stringify(payload, null, 2))

    if (payload.type === "CHARGE_STATUS_CHANGED" && payload.data) {
      const { order_id, charge_id, reference_id, status, amount, payment_method } = payload.data

      console.log("[PagBank Webhook] Formato v4 detectado")
      console.log("[PagBank Webhook] Type:", payload.type)
      console.log("[PagBank Webhook] Order ID:", order_id)
      console.log("[PagBank Webhook] Charge ID:", charge_id)
      console.log("[PagBank Webhook] Reference ID:", reference_id)
      console.log("[PagBank Webhook] Status:", status)

      if (payment_method?.type !== "BOLETO") {
        console.log("[PagBank Webhook] Ignorando: não é boleto")
        return NextResponse.json({ ok: true }, { status: 200 })
      }

      if (status === "PAID") {
        console.log("[PagBank Webhook] Status PAID confirmado - iniciando atualização")

        let boletos = await query(`SELECT id, numero, status FROM boletos WHERE charge_id = ?`, [charge_id])

        if (boletos.length === 0 && reference_id) {
          console.log("[PagBank Webhook] Tentando buscar por reference_id:", reference_id)
          boletos = await query(`SELECT id, numero, status FROM boletos WHERE numero = ?`, [reference_id])
        }

        if (boletos.length === 0) {
          console.log("[PagBank Webhook] AVISO: Boleto não encontrado para charge_id =", charge_id)
          return NextResponse.json({ ok: true }, { status: 200 })
        }

        const boleto = boletos[0]
        console.log("[PagBank Webhook] Boleto encontrado:", boleto.numero)
        console.log("[PagBank Webhook] Status atual no banco:", boleto.status)

        if (boleto.status === "pago") {
          console.log("[PagBank Webhook] Boleto já está pago, ignorando webhook duplicado")
          return NextResponse.json({ ok: true }, { status: 200 })
        }

        const result = await query(
          `UPDATE boletos 
           SET status = 'pago',
               data_pagamento = CURRENT_TIMESTAMP,
               updated_at = CURRENT_TIMESTAMP
           WHERE id = ? AND status != 'pago'`,
          [boleto.id],
        )

        console.log("[PagBank Webhook] Boleto atualizado para PAGO:", {
          numero: boleto.numero,
          affectedRows: result.affectedRows,
        })

        if (result.affectedRows > 0) {
          await processarCashback(boleto.id)
        }
      }

      return NextResponse.json({ ok: true }, { status: 200 })
    }

    const charges = payload.charges || []

    if (charges.length > 0) {
      console.log("[PagBank Webhook] Formato antigo com charges array detectado")

      for (const charge of charges) {
        const chargeId = charge.id
        const status = charge.status
        const paidAt = charge.paid_at

        console.log("[PagBank Webhook] Processando charge:", chargeId)
        console.log("[PagBank Webhook] Status:", status)

        if (status === "PAID") {
          const boletos = await query(`SELECT id, numero, status FROM boletos WHERE charge_id = ?`, [chargeId])

          if (boletos.length === 0) {
            console.log("[PagBank Webhook] Boleto não encontrado para charge_id =", chargeId)
            continue
          }

          const boleto = boletos[0]

          if (boleto.status === "pago") {
            console.log("[PagBank Webhook] Boleto já está pago, ignorando")
            continue
          }

          const result = await query(
            `UPDATE boletos 
             SET status = 'pago',
                 data_pagamento = ?,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = ? AND status != 'pago'`,
            [paidAt || new Date().toISOString(), boleto.id],
          )

          console.log("[PagBank Webhook] Boleto atualizado:", {
            numero: boleto.numero,
            affectedRows: result.affectedRows,
          })

          if (result.affectedRows > 0) {
            await processarCashback(boleto.id)
          }
        }
      }
    }

    console.log("[PagBank Webhook] ===== WEBHOOK PROCESSADO COM SUCESSO =====")
    return NextResponse.json({ ok: true }, { status: 200 })
  } catch (error) {
    console.error("[PagBank Webhook] ERRO:", error)
    return NextResponse.json({ ok: true }, { status: 200 })
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

    console.log(`[v0][Cashback] ✅ Registrado R$ ${valorCashback.toFixed(2)} para cliente ${boleto.cliente_id}`)
  } catch (error) {
    console.error("[v0][Cashback] ❌ Erro ao processar:", error)
  }
}
