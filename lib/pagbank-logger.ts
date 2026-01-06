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

    try {
      console.log("[v0] DEBUG - Dados recebidos no logger:", JSON.stringify(entry, null, 2))

      const values = [
        logEntry.timestamp,
        logEntry.method,
        logEntry.endpoint,
        JSON.stringify(logEntry.request || {}),
        JSON.stringify(logEntry.response || {}),
        logEntry.status,
        logEntry.paymentType,
        logEntry.success ? 1 : 0,
        logEntry.orderId || null,
        logEntry.chargeId || null,
        logEntry.referenceId || null,
      ]

      console.log("[v0] DEBUG - Valores para INSERT:", JSON.stringify(values, null, 2))

      const hasUndefined = values.some((v, i) => {
        if (v === undefined) {
          console.error(`[v0] ERRO - Valor undefined no índice ${i}`)
          return true
        }
        return false
      })

      if (hasUndefined) {
        throw new Error("Parâmetros contêm undefined")
      }

      const result = await query(
        `INSERT INTO pagbank_logs 
        (timestamp, method, endpoint, request_data, response_data, status, payment_type, success, order_id, charge_id, reference_id) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        values,
      )

      console.log("[v0] Log PagBank salvo. ID:", result.insertId)
      return result
    } catch (error) {
      console.error("[v0] Erro ao salvar log PagBank:", error)
      console.error("[v0] Dados que causaram o erro:", JSON.stringify(entry, null, 2))
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
      console.error("[v0] Erro ao ler logs PagBank:", error)
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
      console.log("[v0] Logs PagBank limpos")
    } catch (error) {
      console.error("[v0] Erro ao limpar logs PagBank:", error)
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
  console.log("[v0] DEBUG - logPagBankTransaction recebeu:", JSON.stringify(data, null, 2))

  const requestData = data.request_body || data.request || {}
  const responseData = data.response_body || data.response || {}
  const statusCode = data.response_status || data.status || 201
  const method = data.method || "POST"
  const endpoint = data.endpoint || ""
  const paymentType = data.payment_type || "UNKNOWN"

  await PagBankLogger.log({
    method,
    endpoint,
    request: requestData,
    response: responseData,
    status: statusCode,
    paymentType,
    success: data.success !== false,
    orderId: data.order_id || null,
    chargeId: data.charge_id || null,
    referenceId: data.reference_id || null,
  })
}
