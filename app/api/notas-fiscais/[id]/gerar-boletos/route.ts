import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const {
      primeiro_vencimento,
      numero_parcelas = 1,
      intervalo = 30,
      forma_pagamento = "boleto",
      multa_percentual = 2.0,
      juros_mes_percentual = 2.0,
    } = body

    // Buscar nota fiscal
    const notas = await query(
      `
      SELECT nf.*, c.nome as cliente_nome
      FROM notas_fiscais nf
      LEFT JOIN clientes c ON nf.cliente_id = c.id
      WHERE nf.id = ?
    `,
      [id]
    )

    if ((notas as any[]).length === 0) {
      return NextResponse.json(
        { success: false, message: "Nota fiscal nao encontrada" },
        { status: 404 }
      )
    }

    const nota = (notas as any[])[0]

    if (!primeiro_vencimento) {
      return NextResponse.json(
        { success: false, message: "Data do primeiro vencimento e obrigatoria" },
        { status: 400 }
      )
    }

    const valor = Number(nota.valor)
    const numParcelas = Number(numero_parcelas)
    const valorParcela = Math.floor((valor / numParcelas) * 100) / 100
    const valorUltimaParcela = Math.round((valor - valorParcela * (numParcelas - 1)) * 100) / 100

    // Gerar numero base para os boletos baseado no ID da nota
    const numeroBase = `NF${String(nota.id).padStart(5, "0")}`

    const isWeekend = (date: Date): boolean => {
      const day = date.getDay()
      return day === 0 || day === 6
    }

    const getNextBusinessDay = (date: Date): Date => {
      const nextDay = new Date(date)
      while (isWeekend(nextDay)) {
        nextDay.setDate(nextDay.getDate() + 1)
      }
      return nextDay
    }

    const calcularStatus = (dataVencimento: string): string => {
      const hoje = new Date()
      const vencimento = new Date(dataVencimento + "T00:00:00")
      hoje.setHours(0, 0, 0, 0)
      vencimento.setHours(0, 0, 0, 0)
      return vencimento < hoje ? "vencido" : "pendente"
    }

    const boletosIds: number[] = []

    for (let i = 0; i < numParcelas; i++) {
      const dataBase = new Date(primeiro_vencimento + "T00:00:00")
      dataBase.setDate(dataBase.getDate() + i * Number(intervalo))

      const dataAjustada = getNextBusinessDay(dataBase)
      const dataVencimento = dataAjustada.toISOString().split("T")[0]

      const numeroBoleto = numParcelas > 1
        ? `${numeroBase}-${String(i + 1).padStart(2, "0")}`
        : numeroBase

      const valorBoleto = i === numParcelas - 1 ? valorUltimaParcela : valorParcela

      const result = await query(
        `
        INSERT INTO boletos (
          numero, cliente_id, valor, data_vencimento, status,
          numero_parcela, total_parcelas, forma_pagamento,
          data_nota, numero_nota, multa, juros, nota_fiscal_id,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `,
        [
          numeroBoleto,
          nota.cliente_id,
          valorBoleto,
          dataVencimento,
          calcularStatus(dataVencimento),
          i + 1,
          numParcelas,
          forma_pagamento,
          nota.data_emissao || new Date().toISOString().split("T")[0],
          numeroBase,
          multa_percentual,
          juros_mes_percentual,
          nota.id,
        ]
      )

      boletosIds.push((result as any).insertId)
    }

    return NextResponse.json({
      success: true,
      message: `${numParcelas} boleto(s) gerado(s) a partir da nota fiscal! Use o botao "Enviar para Asaas" para gerar o boleto bancario.`,
      data: { boletos_ids: boletosIds },
    })
  } catch (error) {
    console.error("Erro ao gerar boletos da nota fiscal:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Erro ao gerar boletos",
        error: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 }
    )
  }
}
