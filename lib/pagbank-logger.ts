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
  orderId?: string | null
  chargeId?: string | null
  referenceId?: string | null
}

export class PagBankLogger {
  static async log(entry: Omit<PagBankLogEntry, "timestamp" | "id">) {
    const logEntry: Omit<PagBankLogEntry, "id"> = {
      timestamp: new Date().toISOString(),
      ...entry,
    }

    try {
      const values = [
        logEntry.timestamp,
        logEntry.method || "POST",
        logEntry.endpoint || "",
        JSON.stringify(logEntry.request || {}),
        JSON.stringify(logEntry.response || {}),
        logEntry.status || 200,
        logEntry.paymentType || "UNKNOWN",
        logEntry.success ? 1 : 0,
        logEntry.orderId ?? null,
        logEntry.chargeId ?? null,
        logEntry.referenceId ?? null,
      ]

      const result = await query(
        `INSERT INTO pagbank_logs 
        (timestamp, method, endpoint, request_data, response_data, status, payment_type, success, order_id, charge_id, reference_id) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        values,
      )

      return result
    } catch (error) {
      console.error("Erro ao salvar log PagBank:", error)
      throw error
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
        request: log.request ? JSON.parse(log.request) : {},
        response: log.response ? JSON.parse(log.response) : {},
      }))
    } catch (error) {
      console.error("Erro ao ler logs PagBank:", error)
      return []
    }
  }

  static async getFormattedLogs(): Promise<string> {
    const logs = await this.getLogs()
    let output = ""

    logs.forEach((log) => {
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
    } catch (error) {
      console.error("Erro ao limpar logs PagBank:", error)
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
  payment_type?: string
}) {
  await PagBankLogger.log({
    method: data.method || "POST",
    endpoint: data.endpoint || "",
    request: data.request_body || data.request || {},
    response: data.response_body || data.response || {},
    status: data.response_status || data.status || 201,
    paymentType: data.payment_type || "UNKNOWN",
    success: data.success !== false,
    orderId: data.order_id || null,
    chargeId: data.charge_id || null,
    referenceId: data.reference_id || null,
  })
}
