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

    // Gerar número baseado na data atual
    const hoje = new Date()
    const ano = hoje.getFullYear()
    const mes = String(hoje.getMonth() + 1).padStart(2, "0")
    const dia = String(hoje.getDate()).padStart(2, "0")

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
