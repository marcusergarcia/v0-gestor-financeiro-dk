import { type NextRequest, NextResponse } from "next/server"

// API para enviar mensagens manualmente (útil para notificações)
export async function POST(request: NextRequest) {
  try {
    const { to, message } = await request.json()

    if (!to || !message) {
      return NextResponse.json({ error: "Parâmetros obrigatórios: to, message" }, { status: 400 })
    }

    const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID
    const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN

    if (!PHONE_NUMBER_ID || !ACCESS_TOKEN) {
      return NextResponse.json({ error: "Credenciais do WhatsApp não configuradas" }, { status: 500 })
    }

    const response = await fetch(`https://graph.facebook.com/v21.0/${PHONE_NUMBER_ID}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { body: message },
      }),
    })

    const result = await response.json()

    if (!response.ok) {
      return NextResponse.json({ error: "Erro ao enviar mensagem", details: result }, { status: response.status })
    }

    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    console.error("[v0] Erro ao enviar mensagem:", error)
    return NextResponse.json({ error: "Erro interno ao enviar mensagem" }, { status: 500 })
  }
}
