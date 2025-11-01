import { type NextRequest, NextResponse } from "next/server"
import { pool } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    const { dataInicial, diasIntervalo, numeroParcelas } = await request.json()

    if (!dataInicial || !diasIntervalo || !numeroParcelas) {
      return NextResponse.json(
        {
          success: false,
          message: "Parâmetros obrigatórios não fornecidos",
        },
        { status: 400 },
      )
    }

    // Buscar feriados do banco de dados
    const [feriadosRows] = await pool.execute(
      `
      SELECT data 
      FROM feriados 
      WHERE ativo = 1 
      AND YEAR(data) >= YEAR(?) 
      AND YEAR(data) <= YEAR(DATE_ADD(?, INTERVAL 2 YEAR))
    `,
      [dataInicial, dataInicial],
    )

    const feriadosSet = new Set(
      (feriadosRows as any[]).map((f: any) => {
        const date = new Date(f.data)
        return date.toISOString().split("T")[0]
      }),
    )

    // Função para verificar se é fim de semana
    const isWeekend = (date: Date): boolean => {
      const day = date.getDay()
      return day === 0 || day === 6 // domingo = 0, sábado = 6
    }

    // Função para verificar se é feriado
    const isFeriado = (date: Date): boolean => {
      const dateStr = date.toISOString().split("T")[0]
      return feriadosSet.has(dateStr)
    }

    // Função para verificar se é dia útil
    const isBusinessDay = (date: Date): boolean => {
      return !isWeekend(date) && !isFeriado(date)
    }

    // Função para obter o próximo dia útil
    const getNextBusinessDay = (date: Date): Date => {
      const nextDay = new Date(date)
      while (!isBusinessDay(nextDay)) {
        nextDay.setDate(nextDay.getDate() + 1)
      }
      return nextDay
    }

    // Calcular datas de vencimento ajustadas para dias úteis
    const datas: string[] = []
    const dataBase = new Date(dataInicial + "T00:00:00")

    for (let i = 0; i < numeroParcelas; i++) {
      const novaData = new Date(dataBase)
      novaData.setDate(dataBase.getDate() + i * diasIntervalo)

      // Ajustar para dia útil se necessário
      const dataAjustada = isBusinessDay(novaData) ? novaData : getNextBusinessDay(novaData)
      datas.push(dataAjustada.toISOString().split("T")[0])
    }

    return NextResponse.json({
      success: true,
      datas,
      feriadosConsiderados: feriadosSet.size,
    })
  } catch (error) {
    console.error("Erro ao calcular dias úteis:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Erro ao calcular dias úteis",
        error: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 },
    )
  }
}
