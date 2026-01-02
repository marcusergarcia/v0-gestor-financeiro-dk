import { query } from "@/lib/db"

interface PagBankLogEntry {
  id?: number
  timestamp: string
  method: string
  endpoint: string
  request: any
  response: any
  status: number
  paymentType: string
  success: boolean
}

export class PagBankLogger {
  static async log(entry: Omit<PagBankLogEntry, "timestamp" | "id">) {
    const logEntry: Omit<PagBankLogEntry, "id"> = {
      timestamp: new Date().toISOString(),
      ...entry,
    }

    console.log("[PagBank Logger] Registrando transação:", {
      paymentType: entry.paymentType,
      method: entry.method,
      status: entry.status,
    })

    try {
      await query(
        `INSERT INTO pagbank_logs 
        (timestamp, method, endpoint, request_data, response_data, status, payment_type, success) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          logEntry.timestamp ?? null,
          logEntry.method ?? null,
          logEntry.endpoint ?? null,
          logEntry.request ? JSON.stringify(logEntry.request) : null,
          logEntry.response ? JSON.stringify(logEntry.response) : null,
          logEntry.status ?? null,
          logEntry.paymentType ?? null,
          logEntry.success ?? false,
        ],
      )
      console.log("[PagBank Logger] Log salvo no banco com sucesso")
    } catch (error) {
      console.error("[PagBank Logger] Erro ao salvar log:", error)
    }
  }

  static async getLogs(): Promise<PagBankLogEntry[]> {
    try {
      const logs = await query(
        `SELECT 
          id,
          timestamp,
          method,
          endpoint,
          request_data as request,
          response_data as response,
          status,
          payment_type as paymentType,
          success
        FROM pagbank_logs 
        ORDER BY timestamp DESC 
        LIMIT 100`,
      )

      return logs.map((log: any) => ({
        ...log,
        request: JSON.parse(log.request),
        response: JSON.parse(log.response),
      }))
    } catch (error) {
      console.error("[PagBank Logger] Erro ao ler logs:", error)
      return []
    }
  }

  static async getFormattedLogs(): Promise<string> {
    const logs = await this.getLogs()
    let output = "=".repeat(80) + "\n"
    output += "LOGS DE INTEGRAÇÃO PAGBANK - GESTOR FINANCEIRO\n"
    output += "Gerado em: " + new Date().toLocaleString("pt-BR") + "\n"
    output += "=".repeat(80) + "\n\n"

    logs.forEach((log, index) => {
      output += `\n${"=".repeat(80)}\n`
      output += `TRANSAÇÃO #${index + 1} - ${log.paymentType.toUpperCase()}\n`
      output += `Data/Hora: ${new Date(log.timestamp).toLocaleString("pt-BR")}\n`
      output += `Endpoint: ${log.method} ${log.endpoint}\n`
      output += `Status HTTP: ${log.status}\n`
      output += `Resultado: ${log.success ? "✓ SUCESSO" : "✗ ERRO"}\n`
      output += `${"=".repeat(80)}\n\n`

      output += "REQUEST (Dados enviados ao PagBank):\n"
      output += "-".repeat(80) + "\n"

      if (log.request && typeof log.request === "object") {
        // Mostrar dados principais de forma organizada
        if (log.request.reference_id) {
          output += `Reference ID: ${log.request.reference_id}\n`
        }
        if (log.request.customer) {
          output += `\nCliente:\n`
          output += `  Nome: ${log.request.customer.name}\n`
          output += `  Email: ${log.request.customer.email}\n`
          output += `  CPF/CNPJ: ${log.request.customer.tax_id}\n`
          if (log.request.customer.phones && log.request.customer.phones[0]) {
            const phone = log.request.customer.phones[0]
            output += `  Telefone: +${phone.country} (${phone.area}) ${phone.number}\n`
          }
        }
        if (log.request.items) {
          output += `\nItens:\n`
          log.request.items.forEach((item: any, i: number) => {
            output += `  ${i + 1}. ${item.name} - R$ ${(item.unit_amount / 100).toFixed(2)} x ${item.quantity}\n`
          })
        }
        if (log.request.shipping?.address) {
          const addr = log.request.shipping.address
          output += `\nEndereço de Entrega:\n`
          output += `  ${addr.street}, ${addr.number}\n`
          if (addr.complement) output += `  ${addr.complement}\n`
          output += `  ${addr.locality} - ${addr.city}/${addr.region_code}\n`
          output += `  CEP: ${addr.postal_code}\n`
        }
        if (log.request.charges && log.request.charges[0]) {
          const charge = log.request.charges[0]
          output += `\nCobrança:\n`
          output += `  Valor: R$ ${(charge.amount.value / 100).toFixed(2)}\n`
          output += `  Descrição: ${charge.description}\n`

          if (charge.payment_method?.boleto) {
            const boleto = charge.payment_method.boleto
            output += `\nDados do Boleto:\n`
            output += `  Vencimento: ${boleto.due_date}\n`
            output += `  Template: ${boleto.template}\n`
            output += `  Dias até expiração: ${boleto.days_until_expiration}\n`

            if (boleto.holder) {
              output += `\nTitular do Boleto:\n`
              output += `  Nome: ${boleto.holder.name}\n`
              output += `  CPF/CNPJ: ${boleto.holder.tax_id}\n`
              output += `  Email: ${boleto.holder.email}\n`

              if (boleto.holder.address) {
                const addr = boleto.holder.address
                output += `  Endereço: ${addr.street}, ${addr.number}\n`
                output += `  ${addr.locality} - ${addr.city}/${addr.region_code}\n`
                output += `  ${addr.region} - ${addr.country}\n`
                output += `  CEP: ${addr.postal_code}\n`
              }
            }

            if (boleto.instruction_lines) {
              output += `\nInstruções:\n`
              output += `  1. ${boleto.instruction_lines.line_1}\n`
              if (boleto.instruction_lines.line_2) {
                output += `  2. ${boleto.instruction_lines.line_2}\n`
              }
            }
          }

          if (charge.payment_instructions) {
            output += `\nInstruções de Pagamento:\n`
            if (charge.payment_instructions.fine) {
              output += `  Multa: ${charge.payment_instructions.fine.value / 100}% a partir de ${charge.payment_instructions.fine.date}\n`
            }
            if (charge.payment_instructions.interest) {
              output += `  Juros: ${charge.payment_instructions.interest.value / 100}% ao dia a partir de ${charge.payment_instructions.interest.date}\n`
            }
          }
        }

        output += `\nJSON Completo:\n`
      }

      output += JSON.stringify(log.request, null, 2) + "\n\n"

      output += "RESPONSE (Resposta do PagBank):\n"
      output += "-".repeat(80) + "\n"

      if (log.response && typeof log.response === "object") {
        if (log.response.error) {
          output += `⚠️ ERRO: ${log.response.error}\n\n`
        } else if (log.response.id) {
          output += `Order ID: ${log.response.id}\n`
          if (log.response.charges && log.response.charges[0]) {
            const charge = log.response.charges[0]
            output += `Charge ID: ${charge.id}\n`
            output += `Status: ${charge.status}\n`

            if (charge.payment_method?.boleto) {
              const boleto = charge.payment_method.boleto
              output += `\nDados do Boleto Gerado:\n`
              if (boleto.barcode) output += `  Código de Barras: ${boleto.barcode}\n`
              if (boleto.formatted_barcode) output += `  Linha Digitável: ${boleto.formatted_barcode}\n`
            }

            if (charge.links) {
              output += `\nLinks:\n`
              charge.links.forEach((link: any) => {
                output += `  ${link.rel}: ${link.href}\n`
              })
            }
          }
        }

        output += `\nJSON Completo:\n`
      }

      output += JSON.stringify(log.response, null, 2) + "\n\n"
    })

    output += "\n" + "=".repeat(80) + "\n"
    output += `Total de transações registradas: ${logs.length}\n`
    output += "=".repeat(80) + "\n"

    return output
  }

  static async clearLogs(): Promise<void> {
    try {
      await query(`DELETE FROM pagbank_logs`)
      console.log("[PagBank Logger] Logs limpos com sucesso")
    } catch (error) {
      console.error("[PagBank Logger] Erro ao limpar logs:", error)
    }
  }
}

export async function logPagBankTransaction(data: {
  method: string
  endpoint: string
  request: any
  response: any
  status?: number
  success: boolean
}) {
  await PagBankLogger.log({
    method: data.method ?? "UNKNOWN",
    endpoint: data.endpoint ?? "",
    request: data.request ?? {},
    response: data.response ?? {},
    status: data.status ?? (data.success ? 200 : 400),
    paymentType: data.method ?? "UNKNOWN",
    success: data.success ?? false,
  })
}
