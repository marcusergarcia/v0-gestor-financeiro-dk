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

      console.log("[v0][PagSeguro Webhook] Consultando API PagBank com notificationCode:", notificationCode)

      const token = process.env.PAGSEGURO_TOKEN
      const environment = process.env.PAGSEGURO_ENVIRONMENT || "sandbox"
      const baseUrl = environment === "production" ? "https://api.pagseguro.com" : "https://sandbox.api.pagseguro.com"

      try {
        // Tentar consultar via API v4 (moderna)
        const chargeResponse = await fetch(`${baseUrl}/charges/${notificationCode}`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })

        console.log("[v0][PagSeguro Webhook] Resposta API PagBank:", chargeResponse.status)

        if (chargeResponse.ok) {
          const chargeData = await chargeResponse.json()
          console.log("[v0][PagSeguro Webhook] Dados da charge:", JSON.stringify(chargeData, null, 2))

          const referenceId = chargeData.reference_id
          const status = chargeData.status

          console.log("[v0][PagSeguro Webhook] Reference ID (número boleto):", referenceId)
          console.log("[v0][PagSeguro Webhook] Status:", status)

          if (!referenceId) {
            console.log("[v0][PagSeguro Webhook] ERRO: reference_id não retornado pela API")
            return NextResponse.json({ success: true, message: "reference_id não encontrado" })
          }

          // Buscar boleto pelo número (reference_id)
          const boletosEncontrados = await query(`SELECT id, numero, status FROM boletos WHERE numero = ?`, [
            referenceId,
          ])

          console.log("[v0][PagSeguro Webhook] Boletos encontrados:", boletosEncontrados.length)

          if (boletosEncontrados.length > 0) {
            for (const boleto of boletosEncontrados) {
              console.log("[v0][PagSeguro Webhook] Atualizando boleto ID:", boleto.id, "| Número:", boleto.numero)

              // Atualizar para pago se status for PAID
              const statusMapeado = status === "PAID" ? "pago" : mapPagSeguroStatus(status)

              const updateResult = await query(
                `UPDATE boletos 
                 SET status = ?,
                     data_pagamento = ${status === "PAID" ? "CURRENT_TIMESTAMP" : "data_pagamento"},
                     webhook_notificado = TRUE,
                     updated_at = CURRENT_TIMESTAMP
                 WHERE id = ?`,
                [statusMapeado, boleto.id],
              )

              console.log("[v0][PagSeguro Webhook] Boleto atualizado:", {
                boletoId: boleto.id,
                statusMapeado,
                affectedRows: updateResult.affectedRows,
                changedRows: updateResult.changedRows,
              })

              // Processar cashback se pago
              if (status === "PAID") {
                await processarCashback(boleto.id)
              }
            }

            console.log("[v0][PagSeguro Webhook] ===== PROCESSAMENTO CONCLUÍDO =====")
            return NextResponse.json({ success: true, message: `${boletosEncontrados.length} boleto(s) atualizado(s)` })
          } else {
            console.log("[v0][PagSeguro Webhook] AVISO: Nenhum boleto encontrado com numero =", referenceId)
            return NextResponse.json({ success: true, message: "Boleto não encontrado, mas notificação aceita" })
          }
        } else {
          const errorText = await chargeResponse.text()
          console.log("[v0][PagSeguro Webhook] ERRO na API PagBank:", chargeResponse.status, errorText)
          return NextResponse.json({ success: true, message: "Erro ao consultar API PagBank, mas notificação aceita" })
        }
      } catch (apiError) {
        console.error("[v0][PagSeguro Webhook] ERRO ao consultar API:", apiError)
        return NextResponse.json({ success: true, message: "Erro de conexão com API, mas notificação aceita" })
      }
    } else {
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

        let boletoExistente = await query(`SELECT id, status, numero FROM boletos WHERE pagseguro_id = ?`, [
          pagseguroId,
        ])

        // Se não encontrar por pagseguro_id, tentar por reference_id
        if (boletoExistente.length === 0 && reference_id) {
          console.log("[v0][PagSeguro Webhook] Tentando buscar por reference_id:", reference_id)
          boletoExistente = await query(`SELECT id, status, numero FROM boletos WHERE numero = ?`, [reference_id])
        }

        console.log(
          "[v0][PagSeguro Webhook] Boleto encontrado:",
          boletoExistente.length > 0 ? JSON.stringify(boletoExistente[0]) : "Não encontrado",
        )

        if (boletoExistente.length === 0) {
          console.log(
            "[v0][PagSeguro Webhook] ERRO: Boleto não encontrado no banco. PagSeguro ID:",
            pagseguroId,
            "Reference ID:",
            reference_id,
          )
          continue
        }

        const boletoId = boletoExistente[0].id
        const statusAtual = boletoExistente[0].status

        // Atualizar boleto no banco de dados
        const statusMapeado = mapPagSeguroStatus(status)
        console.log(
          "[v0][PagSeguro Webhook] Status atual:",
          statusAtual,
          "| Status PagBank:",
          status,
          "| Status mapeado:",
          statusMapeado,
        )

        const updateResult = await query(
          `UPDATE boletos 
           SET status = ?, 
               pagseguro_status = ?,
               webhook_notificado = TRUE,
               updated_at = CURRENT_TIMESTAMP
           WHERE id = ?`,
          [statusMapeado, status, boletoId],
        )

        console.log("[v0][PagSeguro Webhook] UPDATE executado:", {
          affectedRows: updateResult.affectedRows,
          changedRows: updateResult.changedRows,
          boletoId,
          statusMapeado,
        })

        if (status === "PAID") {
          console.log("[v0][PagSeguro Webhook] Status PAID - atualizando data_pagamento para boleto ID:", boletoId)

          const paymentResult = await query(
            `UPDATE boletos 
             SET data_pagamento = CURRENT_TIMESTAMP
             WHERE id = ?`,
            [boletoId],
          )

          console.log("[v0][PagSeguro Webhook] Data pagamento atualizada:", {
            affectedRows: paymentResult.affectedRows,
            changedRows: paymentResult.changedRows,
          })

          // Processar cashback se configurado
          console.log("[v0][PagSeguro Webhook] Processando cashback...")
          await processarCashback(boletoId)
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

async function processarCashback(boletoId: string) {
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

    console.log(`[Cashback] Registrado R$ ${valorCashback} para cliente ${boleto.cliente_id}`)
  } catch (error) {
    console.error("[Cashback] Erro ao processar:", error)
  }
}
