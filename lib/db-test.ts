// Arquivo para testar conexão com banco (temporário)
import mysql from "mysql2/promise"

export async function testDatabaseConnection() {
  try {
    console.log("🔍 Testando conexão com banco de dados...")
    console.log("Host:", process.env.DB_HOST)
    console.log("User:", process.env.DB_USER)
    console.log("Database:", process.env.DB_NAME)
    console.log("Port:", process.env.DB_PORT)
    console.log("SSL:", process.env.DB_SSL)

    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: Number.parseInt(process.env.DB_PORT || "3306"),
      ssl: process.env.DB_SSL === "true",
    })

    await connection.execute("SELECT 1 as test")
    await connection.end()

    console.log("✅ Conexão com banco de dados bem-sucedida!")
    return { success: true, message: "Conexão estabelecida" }
  } catch (error) {
    console.error("❌ Erro na conexão com banco:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "Erro desconhecido",
    }
  }
}
