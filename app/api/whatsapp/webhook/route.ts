import { type NextRequest, NextResponse } from "next/server"
import {
  getConversationState,
  updateConversationState,
  clearConversationState,
  restartConversation,
  findClientByCodigo,
  findClientByCNPJ,
  createClient,
  generateOrderNumber,
  fetchCepData,
  calcularDistanciaCliente,
  checkAgendamentoDisponivel,
  validateDate,
  findOrdensAbertas,
  findOrdemById,
  findOrdensBySituacao,
  getNextAvailablePeriod, // Importando nova função de agendamento automático
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
    console.log("[v0] 📱 ===== PROCESSANDO MENSAGEM =====")
    console.log("[v0] 📱 Número:", from)
    console.log("[v0] 💬 Mensagem:", messageBody)

    // Buscar estado atual da conversa
    const state = await getConversationState(from)

    if (state) {
      console.log("[v0] 📊 Estado encontrado - Stage:", state.stage)
      console.log("[v0] 📊 Cliente ID:", state.data?.clienteId)
    } else {
      console.log("[v0] 📊 Nenhum estado ativo - Nova conversa")
    }

    const normalizedMessage = messageBody.toLowerCase().trim()

    if (normalizedMessage === "sair") {
      console.log("[v0] 👋 Comando 'sair' detectado - finalizando conversa para:", from)
      await clearConversationState(from)
      await sendMessage(
        from,
        "👋 *Até logo!*\n\n" +
          "Obrigado por usar nosso Sistema de Ordens de Serviço.\n\n" +
          "Quando precisar, é só enviar uma mensagem que iniciaremos um novo atendimento! 😊",
      )
      console.log("[v0] ✅ Conversa finalizada com sucesso para:", from)
      return
    }

    if (normalizedMessage === "menu") {
      console.log("[v0] 🏠 Comando 'menu' detectado - voltando ao início")
      if (state?.data?.clienteId) {
        // Se já tem cliente identificado, vai direto pro menu principal
        await returnToMenu(from, state.data)
      } else {
        // Se não tem cliente, vai para identificação
        await sendTipoClienteMenu(from)
      }
      return
    }

    if (!state) {
      console.log("[v0] 👋 Nova conversa iniciada")
      await sendMessage(
        from,
        "👋 *Bem-vindo ao Sistema de Ordens de Serviço Automatizado!*\n\n" +
          "Estou aqui para ajudar você com:\n" +
          "• Criação de ordens de serviço\n" +
          "• Consulta de ordens abertas\n" +
          "• Consulta de ordens finalizadas\n" +
          "• Consulta de ordens agendadas\n\n" +
          "💡 *Dica:* Digite *menu* a qualquer momento para voltar ao início.\n\n" +
          "Vamos começar! 🚀",
      )
      // Pequeno delay para dar tempo de ler a mensagem de boas-vindas
      await new Promise((resolve) => setTimeout(resolve, 1000))
      await sendTipoClienteMenu(from)
      return
    }

    const currentStage = state.stage

    console.log("[v0] 📊 Estado atual:", currentStage)
    console.log("[v0] 📦 Dados salvos:", state?.data)

    const restartKeywords = [
      "voltar ao início",
      "voltar ao inicio",
      "voltar inicio",
      "recomeçar",
      "recomecar",
      "começar de novo",
      "comecar de novo",
      "reiniciar",
      "cancelar",
    ]

    const shouldRestart = restartKeywords.some((keyword) => normalizedMessage.includes(keyword))

    if (shouldRestart) {
      console.log("[v0] 🔄 Solicitação de reiniciar conversa detectada")
      await restartConversation(from)
      await sendMessage(
        from,
        "🔄 *Conversa reiniciada!*\n\n" +
          "Vamos começar do início. 👋\n\n" +
          "Você é nosso cliente ou é o primeiro contato?\n\n" +
          "*1* - Já sou cliente\n" +
          "*2* - Primeiro contato\n\n" +
          "_Digite o número da opção desejada_\n\n" +
          "💡 _Digite 'menu' para voltar ao início_",
      )
      return
    }

    if (
      (normalizedMessage === "voltar" || normalizedMessage === "0" || normalizedMessage === "voltar ao menu") &&
      currentStage !== "tipo_cliente" &&
      currentStage !== "codigo_cliente" &&
      currentStage !== "nome_cliente" &&
      currentStage !== "cadastro_cnpj" &&
      currentStage !== "cadastro_cep" &&
      currentStage !== "cadastro_numero" &&
      currentStage !== "cadastro_confirmar_endereco" &&
      currentStage !== "cadastro_telefone" &&
      currentStage !== "cadastro_email" &&
      currentStage !== "cadastro_sindico" &&
      currentStage !== "cadastro_solicitante_nome" && // Adicionado
      currentStage !== "cadastro_solicitante_telefone" && // Adicionado
      currentStage !== "cadastro_confirmar" &&
      currentStage !== "criar_os_tipo_atendimento" &&
      currentStage !== "criar_os_data_agendamento" &&
      currentStage !== "criar_os_periodo_agendamento" &&
      currentStage !== "criar_os_solicitante"
    ) {
      // User wants to return to menu - only if they have a client ID
      if (state.data?.clienteId) {
        await returnToMenu(from, state.data)
        return
      }
    }

    switch (currentStage) {
      case "tipo_cliente":
        await handleTipoCliente(from, messageBody, state?.data || {})
        break

      case "codigo_cliente":
        await handleCodigoCliente(from, messageBody, state?.data || {})
        break

      case "nome_cliente":
        await handleNomeCliente(from, messageBody, state?.data || {})
        break

      case "cadastro_cnpj":
        await handleCadastroCNPJ(from, messageBody, state?.data || {})
        break

      case "cadastro_confirmar_cliente_existente":
        await handleCadastroConfirmarClienteExistente(from, messageBody, state?.data || {})
        break

      case "cadastro_cep":
        await handleCadastroCEP(from, messageBody, state?.data || {})
        break

      case "cadastro_numero":
        await handleCadastroNumero(from, messageBody, state?.data || {})
        break

      case "cadastro_confirmar_endereco":
        await handleCadastroConfirmarEndereco(from, messageBody, state?.data || {})
        break

      case "cadastro_telefone":
        await handleCadastroTelefone(from, messageBody, state?.data || {})
        break

      case "cadastro_email":
        await handleCadastroEmail(from, messageBody, state?.data || {})
        break

      case "cadastro_sindico":
        await handleCadastroSindico(from, messageBody, state?.data || {})
        break

      case "cadastro_endereco":
        await handleCadastroEndereco(from, messageBody, state?.data || {})
        break

      case "cadastro_cidade":
        await handleCadastroCidade(from, messageBody, state?.data || {})
        break

      // Novos estados para capturar nome e telefone do solicitante
      case "cadastro_solicitante_nome":
        await handleCadastroSolicitanteNome(from, messageBody, state?.data || {})
        break

      case "cadastro_solicitante_telefone":
        await handleCadastroSolicitanteTelefone(from, messageBody, state?.data || {})
        break

      case "cadastro_confirmar":
        await handleCadastroConfirmar(from, messageBody, state?.data || {})
        break

      case "selecionar_cliente":
        await handleSelecionarCliente(from, messageBody, state?.data || {})
        break

      case "cliente_nao_encontrado":
        await handleClienteNaoEncontrado(from, messageBody, state?.data || {})
        break

      case "menu":
        await handleMenuOption(from, messageBody, state?.data || {})
        break

      case "criar_os_tipo_servico":
        await handleTipoServico(from, messageBody, state?.data || {})
        break

      case "criar_os_tipo_atendimento":
        await handleTipoAtendimento(from, messageBody, state?.data || {})
        break

      case "criar_os_data_agendamento":
        await handleDataAgendamento(from, messageBody, state?.data || {})
        break

      case "criar_os_periodo_agendamento":
        await handlePeriodoAgendamento(from, messageBody, state?.data || {})
        break

      case "criar_os_solicitante":
        await handleCriarOSSolicitante(from, messageBody, state?.data || {})
        break

      case "create_order_desc":
        await handleOrderDescription(from, messageBody, state?.data || {})
        break

      case "query_order":
        await handleQueryOrder(from, messageBody, state?.data || {})
        break

      case "consultar_os_codigo":
        await handleConsultarOSCodigo(from, messageBody, state?.data || {})
        break

      case "consultar_os_selecionar":
        await handleConsultarOSSelecionar(from, messageBody, state?.data || {})
        break

      case "wait_agent":
        await returnToMenu(from, state.data || {})
        break

      // Novo estado para confirmar agendamento automático
      case "criar_os_confirmar_agendamento":
        await handleConfirmarAgendamento(from, messageBody, state?.data || {})
        break

      case "criar_os_contato_nome":
        await handleCriarOSContatoNome(from, messageBody, state?.data || {})
        break

      case "criar_os_contato_telefone":
        await handleCriarOSContatoTelefone(from, messageBody, state?.data || {})
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
    await updateConversationState(from, "codigo_cliente", { ...data, tipo: "existente" })
    await sendMessage(
      from,
      "✅ *Cliente Existente*\n\n" +
        "Para te identificar, digite os *6 primeiros dígitos do CNPJ* do seu condomínio.\n\n" +
        "📋 Formato: *12.345.6*XX/XXXX-XX\n\n" +
        "Exemplo: _123456_\n\n" +
        "💡 _Digite 'menu' para voltar ao início_",
    )
  } else if (opcao === "2") {
    // Primeiro contato - iniciar cadastro
    await updateConversationState(from, "nome_cliente", { ...data, tipo: "novo" })
    await sendMessage(
      from,
      "👋 *Bem-vindo!*\n\n" +
        "Vou fazer seu cadastro rapidamente. 📝\n\n" +
        "Para começar, qual é o *nome do condomínio*?\n\n" +
        "💡 _Digite 'menu' para voltar ao início_",
    )
  } else {
    await sendMessage(
      from,
      "❌ Opção inválida.\n\n" +
        "Digite:\n" +
        "*1* - Já sou cliente\n" +
        "*2* - Primeiro contato\n\n" +
        "💡 _Digite 'menu' para voltar ao início_",
    )
  }
}

async function handleCodigoCliente(from: string, message: string, data: any) {
  const codigo = message.trim().replace(/\D/g, "").substring(0, 6)

  if (!codigo || codigo.length < 6) {
    await sendMessage(
      from,
      "❌ Código inválido.\n\n" +
        "Por favor, digite os *6 primeiros dígitos* do CNPJ.\n\n" +
        "Exemplo: _123456_\n\n" +
        "💡 _Digite 'menu' para voltar ao início_",
    )
    return
  }

  console.log("[v0] 🔍 Buscando cliente por código:", codigo)
  const cliente = await findClientByCodigo(codigo)

  if (!cliente) {
    await updateConversationState(from, "cliente_nao_encontrado", {
      ...data,
      codigoBuscado: codigo,
    })
    await sendMessage(
      from,
      `❌ *CNPJ não encontrado*\n\n` +
        `Não encontrei nenhum cliente com o código *${codigo}*.\n\n` +
        `Deseja fazer um novo cadastro?\n\n` +
        `*1* - Sim, cadastrar\n` +
        `*2* - Não, tentar outro código\n\n` +
        `💡 _Digite 'menu' para voltar ao início_`,
    )
  } else {
    await updateConversationState(from, "menu", {
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
        `*2* - Consultar ordem aberta\n` +
        `*3* - Consultar ordem finalizada\n` +
        `*4* - Consultar ordem agendada\n` +
        `*5* - Sair\n\n` +
        `💡 _Digite 'menu' para voltar ao início_`,
    )
  }
}

async function handleNomeCliente(from: string, message: string, data: any) {
  const nome = message.trim()

  if (!nome || nome.length < 3) {
    await sendMessage(
      from,
      "❌ Por favor, digite um nome válido com pelo menos 3 caracteres.\n\n" +
        "💡 _Digite 'menu' para voltar ao início_",
    )
    return
  }

  // Novo cliente - pedir CNPJ
  await updateConversationState(from, "cadastro_cnpj", { ...data, nome })
  await sendMessage(
    from,
    `Perfeito, *${nome}*! 👍\n\n` +
      `Agora, qual é o *CNPJ* do condomínio?\n\n` +
      `📋 Formato: XX.XXX.XXX/XXXX-XX\n\n` +
      `Exemplo: _12.345.678/0001-90_\n\n` +
      `💡 _Digite 'menu' para voltar ao início_`,
  )
}

async function handleCadastroCNPJ(from: string, message: string, data: any) {
  const cnpj = message.trim()
  const cnpjLimpo = cnpj.replace(/\D/g, "")

  if (!cnpjLimpo || cnpjLimpo.length < 14) {
    await sendMessage(
      from,
      "❌ CNPJ inválido.\n\n" +
        "Por favor, digite o CNPJ completo (14 dígitos).\n\n" +
        "Exemplo: _12.345.678/0001-90_\n\n" +
        "💡 _Digite 'menu' para voltar ao início_",
    )
    return
  }

  // Formatar CNPJ
  const cnpjFormatado = cnpjLimpo.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5")

  console.log("[v0] 🔍 Verificando se CNPJ já existe:", cnpjFormatado)
  const clienteExistente = await findClientByCNPJ(cnpjFormatado)

  if (clienteExistente) {
    // Cliente já existe - perguntar se confirma
    await updateConversationState(from, "cadastro_confirmar_cliente_existente", {
      ...data,
      cnpj: cnpjFormatado,
      clienteExistente,
    })
    await sendMessage(
      from,
      `✅ *CNPJ já cadastrado!*\n\n` +
        `Encontrei o seguinte cliente:\n\n` +
        `*${clienteExistente.nome}*\n` +
        `CNPJ: ${clienteExistente.cnpj}\n` +
        `Código: ${clienteExistente.codigo}\n` +
        `Telefone: ${clienteExistente.telefone || "Não informado"}\n` +
        `Endereço: ${clienteExistente.endereco || "Não informado"}\n` +
        `Cidade: ${clienteExistente.cidade || "Não informado"} - ${clienteExistente.estado || ""}\n\n` +
        `É este cliente?\n\n` +
        `*1* - Sim, continuar\n` +
        `*2* - Não, fazer novo cadastro\n\n` +
        `💡 _Digite 'menu' para voltar ao início_`,
    )
  } else {
    // CNPJ não existe - continuar cadastro
    await updateConversationState(from, "cadastro_cep", {
      ...data,
      cnpj: cnpjFormatado,
    })
    await sendMessage(
      from,
      `✅ CNPJ registrado!\n\n` +
        `Agora, qual é o *CEP* do condomínio?\n\n` +
        `📮 Formato: XXXXX-XXX\n\n` +
        `Exemplo: _03295-000_\n\n` +
        `💡 _Digite 'menu' para voltar ao início_`,
    )
  }
}

async function handleCadastroConfirmarClienteExistente(from: string, message: string, data: any) {
  const opcao = message.trim()

  if (opcao === "1") {
    const cliente = data.clienteExistente
    await updateConversationState(from, "menu", {
      ...data,
      clienteId: cliente.id,
      clienteNome: cliente.nome,
    })
    await sendMessage(
      from,
      `✅ *Cliente identificado!*\n\n` +
        `*${cliente.nome}*\n` +
        `Código: ${cliente.codigo}\n` +
        `CNPJ: ${cliente.cnpj}\n\n` +
        `Agora escolha uma opção:\n\n` +
        `*1* - Criar ordem de serviço\n` +
        `*2* - Consultar ordem aberta\n` +
        `*3* - Consultar ordem finalizada\n` +
        `*4* - Consultar ordem agendada\n` +
        `*5* - Sair\n\n` +
        `💡 _Digite 'menu' para voltar ao início_`,
    )
  } else if (opcao === "2") {
    // Não é este cliente - continuar cadastro
    await updateConversationState(from, "cadastro_cep", {
      ...data,
      clienteExistente: undefined,
    })
    await sendMessage(
      from,
      `📝 Ok! Vamos continuar o cadastro.\n\n` +
        `Qual é o *CEP* do condomínio?\n\n` +
        `📮 Formato: XXXXX-XXX\n\n` +
        `Exemplo: _03295-000_\n\n` +
        `💡 _Digite 'menu' para voltar ao início_`,
    )
  } else {
    await sendMessage(
      from,
      `❌ Opção inválida.\n\n` +
        `Digite:\n` +
        `*1* - Sim, continuar\n` +
        `*2* - Não, fazer novo cadastro\n\n` +
        `💡 _Digite 'menu' para voltar ao início_`,
    )
  }
}

async function handleCadastroCEP(from: string, message: string, data: any) {
  const cep = message.trim()
  const cepLimpo = cep.replace(/\D/g, "")

  if (!cepLimpo || cepLimpo.length !== 8) {
    await sendMessage(
      from,
      "❌ CEP inválido.\n\n" +
        "Por favor, digite o CEP completo (8 dígitos).\n\n" +
        "Exemplo: _03295-000_\n\n" +
        "💡 _Digite 'menu' para voltar ao início_",
    )
    return
  }

  // Buscar dados do CEP
  const cepData = await fetchCepData(cepLimpo)

  if (!cepData.success || !cepData.data) {
    await sendMessage(
      from,
      "❌ CEP não encontrado.\n\n" +
        "Por favor, verifique o CEP e tente novamente.\n\n" +
        "Exemplo: _03295-000_\n\n" +
        "💡 _Digite 'menu' para voltar ao início_",
    )
    return
  }

  // Formatar CEP
  const cepFormatado = cepLimpo.replace(/^(\d{5})(\d{3})$/, "$1-$2")

  await updateConversationState(from, "cadastro_numero", {
    ...data,
    cep: cepFormatado,
    endereco: cepData.data.logradouro,
    bairro: cepData.data.bairro,
    cidade: cepData.data.localidade,
    estado: cepData.data.uf,
  })

  await sendMessage(
    from,
    `✅ CEP encontrado!\n\n` +
      `📍 *Endereço:*\n` +
      `${cepData.data.logradouro || "Não informado"}\n` +
      `Bairro: ${cepData.data.bairro || "Não informado"}\n` +
      `Cidade: ${cepData.data.localidade} - ${cepData.data.uf}\n` +
      `CEP: ${cepFormatado}\n\n` +
      `Agora, qual é o *número do imóvel*?\n\n` +
      `Exemplo: _123_\n\n` +
      `💡 _Digite 'menu' para voltar ao início_`,
  )
}

async function handleCadastroNumero(from: string, message: string, data: any) {
  const numero = message.trim()

  if (!numero) {
    await sendMessage(from, "❌ Por favor, digite o número do imóvel.\n\n" + "💡 _Digite 'menu' para voltar ao início_")
    return
  }

  // Adicionar número ao endereço
  const enderecoCompleto = `${data.endereco}, ${numero}`

  await updateConversationState(from, "cadastro_confirmar_endereco", {
    ...data,
    endereco: enderecoCompleto,
    numero,
  })

  await sendMessage(
    from,
    `✅ Número registrado!\n\n` +
      `📍 *Endereço completo:*\n` +
      `${enderecoCompleto}\n` +
      `Bairro: ${data.bairro || "Não informado"}\n` +
      `Cidade: ${data.cidade} - ${data.estado}\n` +
      `CEP: ${data.cep}\n\n` +
      `Os dados estão corretos?\n\n` +
      `*1* - Sim, continuar\n` +
      `*2* - Não, corrigir endereço\n\n` +
      `💡 _Digite 'menu' para voltar ao início_`,
  )
}

async function handleCadastroConfirmarEndereco(from: string, message: string, data: any) {
  const opcao = message.trim()

  if (opcao === "1") {
    console.log("[v0] 📏 Calculando distância do cliente...")
    const distanciaResult = await calcularDistanciaCliente(data.cep)

    if (distanciaResult.success) {
      console.log("[v0] ✅ Distância calculada:", distanciaResult.distanciaKm, "km")
      await updateConversationState(from, "cadastro_telefone", {
        ...data,
        distanciaKm: distanciaResult.distanciaKm,
        latitude: distanciaResult.latitude,
        longitude: distanciaResult.longitude,
      })
      await sendMessage(
        from,
        `✅ Endereço confirmado!\n` +
          `📏 Distância: ${distanciaResult.distanciaKm} km\n\n` +
          `O condomínio tem *telefone fixo*?\n\n` +
          `Digite o número ou *pular* se não tiver.\n\n` +
          `Exemplo: _(11) 3333-4444_\n\n` +
          `💡 _Digite 'menu' para voltar ao início_`,
      )
    } else {
      // Erro ao calcular distância - continuar sem distância
      console.log("[v0] ⚠️ Não foi possível calcular distância:", distanciaResult.error)
      await updateConversationState(from, "cadastro_telefone", data)
      await sendMessage(
        from,
        `✅ Endereço confirmado!\n\n` +
          `O condomínio tem *telefone fixo*?\n\n` +
          `Digite o número ou *pular* se não tiver.\n\n` +
          `Exemplo: _(11) 3333-4444_\n\n` +
          `💡 _Digite 'menu' para voltar ao início_`,
      )
    }
  } else if (opcao === "2") {
    // Corrigir endereço manualmente
    await updateConversationState(from, "cadastro_endereco", data)
    await sendMessage(
      from,
      `📝 Ok! Digite o *endereço completo* do condomínio:\n\n` +
        `Exemplo: _Rua Exemplo, 123 - Bairro_\n\n` +
        `💡 _Digite 'menu' para voltar ao início_`,
    )
  } else {
    await sendMessage(
      from,
      `❌ Opção inválida.\n\n` +
        `Digite:\n` +
        `*1* - Sim, continuar\n` +
        `*2* - Não, corrigir endereço\n\n` +
        `💡 _Digite 'menu' para voltar ao início_`,
    )
  }
}

async function handleCadastroTelefone(from: string, message: string, data: any) {
  const telefone = message.trim()
  const telefoneFixo = telefone.toLowerCase() === "pular" ? "" : telefone

  await updateConversationState(from, "cadastro_email", { ...data, telefone: telefoneFixo })
  await sendMessage(
    from,
    `✅ ${telefoneFixo ? "Telefone fixo registrado!" : "Sem telefone fixo."}\n\n` +
      `Agora, qual é o *email* para contato?\n\n` +
      `Exemplo: _contato@condominio.com.br_\n\n` +
      `💡 _Digite 'menu' para voltar ao início_`,
  )
}

async function handleCadastroEmail(from: string, message: string, data: any) {
  const email = message.trim()

  // Validação básica de email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    await sendMessage(
      from,
      "❌ Email inválido.\n\n" +
        "Por favor, digite um email válido.\n\n" +
        "Exemplo: _contato@condominio.com.br_\n\n" +
        "💡 _Digite 'menu' para voltar ao início_",
    )
    return
  }

  await updateConversationState(from, "cadastro_sindico", { ...data, email })
  await sendMessage(
    from,
    `✅ Email registrado!\n\n` +
      `Agora, qual é o *nome do síndico* do condomínio?\n\n` +
      `Exemplo: _João Silva_\n\n` +
      `💡 _Digite 'menu' para voltar ao início_`,
  )
}

async function handleCadastroSindico(from: string, message: string, data: any) {
  const sindico = message.trim()

  if (!sindico || sindico.length < 3) {
    await sendMessage(
      from,
      "❌ Por favor, digite um nome válido com pelo menos 3 caracteres.\n\n" +
        "💡 _Digite 'menu' para voltar ao início_",
    )
    return
  }

  await updateConversationState(from, "cadastro_solicitante_nome", { ...data, sindico })
  await sendMessage(
    from,
    `✅ Síndico registrado: *${sindico}*\n\n` +
      `Agora, qual é o *seu nome*?\n` +
      `(Pessoa que está solicitando o cadastro)\n\n` +
      `Exemplo: _Maria Santos_\n\n` +
      `💡 _Digite 'menu' para voltar ao início_`,
  )
}

async function handleCadastroSolicitanteNome(from: string, message: string, data: any) {
  const solicitanteNome = message.trim()

  if (!solicitanteNome || solicitanteNome.length < 3) {
    await sendMessage(
      from,
      "❌ Por favor, digite um nome válido com pelo menos 3 caracteres.\n\n" +
        "💡 _Digite 'menu' para voltar ao início_",
    )
    return
  }

  await updateConversationState(from, "cadastro_solicitante_telefone", { ...data, solicitanteNome })
  await sendMessage(
    from,
    `✅ Nome registrado: *${solicitanteNome}*\n\n` +
      `Agora, qual é o *seu telefone*?\n\n` +
      `Exemplo: _(11) 99999-9999_\n\n` +
      `💡 _Digite 'menu' para voltar ao início_`,
  )
}

async function handleCadastroSolicitanteTelefone(from: string, message: string, data: any) {
  const solicitanteTelefone = message.trim()

  if (!solicitanteTelefone) {
    await sendMessage(from, "❌ Por favor, digite um telefone válido.\n\n" + "💡 _Digite 'menu' para voltar ao início_")
    return
  }

  await updateConversationState(from, "cadastro_confirmar", { ...data, solicitanteTelefone })
  await sendMessage(
    from,
    `📋 *Confirme seus dados:*\n\n` +
      `*Condomínio:* ${data.nome}\n` +
      `*CNPJ:* ${data.cnpj}\n` +
      `*CEP:* ${data.cep}\n` +
      `*Endereço:* ${data.endereco}\n` +
      `*Bairro:* ${data.bairro}\n` +
      `*Cidade:* ${data.cidade} - ${data.estado}\n` +
      `*Telefone Principal:* ${data.telefone}\n` +
      `*Email:* ${data.email}\n` +
      `*Síndico:* ${data.sindico}\n` +
      `*Pessoa de Contato:* ${data.solicitanteNome}\n` +
      `*Telefone de Contato:* ${solicitanteTelefone}\n` +
      (data.distanciaKm ? `*Distância:* ${data.distanciaKm} km\n` : "") +
      `\n` +
      `Está tudo correto?\n\n` +
      `*1* - Sim, cadastrar\n` +
      `*2* - Não, corrigir\n\n` +
      `💡 _Digite 'menu' para voltar ao início_`,
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
        cep: data.cep,
        endereco: data.endereco,
        bairro: data.bairro,
        cidade: data.cidade,
        estado: data.estado,
        telefone: data.solicitanteTelefone || data.telefone, // Usar telefone do solicitante
        email: data.email,
        sindico: data.sindico,
        contato: data.solicitanteNome, // Nome da pessoa que está solicitando
        distanciaKm: data.distanciaKm,
        latitude: data.latitude,
        longitude: data.longitude,
      })

      const codigo = data.cnpj.replace(/\D/g, "").substring(0, 6)

      await updateConversationState(from, "menu", {
        clienteId,
        clienteNome: data.nome,
        codigo,
        cnpj: data.cnpj,
      })

      console.log("[v0] ✅ Cliente cadastrado com ID:", clienteId)
      console.log("[v0] ✅ Estado atualizado para 'menu' com clienteId:", clienteId)

      await sendMessage(
        from,
        `✅ *Cadastro realizado com sucesso!*\n\n` +
          `*${data.nome}*\n` +
          `Código: ${codigo}\n` +
          `CNPJ: ${data.cnpj}\n` +
          (data.distanciaKm ? `Distância: ${data.distanciaKm} km\n` : "") +
          `\n` +
          `Agora escolha uma opção:\n\n` +
          `*1* - Criar ordem de serviço\n` +
          `*2* - Consultar ordem aberta\n` +
          `*3* - Consultar ordem finalizada\n` +
          `*4* - Consultar ordem agendada\n` +
          `*5* - Sair\n\n` +
          `💡 _Digite 'menu' para voltar ao início_`,
      )
    } catch (error) {
      console.error("[v0] ❌ Erro ao cadastrar cliente:", error)
      await sendMessage(from, "❌ Desculpe, ocorreu um erro ao cadastrar. Por favor, tente novamente mais tarde.")
      await clearConversationState(from)
    }
  } else if (opcao === "2") {
    // Reiniciar cadastro
    await updateConversationState(from, "nome_cliente", { tipo: "novo" })
    await sendMessage(
      from,
      `🔄 Ok! Vamos recomeçar.\n\nQual é o *nome do condomínio*?\n\n💡 _Digite 'menu' para voltar ao início_`,
    )
  } else {
    await sendMessage(
      from,
      `❌ Opção inválida.\n\n` +
        `Digite:\n` +
        `*1* - Sim, cadastrar\n` +
        `*2* - Não, corrigir\n\n` +
        `💡 _Digite 'menu' para voltar ao início_`,
    )
  }
}

async function handleSelecionarCliente(from: string, message: string, data: any) {
  const opcao = Number.parseInt(message.trim())
  const clientes = data.clientesEncontrados || []

  if (opcao >= 1 && opcao <= clientes.length) {
    const cliente = clientes[opcao - 1]
    await updateConversationState(from, "menu", {
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
        `*2* - Consultar ordem aberta\n` +
        `*3* - Consultar ordem finalizada\n` +
        `*4* - Consultar ordem agendada\n` +
        `*5* - Sair\n\n` +
        `💡 _Digite 'menu' para voltar ao início_`,
    )
  } else {
    await sendMessage(
      from,
      `❌ Opção inválida. Digite um número entre 1 e ${clientes.length}.\n\n` +
        `💡 _Digite 'menu' para voltar ao início_`,
    )
  }
}

async function handleClienteNaoEncontrado(from: string, message: string, data: any) {
  const opcao = message.trim()

  if (opcao === "1") {
    // Iniciar cadastro
    await updateConversationState(from, "nome_cliente", {
      ...data,
      tipo: "novo",
    })
    await sendMessage(
      from,
      `📝 *Novo Cadastro*\n\n` +
        `Vou fazer seu cadastro!\n\n` +
        `Qual é o *nome do condomínio*?\n\n` +
        `💡 _Digite 'menu' para voltar ao início_`,
    )
  } else if (opcao === "2") {
    // Tentar outro código
    await updateConversationState(from, "codigo_cliente", { ...data, tipo: "existente" })
    await sendMessage(
      from,
      `🔍 Ok! Digite os *6 primeiros dígitos do CNPJ* novamente:\n\n` +
        `Exemplo: _123456_\n\n` +
        `💡 _Digite 'menu' para voltar ao início_`,
    )
  } else {
    await sendMessage(
      from,
      `❌ Opção inválida.\n\n` +
        `Digite:\n` +
        `*1* - Sim, cadastrar\n` +
        `*2* - Não, tentar outro código\n\n` +
        `💡 _Digite 'menu' para voltar ao início_`,
    )
  }
}

async function handleCadastroEndereco(from: string, message: string, data: any) {
  const endereco = message.trim()
  await updateConversationState(from, "cadastro_cidade", { ...data, endereco })
  await sendMessage(
    from,
    `✅ Endereço registrado!\n\n` +
      `Qual é a sua *cidade*?\n\n` +
      `Exemplo: _São Paulo_\n\n` +
      `💡 _Digite 'menu' para voltar ao início_`,
  )
}

async function handleCadastroCidade(from: string, message: string, data: any) {
  const cidade = message.trim()
  await updateConversationState(from, "cadastro_confirmar", { ...data, cidade })
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
      `*2* - Não, corrigir\n\n` +
      `💡 _Digite 'menu' para voltar ao início_`,
  )
}

async function handleMenuOption(from: string, option: string, data: any) {
  console.log("[v0] 📋 handleMenuOption chamado")
  console.log("[v0] 📋 Opção selecionada:", option)
  console.log("[v0] 📋 Dados recebidos:", JSON.stringify(data, null, 2))

  if (!data.clienteId) {
    console.log("[v0] ❌ Cliente ID não encontrado no handleMenuOption")
    await sendMessage(from, "❌ Erro: Cliente não identificado. Vou reiniciar a conversa.")
    await sendTipoClienteMenu(from)
    return
  }

  switch (option) {
    case "1":
      // Criar ordem de serviço
      console.log("[v0] ✅ Iniciando criação de OS para cliente:", data.clienteId)
      await updateConversationState(from, "criar_os_tipo_servico", data)
      await sendMessage(
        from,
        "📝 *Criar Nova Ordem de Serviço*\n\n" +
          "Qual é o tipo de serviço?\n\n" +
          "*1* - Manutenção\n" +
          "*2* - Orçamento\n" +
          "*3* - Vistoria para Contrato\n\n" +
          "_Digite o número da opção desejada_\n\n" +
          "💡 _Digite 'menu' para voltar ao início_",
      )
      break

    case "2":
      // Consultar ordem aberta
      await handleConsultarPorSituacao(from, data, "aberta")
      break

    case "3":
      // Consultar ordem finalizada
      await handleConsultarPorSituacao(from, data, "concluida")
      break

    case "4":
      // Consultar ordem agendada
      await handleConsultarPorSituacao(from, data, "agendada")
      break

    case "5":
      console.log("[v0] 👋 Opção 5 (Sair) selecionada")
      await clearConversationState(from)
      await sendMessage(
        from,
        "👋 *Até logo!*\n\n" +
          "Obrigado por usar nosso Sistema de Ordens de Serviço.\n\n" +
          "Quando precisar, é só enviar uma mensagem que iniciaremos um novo atendimento! 😊",
      )
      break

    default:
      await sendMessage(
        from,
        `❌ Opção inválida.\n\n` +
          `Digite:\n` +
          `*1* - Criar ordem de serviço\n` +
          `*2* - Consultar ordem aberta\n` +
          `*3* - Consultar ordem finalizada\n` +
          `*4* - Consultar ordem agendada\n` +
          `*5* - Sair\n\n` +
          `💡 _Digite 'menu' para voltar ao início_`,
      )
  }
}

async function handleTipoServico(from: string, message: string, data: any) {
  const opcao = message.trim()

  let tipoServico: string
  let tipoServicoLabel: string

  if (opcao === "1") {
    tipoServico = "manutencao"
    tipoServicoLabel = "Manutenção"
  } else if (opcao === "2") {
    tipoServico = "orcamento"
    tipoServicoLabel = "Orçamento"
  } else if (opcao === "3") {
    tipoServico = "vistoria_contrato"
    tipoServicoLabel = "Vistoria para Contrato"
  } else {
    await sendMessage(
      from,
      "❌ Opção inválida.\n\n" +
        "Digite:\n" +
        "*1* - Manutenção\n" +
        "*2* - Orçamento\n" +
        "*3* - Vistoria para Contrato\n\n" +
        "💡 _Digite 'menu' para voltar ao início_",
    )
    return
  }

  console.log("[v0] 🔍 Calculando próximo período disponível...")
  const proximoPeriodo = await getNextAvailablePeriod()

  if (!proximoPeriodo) {
    // Não foi possível calcular - pedir para usuário escolher manualmente
    await updateConversationState(from, "criar_os_data_agendamento", {
      ...data,
      tipoServico,
      tipoServicoLabel,
      tipoAtendimento: "agendado", // Assumir agendado se não puder calcular automaticamente
    })
    await sendMessage(
      from,
      `✅ *Tipo de serviço: ${tipoServicoLabel}*\n\n` +
        "Não foi possível calcular automaticamente o próximo período disponível.\n\n" +
        "📅 *Escolher Data Manualmente*\n\n" +
        "Digite a data desejada para o atendimento:\n\n" +
        "📋 Formato: DD/MM/AAAA\n" +
        "Exemplo: _15/01/2025_\n\n" +
        "⚠️ Apenas dias úteis (segunda a sexta)\n\n" +
        "💡 _Digite 'menu' para voltar ao início_",
    )
    return
  }

  // Sugerir o próximo período disponível
  await updateConversationState(from, "criar_os_confirmar_agendamento", {
    ...data,
    tipoServico,
    tipoServicoLabel,
    tipoAtendimento: "agendado",
    dataAgendamento: proximoPeriodo.data,
    dataAgendamentoFormatada: proximoPeriodo.dataFormatada,
    periodoAgendamento: proximoPeriodo.periodo,
    periodoAgendamentoLabel: proximoPeriodo.periodoLabel,
  })

  await sendMessage(
    from,
    `✅ *Tipo de serviço: ${tipoServicoLabel}*\n\n` +
      `📅 *Próximo período disponível:*\n` +
      `Data: *${proximoPeriodo.dataFormatada}*\n` +
      `Período: *${proximoPeriodo.periodoLabel}*\n\n` +
      `⚠️ *Importante:*\n` +
      `- Agendamento sujeito a confirmação\n` +
      `- Horários de atendimento:\n` +
      `  • Manhã: 09:00 às 12:00\n` +
      `  • Tarde: 13:00 às 17:00\n` +
      `- Apenas dias úteis (segunda a sexta)\n\n` +
      `Confirma este agendamento?\n\n` +
      `*1* - Sim, confirmar\n` +
      `*2* - Não, escolher outra data\n\n` +
      `💡 _Digite 'menu' para voltar ao início_`,
  )
}

async function handleTipoAtendimento(from: string, message: string, data: any) {
  const opcao = message.trim()

  if (opcao === "1") {
    await updateConversationState(from, "criar_os_solicitante", {
      ...data,
      tipoAtendimento: "hoje",
    })
    await sendMessage(
      from,
      "📝 *Atendimento para Hoje*\n\n" +
        "Antes de continuar, qual é o *seu nome*?\n" +
        "(Pessoa que está solicitando o serviço)\n\n" +
        "Exemplo: _Maria Santos_\n\n" +
        "💡 _Digite 'menu' para voltar ao início_",
    )
  } else if (opcao === "2") {
    // Agendar - pedir data
    await updateConversationState(from, "criar_os_data_agendamento", {
      ...data,
      tipoAtendimento: "agendado",
    })
    await sendMessage(
      from,
      "📅 *Agendar Atendimento*\n\n" +
        "Digite a data desejada para o atendimento:\n\n" +
        "📋 Formato: DD/MM/AAAA\n" +
        "Exemplo: _15/01/2025_\n\n" +
        "⚠️ Apenas dias úteis (segunda a sexta)\n\n" +
        "💡 _Digite 'menu' para voltar ao início_",
    )
  } else {
    await sendMessage(
      from,
      "❌ Opção inválida.\n\n" +
        "Digite:\n" +
        "*1* - Para hoje\n" +
        "*2* - Agendar para data específica\n\n" +
        "💡 _Digite 'menu' para voltar ao início_",
    )
  }
}

async function handleDataAgendamento(from: string, message: string, data: any) {
  const dataStr = message.trim()

  // Validar data
  const validation = validateDate(dataStr)

  if (!validation.valid) {
    await sendMessage(
      from,
      `❌ ${validation.error}\n\n` +
        "Por favor, digite uma data válida:\n\n" +
        "📋 Formato: DD/MM/AAAA\n" +
        "Exemplo: _15/01/2025_\n\n" +
        "⚠️ Apenas dias úteis (segunda a sexta)\n\n" +
        "💡 _Digite 'menu' para voltar ao início_",
    )
    return
  }

  // Converter para formato YYYY-MM-DD para o banco
  const dataFormatada = validation.date!.toISOString().split("T")[0]

  await updateConversationState(from, "criar_os_periodo_agendamento", {
    ...data,
    dataAgendamento: dataFormatada,
    dataAgendamentoFormatada: dataStr,
  })

  await sendMessage(
    from,
    `✅ Data selecionada: *${dataStr}*\n\n` +
      "Agora escolha o período:\n\n" +
      "*1* - Manhã (09:00 - 12:00)\n" +
      "*2* - Tarde (13:00 - 17:00)\n\n" +
      "⚠️ *Importante:* \n" +
      "- Não é possível agendar duas ordens no mesmo período\n" +
      "- Apenas dias úteis (segunda a sexta)\n\n" +
      "_Digite o número da opção desejada_\n\n" +
      "💡 _Digite 'menu' para voltar ao início_",
  )
}

async function handlePeriodoAgendamento(from: string, message: string, data: any) {
  const opcao = message.trim()

  if (opcao === "3") {
    await updateConversationState(from, "criar_os_data_agendamento", {
      ...data,
      dataAgendamento: undefined,
      dataAgendamentoFormatada: undefined,
    })
    await sendMessage(
      from,
      "📅 *Escolher Nova Data*\n\n" +
        "Digite a data desejada para o atendimento:\n\n" +
        "📋 Formato: DD/MM/AAAA\n" +
        "Exemplo: _15/01/2025_\n\n" +
        "⚠️ Apenas dias úteis (segunda a sexta)\n\n" +
        "💡 _Digite 'menu' para voltar ao início_",
    )
    return
  }

  let periodo: string
  let periodoLabel: string

  if (opcao === "1") {
    periodo = "manha"
    periodoLabel = "Manhã (09:00 - 12:00)"
  } else if (opcao === "2") {
    periodo = "tarde"
    periodoLabel = "Tarde (13:00 - 17:00)"
  } else {
    await sendMessage(
      from,
      "❌ Opção inválida.\n\n" +
        "Digite:\n" +
        "*1* - Manhã (09:00 - 12:00)\n" +
        "*2* - Tarde (13:00 - 17:00)\n" +
        "*3* - Escolher outra data\n\n" +
        "💡 _Digite 'menu' para voltar ao início_",
    )
    return
  }

  const { disponivel, count } = await checkAgendamentoDisponivel(data.dataAgendamento, periodo)

  if (!disponivel) {
    let mensagemIndisponivel = ""

    if (count > 0) {
      mensagemIndisponivel = `Já existe agendamento para ${data.dataAgendamentoFormatada} no período selecionado ou o dia está com período INTEGRAL reservado.`
    }

    await sendMessage(
      from,
      `⚠️ *Período Indisponível*\n\n` +
        `${mensagemIndisponivel}\n\n` +
        `❌ *Não é permitido agendar duas ordens no mesmo dia e período.*\n\n` +
        `Por favor, escolha outro período ou outra data:\n\n` +
        `*1* - Manhã (09:00 - 12:00)\n` +
        `*2* - Tarde (13:00 - 17:00)\n` +
        `*3* - Escolher outra data\n\n` +
        `💡 _Digite 'menu' para voltar ao início_`,
    )
    return
  }

  await updateConversationState(from, "criar_os_solicitante", {
    ...data,
    periodoAgendamento: periodo,
    periodoAgendamentoLabel: periodoLabel,
  })

  await sendMessage(
    from,
    `✅ *Agendamento Confirmado*\n\n` +
      `📅 Data: ${data.dataAgendamentoFormatada}\n` +
      `🕐 Período: ${periodoLabel}\n\n` +
      `⚠️ *Agendamento sujeito a confirmação*\n` +
      `📋 Horário de atendimento:\n` +
      `   - Manhã: 09:00 às 12:00\n` +
      `   - Tarde: 13:00 às 17:00\n` +
      `   - Apenas dias úteis (segunda a sexta)\n\n` +
      `Agora, qual é o *seu nome*?\n` +
      `(Pessoa que está solicitando o serviço)\n\n` +
      `Exemplo: _Maria Santos_\n\n` +
      `💡 _Digite 'menu' para voltar ao início_`,
  )
}

async function handleCriarOSSolicitante(from: string, message: string, data: any) {
  const solicitante = message.trim()

  if (!solicitante || solicitante.length < 3) {
    await sendMessage(
      from,
      "❌ Por favor, digite um nome válido com pelo menos 3 caracteres.\n\n" +
        "💡 _Digite 'menu' para voltar ao início_",
    )
    return
  }

  await updateConversationState(from, "create_order_desc", {
    ...data,
    solicitanteOS: solicitante,
  })

  const tipoAtendimento = data.tipoAtendimento || "hoje"

  if (tipoAtendimento === "agendado") {
    await sendMessage(
      from,
      `✅ Nome registrado: *${solicitante}*\n\n` +
        `Agora, descreva o problema ou serviço necessário:\n\n` +
        `Exemplo: _Verificar câmeras do hall do bloco A_\n\n` +
        `💡 _Digite 'menu' para voltar ao início_`,
    )
  } else {
    await sendMessage(
      from,
      `✅ Nome registrado: *${solicitante}*\n\n` +
        `Agora, descreva o problema ou serviço necessário:\n\n` +
        `Exemplo: _Verificar câmeras do hall do bloco A_\n\n` +
        `💡 _Digite 'menu' para voltar ao início_`,
    )
  }
}

async function handleOrderDescription(from: string, description: string, data: any) {
  try {
    console.log("[v0] 📝 Iniciando criação de ordem de serviço")
    console.log("[v0] 📦 Dados recebidos:", JSON.stringify(data, null, 2))

    if (!data.clienteId) {
      console.log("[v0] ❌ Cliente ID não encontrado")
      await sendMessage(from, "❌ Erro: Cliente não identificado. Vou reiniciar a conversa.")
      await sendTipoClienteMenu(from)
      return
    }

    console.log("[v0] 🔍 Buscando dados do cliente ID:", data.clienteId)
    const clienteResult = await query("SELECT id, nome, endereco FROM clientes WHERE id = ?", [data.clienteId])

    if (!clienteResult || (clienteResult as any[]).length === 0) {
      console.log("[v0] ❌ Cliente não encontrado no banco")
      await sendMessage(from, "❌ Erro: Cliente não encontrado.")
      await clearConversationState(from)
      return
    }

    const cliente = (clienteResult as any[])[0]
    console.log("[v0] ✅ Cliente encontrado:", cliente.nome)

    console.log("[v0] 🔢 Gerando número da ordem...")
    const numeroOrdem = await generateOrderNumber()
    console.log("[v0] ✅ Número gerado:", numeroOrdem)

    const dataAtual = new Date().toISOString().split("T")[0]
    const solicitadoPor = data.solicitanteOS || data.solicitante || data.solicitadoPor || cliente.nome

    const tipoAtendimento = data.tipoAtendimento || "hoje"
    const situacao = tipoAtendimento === "agendado" ? "agendada" : "aberta"
    const dataAgendamento = data.dataAgendamento || null
    const periodoAgendamento = data.periodoAgendamento || null
    const tipoServico = data.tipoServico || "manutencao"

    console.log("[v0] 📋 Dados da ordem:")
    console.log("[v0]   - Número:", numeroOrdem)
    console.log("[v0]   - Cliente ID:", cliente.id)
    console.log("[v0]   - Tipo de serviço:", tipoServico)
    console.log("[v0]   - Situação:", situacao)
    console.log("[v0]   - Data agendamento:", dataAgendamento)
    console.log("[v0]   - Período agendamento:", periodoAgendamento)
    console.log("[v0]   - Solicitado por:", solicitadoPor)

    console.log("[v0] 💾 Inserindo ordem no banco...")
    const insertResult = await query(
      `INSERT INTO ordens_servico
       (numero, cliente_id, tecnico_name, tecnico_email, data_atual, tipo_servico,
        descricao_defeito, responsavel, nome_responsavel, solicitado_por, situacao,
        data_agendamento, periodo_agendamento, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        numeroOrdem,
        cliente.id,
        "A definir",
        null,
        dataAtual,
        tipoServico,
        description,
        "sindico",
        cliente.nome,
        solicitadoPor,
        situacao,
        dataAgendamento,
        periodoAgendamento,
      ],
    )

    const ordemId = (insertResult as any).insertId
    console.log("[v0] ✅ Ordem criada com ID:", ordemId)
    console.log("[v0] ✅ Ordem criada com número:", numeroOrdem, "para cliente:", cliente.nome)

    let mensagemConfirmacao =
      "✅ *Ordem de Serviço Criada!*\n\n" +
      `📋 Número: *${numeroOrdem}*\n` +
      `🔧 Tipo: ${data.tipoServicoLabel || "Manutenção"}\n` +
      `👤 Cliente: ${cliente.nome}\n` +
      `📍 Endereço: ${cliente.endereco || "Não informado"}\n`

    if (tipoAtendimento === "agendado") {
      mensagemConfirmacao +=
        `📅 Data: ${data.dataAgendamentoFormatada}\n` +
        `🕐 Período: ${data.periodoAgendamentoLabel}\n` +
        `⚠️ *Agendamento sujeito a confirmação*\n`
    }

    mensagemConfirmacao +=
      `\n📝 Descrição: ${description}\n` +
      `✍️ Solicitado por: ${solicitadoPor}\n\n` +
      "🔔 Você receberá atualizações sobre o andamento do serviço.\n\n" +
      "Deseja fazer mais alguma coisa?\n\n" +
      "*1* - Criar outra OS\n" +
      "*2* - Consultar ordem aberta\n" +
      "*3* - Consultar ordem finalizada\n" +
      "*4* - Consultar ordem agendada\n" +
      "*5* - Sair\n\n" +
      "💡 _Digite 'menu' para voltar ao início_"

    await sendMessage(from, mensagemConfirmacao)
    await updateConversationState(from, "menu", data)
  } catch (error) {
    console.error("[v0] ❌ Erro ao criar ordem:", error)
    console.error("[v0] ❌ Stack trace:", error instanceof Error ? error.stack : "N/A")
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
          "Verifique o número e tente novamente ou digite *menu* para retornar ao menu.\n\n" +
          "💡 _Digite 'menu' para voltar ao início_",
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
      "*2* - Consultar outra OS\n\n" +
      "💡 _Digite 'menu' para voltar ao início_"

    await sendMessage(from, message)
    await updateConversationState(from, "menu", data)
  } catch (error) {
    console.error("[v0] ❌ Erro ao consultar ordem:", error)
    await sendMessage(from, "❌ Erro ao consultar ordem. Por favor, tente novamente.")
    await clearConversationState(from)
  }
}

async function handleConsultarOSCodigo(from: string, message: string, data: any) {
  const codigo = message.trim().replace(/\D/g, "").substring(0, 6)

  if (!codigo || codigo.length < 6) {
    await sendMessage(
      from,
      "❌ Código inválido.\n\n" +
        "Por favor, digite os *6 primeiros dígitos* do CNPJ.\n\n" +
        "Exemplo: _123456_\n\n" +
        "💡 _Digite 'menu' para voltar ao início_",
    )
    return
  }

  console.log("[v0] 🔍 Buscando cliente por código para consulta:", codigo)
  const cliente = await findClientByCodigo(codigo)

  if (!cliente) {
    await sendMessage(
      from,
      `❌ *CNPJ não encontrado*\n\n` +
        `Não encontrei nenhum cliente com o código *${codigo}*.\n\n` +
        `Digite outro código ou 'menu' para retornar ao menu.\n\n` +
        `💡 _Digite 'menu' para voltar ao início_`,
    )
    return
  }

  console.log("[v0] 🔍 Buscando ordens abertas do cliente:", cliente.id)
  const ordens = await findOrdensAbertas(cliente.id)

  if (ordens.length === 0) {
    await updateConversationState(from, "menu", data)
    await sendMessage(
      from,
      `ℹ️ *Nenhuma ordem encontrada*\n\n` +
        `Não há ordens de serviço abertas para *${cliente.nome}*.\n\n` +
        `Deseja criar uma nova ordem?\n\n` +
        `*1* - Criar ordem de serviço\n` +
        `*2* - Voltar ao menu\n\n` +
        `💡 _Digite 'menu' para voltar ao início_`,
    )
    return
  }

  // Mapear tipo de serviço
  const tipoMap: Record<string, string> = {
    manutencao: "Manutenção",
    orcamento: "Orçamento",
    vistoria_contrato: "Vistoria",
    preventiva: "Preventiva",
  }

  // Mapear situação
  const statusMap: Record<string, string> = {
    aberta: "🔴 Aberta",
    agendada: "📅 Agendada",
    em_andamento: "🟡 Em Andamento",
  }

  // Mapear período
  const periodoMap: Record<string, string> = {
    manha: "Manhã",
    tarde: "Tarde",
  }

  // Montar lista de ordens
  let mensagem = `📋 *Ordens de Serviço - ${cliente.nome}*\n\n`

  ordens.forEach((ordem, index) => {
    const numero = index + 1
    const dataFormatada = new Date(ordem.data_atual).toLocaleDateString("pt-BR")
    const descricaoResumida =
      ordem.descricao_defeito && ordem.descricao_defeito.length > 50
        ? ordem.descricao_defeito.substring(0, 50) + "..."
        : ordem.descricao_defeito || "Sem descrição"

    mensagem += `*${numero}* - OS #${ordem.numero}\n`
    mensagem += `${statusMap[ordem.situacao] || ordem.situacao}\n`
    mensagem += `📅 ${dataFormatada}\n`
    mensagem += `🔧 ${tipoMap[ordem.tipo_servico] || ordem.tipo_servico}\n`

    if (ordem.data_agendamento) {
      const dataAgendamento = new Date(ordem.data_agendamento).toLocaleDateString("pt-BR")
      const periodo = periodoMap[ordem.periodo_agendamento] || ordem.periodo_agendamento
      mensagem += `📆 Agendado: ${dataAgendamento} - ${periodo}\n`
    }

    mensagem += `📝 ${descricaoResumida}\n\n`
  })

  mensagem += `Digite o *número* da ordem para ver detalhes completos.\n\n`
  mensagem += `💡 _Digite 'menu' para voltar ao início_`

  await updateConversationState(from, "consultar_os_selecionar", {
    ...data,
    ordensEncontradas: ordens,
    clienteConsulta: cliente,
  })

  await sendMessage(from, mensagem)
}

async function handleConsultarOSSelecionar(from: string, message: string, data: any) {
  const opcao = Number.parseInt(message.trim())
  const ordens = data.ordensEncontradas || []

  if (isNaN(opcao) || opcao < 1 || opcao > ordens.length) {
    await sendMessage(
      from,
      `❌ Opção inválida.\n\n` +
        `Digite um número entre 1 e ${ordens.length} para ver os detalhes da ordem.\n\n` +
        `💡 _Digite 'menu' para voltar ao início_`,
    )
    return
  }

  const ordemSelecionada = ordens[opcao - 1]

  console.log("[v0] 🔍 Buscando detalhes da ordem ID:", ordemSelecionada.id)
  const ordem = await findOrdemById(ordemSelecionada.id)

  if (!ordem) {
    await sendMessage(from, "❌ Erro ao buscar detalhes da ordem.\n\n" + "💡 _Digite 'menu' para voltar ao início_")
    return
  }

  // Mapear tipo de serviço
  const tipoMap: Record<string, string> = {
    manutencao: "Manutenção",
    orcamento: "Orçamento",
    vistoria_contrato: "Vistoria",
    preventiva: "Preventiva",
  }

  // Mapear situação
  const statusMap: Record<string, string> = {
    aberta: "🔴 Aberta",
    agendada: "📅 Agendada",
    em_andamento: "🟡 Em Andamento",
    concluida: "✅ Concluída",
    cancelada: "❌ Cancelada",
  }

  // Mapear período
  const periodoMap: Record<string, string> = {
    manha: "Manhã (08:00 - 12:00)",
    tarde: "Tarde (13:00 - 18:00)",
  }

  const dataFormatada = new Date(ordem.data_atual).toLocaleDateString("pt-BR")

  let mensagem =
    `📋 *Ordem de Serviço #${ordem.numero}*\n\n` +
    `${statusMap[ordem.situacao] || ordem.situacao}\n\n` +
    `👤 *Cliente:* ${ordem.cliente_nome}\n` +
    `📍 *Endereço:* ${ordem.cliente_endereco || "Não informado"}\n` +
    `📅 *Data:* ${dataFormatada}\n` +
    `🔧 *Tipo:* ${tipoMap[ordem.tipo_servico] || ordem.tipo_servico}\n`

  if (ordem.data_agendamento) {
    const dataAgendamento = new Date(ordem.data_agendamento).toLocaleDateString("pt-BR")
    const periodo = periodoMap[ordem.periodo_agendamento] || ordem.periodo_agendamento
    mensagem += `📆 *Agendamento:* ${dataAgendamento} - ${periodo}\n`
  }

  if (ordem.tecnico_name && ordem.tecnico_name !== "A definir") {
    mensagem += `👨‍🔧 *Técnico:* ${ordem.tecnico_name}\n`
  }

  if (ordem.solicitado_por) {
    mensagem += `✍️ *Solicitado por:* ${ordem.solicitado_por}\n`
  }

  mensagem += `\n📝 *Descrição:*\n${ordem.descricao_defeito || "Não informada"}\n`

  if (ordem.servico_realizado) {
    mensagem += `\n✨ *Serviço Realizado:*\n${ordem.servico_realizado}\n`
  }

  mensagem +=
    `\n\nDeseja fazer mais alguma coisa?\n\n` +
    `*1* - Criar nova OS\n` +
    `*2* - Consultar ordem aberta\n` +
    `*3* - Consultar ordem finalizada\n` +
    `*4* - Consultar ordem agendada\n` +
    `*5* - Sair\n\n` +
    `💡 _Digite 'menu' para voltar ao início_`

  await updateConversationState(from, "menu", data)
  await sendMessage(from, mensagem)
}

async function returnToMenu(from: string, data: any) {
  if (!data.clienteId) {
    await sendMessage(from, "❌ Erro: Cliente não identificado. Vou reiniciar a conversa.")
    await sendTipoClienteMenu(from)
    return
  }

  await updateConversationState(from, "menu", data)
  await sendMessage(
    from,
    `🏠 *Menu Principal*\n\n` +
      `Olá, ${data.clienteNome || ""}! 👋\n\n` +
      `Escolha uma opção:\n\n` +
      `*1* - Criar ordem de serviço\n` +
      `*2* - Consultar ordem aberta\n` +
      `*3* - Consultar ordem finalizada\n` +
      `*4* - Consultar ordem agendada\n` +
      `*5* - Sair\n\n` +
      `💡 _Digite 'menu' para voltar ao início_`,
  )
}

async function sendTipoClienteMenu(from: string) {
  await clearConversationState(from)
  await updateConversationState(from, "tipo_cliente", {})
  await sendMessage(
    from,
    "Para começarmos, preciso saber:\n\n" +
      "*1* - Já sou cliente\n" +
      "*2* - Primeiro contato\n\n" +
      "_Digite o número da opção desejada_\n\n" +
      "💡 _Digite 'menu' para voltar ao início_",
  )
}

async function sendMessage(to: string, message: string) {
  const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID
  const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN

  console.log("[v0] 📤 Tentando enviar mensagem...")
  console.log("[v0] 📱 Para:", to)
  console.log("[v0] 💬 Mensagem:", message.substring(0, 100) + "...")
  console.log("[v0] 🔑 PHONE_NUMBER_ID existe?", !!PHONE_NUMBER_ID)
  console.log("[v0] 🔐 ACCESS_TOKEN existe?", !!ACCESS_TOKEN)
  console.log("[v0] 🔐 ACCESS_TOKEN primeiros caracteres:", ACCESS_TOKEN?.substring(0, 20) + "...")

  if (!PHONE_NUMBER_ID || !ACCESS_TOKEN) {
    console.error("[v0] ❌ Credenciais do WhatsApp não configuradas")
    console.error("[v0] ❌ PHONE_NUMBER_ID:", PHONE_NUMBER_ID)
    console.error("[v0] ❌ ACCESS_TOKEN:", ACCESS_TOKEN ? "Existe mas pode estar vazio" : "Não existe")
    return
  }

  try {
    const url = `https://graph.facebook.com/v21.0/${PHONE_NUMBER_ID}/messages`
    console.log("[v0] 🌐 URL da API:", url)

    const payload = {
      messaging_product: "whatsapp",
      to: to,
      type: "text",
      text: { body: message },
    }
    console.log("[v0] 📦 Payload:", JSON.stringify(payload, null, 2))

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })

    console.log("[v0] 📊 Status da resposta:", response.status)
    const result = await response.json()
    console.log("[v0] 📋 Resposta completa:", JSON.stringify(result, null, 2))

    if (!response.ok) {
      if (result.error?.code === 190) {
        console.error("[v0] ❌ TOKEN EXPIRADO! O WHATSAPP_ACCESS_TOKEN precisa ser atualizado no Vercel.")
        console.error("[v0] ❌ Acesse: Meta Developers > Configuração da API > Gerar novo token")
      }
      console.error("[v0] ❌ Erro ao enviar mensagem:", result)
      console.error("[v0] ❌ Código do erro:", result.error?.code)
      console.error("[v0] ❌ Mensagem do erro:", result.error?.message)
    } else {
      console.log("[v0] ✅ Mensagem enviada com sucesso")
      console.log("[v0] ✅ Message ID:", result.messages?.[0]?.id)
    }

    return result
  } catch (error) {
    console.error("[v0] ❌ Exceção ao enviar mensagem:", error)
    console.error("[v0] ❌ Stack trace:", error instanceof Error ? error.stack : "N/A")
    throw error
  }
}

async function handleConsultarPorSituacao(from: string, data: any, situacao: string) {
  if (!data.clienteId) {
    await sendMessage(from, "❌ Erro: Cliente não identificado. Vou reiniciar a conversa.")
    await sendTipoClienteMenu(from)
    return
  }

  console.log("[v0] 🔍 Buscando ordens com situação:", situacao, "para cliente:", data.clienteId)
  const ordens = await findOrdensBySituacao(data.clienteId, situacao)

  const situacaoLabel: Record<string, string> = {
    aberta: "Abertas",
    concluida: "Finalizadas",
    agendada: "Agendadas",
  }

  const situacaoEmoji: Record<string, string> = {
    aberta: "🔴",
    concluida: "✅",
    agendada: "📅",
  }

  if (ordens.length === 0) {
    await updateConversationState(from, "menu", data)
    await sendMessage(
      from,
      `ℹ️ *Nenhuma ordem ${situacaoLabel[situacao].toLowerCase()} encontrada*\n\n` +
        `Não há ordens de serviço ${situacaoLabel[situacao].toLowerCase()} para *${data.clienteNome}*.\n\n` +
        `Deseja fazer mais alguma coisa?\n\n` +
        `*1* - Criar ordem de serviço\n` +
        `*2* - Consultar ordem aberta\n` +
        `*3* - Consultar ordem finalizada\n` +
        `*4* - Consultar ordem agendada\n` +
        `*5* - Sair\n\n` +
        `💡 _Digite 'menu' para voltar ao início_`,
    )
    return
  }

  // Mapear tipo de serviço
  const tipoMap: Record<string, string> = {
    manutencao: "Manutenção",
    orcamento: "Orçamento",
    vistoria_contrato: "Vistoria",
    preventiva: "Preventiva",
  }

  // Mapear período
  const periodoMap: Record<string, string> = {
    manha: "Manhã",
    tarde: "Tarde",
  }

  // Montar lista de ordens
  let mensagem = `${situacaoEmoji[situacao]} *Ordens ${situacaoLabel[situacao]} - ${data.clienteNome}*\n\n`

  ordens.forEach((ordem, index) => {
    const numero = index + 1
    const dataFormatada = new Date(ordem.data_atual).toLocaleDateString("pt-BR")
    const descricaoResumida =
      ordem.descricao_defeito && ordem.descricao_defeito.length > 50
        ? ordem.descricao_defeito.substring(0, 50) + "..."
        : ordem.descricao_defeito || "Sem descrição"

    mensagem += `*${numero}* - OS #${ordem.numero}\n`
    mensagem += `📅 ${dataFormatada}\n`
    mensagem += `🔧 ${tipoMap[ordem.tipo_servico] || ordem.tipo_servico}\n`

    if (ordem.data_agendamento) {
      const dataAgendamento = new Date(ordem.data_agendamento).toLocaleDateString("pt-BR")
      const periodo = periodoMap[ordem.periodo_agendamento] || ordem.periodo_agendamento
      mensagem += `📆 Agendado: ${dataAgendamento} - ${periodo}\n`
    }

    mensagem += `📝 ${descricaoResumida}\n\n`
  })

  mensagem += `Digite o *número* da ordem para ver detalhes completos.\n\n`
  mensagem += `💡 _Digite 'menu' para voltar ao início_`

  await updateConversationState(from, "consultar_os_selecionar", {
    ...data,
    ordensEncontradas: ordens,
    situacaoConsulta: situacao,
  })

  await sendMessage(from, mensagem)
}

// Nova função para lidar com a confirmação do agendamento
async function handleConfirmarAgendamento(from: string, message: string, data: any) {
  const opcao = message.trim()

  if (opcao === "1") {
    // Confirmar agendamento sugerido - agora pedir nome do contato
    await updateConversationState(from, "criar_os_contato_nome", data)
    await sendMessage(
      from,
      `✅ *Agendamento Confirmado*\n\n` +
        `📅 Data: ${data.dataAgendamentoFormatada}\n` +
        `🕐 Período: ${data.periodoAgendamentoLabel}\n\n` +
        `Agora, qual é o *seu nome*?\n` +
        `(Pessoa que está solicitando o serviço)\n\n` +
        `Exemplo: _Maria Santos_\n\n` +
        `💡 _Digite 'menu' para voltar ao início_`,
    )
  } else if (opcao === "2") {
    // Usuário quer escolher outra data manualmente
    await updateConversationState(from, "criar_os_data_agendamento", {
      ...data,
      dataAgendamento: undefined,
      dataAgendamentoFormatada: undefined,
      periodoAgendamento: undefined,
      periodoAgendamentoLabel: undefined,
    })
    await sendMessage(
      from,
      `📅 *Escolher Outra Data*\n\n` +
        "Digite a data desejada para o atendimento:\n\n" +
        "📋 Formato: DD/MM/AAAA\n" +
        "Exemplo: _15/01/2025_\n\n" +
        "⚠️ Apenas dias úteis (segunda a sexta)\n\n" +
        "💡 _Digite 'menu' para voltar ao início_",
    )
  } else {
    await sendMessage(
      from,
      "❌ Opção inválida.\n\n" +
        "Digite:\n" +
        "*1* - Sim, confirmar\n" +
        "*2* - Não, escolher outra data\n\n" +
        "💡 _Digite 'menu' para voltar ao início_",
    )
  }
}

async function handleCriarOSContatoNome(from: string, message: string, data: any) {
  const contatoNome = message.trim().toUpperCase()

  if (!contatoNome || contatoNome.length < 3) {
    await sendMessage(
      from,
      "❌ Por favor, digite um nome válido com pelo menos 3 caracteres.\n\n" +
        "💡 _Digite 'menu' para voltar ao início_",
    )
    return
  }

  // Atualizar campo contato na tabela clientes
  try {
    console.log("[v0] 📝 Atualizando campo contato do cliente ID:", data.clienteId)
    await query("UPDATE clientes SET contato = ? WHERE id = ?", [contatoNome, data.clienteId])
    console.log("[v0] ✅ Campo contato atualizado com sucesso")
  } catch (error) {
    console.error("[v0] ❌ Erro ao atualizar contato:", error)
  }

  await updateConversationState(from, "criar_os_contato_telefone", {
    ...data,
    contatoNome,
  })

  await sendMessage(
    from,
    `✅ Nome registrado: *${contatoNome}*\n\n` +
      `Agora, qual é o *seu telefone*?\n\n` +
      `Exemplo: _(11) 99999-9999_\n\n` +
      `💡 _Digite 'menu' para voltar ao início_`,
  )
}

async function handleCriarOSContatoTelefone(from: string, message: string, data: any) {
  const contatoTelefone = message.trim()

  if (!contatoTelefone) {
    await sendMessage(from, "❌ Por favor, digite um telefone válido.\n\n" + "💡 _Digite 'menu' para voltar ao início_")
    return
  }

  // Atualizar campo telefone na tabela clientes
  try {
    console.log("[v0] 📝 Atualizando campo telefone do cliente ID:", data.clienteId)
    await query("UPDATE clientes SET telefone = ? WHERE id = ?", [contatoTelefone, data.clienteId])
    console.log("[v0] ✅ Campo telefone atualizado com sucesso")
  } catch (error) {
    console.error("[v0] ❌ Erro ao atualizar telefone:", error)
  }

  await updateConversationState(from, "create_order_desc", {
    ...data,
    contatoTelefone,
    solicitanteOS: data.contatoNome, // Usar o nome do contato como solicitante
  })

  await sendMessage(
    from,
    `✅ Telefone registrado: *${contatoTelefone}*\n\n` +
      `Agora, descreva o problema ou serviço necessário:\n\n` +
      `Exemplo: _Verificar câmeras do hall do bloco A_\n\n` +
      `💡 _Digite 'menu' para voltar ao início_`,
  )
}
