import { NextResponse } from "next/server"
import { query } from "@/lib/db"

// Endpoint para testar se o sistema de timeout está configurado
export async function GET() {
  try {
    const results = {
      database: false,
      cronSecret: false,
      conversationsActive: 0,
      details: {} as any,
    }

    // Verificar se a tabela tem os campos necessários
    try {
      const testQuery = await query(
        `SELECT last_activity, timeout_warning_sent 
         FROM whatsapp_conversations 
         LIMIT 1`,
        [],
      )
      results.database = true
      results.details.databaseFields = "✅ Campos last_activity e timeout_warning_sent existem"
    } catch (error: any) {
      results.details.databaseError = error.message
    }

    // Verificar se CRON_SECRET está configurado
    if (process.env.CRON_SECRET) {
      results.cronSecret = true
      results.details.cronSecret = "✅ CRON_SECRET configurado"
    } else {
      results.details.cronSecret = "❌ CRON_SECRET não configurado"
    }

    // Contar conversas ativas
    try {
      const activeConversations = await query(
        `SELECT COUNT(*) as total 
         FROM whatsapp_conversations 
         WHERE status = 'active'`,
        [],
      )
      results.conversationsActive = (activeConversations as any)[0].total
      results.details.activeConversations = `${results.conversationsActive} conversas ativas`
    } catch (error: any) {
      results.details.conversationsError = error.message
    }

    // Verificar conversas inativas
    try {
      const inactiveConversations = await query(
        `SELECT 
          phone_number, 
          TIMESTAMPDIFF(MINUTE, last_activity, NOW()) as minutes_inactive,
          timeout_warning_sent,
          current_step
         FROM whatsapp_conversations 
         WHERE status = 'active' 
         AND TIMESTAMPDIFF(MINUTE, last_activity, NOW()) >= 5`,
        [],
      )
      results.details.inactiveConversations = inactiveConversations
    } catch (error: any) {
      results.details.inactiveError = error.message
    }

    return NextResponse.json({
      success: true,
      timeout_system_ready: results.database && results.cronSecret,
      results,
    })
  } catch (error: any) {
    console.error("[v0] ❌ Erro ao testar timeout:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 },
    )
  }
}
