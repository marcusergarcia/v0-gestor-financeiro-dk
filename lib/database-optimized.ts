// CORREÇÃO 5: Otimizações de banco de dados

import mysql from "mysql2/promise"

// Pool de conexões otimizado
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number.parseInt(process.env.DB_PORT || "3306"),
  // Configurações otimizadas
  connectionLimit: 20, // Reduzido para evitar sobrecarga
  maxIdle: 10,
  idleTimeout: 60000,
  queueLimit: 0,
  acquireTimeout: 60000,
  timeout: 60000,
  charset: "utf8mb4",
  // Configurações de performance
  supportBigNumbers: true,
  bigNumberStrings: true,
  dateStrings: false,
  debug: false,
  multipleStatements: false, // Segurança
})

export { pool }

// Função de query otimizada com logging
export async function query(sql: string, params?: any[]) {
  const startTime = Date.now()
  let connection

  try {
    connection = await pool.getConnection()
    const [rows] = await connection.execute(sql, params)

    const duration = Date.now() - startTime

    // Log queries lentas (> 1 segundo)
    if (duration > 1000) {
      console.warn(`Slow query detected (${duration}ms):`, sql.substring(0, 100))
    }

    return rows
  } catch (error) {
    console.error("Database query error:", error)
    console.error("SQL:", sql)
    console.error("Params:", params)
    throw error
  } finally {
    if (connection) {
      connection.release()
    }
  }
}

// Função para transações
export async function transaction<T>(callback: (connection: mysql.PoolConnection) => Promise<T>): Promise<T> {
  const connection = await pool.getConnection()

  try {
    await connection.beginTransaction()
    const result = await callback(connection)
    await connection.commit()
    return result
  } catch (error) {
    await connection.rollback()
    throw error
  } finally {
    connection.release()
  }
}

// Função para queries paginadas
export async function queryPaginated(sql: string, params: any[] = [], page = 1, limit = 50) {
  const offset = (page - 1) * limit

  // Query para contar total
  const countSql = sql.replace(/SELECT .+ FROM/, "SELECT COUNT(*) as total FROM")
  const [countResult] = (await query(countSql, params)) as any[]
  const total = countResult.total

  // Query com paginação
  const paginatedSql = `${sql} LIMIT ? OFFSET ?`
  const rows = await query(paginatedSql, [...params, limit, offset])

  return {
    data: rows,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  }
}

// Função para busca com índices otimizados
export async function searchWithIndex(
  table: string,
  searchFields: string[],
  searchTerm: string,
  additionalWhere = "",
  params: any[] = [],
  page = 1,
  limit = 50,
) {
  const searchConditions = searchFields.map((field) => `${field} LIKE ?`).join(" OR ")

  const searchParams = searchFields.map(() => `%${searchTerm}%`)

  const whereClause = additionalWhere
    ? `WHERE (${searchConditions}) AND ${additionalWhere}`
    : `WHERE (${searchConditions})`

  const sql = `SELECT * FROM ${table} ${whereClause} ORDER BY id DESC`

  return queryPaginated(sql, [...searchParams, ...params], page, limit)
}

export default pool
