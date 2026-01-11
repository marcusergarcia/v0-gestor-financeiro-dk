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

    let data: any

    if (contentType.includes("application/x-www-form-urlencoded")) {
      console.log("[v0][PagSeguro Webhook] Processando como form-urlencoded")
      const formData = await request.formData()

      const allFields: Record<string, any> = {}
      formData.forEach((value, key) => {
        allFields[key] = value
      })

      console.log("[v0][PagSeguro Webhook] ===== TODOS OS CAMPOS DO FORM-DATA =====")
      console.log(JSON.stringify(allFields, null, 2))
      console.log("[v0][PagSeguro Webhook] ===== FIM DOS CAMPOS =====")

      const notificationCode = formData.get("notificationCode") as string
      const notificationType = formData.get("notificationType") as string

      const referenceIdDireto = formData.get("reference_id") as string
      const barcodeDireto = formData.get("barcode") as string
      const formattedBarcode = formData.get("formatted_barcode") as string

      console.log("[v0][PagSeguro Webhook] Campos principais:", {
        notificationCode,
        notificationType,
        referenceIdDireto,
        barcodeDireto,
        formattedBarcode,
      })

      if (referenceIdDireto) {
        console.log("[v0][PagSeguro Webhook] ENCONTRADO reference_id DIRETO no webhook:", referenceIdDireto)
        console.log("[v0][PagSeguro Webhook] Buscando boleto pelo numero =", referenceIdDireto)

        const boletosEncontrados = await query(`SELECT id, numero, status FROM boletos WHERE numero = ?`, [
          referenceIdDireto,
        ])

        if (boletosEncontrados.length > 0) {
          console.log("[v0][PagSeguro Webhook] Boleto encontrado! Atualizando para pago...")

          for (const boleto of boletosEncontrados) {
            const updateResult = await query(
              `UPDATE boletos 
               SET status = 'pago',
                   data_pagamento = CURRENT_TIMESTAMP,
                   webhook_notificado = TRUE,
                   updated_at = CURRENT_TIMESTAMP
               WHERE id = ?`,
              [boleto.id],
            )

            console.log("[v0][PagSeguro Webhook] Boleto atualizado:", {
              boletoId: boleto.id,
              affectedRows: updateResult.affectedRows,
            })

            await processarCashback(boleto.id)
          }

          return NextResponse.json({ success: true, message: "Boleto atualizado com sucesso via reference_id direto" })
        } else {
          console.log("[v0][PagSeguro Webhook] ERRO: Boleto não encontrado com numero =", referenceIdDireto)
        }
      }

      if (!notificationCode) {
        console.log("[v0][PagSeguro Webhook] ERRO: notificationCode não fornecido")
        return NextResponse.json({ success: false, error: "notificationCode não fornecido" }, { status: 400 })
      }

      console.log("[v0][PagSeguro Webhook] Consultando API v3 PagSeguro (XML) com notificationCode:", notificationCode)

      const token = process.env.PAGSEGURO_TOKEN
      const email = process.env.PAGSEGURO_EMAIL || "suporte@pagseguro.com.br"
      const environment = process.env.PAGSEGURO_ENVIRONMENT || "sandbox"
      const baseUrlV3 =
        environment === "production" ? "https://ws.pagseguro.uol.com.br" : "https://ws.sandbox.pagseguro.uol.com.br"

      try {
        // Consultar API v3 com notificationCode - requer email + token
        const apiUrl = `${baseUrlV3}/v3/transactions/notifications/${notificationCode}?email=${encodeURIComponent(email)}&token=${token}`
        console.log(
          "[v0][PagSeguro Webhook] URL da API v3:",
          apiUrl.replace(token, "***TOKEN***").replace(email, "***EMAIL***"),
        )

        const transactionResponse = await fetch(apiUrl, {
          method: "GET",
          headers: {
            Accept: "application/xml",
            "Content-Type": "application/xml; charset=UTF-8",
          },
        })

        console.log("[v0][PagSeguro Webhook] Resposta API v3 PagSeguro:", transactionResponse.status)

        if (transactionResponse.ok) {
          const xmlText = await transactionResponse.text()
          console.log("[v0][PagSeguro Webhook] ===== XML COMPLETO RECEBIDO =====")
          console.log(xmlText)
          console.log("[v0][PagSeguro Webhook] ===== FIM DO XML =====")

          // Parse simples do XML para extrair reference e status
          const referenceMatch = xmlText.match(/<reference>(.*?)<\/reference>/)
          const statusMatch = xmlText.match(/<status>(\d+)<\/status>/)
          const codeMatch = xmlText.match(/<code>(.*?)<\/code>/)

          const referenceId = referenceMatch ? referenceMatch[1] : null
          const statusCode = statusMatch ? statusMatch[1] : null
          const transactionCode = codeMatch ? codeMatch[1] : null

          console.log("[v0][PagSeguro Webhook] Dados extraídos do XML:", {
            referenceId,
            statusCode,
            transactionCode,
          })
          console.log("[v0][PagSeguro Webhook] Reference extraído:", referenceId || "NÃO ENCONTRADO")
          console.log("[v0][PagSeguro Webhook] Status extraído:", statusCode || "NÃO ENCONTRADO")

          if (!referenceId) {
            console.log("[v0][PagSeguro Webhook] ERRO: reference não encontrado no XML")
            return NextResponse.json({ success: true, message: "reference não encontrado no XML" })
          }

          // Mapear código numérico de status da API v3 para status string
          const statusNumericoParaString: Record<string, string> = {
            "1": "WAITING", // Aguardando pagamento
            "2": "IN_ANALYSIS", // Em análise
            "3": "PAID", // Paga
            "4": "AVAILABLE", // Disponível
            "5": "IN_DISPUTE", // Em disputa
            "6": "RETURNED", // Devolvida
            "7": "CANCELED", // Cancelada
          }

          const status = statusCode ? statusNumericoParaString[statusCode] || "WAITING" : "WAITING"
          console.log("[v0][PagSeguro Webhook] Status mapeado:", statusCode, "->", status)

          // Buscar boleto pelo número (reference_id)
          console.log("[v0][PagSeguro Webhook] Buscando boleto com numero (reference_id) =", referenceId)

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
                console.log("[v0][PagSeguro Webhook] Processando cashback para boleto pago")
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
          const errorText = await transactionResponse.text()
          console.log("[v0][PagSeguro Webhook] ERRO na API v3 PagSeguro:", transactionResponse.status, errorText)
          return NextResponse.json({ success: true, message: "Erro ao consultar API v3, mas notificação aceita" })
        }
      } catch (apiError) {
        console.error("[v0][PagSeguro Webhook] ERRO ao consultar API v3:", apiError)
        return NextResponse.json({ success: true, message: "Erro de conexão com API v3, mas notificação aceita" })
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
