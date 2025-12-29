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
          logEntry.timestamp,
          logEntry.method,
          logEntry.endpoint,
          JSON.stringify(logEntry.request),
          JSON.stringify(logEntry.response),
          logEntry.status,
          logEntry.paymentType,
          logEntry.success,
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
    output += "=".repeat(80) + "\n\n"

    logs.forEach((log, index) => {
      output += `\n${"=".repeat(80)}\n`
      output += `TRANSAÇÃO #${index + 1} - ${log.paymentType.toUpperCase()}\n`
      output += `Data/Hora: ${log.timestamp}\n`
      output += `Método: ${log.method} ${log.endpoint}\n`
      output += `Status: ${log.status}\n`
      output += `Sucesso: ${log.success ? "SIM" : "NÃO"}\n`
      output += `${"=".repeat(80)}\n\n`

      output += "REQUEST:\n"
      output += "-".repeat(80) + "\n"
      output += JSON.stringify(log.request, null, 2) + "\n\n"

      output += "RESPONSE:\n"
      output += "-".repeat(80) + "\n"
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
  success: boolean
}) {
  await PagBankLogger.log({
    method: data.method,
    endpoint: data.endpoint,
    request: data.request,
    response: data.response,
    status: data.success ? 200 : 400,
    paymentType: data.method,
    success: data.success,
  })
}
