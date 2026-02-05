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
// PAYMENT_CREATED - Pagamento criado

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
    console.log("[Asaas Webhook] Value:", payment.value)
    console.log("[Asaas Webhook] Net Value:", payment.netValue)
    console.log("[Asaas Webhook] Payment Date:", payment.paymentDate)

    // Processar eventos de pagamento
    const eventosProcessaveis = [
      "PAYMENT_CONFIRMED",
      "PAYMENT_RECEIVED", 
      "PAYMENT_OVERDUE",
      "PAYMENT_DELETED",
      "PAYMENT_REFUNDED",
      "PAYMENT_UPDATED",
      "PAYMENT_CREATED",
    ]
    
    if (!eventosProcessaveis.includes(event)) {
      console.log("[Asaas Webhook] Evento ignorado:", event)
      return NextResponse.json({ success: true }, { status: 200 })
    }

    // Buscar boleto pelo asaas_id
    let boletos = await query(
      `SELECT id, numero, status, valor FROM boletos WHERE asaas_id = ?`, 
      [payment.id]
    )

    // Se não encontrou, tentar pelo externalReference (número do boleto)
    if (boletos.length === 0 && payment.externalReference) {
      console.log("[Asaas Webhook] Tentando buscar por externalReference:", payment.externalReference)
      boletos = await query(
        `SELECT id, numero, status, valor FROM boletos WHERE numero = ?`, 
        [payment.externalReference]
      )
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
    let dataPagamento: string | null = null
    let valorPago: number | null = null
    let juros: number | null = null
    let multa: number | null = null
    let desconto: number | null = null
    
    // Mapear status do Asaas para status do sistema
    if (payment.status === "RECEIVED" || payment.status === "CONFIRMED" || payment.status === "RECEIVED_IN_CASH") {
      novoStatus = "pago"
      dataPagamento = payment.paymentDate || payment.confirmedDate || new Date().toISOString().split("T")[0]
      valorPago = payment.value || payment.netValue || Number(boleto.valor)
      
      // Capturar valores de multa, juros e desconto se disponíveis
      if (payment.fine) {
        multa = payment.fine.value || 0
      }
      if (payment.interest) {
        juros = payment.interest.value || 0
      }
      if (payment.discount) {
        desconto = payment.discount.value || 0
      }
    } else if (payment.status === "OVERDUE") {
      novoStatus = "vencido"
    } else if (payment.status === "REFUNDED" || payment.status === "DELETED" || payment.status === "REFUND_REQUESTED") {
      novoStatus = "cancelado"
    } else if (payment.status === "PENDING") {
      // Se já está aguardando_pagamento, mantém esse status
      novoStatus = boleto.status === "aguardando_pagamento" ? "aguardando_pagamento" : "pendente"
    }
    
    // Para eventos de criação/atualização, sempre atualizar os dados do Asaas mesmo se status não mudar
    const deveAtualizarDados = event === "PAYMENT_CREATED" || event === "PAYMENT_UPDATED"
    
    // Idempotência: verificar se já está no status correto (exceto para eventos de criação/atualização)
    if (boleto.status === novoStatus && !deveAtualizarDados && !dataPagamento) {
      console.log("[Asaas Webhook] Boleto já está com status:", novoStatus)
      return NextResponse.json({ success: true }, { status: 200 })
    }

    // Montar query de atualização dinâmica
    const updateFields: string[] = []
    const updateValues: any[] = []

    // Sempre atualizar status se mudou
    if (boleto.status !== novoStatus) {
      updateFields.push("status = ?")
      updateValues.push(novoStatus)
    }

    // Atualizar dados de pagamento se disponíveis
    if (dataPagamento) {
      updateFields.push("data_pagamento = ?")
      updateValues.push(dataPagamento)
    }

    if (valorPago !== null) {
      updateFields.push("valor_pago = ?")
      updateValues.push(valorPago)
    }

    if (juros !== null) {
      updateFields.push("juros = ?")
      updateValues.push(juros)
    }

    if (multa !== null) {
      updateFields.push("multa = ?")
      updateValues.push(multa)
    }

    if (desconto !== null) {
      updateFields.push("desconto = ?")
      updateValues.push(desconto)
    }

    // Atualizar campos do Asaas se disponíveis no payload
    if (payment.invoiceUrl) {
      updateFields.push("asaas_invoice_url = ?")
      updateValues.push(payment.invoiceUrl)
    }

    if (payment.bankSlipUrl) {
      updateFields.push("asaas_bankslip_url = ?")
      updateValues.push(payment.bankSlipUrl)
    }

    if (payment.identificationField) {
      updateFields.push("asaas_linha_digitavel = ?")
      updateValues.push(payment.identificationField)
    }

    if (payment.barCode) {
      updateFields.push("asaas_barcode = ?")
      updateValues.push(payment.barCode)
    }

    if (payment.nossoNumero) {
      updateFields.push("asaas_nosso_numero = ?")
      updateValues.push(payment.nossoNumero)
    }

    // Sempre atualizar updated_at
    updateFields.push("updated_at = CURRENT_TIMESTAMP")

    // Adicionar ID do boleto para WHERE
    updateValues.push(boleto.id)

    // Executar atualização se houver campos para atualizar
    if (updateFields.length > 0) {
      const updateQuery = `UPDATE boletos SET ${updateFields.join(", ")} WHERE id = ?`
      console.log("[Asaas Webhook] Query:", updateQuery)
      console.log("[Asaas Webhook] Values:", updateValues)
      
      const result = await query(updateQuery, updateValues)

      console.log("[Asaas Webhook] Boleto atualizado:", {
        numero: boleto.numero,
        asaas_id: payment.id,
        statusAnterior: boleto.status,
        novoStatus: novoStatus,
        dataPagamento: dataPagamento,
        valorPago: valorPago,
        rowsAffected: result.affectedRows,
      })
    } else {
      console.log("[Asaas Webhook] Nenhum campo para atualizar")
    }

    console.log("[Asaas Webhook] ===== WEBHOOK PROCESSADO COM SUCESSO =====")
    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error("[Asaas Webhook] ERRO:", error)
    // Sempre retornar 200 para evitar reenvios
    return NextResponse.json({ success: true }, { status: 200 })
  }
}
