import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const numero = searchParams.get("numero")
    const numeroBase = searchParams.get("numeroBase")

    let sql = `
      SELECT 
        b.*,
        c.nome as cliente_nome
      FROM boletos b
      LEFT JOIN clientes c ON b.cliente_id = c.id
    `

    const params: any[] = []

    if (numero) {
      // Busca exata por número
      sql += " WHERE b.numero = ?"
      params.push(numero)
    } else if (numeroBase) {
      // Busca por número base (todas as parcelas relacionadas)
      sql += " WHERE b.numero LIKE ?"
      params.push(`${numeroBase}%`)
    }

    sql += " ORDER BY b.created_at DESC, b.numero_parcela ASC"

    const boletos = await query(sql, params)

    return NextResponse.json({
      success: true,
      data: boletos,
    })
  } catch (error) {
    console.error("Erro ao buscar boletos:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Erro interno do servidor",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { clienteId, numeroNota, valorTotal, observacoes, parcelas, formaPagamento } = await request.json()

    if (!clienteId || !numeroNota || !valorTotal || !parcelas || parcelas.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Dados obrigatórios não fornecidos",
        },
        { status: 400 },
      )
    }

    // Função para verificar se é fim de semana
    const isWeekend = (date: Date): boolean => {
      const day = date.getDay()
      return day === 0 || day === 6 // domingo = 0, sábado = 6
    }

    // Função para verificar se é dia útil (simplificado)
    const isBusinessDay = (date: Date): boolean => {
      return !isWeekend(date)
    }

    // Função para obter o próximo dia útil
    const getNextBusinessDay = (date: Date): Date => {
      const nextDay = new Date(date)
      while (!isBusinessDay(nextDay)) {
        nextDay.setDate(nextDay.getDate() + 1)
      }
      return nextDay
    }

    // Função para ajustar data de vencimento para dia útil
    const adjustToBusinessDay = (dateString: string): string => {
      const date = new Date(dateString + "T00:00:00")
      if (!isBusinessDay(date)) {
        const businessDay = getNextBusinessDay(date)
        return businessDay.toISOString().split("T")[0]
      }
      return dateString
    }

    // Calcular status baseado na data de vencimento
    const calcularStatus = (dataVencimento: string): string => {
      const hoje = new Date()
      const vencimento = new Date(dataVencimento + "T00:00:00")
      hoje.setHours(0, 0, 0, 0)
      vencimento.setHours(0, 0, 0, 0)
      return vencimento < hoje ? "vencido" : "pendente"
    }

    // Inserir cada parcela como um boleto separado
    for (let i = 0; i < parcelas.length; i++) {
      const parcela = parcelas[i]
      const numeroBoleto =
        parcelas.length > 1 ? `${numeroNota}-${String(parcela.parcela).padStart(2, "0")}` : numeroNota

      // Ajustar data de vencimento para dia útil
      const dataVencimentoAjustada = adjustToBusinessDay(parcela.dataVencimento)
      const status = calcularStatus(dataVencimentoAjustada)

      await query(
        `
        INSERT INTO boletos (
          numero, 
          cliente_id, 
          valor, 
          data_vencimento, 
          status, 
          numero_parcela, 
          total_parcelas, 
          observacoes,
          forma_pagamento,
          created_at,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `,
        [
          numeroBoleto,
          clienteId,
          parcela.valor,
          dataVencimentoAjustada,
          status,
          parcela.parcela,
          parcelas.length,
          observacoes || null,
          formaPagamento || "boleto",
        ],
      )
    }

    return NextResponse.json({
      success: true,
      message: `${parcelas.length} boleto(s) criado(s) com sucesso!`,
    })
  } catch (error) {
    console.error("Erro ao criar boletos:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Erro ao criar boletos",
        error: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 },
    )
  }
}
