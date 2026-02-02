import { type NextRequest, NextResponse } from "next/server"
import { pool } from "@/lib/db"

interface FeriadoRow {
  data: Date | string
  nome: string
}

export async function POST(request: NextRequest) {
  try {
    const { data } = await request.json()

    if (!data) {
      return NextResponse.json(
        {
          success: false,
          message: "Data não fornecida",
        },
        { status: 400 },
      )
    }

    // Buscar feriados do banco de dados
    const [feriadosRows] = await pool.execute(
      `
      SELECT data, nome 
      FROM feriados 
      WHERE ativo = 1 
      AND YEAR(data) >= YEAR(?) - 1
      AND YEAR(data) <= YEAR(?) + 1
    `,
      [data, data],
    )

    // Criar um Map com data -> nome do feriado
    const feriadosMap = new Map<string, string>()
    ;(feriadosRows as FeriadoRow[]).forEach((f) => {
      const dateObj = new Date(f.data)
      const dateStr = dateObj.toISOString().split("T")[0]
      feriadosMap.set(dateStr, f.nome)
    })

    // Função para verificar se é fim de semana
    const isWeekend = (date: Date): { isWeekend: boolean; dayName: string } => {
      const day = date.getDay()
      if (day === 0) return { isWeekend: true, dayName: "Domingo" }
      if (day === 6) return { isWeekend: true, dayName: "Sábado" }
      return { isWeekend: false, dayName: "" }
    }

    // Função para verificar se é feriado
    const getFeriado = (date: Date): string | null => {
      const dateStr = date.toISOString().split("T")[0]
      return feriadosMap.get(dateStr) || null
    }

    // Função para verificar se é dia útil
    const isBusinessDay = (date: Date): boolean => {
      const weekend = isWeekend(date)
      const feriado = getFeriado(date)
      return !weekend.isWeekend && !feriado
    }

    // Função para obter o próximo dia útil
    const getNextBusinessDay = (date: Date): Date => {
      const nextDay = new Date(date)
      nextDay.setDate(nextDay.getDate() + 1)
      while (!isBusinessDay(nextDay)) {
        nextDay.setDate(nextDay.getDate() + 1)
      }
      return nextDay
    }

    // Verificar a data informada
    const dataVerificar = new Date(data + "T00:00:00")
    const weekend = isWeekend(dataVerificar)
    const feriadoNome = getFeriado(dataVerificar)

    // Se é dia útil, retorna que está ok
    if (!weekend.isWeekend && !feriadoNome) {
      return NextResponse.json({
        success: true,
        isDiaUtil: true,
        dataOriginal: data,
        dataSugerida: data,
        mensagem: null,
        motivo: null,
      })
    }

    // Se não é dia útil, calcular o próximo dia útil
    const proximoDiaUtil = getNextBusinessDay(dataVerificar)
    const proximoDiaUtilStr = proximoDiaUtil.toISOString().split("T")[0]

    // Formatar datas para exibição
    const formatarData = (dateStr: string) => {
      const [ano, mes, dia] = dateStr.split("-")
      return `${dia}/${mes}/${ano}`
    }

    // Construir mensagem
    let motivo = ""
    if (weekend.isWeekend && feriadoNome) {
      motivo = `${weekend.dayName} e feriado (${feriadoNome})`
    } else if (weekend.isWeekend) {
      motivo = weekend.dayName
    } else if (feriadoNome) {
      motivo = `Feriado: ${feriadoNome}`
    }

    const mensagem = `A data ${formatarData(data)} cai em ${motivo}. O próximo dia útil é ${formatarData(proximoDiaUtilStr)}.`

    return NextResponse.json({
      success: true,
      isDiaUtil: false,
      dataOriginal: data,
      dataSugerida: proximoDiaUtilStr,
      mensagem,
      motivo,
    })
  } catch (error) {
    console.error("Erro ao validar dia útil:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Erro ao validar dia útil",
        error: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 },
    )
  }
}
