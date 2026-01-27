import { query } from "./db"

export interface PagBankLogEntry {
  id?: number
  tipo: "request" | "response" | "error" | "webhook"
  endpoint: string
  metodo: string
  payload?: string
  resposta?: string
  status_code?: number
  boleto_id?: number
  charge_id?: string
  erro?: string
  created_at?: Date
}

export class PagBankLogger {
  private static tableName = "pagbank_logs"

  /**
   * Registra uma transação no banco de dados
   */
  static async log(entry: Omit<PagBankLogEntry, "id" | "created_at">): Promise<void> {
    try {
      await query(
        `INSERT INTO ${this.tableName} 
         (tipo, endpoint, metodo, payload, resposta, status_code, boleto_id, charge_id, erro, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          entry.tipo,
          entry.endpoint,
          entry.metodo,
          entry.payload || null,
          entry.resposta || null,
          entry.status_code || null,
          entry.boleto_id || null,
          entry.charge_id || null,
          entry.erro || null,
        ]
      )
    } catch (error) {
      console.error("[PagBankLogger] Erro ao salvar log:", error)
    }
  }

  /**
   * Busca logs com filtros opcionais
   */
  static async getLogs(filters?: {
    tipo?: string
    boleto_id?: number
    charge_id?: string
    limit?: number
    offset?: number
  }): Promise<PagBankLogEntry[]> {
    try {
      let sql = `SELECT * FROM ${this.tableName} WHERE 1=1`
      const params: any[] = []

      if (filters?.tipo) {
        sql += " AND tipo = ?"
        params.push(filters.tipo)
      }

      if (filters?.boleto_id) {
        sql += " AND boleto_id = ?"
        params.push(filters.boleto_id)
      }

      if (filters?.charge_id) {
        sql += " AND charge_id = ?"
        params.push(filters.charge_id)
      }

      sql += " ORDER BY created_at DESC"

      if (filters?.limit) {
        sql += " LIMIT ?"
        params.push(filters.limit)
      }

      if (filters?.offset) {
        sql += " OFFSET ?"
        params.push(filters.offset)
      }

      const logs = await query(sql, params)
      return logs as PagBankLogEntry[]
    } catch (error) {
      console.error("[PagBankLogger] Erro ao buscar logs:", error)
      return []
    }
  }

  /**
   * Busca logs por boleto_id
   */
  static async getLogsByBoleto(boletoId: number): Promise<PagBankLogEntry[]> {
    return this.getLogs({ boleto_id: boletoId })
  }

  /**
   * Busca logs por charge_id
   */
  static async getLogsByCharge(chargeId: string): Promise<PagBankLogEntry[]> {
    return this.getLogs({ charge_id: chargeId })
  }

  /**
   * Limpa logs antigos (mais de 30 dias)
   */
  static async cleanOldLogs(daysToKeep: number = 30): Promise<number> {
    try {
      const result = await query(
        `DELETE FROM ${this.tableName} WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)`,
        [daysToKeep]
      )
      return (result as any).affectedRows || 0
    } catch (error) {
      console.error("[PagBankLogger] Erro ao limpar logs antigos:", error)
      return 0
    }
  }
}

/**
 * Função helper para logar transações do PagBank
 */
export async function logPagBankTransaction(
  tipo: PagBankLogEntry["tipo"],
  endpoint: string,
  metodo: string,
  options?: {
    payload?: any
    resposta?: any
    status_code?: number
    boleto_id?: number
    charge_id?: string
    erro?: string
  }
): Promise<void> {
  await PagBankLogger.log({
    tipo,
    endpoint,
    metodo,
    payload: options?.payload ? JSON.stringify(options.payload) : undefined,
    resposta: options?.resposta ? JSON.stringify(options.resposta) : undefined,
    status_code: options?.status_code,
    boleto_id: options?.boleto_id,
    charge_id: options?.charge_id,
    erro: options?.erro,
  })
}
