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

    const descricao_produto = `NOTA FISCAL - ${numero_nota} - ${data_nota} - Parcelas 1/${numero_parcelas}`

    const parcelas = []
    const valorParcela = valor_total / numero_parcelas
    let dataVencimento = new Date(primeiro_vencimento)

    for (let i = 1; i <= numero_parcelas; i++) {
      const descricaoParcela = `NOTA FISCAL - ${numero_nota} - ${data_nota} - Parcelas ${i}/${numero_parcelas}`

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

    // Inserir cada parcela como um boleto separado
    const resultados: any[] = []

    for (let i = 0; i < parcelas.length; i++) {
      const parcela = parcelas[i]
      const numeroBoleto =
        parcelas.length > 1 ? `${numero_nota}-${String(parcela.parcela).padStart(2, "0")}` : numero_nota

      console.log(`[v0] ====== INICIANDO PARCELA ${i + 1}/${parcelas.length} ======`)
      console.log(`[v0] Número do boleto: ${numeroBoleto}`)
      console.log(`[v0] Valor: R$ ${parcela.valor.toFixed(2)}`)
      console.log(`[v0] Vencimento: ${parcela.dataVencimento}`)

      const dataVencimentoAjustada = adjustToBusinessDay(parcela.dataVencimento)
      const status = calcularStatus(dataVencimentoAjustada)

      let pagseguroData = null

      if (pagseguroHabilitado) {
        try {
          if (i > 0) {
            console.log(`[v0] Aguardando 2 segundos antes da próxima requisição...`)
            await new Promise((resolve) => setTimeout(resolve, 2000))
          }

          const { getPagSeguroAPI } = await import("@/lib/pagseguro")
          const pagseguro = getPagSeguroAPI()

          const ufNormalizada = normalizarEstado(cliente.estado)
          const nomeEstado = obterNomeEstado(ufNormalizada)

          const telefoneLimpo = (cliente.telefone || "11999999999").replace(/\D/g, "")
          const telefoneCompleto = telefoneLimpo.length >= 10 ? telefoneLimpo : "11999999999"
          const ddd = typeof telefoneCompleto === "string" ? telefoneCompleto.substring(0, 2) : "11"
          const numeroTelefone = typeof telefoneCompleto === "string" ? telefoneCompleto.substring(2) : "999999999"

          const dataVenc = new Date(dataVencimentoAjustada)
          const dataMultaJuros = new Date(dataVenc)
          dataMultaJuros.setDate(dataMultaJuros.getDate() + 1)
          const dataMultaJurosStr = dataMultaJuros.toISOString().split("T")[0]

          const taxId = (cliente.cnpj || cliente.cpf || "").replace(/\D/g, "")
          const taxIdValido = taxId.length >= 11 ? taxId : "00000000000"
          const emailValido =
            cliente.email && cliente.email.includes("@") ? cliente.email : `cliente${cliente_id}@sistema.com`
          const cepValido = (cliente.cep || "").replace(/\D/g, "")
          const cepCompleto = cepValido.length === 8 ? cepValido : "01310100"

          const enderecoValido =
            typeof cliente.endereco === "string" ? cliente.endereco.substring(0, 160) : "Rua Principal"
          const bairroValido = typeof cliente.bairro === "string" ? cliente.bairro.substring(0, 60) : "Centro"
          const cidadeValida = typeof cliente.cidade === "string" ? cliente.cidade.substring(0, 90) : "São Paulo"
          const numeroEndereco = cliente.numero || "S/N"

          const valorMinimo = 0.2
          const valorParcela = parcela.valor < valorMinimo ? valorMinimo : parcela.valor

          const descricaoParcela = parcela.descricao || descricao_produto || `Boleto ${numeroBoleto}`

          const multaPercentual = multa_percentual || 2.0
          const jurosMesPercentual = juros_mes_percentual || 2.0

          // PagBank espera: multa e juros como percentual × 100
          // Exemplo: 2% = 200 (tanto para multa quanto para juros)
          const multaValor = Math.round(multaPercentual * 100) // 2% -> 200
          const jurosValor = Math.round(jurosMesPercentual * 100) // 2% -> 200

          // Validando limites do PagBank: fine (1-9999), interest (1-5999)
          const multaValorFinal = Math.max(1, Math.min(9999, multaValor))
          const jurosValorFinal = Math.max(1, Math.min(5999, jurosValor))

          const boletoRequest = {
            reference_id: numeroBoleto,
            customer: {
              name: cliente.nome,
              email: emailValido,
              tax_id: taxIdValido,
            },
            items: [
              {
                name:
                  typeof descricaoParcela === "string"
                    ? descricaoParcela.substring(0, 255)
                    : `Boleto ${numeroBoleto}`.substring(0, 255),
                quantity: 1,
                unit_amount: Math.round(valorParcela * 100),
              },
            ],
            charges: [
              {
                reference_id: numeroBoleto,
                description:
                  typeof descricaoParcela === "string" && descricaoParcela.length > 0
                    ? descricaoParcela.substring(0, 64)
                    : `Boleto ${numeroBoleto}`.substring(0, 64),
                amount: {
                  value: Math.round(valorParcela * 100),
                  currency: "BRL",
                },
                payment_method: {
                  type: "BOLETO",
                  boleto: {
                    template: "COBRANCA",
                    due_date: dataVencimentoAjustada,
                    days_until_expiration: 30, // mudado de "45" (string) para 30 (número) conforme REQUEST aprovado
                    instruction_lines: {
                      line_1: instrucao_linha1 || "Pagamento ate o vencimento",
                      line_2: instrucao_linha2 || "Apos vencimento cobrar multa e juros",
                    },
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
                        country: "BRA", // mudado de "Brasil" para "BRA" conforme REQUEST aprovado
                      },
                    },
                  },
                },
              },
            ],
          }

          console.log(`[v0] Enviando requisição ao PagBank para parcela ${i + 1}/${parcelas.length}`)
          console.log("[v0] Reference ID:", numeroBoleto)

          const boletoPagSeguro = await pagseguro.criarBoleto(boletoRequest)

          console.log(`[v0] ✓ SUCESSO! Parcela ${i + 1}/${parcelas.length} criada no PagBank`)
          console.log(`[v0] ID PagBank: ${boletoPagSeguro.id}`)
          console.log(`[v0] Status: ${boletoPagSeguro.charges?.[0]?.status}`)

          pagseguroData = boletoPagSeguro
          resultados.push({
            parcela: i + 1,
            numeroBoleto,
            sucesso: true,
            pagseguroId: boletoPagSeguro.id,
          })
        } catch (error) {
          console.error(`[v0] ✗ ERRO na parcela ${i + 1}/${parcelas.length}`)
          console.error(`[v0] Boleto: ${numeroBoleto}`)
          console.error(`[v0] Erro completo:`, error)
          console.error(`[v0] Stack trace:`, error instanceof Error ? error.stack : "N/A")

          resultados.push({
            parcela: i + 1,
            numeroBoleto,
            sucesso: false,
            erro: error instanceof Error ? error.message : "Erro desconhecido",
          })

          let mensagemErro = `Erro ao criar parcela ${i + 1}/${parcelas.length} no PagSeguro.`

          if (error instanceof Error && error.message.includes("ACCESS_DENIED")) {
            mensagemErro =
              "Acesso negado pelo PagSeguro. O IP/domínio do servidor não está na whitelist da sua conta PagSeguro."
          } else if (error instanceof Error && error.message.includes("403")) {
            mensagemErro =
              "Acesso negado pelo PagSeguro (403). Verifique se sua conta tem permissão para criar boletos."
          } else if (error instanceof Error && error.message.includes("401")) {
            mensagemErro = "Token de autenticação inválido. Verifique o PAGSEGURO_TOKEN nas variáveis de ambiente."
          } else if (error instanceof Error) {
            mensagemErro += ` Erro: ${error.message}`
          }

          const parcelasCriadas = resultados.filter((r) => r.sucesso).length

          return NextResponse.json(
            {
              success: false,
              message: mensagemErro,
              error: error instanceof Error ? error.message : "Erro desconhecido",
              parcelaFalhou: i + 1,
              totalParcelas: parcelas.length,
              parcelasCriadas,
              resultados,
            },
            { status: 400 },
          )
        }
      }

      const charge = pagseguroData?.charges?.[0]
      const boletoInfo = charge?.payment_method?.boleto
      const linkPDF = charge?.links?.find((l: any) => l.media === "application/pdf")?.href
      const linkPNG = charge?.links?.find((l: any) => l.media === "image/png")?.href

      console.log(`[v0] Inserindo parcela ${i + 1}/${parcelas.length} no banco de dados`)

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
          data_nota,
          descricao_produto,
          multa,
          juros,
          created_at,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
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
          charge?.id || null,
          boletoInfo?.formatted_barcode || null,
          boletoInfo?.barcode || null,
          linkPDF || null,
          linkPNG || null,
          data_nota || null,
          parcela.descricao,
          multa_percentual || 2.0,
          juros_mes_percentual || 2.0,
        ],
      )

      console.log(`[v0] ✓ Parcela ${i + 1}/${parcelas.length} inserida no banco com sucesso`)
      console.log(`[v0] ====== FIM PARCELA ${i + 1}/${parcelas.length} ======\n`)
    }

    console.log(`[v0] ====== PROCESSO CONCLUÍDO ======`)
    console.log(`[v0] Total de boletos criados: ${resultados.length}`)
    console.log(`[v0] Sucessos: ${resultados.filter((r) => r.sucesso).length}`)
    console.log(`[v0] Falhas: ${resultados.filter((r) => !r.sucesso).length}`)
    console.log(`[v0] Resultados:`, JSON.stringify(resultados, null, 2))

    return NextResponse.json({
      success: true,
      message: `${parcelas.length} boleto(s) criado(s) com sucesso!`,
      resultados,
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
