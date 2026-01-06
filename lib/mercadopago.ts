import { MercadoPagoConfig, Payment } from "mercadopago"

export interface MercadoPagoPaymentRequest {
  transaction_amount: number
  description: string
  payment_method_id: string
  payer: {
    email: string
    first_name?: string
    last_name?: string
    identification: {
      type: string
      number: string
    }
    address?: {
      street_name: string
      street_number: number
      neighborhood: string
      zip_code: string
      federal_unit: string
      city: string
    }
  }
  external_reference?: string
  notification_url?: string
}

export function getMercadoPagoClient() {
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN

  if (!accessToken) {
    throw new Error("MERCADOPAGO_ACCESS_TOKEN não configurado")
  }

  return new MercadoPagoConfig({
    accessToken,
    options: {
      timeout: 10000,
    },
  })
}

export async function createBoletoPayment(data: MercadoPagoPaymentRequest) {
  const client = getMercadoPagoClient()
  const payment = new Payment(client)

  console.log("[v0] Criando pagamento Mercado Pago:", JSON.stringify(data, null, 2))

  const response = await payment.create({
    body: data,
  })

  console.log("[v0] Resposta Mercado Pago:", JSON.stringify(response, null, 2))

  return response
}
