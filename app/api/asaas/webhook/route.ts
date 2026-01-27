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

    // Processar eventos de pagamento
    const eventosProcessaveis = [
      "PAYMENT_CONFIRMED",
      "PAYMENT_RECEIVED", 
      "PAYMENT_OVERDUE",
      "PAYMENT_DELETED",
      "PAYMENT_REFUNDED",
    ]
    
    if (!eventosProcessaveis.includes(event)) {
      console.log("[Asaas Webhook] Evento ignorado:", event)
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

    // Determinar novo status baseado no evento/status do Asaas
    let novoStatus = boleto.status
    let dataPagamento = null
    
    if (payment.status === "RECEIVED" || payment.status === "CONFIRMED") {
      novoStatus = "pago"
      dataPagamento = payment.paymentDate || new Date().toISOString().split("T")[0]
    } else if (payment.status === "OVERDUE") {
      novoStatus = "vencido"
    } else if (payment.status === "REFUNDED" || payment.status === "DELETED") {
      novoStatus = "cancelado"
    }
    
    // Idempotência: verificar se já está no status correto
    if (boleto.status === novoStatus) {
      console.log("[Asaas Webhook] Boleto já está com status:", novoStatus)
      return NextResponse.json({ success: true }, { status: 200 })
    }

    // Atualizar status
    let result
    if (dataPagamento) {
      result = await query(
        `UPDATE boletos 
         SET status = ?,
             data_pagamento = ?,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [novoStatus, dataPagamento, boleto.id],
      )
    } else {
      result = await query(
        `UPDATE boletos 
         SET status = ?,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [novoStatus, boleto.id],
      )
    }

    console.log("[Asaas Webhook] Boleto atualizado:", {
      numero: boleto.numero,
      asaas_id: payment.id,
      statusAnterior: boleto.status,
      novoStatus: novoStatus,
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
