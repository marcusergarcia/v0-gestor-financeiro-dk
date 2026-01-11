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

  try {
    const contentType = request.headers.get("content-type") || ""
    console.log("[v0][PagSeguro Webhook] Content-Type:", contentType)

    if (contentType.includes("application/json")) {
      console.log("[v0][PagSeguro Webhook] Processando webhook JSON (API v4)")
      const data = await request.json()
      console.log("[v0][PagSeguro Webhook] JSON completo recebido:", JSON.stringify(data, null, 2))

      const { id, reference_id, charges } = data

      console.log("[v0][PagSeguro Webhook] Order ID:", id)
      console.log("[v0][PagSeguro Webhook] Reference ID (número boleto):", reference_id)
      console.log("[v0][PagSeguro Webhook] Charges encontradas:", charges?.length || 0)

      let boletosEncontrados = []

      if (reference_id) {
        console.log("[v0][PagSeguro Webhook] Buscando boleto pelo numero (reference_id) =", reference_id)
        boletosEncontrados = await query(`SELECT id, numero, status FROM boletos WHERE numero = ?`, [reference_id])
      }

      if (boletosEncontrados.length === 0 && id) {
        console.log("[v0][PagSeguro Webhook] Nenhum boleto encontrado pelo reference_id, tentando por order_id =", id)
        boletosEncontrados = await query(`SELECT id, numero, status FROM boletos WHERE order_id = ?`, [id])
      }

      console.log("[v0][PagSeguro Webhook] Boletos encontrados:", boletosEncontrados.length)

      if (boletosEncontrados.length > 0) {
        // Verificar status nas charges
        let statusPagamento = "WAITING"

        if (charges && charges.length > 0) {
          const charge = charges[0]
          statusPagamento = charge.status || "WAITING"
          console.log("[v0][PagSeguro Webhook] Status da charge:", statusPagamento)
        }

        for (const boleto of boletosEncontrados) {
          console.log("[v0][PagSeguro Webhook] Atualizando boleto ID:", boleto.id, "| Número:", boleto.numero)

          const statusMapeado = mapPagSeguroStatus(statusPagamento)

          const updateResult = await query(
            `UPDATE boletos 
             SET status = ?,
                 data_pagamento = ${statusPagamento === "PAID" ? "CURRENT_TIMESTAMP" : "data_pagamento"},
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

          if (statusPagamento === "PAID") {
            console.log("[v0][PagSeguro Webhook] Processando cashback para boleto pago")
            await processarCashback(boleto.id)
          }
        }

        console.log("[v0][PagSeguro Webhook] ===== PROCESSAMENTO CONCLUÍDO =====")
        return NextResponse.json({ success: true, message: `${boletosEncontrados.length} boleto(s) atualizado(s)` })
      } else {
        console.log("[v0][PagSeguro Webhook] AVISO: Nenhum boleto encontrado com reference_id ou order_id")
        return NextResponse.json({ success: true, message: "Boleto não encontrado, mas notificação aceita" })
      }
    }

    if (contentType.includes("application/x-www-form-urlencoded")) {
      console.log("[v0][PagSeguro Webhook] Processando como form-urlencoded (API v3 antiga)")
      const formData = await request.formData()

      const notificationCode = formData.get("notificationCode") as string
      const notificationType = formData.get("notificationType") as string

      console.log("[v0][PagSeguro Webhook] NotificationCode:", notificationCode)
      console.log("[v0][PagSeguro Webhook] NotificationType:", notificationType)

      if (notificationCode && notificationType === "transaction") {
        try {
          const token = process.env.PAGSEGURO_TOKEN
          const email = process.env.PAGSEGURO_EMAIL || "suporte@pagseguro.com.br"
          const baseUrl =
            process.env.PAGSEGURO_ENVIRONMENT === "production"
              ? "https://ws.pagseguro.uol.com.br"
              : "https://ws.sandbox.pagseguro.uol.com.br"

          const apiUrl = `${baseUrl}/v3/transactions/notifications/${notificationCode}?email=${encodeURIComponent(email)}&token=${token}`

          console.log("[v0][PagSeguro Webhook] Consultando API v3:", apiUrl.replace(token || "", "***TOKEN***"))

          const response = await fetch(apiUrl, {
            method: "GET",
            headers: {
              "Content-Type": "application/xml; charset=ISO-8859-1",
            },
          })

          console.log("[v0][PagSeguro Webhook] Resposta API v3 Status:", response.status)

          if (response.ok) {
            const xmlText = await response.text()
            console.log("[v0][PagSeguro Webhook] XML recebido (primeiros 500 chars):", xmlText.substring(0, 500))

            const referenceMatch = xmlText.match(/<reference>([^<]+)<\/reference>/)
            const statusMatch = xmlText.match(/<status>(\d+)<\/status>/)

            const reference = referenceMatch ? referenceMatch[1] : null
            const statusCode = statusMatch ? Number.parseInt(statusMatch[1]) : null

            console.log("[v0][PagSeguro Webhook] Reference extraído:", reference)
            console.log("[v0][PagSeguro Webhook] Status code extraído:", statusCode)

            if (reference) {
              console.log("[v0][PagSeguro Webhook] Buscando boleto pelo numero =", reference)

              const boletosEncontrados = await query(`SELECT id, numero, status FROM boletos WHERE numero = ?`, [
                reference,
              ])

              console.log("[v0][PagSeguro Webhook] Boletos encontrados:", boletosEncontrados.length)

              if (boletosEncontrados.length > 0) {
                // 1=Aguardando pagamento, 2=Em análise, 3=Paga, 4=Disponível, 6=Devolvida, 7=Cancelada
                let statusMapeado = "pendente"
                if (statusCode === 3 || statusCode === 4) {
                  statusMapeado = "pago"
                } else if (statusCode === 7) {
                  statusMapeado = "cancelado"
                }

                console.log("[v0][PagSeguro Webhook] Status mapeado:", statusMapeado)

                for (const boleto of boletosEncontrados) {
                  console.log("[v0][PagSeguro Webhook] Atualizando boleto ID:", boleto.id)

                  const updateResult = await query(
                    `UPDATE boletos 
                     SET status = ?,
                         data_pagamento = ${statusMapeado === "pago" ? "CURRENT_TIMESTAMP" : "data_pagamento"},
                         updated_at = CURRENT_TIMESTAMP
                     WHERE id = ?`,
                    [statusMapeado, boleto.id],
                  )

                  console.log("[v0][PagSeguro Webhook] Resultado UPDATE:", {
                    affectedRows: updateResult.affectedRows,
                    changedRows: updateResult.changedRows,
                  })

                  if (statusMapeado === "pago") {
                    console.log("[v0][PagSeguro Webhook] Processando cashback para boleto pago")
                    await processarCashback(boleto.id)
                  }
                }

                console.log("[v0][PagSeguro Webhook] ===== PROCESSAMENTO CONCLUÍDO =====")
                return NextResponse.json({
                  success: true,
                  message: `${boletosEncontrados.length} boleto(s) atualizado(s)`,
                })
              } else {
                console.log("[v0][PagSeguro Webhook] AVISO: Nenhum boleto encontrado com numero =", reference)
                return NextResponse.json({ success: true, message: "Boleto não encontrado" })
              }
            } else {
              console.log("[v0][PagSeguro Webhook] AVISO: Reference não encontrado no XML")
              return NextResponse.json({ success: true, message: "Reference não encontrado no XML" })
            }
          } else {
            const errorText = await response.text()
            console.error("[v0][PagSeguro Webhook] Erro API v3:", response.status, errorText.substring(0, 500))
            return NextResponse.json({ success: true, message: "Erro ao consultar API v3, mas notificação aceita" })
          }
        } catch (error) {
          console.error("[v0][PagSeguro Webhook] Erro ao consultar API v3:", error)
          return NextResponse.json({ success: true, message: "Erro ao processar, mas notificação aceita" })
        }
      }

      console.log("[v0][PagSeguro Webhook] Webhook API v3 recebido - retornando sucesso")
      return NextResponse.json({ success: true, message: "Notificação API v3 aceita" })
    }

    console.log("[v0][PagSeguro Webhook] Content-Type não reconhecido")
    return NextResponse.json({ success: true, message: "Content-Type não reconhecido, mas aceito" })
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
