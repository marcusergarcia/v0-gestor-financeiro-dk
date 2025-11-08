import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const clienteId = searchParams.get("cliente_id")

    if (!clienteId) {
      return NextResponse.json(
        {
          success: false,
          error: "ID do cliente é obrigatório",
        },
        { status: 400 },
      )
    }

    const agora = new Date()
    const brasiliaDateString = agora.toLocaleString("en-US", {
      timeZone: "America/Sao_Paulo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })

    // Parse da data no formato MM/DD/YYYY
    const [mes, dia, ano] = brasiliaDateString.split("/")

    const prefixoMes = `${ano}${mes}`
    const prefixoDia = `${ano}${mes}${dia}`

    // Buscar o último número do mês (não do dia)
    const ultimoNumeroResult = await query(
      `SELECT numero FROM ordens_servico 
       WHERE numero LIKE ? 
       ORDER BY numero DESC 
       LIMIT 1`,
      [`${prefixoMes}%`],
    )

    let proximoSequencial = 1

    if (Array.isArray(ultimoNumeroResult) && ultimoNumeroResult.length > 0) {
      const ultimoNumero = (ultimoNumeroResult[0] as { numero: string }).numero
      const sequencialAtual = Number.parseInt(ultimoNumero.slice(-3)) || 0
      proximoSequencial = sequencialAtual + 1
    }

    const numeroFinal = `${prefixoDia}${proximoSequencial.toString().padStart(3, "0")}`

    return NextResponse.json({
      success: true,
      numero: numeroFinal,
    })
  } catch (error) {
    console.error("Erro ao gerar próximo número da OS:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Erro interno do servidor",
      },
      { status: 500 },
    )
  }
}
