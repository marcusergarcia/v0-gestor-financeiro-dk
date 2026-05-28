import { NextResponse } from "next/server"
import { pool } from "@/lib/db"

export async function GET() {
  try {
    // Buscar o último código de serviço (que começa com 015)
    const [rows] = await pool.execute(
      `SELECT codigo FROM produtos 
       WHERE codigo LIKE '015%' 
       ORDER BY codigo DESC 
       LIMIT 1`,
    )

    let proximoNumero = 1

    if (Array.isArray(rows) && rows.length > 0) {
      const ultimoCodigo = (rows as any[])[0].codigo
      console.log("Último código encontrado:", ultimoCodigo)

      // Extrair os últimos 3 dígitos do código
      const numeroAtual = Number.parseInt(ultimoCodigo.substring(3))
      if (!isNaN(numeroAtual)) {
        proximoNumero = numeroAtual + 1
      }
    }

    // Formatar o código com 3 dígitos
    const novoCodigo = `015${proximoNumero.toString().padStart(3, "0")}`

    console.log("Novo código gerado:", novoCodigo)

    // Verificar se o código já existe (segurança extra)
    const [existeRows] = await pool.execute("SELECT id FROM produtos WHERE codigo = ?", [novoCodigo])

    if (Array.isArray(existeRows) && existeRows.length > 0) {
      // Se existir, tentar o próximo
      const codigoAlternativo = `015${(proximoNumero + 1).toString().padStart(3, "0")}`
      console.log("Código já existe, usando alternativo:", codigoAlternativo)

      return NextResponse.json({
        success: true,
        data: { codigo: codigoAlternativo },
      })
    }

    return NextResponse.json({
      success: true,
      data: { codigo: novoCodigo },
    })
  } catch (error) {
    console.error("Erro ao gerar código de serviço:", error)
    return NextResponse.json({ success: false, message: "Erro ao gerar código de serviço" }, { status: 500 })
  }
}
