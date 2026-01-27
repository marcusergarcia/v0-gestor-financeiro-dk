import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

// Eventos do Asaas:
// PAYMENT_CONFIRMED - Pagamento confirmado
// PAYMENT_RECEIVED - Pagamento recebido
// PAYMENT_OVERDUE - Pagamento vencido
// PAYMENT_DELETED - Pagamento excluído
// PAYMENT_RESTORED - Pagamento restaurado
// PAYMENT_REFUNDED - Pagamento estornado
// PAYMENT_UPDATED - Pagamento atualizado

export async function GET(request: NextRequest) {
  return NextResponse.json({
    status: "online",
    timestamp: new Date().toISOString(),
    environment: process.env.ASAAS_ENVIRONMENT || "sandbox",
    message: "Webhook Asaas ativo e pronto para receber notificações",
  })
}

export async function POST(request: NextRequest) {
  console.log("[Asaas Webhook] ===== WEBHOOK RECEBIDO =====")
  console.log("[Asaas Webhook] Timestamp:", new Date().toISOString())

  try {
    const payload = await request.json()
    console.log("[Asaas Webhook] Payload:", JSON.stringify(payload, null, 2))

    const { event, payment } = payload

    if (!event || !payment) {
      console.log("[Asaas Webhook] Payload inválido: event ou payment ausente")
      return NextResponse.json({ success: true }, { status: 200 })
    }

    console.log("[Asaas Webhook] Evento:", event)
    console.log("[Asaas Webhook] Payment ID:", payment.id)
    console.log("[Asaas Webhook] Status:", payment.status)
    console.log("[Asaas Webhook] External Reference:", payment.externalReference)

    // Processar apenas eventos de pagamento confirmado/recebido
    if (event !== "PAYMENT_CONFIRMED" && event !== "PAYMENT_RECEIVED") {
      console.log("[Asaas Webhook] Evento ignorado:", event)
      return NextResponse.json({ success: true }, { status: 200 })
    }

    // Verificar se o status é RECEIVED ou CONFIRMED
    if (payment.status !== "RECEIVED" && payment.status !== "CONFIRMED") {
      console.log("[Asaas Webhook] Status não é RECEIVED/CONFIRMED, ignorando")
      return NextResponse.json({ success: true }, { status: 200 })
    }

    // Buscar boleto pelo asaas_id
    let boletos = await query(`SELECT id, numero, status FROM boletos WHERE asaas_id = ?`, [payment.id])

    // Se não encontrou, tentar pelo externalReference (número do boleto)
    if (boletos.length === 0 && payment.externalReference) {
      console.log("[Asaas Webhook] Tentando buscar por externalReference:", payment.externalReference)
      boletos = await query(`SELECT id, numero, status FROM boletos WHERE numero = ?`, [payment.externalReference])
    }

    if (boletos.length === 0) {
      console.log("[Asaas Webhook] AVISO: Boleto não encontrado para asaas_id =", payment.id)
      return NextResponse.json({ success: true }, { status: 200 })
    }

    const boleto = boletos[0]
    console.log("[Asaas Webhook] Boleto encontrado:", boleto.numero)
    console.log("[Asaas Webhook] Status atual no banco:", boleto.status)

    // Idempotência: verificar se já está pago
    if (boleto.status === "pago") {
      console.log("[Asaas Webhook] Boleto já está pago, ignorando webhook duplicado")
      return NextResponse.json({ success: true }, { status: 200 })
    }

    // Atualizar status para pago
    const result = await query(
      `UPDATE boletos 
       SET status = 'pago',
           data_pagamento = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND status != 'pago'`,
      [boleto.id],
    )

    console.log("[Asaas Webhook] Boleto atualizado para PAGO:", {
      numero: boleto.numero,
      asaas_id: payment.id,
      rowsAffected: result.affectedRows,
    })

    console.log("[Asaas Webhook] ===== WEBHOOK PROCESSADO COM SUCESSO =====")
    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error("[Asaas Webhook] ERRO:", error)
    // Sempre retornar 200 para evitar reenvios
    return NextResponse.json({ success: true }, { status: 200 })
  }
}
