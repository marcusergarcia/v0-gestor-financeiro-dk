import { writeFile, readFile, mkdir } from "fs/promises"
import { existsSync } from "fs"
import path from "path"

interface PagBankLogEntry {
  timestamp: string
  method: string
  endpoint: string
  request: any
  response: any
  status: number
  paymentType: string
}

export class PagBankLogger {
  private static logFilePath = path.join(process.cwd(), "logs", "pagbank-integration.json")

  static async log(entry: Omit<PagBankLogEntry, "timestamp">) {
    const logEntry: PagBankLogEntry = {
      timestamp: new Date().toISOString(),
      ...entry,
    }

    console.log("[PagBank Logger] Registrando transação:", {
      paymentType: entry.paymentType,
      method: entry.method,
      status: entry.status,
    })

    try {
      const logsDir = path.join(process.cwd(), "logs")
      if (!existsSync(logsDir)) {
        await mkdir(logsDir, { recursive: true })
      }

      let logs: PagBankLogEntry[] = []
      if (existsSync(this.logFilePath)) {
        const content = await readFile(this.logFilePath, "utf-8")
        logs = JSON.parse(content)
      }

      logs.push(logEntry)

      if (logs.length > 100) {
        logs = logs.slice(-100)
      }

      await writeFile(this.logFilePath, JSON.stringify(logs, null, 2))
    } catch (error) {
      console.error("[PagBank Logger] Erro ao salvar log:", error)
    }
  }

  static async getLogs(): Promise<PagBankLogEntry[]> {
    try {
      if (!existsSync(this.logFilePath)) {
        return []
      }
      const content = await readFile(this.logFilePath, "utf-8")
      return JSON.parse(content)
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
      await writeFile(this.logFilePath, JSON.stringify([], null, 2))
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
  })
}
