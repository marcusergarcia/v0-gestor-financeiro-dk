import { query } from "./db"

export enum ConversationStage {
  TIPO_CLIENTE = "tipo_cliente",
  NOME_CLIENTE = "nome_cliente",
  SELECIONAR_CLIENTE = "selecionar_cliente",
  CLIENTE_NAO_ENCONTRADO = "cliente_nao_encontrado",
  CADASTRO_TELEFONE = "cadastro_telefone",
  CADASTRO_ENDERECO = "cadastro_endereco",
  CADASTRO_CIDADE = "cadastro_cidade",
  CADASTRO_CONFIRMAR = "cadastro_confirmar",
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
    clienteNome?: string
    tipo?: "existente" | "novo"
    nome?: string
    telefone?: string
    endereco?: string
    cidade?: string
    nomeBuscado?: string
    clientesEncontrados?: any[]
  }
}

export async function getConversationState(phoneNumber: string): Promise<ConversationState | null> {
  try {
    console.log("[v0] 🔍 Buscando estado da conversa para:", phoneNumber)

    const result = await query(
      "SELECT phone_number, current_step, data FROM whatsapp_conversations WHERE phone_number = ? AND status = 'active'",
      [phoneNumber],
    )

    if (!result || (result as any[]).length === 0) {
      console.log("[v0] ℹ️ Nenhum estado encontrado, retornando null")
      return null
    }

    const row = (result as any[])[0]
    console.log("[v0] ✅ Estado encontrado:", row.current_step)

    return {
      phone_number: row.phone_number,
      stage: row.current_step as ConversationStage,
      data: row.data ? JSON.parse(row.data) : {},
    }
  } catch (error) {
    console.error("[v0] ❌ Erro ao buscar estado da conversa:", error)
    return null
  }
}

export async function updateConversationState(
  phoneNumber: string,
  stage: ConversationStage,
  data: any = {},
): Promise<void> {
  try {
    console.log("[v0] 💾 Atualizando estado para:", phoneNumber, "->", stage)

    // Primeiro, tentar atualizar
    const updateResult = await query(
      `UPDATE whatsapp_conversations 
       SET current_step = ?, data = ?, status = 'active', updated_at = NOW()
       WHERE phone_number = ?`,
      [stage, JSON.stringify(data), phoneNumber],
    )

    // Se não atualizou nenhuma linha, inserir nova
    if ((updateResult as any).affectedRows === 0) {
      console.log("[v0] ➕ Criando novo registro de conversa")
      await query(
        `INSERT INTO whatsapp_conversations (phone_number, current_step, data, status, created_at, updated_at) 
         VALUES (?, ?, ?, 'active', NOW(), NOW())`,
        [phoneNumber, stage, JSON.stringify(data)],
      )
    }

    console.log("[v0] ✅ Estado atualizado com sucesso")
  } catch (error) {
    console.error("[v0] ❌ Erro ao atualizar estado da conversa:", error)
    throw error
  }
}

export async function clearConversationState(phoneNumber: string): Promise<void> {
  try {
    console.log("[v0] 🗑️ Limpando estado da conversa para:", phoneNumber)

    await query("UPDATE whatsapp_conversations SET status = 'completed', updated_at = NOW() WHERE phone_number = ?", [
      phoneNumber,
    ])

    console.log("[v0] ✅ Estado limpo com sucesso")
  } catch (error) {
    console.error("[v0] ❌ Erro ao limpar estado da conversa:", error)
  }
}

export async function findClientByPhone(phoneNumber: string): Promise<any | null> {
  try {
    console.log("[v0] 🔍 Buscando cliente por telefone:", phoneNumber)

    // Limpar número de telefone (remover caracteres especiais)
    const cleanPhone = phoneNumber.replace(/\D/g, "")
    console.log("[v0] 📱 Telefone limpo:", cleanPhone)

    // Buscar por diferentes formatos de telefone
    const result = await query(
      `SELECT id, codigo, nome, telefone, email, endereco, cidade, estado 
       FROM clientes 
       WHERE REPLACE(REPLACE(REPLACE(REPLACE(telefone, '-', ''), ' ', ''), '(', ''), ')', '') LIKE ?
       LIMIT 1`,
      [`%${cleanPhone.slice(-9)}%`], // Últimos 9 dígitos (número sem DDD)
    )

    if (!result || (result as any[]).length === 0) {
      console.log("[v0] ⚠️ Cliente não encontrado")
      return null
    }

    const cliente = (result as any[])[0]
    console.log("[v0] ✅ Cliente encontrado:", cliente.nome)
    return cliente
  } catch (error) {
    console.error("[v0] ❌ Erro ao buscar cliente por telefone:", error)
    return null
  }
}

export async function generateOrderNumber(): Promise<string> {
  try {
    console.log("[v0] 🔢 Gerando número de ordem")

    const result = await query("SELECT numero FROM ordens_servico ORDER BY id DESC LIMIT 1")

    if (!result || (result as any[]).length === 0) {
      console.log("[v0] ℹ️ Primeira ordem, retornando 1")
      return "1"
    }

    const lastNumber = (result as any[])[0].numero
    const nextNumber = Number.parseInt(lastNumber) + 1
    console.log("[v0] ✅ Próximo número:", nextNumber)
    return nextNumber.toString()
  } catch (error) {
    console.error("[v0] ❌ Erro ao gerar número de ordem:", error)
    // Fallback: usar timestamp
    const fallback = Date.now().toString().slice(-6)
    console.log("[v0] ⚠️ Usando fallback:", fallback)
    return fallback
  }
}

export async function findClientsByName(nome: string): Promise<any[]> {
  try {
    console.log("[v0] 🔍 Buscando clientes por nome:", nome)

    const result = await query(
      `SELECT id, codigo, nome, telefone, email, cidade, tem_contrato 
       FROM clientes 
       WHERE nome LIKE ? 
       AND (status IS NULL OR status != 'inativo')
       LIMIT 5`,
      [`%${nome}%`],
    )

    const clientes = (result as any[]) || []
    console.log("[v0] ✅ Clientes encontrados:", clientes.length)
    return clientes
  } catch (error) {
    console.error("[v0] ❌ Erro ao buscar clientes por nome:", error)
    return []
  }
}

export async function createClient(data: {
  nome: string
  telefone: string
  endereco?: string
  cidade?: string
}): Promise<number> {
  try {
    console.log("[v0] 📝 Cadastrando novo cliente:", data.nome)

    // Gerar código a partir do telefone (primeiros 6 dígitos)
    const telefoneLimpo = data.telefone.replace(/\D/g, "")
    const codigo = telefoneLimpo.substring(0, 6)

    const result = await query(
      `INSERT INTO clientes (codigo, nome, telefone, endereco, cidade, created_at) 
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [codigo, data.nome, data.telefone, data.endereco || null, data.cidade || null],
    )

    const clienteId = (result as any).insertId
    console.log("[v0] ✅ Cliente cadastrado com ID:", clienteId)
    return clienteId
  } catch (error) {
    console.error("[v0] ❌ Erro ao cadastrar cliente:", error)
    throw error
  }
}

// Vamos apenas registrar no log por enquanto
export async function saveAtendimentoRequest(phoneNumber: string, clienteId?: number): Promise<void> {
  try {
    console.log("[v0] 📞 Solicitação de atendimento registrada")
    console.log("[v0] 📱 Telefone:", phoneNumber)
    console.log("[v0] 👤 Cliente ID:", clienteId)

    // TODO: Criar tabela whatsapp_atendimento se necessário
    // Por enquanto, apenas logamos a solicitação
  } catch (error) {
    console.error("[v0] ❌ Erro ao salvar solicitação de atendimento:", error)
  }
}
