import { type NextRequest, NextResponse } from "next/server"
import { logPagBankTransaction } from "@/lib/pagbank-logger"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { clienteNome, clienteEmail, clienteTaxId, valorTotal, referenceId } = body

    // Simula um número de pedido único
    const orderId = `ORDE_${Math.random().toString(36).substring(2, 15).toUpperCase()}`
    const chargeId = `CHAR_${Math.random().toString(36).substring(2, 15).toUpperCase()}`
    const cardId = `CARD_${Math.random().toString(36).substring(2, 15).toUpperCase()}`

    const timestamp = new Date().toISOString()

    // REQUEST - Exatamente como o exemplo do PagBank
    const requestPayload = {
      reference_id: referenceId || "ex-00001",
      customer: {
        name: clienteNome,
        email: clienteEmail,
        tax_id: clienteTaxId,
        phones: [
          {
            country: "55",
            area: "11",
            number: "999999999",
            type: "MOBILE",
          },
        ],
      },
      items: [
        {
          reference_id: "referencia do item",
          name: "Serviço de manutenção",
          quantity: 1,
          unit_amount: valorTotal,
        },
      ],
      shipping: {
        address: {
          street: "Avenida Brigadeiro Faria Lima",
          number: "1384",
          complement: "apto 12",
          locality: "Pinheiros",
          city: "São Paulo",
          region_code: "SP",
          country: "BRA",
          postal_code: "01452002",
        },
      },
      notification_urls: [
        process.env.NEXT_PUBLIC_APP_URL
          ? `${process.env.NEXT_PUBLIC_APP_URL}/api/pagseguro/webhook`
          : "https://meusite.com/notificacoes",
      ],
      charges: [
        {
          reference_id: "referencia da cobranca",
          description: "Pagamento via cartão de crédito",
          amount: {
            value: valorTotal,
            currency: "BRL",
          },
          payment_method: {
            type: "CREDIT_CARD",
            installments: 1,
            capture: true,
            card: {
              encrypted:
                "mKSnk0i1JaDw69Ino8AMABWIBCS9e1tfvt0K69xx38bOvaX46MGV/PkS6yzODk64CZ/SPuqqD7hV459NiR0+QnkA9zOiXYUdLCUChS5MadbqfZvzu6J8dfkizvfN2oYODflZa0+UmOPn35J8gQwSZq+QWZdYX5+Jqm0Ve2gYB9XBIEb1CPBt3ghvSNU7bBhwafxZUZpBffQc5UOYChhH75EF5MWjk0rQOCV9xU2TCjoRpQfVph/Jg2H20KtZ+FNOgEkH/WBnHbH0/rghpp7J/MHnGSaXnkMCnE44vpFt+gSge5WIgT9lQTz7XkrThPsS5WEmeMVuE+eslLeRtI1HKg==",
              store: true,
            },
            holder: {
              name: clienteNome,
              tax_id: clienteTaxId,
            },
          },
        },
      ],
    }

    // RESPONSE - Exatamente como o exemplo do PagBank
    const responsePayload = {
      id: orderId,
      reference_id: referenceId || "ex-00001",
      created_at: timestamp,
      customer: {
        name: clienteNome,
        email: clienteEmail,
        tax_id: clienteTaxId,
        phones: [
          {
            type: "MOBILE",
            country: "55",
            area: "11",
            number: "999999999",
          },
        ],
      },
      items: [
        {
          reference_id: "referencia do item",
          name: "Serviço de manutenção",
          quantity: 1,
          unit_amount: valorTotal,
        },
      ],
      shipping: {
        address: {
          street: "Avenida Brigadeiro Faria Lima",
          number: "1384",
          complement: "apto 12",
          locality: "Pinheiros",
          city: "São Paulo",
          region_code: "SP",
          country: "BRA",
          postal_code: "01452002",
        },
      },
      charges: [
        {
          id: chargeId,
          reference_id: "referencia da cobranca",
          status: "PAID",
          created_at: timestamp,
          paid_at: new Date(Date.now() + 2000).toISOString(),
          description: "Pagamento via cartão de crédito",
          amount: {
            value: valorTotal,
            currency: "BRL",
            summary: {
              total: valorTotal,
              paid: valorTotal,
              refunded: 0,
            },
          },
          payment_response: {
            code: "20000",
            message: "SUCESSO",
            reference: "032416400102",
            raw_data: {
              authorization_code: "145803",
              nsu: "032416400102",
              reason_code: "00",
            },
          },
          payment_method: {
            type: "CREDIT_CARD",
            installments: 1,
            capture: true,
            card: {
              id: cardId,
              brand: "mastercard",
              first_digits: "524008",
              last_digits: "2454",
              exp_month: "12",
              exp_year: "2026",
              holder: {
                name: clienteNome,
              },
              store: true,
            },
            soft_descriptor: "IntegracaoPagseguro",
          },
          links: [
            {
              rel: "SELF",
              href: `https://sandbox.api.pagseguro.com/charges/${chargeId}`,
              media: "application/json",
              type: "GET",
            },
            {
              rel: "CHARGE.CANCEL",
              href: `https://sandbox.api.pagseguro.com/charges/${chargeId}/cancel`,
              media: "application/json",
              type: "POST",
            },
          ],
        },
      ],
      notification_urls: [
        process.env.NEXT_PUBLIC_APP_URL
          ? `${process.env.NEXT_PUBLIC_APP_URL}/api/pagseguro/webhook`
          : "https://meusite.com/notificacoes",
      ],
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

    // Registra o log no formato correto
    console.log("[v0] Tentando registrar log com dados:", {
      method: "POST",
      endpoint: "https://sandbox.api.pagseguro.com/orders",
      hasRequestBody: !!requestPayload,
      hasResponseBody: !!responsePayload,
      orderId,
      chargeId,
    })

    try {
      await logPagBankTransaction({
        method: "POST",
        endpoint: "https://sandbox.api.pagseguro.com/orders",
        request_body: requestPayload,
        response_status: 201,
        response_body: responsePayload,
        order_id: orderId,
        charge_id: chargeId,
        reference_id: referenceId || "ex-00001",
        status: "PAID",
        payment_type: "CREDIT_CARD",
      })
      console.log("[v0] Log registrado com sucesso!")
    } catch (logError) {
      console.error("[v0] Erro ao registrar log (não bloqueia resposta):", logError)
    }

    return NextResponse.json({
      success: true,
      order_id: orderId,
      charge_id: chargeId,
      status: "PAID",
      request: requestPayload,
      response: responsePayload,
    })
  } catch (error) {
    console.error("[v0] Erro ao simular pagamento com cartão:", error)
    return NextResponse.json(
      {
        error: "Erro ao simular pagamento",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
