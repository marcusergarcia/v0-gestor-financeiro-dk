import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

// GET - Verificar status do webhook
export async function GET(request: NextRequest) {
  return NextResponse.json({
    status: "online",
    timestamp: new Date().toISOString(),
    environment: process.env.ASAAS_ENVIRONMENT || "sandbox",
    message: "Webhook Asaas esta ativo e pronto para receber notificacoes",
  })
}

// POST - Receber notificações do Asaas
export async function POST(request: NextRequest) {
  console.log("[Asaas Webhook] ===== WEBHOOK RECEBIDO =====")
  console.log("[Asaas Webhook] Timestamp:", new Date().toISOString())

  try {
    const payload = await request.json()
    console.log("[Asaas Webhook] Payload recebido:", JSON.stringify(payload, null, 2))

    const { event, payment } = payload

    // Eventos do Asaas:
    // PAYMENT_CONFIRMED - Pagamento confirmado
    // PAYMENT_RECEIVED - Pagamento recebido
    // PAYMENT_OVERDUE - Pagamento vencido
    // PAYMENT_DELETED - Pagamento excluído
    // PAYMENT_RESTORED - Pagamento restaurado
    // PAYMENT_REFUNDED - Pagamento estornado
    // PAYMENT_UPDATED - Pagamento atualizado

    if (!payment) {
      console.log("[Asaas Webhook] AVISO: Campo payment ausente")
      return NextResponse.json({ success: true }, { status: 200 })
    }

    const {
      id: asaasId,
      externalReference,
      status,
      billingType,
      value,
      paymentDate,
    } = payment

    console.log("[Asaas Webhook] Processando:")
    console.log("[Asaas Webhook] - Event:", event)
    console.log("[Asaas Webhook] - Asaas ID:", asaasId)
    console.log("[Asaas Webhook] - External Reference:", externalReference)
    console.log("[Asaas Webhook] - Status:", status)
    console.log("[Asaas Webhook] - Billing Type:", billingType)

    // Verificar se é boleto
    if (billingType !== "BOLETO") {
      console.log("[Asaas Webhook] Ignorando: nao e boleto")
      return NextResponse.json({ success: true }, { status: 200 })
    }

    // Eventos que indicam pagamento confirmado
    const eventosPagamento = ["PAYMENT_CONFIRMED", "PAYMENT_RECEIVED"]
    
    if (!eventosPagamento.includes(event)) {
      console.log("[Asaas Webhook] Evento nao e de pagamento:", event)
      return NextResponse.json({ success: true }, { status: 200 })
    }

    // Status que indicam pagamento
    const statusPago = ["RECEIVED", "CONFIRMED", "RECEIVED_IN_CASH"]
    
    if (!statusPago.includes(status)) {
      console.log("[Asaas Webhook] Status nao e pago:", status)
      return NextResponse.json({ success: true }, { status: 200 })
    }

    console.log("[Asaas Webhook] Pagamento confirmado - iniciando atualizacao")

    // Buscar boleto pelo asaas_id
    let boletos = await query(
      `SELECT id, numero, status FROM boletos WHERE asaas_id = ?`,
      [asaasId]
    )

    // Se não encontrar, tentar pelo external_reference (número do boleto)
    if (boletos.length === 0 && externalReference) {
      console.log("[Asaas Webhook] Tentando buscar por numero:", externalReference)
      boletos = await query(
        `SELECT id, numero, status FROM boletos WHERE numero = ?`,
        [externalReference]
      )
    }

    if (boletos.length === 0) {
      console.log("[Asaas Webhook] AVISO: Boleto nao encontrado para asaas_id =", asaasId)
      return NextResponse.json({ success: true }, { status: 200 })
    }

    const boleto = boletos[0]
    console.log("[Asaas Webhook] Boleto encontrado:", boleto.numero)
    console.log("[Asaas Webhook] Status atual no banco:", boleto.status)

    // Verificar idempotência - se já está pago, ignorar
    if (boleto.status === "pago") {
      console.log("[Asaas Webhook] Boleto ja esta pago, ignorando webhook duplicado")
      return NextResponse.json({ success: true }, { status: 200 })
    }

    // Atualizar status para pago
    const result = await query(
      `UPDATE boletos 
       SET status = 'pago',
           data_pagamento = ?,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND status != 'pago'`,
      [paymentDate || new Date().toISOString().split("T")[0], boleto.id]
    )

    console.log("[Asaas Webhook] Boleto atualizado para PAGO:", {
      numero: boleto.numero,
      asaas_id: asaasId,
      rowsAffected: result.affectedRows,
    })

    console.log("[Asaas Webhook] ===== WEBHOOK PROCESSADO COM SUCESSO =====")
    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error("[Asaas Webhook] ERRO:", error)
    // Sempre retornar 200 para evitar reenvios desnecessários
    return NextResponse.json({ success: true }, { status: 200 })
  }
}
