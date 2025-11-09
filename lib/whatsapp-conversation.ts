import { query } from "./db"

export enum ConversationStage {
  TIPO_CLIENTE = "tipo_cliente",
  CODIGO_CLIENTE = "codigo_cliente",
  NOME_CLIENTE = "nome_cliente",
  SELECIONAR_CLIENTE = "selecionar_cliente",
  CLIENTE_NAO_ENCONTRADO = "cliente_nao_encontrado",
  CADASTRO_CNPJ = "cadastro_cnpj",
  CADASTRO_CEP = "cadastro_cep",
  CADASTRO_NUMERO = "cadastro_numero",
  CADASTRO_CONFIRMAR_ENDERECO = "cadastro_confirmar_endereco",
  CADASTRO_TELEFONE = "cadastro_telefone",
  CADASTRO_EMAIL = "cadastro_email",
  CADASTRO_SINDICO = "cadastro_sindico",
  CADASTRO_SOLICITANTE = "cadastro_solicitante",
  CADASTRO_ENDERECO = "cadastro_endereco",
  CADASTRO_CIDADE = "cadastro_cidade",
  CADASTRO_CONFIRMAR = "cadastro_confirmar",
  CADASTRO_CONFIRMAR_CLIENTE_EXISTENTE = "cadastro_confirmar_cliente_existente",
  MENU = "menu",
  CRIAR_OS_TIPO_SERVICO = "criar_os_tipo_servico",
  CRIAR_OS_TIPO_ATENDIMENTO = "criar_os_tipo_atendimento",
  CRIAR_OS_DATA_AGENDAMENTO = "criar_os_data_agendamento",
  CRIAR_OS_PERIODO_AGENDAMENTO = "criar_os_periodo_agendamento",
  CRIAR_OS_SOLICITANTE = "criar_os_solicitante",
  CREATE_ORDER_DESC = "create_order_desc",
  CONSULTAR_OS_CODIGO = "consultar_os_codigo",
  CONSULTAR_OS_SELECIONAR = "consultar_os_selecionar",
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
    ordemId?: number
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

export async function findClientByCNPJ(cnpj: string): Promise<any | null> {
  try {
    console.log("[v0] 🔍 Buscando cliente por CNPJ:", cnpj)

    const cnpjLimpo = cnpj.replace(/\D/g, "")

    const result = await query(
      `SELECT id, codigo, nome, cnpj, telefone, email, endereco, cidade, estado 
       FROM clientes 
       WHERE REPLACE(REPLACE(REPLACE(cnpj, '.', ''), '/', ''), '-', '') = ?
       LIMIT 1`,
      [cnpjLimpo],
    )

    if (!result || (result as any[]).length === 0) {
      console.log("[v0] ⚠️ Cliente não encontrado por CNPJ")
      return null
    }

    const cliente = (result as any[])[0]
    console.log("[v0] ✅ Cliente encontrado por CNPJ:", cliente.nome)
    return cliente
  } catch (error) {
    console.error("[v0] ❌ Erro ao buscar cliente por CNPJ:", error)
    return null
  }
}

export async function generateOrderNumber(): Promise<string> {
  try {
    console.log("[v0] 🔢 Gerando número de ordem no formato AAAAMMDDXXX")

    const agora = new Date()
    const brasiliaDateString = agora.toLocaleString("en-US", {
      timeZone: "America/Sao_Paulo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })

    // Parse da data no formato MM/DD/YYYY
    const [mes, dia, ano] = brasiliaDateString.split("/")

    const prefixoMes = `${ano}${mes}`
    const prefixoDia = `${ano}${mes}${dia}`

    console.log("[v0] 📅 Prefixo do dia:", prefixoDia)

    // Buscar última ordem do mês atual
    const result = await query(
      `SELECT numero 
       FROM ordens_servico 
       WHERE numero LIKE ? 
       ORDER BY numero DESC 
       LIMIT 1`,
      [`${prefixoMes}%`],
    )

    let sequencial = 1

    if (result && (result as any[]).length > 0) {
      const ultimoNumero = (result as any[])[0].numero
      console.log("[v0] 📋 Último número do mês:", ultimoNumero)

      // Extrair os últimos 3 dígitos (sequencial)
      const ultimoSequencial = Number.parseInt(ultimoNumero.slice(-3))
      sequencial = ultimoSequencial + 1

      console.log("[v0] 🔢 Último sequencial:", ultimoSequencial)
      console.log("[v0] 🔢 Novo sequencial:", sequencial)
    } else {
      console.log("[v0] ℹ️ Primeira ordem do mês")
    }

    // Formatar sequencial com 3 dígitos (001, 002, etc.)
    const sequencialFormatado = String(sequencial).padStart(3, "0")
    const numeroOrdem = `${prefixoDia}${sequencialFormatado}`

    console.log("[v0] ✅ Número gerado:", numeroOrdem)
    return numeroOrdem
  } catch (error) {
    console.error("[v0] ❌ Erro ao gerar número de ordem:", error)
    // Fallback: usar timestamp
    const fallback = Date.now().toString()
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
  distanciaKm?: number
  latitude?: number
  longitude?: number
}): Promise<number> {
  try {
    console.log("[v0] 📝 Cadastrando novo cliente:", data.nome)

    const cnpjLimpo = data.cnpj.replace(/\D/g, "")
    const codigo = cnpjLimpo.substring(0, 6)

    console.log("[v0] 🔢 Código gerado:", codigo)

    const result = await query(
      `INSERT INTO clientes (
        codigo, nome, cnpj, cep, endereco, bairro, cidade, estado, 
        telefone, email, sindico, distancia_km, latitude, longitude, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        codigo,
        data.nome.toUpperCase(),
        data.cnpj.toUpperCase(),
        data.cep || null,
        data.endereco?.toUpperCase() || null,
        data.bairro?.toUpperCase() || null,
        data.cidade?.toUpperCase() || null,
        data.estado?.toUpperCase() || null,
        data.telefone,
        data.email?.toLowerCase() || null,
        data.sindico?.toUpperCase() || null,
        data.distanciaKm || null,
        data.latitude || null,
        data.longitude || null,
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

export async function checkAgendamentoDisponivel(
  data: string,
  periodo: string,
): Promise<{ disponivel: boolean; count: number }> {
  try {
    console.log("[v0] 🔍 Verificando disponibilidade de agendamento para:", data, periodo)

    let whereClause = ""
    const params: any[] = []

    if (periodo === "integral") {
      // Se quiser agendar integral, não pode ter nenhum agendamento neste dia
      whereClause = `WHERE data_agendamento = ? AND situacao IN ('agendada', 'em_andamento')`
      params.push(data)
    } else if (periodo === "manha" || periodo === "tarde") {
      // Se quiser agendar manhã ou tarde, não pode ter integral nem o mesmo período
      whereClause = `WHERE data_agendamento = ? 
         AND (periodo_agendamento = ? OR periodo_agendamento = 'integral')
         AND situacao IN ('agendada', 'em_andamento')`
      params.push(data, periodo)
    }

    const result = await query(`SELECT COUNT(*) as count FROM ordens_servico ${whereClause}`, params)

    const count = (result as any[])[0]?.count || 0
    const disponivel = count === 0

    console.log("[v0] ✅ Agendamentos encontrados:", count)
    console.log("[v0] ✅ Disponível:", disponivel)

    return { disponivel, count }
  } catch (error) {
    console.error("[v0] ❌ Erro ao verificar disponibilidade:", error)
    return { disponivel: true, count: 0 }
  }
}

export function validateDate(dateStr: string): {
  valid: boolean
  date?: Date
  error?: string
} {
  try {
    // Aceitar formato DD/MM/AAAA
    const parts = dateStr.split("/")
    if (parts.length !== 3) {
      return { valid: false, error: "Formato inválido. Use DD/MM/AAAA" }
    }

    const day = Number.parseInt(parts[0])
    const month = Number.parseInt(parts[1]) - 1 // Mês começa em 0
    const year = Number.parseInt(parts[2])

    const date = new Date(year, month, day)

    // Verificar se a data é válida
    if (date.getDate() !== day || date.getMonth() !== month || date.getFullYear() !== year) {
      return { valid: false, error: "Data inválida" }
    }

    // Verificar se não é no passado
    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)
    if (date < hoje) {
      return { valid: false, error: "Data não pode ser no passado" }
    }

    // Verificar se é dia útil (seg-sex)
    const diaSemana = date.getDay()
    if (diaSemana === 0 || diaSemana === 6) {
      return { valid: false, error: "Data deve ser dia útil (segunda a sexta)" }
    }

    return { valid: true, date }
  } catch (error) {
    return { valid: false, error: "Erro ao validar data" }
  }
}

export async function calcularDistanciaCliente(cep: string): Promise<{
  success: boolean
  distanciaKm?: number
  latitude?: number
  longitude?: number
  error?: string
}> {
  try {
    console.log("[v0] 📏 Calculando distância para CEP:", cep)

    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/utils/calcular-distancia`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cepCliente: cep }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.log("[v0] ❌ Erro ao calcular distância:", errorData.message)
      return { success: false, error: errorData.message || "Erro ao calcular distância" }
    }

    const result = await response.json()

    if (!result.success) {
      return { success: false, error: result.message || "Erro ao calcular distância" }
    }

    console.log("[v0] ✅ Distância calculada:", result.data.distanciaKm, "km")

    return {
      success: true,
      distanciaKm: result.data.distanciaKm,
      latitude: result.data.coordenadasCliente.latitude,
      longitude: result.data.coordenadasCliente.longitude,
    }
  } catch (error) {
    console.error("[v0] ❌ Erro ao calcular distância:", error)
    return { success: false, error: "Erro ao calcular distância" }
  }
}

export async function findOrdensAbertas(clienteId: number): Promise<any[]> {
  try {
    console.log("[v0] 🔍 Buscando ordens abertas para cliente ID:", clienteId)

    const result = await query(
      `SELECT 
        id, numero, data_atual, tipo_servico, descricao_defeito, 
        situacao, data_agendamento, periodo_agendamento, created_at
       FROM ordens_servico 
       WHERE cliente_id = ? 
       AND situacao IN ('aberta', 'agendada', 'em_andamento')
       ORDER BY created_at DESC
       LIMIT 10`,
      [clienteId],
    )

    const ordens = (result as any[]) || []
    console.log("[v0] ✅ Ordens encontradas:", ordens.length)
    return ordens
  } catch (error) {
    console.error("[v0] ❌ Erro ao buscar ordens abertas:", error)
    return []
  }
}

export async function findOrdemById(ordemId: number): Promise<any | null> {
  try {
    console.log("[v0] 🔍 Buscando ordem por ID:", ordemId)

    const result = await query(
      `SELECT 
        os.id, os.numero, os.situacao, os.data_atual, os.tipo_servico, 
        os.descricao_defeito, os.servico_realizado, os.tecnico_name,
        os.data_agendamento, os.periodo_agendamento, os.solicitado_por,
        c.nome as cliente_nome, c.endereco as cliente_endereco
       FROM ordens_servico os
       LEFT JOIN clientes c ON os.cliente_id = c.id
       WHERE os.id = ?`,
      [ordemId],
    )

    if (!result || (result as any[]).length === 0) {
      console.log("[v0] ⚠️ Ordem não encontrada")
      return null
    }

    const ordem = (result as any[])[0]
    console.log("[v0] ✅ Ordem encontrada:", ordem.numero)
    return ordem
  } catch (error) {
    console.error("[v0] ❌ Erro ao buscar ordem por ID:", error)
    return null
  }
}

export async function findOrdensBySituacao(clienteId: number, situacao: string): Promise<any[]> {
  try {
    console.log("[v0] 🔍 Buscando ordens com situação:", situacao, "para cliente ID:", clienteId)

    const result = await query(
      `SELECT 
        id, numero, data_atual, tipo_servico, descricao_defeito, 
        situacao, data_agendamento, periodo_agendamento, created_at
       FROM ordens_servico 
       WHERE cliente_id = ? 
       AND situacao = ?
       ORDER BY created_at DESC
       LIMIT 10`,
      [clienteId, situacao],
    )

    const ordens = (result as any[]) || []
    console.log("[v0] ✅ Ordens encontradas:", ordens.length)
    return ordens
  } catch (error) {
    console.error("[v0] ❌ Erro ao buscar ordens por situação:", error)
    return []
  }
}
