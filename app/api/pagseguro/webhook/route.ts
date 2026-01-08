import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function POST(request: NextRequest) {
  console.log("[v0][PagSeguro Webhook] ===== WEBHOOK RECEBIDO =====")
  console.log("[v0][PagSeguro Webhook] Timestamp:", new Date().toISOString())
  console.log("[v0][PagSeguro Webhook] Headers:", Object.fromEntries(request.headers.entries()))

  try {
    const contentType = request.headers.get("content-type") || ""
    console.log("[v0][PagSeguro Webhook] Content-Type:", contentType)

    let data: any

    if (contentType.includes("application/x-www-form-urlencoded")) {
      console.log("[v0][PagSeguro Webhook] Processando como form-urlencoded")
      const formData = await request.formData()
      const notificationCode = formData.get("notificationCode") as string
      const notificationType = formData.get("notificationType") as string

      console.log("[v0][PagSeguro Webhook] Form data recebido:", { notificationCode, notificationType })

      if (!notificationCode) {
        console.log("[v0][PagSeguro Webhook] ERRO: notificationCode não fornecido")
        return NextResponse.json({ success: false, error: "notificationCode não fornecido" }, { status: 400 })
      }

      // Buscar detalhes da transação na API do PagSeguro
      console.log("[v0][PagSeguro Webhook] Buscando detalhes da transação via API...")
      const token = process.env.PAGSEGURO_TOKEN
      const environment = process.env.PAGSEGURO_ENVIRONMENT || "sandbox"
      const baseUrl = environment === "production" ? "https://api.pagseguro.com" : "https://sandbox.api.pagseguro.com"

      const url = `${baseUrl}/charges/notifications/${notificationCode}`
      console.log("[v0][PagSeguro Webhook] URL da consulta:", url)

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      console.log("[v0][PagSeguro Webhook] Status da consulta:", response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.log("[v0][PagSeguro Webhook] ERRO na consulta:", errorText)
        return NextResponse.json({ success: false, error: "Erro ao consultar transação" }, { status: 500 })
      }

      data = await response.json()
      console.log("[v0][PagSeguro Webhook] Dados da transação obtidos:", JSON.stringify(data, null, 2))
    } else {
      // Eventos transacionais: JSON completo
      console.log("[v0][PagSeguro Webhook] Processando como JSON")
      data = await request.json()
      console.log("[v0][PagSeguro Webhook] JSON recebido:", JSON.stringify(data, null, 2))
    }

    const { charges } = data

    // Processar eventos transacionais (PAID, WAITING, etc)
    console.log("[v0][PagSeguro Webhook] Charges encontradas:", charges?.length || 0)

    if (charges && charges.length > 0) {
      for (const charge of charges) {
        const { id: pagseguroId, reference_id, status } = charge

        console.log("[v0][PagSeguro Webhook] Processando charge:", {
          pagseguroId,
          reference_id,
          status,
        })

        const boletoExistente = await query(`SELECT id, status FROM boletos WHERE pagseguro_id = ?`, [pagseguroId])

        console.log(
          "[v0][PagSeguro Webhook] Boleto encontrado:",
          boletoExistente.length > 0 ? boletoExistente[0] : "Não encontrado",
        )

        if (boletoExistente.length === 0) {
          console.log("[v0][PagSeguro Webhook] ERRO: Boleto não encontrado no banco:", pagseguroId)
          continue
        }

        // Atualizar boleto no banco de dados
        const statusMapeado = mapPagSeguroStatus(status)
        console.log("[v0][PagSeguro Webhook] Status mapeado:", status, "->", statusMapeado)

        const updateResult = await query(
          `UPDATE boletos 
           SET status = ?, 
               pagseguro_status = ?,
               webhook_notificado = TRUE,
               updated_at = CURRENT_TIMESTAMP
           WHERE pagseguro_id = ?`,
          [statusMapeado, status, pagseguroId],
        )

        console.log("[v0][PagSeguro Webhook] UPDATE executado, linhas afetadas:", updateResult)

        if (status === "PAID") {
          console.log("[v0][PagSeguro Webhook] Status PAID - atualizando data_pagamento")

          const paymentResult = await query(
            `UPDATE boletos 
             SET data_pagamento = CURRENT_TIMESTAMP
             WHERE pagseguro_id = ?`,
            [pagseguroId],
          )

          console.log("[v0][PagSeguro Webhook] Data pagamento atualizada, linhas afetadas:", paymentResult)

          // Processar cashback se configurado
          console.log("[v0][PagSeguro Webhook] Processando cashback...")
          await processarCashback(pagseguroId)
        }
      }
    } else {
      console.log("[v0][PagSeguro Webhook] AVISO: Nenhuma charge encontrada no payload")
    }

    console.log("[v0][PagSeguro Webhook] ===== PROCESSAMENTO CONCLUÍDO =====")
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0][PagSeguro Webhook] ERRO FATAL:", error)
    console.error("[v0][PagSeguro Webhook] Stack:", error instanceof Error ? error.stack : "N/A")
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
