import { NextResponse } from "next/server"
import { pool } from "@/lib/database"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const quantidade = Number.parseInt(searchParams.get("quantidade") || "1")

    // Buscar configuração de desconto por quantidade de visitas
    const [rows] = await pool.execute(
      `
      SELECT percentual_desconto 
      FROM visitas_tecnicas_config 
      WHERE quantidade_visitas <= ? 
      ORDER BY quantidade_visitas DESC 
      LIMIT 1
    `,
      [quantidade],
    )

    let percentualDesconto = 0

    if (Array.isArray(rows) && rows.length > 0) {
      percentualDesconto = (rows[0] as any).percentual_desconto || 0
    }

    return NextResponse.json({
      success: true,
      data: {
        quantidade_visitas: quantidade,
        percentual_desconto: percentualDesconto,
      },
    })
  } catch (error) {
    console.error("Erro ao buscar desconto de visitas:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Erro interno do servidor",
      },
      { status: 500 },
    )
  }
}
