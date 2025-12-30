import { type NextRequest, NextResponse } from "next/server"
import { getPagSeguroAPI } from "@/lib/pagseguro"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, type, data } = body

    console.log("[Test PagBank] Executando teste:", name)

    const pagseguro = getPagSeguroAPI()

    if (type === "boleto") {
      const boletoData = {
        customer: {
          name: data.customer.name,
          email: data.customer.email,
          tax_id: data.customer.tax_id,
          phone: data.customer.phone,
        },
        items: [
          {
            reference_id: `TEST-${Date.now()}`,
            name: "Teste de Integração PagBank",
            quantity: 1,
            unit_amount: data.amount,
          },
        ],
        shipping_address: {
          street: "Avenida Paulista",
          number: "1000",
          locality: "Bela Vista",
          city: "São Paulo",
          region_code: "SP",
          country: "BRA",
          postal_code: "01310100",
        },
        charges: [
          {
            reference_id: `CHARGE-TEST-${Date.now()}`,
            description: "Teste de Integração - Boleto",
            amount: {
              value: data.amount,
              currency: "BRL" as const,
            },
            payment_method: {
              type: "BOLETO" as const,
              boleto: {
                template: "COBRANCA" as const,
                due_date: data.dueDate,
                days_until_expiration: 30,
                holder: {
                  name: data.customer.name,
                  tax_id: data.customer.tax_id,
                  email: data.customer.email,
                  address: {
                    street: "Avenida Paulista",
                    number: "1000",
                    postal_code: "01310100",
                    locality: "Bela Vista",
                    city: "São Paulo",
                    region: "São Paulo",
                    region_code: "SP",
                    country: "BRA",
                  },
                },
                instruction_lines: {
                  line_1: "Pagamento de teste - Ambiente Sandbox",
                  line_2: "Não efetuar pagamento real",
                },
              },
            },
          },
        ],
      }

      const result = await pagseguro.criarBoleto(boletoData)
      return NextResponse.json({ success: true, data: result }, { status: 201 })
    }

    if (type === "pix") {
      const pixData = {
        customer: {
          name: data.customer.name,
          email: data.customer.email,
          tax_id: data.customer.tax_id,
          phone: data.customer.phone,
        },
        items: [
          {
            reference_id: `TEST-PIX-${Date.now()}`,
            name: "Teste PIX - Integração PagBank",
            quantity: 1,
            unit_amount: data.amount,
          },
        ],
        shipping_address: {
          street: "Avenida Paulista",
          number: "1000",
          locality: "Bela Vista",
          city: "São Paulo",
          region_code: "SP",
          country: "BRA",
          postal_code: "01310100",
        },
        charges: [
          {
            reference_id: `CHARGE-PIX-${Date.now()}`,
            description: "Teste de Integração - PIX",
            amount: {
              value: data.amount,
              currency: "BRL" as const,
            },
            payment_method: {
              type: "PIX" as const,
            },
          },
        ],
      }

      const result = await pagseguro.criarBoleto(pixData as any)
      return NextResponse.json({ success: true, data: result }, { status: 201 })
    }

    return NextResponse.json({ error: "Tipo de teste inválido" }, { status: 400 })
  } catch (error) {
    console.error("[Test PagBank] Erro:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 },
    )
  }
}
