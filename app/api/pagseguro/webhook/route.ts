import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type") || ""
    console.log("[PagSeguro Webhook] Content-Type:", contentType)

    let data: any

    if (contentType.includes("application/x-www-form-urlencoded")) {
      // Eventos pós-transacionais: notificationCode e notificationType
      const formData = await request.formData()
      const notificationCode = formData.get("notificationCode")
      const notificationType = formData.get("notificationType")

      console.log("[PagSeguro Webhook] Form data recebido:", { notificationCode, notificationType })

      // Esses eventos precisam ser consultados na API do PagSeguro
      // Por enquanto, apenas retornamos sucesso
      return NextResponse.json({
        success: true,
        message: "Notificação pós-transacional recebida. Consulte a API do PagSeguro para detalhes.",
        notificationCode,
        notificationType,
      })
    } else {
      // Eventos transacionais: JSON completo
      data = await request.json()
      console.log("[PagSeguro Webhook] JSON recebido:", JSON.stringify(data, null, 2))
    }

    // Processar eventos transacionais (PAID, WAITING, etc)
    const { charges } = data

    if (charges && charges.length > 0) {
      for (const charge of charges) {
        const { id: pagseguroId, reference_id, status } = charge

        // Atualizar boleto no banco de dados
        await query(
          `UPDATE boletos 
           SET status = ?, 
               pagseguro_status = ?,
               webhook_notificado = TRUE,
               updated_at = CURRENT_TIMESTAMP
           WHERE pagseguro_id = ?`,
          [mapPagSeguroStatus(status), status, pagseguroId],
        )

        // Se foi pago, registrar data de pagamento
        if (status === "PAID") {
          await query(
            `UPDATE boletos 
             SET data_pagamento = CURRENT_TIMESTAMP
             WHERE pagseguro_id = ?`,
            [pagseguroId],
          )

          // Processar cashback se configurado
          await processarCashback(pagseguroId)
        }
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[PagSeguro Webhook] Erro:", error)
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

async function processarCashback(pagseguroId: string) {
  try {
    // Buscar boleto e cliente
    const boletos = await query(
      `SELECT b.*, c.telefone, c.id as cliente_id
       FROM boletos b
       JOIN clientes c ON b.cliente_id = c.id
       WHERE b.pagseguro_id = ?`,
      [pagseguroId],
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
      [boleto.cliente_id, boleto.telefone, boleto.valor, percentual, valorCashback, boleto.id],
    )

    console.log(`[Cashback] Registrado R$ ${valorCashback} para cliente ${boleto.cliente_id}`)
  } catch (error) {
    console.error("[Cashback] Erro ao processar:", error)
  }
}
