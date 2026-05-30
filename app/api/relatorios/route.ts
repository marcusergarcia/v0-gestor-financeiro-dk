import { type NextRequest, NextResponse } from "next/server"
import { pool } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tipo = searchParams.get("tipo") || "dashboard"
    const periodo = searchParams.get("periodo") || "30"
    const status = searchParams.get("status") || "todos"
    const clienteId = searchParams.get("clienteId")
    const categoriaId = searchParams.get("categoriaId")
    const dataInicio = searchParams.get("dataInicio")
    const dataFim = searchParams.get("dataFim")
    const tipoNota = searchParams.get("tipoNota") || "todos"

    console.log("Gerando relatório:", { tipo, periodo, status, clienteId, categoriaId, dataInicio, dataFim, tipoNota })

    // Determinar datas de início e fim
    let startDateStr = ""
    let endDateStr = ""

    if (dataInicio) {
      startDateStr = dataInicio
    } else {
      const dataLimite = new Date()
      dataLimite.setDate(dataLimite.getDate() - Number.parseInt(periodo))
      startDateStr = dataLimite.toISOString().split("T")[0]
    }

    if (dataFim) {
      endDateStr = dataFim
    } else {
      endDateStr = new Date().toISOString().split("T")[0]
    }

    let data: any = {}

    try {
      switch (tipo) {
        case "dashboard":
          // Total de clientes ativos (ativo = 1)
          const [clientesResult] = await pool.execute(`SELECT COUNT(*) as total FROM clientes WHERE ativo = 1`)

          // Total de produtos ativos (ativo = 1)
          const [produtosResult] = await pool.execute(`SELECT COUNT(*) as total FROM produtos WHERE ativo = 1`)

          // Orçamentos no período
          const [orcamentosResult] = await pool.execute(
            `SELECT 
              COUNT(*) as total,
              COUNT(CASE WHEN situacao = 'aprovado' THEN 1 END) as aprovados,
              COUNT(CASE WHEN situacao = 'pendente' THEN 1 END) as pendentes,
              COUNT(CASE WHEN situacao = 'rejeitado' THEN 1 END) as rejeitados,
              COALESCE(SUM(valor_total), 0) as valor_total
            FROM orcamentos 
            WHERE DATE(created_at) BETWEEN ? AND ?`,
            [startDateStr, endDateStr],
          )

          // Boletos no período
          const [boletosResult] = await pool.execute(
            `SELECT 
              COUNT(*) as total,
              COALESCE(SUM(valor), 0) as valor_total,
              COUNT(CASE WHEN status = 'pago' THEN 1 END) as pagos,
              COUNT(CASE WHEN status = 'pendente' AND data_vencimento < CURDATE() THEN 1 END) as vencidos,
              COUNT(CASE WHEN status = 'pendente' AND data_vencimento >= CURDATE() THEN 1 END) as pendentes
            FROM boletos 
            WHERE DATE(created_at) BETWEEN ? AND ?`,
            [startDateStr, endDateStr],
          )

          const orcamentos = (orcamentosResult as any[])[0] || {}
          const boletos = (boletosResult as any[])[0] || {}

          data = {
            periodo: dataInicio && dataFim ? `De ${dataInicio} até ${dataFim}` : `Últimos ${periodo} dias`,
            totalClientes: (clientesResult as any[])[0]?.total || 0,
            totalProdutos: (produtosResult as any[])[0]?.total || 0,
            orcamentos: {
              total: orcamentos.total || 0,
              aprovados: orcamentos.aprovados || 0,
              pendentes: orcamentos.pendentes || 0,
              rejeitados: orcamentos.rejeitados || 0,
              valorTotal: orcamentos.valor_total || 0,
            },
            boletos: {
              total: boletos.total || 0,
              valorTotal: boletos.valor_total || 0,
              pagos: boletos.pagos || 0,
              vencidos: boletos.vencidos || 0,
              pendentes: boletos.pendentes || 0,
            },
          }
          break

        case "clientes":
          let clientesQuery = `
            SELECT 
              c.id, c.codigo, c.nome, c.email, c.telefone, c.cidade, c.estado, c.created_at,
              COUNT(DISTINCT o.id) as total_orcamentos,
              COALESCE(SUM(o.valor_total), 0) as valor_orcamentos,
              COUNT(DISTINCT b.id) as total_boletos,
              COALESCE(SUM(b.valor), 0) as valor_boletos
            FROM clientes c
            LEFT JOIN orcamentos o ON c.id = o.cliente_id AND DATE(o.created_at) BETWEEN ? AND ?
            LEFT JOIN boletos b ON c.id = b.cliente_id AND DATE(b.created_at) BETWEEN ? AND ?
            WHERE c.status = 1
          `
          const clientesParams: any[] = [startDateStr, endDateStr, startDateStr, endDateStr]

          if (clienteId && clienteId !== "todos") {
            clientesQuery += ` AND c.id = ?`
            clientesParams.push(clienteId)
          }

          clientesQuery += ` GROUP BY c.id ORDER BY valor_orcamentos DESC`

          const [clientesData] = await pool.execute(clientesQuery, clientesParams)
          data = {
            clientes: clientesData,
            total: (clientesData as any[]).length,
            filtros: { clienteId, dataInicio: startDateStr, dataFim: endDateStr },
          }
          break

        case "produtos":
          let produtosQuery = `
            SELECT 
              p.id, p.codigo, p.descricao as nome, p.valor_unitario as preco_venda, 
              p.estoque as estoque_atual, p.estoque_minimo, p.tipo, p.marca, p.created_at,
              COUNT(oi.id) as vezes_vendido,
              COALESCE(SUM(oi.quantidade), 0) as quantidade_vendida,
              COALESCE(SUM(oi.valor_total), 0) as valor_vendido
            FROM produtos p
            LEFT JOIN orcamentos_itens oi ON p.id = oi.produto_id
            LEFT JOIN orcamentos o ON oi.orcamento_numero = o.numero AND DATE(o.created_at) BETWEEN ? AND ?
            WHERE p.ativo = 1
          `
          const produtosParams: any[] = [startDateStr, endDateStr]

          if (categoriaId && categoriaId !== "todos") {
            produtosQuery += ` AND p.tipo = ?`
            produtosParams.push(categoriaId)
          }

          if (status === "baixo_estoque") {
            produtosQuery += ` AND p.estoque <= p.estoque_minimo`
          } else if (status === "sem_estoque") {
            produtosQuery += ` AND p.estoque = 0`
          }

          produtosQuery += ` GROUP BY p.id ORDER BY quantidade_vendida DESC`

          const [produtosData] = await pool.execute(produtosQuery, produtosParams)

          // Buscar tipos únicos para o filtro
          const [tiposData] = await pool.execute(
            `SELECT DISTINCT tipo FROM produtos WHERE ativo = 1 AND tipo IS NOT NULL AND tipo != '' ORDER BY tipo`,
          )

          data = {
            produtos: produtosData,
            tipos: tiposData,
            total: (produtosData as any[]).length,
            filtros: { categoriaId, status, dataInicio: startDateStr, dataFim: endDateStr },
          }
          break

        case "orcamentos":
          let orcamentosQuery = `
            SELECT 
              o.id, o.numero, o.valor_total, o.situacao, o.created_at, o.validade,
              c.nome as cliente_nome, c.codigo as cliente_codigo,
              COUNT(oi.id) as total_itens,
              DATEDIFF(CURDATE(), o.created_at) as dias_criado
            FROM orcamentos o
            LEFT JOIN clientes c ON o.cliente_id = c.id
            LEFT JOIN orcamentos_itens oi ON o.numero = oi.orcamento_numero
            WHERE DATE(o.created_at) BETWEEN ? AND ?
          `
          const orcamentosParams: any[] = [startDateStr, endDateStr]

          if (status && status !== "todos") {
            orcamentosQuery += ` AND o.situacao = ?`
            orcamentosParams.push(status)
          }

          if (clienteId && clienteId !== "todos") {
            orcamentosQuery += ` AND o.cliente_id = ?`
            orcamentosParams.push(clienteId)
          }

          orcamentosQuery += ` GROUP BY o.id ORDER BY o.created_at DESC`

          const [orcamentosData] = await pool.execute(orcamentosQuery, orcamentosParams)

          // Calcular estatísticas
          const totalOrcamentos = (orcamentosData as any[]).length
          const valorTotal = (orcamentosData as any[]).reduce(
            (sum, o) => sum + (Number.parseFloat(o.valor_total) || 0),
            0,
          )
          const aprovados = (orcamentosData as any[]).filter((o) => o.situacao === "aprovado").length
          const pendentes = (orcamentosData as any[]).filter((o) => o.situacao === "pendente").length
          const rejeitados = (orcamentosData as any[]).filter((o) => o.situacao === "rejeitado").length
          const concluidos = (orcamentosData as any[]).filter((o) => o.situacao === "concluido" || o.situacao === "concluído").length

          data = {
            orcamentos: orcamentosData,
            total: totalOrcamentos,
            valorTotal,
            estatisticas: { aprovados, pendentes, rejeitados, concluidos },
            filtros: { status, clienteId, dataInicio: startDateStr, dataFim: endDateStr },
          }
          break

        case "financeiro":
          let boletosQuery = `
            SELECT 
              b.id, b.numero, b.valor, b.data_vencimento, b.status, b.created_at,
              b.data_pagamento, b.observacoes,
              c.nome as cliente_nome, c.codigo as cliente_codigo,
              DATEDIFF(CURDATE(), b.data_vencimento) as dias_vencimento
            FROM boletos b
            LEFT JOIN clientes c ON b.cliente_id = c.id
            WHERE DATE(b.data_vencimento) BETWEEN ? AND ?
          `
          const boletosParams: any[] = [startDateStr, endDateStr]

          if (status && status !== "todos") {
            if (status === "vencidos") {
              boletosQuery += ` AND b.status = 'pendente' AND b.data_vencimento < CURDATE()`
            } else if (status === "vencer") {
              boletosQuery += ` AND b.status = 'pendente' AND b.data_vencimento BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)`
            } else {
              boletosQuery += ` AND b.status = ?`
              boletosParams.push(status)
            }
          }

          if (clienteId && clienteId !== "todos") {
            boletosQuery += ` AND b.cliente_id = ?`
            boletosParams.push(clienteId)
          }

          boletosQuery += ` ORDER BY b.data_vencimento ASC`

          const [boletosData] = await pool.execute(boletosQuery, boletosParams)

          // Calcular estatísticas financeiras
          const totalBoletos = (boletosData as any[]).length
          const valorTotalBoletos = (boletosData as any[]).reduce(
            (sum, b) => sum + (Number.parseFloat(b.valor) || 0),
            0,
          )
          const boletosPagos = (boletosData as any[]).filter((b) => b.status === "pago").length
          const valorPago = (boletosData as any[])
            .filter((b) => b.status === "pago")
            .reduce((sum, b) => sum + (Number.parseFloat(b.valor) || 0), 0)
          const boletosVencidos = (boletosData as any[]).filter(
            (b) => b.status === "pendente" && new Date(b.data_vencimento) < new Date(),
          ).length
          const valorVencido = (boletosData as any[])
            .filter((b) => b.status === "pendente" && new Date(b.data_vencimento) < new Date())
            .reduce((sum, b) => sum + (Number.parseFloat(b.valor) || 0), 0)

          data = {
            boletos: boletosData,
            total: totalBoletos,
            valorTotal: valorTotalBoletos,
            estatisticas: {
              pagos: boletosPagos,
              valorPago,
              vencidos: boletosVencidos,
              valorVencido,
              pendentes: totalBoletos - boletosPagos,
              valorPendente: valorTotalBoletos - valorPago,
            },
            filtros: { status, clienteId, dataInicio: startDateStr, dataFim: endDateStr },
          }
          break

        case "ordens_servico":
          let osQuery = `
            SELECT 
              os.id, os.numero, os.cliente_id, c.nome as cliente_nome,
              os.tecnico_name, os.tipo_servico, os.data_atual, os.data_agendamento,
              os.data_execucao, COALESCE(os.situacao, 'rascunho') as situacao, os.created_at
            FROM ordens_servico os
            LEFT JOIN clientes c ON os.cliente_id = c.id
            WHERE (DATE(os.created_at) BETWEEN ? AND ? OR DATE(os.data_agendamento) BETWEEN ? AND ?)
          `
          const osParams: any[] = [startDateStr, endDateStr, startDateStr, endDateStr]

          if (status && status !== "todos") {
            osQuery += ` AND os.situacao = ?`
            osParams.push(status)
          }

          if (clienteId && clienteId !== "todos") {
            osQuery += ` AND os.cliente_id = ?`
            osParams.push(clienteId)
          }

          osQuery += ` ORDER BY os.created_at DESC`

          const [osData] = await pool.execute(osQuery, osParams)

          // Calcular estatísticas
          const totalOs = (osData as any[]).length
          const finalizadas = (osData as any[]).filter(o => o.situacao === "finalizada").length
          const agendadas = (osData as any[]).filter(o => o.situacao === "agendada").length
          const emAndamento = (osData as any[]).filter(o => o.situacao === "em_andamento").length
          const canceladas = (osData as any[]).filter(o => o.situacao === "cancelada").length
          const rascunhos = (osData as any[]).filter(o => o.situacao === "rascunho").length

          // Agrupamentos
          const tiposOsMap: Record<string, number> = {}
          const tecnicosOsMap: Record<string, number> = {}

          ;(osData as any[]).forEach(o => {
            const ts = o.tipo_servico || "NÃO ESPECIFICADO"
            tiposOsMap[ts] = (tiposOsMap[ts] || 0) + 1

            const tec = o.tecnico_name || "NÃO ESPECIFICADO"
            tecnicosOsMap[tec] = (tecnicosOsMap[tec] || 0) + 1
          })

          data = {
            ordensServico: osData,
            total: totalOs,
            estatisticas: {
              finalizadas,
              agendadas,
              emAndamento,
              canceladas,
              rascunhos,
              tipos: Object.entries(tiposOsMap).map(([nome, total]) => ({ nome, total })),
              tecnicos: Object.entries(tecnicosOsMap).map(([nome, total]) => ({ nome, total }))
            },
            filtros: { status, clienteId, dataInicio: startDateStr, dataFim: endDateStr }
          }
          break

        case "notas_fiscais":
          let nfs: any[] = []

          // 1. Query Product Invoices (nfe_emitidas)
          if (tipoNota === "todos" || tipoNota === "produto") {
            let prodQuery = `
              SELECT 
                nf.id, nf.numero_nfe as numero, nf.serie, nf.chave_acesso, nf.valor_total as valor,
                nf.status, nf.data_emissao, c.nome as cliente_nome, 'produto' as tipo_nota
              FROM nfe_emitidas nf
              LEFT JOIN clientes c ON nf.cliente_id = c.id
              WHERE DATE(nf.data_emissao) BETWEEN ? AND ?
            `
            const prodParams: any[] = [startDateStr, endDateStr]
            if (status && status !== "todos") {
              prodQuery += ` AND nf.status = ?`
              prodParams.push(status)
            }
            if (clienteId && clienteId !== "todos") {
              prodQuery += ` AND nf.cliente_id = ?`
              prodParams.push(clienteId)
            }
            const [prodData] = await pool.execute(prodQuery, prodParams)
            nfs = nfs.concat(prodData)
          }

          // 2. Query Service Invoices (notas_fiscais)
          if (tipoNota === "todos" || tipoNota === "servico") {
            let servQuery = `
              SELECT 
                nf.id, nf.numero_nfse as numero, nf.serie_rps as serie, nf.codigo_verificacao as chave_acesso, nf.valor_total as valor,
                nf.status, nf.data_emissao, c.nome as cliente_nome, 'servico' as tipo_nota
              FROM notas_fiscais nf
              LEFT JOIN clientes c ON nf.cliente_id = c.id
              WHERE DATE(nf.data_emissao) BETWEEN ? AND ?
            `
            const servParams: any[] = [startDateStr, endDateStr]
            if (status && status !== "todos") {
              let servStatus = status
              if (status === "autorizada") servStatus = "emitida"
              servQuery += ` AND nf.status = ?`
              servParams.push(servStatus)
            }
            if (clienteId && clienteId !== "todos") {
              servQuery += ` AND nf.cliente_id = ?`
              servParams.push(clienteId)
            }
            const [servData] = await pool.execute(servQuery, servParams)
            nfs = nfs.concat(servData)
          }

          // Sort by emission date desc
          nfs.sort((a, b) => new Date(b.data_emissao).getTime() - new Date(a.data_emissao).getTime())

          const totalNf = nfs.length
          const valorTotalNf = nfs.reduce((sum, n) => sum + (Number.parseFloat(n.valor) || 0), 0)
          const autorizadas = nfs.filter(n => n.status === "autorizada" || n.status === "transmitida" || n.status === "sucesso" || n.status === "emitida").length
          const canceladasNf = nfs.filter(n => n.status === "cancelada" || n.status === "cancelado").length
          data = {
            notasFiscais: nfs,
            total: totalNf,
            valorTotal: valorTotalNf,
            estatisticas: { autorizadas, canceladas: canceladasNf },
            filtros: { status, clienteId, tipoNota, dataInicio: startDateStr, dataFim: endDateStr }
          }
          break

        case "propostas_contratos":
          let propQuery = `
            SELECT 
              p.id, p.numero, p.valor_total_proposta as valor, p.status, p.data_proposta, p.tipo,
              c.nome as cliente_nome
            FROM proposta_contratos p
            LEFT JOIN clientes c ON p.cliente_id = c.id
            WHERE DATE(p.data_proposta) BETWEEN ? AND ?
          `
          const propParams: any[] = [startDateStr, endDateStr]
          if (status && status !== "todos") {
            propQuery += ` AND p.status = ?`
            propParams.push(status)
          }
          if (clienteId && clienteId !== "todos") {
            propQuery += ` AND p.cliente_id = ?`
            propParams.push(clienteId)
          }
          propQuery += ` ORDER BY p.data_proposta DESC`
          const [propData] = await pool.execute(propQuery, propParams)
          const totalProp = (propData as any[]).length
          const valorTotalProp = (propData as any[]).reduce((sum, p) => sum + (Number.parseFloat(p.valor) || 0), 0)
          const rascunhosProp = (propData as any[]).filter(p => p.status === "rascunho").length
          const enviadasProp = (propData as any[]).filter(p => p.status === "enviada").length
          const aprovadasProp = (propData as any[]).filter(p => p.status === "aprovada" || p.status === "aprovado").length
          const rejeitadasProp = (propData as any[]).filter(p => p.status === "rejeitada" || p.status === "rejeitado").length
          data = {
            propostas: propData,
            total: totalProp,
            valorTotal: valorTotalProp,
            estatisticas: { rascunhos: rascunhosProp, enviadas: enviadasProp, aprovadas: aprovadasProp, rejeitadas: rejeitadasProp },
            filtros: { status, clienteId, dataInicio: startDateStr, dataFim: endDateStr }
          }
          break

        case "contratos_ativos":
          let contQuery = `
            SELECT 
              cc.id, cc.numero, cc.valor_mensal as valor, cc.status, cc.data_inicio, cc.data_fim,
              c.nome as cliente_nome
            FROM contratos_conservacao cc
            LEFT JOIN clientes c ON cc.cliente_id = c.id
            WHERE DATE(cc.data_inicio) BETWEEN ? AND ?
          `
          const contParams: any[] = [startDateStr, endDateStr]
          if (status && status !== "todos") {
            contQuery += ` AND cc.status = ?`
            contParams.push(status)
          }
          if (clienteId && clienteId !== "todos") {
            contQuery += ` AND cc.cliente_id = ?`
            contParams.push(clienteId)
          }
          contQuery += ` ORDER BY cc.data_inicio DESC`
          const [contData] = await pool.execute(contQuery, contParams)
          const totalCont = (contData as any[]).length
          const valorTotalCont = (contData as any[]).reduce((sum, c) => sum + (Number.parseFloat(c.valor) || 0), 0)
          const ativosCont = (contData as any[]).filter(c => c.status === "ativo").length
          const suspensosCont = (contData as any[]).filter(c => c.status === "suspenso").length
          const canceladosCont = (contData as any[]).filter(c => c.status === "cancelado").length
          data = {
            contratos: contData,
            total: totalCont,
            valorTotal: valorTotalCont,
            estatisticas: { ativos: ativosCont, suspensos: suspensosCont, cancelados: canceladosCont },
            filtros: { status, clienteId, dataInicio: startDateStr, dataFim: endDateStr }
          }
          break

        case "usuarios":
          let userQuery = `
            SELECT 
              u.id, u.nome, u.email, u.tipo, u.ativo, u.created_at
            FROM usuarios u
            WHERE 1=1
          `
          const userParams: any[] = []
          if (status && status !== "todos") {
            const isAtivo = status === "ativo" ? 1 : 0
            userQuery += ` AND u.ativo = ?`
            userParams.push(isAtivo)
          }
          userQuery += ` ORDER BY u.nome ASC`
          const [userData] = await pool.execute(userQuery, userParams)
          const totalUser = (userData as any[]).length
          const ativosUser = (userData as any[]).filter(u => u.ativo === 1 || u.ativo === true).length
          const inativosUser = totalUser - ativosUser
          data = {
            usuarios: userData,
            total: totalUser,
            estatisticas: { ativos: ativosUser, inativos: inativosUser },
            filtros: { status }
          }
          break

        case "logs_sistema":
          let logQuery = `
            SELECT 
              l.id, l.usuario_nome, l.acao, l.modulo, l.tipo, l.ip_address, l.data_hora,
              u.tipo as usuario_tipo
            FROM logs_sistema l
            LEFT JOIN usuarios u ON l.usuario_id = u.id
            WHERE DATE(l.data_hora) BETWEEN ? AND ?
          `
          const logParams: any[] = [startDateStr, endDateStr]
          if (status && status !== "todos") {
            logQuery += ` AND u.tipo = ?`
            logParams.push(status)
          }
          logQuery += ` ORDER BY l.data_hora DESC LIMIT 500`
          const [logData] = await pool.execute(logQuery, logParams)
          const totalLog = (logData as any[]).length
          const adminLogs = (logData as any[]).filter(l => l.usuario_tipo === "administrador").length
          const userLogs = (logData as any[]).filter(l => l.usuario_tipo === "usuario").length
          const tecLogs = (logData as any[]).filter(l => l.usuario_tipo === "tecnico").length
          data = {
            logs: logData,
            total: totalLog,
            estatisticas: { administrador: adminLogs, usuario: userLogs, tecnico: tecLogs },
            filtros: { status, dataInicio: startDateStr, dataFim: endDateStr }
          }
          break;

        case "feriados":
          let ferQuery = `
            SELECT 
              f.id, f.data, f.nome, f.tipo, f.recorrente, f.ativo
            FROM feriados f
            WHERE 1=1
          `
          const ferParams: any[] = []
          if (status && status !== "todos") {
            ferQuery += ` AND f.tipo = ?`
            ferParams.push(status)
          }

          if (periodo && periodo !== "todos" && periodo !== "todos_meses") {
            if (periodo === "este_mes") {
              ferQuery += ` AND MONTH(f.data) = MONTH(CURDATE())`
            } else if (periodo === "mes_passado") {
              ferQuery += ` AND MONTH(f.data) = MONTH(DATE_SUB(CURDATE(), INTERVAL 1 MONTH))`
            } else if (periodo === "mes_seguinte") {
              ferQuery += ` AND MONTH(f.data) = MONTH(DATE_ADD(CURDATE(), INTERVAL 1 MONTH))`
            } else if (periodo === "trimestre_atual") {
              ferQuery += ` AND QUARTER(f.data) = QUARTER(CURDATE())`
            } else if (periodo === "quadrimestre_atual") {
              ferQuery += ` AND CEIL(MONTH(f.data) / 4) = CEIL(MONTH(CURDATE()) / 4)`
            } else if (periodo === "semestre_atual") {
              ferQuery += ` AND CEIL(MONTH(f.data) / 6) = CEIL(MONTH(CURDATE()) / 6)`
            }
          }

          ferQuery += ` ORDER BY f.data ASC`
          const [ferData] = await pool.execute(ferQuery, ferParams)
          const totalFer = (ferData as any[]).length
          const nacionais = (ferData as any[]).filter(f => f.tipo === "nacional").length
          const estaduais = (ferData as any[]).filter(f => f.tipo === "estadual").length
          const municipais = (ferData as any[]).filter(f => f.tipo === "municipal").length
          const personalizados = (ferData as any[]).filter(f => f.tipo === "personalizado").length
          data = {
            feriados: ferData,
            total: totalFer,
            estatisticas: { nacionais, estaduais, municipais, personalizados },
            filtros: { status, periodo }
          }
          break

        case "equipamentos":
          let equipQuery = `
            SELECT 
              e.id, e.nome, e.categoria, e.valor_hora, e.descricao, e.ativo
            FROM equipamentos e
            WHERE 1=1
          `
          const equipParams: any[] = []
          if (status && status !== "todos") {
            const isAtivo = status === "ativo" ? 1 : 0
            equipQuery += ` AND e.ativo = ?`
            equipParams.push(isAtivo)
          }

          if (categoriaId && categoriaId !== "todos") {
            equipQuery += ` AND e.categoria = ?`
            equipParams.push(categoriaId)
          }

          equipQuery += ` ORDER BY e.nome ASC`
          const [equipData] = await pool.execute(equipQuery, equipParams)

          // Fetch unique categories
          const [categoriasEquip] = await pool.execute(
            `SELECT DISTINCT categoria FROM equipamentos WHERE ativo = 1 AND categoria IS NOT NULL AND categoria != '' ORDER BY categoria`
          )

          const totalEquip = (equipData as any[]).length
          const ativosEquip = (equipData as any[]).filter(e => e.ativo === 1 || e.ativo === true).length
          const inativosEquip = totalEquip - ativosEquip
          data = {
            equipamentos: equipData,
            total: totalEquip,
            categorias: (categoriasEquip as any[]).map(c => c.categoria),
            estatisticas: { ativos: ativosEquip, inativos: inativosEquip },
            filtros: { status, categoriaId }
          }
          break

        default:
          return NextResponse.json({ success: false, message: "Tipo de relatório inválido" }, { status: 400 })
      }

      console.log("Dados do relatório gerados:", { tipo, dataLength: JSON.stringify(data).length })

      return NextResponse.json({
        success: true,
        data,
        tipo,
        filtros: { periodo, status, clienteId, categoriaId, dataInicio: startDateStr, dataFim: endDateStr },
      })
    } catch (dbError) {
      console.error("Erro na consulta do banco:", dbError)
      return NextResponse.json(
        { success: false, message: `Erro ao consultar banco de dados: ${dbError}` },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Erro ao gerar relatório:", error)
    return NextResponse.json({ success: false, message: `Erro interno do servidor: ${error}` }, { status: 500 })
  }
}
