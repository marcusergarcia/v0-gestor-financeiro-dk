import { NextResponse } from "next/server"
import { pool } from "@/lib/database"

export async function GET() {
  try {
    // Buscar o maior código numérico atual
    const [maxCodigoRows] = await pool.execute(`
      SELECT codigo FROM tipos_produtos 
      WHERE codigo REGEXP '^[0-9]+$' 
      ORDER BY CAST(codigo AS UNSIGNED) DESC 
      LIMIT 1
    `)

    let proximoCodigo = 1
    if (Array.isArray(maxCodigoRows) && maxCodigoRows.length > 0) {
      const maxCodigo = (maxCodigoRows[0] as any).codigo
      proximoCodigo = parseInt(maxCodigo, 10) + 1
    }

    // Formatar com 3 dígitos (ex: 001, 020, 100)
    const codigoFormatado = proximoCodigo.toString().padStart(3, "0")

    return NextResponse.json({
      success: true,
      codigo: codigoFormatado,
    })
  } catch (error) {
    console.error("Erro ao gerar próximo código de categoria:", error)
    return NextResponse.json(
      { success: false, message: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}
