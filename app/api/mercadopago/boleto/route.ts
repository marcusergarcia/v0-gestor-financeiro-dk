import { type NextRequest, NextResponse } from "next/server"
import { createBoletoPayment } from "@/lib/mercadopago"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { nome, cpf, email, valor, numeroNota } = body

    console.log("[v0] Recebendo requisição boleto Mercado Pago:", {
      nome,
      cpf,
      email,
      valor,
      numeroNota,
    })

    // Validações
    if (!nome || !cpf || !email || !valor) {
      return NextResponse.json({ error: "Campos obrigatórios faltando" }, { status: 400 })
    }

    const valorCentavos = typeof valor === "number" ? valor : Number.parseFloat(valor)

    if (isNaN(valorCentavos) || valorCentavos < 50) {
      return NextResponse.json({ error: "Valor mínimo de R$ 0,50" }, { status: 400 })
    }

    const paymentData = {
      transaction_amount: valorCentavos / 100, // Converter centavos para reais
      description: `Nota Fiscal ${numeroNota || "N/A"}`,
      payment_method_id: "bolbradesco",
      payer: {
        email,
        first_name: nome.split(" ")[0],
        last_name: nome.split(" ").slice(1).join(" ") || nome.split(" ")[0],
        identification: {
          type: cpf.length === 14 ? "CNPJ" : "CPF",
          number: cpf.replace(/\D/g, ""),
        },
      },
    }

    // Criar pagamento no Mercado Pago
    const response = await createBoletoPayment(paymentData)

    return NextResponse.json({
      success: true,
      payment_id: response.id,
      status: response.status,
      status_detail: response.status_detail,
      external_resource_url: response.transaction_details?.external_resource_url,
      response: response,
    })
  } catch (error: any) {
    console.error("[v0] Erro ao criar boleto Mercado Pago:", error)
    return NextResponse.json(
      {
        error: "Erro ao criar boleto",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
