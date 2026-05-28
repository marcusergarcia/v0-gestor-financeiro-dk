import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    const cronSecret = process.env.CRON_SECRET

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("[v0] 🔍 Verificando sessões expiradas...")

    const sessionsNeedingWarning = await query(
      `SELECT phone_number, current_step, last_activity
       FROM whatsapp_conversations 
       WHERE status = 'active'
       AND timeout_warning_sent = 0
       AND last_activity < DATE_SUB(NOW(), INTERVAL 5 MINUTE)
       AND last_activity > DATE_SUB(NOW(), INTERVAL 10 MINUTE)`,
    )

    let warningsSent = 0
    if (sessionsNeedingWarning && (sessionsNeedingWarning as any[]).length > 0) {
      for (const session of sessionsNeedingWarning as any[]) {
        await sendInactivityWarning(session.phone_number)
        warningsSent++
      }
    }

    const sessionsToExpire = await query(
      `SELECT phone_number, current_step, last_activity
       FROM whatsapp_conversations 
       WHERE status = 'active'
       AND last_activity < DATE_SUB(NOW(), INTERVAL 10 MINUTE)`,
    )

    let sessionsExpired = 0
    if (sessionsToExpire && (sessionsToExpire as any[]).length > 0) {
      for (const session of sessionsToExpire as any[]) {
        await expireSession(session.phone_number)
        sessionsExpired++
      }
    }

    console.log("[v0] ✅ Verificação concluída")
    console.log("[v0] ⚠️ Avisos enviados:", warningsSent)
    console.log("[v0] ❌ Sessões expiradas:", sessionsExpired)

    return NextResponse.json({
      success: true,
      warningsSent,
      sessionsExpired,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("[v0] ❌ Erro ao verificar timeouts:", error)
    return NextResponse.json({ error: "Erro ao verificar timeouts" }, { status: 500 })
  }
}

async function sendInactivityWarning(phoneNumber: string) {
  try {
    const WHATSAPP_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN
    const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID

    if (!WHATSAPP_TOKEN || !PHONE_NUMBER_ID) {
      console.error("[v0] ❌ Credenciais do WhatsApp não configuradas")
      return
    }

    await fetch(`https://graph.facebook.com/v21.0/${PHONE_NUMBER_ID}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${WHATSAPP_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: phoneNumber,
        text: {
          body:
            "⏰ *Você ainda está aí?*\n\n" +
            "Percebi que você ficou inativo por alguns minutos.\n\n" +
            "Se não responder em *5 minutos*, vou finalizar nosso atendimento automaticamente.\n\n" +
            "💡 _Digite qualquer mensagem para continuar ou 'menu' para voltar ao início_",
        },
      }),
    })

    await query(
      `UPDATE whatsapp_conversations 
       SET timeout_warning_sent = 1, updated_at = NOW() 
       WHERE phone_number = ? 
       AND status = 'active'`,
      [phoneNumber],
    )

    console.log("[v0] ⚠️ Aviso de inatividade enviado para:", phoneNumber)
  } catch (error) {
    console.error("[v0] ❌ Erro ao enviar aviso:", error)
  }
}

async function expireSession(phoneNumber: string) {
  try {
    const WHATSAPP_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN
    const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID

    if (!WHATSAPP_TOKEN || !PHONE_NUMBER_ID) {
      console.error("[v0] ❌ Credenciais do WhatsApp não configuradas")
      return
    }

    await fetch(`https://graph.facebook.com/v21.0/${PHONE_NUMBER_ID}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${WHATSAPP_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: phoneNumber,
        text: {
          body:
            "⏰ *Sessão encerrada por inatividade*\n\n" +
            "Finalizei nosso atendimento devido à inatividade.\n\n" +
            "Quando precisar, é só enviar uma mensagem que iniciaremos um novo atendimento! 😊",
        },
      }),
    })

    // Expirar a sessão
    await query(
      `UPDATE whatsapp_conversations 
       SET status = 'expired', updated_at = NOW() 
       WHERE phone_number = ? 
       AND status = 'active'`,
      [phoneNumber],
    )

    console.log("[v0] ❌ Sessão expirada para:", phoneNumber)
  } catch (error) {
    console.error("[v0] ❌ Erro ao expirar sessão:", error)
  }
}
