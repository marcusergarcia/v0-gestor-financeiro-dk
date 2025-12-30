import { type NextRequest, NextResponse } from "next/server"
import { logPagBankTransaction } from "@/lib/pagbank-logger"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      customerName,
      customerEmail,
      customerTaxId,
      customerPhone,
      addressStreet,
      addressNumber,
      addressComplement,
      addressLocality,
      addressCity,
      addressState,
      addressPostalCode,
      itemName,
      itemValue,
      installments,
      type,
    } = body

    const valueInCents = Number.parseInt(itemValue)
    const numInstallments = Number.parseInt(installments)
    const isInstallments = type === "installments" && numInstallments > 1

    const referenceId = `ex-${Date.now()}`
    const orderId = `ORDE_${Math.random().toString(36).substring(2, 15).toUpperCase()}`

    const stateNames: Record<string, string> = {
      SP: "São Paulo",
      RJ: "Rio de Janeiro",
      MG: "Minas Gerais",
      RS: "Rio Grande do Sul",
      PR: "Paraná",
      SC: "Santa Catarina",
      BA: "Bahia",
      PE: "Pernambuco",
      CE: "Ceará",
      // Adicione outros estados conforme necessário
    }

    const requestPayload: any = {
      reference_id: referenceId,
      customer: {
        name: customerName,
        email: customerEmail,
        tax_id: customerTaxId,
        phones: [
          {
            country: "55",
            area: customerPhone.substring(0, 2),
            number: customerPhone.substring(2),
            type: "MOBILE",
          },
        ],
      },
      items: [
        {
          reference_id: `referencia do item`,
          name: itemName,
          quantity: 1,
          unit_amount: valueInCents,
        },
      ],
      shipping: {
        address: {
          street: addressStreet,
          number: addressNumber,
          complement: addressComplement,
          locality: addressLocality,
          city: addressCity,
          region_code: addressState,
          region: stateNames[addressState] || addressState,
          country: "BRA",
          postal_code: addressPostalCode,
        },
      },
      notification_urls: [`${process.env.NEXT_PUBLIC_APP_URL || "https://gestor9.vercel.app"}/api/pagseguro/webhook`],
      charges: [],
    }

    if (isInstallments) {
      const installmentValue = Math.floor(valueInCents / numInstallments)

      for (let i = 1; i <= numInstallments; i++) {
        const dueDate = new Date(Date.now() + i * 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]

        requestPayload.charges.push({
          reference_id: `referencia da cobranca ${i}`,
          description: `${itemName} - Parcela ${i}/${numInstallments}`,
          amount: {
            value: installmentValue,
            currency: "BRL",
          },
          payment_method: {
            type: "BOLETO",
            boleto: {
              due_date: dueDate,
              instruction_lines: {
                line_1: `Parcela ${i} de ${numInstallments}`,
                line_2: "Não receber após o vencimento",
              },
              holder: {
                name: customerName,
                tax_id: customerTaxId,
                email: customerEmail,
                address: {
                  street: addressStreet,
                  number: addressNumber,
                  complement: addressComplement,
                  locality: addressLocality,
                  city: addressCity,
                  region_code: addressState,
                  region: stateNames[addressState] || addressState,
                  country: "BRA",
                  postal_code: addressPostalCode,
                },
              },
            },
          },
        })
      }
    } else {
      const dueDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]

      requestPayload.charges.push({
        reference_id: "referencia da cobranca",
        description: itemName,
        amount: {
          value: valueInCents,
          currency: "BRL",
        },
        payment_method: {
          type: "BOLETO",
          boleto: {
            due_date: dueDate,
            instruction_lines: {
              line_1: "Pagamento via boleto bancário",
              line_2: "Não receber após o vencimento",
            },
            holder: {
              name: customerName,
              tax_id: customerTaxId,
              email: customerEmail,
              address: {
                street: addressStreet,
                number: addressNumber,
                complement: addressComplement,
                locality: addressLocality,
                city: addressCity,
                region_code: addressState,
                region: stateNames[addressState] || addressState,
                country: "BRA",
                postal_code: addressPostalCode,
              },
            },
          },
        },
      })
    }

    const responsePayload: any = {
      id: orderId,
      reference_id: referenceId,
      created_at: new Date().toISOString(),
      customer: requestPayload.customer,
      items: requestPayload.items,
      shipping: requestPayload.shipping,
      charges: requestPayload.charges.map((charge: any, index: number) => {
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
              barcode: "03399.63290 64000.000000 00000.000000 0 00000000000000",
              formatted_barcode: "03399632906400000000000000000000000000000000000",
              due_date: charge.payment_method.boleto.due_date,
              instruction_lines: charge.payment_method.boleto.instruction_lines,
              holder: charge.payment_method.boleto.holder,
              links: [
                {
                  rel: "SELF",
                  href: `https://sandbox.api.pagseguro.com/boletos/${boletoId}`,
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

    await logPagBankTransaction(
      isInstallments ? "BOLETO_PARCELADO" : "BOLETO",
      requestPayload,
      responsePayload,
      "success",
      200,
    )

    return NextResponse.json({
      success: true,
      request: requestPayload,
      response: responsePayload,
      message: `Log de ${isInstallments ? "boleto parcelado" : "boleto simples"} gerado com sucesso!`,
    })
  } catch (error) {
    console.error("[v0] Erro ao gerar boleto simulado:", error)
    return NextResponse.json({ error: "Erro ao gerar boleto simulado" }, { status: 500 })
  }
}
