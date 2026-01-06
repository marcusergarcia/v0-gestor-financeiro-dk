import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"
import { getPagSeguroAPI } from "@/lib/pagseguro"

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
  return mapeamentoUF[uf.toUpperCase()] || "São Paulo"
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { clienteId, numeroNota, dataNota, valorTotal, numeroParcelas, primeiroVencimento, descricao, multa, juros } =
      body

    console.log("[v0] Buscando cliente no banco de dados...")
    const clientes = await query(`SELECT * FROM clientes WHERE id = ?`, [clienteId])

    if (clientes.length === 0) {
      return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 })
    }

    const cliente = clientes[0]

    const taxId = (cliente.cnpj || cliente.cpf || "").replace(/\D/g, "")
    const taxIdValido = taxId.length >= 11 ? taxId : "00000000000"
    const emailValido = cliente.email && cliente.email.includes("@") ? cliente.email : `cliente${clienteId}@sistema.com`
    const telefoneLimpo = (cliente.telefone || "11999999999").replace(/\D/g, "")
    const telefoneCompleto = telefoneLimpo.length >= 10 ? telefoneLimpo : "11999999999"
    const cepValido = (cliente.cep || "").replace(/\D/g, "")
    const cepCompleto = cepValido.length === 8 ? cepValido : "01310100"
    const enderecoValido = (cliente.endereco || "Rua Principal").substring(0, 160)
    const bairroValido = (cliente.bairro || "Centro").substring(0, 60)
    const cidadeValida = (cliente.cidade || "São Paulo").substring(0, 90)
    const numeroEndereco = cliente.numero || "S/N"
    const ufNormalizada = (cliente.estado || "SP").toUpperCase().substring(0, 2)
    const nomeEstado = obterNomeEstado(ufNormalizada)

    const valorParcela = valorTotal / numeroParcelas
    const valorParcelaEmCentavos = Math.round(valorParcela * 100)

    const dataNotaFormatada = dataNota
      ? new Date(dataNota + "T00:00:00").toLocaleDateString("pt-BR")
      : new Date().toLocaleDateString("pt-BR")

    const boletoData: any = {
      reference_id: `my_order_${numeroNota}`,
      customer: {
        name: cliente.nome,
        email: emailValido,
        tax_id: taxIdValido,
        phone: telefoneCompleto,
      },
      items: [
        {
          reference_id: `referencia_${numeroNota}`,
          name: descricao || `NOTA FISCAL - ${numeroNota} - ${dataNotaFormatada}`,
          quantity: 1,
          unit_amount: valorParcelaEmCentavos,
        },
      ],
      shipping_address: {
        street: enderecoValido,
        number: numeroEndereco,
        complement: cliente.complemento || "",
        locality: bairroValido,
        city: cidadeValida,
        region_code: ufNormalizada,
        country: "BRA",
        postal_code: cepCompleto,
      },
      charges: [],
    }

    for (let i = 0; i < numeroParcelas; i++) {
      const dataVencimento = new Date(primeiroVencimento)
      dataVencimento.setDate(dataVencimento.getDate() + i * 30)
      const dueDate = dataVencimento.toISOString().split("T")[0]

      const numeroBoleto = numeroParcelas > 1 ? `${numeroNota}-${String(i + 1).padStart(2, "0")}` : numeroNota

      const dataMultaJuros = new Date(dataVencimento)
      dataMultaJuros.setDate(dataMultaJuros.getDate() + 1)
      const dataMultaJurosStr = dataMultaJuros.toISOString().split("T")[0]

      const multaEmCentavos = multa ? Math.round(multa * 100) : 200
      const jurosEmCentavos = juros ? Math.round(juros * 100) : 200

      const descricaoParcela = descricao || `Boleto de fatura - Parcela ${i + 1}/${numeroParcelas}`

      boletoData.charges.push({
        reference_id: numeroBoleto,
        description: descricaoParcela,
        amount: {
          value: valorParcelaEmCentavos,
          currency: "BRL",
        },
        payment_method: {
          type: "BOLETO",
          boleto: {
            template: "COBRANCA",
            due_date: dueDate,
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
              line_1: "Pagamento ate a data de vencimento",
              line_2: "Não receber após o vencimento",
            },
          },
        },
        payment_instructions: {
          fine: {
            date: dataMultaJurosStr,
            value: multaEmCentavos,
          },
          interest: {
            date: dataMultaJurosStr,
            value: jurosEmCentavos,
          },
        },
      })
    }

    console.log("[v0] Fazendo chamada REAL à API do PagBank...")

    const pagSeguro = getPagSeguroAPI()
    const responsePayload = await pagSeguro.criarBoleto(boletoData)

    console.log("[v0] Resposta REAL recebida do PagBank:", responsePayload)

    return NextResponse.json({
      success: true,
      request: boletoData,
      response: responsePayload,
      message: `Boleto REAL criado com sucesso! ${numeroParcelas > 1 ? `(${numeroParcelas}x parcelas)` : ""}`,
    })
  } catch (error) {
    console.error("[v0] Erro ao criar boleto real:", error)
    return NextResponse.json(
      {
        error: "Erro ao criar boleto real",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
