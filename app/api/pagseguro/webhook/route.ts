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
      console.log("[v0][PagSeguro Webhook] ⚠️  FORMATO ANTIGO DETECTADO (API v3)")
      console.log("[v0][PagSeguro Webhook] ⚠️  Configure o webhook no PagBank para enviar JSON (API v4)")
      console.log(
        "[v0][PagSeguro Webhook] ⚠️  Acesse: https://minhaconta.pagseguro.uol.com.br/preferencias/integracoes.jhtml",
      )

      const formData = await request.formData()
      const notificationCode = formData.get("notificationCode") as string

      console.log("[v0][PagSeguro Webhook] notificationCode recebido:", notificationCode)
      console.log("[v0][PagSeguro Webhook] ❌ Não é possível processar - precisa de formato JSON (API v4)")

      // Retornar sucesso para não ficar recebendo tentativas infinitas
      return NextResponse.json({
        success: true,
        message: "Webhook configurado incorretamente. Use formato JSON da API v4",
      })
    }

    console.log("[v0][PagSeguro Webhook] ✅ Formato correto detectado (JSON - API v4)")
    data = await request.json()
    console.log("[v0][PagSeguro Webhook] Payload completo:", JSON.stringify(data, null, 2))

    const { charges, reference_id: orderReferenceId } = data

    console.log("[v0][PagSeguro Webhook] reference_id do pedido:", orderReferenceId || "NÃO ENCONTRADO")
    console.log("[v0][PagSeguro Webhook] Charges encontradas:", charges?.length || 0)

    if (!charges || charges.length === 0) {
      console.log("[v0][PagSeguro Webhook] ⚠️  Nenhuma charge no payload")
      return NextResponse.json({ success: true, message: "Nenhuma charge para processar" })
    }

    for (const charge of charges) {
      const { id: chargeId, reference_id, status, payment_method } = charge

      console.log("[v0][PagSeguro Webhook] ===== PROCESSANDO CHARGE =====")
      console.log("[v0][PagSeguro Webhook] Charge ID:", chargeId)
      console.log("[v0][PagSeguro Webhook] Reference ID:", reference_id)
      console.log("[v0][PagSeguro Webhook] Status:", status)

      if (!reference_id) {
        console.log("[v0][PagSeguro Webhook] ❌ reference_id não encontrado nesta charge")
        continue
      }

      console.log("[v0][PagSeguro Webhook] 🔍 Buscando boleto com numero =", reference_id)

      const boletosEncontrados = await query(
        `SELECT id, numero, status, valor, cliente_id FROM boletos WHERE numero = ?`,
        [reference_id],
      )

      console.log("[v0][PagSeguro Webhook] Boletos encontrados:", boletosEncontrados.length)

      if (boletosEncontrados.length === 0) {
        console.log("[v0][PagSeguro Webhook] ❌ Boleto NÃO ENCONTRADO no banco com numero:", reference_id)
        continue
      }

      const boleto = boletosEncontrados[0]
      console.log("[v0][PagSeguro Webhook] ✅ Boleto encontrado:")
      console.log("[v0][PagSeguro Webhook]   - ID:", boleto.id)
      console.log("[v0][PagSeguro Webhook]   - Número:", boleto.numero)
      console.log("[v0][PagSeguro Webhook]   - Status atual:", boleto.status)
      console.log("[v0][PagSeguro Webhook]   - Valor:", boleto.valor)

      const statusMapeado = mapPagSeguroStatus(status)
      console.log("[v0][PagSeguro Webhook] Status PagBank:", status, "-> Status local:", statusMapeado)

      if (status === "PAID") {
        console.log("[v0][PagSeguro Webhook] 💰 STATUS PAGO - Atualizando boleto...")

        const updateResult = await query(
          `UPDATE boletos 
           SET status = 'pago',
               data_pagamento = CURRENT_TIMESTAMP,
               pagseguro_status = ?,
               webhook_notificado = TRUE,
               updated_at = CURRENT_TIMESTAMP
           WHERE id = ?`,
          [status, boleto.id],
        )

        console.log("[v0][PagSeguro Webhook] ✅ Boleto atualizado para PAGO")
        console.log("[v0][PagSeguro Webhook]   - Linhas afetadas:", updateResult.affectedRows)
        console.log("[v0][PagSeguro Webhook]   - Linhas modificadas:", updateResult.changedRows)

        // Processar cashback
        await processarCashback(boleto.id)
      } else {
        console.log("[v0][PagSeguro Webhook] Atualizando status do boleto...")

        const updateResult = await query(
          `UPDATE boletos 
           SET status = ?,
               pagseguro_status = ?,
               webhook_notificado = TRUE,
               updated_at = CURRENT_TIMESTAMP
           WHERE id = ?`,
          [statusMapeado, status, boleto.id],
        )

        console.log("[v0][PagSeguro Webhook] ✅ Boleto atualizado")
        console.log("[v0][PagSeguro Webhook]   - Novo status:", statusMapeado)
        console.log("[v0][PagSeguro Webhook]   - Linhas afetadas:", updateResult.affectedRows)
      }
    }

    console.log("[v0][PagSeguro Webhook] ===== PROCESSAMENTO CONCLUÍDO =====")
    return NextResponse.json({ success: true, message: "Webhook processado com sucesso" })
  } catch (error) {
    console.error("[v0][PagSeguro Webhook] ❌ ERRO FATAL:", error)
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
    const boletos = await query(
      `SELECT b.*, c.telefone, c.id as cliente_id
       FROM boletos b
       JOIN clientes c ON b.cliente_id = c.id
       WHERE b.id = ?`,
      [boletoId],
    )

    if (boletos.length === 0) return

    const boleto = boletos[0]

    const configs = await query(`SELECT valor FROM configuracoes_pagseguro WHERE chave = 'cashback_ativo'`)
    if (configs.length === 0 || configs[0].valor !== "true") return

    const percentualConfigs = await query(
      `SELECT valor FROM configuracoes_pagseguro WHERE chave = 'cashback_percentual_padrao'`,
    )

    const percentual = percentualConfigs.length > 0 ? Number.parseFloat(percentualConfigs[0].valor) : 2.0
    const valorCashback = (boleto.valor * percentual) / 100

    await query(
      `INSERT INTO cashback 
       (cliente_id, telefone, valor_compra, percentual_cashback, valor_cashback, status, boleto_id, data_compra)
       VALUES (?, ?, ?, ?, ?, 'disponivel', ?, CURRENT_TIMESTAMP)`,
      [boleto.cliente_id, boleto.telefone, boleto.valor, percentual, valorCashback, boletoId],
    )

    console.log(`[v0][Cashback] ✅ Registrado R$ ${valorCashback} para cliente ${boleto.cliente_id}`)
  } catch (error) {
    console.error("[v0][Cashback] ❌ Erro ao processar:", error)
  }
}
