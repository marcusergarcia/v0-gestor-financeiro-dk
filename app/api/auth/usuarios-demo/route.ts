import { NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET() {
  try {
    const usuarios = (await query(`
      SELECT id, nome, email, tipo, perfil, ativo
      FROM usuarios 
      WHERE ativo = 1 
      ORDER BY 
        CASE tipo 
          WHEN 'admin' THEN 1
          WHEN 'tecnico' THEN 2
          WHEN 'vendedor' THEN 3
          WHEN 'usuario' THEN 4
          ELSE 5
        END,
        nome
      LIMIT 10
    `)) as any[]

    return NextResponse.json({
      success: true,
      data: usuarios.map((user) => ({
        id: user.id,
        nome: user.nome,
        email: user.email,
        tipo: user.tipo,
        perfil: user.perfil || user.tipo,
        senhaDemo: "123456", // Senha padrão baseada no que vi no banco
      })),
    })
  } catch (error) {
    console.error("Erro ao buscar usuários demo:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Erro interno do servidor",
        error: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 },
    )
  }
}
