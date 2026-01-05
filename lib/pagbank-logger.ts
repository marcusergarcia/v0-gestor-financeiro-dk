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
    output += "LOGS DE INTEGRAÇÃO PAGBANK - FORMATO PARA APROVAÇÃO\n"
    output += "Gerado em: " + new Date().toLocaleString("pt-BR") + "\n"
    output += "=".repeat(80) + "\n\n"

    logs.forEach((log, index) => {
      output += `\n${"=".repeat(80)}\n`
      output += `TRANSAÇÃO #${index + 1} - ${log.paymentType.toUpperCase()}\n`
      output += `${"=".repeat(80)}\n\n`

      output += "REQUEST:\n"
      output += "-".repeat(80) + "\n"
      output += `POST ${log.endpoint}\n`
      output += `Content-Type: application/json\n`
      output += `Authorization: Bearer ${process.env.PAGSEGURO_TOKEN ? "***" + process.env.PAGSEGURO_TOKEN.slice(-8) : "***"}\n`
      output += `\nBody:\n`
      output += JSON.stringify(log.request, null, 2) + "\n\n"

      output += "RESPONSE:\n"
      output += "-".repeat(80) + "\n"
      output += `HTTP ${log.status}\n`
      output += `\nBody:\n`
      output += JSON.stringify(log.response, null, 2) + "\n\n"

      output += "RESULTADO:\n"
      output += "-".repeat(80) + "\n"

      if (log.response && typeof log.response === "object") {
        if (log.response.error) {
          output += `❌ ERRO: ${log.response.error}\n`
          if (log.response.error_messages) {
            log.response.error_messages.forEach((msg: any) => {
              output += `   ${msg.description || msg}\n`
            })
          }
        } else {
          output += `✅ SUCESSO\n`
          if (log.request?.reference_id) {
            output += `reference_id: ${log.request.reference_id}\n`
          }
          if (log.response.id) {
            output += `order_id: ${log.response.id}\n`
          }
          if (log.response.charges && log.response.charges[0]) {
            const charge = log.response.charges[0]
            output += `charge_id: ${charge.id}\n`
            output += `status: ${charge.status}\n`

            if (charge.payment_method?.boleto) {
              const boleto = charge.payment_method.boleto
              if (boleto.id) output += `boleto_id: ${boleto.id}\n`
              if (boleto.barcode) output += `barcode: ${boleto.barcode}\n`
              if (boleto.formatted_barcode) output += `linha_digitavel: ${boleto.formatted_barcode}\n`
            }
          }
        }
      }

      output += "\n"
    })

    output += "\n" + "=".repeat(80) + "\n"
    output += `TOTAL DE TRANSAÇÕES: ${logs.length}\n`
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
