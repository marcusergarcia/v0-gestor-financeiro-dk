import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

// GET - Buscar clientes elegíveis para criação em lote
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const mes = searchParams.get("mes") // formato: 2026-01

    console.log("[v0] Buscando clientes com contrato para mês:", mes)

    // Buscar clientes que tem contrato ativo
    const clientesQuery = `
      SELECT 
        c.id,
        c.codigo,
        c.nome,
        c.endereco,
        c.telefone,
        c.email,
        c.tem_contrato,
        c.dia_contrato,
        cc.id as contrato_id,
        cc.numero as contrato_numero,
        cc.frequencia,
        cc.quantidade_visitas,
        cc.equipamentos_inclusos,
        cc.status as contrato_status
      FROM clientes c
      LEFT JOIN contratos_conservacao cc ON c.id = cc.cliente_id AND cc.status = 'ativo'
      WHERE c.tem_contrato = true
      ORDER BY c.nome ASC
    `

    const clientes = await query(clientesQuery)

    console.log("[v0] Encontrados", (clientes as any[]).length, "clientes com contrato")

    // Para cada cliente, verificar se já tem OS preventiva no mês solicitado
    if (mes) {
      const [ano, mesNum] = mes.split("-")
      const primeiroDia = `${ano}-${mesNum}-01`
      const ultimoDia = `${ano}-${mesNum}-31`

      for (const cliente of clientes as any[]) {
        const osExistente = await query(
          `SELECT id, numero FROM ordens_servico 
           WHERE cliente_id = ? 
           AND tipo_servico = 'preventiva'
           AND data_atual BETWEEN ? AND ?`,
          [cliente.id, primeiroDia, ultimoDia],
        )

        cliente.ja_tem_os_no_mes = (osExistente as any[]).length > 0
        if (cliente.ja_tem_os_no_mes) {
          cliente.os_existente = (osExistente as any[])[0]
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: clientes,
    })
  } catch (error) {
    console.error("[v0] Erro ao buscar clientes para lote:", error)
    return NextResponse.json({ success: false, error: "Erro ao buscar clientes" }, { status: 500 })
  }
}

// POST - Criar ordens preventivas em lote
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { clientes_ids, mes_referencia, data_agendamento, periodo_agendamento } = body

    console.log("[v0] Criando OSs em lote:", {
      quantidade: clientes_ids.length,
      mes_referencia,
      data_agendamento,
      periodo: periodo_agendamento,
    })

    if (!clientes_ids || clientes_ids.length === 0) {
      return NextResponse.json({ success: false, error: "Nenhum cliente selecionado" }, { status: 400 })
    }

    const resultados = {
      sucesso: [],
      erros: [],
    }

    // Gerar número base da OS para o lote
    const anoMes = mes_referencia.replace("-", "")

    for (const clienteId of clientes_ids) {
      try {
        // Buscar dados do cliente e contrato
        const clienteResult = await query(
          `SELECT 
            c.id, c.codigo, c.nome, c.dia_contrato,
            cc.id as contrato_id,
            cc.numero as contrato_numero,
            cc.equipamentos_inclusos
           FROM clientes c
           LEFT JOIN contratos_conservacao cc ON c.id = cc.cliente_id AND cc.status = 'ativo'
           WHERE c.id = ?`,
          [clienteId],
        )

        if ((clienteResult as any[]).length === 0) {
          resultados.erros.push({
            cliente_id: clienteId,
            erro: "Cliente não encontrado",
          })
          continue
        }

        const cliente = (clienteResult as any[])[0]

        // Gerar número único da OS
        const ultimaOSResult = await query(
          `SELECT numero FROM ordens_servico 
           WHERE numero LIKE '${anoMes}%' 
           ORDER BY numero DESC LIMIT 1`,
        )

        let proximoNumero = 1
        if ((ultimaOSResult as any[]).length > 0) {
          const ultimoNumero = (ultimaOSResult as any[])[0].numero
          const sequencia = Number.parseInt(ultimoNumero.slice(-5))
          proximoNumero = sequencia + 1
        }

        const numeroOS = `${anoMes}${String(proximoNumero).padStart(5, "0")}`

        // Definir data de agendamento se não foi fornecida
        let dataAgendamento = data_agendamento
        if (!dataAgendamento && cliente.dia_contrato) {
          const [ano, mes] = mes_referencia.split("-")
          const dia = String(cliente.dia_contrato).padStart(2, "0")
          dataAgendamento = `${ano}-${mes}-${dia}`
        }

        // Criar a ordem de serviço
        const situacao = dataAgendamento ? "agendada" : "aberta"

        const insertResult = await query(
          `INSERT INTO ordens_servico 
           (numero, cliente_id, contrato_id, contrato_numero, tecnico_name, tecnico_email,
            solicitado_por, data_atual, data_agendamento, periodo_agendamento,
            tipo_servico, descricao_defeito, situacao)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            numeroOS,
            cliente.id,
            cliente.contrato_id || null,
            cliente.contrato_numero || "CLIENTE SEM CONTRATO",
            "A DEFINIR",
            null,
            "CONTRATO DE MANUTENÇÃO",
            mes_referencia + "-01",
            dataAgendamento || null,
            periodo_agendamento || null,
            "PREVENTIVA",
            "MANUTENÇÃO PREVENTIVA CONTRATUAL",
            situacao,
          ],
        )

        const ordemId = (insertResult as any).insertId

        // Adicionar equipamentos se houver no contrato
        if (cliente.equipamentos_inclusos) {
          const equipamentos = cliente.equipamentos_inclusos.split("\n").filter((e: string) => e.trim())

          for (const equipamentoNome of equipamentos) {
            await query(
              `INSERT INTO ordens_servico_itens 
               (ordem_servico_id, equipamento_nome, quantidade, situacao)
               VALUES (?, ?, 1, 'pendente')`,
              [ordemId, equipamentoNome.trim().toUpperCase()],
            )
          }
        }

        resultados.sucesso.push({
          cliente_id: clienteId,
          cliente_nome: cliente.nome,
          numero_os: numeroOS,
          ordem_id: ordemId,
        })
      } catch (error) {
        console.error(`[v0] Erro ao criar OS para cliente ${clienteId}:`, error)
        resultados.erros.push({
          cliente_id: clienteId,
          erro: error instanceof Error ? error.message : "Erro desconhecido",
        })
      }
    }

    console.log("[v0] Lote concluído:", {
      sucesso: resultados.sucesso.length,
      erros: resultados.erros.length,
    })

    return NextResponse.json({
      success: true,
      message: `${resultados.sucesso.length} ordens criadas com sucesso`,
      data: resultados,
    })
  } catch (error) {
    console.error("[v0] Erro ao criar OSs em lote:", error)
    return NextResponse.json({ success: false, error: "Erro ao criar ordens em lote" }, { status: 500 })
  }
}
