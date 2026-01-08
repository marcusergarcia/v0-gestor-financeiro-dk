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

      if (!notificationCode) {
        return NextResponse.json({ success: false, error: "notificationCode ausente" }, { status: 400 })
      }

      // Buscar detalhes da transação na API do PagBank
      const token = process.env.PAGSEGURO_TOKEN
      const environment = process.env.PAGSEGURO_ENVIRONMENT || "sandbox"
      const baseUrl = environment === "production" ? "https://api.pagseguro.com" : "https://sandbox.api.pagseguro.com"

      const response = await fetch(
        `${baseUrl}/v2/transactions/notifications/${notificationCode}?email=seu_email&token=${token}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        },
      )

      if (!response.ok) {
        console.error("[PagSeguro Webhook] Erro ao consultar notificationCode:", response.status, await response.text())
        return NextResponse.json({ success: false, error: "Erro ao consultar PagBank" }, { status: 500 })
      }

      const transactionData = await response.json()
      console.log("[PagSeguro Webhook] Dados da transação:", JSON.stringify(transactionData, null, 2))

      // Converter formato antigo (v2) para o formato novo que o código espera
      data = {
        charges: [
          {
            id: transactionData.code || transactionData.id,
            reference_id: transactionData.reference,
            status: mapV2StatusToV4(transactionData.status),
          },
        ],
      }
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

function mapV2StatusToV4(v2Status: string): string {
  const statusMap: Record<string, string> = {
    "1": "WAITING", // Aguardando pagamento
    "2": "WAITING", // Em análise
    "3": "PAID", // Paga
    "4": "PAID", // Disponível
    "5": "WAITING", // Em disputa
    "6": "CANCELED", // Devolvida
    "7": "CANCELED", // Cancelada
  }

  return statusMap[v2Status] || "WAITING"
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
