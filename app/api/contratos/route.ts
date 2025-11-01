import { NextResponse } from "next/server"
import { pool } from "@/lib/database"

export async function GET() {
  try {
    const [rows] = await pool.execute(`
      SELECT 
        cc.*,
        cl.nome as cliente_nome,
        cl.codigo as cliente_codigo,
        cl.email as cliente_email,
        cl.telefone as cliente_telefone,
        cl.endereco as cliente_endereco,
        DATE_FORMAT(cc.data_inicio, '%Y-%m-%d') as data_inicio,
        DATE_FORMAT(cc.data_fim, '%Y-%m-%d') as data_fim,
        DATE_FORMAT(cc.data_proposta, '%Y-%m-%d') as data_proposta
      FROM contratos_conservacao cc
      LEFT JOIN clientes cl ON cc.cliente_id = cl.id
      ORDER BY cc.created_at DESC
    `)

    const contratos = Array.isArray(rows) ? rows : []

    // Calcular estatísticas
    const stats = {
      total: contratos.length,
      ativos: contratos.filter((c: any) => c.status === "ativo").length,
      suspensos: contratos.filter((c: any) => c.status === "suspenso").length,
      cancelados: contratos.filter((c: any) => c.status === "cancelado").length,
      valor_total: contratos.reduce((acc: number, c: any) => {
        const valor = Number.parseFloat(c.valor_mensal) || 0
        return acc + valor
      }, 0),
    }

    return NextResponse.json({
      success: true,
      data: contratos,
      stats,
    })
  } catch (error) {
    console.error("Erro ao buscar contratos:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Erro interno do servidor",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json()
    console.log("=== CRIANDO CONTRATO ===")
    console.log("Dados recebidos:", JSON.stringify(data, null, 2))

    const connection = await pool.getConnection()

    try {
      await connection.beginTransaction()

      // Verificar se já existe um contrato com este número
      const [existingContract] = await connection.execute("SELECT numero FROM contratos_conservacao WHERE numero = ?", [
        data.numero,
      ])

      if (Array.isArray(existingContract) && existingContract.length > 0) {
        await connection.rollback()
        return NextResponse.json(
          {
            success: false,
            message: "Já existe um contrato com este número",
          },
          { status: 400 },
        )
      }

      // Identificar o proposta_id correto
      const propostaId = data.proposta_id || data.proposta_numero || data.numero

      // Buscar dados da proposta - INCLUINDO equipamentos_consignacao
      let propostaData = null
      let equipamentosInclusos = []
      let equipamentosConsignacao = ""

      if (propostaId) {
        console.log("Buscando dados da proposta:", propostaId)

        const [propostaRows] = await connection.execute(
          `SELECT 
            numero, valor_total_proposta, prazo_contrato, quantidade_visitas, cliente_id,
            equipamentos_consignacao
           FROM proposta_contratos 
           WHERE numero = ?`,
          [propostaId],
        )

        if (Array.isArray(propostaRows) && propostaRows.length > 0) {
          propostaData = propostaRows[0] as any
          equipamentosConsignacao = propostaData.equipamentos_consignacao || ""
          console.log("Dados da proposta encontrados:", JSON.stringify(propostaData, null, 2))
          console.log("Equipamentos em consignação da proposta:", equipamentosConsignacao)

          // Buscar equipamentos da proposta
          const [equipamentosRows] = await connection.execute(
            `SELECT 
              pi.equipamento_id as id,
              e.nome,
              pi.quantidade,
              pi.valor_unitario,
              pi.valor_total
             FROM proposta_itens pi
             LEFT JOIN equipamentos e ON pi.equipamento_id = e.id
             WHERE pi.proposta_id = ?`,
            [propostaId],
          )

          if (Array.isArray(equipamentosRows) && equipamentosRows.length > 0) {
            equipamentosInclusos = equipamentosRows.map((item: any) => ({
              id: item.id,
              nome: item.nome,
              quantidade: item.quantidade,
              valor_unitario: item.valor_unitario,
              valor_total: item.valor_total,
            }))
            console.log("Equipamentos inclusos:", JSON.stringify(equipamentosInclusos, null, 2))
          }
        } else {
          console.log("AVISO: Proposta não encontrada:", propostaId)
        }
      }

      // Calcular valores baseados na proposta OU nos dados recebidos
      let valorMensal = Number.parseFloat(data.valor_mensal) || 0
      let dataFim = data.data_fim
      let quantidadeVisitas = data.quantidade_visitas || data.visita_id || 1
      let clienteId = data.cliente_id

      // Se temos dados da proposta, usar eles
      if (propostaData) {
        valorMensal = Number.parseFloat(propostaData.valor_total_proposta) || 0
        clienteId = propostaData.cliente_id || data.cliente_id
        quantidadeVisitas = propostaData.quantidade_visitas || data.quantidade_visitas || 1

        console.log("Valor mensal calculado da proposta:", valorMensal)
        console.log("Cliente ID da proposta:", clienteId)
        console.log("Quantidade de visitas da proposta:", quantidadeVisitas)

        // Calcular data de fim baseada na data de início + prazo do contrato
        if (data.data_inicio && propostaData.prazo_contrato) {
          const dataInicio = new Date(data.data_inicio)
          const prazoMeses = Number.parseInt(propostaData.prazo_contrato) || 12
          const dataFimCalculada = new Date(dataInicio)
          dataFimCalculada.setMonth(dataFimCalculada.getMonth() + prazoMeses)
          dataFim = dataFimCalculada.toISOString().split("T")[0]
          console.log("Data fim calculada:", dataFim, "Prazo:", prazoMeses, "meses")
        }
      } else {
        // Se não temos dados da proposta, usar os dados recebidos
        console.log("Usando dados recebidos diretamente")

        if (data.valor_total_contrato) {
          valorMensal = Number.parseFloat(data.valor_total_contrato) || 0
          console.log("Valor mensal dos dados recebidos:", valorMensal)
        }

        if (data.equipamentos_consignacao) {
          equipamentosConsignacao = data.equipamentos_consignacao
          console.log("Equipamentos em consignação dos dados recebidos:", equipamentosConsignacao)
        }

        if (data.data_inicio && data.prazo_contrato) {
          const dataInicio = new Date(data.data_inicio)
          const prazoMeses = Number.parseInt(data.prazo_contrato) || 12
          const dataFimCalculada = new Date(dataInicio)
          dataFimCalculada.setMonth(dataFimCalculada.getMonth() + prazoMeses)
          dataFim = dataFimCalculada.toISOString().split("T")[0]
          console.log("Data fim calculada dos dados recebidos:", dataFim)
        }

        if (data.itens && Array.isArray(data.itens)) {
          equipamentosInclusos = data.itens.map((item: any) => ({
            id: item.equipamento_id,
            categoria: item.categoria,
            quantidade: item.quantidade,
            valor_unitario: item.valor_unitario,
            valor_total: item.valor_total,
          }))
          console.log("Equipamentos dos dados recebidos:", JSON.stringify(equipamentosInclusos, null, 2))
        }
      }

      // Preparar dados para inserção - INCLUINDO equipamentos_consignacao
      const dadosContrato = {
        numero: data.numero,
        cliente_id: clienteId,
        proposta_id: propostaId || null,
        quantidade_visitas: quantidadeVisitas,
        data_inicio: data.data_inicio || new Date().toISOString().split("T")[0],
        data_fim: dataFim || null,
        valor_mensal: valorMensal,
        frequencia: data.frequencia || "mensal",
        dia_vencimento: Number.parseInt(data.dia_vencimento) || 10,
        forma_pagamento: data.forma_pagamento || "boleto",
        equipamentos_inclusos: JSON.stringify(equipamentosInclusos),
        equipamentos_consignacao: equipamentosConsignacao, // ADICIONAR ESTE CAMPO
        servicos_inclusos: data.servicos_inclusos || "",
        observacoes: data.observacoes || "",
        status: data.status || "ativo",
        data_proposta: data.data_proposta || data.data_assinatura || new Date().toISOString().split("T")[0],
        prazo_meses: propostaData?.prazo_contrato || data.prazo_contrato || 12,
      }

      console.log("=== DADOS FINAIS PARA INSERÇÃO ===")
      console.log(JSON.stringify(dadosContrato, null, 2))

      // Inserir contrato - INCLUINDO equipamentos_consignacao
      const [result] = await connection.execute(
        `
        INSERT INTO contratos_conservacao (
          numero, cliente_id, proposta_id, quantidade_visitas, data_inicio, data_fim,
          valor_mensal, frequencia, dia_vencimento, forma_pagamento,
          equipamentos_inclusos, equipamentos_consignacao, servicos_inclusos, observacoes,
          status, data_proposta, prazo_meses
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          dadosContrato.numero,
          dadosContrato.cliente_id,
          dadosContrato.proposta_id,
          dadosContrato.quantidade_visitas,
          dadosContrato.data_inicio,
          dadosContrato.data_fim,
          dadosContrato.valor_mensal,
          dadosContrato.frequencia,
          dadosContrato.dia_vencimento,
          dadosContrato.forma_pagamento,
          dadosContrato.equipamentos_inclusos,
          dadosContrato.equipamentos_consignacao, // ADICIONAR ESTE PARÂMETRO
          dadosContrato.servicos_inclusos,
          dadosContrato.observacoes,
          dadosContrato.status,
          dadosContrato.data_proposta,
          dadosContrato.prazo_meses,
        ],
      )

      console.log("Contrato inserido com sucesso. ID:", result)

      await connection.commit()

      return NextResponse.json({
        success: true,
        message: "Contrato criado com sucesso",
        numero: dadosContrato.numero,
        valor_mensal: dadosContrato.valor_mensal,
        data_fim: dadosContrato.data_fim,
        equipamentos_inclusos: equipamentosInclusos.length,
        equipamentos_consignacao: equipamentosConsignacao,
      })
    } catch (error) {
      await connection.rollback()
      console.error("Erro na transação:", error)
      throw error
    } finally {
      connection.release()
    }
  } catch (error) {
    console.error("Erro ao criar contrato:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Erro interno do servidor: " + (error as Error).message,
      },
      { status: 500 },
    )
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const numero = searchParams.get("numero")

    if (!numero) {
      return NextResponse.json(
        {
          success: false,
          message: "Número do contrato é obrigatório",
        },
        { status: 400 },
      )
    }

    const connection = await pool.getConnection()

    try {
      await connection.beginTransaction()

      // Verificar se o contrato existe
      const [contratoRows] = await connection.execute("SELECT * FROM contratos_conservacao WHERE numero = ?", [numero])

      if (!Array.isArray(contratoRows) || contratoRows.length === 0) {
        return NextResponse.json(
          {
            success: false,
            message: "Contrato não encontrado",
          },
          { status: 404 },
        )
      }

      // Excluir o contrato
      await connection.execute("DELETE FROM contratos_conservacao WHERE numero = ?", [numero])

      await connection.commit()

      return NextResponse.json({
        success: true,
        message: "Contrato excluído com sucesso",
      })
    } catch (error) {
      await connection.rollback()
      throw error
    } finally {
      connection.release()
    }
  } catch (error) {
    console.error("Erro ao excluir contrato:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Erro interno do servidor",
      },
      { status: 500 },
    )
  }
}
