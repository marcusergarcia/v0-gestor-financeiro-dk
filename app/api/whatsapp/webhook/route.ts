import { type NextRequest, NextResponse } from "next/server"
import {
  getConversationState,
  updateConversationState,
  clearConversationState,
  findClientByPhone,
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
    const currentStage = state?.stage || ConversationStage.MENU

    console.log("[v0] 📊 Estado atual:", currentStage)
    console.log("[v0] 📦 Dados salvos:", state?.data)

    // Processar baseado no estágio
    switch (currentStage) {
      case ConversationStage.MENU:
        await handleMenuOption(from, messageBody)
        break

      case ConversationStage.CREATE_ORDER_DESC:
        await handleOrderDescription(from, messageBody)
        break

      case ConversationStage.QUERY_ORDER:
        await handleQueryOrder(from, messageBody)
        break

      case ConversationStage.WAIT_AGENT:
        await sendMessage(from, "⏳ Você já está na fila de atendimento. Um agente responderá em breve!")
        break

      default:
        await sendMainMenu(from)
    }
  } catch (error) {
    console.error("[v0] ❌ Erro ao processar mensagem:", error)
    await sendMessage(from, "❌ Desculpe, ocorreu um erro. Por favor, tente novamente.")
    await clearConversationState(from)
  }
}

async function handleMenuOption(from: string, option: string) {
  switch (option) {
    case "1":
      // Criar nova ordem de serviço
      await updateConversationState(from, ConversationStage.CREATE_ORDER_DESC)
      await sendMessage(
        from,
        "📝 *Criar Nova Ordem de Serviço*\n\n" +
          "Por favor, descreva o problema ou serviço necessário:\n\n" +
          "Exemplo: _Verificar câmeras do hall do bloco A_",
      )
      break

    case "2":
      await updateConversationState(from, ConversationStage.QUERY_ORDER)
      await sendMessage(
        from,
        "🔍 *Consultar Ordem de Serviço*\n\n" + "Digite o número da ordem de serviço que deseja consultar:",
      )
      break

    case "3":
      // Falar com atendente
      const cliente = await findClientByPhone(from)
      await saveAtendimentoRequest(from, cliente?.id)
      await updateConversationState(from, ConversationStage.WAIT_AGENT)
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
      await sendMainMenu(from)
  }
}

async function handleOrderDescription(from: string, description: string) {
  try {
    // Buscar cliente pelo telefone
    const cliente = await findClientByPhone(from)

    if (!cliente) {
      await sendMessage(
        from,
        "❌ *Cliente não encontrado*\n\n" +
          "Seu número de telefone não está cadastrado no nosso sistema.\n\n" +
          "Por favor, entre em contato conosco para cadastro:\n" +
          "📞 (11) 1234-5678",
      )
      await clearConversationState(from)
      return
    }

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
        "_Digite qualquer mensagem para voltar ao menu principal_",
    )

    // Limpar estado da conversa
    await clearConversationState(from)
  } catch (error) {
    console.error("[v0] ❌ Erro ao criar ordem:", error)
    await sendMessage(from, "❌ Erro ao criar ordem de serviço. Por favor, tente novamente mais tarde.")
    await clearConversationState(from)
  }
}

async function handleQueryOrder(from: string, orderId: string) {
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
          "Verifique o número e tente novamente ou digite *0* para voltar ao menu.",
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
      "_Digite qualquer mensagem para voltar ao menu principal_"

    await sendMessage(from, message)
    await clearConversationState(from)
  } catch (error) {
    console.error("[v0] ❌ Erro ao consultar ordem:", error)
    await sendMessage(from, "❌ Erro ao consultar ordem. Por favor, tente novamente.")
    await clearConversationState(from)
  }
}

async function sendMainMenu(from: string) {
  await clearConversationState(from)
  await sendMessage(
    from,
    "👋 *Bem-vindo ao Gestor Financeiro!*\n\n" +
      "Como posso ajudar?\n\n" +
      "1️⃣ Criar nova ordem de serviço\n" +
      "2️⃣ Consultar ordem de serviço\n" +
      "3️⃣ Falar com atendente\n\n" +
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
