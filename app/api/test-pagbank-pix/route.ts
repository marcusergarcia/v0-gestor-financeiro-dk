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
    const { clienteId, numeroNota, valorTotal } = body

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

    const valorEmCentavos = Math.round(valorTotal * 100)
    const expiration = new Date()
    expiration.setHours(expiration.getHours() + 24)

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
          name: `PIX ${numeroNota}`,
          quantity: 1,
          unit_amount: valorEmCentavos,
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
      charges: [
        {
          reference_id: numeroNota,
          description: `PIX ${numeroNota}`,
          amount: {
            value: valorEmCentavos,
            currency: "BRL",
          },
          payment_method: {
            type: "PIX",
            pix: {
              expiration_date: expiration.toISOString(),
            },
          },
        },
      ],
    }

    const orderId = `ORDE_${Math.random().toString(36).substring(2, 15).toUpperCase()}`
    const chargeId = `CHAR_${Math.random().toString(36).substring(2, 15).toUpperCase()}`
    const pixId = `PIX_${Math.random().toString(36).substring(2, 15).toUpperCase()}`

    const responsePayload: any = {
      id: orderId,
      reference_id: numeroNota,
      created_at: new Date().toISOString(),
      customer: requestPayload.customer,
      items: requestPayload.items,
      shipping: requestPayload.shipping,
      charges: [
        {
          id: chargeId,
          reference_id: numeroNota,
          status: "WAITING",
          created_at: new Date().toISOString(),
          description: `PIX ${numeroNota}`,
          amount: {
            value: valorEmCentavos,
            currency: "BRL",
            summary: {
              total: valorEmCentavos,
              paid: 0,
              refunded: 0,
            },
          },
          payment_response: {
            code: "20000",
            message: "SUCESSO",
          },
          payment_method: {
            type: "PIX",
            pix: {
              id: pixId,
              expiration_date: expiration.toISOString(),
              qr_code:
                "00020101021243650016COM.MERCADOLIBRE020130636f8f05d5-b8db-4ee4-a4a4-3fe8f7c9e6ee5204000053039865802BR5909Test Test6009SAO PAULO62070503***63040B6D",
              text: "00020101021243650016COM.MERCADOLIBRE020130636f8f05d5-b8db-4ee4-a4a4-3fe8f7c9e6ee5204000053039865802BR5909Test Test6009SAO PAULO62070503***63040B6D",
              links: [
                {
                  rel: "QRCODE",
                  href: `https://sandbox.api.pagseguro.com/pix/${pixId}/qrcode`,
                  media: "image/png",
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
          ],
        },
      ],
      notification_urls: requestPayload.notification_urls,
      links: [
        {
          rel: "SELF",
          href: `https://sandbox.api.pagseguro.com/orders/${orderId}`,
          media: "application/json",
          type: "GET",
        },
      ],
    }

    await logPagBankTransaction({
      method: "PIX",
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
      message: "Log de PIX gerado com sucesso!",
    })
  } catch (error) {
    console.error("[v0] Erro ao gerar PIX simulado:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao gerar PIX simulado" },
      { status: 500 },
    )
  }
}
