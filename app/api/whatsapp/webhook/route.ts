import { type NextRequest, NextResponse } from "next/server"
import { pool } from "@/lib/db"

// Verificação do webhook (Meta exige isso na configuração inicial)
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const mode = searchParams.get("hub.mode")
  const token = searchParams.get("hub.verify_token")
  const challenge = searchParams.get("hub.challenge")

  console.log("[v0] GET Webhook - mode:", mode, "token:", token, "challenge:", challenge)

  // Token de verificação (configure nas variáveis de ambiente)
  const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || "seu_token_secreto"

  console.log("[v0] VERIFY_TOKEN configurado:", VERIFY_TOKEN ? "Sim" : "Não")

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("[v0] Webhook verificado com sucesso")
    return new NextResponse(challenge, { status: 200 })
  }

  console.log("[v0] Verificação falhou - mode ou token incorretos")
  return NextResponse.json({ error: "Verificação falhou" }, { status: 403 })
}

// Receber mensagens do WhatsApp
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log("[v0] ===== WEBHOOK POST RECEBIDO =====")
    console.log("[v0] Body completo:", JSON.stringify(body, null, 2))

    console.log(
      "[v0] WHATSAPP_PHONE_NUMBER_ID:",
      process.env.WHATSAPP_PHONE_NUMBER_ID ? "Configurado" : "NÃO CONFIGURADO",
    )
    console.log("[v0] WHATSAPP_ACCESS_TOKEN:", process.env.WHATSAPP_ACCESS_TOKEN ? "Configurado" : "NÃO CONFIGURADO")

    // Extrair dados da mensagem
    const entry = body.entry?.[0]
    const changes = entry?.changes?.[0]
    const value = changes?.value
    const messages = value?.messages?.[0]

    console.log("[v0] Entry:", entry ? "Existe" : "Não existe")
    console.log("[v0] Changes:", changes ? "Existe" : "Não existe")
    console.log("[v0] Value:", value ? "Existe" : "Não existe")
    console.log("[v0] Messages:", messages ? "Existe" : "Não existe")

    if (!messages) {
      console.log("[v0] Nenhuma mensagem encontrada no payload")
      return NextResponse.json({ status: "ok" })
    }

    const from = messages.from // Número do cliente
    const messageBody = messages.text?.body || ""
    const messageType = messages.type

    console.log("[v0] ===== MENSAGEM RECEBIDA =====")
    console.log("[v0] De:", from)
    console.log("[v0] Tipo:", messageType)
    console.log("[v0] Texto:", messageBody)

    // Processar a mensagem
    await processWhatsAppMessage(from, messageBody, messageType, messages)

    return NextResponse.json({ status: "ok" })
  } catch (error) {
    console.error("[v0] ===== ERRO NO WEBHOOK =====")
    console.error("[v0] Erro:", error)
    console.error("[v0] Stack:", error instanceof Error ? error.stack : "N/A")
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}

async function processWhatsAppMessage(phoneNumber: string, message: string, messageType: string, fullMessage: any) {
  const connection = await pool.getConnection()

  try {
    // Buscar ou criar conversa
    const [conversations] = await connection.execute(
      "SELECT * FROM whatsapp_conversations WHERE phone_number = ? AND status = ?",
      [phoneNumber, "active"],
    )

    let conversation: any
    let currentStep = "inicio"

    if (Array.isArray(conversations) && conversations.length > 0) {
      conversation = conversations[0]
      currentStep = conversation.current_step
    } else {
      // Criar nova conversa
      await connection.execute(
        `INSERT INTO whatsapp_conversations 
        (phone_number, current_step, status, created_at) 
        VALUES (?, ?, ?, NOW())`,
        [phoneNumber, "inicio", "active"],
      )
      const [newConv] = await connection.execute(
        "SELECT * FROM whatsapp_conversations WHERE phone_number = ? AND status = ?",
        [phoneNumber, "active"],
      )
      conversation = Array.isArray(newConv) ? newConv[0] : null
    }

    // Processar baseado no passo atual
    await handleConversationStep(connection, conversation, phoneNumber, message, currentStep, messageType, fullMessage)
  } finally {
    await connection.release()
  }
}

async function handleConversationStep(
  connection: any,
  conversation: any,
  phoneNumber: string,
  message: string,
  currentStep: string,
  messageType: string,
  fullMessage: any,
) {
  const conversationData = conversation?.data ? JSON.parse(conversation.data) : {}

  switch (currentStep) {
    case "inicio":
      await sendWhatsAppMessage(phoneNumber, {
        type: "interactive",
        interactive: {
          type: "button",
          body: {
            text: "👋 Olá! Bem-vindo ao sistema de ordens de serviço.\n\nO que você gostaria de fazer?",
          },
          action: {
            buttons: [
              {
                type: "reply",
                reply: {
                  id: "criar_os",
                  title: "🔧 Criar OS",
                },
              },
              {
                type: "reply",
                reply: {
                  id: "acompanhar_os",
                  title: "📋 Acompanhar OS",
                },
              },
            ],
          },
        },
      })
      await updateConversationStep(connection, phoneNumber, "menu_principal", conversationData)
      break

    case "menu_principal":
      if (message === "criar_os" || message.toLowerCase().includes("criar")) {
        await sendWhatsAppMessage(phoneNumber, {
          type: "text",
          text: { body: "📝 Vamos criar uma ordem de serviço!\n\nPor favor, informe seu nome completo:" },
        })
        await updateConversationStep(connection, phoneNumber, "aguardando_nome", conversationData)
      } else if (message === "acompanhar_os" || message.toLowerCase().includes("acompanhar")) {
        await sendWhatsAppMessage(phoneNumber, {
          type: "text",
          text: { body: "🔍 Para acompanhar sua OS, informe o número da ordem de serviço:" },
        })
        await updateConversationStep(connection, phoneNumber, "aguardando_numero_os", conversationData)
      }
      break

    case "aguardando_nome":
      conversationData.nome_cliente = message
      await sendWhatsAppMessage(phoneNumber, {
        type: "text",
        text: { body: `Obrigado, ${message}! 📍\n\nAgora, informe o endereço completo onde o serviço será realizado:` },
      })
      await updateConversationStep(connection, phoneNumber, "aguardando_endereco", conversationData)
      break

    case "aguardando_endereco":
      conversationData.endereco = message
      await sendWhatsAppMessage(phoneNumber, {
        type: "interactive",
        interactive: {
          type: "list",
          body: {
            text: "🔧 Qual o tipo de serviço necessário?",
          },
          action: {
            button: "Selecionar",
            sections: [
              {
                title: "Tipos de Serviço",
                rows: [
                  { id: "manutencao", title: "Manutenção", description: "Reparo ou manutenção" },
                  { id: "orcamento", title: "Orçamento", description: "Solicitar orçamento" },
                  { id: "vistoria_contrato", title: "Vistoria", description: "Vistoria para contrato" },
                  { id: "preventiva", title: "Preventiva", description: "Manutenção preventiva" },
                ],
              },
            ],
          },
        },
      })
      await updateConversationStep(connection, phoneNumber, "aguardando_tipo_servico", conversationData)
      break

    case "aguardando_tipo_servico":
      conversationData.tipo_servico = message
      await sendWhatsAppMessage(phoneNumber, {
        type: "text",
        text: { body: "📝 Descreva o problema ou necessidade:\n\n(Seja o mais detalhado possível)" },
      })
      await updateConversationStep(connection, phoneNumber, "aguardando_descricao", conversationData)
      break

    case "aguardando_descricao":
      conversationData.descricao = message
      await sendWhatsAppMessage(phoneNumber, {
        type: "interactive",
        interactive: {
          type: "button",
          body: {
            text: "📸 Deseja enviar fotos do problema?\n\n(Isso ajuda nossos técnicos a entenderem melhor)",
          },
          action: {
            buttons: [
              {
                type: "reply",
                reply: {
                  id: "sim_foto",
                  title: "Sim, enviar foto",
                },
              },
              {
                type: "reply",
                reply: {
                  id: "nao_foto",
                  title: "Não, continuar",
                },
              },
            ],
          },
        },
      })
      await updateConversationStep(connection, phoneNumber, "aguardando_decisao_foto", conversationData)
      break

    case "aguardando_decisao_foto":
      if (message === "sim_foto" || message.toLowerCase().includes("sim")) {
        await sendWhatsAppMessage(phoneNumber, {
          type: "text",
          text: { body: "📸 Por favor, envie a(s) foto(s) do problema." },
        })
        await updateConversationStep(connection, phoneNumber, "aguardando_foto", conversationData)
      } else {
        await criarOrdemServico(connection, phoneNumber, conversationData)
      }
      break

    case "aguardando_foto":
      if (messageType === "image") {
        const imageId = fullMessage.image?.id
        if (imageId) {
          if (!conversationData.fotos) conversationData.fotos = []
          conversationData.fotos.push(imageId)
          await updateConversationStep(connection, phoneNumber, "aguardando_foto", conversationData)

          await sendWhatsAppMessage(phoneNumber, {
            type: "interactive",
            interactive: {
              type: "button",
              body: {
                text: "✅ Foto recebida!\n\nDeseja enviar mais fotos?",
              },
              action: {
                buttons: [
                  {
                    type: "reply",
                    reply: {
                      id: "mais_fotos",
                      title: "Enviar mais",
                    },
                  },
                  {
                    type: "reply",
                    reply: {
                      id: "finalizar",
                      title: "Finalizar",
                    },
                  },
                ],
              },
            },
          })
        }
      } else if (message === "finalizar" || message.toLowerCase().includes("finalizar")) {
        await criarOrdemServico(connection, phoneNumber, conversationData)
      }
      break

    case "aguardando_numero_os":
      // Buscar OS pelo número
      const [ordens] = await connection.execute("SELECT * FROM orders_servico WHERE numero = ?", [message])

      if (Array.isArray(ordens) && ordens.length > 0) {
        const ordem = ordens[0]
        const situacaoEmoji = {
          aberta: "🆕",
          em_andamento: "⚙️",
          concluida: "✅",
          cancelada: "❌",
        }

        await sendWhatsAppMessage(phoneNumber, {
          type: "text",
          text: {
            body:
              `📋 *Ordem de Serviço #${ordem.numero}*\n\n` +
              `${situacaoEmoji[ordem.situacao] || "📌"} Status: ${ordem.situacao}\n` +
              `📅 Data: ${new Date(ordem.data_atual).toLocaleDateString("pt-BR")}\n` +
              `🔧 Tipo: ${ordem.tipo_servico}\n` +
              `👤 Técnico: ${ordem.tecnico_name || "Não atribuído"}\n\n` +
              `Você receberá atualizações quando houver mudanças no status.`,
          },
        })
      } else {
        await sendWhatsAppMessage(phoneNumber, {
          type: "text",
          text: { body: "❌ Ordem de serviço não encontrada.\n\nVerifique o número e tente novamente." },
        })
      }

      await updateConversationStep(connection, phoneNumber, "inicio", {})
      break
  }
}

async function criarOrdemServico(connection: any, phoneNumber: string, data: any) {
  try {
    // Buscar próximo número de OS
    const [result] = await connection.execute("SELECT MAX(CAST(numero AS UNSIGNED)) as max_numero FROM orders_servico")
    const maxNumero = Array.isArray(result) && result[0]?.max_numero ? result[0].max_numero : 0
    const novoNumero = String(maxNumero + 1).padStart(6, "0")

    // Criar ordem de serviço
    await connection.execute(
      `INSERT INTO orders_servico 
      (numero, cliente_id, solicitado_por, data_atual, tipo_servico, 
       descricao_defeito, observacoes, situacao, created_at) 
      VALUES (?, NULL, ?, CURDATE(), ?, ?, ?, ?, NOW())`,
      [
        novoNumero,
        `${data.nome_cliente} (WhatsApp: ${phoneNumber})`,
        data.tipo_servico || "manutencao",
        data.descricao || "",
        `Endereço: ${data.endereco}\nContato: ${phoneNumber}`,
        "aberta",
      ],
    )

    await sendWhatsAppMessage(phoneNumber, {
      type: "text",
      text: {
        body:
          `✅ *Ordem de Serviço Criada com Sucesso!*\n\n` +
          `📋 Número da OS: *${novoNumero}*\n` +
          `👤 Nome: ${data.nome_cliente}\n` +
          `📍 Endereço: ${data.endereco}\n` +
          `🔧 Tipo: ${data.tipo_servico}\n\n` +
          `Em breve um técnico entrará em contato.\n` +
          `Guarde o número da OS para acompanhamento!`,
      },
    })

    // Finalizar conversa
    await connection.execute(
      "UPDATE whatsapp_conversations SET status = ?, updated_at = NOW() WHERE phone_number = ? AND status = ?",
      ["completed", phoneNumber, "active"],
    )
  } catch (error) {
    console.error("[v0] Erro ao criar OS:", error)
    await sendWhatsAppMessage(phoneNumber, {
      type: "text",
      text: { body: "❌ Erro ao criar ordem de serviço. Por favor, tente novamente mais tarde." },
    })
  }
}

async function updateConversationStep(connection: any, phoneNumber: string, newStep: string, data: any) {
  await connection.execute(
    "UPDATE whatsapp_conversations SET current_step = ?, data = ?, updated_at = NOW() WHERE phone_number = ? AND status = ?",
    [newStep, JSON.stringify(data), phoneNumber, "active"],
  )
}

async function sendWhatsAppMessage(to: string, message: any) {
  const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID
  const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN

  console.log("[v0] ===== TENTANDO ENVIAR MENSAGEM =====")
  console.log("[v0] Para:", to)
  console.log("[v0] PHONE_NUMBER_ID:", PHONE_NUMBER_ID)
  console.log("[v0] ACCESS_TOKEN:", ACCESS_TOKEN ? `${ACCESS_TOKEN.substring(0, 20)}...` : "NÃO CONFIGURADO")

  if (!PHONE_NUMBER_ID || !ACCESS_TOKEN) {
    console.error("[v0] ❌ Credenciais do WhatsApp não configuradas")
    console.error("[v0] PHONE_NUMBER_ID existe?", !!PHONE_NUMBER_ID)
    console.error("[v0] ACCESS_TOKEN existe?", !!ACCESS_TOKEN)
    return
  }

  try {
    const url = `https://graph.facebook.com/v21.0/${PHONE_NUMBER_ID}/messages`
    const payload = {
      messaging_product: "whatsapp",
      to,
      ...message,
    }

    console.log("[v0] URL:", url)
    console.log("[v0] Payload:", JSON.stringify(payload, null, 2))

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })

    const result = await response.json()
    console.log("[v0] Status da resposta:", response.status)
    console.log("[v0] Resposta completa:", JSON.stringify(result, null, 2))

    if (!response.ok) {
      console.error("[v0] ❌ Erro na API do WhatsApp:", result)
    } else {
      console.log("[v0] ✅ Mensagem enviada com sucesso!")
    }

    return result
  } catch (error) {
    console.error("[v0] ❌ Erro ao enviar mensagem:", error)
    console.error("[v0] Stack:", error instanceof Error ? error.stack : "N/A")
  }
}
