import { type NextRequest, NextResponse } from "next/server"
import { createBoletoPayment } from "@/lib/mercadopago"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { cliente, valor, numeroNota } = body

    console.log("[v0] Recebendo requisição boleto Mercado Pago com cliente:", {
      clienteId: cliente?.id,
      clienteNome: cliente?.nome,
      valor,
      numeroNota,
    })

    if (!cliente || !cliente.nome || !cliente.email || !cliente.cpf_cnpj) {
      return NextResponse.json({ error: "Dados do cliente incompletos" }, { status: 400 })
    }

    if (!valor) {
      return NextResponse.json({ error: "Valor é obrigatório" }, { status: 400 })
    }

    const valorCentavos = typeof valor === "number" ? valor : Number.parseFloat(valor)

    if (isNaN(valorCentavos) || valorCentavos < 50) {
      return NextResponse.json({ error: "Valor mínimo de R$ 0,50" }, { status: 400 })
    }

    const paymentData = {
      transaction_amount: valorCentavos / 100,
      description: numeroNota ? `Nota Fiscal ${numeroNota}` : "Mensalidade Condomínio",
      payment_method_id: "bolbradesco",
      payer: {
        email: cliente.email,
        first_name: cliente.nome.split(" ")[0],
        last_name: cliente.nome.split(" ").slice(1).join(" ") || cliente.nome.split(" ")[0],
        identification: {
          type: cliente.cpf_cnpj.replace(/\D/g, "").length === 14 ? "CNPJ" : "CPF",
          number: cliente.cpf_cnpj.replace(/\D/g, ""),
        },
      },
    }

    console.log("[v0] Payload Mercado Pago:", JSON.stringify(paymentData, null, 2))

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
