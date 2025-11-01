import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const clienteId = searchParams.get("cliente_id")

    if (!clienteId) {
      return NextResponse.json({
        success: false,
        error: "ID do cliente é obrigatório"
      }, { status: 400 })
    }

    // Buscar dados do cliente
    const clienteResult = await query(
      "SELECT codigo FROM clientes WHERE id = ?",
      [clienteId]
    )

    if (!Array.isArray(clienteResult) || clienteResult.length === 0) {
      return NextResponse.json({
        success: false,
        error: "Cliente não encontrado"
      }, { status: 404 })
    }

    const cliente = clienteResult[0] as { codigo: string }
    const codigoCliente = cliente.codigo.padStart(3, '0')

    // Gerar número baseado na data atual
    const hoje = new Date()
    const ano = hoje.getFullYear()
    const mes = (hoje.getMonth() + 1).toString().padStart(2, '0')
    const dia = hoje.getDate().toString().padStart(2, '0')
    
    const prefixo = `${codigoCliente}${ano}${mes}${dia}`

    // Buscar o último número do dia para este cliente
    const ultimoNumeroResult = await query(
      `SELECT numero FROM ordens_servico 
       WHERE numero LIKE ? 
       ORDER BY numero DESC 
       LIMIT 1`,
      [`${prefixo}%`]
    )

    let proximoSequencial = 1

    if (Array.isArray(ultimoNumeroResult) && ultimoNumeroResult.length > 0) {
      const ultimoNumero = (ultimoNumeroResult[0] as { numero: string }).numero
      const sequencialAtual = parseInt(ultimoNumero.slice(-3)) || 0
      proximoSequencial = sequencialAtual + 1
    }

    const numeroFinal = `${prefixo}${proximoSequencial.toString().padStart(3, '0')}`

    return NextResponse.json({
      success: true,
      numero: numeroFinal
    })

  } catch (error) {
    console.error("Erro ao gerar próximo número da OS:", error)
    return NextResponse.json({
      success: false,
      error: "Erro interno do servidor"
    }, { status: 500 })
  }
}
