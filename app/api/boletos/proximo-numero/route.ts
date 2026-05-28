import { NextResponse } from "next/server"
import { pool } from "@/lib/db"

export async function GET() {
  try {
    const [rows] = await pool.execute(`
      SELECT numero 
      FROM boletos 
      WHERE numero REGEXP '^[0-9]+(-[0-9]+)?$'
      ORDER BY CAST(SUBSTRING_INDEX(numero, '-', 1) AS UNSIGNED) DESC 
      LIMIT 1
    `)

    let proximoNumero = "001"

    if (Array.isArray(rows) && rows.length > 0) {
      const ultimoNumero = (rows[0] as any).numero
      const numeroBase = ultimoNumero.split("-")[0]
      const proximoInt = Number.parseInt(numeroBase) + 1
      proximoNumero = proximoInt.toString().padStart(3, "0")
    }

    return NextResponse.json({
      success: true,
      numero: proximoNumero,
    })
  } catch (error) {
    console.error("Erro ao buscar próximo número:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Erro ao buscar próximo número",
      },
      { status: 500 },
    )
  }
}
