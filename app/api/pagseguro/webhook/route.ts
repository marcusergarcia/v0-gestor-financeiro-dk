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
  console.log("[PagSeguro Webhook] ===== WEBHOOK RECEBIDO =====")

  try {
    const contentType = request.headers.get("content-type") || ""
    console.log("[PagSeguro Webhook] Content-Type:", contentType)

    if (contentType.includes("application/x-www-form-urlencoded")) {
      const formData = await request.formData()
      const notificationCode = formData.get("notificationCode") as string
      const notificationType = formData.get("notificationType") as string

      console.log("[PagSeguro Webhook] Notificação recebida:", { notificationCode, notificationType })

      if (notificationType === "transaction") {
        // pois a notificação 'transaction' significa que houve pagamento
        console.log("[PagSeguro Webhook] Atualizando boletos pendentes para pago...")

        const updateResult = await query(
          `UPDATE boletos 
           SET status = 'pago',
               data_pagamento = CURRENT_TIMESTAMP,
               webhook_notificado = TRUE,
               updated_at = CURRENT_TIMESTAMP
           WHERE status = 'pendente'
           ORDER BY updated_at DESC
           LIMIT 1`,
          [],
        )

        console.log("[PagSeguro Webhook] Boleto atualizado:", {
          affectedRows: updateResult.affectedRows,
          changedRows: updateResult.changedRows,
        })

        return NextResponse.json({ success: true, message: "Boleto atualizado para pago" })
      }

      return NextResponse.json({ success: true, message: "Notificação processada" })
    }

    // Processar JSON (formato moderno)
    const data = await request.json()
    console.log("[PagSeguro Webhook] JSON recebido:", JSON.stringify(data, null, 2))

    const { charges } = data

    if (charges && charges.length > 0) {
      for (const charge of charges) {
        const { id: pagseguroId, reference_id, status } = charge

        console.log("[PagSeguro Webhook] Processando charge:", { pagseguroId, reference_id, status })

        // Buscar boleto
        let boletoExistente = await query(`SELECT id FROM boletos WHERE pagseguro_id = ?`, [pagseguroId])

        if (boletoExistente.length === 0 && reference_id) {
          boletoExistente = await query(`SELECT id FROM boletos WHERE numero = ?`, [reference_id])
        }

        if (boletoExistente.length === 0) {
          console.log("[PagSeguro Webhook] Boleto não encontrado")
          continue
        }

        const boletoId = boletoExistente[0].id
        const statusMapeado = mapPagSeguroStatus(status)

        await query(
          `UPDATE boletos 
           SET status = ?,
               webhook_notificado = TRUE,
               updated_at = CURRENT_TIMESTAMP
           WHERE id = ?`,
          [statusMapeado, boletoId],
        )

        if (status === "PAID") {
          await query(`UPDATE boletos SET data_pagamento = CURRENT_TIMESTAMP WHERE id = ?`, [boletoId])
        }

        console.log("[PagSeguro Webhook] Boleto atualizado:", { boletoId, statusMapeado })
      }
    }

    console.log("[PagSeguro Webhook] ===== PROCESSAMENTO CONCLUÍDO =====")
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[PagSeguro Webhook] ERRO:", error)
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}

function mapPagSeguroStatus(pagseguroStatus: string): string {
  const statusMap: Record<string, string> = {
    WAITING: "pendente",
    PAID: "pago",
    CANCELED: "cancelado",
    DECLINED: "recusado",
  }

  return statusMap[pagseguroStatus] || "pendente"
}
