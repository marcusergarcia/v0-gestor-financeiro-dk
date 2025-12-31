import { NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization")
    const expectedAuth = `Bearer ${process.env.CRON_SECRET}`

    if (authHeader !== expectedAuth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("[v0] 📅 Iniciando verificação de boletos a vencer")

    // Buscar boletos que vencem em 3 dias
    const boletosVencer3Dias = await query(
      `SELECT 
        b.id, b.numero, b.valor, b.data_vencimento,
        c.id as cliente_id, c.nome as cliente_nome, c.telefone
      FROM boletos b
      INNER JOIN clientes c ON b.cliente_id = c.id
      WHERE b.status = 'pendente'
      AND b.data_vencimento = DATE_ADD(CURDATE(), INTERVAL 3 DAY)
      AND c.telefone IS NOT NULL
      AND c.telefone != ''
      AND b.notificacao_3dias_enviada = 0`,
      [],
    )

    // Buscar boletos que vencem hoje
    const boletosVencerHoje = await query(
      `SELECT 
        b.id, b.numero, b.valor, b.data_vencimento,
        c.id as cliente_id, c.nome as cliente_nome, c.telefone
      FROM boletos b
      INNER JOIN clientes c ON b.cliente_id = c.id
      WHERE b.status = 'pendente'
      AND b.data_vencimento = CURDATE()
      AND c.telefone IS NOT NULL
      AND c.telefone != ''
      AND b.notificacao_hoje_enviada = 0`,
      [],
    )

    // Buscar boletos vencidos (1 dia após vencimento)
    const boletosVencidos = await query(
      `SELECT 
        b.id, b.numero, b.valor, b.data_vencimento,
        c.id as cliente_id, c.nome as cliente_nome, c.telefone
      FROM boletos b
      INNER JOIN clientes c ON b.cliente_id = c.id
      WHERE b.status = 'pendente'
      AND b.data_vencimento = DATE_SUB(CURDATE(), INTERVAL 1 DAY)
      AND c.telefone IS NOT NULL
      AND c.telefone != ''
      AND b.notificacao_vencido_enviada = 0`,
      [],
    )

    let notificacoesEnviadas = 0

    // Enviar notificações para boletos que vencem em 3 dias
    for (const boleto of boletosVencer3Dias as any[]) {
      try {
        const mensagem =
          `🔔 *Lembrete de Vencimento*\n\n` +
          `Olá, ${boleto.cliente_nome}!\n\n` +
          `Seu boleto *${boleto.numero}* vence em *3 dias*.\n\n` +
          `💰 Valor: R$ ${(boleto.valor / 100).toFixed(2).replace(".", ",")}\n` +
          `📅 Vencimento: ${new Date(boleto.data_vencimento).toLocaleDateString("pt-BR")}\n\n` +
          `Por favor, realize o pagamento até a data de vencimento para evitar multas e juros.\n\n` +
          `_Mensagem automática - Não responder_`

        await enviarWhatsApp(boleto.telefone, mensagem)

        await query(`UPDATE boletos SET notificacao_3dias_enviada = 1 WHERE id = ?`, [boleto.id])

        notificacoesEnviadas++
        console.log(`[v0] ✅ Notificação 3 dias enviada para boleto ${boleto.numero}`)
      } catch (error) {
        console.error(`[v0] ❌ Erro ao enviar notificação para boleto ${boleto.numero}:`, error)
      }
    }

    // Enviar notificações para boletos que vencem hoje
    for (const boleto of boletosVencerHoje as any[]) {
      try {
        const mensagem =
          `⚠️ *Vencimento Hoje*\n\n` +
          `Olá, ${boleto.cliente_nome}!\n\n` +
          `Seu boleto *${boleto.numero}* vence *HOJE*.\n\n` +
          `💰 Valor: R$ ${(boleto.valor / 100).toFixed(2).replace(".", ",")}\n` +
          `📅 Vencimento: ${new Date(boleto.data_vencimento).toLocaleDateString("pt-BR")}\n\n` +
          `Por favor, realize o pagamento hoje para evitar multas e juros.\n\n` +
          `_Mensagem automática - Não responder_`

        await enviarWhatsApp(boleto.telefone, mensagem)

        await query(`UPDATE boletos SET notificacao_hoje_enviada = 1 WHERE id = ?`, [boleto.id])

        notificacoesEnviadas++
        console.log(`[v0] ✅ Notificação hoje enviada para boleto ${boleto.numero}`)
      } catch (error) {
        console.error(`[v0] ❌ Erro ao enviar notificação para boleto ${boleto.numero}:`, error)
      }
    }

    // Enviar notificações para boletos vencidos
    for (const boleto of boletosVencidos as any[]) {
      try {
        const mensagem =
          `🔴 *Boleto Vencido*\n\n` +
          `Olá, ${boleto.cliente_nome}!\n\n` +
          `Seu boleto *${boleto.numero}* está *VENCIDO*.\n\n` +
          `💰 Valor: R$ ${(boleto.valor / 100).toFixed(2).replace(".", ",")}\n` +
          `📅 Vencido em: ${new Date(boleto.data_vencimento).toLocaleDateString("pt-BR")}\n\n` +
          `⚠️ *Atenção:* Incidirão multa e juros sobre o valor.\n\n` +
          `Por favor, entre em contato conosco para regularizar o pagamento.\n\n` +
          `_Mensagem automática - Não responder_`

        await enviarWhatsApp(boleto.telefone, mensagem)

        await query(`UPDATE boletos SET notificacao_vencido_enviada = 1 WHERE id = ?`, [boleto.id])

        notificacoesEnviadas++
        console.log(`[v0] ✅ Notificação vencido enviada para boleto ${boleto.numero}`)
      } catch (error) {
        console.error(`[v0] ❌ Erro ao enviar notificação para boleto ${boleto.numero}:`, error)
      }
    }

    console.log(`[v0] ✅ Verificação concluída. ${notificacoesEnviadas} notificações enviadas`)

    return NextResponse.json({
      success: true,
      boletosVencer3Dias: (boletosVencer3Dias as any[]).length,
      boletosVencerHoje: (boletosVencerHoje as any[]).length,
      boletosVencidos: (boletosVencidos as any[]).length,
      notificacoesEnviadas,
    })
  } catch (error) {
    console.error("[v0] ❌ Erro na verificação de vencimentos:", error)
    return NextResponse.json({ error: "Erro ao verificar vencimentos" }, { status: 500 })
  }
}

async function enviarWhatsApp(telefone: string, mensagem: string) {
  const phoneNumber = telefone.replace(/\D/g, "")
  const whatsappNumber = phoneNumber.startsWith("55") ? phoneNumber : `55${phoneNumber}`

  const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/whatsapp/send`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      to: whatsappNumber,
      message: mensagem,
    }),
  })

  if (!response.ok) {
    throw new Error(`Erro ao enviar WhatsApp: ${response.statusText}`)
  }
}
