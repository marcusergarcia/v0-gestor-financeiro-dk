import { type NextRequest, NextResponse } from "next/server"

// API para enviar mensagens manualmente (útil para notificações)
export async function POST(request: NextRequest) {
  try {
    const { to, message } = await request.json()

    console.log("[v0] 📨 Recebida requisição para enviar mensagem")
    console.log("[v0] 📞 Para:", to)
    console.log("[v0] 💬 Mensagem:", message)

    if (!to || !message) {
      console.log("[v0] ❌ Parâmetros faltando")
      return NextResponse.json({ error: "Parâmetros obrigatórios: to, message" }, { status: 400 })
    }

    const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID
    const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN

    console.log("[v0] 🔑 PHONE_NUMBER_ID:", PHONE_NUMBER_ID ? "Configurado" : "NÃO CONFIGURADO")
    console.log("[v0] 🔑 ACCESS_TOKEN:", ACCESS_TOKEN ? "Configurado" : "NÃO CONFIGURADO")

    if (!PHONE_NUMBER_ID || !ACCESS_TOKEN) {
      console.log("[v0] ❌ Credenciais não configuradas")
      return NextResponse.json({ error: "Credenciais do WhatsApp não configuradas" }, { status: 500 })
    }

    const url = `https://graph.facebook.com/v21.0/${PHONE_NUMBER_ID}/messages`
    console.log("[v0] 🌐 URL da API:", url)

    const body = {
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body: message },
    }

    console.log("[v0] 📦 Body da requisição:", JSON.stringify(body, null, 2))

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })

    const result = await response.json()

    console.log("[v0] 📡 Resposta da API WhatsApp (status):", response.status)
    console.log("[v0] 📡 Resposta da API WhatsApp (body):", JSON.stringify(result, null, 2))

    if (!response.ok) {
      console.log("[v0] ❌ Erro na API do WhatsApp")
      return NextResponse.json({ error: "Erro ao enviar mensagem", details: result }, { status: response.status })
    }

    console.log("[v0] ✅ Mensagem enviada com sucesso!")
    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    console.error("[v0] ❌ Erro ao enviar mensagem:", error)
    return NextResponse.json({ error: "Erro interno ao enviar mensagem" }, { status: 500 })
  }
}
