import { query } from "./db"

export enum ConversationStage {
  TIPO_CLIENTE = "tipo_cliente",
  CODIGO_CLIENTE = "codigo_cliente", // Novo stage para pedir código CNPJ
  NOME_CLIENTE = "nome_cliente",
  SELECIONAR_CLIENTE = "selecionar_cliente",
  CLIENTE_NAO_ENCONTRADO = "cliente_nao_encontrado",
  CADASTRO_CNPJ = "cadastro_cnpj", // Novo stage para pedir CNPJ completo
  CADASTRO_CEP = "cadastro_cep",
  CADASTRO_CONFIRMAR_ENDERECO = "cadastro_confirmar_endereco",
  CADASTRO_TELEFONE = "cadastro_telefone",
  CADASTRO_EMAIL = "cadastro_email",
  CADASTRO_SINDICO = "cadastro_sindico",
  CADASTRO_SOLICITANTE = "cadastro_solicitante",
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
    cnpj?: string
    codigo?: string
    cep?: string
    endereco?: string
    bairro?: string
    cidade?: string
    estado?: string
    telefone?: string
    email?: string
    sindico?: string
    solicitante?: string
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

export async function restartConversation(phoneNumber: string): Promise<void> {
  try {
    console.log("[v0] 🔄 Reiniciando conversa para:", phoneNumber)

    // Limpar estado atual
    await clearConversationState(phoneNumber)

    // Criar novo estado inicial
    await updateConversationState(phoneNumber, ConversationStage.TIPO_CLIENTE, {})

    console.log("[v0] ✅ Conversa reiniciada com sucesso")
  } catch (error) {
    console.error("[v0] ❌ Erro ao reiniciar conversa:", error)
    throw error
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

export async function findClientByCodigo(codigo: string): Promise<any | null> {
  try {
    console.log("[v0] 🔍 Buscando cliente por código:", codigo)

    const cleanCodigo = codigo.replace(/\D/g, "").substring(0, 6)
    // Remover zeros à esquerda, mas manter pelo menos um dígito
    const normalizedCodigo = cleanCodigo.replace(/^0+/, "") || "0"
    console.log("[v0] 🔢 Código limpo:", cleanCodigo)
    console.log("[v0] 🔢 Código normalizado (sem zeros à esquerda):", normalizedCodigo)

    // Buscar tanto pelo código com zeros quanto sem zeros
    const result = await query(
      `SELECT id, codigo, nome, cnpj, telefone, email, cidade, estado 
       FROM clientes 
       WHERE codigo = ? OR codigo = ?
       LIMIT 1`,
      [cleanCodigo, normalizedCodigo],
    )

    if (!result || (result as any[]).length === 0) {
      console.log("[v0] ⚠️ Cliente não encontrado")
      return null
    }

    const cliente = (result as any[])[0]
    console.log("[v0] ✅ Cliente encontrado:", cliente.nome)
    return cliente
  } catch (error) {
    console.error("[v0] ❌ Erro ao buscar cliente por código:", error)
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
  cnpj: string
  cep?: string
  endereco?: string
  bairro?: string
  cidade?: string
  estado?: string
  telefone: string
  email?: string
  sindico?: string
}): Promise<number> {
  try {
    console.log("[v0] 📝 Cadastrando novo cliente:", data.nome)

    // Extrair código (6 primeiros dígitos do CNPJ)
    const cnpjLimpo = data.cnpj.replace(/\D/g, "")
    const codigo = cnpjLimpo.substring(0, 6)

    console.log("[v0] 🔢 Código gerado:", codigo)

    const result = await query(
      `INSERT INTO clientes (
        codigo, nome, cnpj, cep, endereco, bairro, cidade, estado, 
        telefone, email, sindico, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        codigo,
        data.nome,
        data.cnpj,
        data.cep || null,
        data.endereco || null,
        data.bairro || null,
        data.cidade || null,
        data.estado || null,
        data.telefone,
        data.email || null,
        data.sindico || null,
      ],
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

export async function fetchCepData(cep: string): Promise<{
  success: boolean
  data?: {
    logradouro: string
    bairro: string
    localidade: string
    uf: string
  }
  error?: string
}> {
  try {
    const cepLimpo = cep.replace(/\D/g, "")

    if (cepLimpo.length !== 8) {
      return { success: false, error: "CEP deve ter 8 dígitos" }
    }

    console.log("[v0] 🔍 Buscando dados do CEP:", cepLimpo)

    const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`)

    if (!response.ok) {
      return { success: false, error: "Erro ao consultar CEP" }
    }

    const data = await response.json()

    if (data.erro) {
      return { success: false, error: "CEP não encontrado" }
    }

    console.log("[v0] ✅ Dados do CEP encontrados:", data.localidade)

    return {
      success: true,
      data: {
        logradouro: data.logradouro || "",
        bairro: data.bairro || "",
        localidade: data.localidade || "",
        uf: data.uf || "",
      },
    }
  } catch (error) {
    console.error("[v0] ❌ Erro ao buscar CEP:", error)
    return { success: false, error: "Erro ao consultar CEP" }
  }
}
