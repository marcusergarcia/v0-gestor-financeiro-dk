import { query } from "./db"

export enum ConversationStage {
  MENU = "menu",
  CREATE_ORDER_DESC = "create_order_desc",
  QUERY_ORDER = "query_order",
  WAIT_AGENT = "wait_agent",
}

export interface ConversationState {
  phone_number: string
  stage: ConversationStage
  data: {
    description?: string
    orderId?: string
    clienteId?: number
  }
}

export async function getConversationState(phoneNumber: string): Promise<ConversationState | null> {
  try {
    const result = await query(
      "SELECT phone_number, stage, conversation_data FROM whatsapp_conversations WHERE phone_number = ?",
      [phoneNumber],
    )

    if (!result || (result as any[]).length === 0) {
      return null
    }

    const row = (result as any[])[0]
    return {
      phone_number: row.phone_number,
      stage: row.stage as ConversationStage,
      data: row.conversation_data ? JSON.parse(row.conversation_data) : {},
    }
  } catch (error) {
    console.error("[v0] Erro ao buscar estado da conversa:", error)
    return null
  }
}

export async function updateConversationState(
  phoneNumber: string,
  stage: ConversationStage,
  data: any = {},
): Promise<void> {
  try {
    await query(
      `INSERT INTO whatsapp_conversations (phone_number, stage, conversation_data, updated_at) 
       VALUES (?, ?, ?, NOW())
       ON DUPLICATE KEY UPDATE stage = ?, conversation_data = ?, updated_at = NOW()`,
      [phoneNumber, stage, JSON.stringify(data), stage, JSON.stringify(data)],
    )
  } catch (error) {
    console.error("[v0] Erro ao atualizar estado da conversa:", error)
    throw error
  }
}

export async function clearConversationState(phoneNumber: string): Promise<void> {
  try {
    await query("DELETE FROM whatsapp_conversations WHERE phone_number = ?", [phoneNumber])
  } catch (error) {
    console.error("[v0] Erro ao limpar estado da conversa:", error)
  }
}

export async function findClientByPhone(phoneNumber: string): Promise<any | null> {
  try {
    // Limpar número de telefone (remover caracteres especiais)
    const cleanPhone = phoneNumber.replace(/\D/g, "")

    // Buscar por diferentes formatos de telefone
    const result = await query(
      `SELECT id, codigo, nome, telefone, email, endereco, cidade, estado 
       FROM clientes 
       WHERE REPLACE(REPLACE(REPLACE(REPLACE(telefone, '-', ''), ' ', ''), '(', ''), ')', '') LIKE ?
       LIMIT 1`,
      [`%${cleanPhone.slice(-9)}%`], // Últimos 9 dígitos (número sem DDD)
    )

    if (!result || (result as any[]).length === 0) {
      return null
    }

    return (result as any[])[0]
  } catch (error) {
    console.error("[v0] Erro ao buscar cliente por telefone:", error)
    return null
  }
}

export async function generateOrderNumber(): Promise<string> {
  try {
    const result = await query("SELECT numero FROM ordens_servico ORDER BY id DESC LIMIT 1")

    if (!result || (result as any[]).length === 0) {
      return "1"
    }

    const lastNumber = (result as any[])[0].numero
    const nextNumber = Number.parseInt(lastNumber) + 1
    return nextNumber.toString()
  } catch (error) {
    console.error("[v0] Erro ao gerar número de ordem:", error)
    // Fallback: usar timestamp
    return Date.now().toString().slice(-6)
  }
}

export async function saveAtendimentoRequest(phoneNumber: string, clienteId?: number): Promise<void> {
  try {
    await query(
      `INSERT INTO whatsapp_atendimento (phone_number, cliente_id, status, created_at) 
       VALUES (?, ?, 'aguardando', NOW())`,
      [phoneNumber, clienteId || null],
    )
  } catch (error) {
    console.error("[v0] Erro ao salvar solicitação de atendimento:", error)
  }
}
