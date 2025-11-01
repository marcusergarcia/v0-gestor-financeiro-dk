// TODO: Remover esta rota após confirmar que tudo está funcionando em produção
import { NextResponse } from "next/server"
import { pool } from "@/lib/database"

export async function GET() {
  try {
    // Testar conexão básica
    const [result] = await pool.execute("SELECT 1 as test")

    // Testar se as tabelas principais existem
    const [tables] = await pool.execute(`
      SELECT TABLE_NAME 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME IN ('clientes', 'produtos', 'orcamentos', 'boletos')
    `)

    return NextResponse.json({
      success: true,
      message: "Conexão com banco de dados estabelecida com sucesso!",
      data: {
        connection: "OK",
        test_query: result,
        tables_found: tables,
        environment: {
          DB_HOST: process.env.DB_HOST ? "✓ Configurado" : "✗ Não configurado",
          DB_USER: process.env.DB_USER ? "✓ Configurado" : "✗ Não configurado",
          DB_PASSWORD: process.env.DB_PASSWORD ? "✓ Configurado" : "✗ Não configurado",
          DB_NAME: process.env.DB_NAME ? "✓ Configurado" : "✗ Não configurado",
          DB_PORT: process.env.DB_PORT ? "✓ Configurado" : "✗ Não configurado",
        },
      },
    })
  } catch (error) {
    console.error("Erro ao testar conexão:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Erro ao conectar com o banco de dados",
        error: error instanceof Error ? error.message : "Erro desconhecido",
        environment: {
          DB_HOST: process.env.DB_HOST ? "✓ Configurado" : "✗ Não configurado",
          DB_USER: process.env.DB_USER ? "✓ Configurado" : "✗ Não configurado",
          DB_PASSWORD: process.env.DB_PASSWORD ? "✓ Configurado" : "✗ Não configurado",
          DB_NAME: process.env.DB_NAME ? "✓ Configurado" : "✗ Não configurado",
          DB_PORT: process.env.DB_PORT ? "✓ Configurado" : "✗ Não configurado",
        },
      },
      { status: 500 },
    )
  }
}
