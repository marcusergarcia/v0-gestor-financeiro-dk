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
  }
  external_reference?: string
  notification_url?: string
}

export async function createBoletoPayment(data: MercadoPagoPaymentRequest) {
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN

  if (!accessToken) {
    console.error("[v0] MERCADOPAGO_ACCESS_TOKEN não encontrado nas variáveis de ambiente")
    throw new Error("MERCADOPAGO_ACCESS_TOKEN não configurado")
  }

  console.log("[v0] Access Token encontrado:", accessToken.substring(0, 20) + "...")
  console.log("[v0] Criando pagamento Mercado Pago:", JSON.stringify(data, null, 2))

  const response = await fetch("https://api.mercadopago.com/v1/payments", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(data),
  })

  const responseData = await response.json()

  console.log("[v0] Status HTTP:", response.status)
  console.log("[v0] Resposta Mercado Pago:", JSON.stringify(responseData, null, 2))

  if (!response.ok) {
    throw new Error(`Mercado Pago API Error: ${responseData.message || JSON.stringify(responseData)}`)
  }

  return responseData
}
