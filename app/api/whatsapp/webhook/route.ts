import { type NextRequest, NextResponse } from "next/server"

// Verificação do webhook (Meta exige isso na configuração inicial)
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const mode = searchParams.get("hub.mode")
  const token = searchParams.get("hub.verify_token")
  const challenge = searchParams.get("hub.challenge")

  console.log("[v0] GET Webhook - mode:", mode, "token:", token)

  const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || "seu_token_secreto"

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("[v0] Webhook verificado com sucesso")
    return new NextResponse(challenge, { status: 200 })
  }

  console.log("[v0] Verificação falhou")
  return NextResponse.json({ error: "Verificação falhou" }, { status: 403 })
}

// Receber mensagens do WhatsApp
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log("[v0] ===== WEBHOOK POST RECEBIDO =====")
    console.log("[v0] Body:", JSON.stringify(body, null, 2))

    // Extrair dados da mensagem
    const entry = body.entry?.[0]
    const changes = entry?.changes?.[0]
    const value = changes?.value
    const messages = value?.messages?.[0]

    if (!messages) {
      console.log("[v0] Nenhuma mensagem encontrada")
      return NextResponse.json({ status: "ok" })
    }

    const from = messages.from
    const messageBody = messages.text?.body || ""

    console.log("[v0] Mensagem de:", from)
    console.log("[v0] Texto:", messageBody)

    await sendSimpleMessage(from)

    return NextResponse.json({ status: "ok" })
  } catch (error) {
    console.error("[v0] ===== ERRO NO WEBHOOK =====")
    console.error("[v0] Erro:", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}

async function sendSimpleMessage(to: string) {
  const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID
  const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN

  console.log("[v0] ===== ENVIANDO MENSAGEM =====")
  console.log("[v0] Para:", to)
  console.log("[v0] PHONE_NUMBER_ID:", PHONE_NUMBER_ID || "NÃO CONFIGURADO")
  console.log("[v0] ACCESS_TOKEN:", ACCESS_TOKEN ? "CONFIGURADO" : "NÃO CONFIGURADO")

  if (!PHONE_NUMBER_ID || !ACCESS_TOKEN) {
    console.error("[v0] ❌ Credenciais não configuradas!")
    return
  }

  try {
    const url = `https://graph.facebook.com/v21.0/${PHONE_NUMBER_ID}/messages`

    const payload = {
      messaging_product: "whatsapp",
      to: to,
      type: "text",
      text: {
        body: "Olá! Bem-vindo ao Gestor Financeiro. Como posso ajudar?\n\n1️⃣ Criar nova ordem de serviço\n2️⃣ Consultar ordem de serviço\n3️⃣ Falar com atendente\n\nDigite o número da opção desejada.",
      },
    }

    console.log("[v0] URL:", url)
    console.log("[v0] Payload:", JSON.stringify(payload, null, 2))

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })

    const result = await response.json()

    console.log("[v0] Status HTTP:", response.status)
    console.log("[v0] Resposta da API:", JSON.stringify(result, null, 2))

    if (!response.ok) {
      console.error("[v0] ❌ ERRO na API do WhatsApp")
      console.error("[v0] Detalhes do erro:", JSON.stringify(result, null, 2))
    } else {
      console.log("[v0] ✅ MENSAGEM ENVIADA COM SUCESSO!")
    }

    return result
  } catch (error) {
    console.error("[v0] ❌ Exceção ao enviar mensagem:", error)
    console.error("[v0] Stack:", error instanceof Error ? error.stack : "N/A")
    throw error
  }
}
