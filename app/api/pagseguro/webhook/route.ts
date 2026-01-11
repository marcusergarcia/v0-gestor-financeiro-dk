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
      console.log("[v0][PagBank Webhook] AVISO: Content-Type não é JSON, ignorando (API v3 não suportada)")
      return NextResponse.json({ success: true, message: "Apenas webhooks JSON são processados" })
    }

    // Receber webhook (JSON)
    const payload = await request.json()
    console.log("[v0][PagBank Webhook] Payload completo:", JSON.stringify(payload, null, 2))

    // Extrair os IDs
    const orderId = payload.id // ORDE_XXXX
    const charge = payload.charges?.[0]

    console.log("[v0][PagBank Webhook] Order ID:", orderId)
    console.log("[v0][PagBank Webhook] Charges encontradas:", payload.charges?.length || 0)

    if (!charge) {
      console.log("[v0][PagBank Webhook] AVISO: Nenhuma charge encontrada no payload")
      return NextResponse.json({ success: true, message: "Nenhuma charge encontrada" })
    }

    // Identificar o boleto
    const chargeId = charge.id // CHAR_XXXX
    const status = charge.status // PAID, WAITING, etc
    const paidAt = charge.paid_at
    const referenceId = charge.reference_id

    console.log("[v0][PagBank Webhook] Charge ID:", chargeId)
    console.log("[v0][PagBank Webhook] Status:", status)
    console.log("[v0][PagBank Webhook] Paid At:", paidAt)
    console.log("[v0][PagBank Webhook] Reference ID:", referenceId)

    // Buscar boleto pelo charge_id (CHAR_XXXX)
    console.log("[v0][PagBank Webhook] Buscando boleto com charge_id =", chargeId)

    const boletosEncontrados = await query(`SELECT id, numero, status, valor FROM boletos WHERE charge_id = ?`, [
      chargeId,
    ])

    console.log("[v0][PagBank Webhook] Boletos encontrados:", boletosEncontrados.length)

    if (boletosEncontrados.length === 0) {
      console.log("[v0][PagBank Webhook] AVISO: Nenhum boleto encontrado com charge_id =", chargeId)
      return NextResponse.json({ success: true, message: "Boleto não encontrado, mas notificação aceita" })
    }

    const boleto = boletosEncontrados[0]
    console.log("[v0][PagBank Webhook] Boleto encontrado:", {
      id: boleto.id,
      numero: boleto.numero,
      statusAtual: boleto.status,
      valor: boleto.valor,
    })

    // Atualizar status no banco se PAID
    if (status === "PAID") {
      console.log("[v0][PagBank Webhook] Status é PAID - Atualizando boleto para PAGO")

      const updateResult = await query(
        `UPDATE boletos 
         SET status = 'pago',
             data_pagamento = ?,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [paidAt || new Date().toISOString(), boleto.id],
      )

      console.log("[v0][PagBank Webhook] Boleto atualizado:", {
        boletoId: boleto.id,
        numero: boleto.numero,
        novoStatus: "pago",
        affectedRows: updateResult.affectedRows,
        changedRows: updateResult.changedRows,
      })

      // Processar cashback
      console.log("[v0][PagBank Webhook] Processando cashback para boleto pago")
      await processarCashback(boleto.id)

      console.log("[v0][PagBank Webhook] ===== BOLETO MARCADO COMO PAGO COM SUCESSO =====")
      return NextResponse.json({
        success: true,
        message: `Boleto ${boleto.numero} atualizado para PAGO`,
      })
    } else {
      console.log("[v0][PagBank Webhook] Status não é PAID, apenas registrando")
      return NextResponse.json({
        success: true,
        message: `Status ${status} registrado, aguardando pagamento`,
      })
    }
  } catch (error) {
    console.error("[v0][PagBank Webhook] ERRO FATAL:", error)
    console.error("[v0][PagBank Webhook] Stack:", error instanceof Error ? error.stack : "N/A")
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}

async function processarCashback(boletoId: number) {
  try {
    // Buscar boleto e cliente
    const boletos = await query(
      `SELECT b.*, c.telefone, c.id as cliente_id
       FROM boletos b
       JOIN clientes c ON b.cliente_id = c.id
       WHERE b.id = ?`,
      [boletoId],
    )

    if (boletos.length === 0) return

    const boleto = boletos[0]

    // Verificar se cashback está ativo
    const configs = await query(`SELECT valor FROM configuracoes_pagseguro WHERE chave = 'cashback_ativo'`)

    if (configs.length === 0 || configs[0].valor !== "true") return

    // Buscar percentual de cashback
    const percentualConfigs = await query(
      `SELECT valor FROM configuracoes_pagseguro WHERE chave = 'cashback_percentual_padrao'`,
    )

    const percentual = percentualConfigs.length > 0 ? Number.parseFloat(percentualConfigs[0].valor) : 2.0
    const valorCashback = (boleto.valor * percentual) / 100

    // Registrar cashback
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
