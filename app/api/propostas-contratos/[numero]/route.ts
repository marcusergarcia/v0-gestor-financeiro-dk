import { NextResponse } from "next/server"
import { pool } from "@/lib/database"
import { generateId } from "@/lib/generate-id"

export async function GET(request: Request, { params }: { params: Promise<{ numero: string }> }) {
  try {
    const { numero } = await params

    // Buscar proposta principal
    const [propostaRows] = await pool.execute(
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
      WHERE pc.numero = ?
      `,
      [numero],
    )

    if (!Array.isArray(propostaRows) || propostaRows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Proposta não encontrada",
        },
        { status: 404 },
      )
    }

    const proposta = propostaRows[0]

    // Buscar itens da proposta
    const [itensRows] = await pool.execute(
      `
      SELECT 
        pi.*,
        e.nome as equipamento_nome,
        e.categoria as equipamento_categoria
      FROM proposta_itens pi
      LEFT JOIN equipamentos e ON pi.equipamento_id = e.id
      WHERE pi.proposta_id = ?
      ORDER BY pi.categoria, e.nome
      `,
      [numero],
    )

    const itens = Array.isArray(itensRows) ? itensRows : []

    return NextResponse.json({
      success: true,
      data: {
        ...proposta,
        itens,
      },
    })
  } catch (error) {
    console.error("Erro ao buscar proposta:", error)
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
    console.log("=== ATUALIZANDO PROPOSTA ===")
    console.log("Número:", numero)
    console.log("Dados recebidos:", JSON.stringify(data, null, 2))

    const connection = await pool.getConnection()

    try {
      await connection.beginTransaction()

      // Atualizar proposta principal - INCLUINDO equipamentos_consignacao
      await connection.execute(
        `
        UPDATE proposta_contratos SET
          cliente_id = ?, tipo = ?, frequencia = ?, valor_equipamentos = ?,
          valor_desconto = ?, valor_deslocamento = ?, desconto_quant_visitas = ?,
          valor_total_proposta = ?, forma_pagamento = ?, prazo_contrato = ?,
          garantia = ?, observacoes = ?, equipamentos_consignacao = ?, status = ?, 
          data_validade = ?, quantidade_visitas = ?, updated_at = NOW()
        WHERE numero = ?
        `,
        [
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
          data.data_validade || null,
          data.quantidade_visitas || data.visita_id || 1,
          numero,
        ],
      )

      console.log("Proposta principal atualizada com equipamentos_consignacao:", data.equipamentos_consignacao)

      // Remover itens antigos
      await connection.execute("DELETE FROM proposta_itens WHERE proposta_id = ?", [numero])
      console.log("Itens antigos removidos")

      // Inserir novos itens - COM ID GERADO
      if (data.itens && Array.isArray(data.itens) && data.itens.length > 0) {
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
              numero,
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
        console.log(`${data.itens.length} novos itens inseridos`)
      }

      await connection.commit()

      return NextResponse.json({
        success: true,
        message: "Proposta atualizada com sucesso",
      })
    } catch (error) {
      await connection.rollback()
      console.error("Erro na transação:", error)
      throw error
    } finally {
      connection.release()
    }
  } catch (error) {
    console.error("Erro ao atualizar proposta:", error)
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

      // Remover itens da proposta
      await connection.execute("DELETE FROM proposta_itens WHERE proposta_id = ?", [numero])

      // Remover proposta
      const [result] = await connection.execute("DELETE FROM proposta_contratos WHERE numero = ?", [numero])

      if ((result as any).affectedRows === 0) {
        await connection.rollback()
        return NextResponse.json(
          {
            success: false,
            message: "Proposta não encontrada",
          },
          { status: 404 },
        )
      }

      await connection.commit()

      return NextResponse.json({
        success: true,
        message: "Proposta excluída com sucesso",
      })
    } catch (error) {
      await connection.rollback()
      throw error
    } finally {
      connection.release()
    }
  } catch (error) {
    console.error("Erro ao excluir proposta:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Erro interno do servidor",
      },
      { status: 500 },
    )
  }
}
