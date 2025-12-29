import { NextResponse } from "next/server"
import {
  checkInactiveConversations,
  markTimeoutWarningSent,
  closeConversationByInactivity,
} from "@/lib/whatsapp-conversation"

// Função auxiliar para enviar mensagem do WhatsApp
async function sendWhatsAppMessage(phoneNumber: string, message: string) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/whatsapp/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phoneNumber,
        message,
      }),
    })

    if (!response.ok) {
      console.error("[v0] ❌ Erro ao enviar mensagem:", await response.text())
      return false
    }

    return true
  } catch (error) {
    console.error("[v0] ❌ Erro ao enviar mensagem WhatsApp:", error)
    return false
  }
}

export async function GET() {
  try {
    console.log("[v0] 🔍 Verificando timeouts de conversas...")

    const inactiveConversations = await checkInactiveConversations()

    const results = {
      warnings_sent: 0,
      conversations_closed: 0,
      errors: 0,
    }

    for (const conv of inactiveConversations) {
      try {
        // Se já passou 10 minutos, finalizar conversa
        if (conv.minutes_inactive >= 10) {
          console.log("[v0] ⏱️ Finalizando conversa por timeout:", conv.phone_number)

          await sendWhatsAppMessage(
            conv.phone_number,
            "⏱️ *Atendimento Finalizado*\n\n" +
              "Seu atendimento foi encerrado devido à inatividade.\n\n" +
              "Para iniciar um novo atendimento, envie qualquer mensagem.\n\n" +
              "Obrigado! 👋",
          )

          await closeConversationByInactivity(conv.phone_number)
          results.conversations_closed++
        }
        // Se passou 5 minutos e ainda não enviou aviso, enviar
        else if (conv.minutes_inactive >= 5 && !conv.warning_sent) {
          console.log("[v0] ⚠️ Enviando aviso de inatividade:", conv.phone_number)

          await sendWhatsAppMessage(
            conv.phone_number,
            "⚠️ *Aviso de Inatividade*\n\n" +
              "Notamos que você está há alguns minutos sem responder.\n\n" +
              "Seu atendimento será *finalizado automaticamente em 5 minutos* caso não recebamos uma resposta.\n\n" +
              "Para continuar, basta enviar qualquer mensagem. 😊",
          )

          await markTimeoutWarningSent(conv.phone_number)
          results.warnings_sent++
        }
      } catch (error) {
        console.error("[v0] ❌ Erro ao processar conversa:", conv.phone_number, error)
        results.errors++
      }
    }

    console.log("[v0] ✅ Verificação de timeouts concluída:", results)

    return NextResponse.json({
      success: true,
      results,
      message: `Avisos enviados: ${results.warnings_sent}, Conversas finalizadas: ${results.conversations_closed}`,
    })
  } catch (error) {
    console.error("[v0] ❌ Erro ao verificar timeouts:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Erro ao verificar timeouts",
      },
      { status: 500 },
    )
  }
}
