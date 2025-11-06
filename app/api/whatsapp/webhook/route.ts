import { type NextRequest, NextResponse } from "next/server"
import {
  getConversationState,
  updateConversationState,
  clearConversationState,
  findClientByCodigo,
  createClient,
  generateOrderNumber,
  saveAtendimentoRequest,
  ConversationStage,
} from "@/lib/whatsapp-conversation"
import { query } from "@/lib/db"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const mode = searchParams.get("hub.mode")
  const token = searchParams.get("hub.verify_token")
  const challenge = searchParams.get("hub.challenge")

  const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || "seu_token_secreto"

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("[v0] ✅ Webhook verificado com sucesso")
    return new NextResponse(challenge, { status: 200 })
  }

  console.log("[v0] ❌ Verificação do webhook falhou")
  return NextResponse.json({ error: "Verificação falhou" }, { status: 403 })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log("[v0] ===== WEBHOOK RECEBIDO =====")

    const entry = body.entry?.[0]
    const changes = entry?.changes?.[0]
    const value = changes?.value
    const messages = value?.messages?.[0]

    if (!messages) {
      return NextResponse.json({ status: "ok" })
    }

    const from = messages.from
    const messageBody = messages.text?.body?.trim() || ""

    console.log("[v0] 📱 Mensagem de:", from)
    console.log("[v0] 💬 Texto:", messageBody)

    // Processar mensagem baseado no estado da conversa
    await processUserMessage(from, messageBody)

    return NextResponse.json({ status: "ok" })
  } catch (error) {
    console.error("[v0] ❌ Erro no webhook:", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}

async function processUserMessage(from: string, messageBody: string) {
  try {
    // Buscar estado atual da conversa
    const state = await getConversationState(from)

    if (!state) {
      console.log("[v0] 👋 Primeira interação detectada")
      await sendTipoClienteMenu(from)
      return
    }

    const currentStage = state.stage

    console.log("[v0] 📊 Estado atual:", currentStage)
    console.log("[v0] 📦 Dados salvos:", state?.data)

    const normalizedMessage = messageBody.toLowerCase().trim()
    if (
      (normalizedMessage === "voltar" ||
        normalizedMessage === "menu" ||
        normalizedMessage === "0" ||
        normalizedMessage === "voltar ao menu") &&
      currentStage !== ConversationStage.TIPO_CLIENTE &&
      currentStage !== ConversationStage.CODIGO_CLIENTE &&
      currentStage !== ConversationStage.NOME_CLIENTE &&
      currentStage !== ConversationStage.CADASTRO_CNPJ &&
      currentStage !== ConversationStage.CADASTRO_TELEFONE &&
      currentStage !== ConversationStage.CADASTRO_ENDERECO &&
      currentStage !== ConversationStage.CADASTRO_CIDADE &&
      currentStage !== ConversationStage.CADASTRO_CONFIRMAR
    ) {
      // User wants to return to menu - only if they have a client ID
      if (state.data?.clienteId) {
        await returnToMenu(from, state.data)
        return
      }
    }

    switch (currentStage) {
      case ConversationStage.TIPO_CLIENTE:
        await handleTipoCliente(from, messageBody, state?.data || {})
        break

      case ConversationStage.CODIGO_CLIENTE:
        await handleCodigoCliente(from, messageBody, state?.data || {})
        break

      case ConversationStage.NOME_CLIENTE:
        await handleNomeCliente(from, messageBody, state?.data || {})
        break

      case ConversationStage.CADASTRO_CNPJ:
        await handleCadastroCNPJ(from, messageBody, state?.data || {})
        break

      case ConversationStage.SELECIONAR_CLIENTE:
        await handleSelecionarCliente(from, messageBody, state?.data || {})
        break

      case ConversationStage.CLIENTE_NAO_ENCONTRADO:
        await handleClienteNaoEncontrado(from, messageBody, state?.data || {})
        break

      case ConversationStage.CADASTRO_TELEFONE:
        await handleCadastroTelefone(from, messageBody, state?.data || {})
        break

      case ConversationStage.CADASTRO_ENDERECO:
        await handleCadastroEndereco(from, messageBody, state?.data || {})
        break

      case ConversationStage.CADASTRO_CIDADE:
        await handleCadastroCidade(from, messageBody, state?.data || {})
        break

      case ConversationStage.CADASTRO_CONFIRMAR:
        await handleCadastroConfirmar(from, messageBody, state?.data || {})
        break

      case ConversationStage.MENU:
        await handleMenuOption(from, messageBody, state?.data || {})
        break

      case ConversationStage.CREATE_ORDER_DESC:
        await handleOrderDescription(from, messageBody, state?.data || {})
        break

      case ConversationStage.QUERY_ORDER:
        await handleQueryOrder(from, messageBody, state?.data || {})
        break

      case ConversationStage.WAIT_AGENT:
        await returnToMenu(from, state.data || {})
        break

      default:
        await sendTipoClienteMenu(from)
    }
  } catch (error) {
    console.error("[v0] ❌ Erro ao processar mensagem:", error)
    await sendMessage(from, "❌ Desculpe, ocorreu um erro. Por favor, tente novamente.")
    await clearConversationState(from)
  }
}

async function handleTipoCliente(from: string, message: string, data: any) {
  const opcao = message.trim()

  if (opcao === "1") {
    // Cliente existente - pedir código CNPJ
    await updateConversationState(from, ConversationStage.CODIGO_CLIENTE, { ...data, tipo: "existente" })
    await sendMessage(
      from,
      "✅ *Cliente Existente*\n\n" +
        "Para te identificar, digite os *6 primeiros dígitos do CNPJ* do seu condomínio.\n\n" +
        "📋 Formato: *12.345.6*XX/XXXX-XX\n\n" +
        "Exemplo: _123456_",
    )
  } else if (opcao === "2") {
    // Primeiro contato - iniciar cadastro
    await updateConversationState(from, ConversationStage.NOME_CLIENTE, { ...data, tipo: "novo" })
    await sendMessage(
      from,
      "👋 *Bem-vindo!*\n\n" +
        "Vou fazer seu cadastro rapidamente. 📝\n\n" +
        "Para começar, qual é o *nome do condomínio*?",
    )
  } else {
    await sendMessage(
      from,
      "❌ Opção inválida.\n\n" + "Digite:\n" + "*1* - Já sou cliente\n" + "*2* - Primeiro contato",
    )
  }
}

async function handleCodigoCliente(from: string, message: string, data: any) {
  const codigo = message.trim().replace(/\D/g, "").substring(0, 6)

  if (!codigo || codigo.length < 6) {
    await sendMessage(
      from,
      "❌ Código inválido.\n\n" + "Por favor, digite os *6 primeiros dígitos* do CNPJ.\n\n" + "Exemplo: _123456_",
    )
    return
  }

  console.log("[v0] 🔍 Buscando cliente por código:", codigo)
  const cliente = await findClientByCodigo(codigo)

  if (!cliente) {
    await updateConversationState(from, ConversationStage.CLIENTE_NAO_ENCONTRADO, {
      ...data,
      codigoBuscado: codigo,
    })
    await sendMessage(
      from,
      `❌ *CNPJ não encontrado*\n\n` +
        `Não encontrei nenhum cliente com o código *${codigo}*.\n\n` +
        `Deseja fazer um novo cadastro?\n\n` +
        `*1* - Sim, cadastrar\n` +
        `*2* - Não, tentar outro código`,
    )
  } else {
    // Cliente encontrado
    await updateConversationState(from, ConversationStage.MENU, {
      ...data,
      clienteId: cliente.id,
      clienteNome: cliente.nome,
    })
    await sendMessage(
      from,
      `✅ *Cliente identificado!*\n\n` +
        `*${cliente.nome}*\n` +
        `Código: ${cliente.codigo}\n` +
        `CNPJ: ${cliente.cnpj || "Não informado"}\n\n` +
        `Agora escolha uma opção:\n\n` +
        `*1* - Criar ordem de serviço\n` +
        `*2* - Consultar ordem de serviço\n` +
        `*3* - Falar com atendente`,
    )
  }
}

async function handleNomeCliente(from: string, message: string, data: any) {
  const nome = message.trim()

  if (!nome || nome.length < 3) {
    await sendMessage(from, "❌ Por favor, digite um nome válido com pelo menos 3 caracteres.")
    return
  }

  // Novo cliente - pedir CNPJ
  await updateConversationState(from, ConversationStage.CADASTRO_CNPJ, { ...data, nome })
  await sendMessage(
    from,
    `Perfeito, *${nome}*! 👍\n\n` +
      `Agora, qual é o *CNPJ* do condomínio?\n\n` +
      `📋 Formato: XX.XXX.XXX/XXXX-XX\n\n` +
      `Exemplo: _12.345.678/0001-90_`,
  )
}

async function handleCadastroCNPJ(from: string, message: string, data: any) {
  const cnpj = message.trim()
  const cnpjLimpo = cnpj.replace(/\D/g, "")

  if (!cnpjLimpo || cnpjLimpo.length < 14) {
    await sendMessage(
      from,
      "❌ CNPJ inválido.\n\n" + "Por favor, digite o CNPJ completo (14 dígitos).\n\n" + "Exemplo: _12.345.678/0001-90_",
    )
    return
  }

  // Formatar CNPJ
  const cnpjFormatado = cnpjLimpo.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5")

  await updateConversationState(from, ConversationStage.CADASTRO_TELEFONE, {
    ...data,
    cnpj: cnpjFormatado,
  })
  await sendMessage(
    from,
    `✅ CNPJ registrado!\n\n` + `Agora, qual é o *telefone* de contato?\n\n` + `Exemplo: _(11) 99999-9999_`,
  )
}

async function handleSelecionarCliente(from: string, message: string, data: any) {
  const opcao = Number.parseInt(message.trim())
  const clientes = data.clientesEncontrados || []

  if (opcao >= 1 && opcao <= clientes.length) {
    const cliente = clientes[opcao - 1]
    await updateConversationState(from, ConversationStage.MENU, {
      ...data,
      clienteId: cliente.id,
      clienteNome: cliente.nome,
    })
    await sendMessage(
      from,
      `✅ *Cliente identificado!*\n\n` +
        `*${cliente.nome}*\n` +
        `Código: ${cliente.codigo}\n\n` +
        `Agora escolha uma opção:\n\n` +
        `*1* - Criar ordem de serviço\n` +
        `*2* - Consultar ordem de serviço\n` +
        `*3* - Falar com atendente`,
    )
  } else {
    await sendMessage(from, `❌ Opção inválida. Digite um número entre 1 e ${clientes.length}.`)
  }
}

async function handleClienteNaoEncontrado(from: string, message: string, data: any) {
  const opcao = message.trim()

  if (opcao === "1") {
    // Iniciar cadastro
    await updateConversationState(from, ConversationStage.NOME_CLIENTE, {
      ...data,
      tipo: "novo",
    })
    await sendMessage(from, `📝 *Novo Cadastro*\n\n` + `Vou fazer seu cadastro!\n\n` + `Qual é o *nome do condomínio*?`)
  } else if (opcao === "2") {
    // Tentar outro código
    await updateConversationState(from, ConversationStage.CODIGO_CLIENTE, { ...data, tipo: "existente" })
    await sendMessage(from, `🔍 Ok! Digite os *6 primeiros dígitos do CNPJ* novamente:\n\n` + `Exemplo: _123456_`)
  } else {
    await sendMessage(
      from,
      `❌ Opção inválida.\n\n` + `Digite:\n` + `*1* - Sim, cadastrar\n` + `*2* - Não, tentar outro código`,
    )
  }
}

async function handleCadastroTelefone(from: string, message: string, data: any) {
  const telefone = message.trim()
  await updateConversationState(from, ConversationStage.CADASTRO_ENDERECO, { ...data, telefone })
  await sendMessage(
    from,
    `✅ Telefone registrado!\n\n` + `Agora, qual é o seu *endereço*?\n\n` + `Exemplo: _Rua Exemplo, 123_`,
  )
}

async function handleCadastroEndereco(from: string, message: string, data: any) {
  const endereco = message.trim()
  await updateConversationState(from, ConversationStage.CADASTRO_CIDADE, { ...data, endereco })
  await sendMessage(from, `✅ Endereço registrado!\n\n` + `Qual é a sua *cidade*?\n\n` + `Exemplo: _São Paulo_`)
}

async function handleCadastroCidade(from: string, message: string, data: any) {
  const cidade = message.trim()
  await updateConversationState(from, ConversationStage.CADASTRO_CONFIRMAR, { ...data, cidade })
  await sendMessage(
    from,
    `📋 *Confirme seus dados:*\n\n` +
      `*Nome:* ${data.nome}\n` +
      `*CNPJ:* ${data.cnpj}\n` +
      `*Telefone:* ${data.telefone}\n` +
      `*Endereço:* ${data.endereco}\n` +
      `*Cidade:* ${cidade}\n\n` +
      `Está tudo correto?\n\n` +
      `*1* - Sim, cadastrar\n` +
      `*2* - Não, corrigir`,
  )
}

async function handleCadastroConfirmar(from: string, message: string, data: any) {
  const opcao = message.trim()

  if (opcao === "1") {
    try {
      console.log("[v0] 📝 Cadastrando novo cliente:", data.nome)

      const clienteId = await createClient({
        nome: data.nome,
        cnpj: data.cnpj,
        telefone: data.telefone,
        endereco: data.endereco,
        cidade: data.cidade,
      })

      const codigo = data.cnpj.replace(/\D/g, "").substring(0, 6)

      await updateConversationState(from, ConversationStage.MENU, {
        ...data,
        clienteId,
        clienteNome: data.nome,
      })
      await sendMessage(
        from,
        `✅ *Cadastro realizado com sucesso!*\n\n` +
          `*${data.nome}*\n` +
          `Código: ${codigo}\n` +
          `CNPJ: ${data.cnpj}\n\n` +
          `Agora escolha uma opção:\n\n` +
          `*1* - Criar ordem de serviço\n` +
          `*2* - Consultar ordem de serviço\n` +
          `*3* - Falar com atendente`,
      )
    } catch (error) {
      console.error("[v0] ❌ Erro ao cadastrar cliente:", error)
      await sendMessage(from, "❌ Desculpe, ocorreu um erro ao cadastrar. Por favor, tente novamente mais tarde.")
      await clearConversationState(from)
    }
  } else if (opcao === "2") {
    // Reiniciar cadastro
    await updateConversationState(from, ConversationStage.NOME_CLIENTE, { tipo: "novo" })
    await sendMessage(from, `🔄 Ok! Vamos recomeçar.\n\nQual é o *nome do condomínio*?`)
  } else {
    await sendMessage(from, `❌ Opção inválida.\n\n` + `Digite:\n` + `*1* - Sim, cadastrar\n` + `*2* - Não, corrigir`)
  }
}

async function handleMenuOption(from: string, option: string, data: any) {
  if (!data.clienteId) {
    await sendMessage(from, "❌ Erro: Cliente não identificado. Vou reiniciar a conversa.")
    await sendTipoClienteMenu(from)
    return
  }

  switch (option) {
    case "1":
      // Criar nova ordem de serviço
      await updateConversationState(from, ConversationStage.CREATE_ORDER_DESC, data)
      await sendMessage(
        from,
        "📝 *Criar Nova Ordem de Serviço*\n\n" +
          "Por favor, descreva o problema ou serviço necessário:\n\n" +
          "Exemplo: _Verificar câmeras do hall do bloco A_",
      )
      break

    case "2":
      await updateConversationState(from, ConversationStage.QUERY_ORDER, data)
      await sendMessage(
        from,
        "🔍 *Consultar Ordem de Serviço*\n\n" + "Digite o número da ordem de serviço que deseja consultar:",
      )
      break

    case "3":
      // Falar com atendente
      await saveAtendimentoRequest(from, data.clienteId)
      await updateConversationState(from, ConversationStage.WAIT_AGENT, data)
      await sendMessage(
        from,
        "📞 *Solicitação de Atendimento*\n\n" +
          "Sua solicitação foi registrada! Um atendente entrará em contato em breve.\n\n" +
          "⏰ Horário de atendimento:\n" +
          "Segunda a Sexta: 08:00 - 18:00\n\n" +
          "_Digite qualquer mensagem para voltar ao menu principal_",
      )
      break

    default:
      // Opção inválida - mostrar menu novamente
      await sendMessage(
        from,
        `❌ Opção inválida.\n\n` +
          `Digite:\n` +
          `*1* - Criar ordem de serviço\n` +
          `*2* - Consultar ordem de serviço\n` +
          `*3* - Falar com atendente`,
      )
  }
}

async function handleOrderDescription(from: string, description: string, data: any) {
  try {
    if (!data.clienteId) {
      await sendMessage(from, "❌ Erro: Cliente não identificado. Vou reiniciar a conversa.")
      await sendTipoClienteMenu(from)
      return
    }

    // Buscar dados do cliente
    const clienteResult = await query("SELECT id, nome, endereco FROM clientes WHERE id = ?", [data.clienteId])

    if (!clienteResult || (clienteResult as any[]).length === 0) {
      await sendMessage(from, "❌ Erro: Cliente não encontrado.")
      await clearConversationState(from)
      return
    }

    const cliente = (clienteResult as any[])[0]

    // Gerar número da ordem
    const numeroOrdem = await generateOrderNumber()

    // Criar ordem de serviço
    const dataAtual = new Date().toISOString().split("T")[0]

    await query(
      `INSERT INTO ordens_servico 
       (numero, cliente_id, tecnico_name, tecnico_email, data_atual, tipo_servico, 
        descricao_defeito, responsavel, nome_responsavel, situacao, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        numeroOrdem,
        cliente.id,
        "A definir",
        null,
        dataAtual,
        "manutencao",
        description,
        "sindico",
        cliente.nome,
        "aberta",
      ],
    )

    console.log("[v0] ✅ Ordem criada:", numeroOrdem, "para cliente:", cliente.nome)

    // Enviar confirmação
    await sendMessage(
      from,
      "✅ *Ordem de Serviço Criada!*\n\n" +
        `📋 Número: *${numeroOrdem}*\n` +
        `👤 Cliente: ${cliente.nome}\n` +
        `📍 Endereço: ${cliente.endereco || "Não informado"}\n` +
        `📝 Descrição: ${description}\n\n` +
        "🔔 Você receberá atualizações sobre o andamento do serviço.\n\n" +
        "Deseja fazer mais alguma coisa?\n\n" +
        "*1* - Criar outra OS\n" +
        "*2* - Consultar OS\n" +
        "*3* - Falar com atendente",
    )

    // Manter estado no menu
    await updateConversationState(from, ConversationStage.MENU, data)
  } catch (error) {
    console.error("[v0] ❌ Erro ao criar ordem:", error)
    await sendMessage(from, "❌ Erro ao criar ordem de serviço. Por favor, tente novamente mais tarde.")
    await clearConversationState(from)
  }
}

async function handleQueryOrder(from: string, orderId: string, data: any) {
  try {
    // Buscar ordem pelo número
    const result = await query(
      `SELECT 
        os.numero, os.situacao, os.data_atual, os.tipo_servico, 
        os.descricao_defeito, os.servico_realizado, os.tecnico_name,
        c.nome as cliente_nome
       FROM ordens_servico os
       LEFT JOIN clientes c ON os.cliente_id = c.id
       WHERE os.numero = ?`,
      [orderId],
    )

    if (!result || (result as any[]).length === 0) {
      await sendMessage(
        from,
        "❌ *Ordem não encontrada*\n\n" +
          `Não encontramos a ordem de serviço número *${orderId}*.\n\n` +
          "Verifique o número e tente novamente ou digite *voltar* para retornar ao menu.",
      )
      return
    }

    const ordem = (result as any[])[0]

    // Mapear situação
    const statusMap: Record<string, string> = {
      rascunho: "📄 Rascunho",
      aberta: "🔴 Aberta",
      agendada: "📅 Agendada",
      em_andamento: "🟡 Em Andamento",
      concluida: "✅ Concluída",
      cancelada: "❌ Cancelada",
    }

    // Mapear tipo de serviço
    const tipoMap: Record<string, string> = {
      manutencao: "Manutenção",
      orcamento: "Orçamento",
      vistoria_contrato: "Vistoria",
      preventiva: "Preventiva",
    }

    const message =
      `📋 *Ordem de Serviço #${ordem.numero}*\n\n` +
      `Status: ${statusMap[ordem.situacao] || ordem.situacao}\n` +
      `Cliente: ${ordem.cliente_nome}\n` +
      `Técnico: ${ordem.tecnico_name}\n` +
      `Data: ${new Date(ordem.data_atual).toLocaleDateString("pt-BR")}\n` +
      `Tipo: ${tipoMap[ordem.tipo_servico] || ordem.tipo_servico}\n\n` +
      `📝 Descrição:\n${ordem.descricao_defeito || "Não informada"}\n\n` +
      (ordem.servico_realizado ? `✨ Serviço Realizado:\n${ordem.servico_realizado}\n\n` : "") +
      "Deseja fazer mais alguma coisa?\n\n" +
      "*1* - Criar OS\n" +
      "*2* - Consultar outra OS\n" +
      "*3* - Falar com atendente"

    await sendMessage(from, message)
    await updateConversationState(from, ConversationStage.MENU, data)
  } catch (error) {
    console.error("[v0] ❌ Erro ao consultar ordem:", error)
    await sendMessage(from, "❌ Erro ao consultar ordem. Por favor, tente novamente.")
    await clearConversationState(from)
  }
}

async function returnToMenu(from: string, data: any) {
  if (!data.clienteId) {
    await sendMessage(from, "❌ Erro: Cliente não identificado. Vou reiniciar a conversa.")
    await sendTipoClienteMenu(from)
    return
  }

  await updateConversationState(from, ConversationStage.MENU, data)
  await sendMessage(
    from,
    `🏠 *Menu Principal*\n\n` +
      `Olá, ${data.clienteNome || ""}! 👋\n\n` +
      `Escolha uma opção:\n\n` +
      `*1* - Criar ordem de serviço\n` +
      `*2* - Consultar ordem de serviço\n` +
      `*3* - Falar com atendente`,
  )
}

async function sendTipoClienteMenu(from: string) {
  await clearConversationState(from)
  await updateConversationState(from, ConversationStage.TIPO_CLIENTE, {})
  await sendMessage(
    from,
    "👋 *Bem-vindo ao Gestor Financeiro!*\n\n" +
      "Para começarmos, preciso saber:\n\n" +
      "*1* - Já sou cliente\n" +
      "*2* - Primeiro contato\n\n" +
      "_Digite o número da opção desejada_",
  )
}

async function sendMessage(to: string, message: string) {
  const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID
  const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN

  if (!PHONE_NUMBER_ID || !ACCESS_TOKEN) {
    console.error("[v0] ❌ Credenciais do WhatsApp não configuradas")
    return
  }

  try {
    const url = `https://graph.facebook.com/v21.0/${PHONE_NUMBER_ID}/messages`

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: to,
        type: "text",
        text: { body: message },
      }),
    })

    const result = await response.json()

    if (!response.ok) {
      console.error("[v0] ❌ Erro ao enviar mensagem:", result)
    } else {
      console.log("[v0] ✅ Mensagem enviada com sucesso")
    }

    return result
  } catch (error) {
    console.error("[v0] ❌ Exceção ao enviar mensagem:", error)
    throw error
  }
}
