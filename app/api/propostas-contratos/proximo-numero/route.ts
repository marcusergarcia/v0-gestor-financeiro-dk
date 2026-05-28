import { NextResponse } from "next/server"
import { pool } from "@/lib/database"

export async function GET() {
  try {
    // Obter data atual no formato YYYYMMDD
    const hoje = new Date()
    const ano = hoje.getFullYear()
    const mes = String(hoje.getMonth() + 1).padStart(2, "0")
    const dia = String(hoje.getDate()).padStart(2, "0")
    const dataFormatada = `${ano}${mes}${dia}`

    // Buscar o último número de proposta do dia atual
    const [rows] = await pool.execute(
      `
      SELECT numero 
      FROM proposta_contratos 
      WHERE numero LIKE ? 
      ORDER BY numero DESC 
      LIMIT 1
    `,
      [`${dataFormatada}%`],
    )

    let proximoSequencial = 1

    if (Array.isArray(rows) && rows.length > 0) {
      const ultimoNumero = (rows[0] as any).numero
      // Extrair a parte sequencial (últimos 3 dígitos)
      const parteSequencial = ultimoNumero.slice(-3)
      if (parteSequencial) {
        proximoSequencial = Number.parseInt(parteSequencial) + 1
      }
    }

    // Formatar o número sequencial com 3 dígitos
    const sequencialFormatado = String(proximoSequencial).padStart(3, "0")
    const numeroCompleto = `${dataFormatada}${sequencialFormatado}`

    return NextResponse.json({
      success: true,
      data: {
        numero: numeroCompleto,
        proximo_numero: proximoSequencial,
      },
    })
  } catch (error) {
    console.error("Erro ao buscar próximo número da proposta:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Erro interno do servidor",
      },
      { status: 500 },
    )
  }
}
