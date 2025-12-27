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
    const { clienteId, numeroNota, valorTotal, observacoes, parcelas, formaPagamento } = await request.json()

    console.log("[v0] Dados recebidos para criar boleto:", {
      clienteId,
      numeroNota,
      valorTotal,
      parcelas: parcelas.length,
    })

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

    const clientes = await query(`SELECT * FROM clientes WHERE id = ?`, [clienteId])

    if (clientes.length === 0) {
      return NextResponse.json({ success: false, message: "Cliente não encontrado" }, { status: 404 })
    }

    const cliente = clientes[0]
    console.log("[v0] Cliente encontrado:", cliente.nome)

    const pagseguroToken = process.env.PAGSEGURO_TOKEN
    const pagseguroHabilitado = pagseguroToken && pagseguroToken !== "test_token_temporario"

    console.log("[v0] PagSeguro habilitado:", pagseguroHabilitado, "Token presente:", !!pagseguroToken)

    // Inserir cada parcela como um boleto separado
    for (let i = 0; i < parcelas.length; i++) {
      const parcela = parcelas[i]
      const numeroBoleto =
        parcelas.length > 1 ? `${numeroNota}-${String(parcela.parcela).padStart(2, "0")}` : numeroNota

      // Ajustar data de vencimento para dia útil
      const dataVencimentoAjustada = adjustToBusinessDay(parcela.dataVencimento)
      const status = calcularStatus(dataVencimentoAjustada)

      let pagseguroData = null

      if (pagseguroHabilitado) {
        try {
          console.log("[v0] Tentando criar boleto no PagSeguro para parcela", parcela.parcela)

          const { getPagSeguroAPI } = await import("@/lib/pagseguro")
          const pagseguro = getPagSeguroAPI()

          const ufNormalizada = normalizarEstado(cliente.estado)
          const nomeEstado = obterNomeEstado(ufNormalizada)
          console.log("[v0] Estado normalizado:", cliente.estado, "->", ufNormalizada, "->", nomeEstado)

          const telefoneLimpo = (cliente.telefone || "11999999999").replace(/\D/g, "")
          const telefoneCompleto = telefoneLimpo.length >= 10 ? telefoneLimpo : "11999999999"
          const ddd = telefoneCompleto.substring(0, 2)
          const numeroTelefone = telefoneCompleto.substring(2)

          // Calcular data para multa e juros (D+1 após vencimento)
          const dataVenc = new Date(dataVencimentoAjustada)
          const dataMultaJuros = new Date(dataVenc)
          dataMultaJuros.setDate(dataMultaJuros.getDate() + 1)
          const dataMultaJurosStr = dataMultaJuros.toISOString().split("T")[0]

          const taxId = (cliente.cnpj || cliente.cpf || "").replace(/\D/g, "")
          const taxIdValido = taxId.length >= 11 ? taxId : "00000000000"
          const emailValido =
            cliente.email && cliente.email.includes("@") ? cliente.email : `cliente${clienteId}@sistema.com`
          const cepValido = (cliente.cep || "").replace(/\D/g, "")
          const cepCompleto = cepValido.length === 8 ? cepValido : "01310100"

          const enderecoValido = (cliente.endereco || "Rua Principal").substring(0, 160)
          const bairroValido = (cliente.bairro || "Centro").substring(0, 60)
          const cidadeValida = (cliente.cidade || "São Paulo").substring(0, 90)
          const numeroEndereco = cliente.numero || "S/N"

          const valorMinimo = 0.2
          const valorParcela = parcela.valor < valorMinimo ? valorMinimo : parcela.valor

          console.log("[v0] Validação de campos PagSeguro:", {
            taxId: taxIdValido.substring(0, 3) + "***",
            email: emailValido,
            cep: cepCompleto,
            endereco: enderecoValido,
            uf: ufNormalizada,
            estado: nomeEstado,
            valorParcela,
            valorMinimo,
          })

          const boletoPagSeguro = await pagseguro.criarBoleto({
            customer: {
              name: cliente.nome,
              email: emailValido,
              tax_id: taxIdValido,
              phone: telefoneCompleto,
            },
            items: [
              {
                reference_id: numeroBoleto,
                name: `Boleto ${numeroBoleto}`,
                quantity: 1,
                unit_amount: Math.round(valorParcela * 100),
              },
            ],
            shipping_address: {
              street: enderecoValido,
              number: numeroEndereco,
              locality: bairroValido,
              city: cidadeValida,
              region_code: ufNormalizada,
              country: "BRA",
              postal_code: cepCompleto,
            },
            charges: [
              {
                reference_id: numeroBoleto,
                description: `Boleto ${numeroBoleto}${observacoes ? ` - ${observacoes}` : ""}`,
                amount: {
                  value: Math.round(valorParcela * 100),
                  currency: "BRL",
                },
                payment_method: {
                  type: "BOLETO",
                  boleto: {
                    template: "COBRANCA",
                    due_date: dataVencimentoAjustada,
                    days_until_expiration: 45,
                    holder: {
                      name: cliente.nome,
                      tax_id: taxIdValido,
                      email: emailValido,
                      address: {
                        street: enderecoValido,
                        number: numeroEndereco,
                        postal_code: cepCompleto,
                        locality: bairroValido,
                        city: cidadeValida,
                        region: nomeEstado,
                        region_code: ufNormalizada,
                        country: "Brasil",
                      },
                    },
                    instruction_lines: {
                      line_1: observacoes?.substring(0, 80) || "Pagamento de serviço",
                      line_2: "Não receber após o vencimento",
                    },
                  },
                },
                payment_instructions: {
                  fine: {
                    date: dataMultaJurosStr,
                    value: 200,
                  },
                  interest: {
                    date: dataMultaJurosStr,
                    value: 33,
                  },
                },
              },
            ],
          })

          pagseguroData = boletoPagSeguro
          console.log("[v0] Boleto PagSeguro criado com sucesso:", {
            id: boletoPagSeguro.id,
            charge_id: boletoPagSeguro.charges?.[0]?.id,
            status: boletoPagSeguro.charges?.[0]?.status,
            barcode: boletoPagSeguro.charges?.[0]?.payment_method?.boleto?.formatted_barcode ? "Presente" : "Ausente",
            links: boletoPagSeguro.charges?.[0]?.links?.length || 0,
          })
        } catch (error) {
          console.error("[v0] Erro ao criar boleto no PagSeguro:", error)
          if (error instanceof Error) {
            console.error("[v0] Mensagem de erro:", error.message)
            console.error("[v0] Stack trace:", error.stack)
          } else {
            console.error("[v0] Detalhes do erro:", JSON.stringify(error, null, 2))
          }
          return NextResponse.json(
            {
              success: false,
              message: "Erro ao criar boleto no PagSeguro. Verifique os dados do cliente e tente novamente.",
              error: error instanceof Error ? error.message : "Erro desconhecido",
            },
            { status: 400 },
          )
        }
      } else {
        console.log("[v0] PagSeguro não configurado, criando boleto apenas no sistema interno")
      }

      const charge = pagseguroData?.charges?.[0]
      const boletoInfo = charge?.payment_method?.boleto
      const linkPDF = charge?.links?.find((l: any) => l.media === "application/pdf")?.href
      const linkPNG = charge?.links?.find((l: any) => l.media === "image/png")?.href

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
          pagseguro_id,
          linha_digitavel,
          codigo_barras,
          link_pdf,
          link_impressao,
          created_at,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
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
          charge?.id || null,
          boletoInfo?.formatted_barcode || null,
          boletoInfo?.barcode || null,
          linkPDF || null,
          linkPNG || null,
        ],
      )

      console.log("[v0] Boleto salvo no banco:", numeroBoleto)
    }

    console.log("[v0] Todos os boletos criados com sucesso")

    return NextResponse.json({
      success: true,
      message: `${parcelas.length} boleto(s) criado(s) com sucesso!`,
    })
  } catch (error) {
    console.error("[v0] Erro ao criar boletos:", error)
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
