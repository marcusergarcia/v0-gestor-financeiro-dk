import { NextResponse } from "next/server"
import { pool } from "@/lib/database"
import { generateId } from "@/lib/generate-id"

export async function GET() {
  try {
    const [propostasRows] = await pool.execute(
      `
      SELECT 
        pc.*,
        cl.nome as cliente_nome,
        cl.codigo as cliente_codigo,
        cl.email as cliente_email,
        cl.telefone as cliente_telefone,
        cl.endereco as cliente_endereco,
        cl.distancia_km,
        DATE_FORMAT(pc.data_proposta, '%Y-%m-%d') as data_proposta,
        DATE_FORMAT(pc.data_validade, '%Y-%m-%d') as data_validade
      FROM proposta_contratos pc
      LEFT JOIN clientes cl ON pc.cliente_id = cl.id
      ORDER BY pc.created_at DESC
      `,
    )

    const propostas = Array.isArray(propostasRows) ? propostasRows : []

    // Calcular estatísticas
    const stats = {
      total: propostas.length,
      rascunho: propostas.filter((p: any) => p.status === "rascunho").length,
      enviada: propostas.filter((p: any) => p.status === "enviada").length,
      aprovada: propostas.filter((p: any) => p.status === "aprovada").length,
      rejeitada: propostas.filter((p: any) => p.status === "rejeitada").length,
      valor_total: propostas.reduce((acc: number, p: any) => {
        const valor = Number.parseFloat(p.valor_total_proposta) || 0
        return acc + valor
      }, 0),
    }

    return NextResponse.json({
      success: true,
      data: propostas,
      stats,
    })
  } catch (error) {
    console.error("Erro ao buscar propostas:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Erro interno do servidor",
        error: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 },
    )
  }
}

async function getProximoNumero(connection: any): Promise<string> {
  try {
    // Obter a data atual no formato YYYYMMDD
    const hoje = new Date()
    const ano = hoje.getFullYear()
    const mes = String(hoje.getMonth() + 1).padStart(2, "0")
    const dia = String(hoje.getDate()).padStart(2, "0")
    const dataFormatada = `${ano}${mes}${dia}`

    // Buscar o último número do dia
    const [rows] = await connection.execute(
      `
      SELECT numero 
      FROM proposta_contratos 
      WHERE numero LIKE ?
      ORDER BY numero DESC 
      LIMIT 1
      `,
      [`${dataFormatada}%`],
    )

    let proximoSequencial = 1

    if (Array.isArray(rows) && rows.length > 0) {
      const ultimoNumero = (rows[0] as any).numero
      // Extrair os últimos 3 dígitos
      const ultimoSequencial = Number.parseInt(ultimoNumero.slice(-3), 10)
      proximoSequencial = ultimoSequencial + 1
    }

    // Formatar o número completo: YYYYMMDDXXX
    const numeroCompleto = `${dataFormatada}${String(proximoSequencial).padStart(3, "0")}`

    return numeroCompleto
  } catch (error) {
    console.error("Erro ao gerar próximo número:", error)
    throw error
  }
}

export async function POST(request: Request) {
  let connection

  try {
    console.log("=== CRIANDO PROPOSTA ===")
    console.log("Ambiente:", process.env.NODE_ENV)

    const data = await request.json()
    console.log("Dados recebidos:", JSON.stringify(data, null, 2))

    connection = await pool.getConnection()
    console.log("Conexão obtida com sucesso")

    try {
      await connection.beginTransaction()
      console.log("Transação iniciada")

      // Buscar próximo número DIRETAMENTE do banco, sem fetch
      const numeroCompleto = await getProximoNumero(connection)
      console.log("Próximo número da proposta:", numeroCompleto)

      // Gerar ID único para a proposta
      const propostaId = generateId()
      console.log("ID da proposta gerado:", propostaId)

      // Inserir proposta principal
      console.log("Inserindo proposta principal...")
      await connection.execute(
        `
        INSERT INTO proposta_contratos (
          id, numero, cliente_id, tipo, frequencia, valor_equipamentos, valor_desconto,
          valor_deslocamento, desconto_quant_visitas, valor_total_proposta, forma_pagamento,
          prazo_contrato, garantia, observacoes, equipamentos_consignacao, status, data_proposta, data_validade,
          quantidade_visitas
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          propostaId,
          numeroCompleto,
          data.cliente_id,
          data.tipo || "conservacao",
          data.frequencia || "mensal",
          data.valor_equipamentos || 0,
          data.valor_desconto || 0,
          data.valor_deslocamento || 0,
          data.desconto_quant_visitas || data.valor_visitas || 0,
          data.valor_total_proposta || 0,
          data.forma_pagamento || "mensal",
          data.prazo_contrato || 12,
          data.garantia || 90,
          data.observacoes || "",
          data.equipamentos_consignacao || "",
          data.status || "rascunho",
          new Date().toISOString().split("T")[0],
          data.data_validade || null,
          data.quantidade_visitas || data.visita_id || 1,
        ],
      )

      console.log("Proposta principal inserida:", numeroCompleto)

      // Inserir itens da proposta se existirem
      if (data.itens && Array.isArray(data.itens) && data.itens.length > 0) {
        console.log(`Inserindo ${data.itens.length} itens...`)
        for (const item of data.itens) {
          const itemId = generateId()
          await connection.execute(
            `
            INSERT INTO proposta_itens (
              id, proposta_id, equipamento_id, categoria, quantidade, valor_unitario,
              valor_desconto_individual, valor_desconto_categoria, valor_total
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `,
            [
              itemId,
              numeroCompleto,
              item.equipamento_id,
              item.categoria,
              item.quantidade,
              item.valor_unitario,
              item.valor_desconto_individual || 0,
              item.valor_desconto_categoria || 0,
              item.valor_total,
            ],
          )
        }
        console.log(`${data.itens.length} itens inseridos com sucesso`)
      }

      await connection.commit()
      console.log("Transação concluída com sucesso")

      return NextResponse.json({
        success: true,
        message: "Proposta criada com sucesso",
        data: {
          id: propostaId,
          numero: numeroCompleto,
        },
      })
    } catch (error) {
      await connection.rollback()
      console.error("Erro na transação - rollback executado:", error)
      throw error
    }
  } catch (error) {
    console.error("=== ERRO AO CRIAR PROPOSTA ===")
    console.error("Tipo do erro:", error instanceof Error ? error.constructor.name : typeof error)
    console.error("Mensagem:", error instanceof Error ? error.message : String(error))
    console.error("Stack:", error instanceof Error ? error.stack : "N/A")

    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido"
    return NextResponse.json(
      {
        success: false,
        message: "Erro ao criar proposta",
        error: errorMessage,
        details: process.env.NODE_ENV === "development" ? String(error) : undefined,
      },
      { status: 500 },
    )
  } finally {
    if (connection) {
      connection.release()
      console.log("Conexão liberada")
    }
  }
}
