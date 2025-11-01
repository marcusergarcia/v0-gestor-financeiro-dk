import { NextResponse } from "next/server"
import { pool } from "@/lib/database"

export async function GET() {
  try {
    console.log("=== TESTE DE CONEXÃO ===")
    console.log("Ambiente:", process.env.NODE_ENV)
    console.log("DB_HOST:", process.env.DB_HOST)
    console.log("DB_USER:", process.env.DB_USER)
    console.log("DB_NAME:", process.env.DB_NAME)
    console.log("DB_PORT:", process.env.DB_PORT)

    // Tentar obter uma conexão
    const connection = await pool.getConnection()
    console.log("✅ Conexão obtida com sucesso")

    // Testar query simples
    const [rows] = await connection.execute("SELECT 1 as test")
    console.log("✅ Query executada com sucesso:", rows)

    // Testar se a tabela existe
    const [tables] = await connection.execute("SHOW TABLES LIKE 'proposta_contratos'")
    console.log("✅ Tabela proposta_contratos encontrada:", tables)

    connection.release()
    console.log("✅ Conexão liberada")

    return NextResponse.json({
      success: true,
      message: "Conexão com banco de dados OK",
      data: {
        environment: process.env.NODE_ENV,
        host: process.env.DB_HOST,
        database: process.env.DB_NAME,
        testQuery: rows,
        tableExists: Array.isArray(tables) && tables.length > 0,
      },
    })
  } catch (error) {
    console.error("❌ Erro ao testar conexão:", error)

    return NextResponse.json(
      {
        success: false,
        message: "Erro ao conectar ao banco de dados",
        error: error instanceof Error ? error.message : String(error),
        details: {
          environment: process.env.NODE_ENV,
          host: process.env.DB_HOST,
          database: process.env.DB_NAME,
        },
      },
      { status: 500 },
    )
  }
}
