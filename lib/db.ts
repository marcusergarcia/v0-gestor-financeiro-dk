import mysql from "mysql2/promise"

// Configuração otimizada para produção
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number.parseInt(process.env.DB_PORT || "3306"),
  // Configurações ajustadas para produção (Vercel)
  connectionLimit: 10, // Reduzido para ambientes serverless
  maxIdle: 5,
  idleTimeout: 60000,
  queueLimit: 0,
  ssl:
    process.env.DB_SSL === "true"
      ? {
          rejectUnauthorized: process.env.NODE_ENV === "production",
        }
      : undefined,
  // Configurações de retry
  connectTimeout: 30000,
  waitForConnections: true,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  charset: "utf8mb4", // Removida opção 'timeout' que causava warning no MySQL2
})

// Verificar conexão no startup
pool
  .getConnection()
  .then((connection) => {
    console.log("✅ Conexão com banco de dados estabelecida")
    connection.release()
  })
  .catch((error) => {
    console.error("❌ Erro ao conectar ao banco de dados:", error)
    console.error("Variáveis de ambiente:")
    console.error("DB_HOST:", process.env.DB_HOST)
    console.error("DB_USER:", process.env.DB_USER)
    console.error("DB_NAME:", process.env.DB_NAME)
    console.error("DB_PORT:", process.env.DB_PORT)
  })

export { pool }

export async function createConnection() {
  return await pool.getConnection()
}

export async function query(sql: string, params?: any[]) {
  let connection
  try {
    connection = await pool.getConnection()
    const [rows] = await connection.execute(sql, params)
    return rows
  } catch (error) {
    console.error("Database query error:", error)
    throw error
  } finally {
    if (connection) {
      connection.release()
    }
  }
}

export default pool
