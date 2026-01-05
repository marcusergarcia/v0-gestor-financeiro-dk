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
  orderId?: string
  chargeId?: string
  referenceId?: string
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
        (timestamp, method, endpoint, request_data, response_data, status, payment_type, success, order_id, charge_id, reference_id) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          logEntry.timestamp ?? null,
          logEntry.method ?? null,
          logEntry.endpoint ?? null,
          logEntry.request ? JSON.stringify(logEntry.request) : null,
          logEntry.response ? JSON.stringify(logEntry.response) : null,
          logEntry.status ?? null,
          logEntry.paymentType ?? null,
          logEntry.success ?? false,
          logEntry.orderId ?? null,
          logEntry.chargeId ?? null,
          logEntry.referenceId ?? null,
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
          success,
          order_id as orderId,
          charge_id as chargeId,
          reference_id as referenceId
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
    let output = ""

    logs.forEach((log, index) => {
      const timestamp = new Date(log.timestamp).toLocaleString("pt-BR", {
        timeZone: "America/Sao_Paulo",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })

      output += `[${timestamp}] REQUEST\n`
      output += `${log.method} ${log.endpoint}\n`
      output += `Headers:\n`
      output += `  Content-Type: application/json\n`
      output += `  Authorization: Bearer ${process.env.PAGSEGURO_TOKEN ? "***" + process.env.PAGSEGURO_TOKEN.slice(-8) : "***"}\n`
      output += `\nBody:\n`
      output += JSON.stringify(log.request, null, 2) + "\n\n"

      output += `[${timestamp}] RESPONSE\n`
      output += `HTTP ${log.status}\n`
      output += `Body:\n`
      output += JSON.stringify(log.response, null, 2) + "\n\n"

      output += "-".repeat(80) + "\n\n"
    })

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
  request?: any
  request_body?: any
  response?: any
  response_body?: any
  status?: number
  response_status?: number
  success?: boolean
  order_id?: string
  charge_id?: string
  reference_id?: string
}) {
  const requestData = data.request_body || data.request || {}
  const responseData = data.response_body || data.response || {}
  const statusCode = data.response_status || data.status || (data.success !== false ? 201 : 400)

  await PagBankLogger.log({
    method: data.method ?? "UNKNOWN",
    endpoint: data.endpoint ?? "",
    request: requestData,
    response: responseData,
    status: statusCode,
    paymentType: data.method ?? "UNKNOWN",
    success: data.success !== false,
    orderId: data.order_id,
    chargeId: data.charge_id,
    referenceId: data.reference_id,
  })
}
