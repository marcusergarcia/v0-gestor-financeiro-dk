import { NextResponse } from "next/server"
import { pool } from "@/lib/database"

export async function GET(request: Request, { params }: { params: Promise<{ numero: string }> }) {
  try {
    const { numero } = await params

    const [contratoRows] = await pool.execute(
      `
      SELECT 
        cc.*,
        cl.nome as cliente_nome,
        cl.codigo as cliente_codigo,
        cl.cnpj as cliente_cnpj,
        cl.cpf as cliente_cpf,
        cl.email as cliente_email,
        cl.telefone as cliente_telefone,
        cl.endereco as cliente_endereco,
        cl.bairro as cliente_bairro,
        cl.cidade as cliente_cidade,
        cl.estado as cliente_estado,
        cl.cep as cliente_cep,
        cl.contato as cliente_contato,
        cl.distancia_km as cliente_distancia_km,
        cl.sindico as cliente_sindico,
        cl.rg_sindico as cliente_rg_sindico,
        cl.cpf_sindico as cliente_cpf_sindico,
        cl.zelador as cliente_zelador,
        cl.tem_contrato as cliente_tem_contrato,
        cl.dia_contrato as cliente_dia_contrato,
        cl.observacoes as cliente_observacoes,
        pc.numero as proposta_numero,
        pc.tipo as proposta_tipo,
        pc.valor_total_proposta,
        pc.valor_desconto as proposta_desconto,
        pc.prazo_contrato,
        DATE_FORMAT(cc.data_inicio, '%Y-%m-%d') as data_inicio,
        DATE_FORMAT(cc.data_fim, '%Y-%m-%d') as data_fim,
        DATE_FORMAT(cc.data_proposta, '%Y-%m-%d') as data_proposta
      FROM contratos_conservacao cc
      LEFT JOIN clientes cl ON cc.cliente_id = cl.id
      LEFT JOIN proposta_contratos pc ON cc.proposta_id = pc.numero
      WHERE cc.numero = ?
      `,
      [numero],
    )

    if (!Array.isArray(contratoRows) || contratoRows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Contrato não encontrado",
        },
        { status: 404 },
      )
    }

    const contrato = contratoRows[0] as any

    // Parse equipamentos inclusos se existir
    if (contrato.equipamentos_inclusos) {
      try {
        contrato.equipamentos_inclusos = JSON.parse(contrato.equipamentos_inclusos)
      } catch (error) {
        console.error("Erro ao fazer parse dos equipamentos inclusos:", error)
        contrato.equipamentos_inclusos = []
      }
    } else {
      contrato.equipamentos_inclusos = []
    }

    // Buscar itens da proposta se existir proposta_id
    let itens_proposta = []
    if (contrato.proposta_id) {
      const [itensRows] = await pool.execute(
        `
        SELECT 
          pi.*,
          e.nome as equipamento_nome,
          e.categoria as equipamento_categoria,
          e.descricao as equipamento_descricao
        FROM proposta_itens pi
        LEFT JOIN equipamentos e ON pi.equipamento_id = e.id
        WHERE pi.proposta_id = ?
        ORDER BY e.categoria, e.nome
        `,
        [contrato.proposta_id],
      )

      itens_proposta = Array.isArray(itensRows) ? itensRows : []
    }

    // Buscar e preencher conteúdo do contrato se não existir
    if (!contrato.conteudo_contrato) {
      try {
        // Buscar termo do contrato - usando 'titulo' ao invés de 'nome'
        const [termoRows] = await pool.execute(`SELECT conteudo FROM termos_contratos WHERE titulo = ? LIMIT 1`, [
          "Contrato de Conservação e Prevenção dos Equipamentos Eletrônicos",
        ])

        if (Array.isArray(termoRows) && termoRows.length > 0) {
          const termo = termoRows[0] as any

          // Atualizar o contrato com o conteúdo do termo
          await pool.execute(`UPDATE contratos_conservacao SET conteudo_contrato = ? WHERE numero = ?`, [
            termo.conteudo,
            numero,
          ])

          contrato.conteudo_contrato = termo.conteudo
        }
      } catch (error) {
        console.error("Erro ao buscar/atualizar conteúdo do contrato:", error)
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        ...contrato,
        itens_proposta,
      },
    })
  } catch (error) {
    console.error("Erro ao buscar contrato:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Erro interno do servidor",
      },
      { status: 500 },
    )
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ numero: string }> }) {
  try {
    const { numero } = await params
    const data = await request.json()

    console.log("Dados recebidos na API PUT:", data)

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

      // Calcular data_fim baseada na data_inicio e prazo_meses
      let dataFim = data.data_fim
      if (data.data_inicio && data.prazo_meses) {
        const dataInicio = new Date(data.data_inicio)
        const dataFimCalculada = new Date(dataInicio)

        // Se for indeterminado, calcular como 1 mês
        const meses = data.prazo_meses === "indeterminado" ? 1 : Number.parseInt(data.prazo_meses)

        dataFimCalculada.setMonth(dataFimCalculada.getMonth() + meses)
        dataFim = dataFimCalculada.toISOString().split("T")[0]
      }

      // Usar dia_contrato do cliente como dia_vencimento se disponível
      let diaVencimento = data.dia_vencimento
      if (data.cliente_dia_contrato) {
        diaVencimento = data.cliente_dia_contrato
      }

      // Garantir que equipamentos_consignacao seja uma string
      const equipamentosConsignacao = data.equipamentos_consignacao || ""

      // Garantir que prazo_meses seja string para o ENUM
      const prazoMeses = data.prazo_meses ? String(data.prazo_meses) : "12"

      console.log("Equipamentos em consignação a serem salvos:", equipamentosConsignacao)
      console.log("Prazo meses a ser salvo:", prazoMeses)
      console.log("Data fim calculada:", dataFim)

      // Atualizar contrato
      await connection.execute(
        `
        UPDATE contratos_conservacao SET
          cliente_id = ?,
          proposta_id = ?,
          quantidade_visitas = ?,
          data_inicio = ?,
          data_fim = ?,
          valor_mensal = ?,
          frequencia = ?,
          dia_vencimento = ?,
          forma_pagamento = ?,
          equipamentos_inclusos = ?,
          equipamentos_consignacao = ?,
          observacoes = ?,
          status = ?,
          data_proposta = ?,
          prazo_meses = ?,
          updated_at = NOW()
        WHERE numero = ?
        `,
        [
          data.cliente_id,
          data.proposta_id,
          data.quantidade_visitas || 1,
          data.data_inicio,
          dataFim,
          Number.parseFloat(data.valor_mensal) || 0,
          data.frequencia || "mensal",
          Number.parseInt(diaVencimento) || 10,
          data.forma_pagamento || "boleto",
          JSON.stringify(data.equipamentos_inclusos || []),
          equipamentosConsignacao,
          data.observacoes || "",
          data.status || "ativo",
          data.data_proposta || data.data_assinatura,
          prazoMeses,
          numero,
        ],
      )

      console.log("Contrato atualizado com sucesso")

      await connection.commit()

      return NextResponse.json({
        success: true,
        message: "Contrato atualizado com sucesso",
      })
    } catch (error) {
      await connection.rollback()
      console.error("Erro na transação de atualização:", error)
      throw error
    } finally {
      connection.release()
    }
  } catch (error) {
    console.error("Erro ao atualizar contrato:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Erro interno do servidor: " + (error as Error).message,
      },
      { status: 500 },
    )
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ numero: string }> }) {
  try {
    const { numero } = await params

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
