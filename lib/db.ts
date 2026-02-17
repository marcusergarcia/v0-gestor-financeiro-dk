import mysql from "mysql2/promise"

// Configuração otimizada para produção
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number.parseInt(process.env.DB_PORT || "3306"),
  // Configurações ajustadas para produção (Vercel)
  connectionLimit: 5,
  maxIdle: 2,
  idleTimeout: 30000,
  queueLimit: 0,
  ssl:
    process.env.DB_SSL === "true"
      ? {
          rejectUnauthorized: process.env.NODE_ENV === "production",
        }
      : undefined,
  // Configurações de retry com timeout maior
  connectTimeout: 60000,
  waitForConnections: true,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
  charset: "utf8mb4",
})

// Verificar conexão no startup com retry
const verificarConexao = async (tentativas = 3) => {
  for (let i = 1; i <= tentativas; i++) {
    try {
      const connection = await pool.getConnection()
      console.log("✅ Conexão com banco de dados estabelecida")
      connection.release()
      return
    } catch (error) {
      console.error(`❌ Tentativa ${i}/${tentativas} - Erro ao conectar ao banco de dados:`, error)
      if (i === tentativas) {
        console.error("Variáveis de ambiente:")
        console.error("DB_HOST:", process.env.DB_HOST)
        console.error("DB_USER:", process.env.DB_USER)
        console.error("DB_NAME:", process.env.DB_NAME)
        console.error("DB_PORT:", process.env.DB_PORT)
      } else {
        // Esperar antes de tentar novamente
        await new Promise((resolve) => setTimeout(resolve, 3000 * i))
      }
    }
  }
}

verificarConexao()

export { pool }

export async function createConnection() {
  return await pool.getConnection()
}

export const getConnection = createConnection

export async function query(sql: string, params?: any[]) {
  const maxRetries = 2
  let lastError: any

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    let connection
    try {
      connection = await pool.getConnection()
      const [rows] = await connection.execute(sql, params)
      return rows
    } catch (error: any) {
      lastError = error
      console.error(`Database query error (attempt ${attempt + 1}/${maxRetries + 1}):`, error?.code || error?.message)
      
      // Retry only on connection errors
      if (attempt < maxRetries && (error?.code === 'ETIMEDOUT' || error?.code === 'ECONNREFUSED' || error?.code === 'PROTOCOL_CONNECTION_LOST')) {
        await new Promise((resolve) => setTimeout(resolve, 2000 * (attempt + 1)))
        continue
      }
      throw error
    } finally {
      if (connection) {
        connection.release()
      }
    }
  }

  throw lastError
}

export default pool
