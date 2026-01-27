import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

function normalizarEstado(estado: string | null | undefined): string {
  if (!estado) return "SP" // Padrão SP se não fornecido

  const estadoLimpo = estado.trim().toUpperCase()

  // Se já tem 2 caracteres, retorna
  if (estadoLimpo.length === 2) {
    return estadoLimpo
  }

  // Mapeamento de nomes completos para siglas
  const mapeamentoEstados: Record<string, string> = {
    ACRE: "AC",
    ALAGOAS: "AL",
    AMAPA: "AP",
    AMAZONAS: "AM",
    BAHIA: "BA",
    CEARA: "CE",
    "DISTRITO FEDERAL": "DF",
    "ESPIRITO SANTO": "ES",
    GOIAS: "GO",
    MARANHAO: "MA",
    "MATO GROSSO": "MT",
    "MATO GROSSO DO SUL": "MS",
    "MINAS GERAIS": "MG",
    PARA: "PA",
    PARAIBA: "PB",
    PARANA: "PR",
    PERNAMBUCO: "PE",
    PIAUI: "PI",
    "RIO DE JANEIRO": "RJ",
    "RIO GRANDE DO NORTE": "RN",
    "RIO GRANDE DO SUL": "RS",
    RONDONIA: "RO",
    RORAIMA: "RR",
    "SANTA CATARINA": "SC",
    "SAO PAULO": "SP",
    SERGIPE: "SE",
    TOCANTINS: "TO",
  }

  const uf = mapeamentoEstados[estadoLimpo]
  return uf || "SP" // Retorna SP como padrão se não encontrar
}

function obterNomeEstado(uf: string): string {
  const mapeamentoUF: Record<string, string> = {
    AC: "Acre",
    AL: "Alagoas",
    AP: "Amapá",
    AM: "Amazonas",
    BA: "Bahia",
    CE: "Ceará",
    DF: "Distrito Federal",
    ES: "Espírito Santo",
    GO: "Goiás",
    MA: "Maranhão",
    MT: "Mato Grosso",
    MS: "Mato Grosso do Sul",
    MG: "Minas Gerais",
    PA: "Pará",
    PB: "Paraíba",
    PR: "Paraná",
    PE: "Pernambuco",
    PI: "Piauí",
    RJ: "Rio de Janeiro",
    RN: "Rio Grande do Norte",
    RS: "Rio Grande do Sul",
    RO: "Rondônia",
    RR: "Roraima",
    SC: "Santa Catarina",
    SP: "São Paulo",
    SE: "Sergipe",
    TO: "Tocantins",
  }
  return mapeamentoUF[uf] || "São Paulo"
}

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
    const body = await request.json()
    const {
      cliente_id,
      numero_nota,
      data_nota,
      valor_total,
      primeiro_vencimento,
      numero_parcelas,
      intervalo,
      forma_pagamento,
      multa_percentual = 2.0,
      juros_mes_percentual = 2.0,
      desconto = 0,
      instrucao_linha1 = "Pagamento ate o vencimento",
      instrucao_linha2 = "Apos vencimento cobrar multa e juros",
      enviar_pagbank = false, // Nova opção para controlar envio ao PagBank
    } = body

    if (!cliente_id || !numero_nota || !valor_total || !primeiro_vencimento || !numero_parcelas) {
      return NextResponse.json(
        {
          success: false,
          message: "Dados obrigatórios não fornecidos",
        },
        { status: 400 },
      )
    }

    const dataFormatada = new Date(data_nota).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
    })

    const descricao_produto = `NOTA FISCAL Nº ${numero_nota} - ${dataFormatada} - Parcelas 1/${numero_parcelas}`

    const parcelas = []
    const valorParcela = valor_total / numero_parcelas
    let dataVencimento = new Date(primeiro_vencimento)

    for (let i = 1; i <= numero_parcelas; i++) {
      const descricaoParcela = `NOTA FISCAL Nº ${numero_nota} - ${dataFormatada} - Parcela ${i}/${numero_parcelas}`

      parcelas.push({
        parcela: i,
        valor: valorParcela,
        dataVencimento: dataVencimento.toISOString().split("T")[0],
        descricao: descricaoParcela,
      })

      // Adicionar intervalo para próxima parcela
      if (i < numero_parcelas) {
        dataVencimento = new Date(dataVencimento)
        dataVencimento.setDate(dataVencimento.getDate() + intervalo)
      }
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

    const clientes = await query(`SELECT * FROM clientes WHERE id = ?`, [cliente_id])

    if (clientes.length === 0) {
      return NextResponse.json({ success: false, message: "Cliente não encontrado" }, { status: 404 })
    }

    const cliente = clientes[0]

    const pagseguroToken = process.env.PAGSEGURO_TOKEN
    const pagseguroHabilitado = pagseguroToken && pagseguroToken !== "test_token_temporario"

    for (let i = 0; i < parcelas.length; i++) {
      const parcela = parcelas[i]
      const numeroBoleto =
        parcelas.length > 1 ? `${numero_nota}-${String(parcela.parcela).padStart(2, "0")}` : numero_nota

      console.log(`[v0] Criando parcela ${i + 1}/${parcelas.length} localmente - Boleto: ${numeroBoleto}`)

      const dataVencimentoAjustada = adjustToBusinessDay(parcela.dataVencimento)
      const status = calcularStatus(dataVencimentoAjustada)

      console.log(`[v0] Inserindo parcela ${i + 1}/${parcelas.length} no banco de dados (apenas local)`)

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
          charge_id,
          linha_digitavel,
          codigo_barras,
          link_pdf,
          link_impressao,
          data_nota,
          descricao_produto,
          multa,
          juros,
          asaas_id,
          asaas_customer_id,
          asaas_invoice_url,
          asaas_bankslip_url,
          gateway,
          created_at,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `,
        [
          numeroBoleto,
          cliente_id,
          parcela.valor,
          dataVencimentoAjustada,
          status,
          parcela.parcela,
          parcelas.length,
          null,
          forma_pagamento || "boleto",
          null, // charge_id começa como null
          null, // linha_digitavel
          null, // codigo_barras
          null, // link_pdf
          null, // link_impressao
          data_nota || null,
          descricao_produto,
          multa_percentual || 2.0,
          juros_mes_percentual || 2.0,
          null, // asaas_id
          null, // asaas_customer_id
          null, // asaas_invoice_url
          null, // asaas_bankslip_url
          null, // gateway
        ],
      )

      console.log(`[v0] Parcela ${i + 1}/${parcelas.length} inserida com sucesso no banco (apenas local)`)
    }

    console.log(`[v0] Processo concluído: ${parcelas.length} boletos criados localmente`)

    return NextResponse.json({
      success: true,
      message: `${parcelas.length} boleto(s) criado(s) localmente! Use o botão "Enviar para PagBank" ou "Enviar para Asaas" para gerar o boleto.`,
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
