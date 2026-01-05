import { type NextRequest, NextResponse } from "next/server"
import { logPagBankTransaction } from "@/lib/pagbank-logger"
import { query } from "@/lib/db"

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

    const requestPayload: any = {
      reference_id: numeroNota,
      customer: {
        name: cliente.nome,
        email: emailValido,
        tax_id: taxIdValido,
        phones: [
          {
            country: "55",
            area: telefoneCompleto.substring(0, 2),
            number: telefoneCompleto.substring(2),
            type: "MOBILE",
          },
        ],
      },
      items: [
        {
          reference_id: numeroNota,
          name: descricao || `NOTA FISCAL - ${numeroNota} - ${dataNotaFormatada} - Parcelas 1/${numeroParcelas}`,
          quantity: 1,
          unit_amount: Math.round(valorTotal * 100),
        },
      ],
      shipping: {
        address: {
          street: enderecoValido,
          number: numeroEndereco,
          complement: cliente.complemento || "",
          locality: bairroValido,
          city: cidadeValida,
          region_code: ufNormalizada,
          region: nomeEstado,
          country: "BRA",
          postal_code: cepCompleto,
        },
      },
      notification_urls: [`${process.env.NEXT_PUBLIC_APP_URL || "https://gestor9.vercel.app"}/api/pagseguro/webhook`],
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

      const descricaoParcela = `NOTA FISCAL - ${numeroNota} - ${dataNotaFormatada} - Parcelas ${i + 1}/${numeroParcelas}`

      requestPayload.charges.push({
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
                country: "BRA",
              },
            },
            instruction_lines: {
              line_1: "Pagamento de serviço",
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

    const orderId = `ORDE_${Math.random().toString(36).substring(2, 15).toUpperCase()}`
    const responsePayload: any = {
      id: orderId,
      reference_id: numeroNota,
      created_at: new Date().toISOString(),
      customer: requestPayload.customer,
      items: requestPayload.items,
      shipping: requestPayload.shipping,
      charges: requestPayload.charges.map((charge: any) => {
        const chargeId = `CHAR_${Math.random().toString(36).substring(2, 15).toUpperCase()}`
        const boletoId = `BOL_${Math.random().toString(36).substring(2, 15).toUpperCase()}`

        return {
          id: chargeId,
          reference_id: charge.reference_id,
          status: "WAITING",
          created_at: new Date().toISOString(),
          description: charge.description,
          amount: {
            ...charge.amount,
            summary: {
              total: charge.amount.value,
              paid: 0,
              refunded: 0,
            },
          },
          payment_response: {
            code: "20000",
            message: "SUCESSO",
          },
          payment_method: {
            type: "BOLETO",
            boleto: {
              id: boletoId,
              barcode: "03399632906400000000000000000000000000000000000",
              formatted_barcode: "03399.63290 64000.000000 00000.000000 0 00000000000000",
              due_date: charge.payment_method.boleto.due_date,
              instruction_lines: charge.payment_method.boleto.instruction_lines,
              holder: charge.payment_method.boleto.holder,
              links: [
                {
                  rel: "SELF",
                  href: `https://sandbox.api.pagseguro.com/pix/${boletoId}`,
                  media: "application/pdf",
                  type: "GET",
                },
              ],
            },
          },
          links: [
            {
              rel: "SELF",
              href: `https://sandbox.api.pagseguro.com/charges/${chargeId}`,
              media: "application/json",
              type: "GET",
            },
            {
              rel: "PAY",
              href: `https://payment-app.pagseguro.com/${chargeId}`,
              media: "text/html",
              type: "GET",
            },
          ],
        }
      }),
      notification_urls: requestPayload.notification_urls,
      links: [
        {
          rel: "SELF",
          href: `https://sandbox.api.pagseguro.com/orders/${orderId}`,
          media: "application/json",
          type: "GET",
        },
        {
          rel: "PAY",
          href: `https://sandbox.api.pagseguro.com/orders/${orderId}/pay`,
          media: "application/json",
          type: "POST",
        },
      ],
    }

    await logPagBankTransaction({
      method: numeroParcelas > 1 ? "BOLETO_PARCELADO" : "BOLETO",
      endpoint: "/charges",
      request: requestPayload,
      response: responsePayload,
      success: true,
      statusCode: 200,
    })

    return NextResponse.json({
      success: true,
      request: requestPayload,
      response: responsePayload,
      message: `Log de ${numeroParcelas > 1 ? `boleto parcelado (${numeroParcelas}x)` : "boleto simples"} gerado com sucesso!`,
    })
  } catch (error) {
    console.error("[v0] Erro ao gerar boleto simulado:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao gerar boleto simulado" },
      { status: 500 },
    )
  }
}
