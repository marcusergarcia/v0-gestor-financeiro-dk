"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { BarChart, Filter, AlertCircle, RefreshCw, Printer, Download, Calendar, Users, Package, FileText, DollarSign, Wrench, Check, ChevronsUpDown } from "lucide-react"
import { formatCurrency, formatDate, cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

interface RelatorioData {
  periodo?: string
  totalClientes?: number
  totalProdutos?: number
  orcamentos?: any[]
  boletos?: any[]
  ordensServico?: any[]
  clientes?: any[]
  produtos?: any[]
  tipos?: any[]
  total?: number
  valorTotal?: number
  estatisticas?: any
  filtros?: any
}

export default function RelatoriosPage() {
  const [loading, setLoading] = useState(false)
  const [tipoRelatorio, setTipoRelatorio] = useState("financeiro")
  const [periodoPreset, setPeriodoPreset] = useState("este_mes")
  const [dataInicio, setDataInicio] = useState("")
  const [dataFim, setDataFim] = useState("")
  const [status, setStatus] = useState("todos")
  const [clienteId, setClienteId] = useState("todos")
  const [categoriaId, setCategoriaId] = useState("todos")
  
  const [relatorioData, setRelatorioData] = useState<RelatorioData | null>(null)
  const [logoMenu, setLogoMenu] = useState<string>("")
  const [error, setError] = useState<string>("")
  const [clientes, setClientes] = useState<any[]>([])
  const [tipos, setTipos] = useState<any[]>([])
  const { toast } = useToast()

  // Calcular datas do preset atual
  const getDatasParaPeriodo = (p: string) => {
    const hoje = new Date()
    const hojeStr = hoje.toISOString().split("T")[0]

    switch (p) {
      case "este_mes": {
        const inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
        const fim = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0)
        return {
          inicio: inicio.toISOString().split("T")[0],
          fim: fim.toISOString().split("T")[0]
        }
      }
      case "mes_passado": {
        const inicio = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1)
        const fim = new Date(hoje.getFullYear(), hoje.getMonth(), 0)
        return {
          inicio: inicio.toISOString().split("T")[0],
          fim: fim.toISOString().split("T")[0]
        }
      }
      case "este_ano": {
        return {
          inicio: `${hoje.getFullYear()}-01-01`,
          fim: `${hoje.getFullYear()}-12-31`
        }
      }
      case "30": {
        const limite = new Date()
        limite.setDate(limite.getDate() - 30)
        return {
          inicio: limite.toISOString().split("T")[0],
          fim: hojeStr
        }
      }
      case "90": {
        const limite = new Date()
        limite.setDate(limite.getDate() - 90)
        return {
          inicio: limite.toISOString().split("T")[0],
          fim: hojeStr
        }
      }
      default:
        return { inicio: "", fim: "" }
    }
  }

  // Monitorar mudança de presets
  useEffect(() => {
    if (periodoPreset !== "personalizado") {
      const { inicio, fim } = getDatasParaPeriodo(periodoPreset)
      setDataInicio(inicio)
      setDataFim(fim)
    }
  }, [periodoPreset])

  useEffect(() => {
    loadLogoMenu()
    loadClientes()
    loadTipos()
    
    // Inicializar datas com o preset padrão "este_mes"
    const { inicio, fim } = getDatasParaPeriodo("este_mes")
    setDataInicio(inicio)
    setDataFim(fim)
  }, [])

  const loadLogoMenu = async () => {
    try {
      const response = await fetch("/api/configuracoes/logos")
      if (response.ok) {
        const result = await response.json()
        if (result.success && result.data?.length > 0) {
          const menuLogo = result.data.find((logo: any) => logo.tipo === "menu")
          if (menuLogo?.arquivo_base64) {
            setLogoMenu(menuLogo.arquivo_base64)
          }
        }
      }
    } catch (error) {
      console.error("Erro ao carregar logo do menu:", error)
    }
  }

  const loadClientes = async () => {
    try {
      const response = await fetch("/api/clientes")
      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setClientes(result.data || [])
        }
      }
    } catch (error) {
      console.error("Erro ao carregar clientes:", error)
    }
  }

  const loadTipos = async () => {
    try {
      const response = await fetch("/api/produtos")
      if (response.ok) {
        const result = await response.json()
        if (result.success && result.data) {
          const tiposUnicos = [...new Set(result.data.map((p: any) => p.tipo).filter(Boolean))]
          setTipos(tiposUnicos.map((tipo) => ({ id: tipo, nome: tipo })))
        }
      }
    } catch (error) {
      console.error("Erro ao carregar tipos:", error)
    }
  }

  const gerarRelatorio = async () => {
    try {
      setLoading(true)
      setError("")
      setRelatorioData(null)

      const params = new URLSearchParams({
        tipo: tipoRelatorio,
        dataInicio,
        dataFim,
        status,
        clienteId,
        categoriaId,
      })

      console.log("Gerando relatório com filtros:", { tipoRelatorio, dataInicio, dataFim, status, clienteId, categoriaId })

      const response = await fetch(`/api/relatorios?${params}`)
      const responseText = await response.text()

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${responseText}`)
      }

      let result
      try {
        result = JSON.parse(responseText)
      } catch (parseError) {
        throw new Error(`Erro ao processar resposta: ${responseText}`)
      }

      if (result.success) {
        setRelatorioData(result.data)
        if (result.data.tipos) {
          setTipos(result.data.tipos.map((t: any) => ({ id: t.tipo, nome: t.tipo })))
        }
        toast({
          title: "Sucesso!",
          description: "Relatório gerado com sucesso",
        })
      } else {
        setError(result.message || "Erro ao gerar relatório")
        toast({
          title: "Erro",
          description: result.message || "Erro ao gerar relatório",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Erro ao gerar relatório:", error)
      const errorMessage = error instanceof Error ? error.message : "Erro de conexão"
      setError(errorMessage)
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handlePrint = () => {
    const originalTitle = document.title
    document.title = getNomeRelatorio()
    window.print()
    setTimeout(() => {
      document.title = originalTitle
    }, 500)
  }

  const getNomeRelatorio = () => {
    let nome = "Relatório "
    
    switch (tipoRelatorio) {
      case "financeiro":
        nome += "Financeiro de Boletos"
        break
      case "orcamentos":
        nome += "de Orçamentos"
        break
      case "ordens_servico":
        nome += "de Ordens de Serviço"
        break
      case "clientes":
        nome += "de Clientes"
        break
      case "produtos":
        nome += "de Produtos & Serviços"
        break
      case "notas_fiscais":
        nome += "de Notas Fiscais"
        break
      case "propostas_contratos":
        nome += "de Propostas de Contratos"
        break
      case "contratos_ativos":
        nome += "de Contratos Ativos"
        break
      case "usuarios":
        nome += "de Usuários"
        break
      case "logs_sistema":
        nome += "de Logs do Sistema"
        break
      case "feriados":
        nome += "de Feriados"
        break
      case "equipamentos":
        nome += "de Equipamentos"
        break
      default:
        nome += "Geral"
    }

    if (status && status !== "todos") {
      let statusLabel = status
      if (status === "pago") statusLabel = "Pagos"
      if (status === "vencidos") statusLabel = "Vencidos"
      if (status === "vencer") statusLabel = "A Vencer"
      if (status === "pendente") statusLabel = "Pendentes"
      if (status === "aprovado") statusLabel = "Aprovados"
      if (status === "rejeitado") statusLabel = "Rejeitados"
      if (status === "concluido" || status === "concluído") statusLabel = "Concluídos"
      if (status === "finalizada") statusLabel = "Finalizadas"
      if (status === "agendada") statusLabel = "Agendadas"
      if (status === "em_andamento") statusLabel = "Em Andamento"
      if (status === "cancelada") statusLabel = "Canceladas"
      if (status === "rascunho") statusLabel = "Rascunhos"
      if (status === "baixo_estoque") statusLabel = "Baixo Estoque"
      if (status === "sem_estoque") statusLabel = "Sem Estoque"
      if (status === "autorizada") statusLabel = "Autorizadas"
      if (status === "enviada") statusLabel = "Enviadas"
      if (status === "aprovada") statusLabel = "Aprovadas"
      if (status === "rejeitada") statusLabel = "Rejeitadas"
      if (status === "ativo") statusLabel = "Ativos"
      if (status === "suspenso") statusLabel = "Suspensos"
      if (status === "finalizado") statusLabel = "Finalizados"
      if (status === "info") statusLabel = "Informação"
      if (status === "warning") statusLabel = "Aviso"
      if (status === "error") statusLabel = "Erro"
      if (status === "nacional") statusLabel = "Nacionais"
      if (status === "estadual") statusLabel = "Estaduais"
      if (status === "municipal") statusLabel = "Municipais"
      if (status === "personalizado") statusLabel = "Personalizados"
      
      nome += ` (${statusLabel})`
    }

    if (clienteId && clienteId !== "todos") {
      const clienteObj = clientes.find(c => c.id.toString() === clienteId)
      if (clienteObj) {
        nome += ` - Cliente: ${clienteObj.nome}`
      }
    }

    return nome
  }

  const exportToCSV = () => {
    if (!relatorioData) return

    let headers: string[] = []
    let rows: any[][] = []

    if (tipoRelatorio === "clientes" && relatorioData.clientes) {
      headers = ["Nome", "Email", "Cidade", "Estado", "Total Orçamentos", "Valor Orçamentos", "Total Boletos", "Valor Boletos"]
      rows = relatorioData.clientes.map((c: any) => [
        c.nome, c.email, c.cidade, c.estado, c.total_orcamentos, c.valor_orcamentos, c.total_boletos, c.valor_boletos
      ])
    } else if (tipoRelatorio === "produtos" && relatorioData.produtos) {
      headers = ["Código", "Nome", "Tipo", "Marca", "Preço Venda", "Estoque Atual", "Quantidade Vendida", "Valor Vendido"]
      rows = relatorioData.produtos.map((p: any) => [
        p.codigo, p.nome, p.tipo, p.marca, p.preco_venda, p.estoque_atual, p.quantidade_vendida, p.valor_vendido
      ])
    } else if (tipoRelatorio === "orcamentos" && relatorioData.orcamentos) {
      headers = ["Número", "Cliente", "Data Criação", "Valor Total", "Situação", "Itens"]
      rows = (relatorioData.orcamentos as any[]).map((o: any) => [
        o.numero, o.cliente_nome, formatDate(o.created_at), o.valor_total, o.situacao, o.total_itens
      ])
    } else if (tipoRelatorio === "financeiro" && relatorioData.boletos) {
      headers = ["Número", "Cliente", "Vencimento", "Pagamento", "Valor", "Status"]
      rows = (relatorioData.boletos as any[]).map((b: any) => [
        b.numero, b.cliente_nome, formatDate(b.data_vencimento), b.data_pagamento ? formatDate(b.data_pagamento) : "-", b.valor, b.status
      ])
    } else if (tipoRelatorio === "notas_fiscais" && relatorioData.notasFiscais) {
      headers = ["Número NF-e", "Série", "Chave de Acesso", "Cliente", "Data Emissão", "Valor Total", "Status"]
      rows = relatorioData.notasFiscais.map((nf: any) => [
        nf.numero, nf.serie, nf.chave_acesso, nf.cliente_nome, formatDate(nf.data_emissao), nf.valor, nf.status
      ])
    } else if (tipoRelatorio === "propostas_contratos" && relatorioData.propostas) {
      headers = ["Número Proposta", "Cliente", "Data Proposta", "Tipo", "Valor Total", "Status"]
      rows = relatorioData.propostas.map((p: any) => [
        p.numero, p.cliente_nome, formatDate(p.data_proposta), p.tipo, p.valor, p.status
      ])
    } else if (tipoRelatorio === "contratos_ativos" && relatorioData.contratos) {
      headers = ["Número Contrato", "Cliente", "Data Início", "Data Fim", "Valor Mensal", "Status"]
      rows = relatorioData.contratos.map((c: any) => [
        c.numero, c.cliente_nome, formatDate(c.data_inicio), c.data_fim ? formatDate(c.data_fim) : "-", c.valor, c.status
      ])
    } else if (tipoRelatorio === "usuarios" && relatorioData.usuarios) {
      headers = ["ID", "Nome", "Email", "Tipo", "Ativo", "Data Criação"]
      rows = relatorioData.usuarios.map((u: any) => [
        u.id, u.nome, u.email, u.tipo, u.ativo ? "Sim" : "Não", formatDate(u.created_at)
      ])
    } else if (tipoRelatorio === "logs_sistema" && relatorioData.logs) {
      headers = ["ID", "Usuário", "Ação", "Módulo", "Tipo", "IP", "Data/Hora"]
      rows = relatorioData.logs.map((l: any) => [
        l.id, l.usuario_nome, l.acao, l.modulo, l.tipo, l.ip_address, formatDate(l.data_hora)
      ])
    } else if (tipoRelatorio === "feriados" && relatorioData.feriados) {
      headers = ["Data", "Nome", "Tipo", "Recorrente", "Ativo"]
      rows = relatorioData.feriados.map((f: any) => [
        formatDate(f.data), f.nome, f.tipo, f.recorrente ? "Sim" : "Não", f.ativo ? "Sim" : "Não"
      ])
    } else if (tipoRelatorio === "equipamentos" && relatorioData.equipamentos) {
      headers = ["ID", "Nome", "Categoria", "Valor Hora", "Descrição", "Ativo"]
      rows = relatorioData.equipamentos.map((e: any) => [
        e.id, e.nome, e.categoria, e.valor_hora, e.descricao || "-", e.ativo ? "Sim" : "Não"
      ])
    }

    if (headers.length === 0) return

    // Construir CSV
    const BOM = "\uFEFF"
    const csvRows = [
      headers.join(";"),
      ...rows.map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(";"))
    ]
    const csvContent = BOM + csvRows.join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    const fileName = `${getNomeRelatorio().toLowerCase().replace(/[^a-z0-9а-я]+/g, "_")}_${new Date().toISOString().split("T")[0]}.csv`
    link.setAttribute("download", fileName)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const renderFiltros = () => {
    return (
      <div className="space-y-4">
        {/* Tipo de Relatório */}
        <div>
          <Label htmlFor="tipo" className="font-semibold text-gray-700">Tipo de Relatório</Label>
          <Select
            value={tipoRelatorio}
            onValueChange={(value) => {
              setTipoRelatorio(value)
              setStatus("todos")
              setClienteId("todos")
              setCategoriaId("todos")
            }}
          >
            <SelectTrigger className="bg-white border-gray-200 mt-1">
              <SelectValue placeholder="Selecione o tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="financeiro">📊 Relatório Financeiro (Boletos)</SelectItem>
              <SelectItem value="orcamentos">📝 Relatório de Orçamentos</SelectItem>
              <SelectItem value="ordens_servico">🔧 Relatório de Ordens de Serviço</SelectItem>
              <SelectItem value="clientes">👥 Relatório de Clientes</SelectItem>
              <SelectItem value="produtos">📦 Relatório de Produtos</SelectItem>
              <SelectItem value="notas_fiscais">🧾 Relatório de Notas Fiscais</SelectItem>
              <SelectItem value="propostas_contratos">💼 Relatório de Propostas de Contrato</SelectItem>
              <SelectItem value="contratos_ativos">🤝 Relatório de Contratos Ativos</SelectItem>
              <SelectItem value="usuarios">👥 Relatório de Usuários</SelectItem>
              <SelectItem value="logs_sistema">📋 Relatório de Logs do Sistema</SelectItem>
              <SelectItem value="feriados">📅 Relatório de Feriados</SelectItem>
              <SelectItem value="equipamentos">🛠️ Relatório de Equipamentos</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Preset de Período */}
        <div>
          <Label htmlFor="preset-periodo" className="font-semibold text-gray-700">Período</Label>
          <Select value={periodoPreset} onValueChange={setPeriodoPreset}>
            <SelectTrigger className="bg-white border-gray-200 mt-1">
              <SelectValue placeholder="Selecione o período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="este_mes">Este Mês</SelectItem>
              <SelectItem value="mes_passado">Mês Passado</SelectItem>
              <SelectItem value="30">Últimos 30 Dias</SelectItem>
              <SelectItem value="90">Últimos 90 Dias</SelectItem>
              <SelectItem value="este_ano">Este Ano</SelectItem>
              <SelectItem value="personalizado">Personalizado...</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Datas Customizadas */}
        {periodoPreset === "personalizado" && (
          <div className="grid grid-cols-2 gap-2 animate-in slide-in-from-top-2 duration-200">
            <div>
              <Label htmlFor="data-inicio" className="text-xs text-gray-600">Início</Label>
              <Input
                id="data-inicio"
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
                className="bg-white border-gray-200 mt-0.5"
              />
            </div>
            <div>
              <Label htmlFor="data-fim" className="text-xs text-gray-600">Fim</Label>
              <Input
                id="data-fim"
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
                className="bg-white border-gray-200 mt-0.5"
              />
            </div>
          </div>
        )}

        {/* Filtros de Status */}
        {(tipoRelatorio === "orcamentos" || tipoRelatorio === "financeiro" || tipoRelatorio === "ordens_servico" || tipoRelatorio === "notas_fiscais" || tipoRelatorio === "propostas_contratos" || tipoRelatorio === "contratos_ativos" || tipoRelatorio === "usuarios" || tipoRelatorio === "logs_sistema" || tipoRelatorio === "feriados" || tipoRelatorio === "equipamentos") && (
          <div>
            <Label htmlFor="status" className="font-semibold text-gray-700">Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="bg-white border-gray-200 mt-1">
                <SelectValue placeholder="Selecione o status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                {tipoRelatorio === "orcamentos" && (
                  <>
                    <SelectItem value="pendente">Pendentes</SelectItem>
                    <SelectItem value="aprovado">Aprovados</SelectItem>
                    <SelectItem value="rejeitado">Rejeitados</SelectItem>
                    <SelectItem value="concluido">Concluídos</SelectItem>
                  </>
                )}
                {tipoRelatorio === "financeiro" && (
                  <>
                    <SelectItem value="pendente">Pendentes</SelectItem>
                    <SelectItem value="pago">Pagos</SelectItem>
                    <SelectItem value="vencidos">Vencidos</SelectItem>
                    <SelectItem value="vencer">A Vencer (7 dias)</SelectItem>
                  </>
                )}
                {tipoRelatorio === "ordens_servico" && (
                  <>
                    <SelectItem value="rascunho">Rascunho</SelectItem>
                    <SelectItem value="agendada">Agendada</SelectItem>
                    <SelectItem value="em_andamento">Em Andamento</SelectItem>
                    <SelectItem value="finalizada">Finalizada</SelectItem>
                    <SelectItem value="cancelada">Cancelada</SelectItem>
                  </>
                )}
                {tipoRelatorio === "notas_fiscais" && (
                  <>
                    <SelectItem value="autorizada">Autorizadas</SelectItem>
                    <SelectItem value="cancelada">Canceladas</SelectItem>
                    <SelectItem value="erro">Com Erro</SelectItem>
                  </>
                )}
                {tipoRelatorio === "propostas_contratos" && (
                  <>
                    <SelectItem value="rascunho">Rascunho</SelectItem>
                    <SelectItem value="enviada">Enviada</SelectItem>
                    <SelectItem value="aprovada">Aprovada</SelectItem>
                    <SelectItem value="rejeitada">Rejeitada</SelectItem>
                  </>
                )}
                {tipoRelatorio === "contratos_ativos" && (
                  <>
                    <SelectItem value="ativo">Ativo</SelectItem>
                    <SelectItem value="suspenso">Suspenso</SelectItem>
                    <SelectItem value="cancelado">Cancelado</SelectItem>
                    <SelectItem value="finalizado">Finalizado</SelectItem>
                  </>
                )}
                {(tipoRelatorio === "usuarios" || tipoRelatorio === "equipamentos") && (
                  <>
                    <SelectItem value="ativo">Ativos</SelectItem>
                    <SelectItem value="inativo">Inativos</SelectItem>
                  </>
                )}
                {tipoRelatorio === "logs_sistema" && (
                  <>
                    <SelectItem value="info">Informação (Info)</SelectItem>
                    <SelectItem value="warning">Aviso (Warning)</SelectItem>
                    <SelectItem value="error">Erro (Error)</SelectItem>
                  </>
                )}
                {tipoRelatorio === "feriados" && (
                  <>
                    <SelectItem value="nacional">Nacional</SelectItem>
                    <SelectItem value="estadual">Estadual</SelectItem>
                    <SelectItem value="municipal">Municipal</SelectItem>
                    <SelectItem value="personalizado">Personalizado</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Tipo de Produto */}
        {tipoRelatorio === "produtos" && (
          <>
            <div>
              <Label htmlFor="categoria" className="font-semibold text-gray-700">Tipo de Produto</Label>
              <Select value={categoriaId} onValueChange={setCategoriaId}>
                <SelectTrigger className="bg-white border-gray-200 mt-1">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  {tipos.map((tipo) => (
                    <SelectItem key={tipo.id} value={tipo.id.toString()}>
                      {tipo.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="situacao-estoque" className="font-semibold text-gray-700">Situação do Estoque</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="bg-white border-gray-200 mt-1">
                  <SelectValue placeholder="Selecione a situação" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="baixo_estoque">Baixo Estoque</SelectItem>
                  <SelectItem value="sem_estoque">Sem Estoque</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        )}

        {/* Cliente */}
        {(tipoRelatorio === "clientes" || tipoRelatorio === "orcamentos" || tipoRelatorio === "financeiro" || tipoRelatorio === "ordens_servico" || tipoRelatorio === "notas_fiscais" || tipoRelatorio === "propostas_contratos" || tipoRelatorio === "contratos_ativos") && (
          <div>
            <Label htmlFor="cliente" className="font-semibold text-gray-700">Cliente</Label>
            <ClienteFilter value={clienteId} onValueChange={setClienteId} clientes={clientes} />
          </div>
        )}
      </div>
    )
  }

  // RENDERIZAÇÃO DOS RELATÓRIOS INDIVIDUAIS
  const renderClientes = () => {
    if (!relatorioData?.clientes) return null
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200 shadow-sm flex items-center gap-4">
            <Users className="h-10 w-10 text-blue-600 bg-white p-2 rounded-lg shadow-sm" />
            <div>
              <div className="text-2xl font-bold text-blue-900">{relatorioData.total || 0}</div>
              <div className="text-xs font-semibold text-blue-700 uppercase tracking-wider">Clientes Filtrados</div>
            </div>
          </div>
        </div>

        <Card className="border-0 shadow-lg bg-white overflow-hidden">
          <CardHeader className="bg-slate-50 border-b border-slate-100 py-4">
            <CardTitle className="text-lg text-slate-800">Listagem de Clientes</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-700">
                <thead className="bg-slate-100/50 uppercase text-[11px] font-bold text-gray-500 border-b border-gray-200">
                  <tr>
                    <th className="p-4">Nome / Email</th>
                    <th className="p-4">Localização</th>
                    <th className="p-4 text-center">Orçamentos</th>
                    <th className="p-4 text-right">Total Orçamentos</th>
                    <th className="p-4 text-center">Boletos</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-150">
                  {relatorioData.clientes.map((cliente: any) => (
                    <tr key={cliente.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4">
                        <div className="font-semibold text-gray-900">{cliente.nome}</div>
                        <div className="text-xs text-gray-500">{cliente.email}</div>
                      </td>
                      <td className="p-4 text-xs">
                        {cliente.cidade ? `${cliente.cidade}, ${cliente.estado}` : "-"}
                      </td>
                      <td className="p-4 text-center text-xs font-medium">{cliente.total_orcamentos || 0}</td>
                      <td className="p-4 text-right font-bold text-green-600">{formatCurrency(cliente.valor_orcamentos || 0)}</td>
                      <td className="p-4 text-center text-xs font-medium">{cliente.total_boletos || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const renderProdutos = () => {
    if (!relatorioData?.produtos) return null
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl border border-indigo-200 shadow-sm flex items-center gap-4">
            <Package className="h-10 w-10 text-indigo-600 bg-white p-2 rounded-lg shadow-sm" />
            <div>
              <div className="text-2xl font-bold text-indigo-900">{relatorioData.total || 0}</div>
              <div className="text-xs font-semibold text-indigo-700 uppercase tracking-wider">Produtos no Relatório</div>
            </div>
          </div>
        </div>

        <Card className="border-0 shadow-lg bg-white overflow-hidden">
          <CardHeader className="bg-slate-50 border-b border-slate-100 py-4">
            <CardTitle className="text-lg text-slate-800">Estoque & Vendas</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-700">
                <thead className="bg-slate-100/50 uppercase text-[11px] font-bold text-gray-500 border-b border-gray-200">
                  <tr>
                    <th className="p-4">Código / Descrição</th>
                    <th className="p-4">Tipo / Marca</th>
                    <th className="p-4 text-right">Preço de Venda</th>
                    <th className="p-4 text-center">Estoque Atual</th>
                    <th className="p-4 text-center">Qtd. Vendida</th>
                    <th className="p-4 text-right">Total Vendido</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-150">
                  {relatorioData.produtos.map((produto: any) => (
                    <tr key={produto.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4">
                        <Badge variant="outline" className="font-mono text-[10px] mb-1">{produto.codigo}</Badge>
                        <div className="font-semibold text-gray-900">{produto.nome}</div>
                      </td>
                      <td className="p-4 text-xs text-gray-600">
                        {produto.tipo} / {produto.marca}
                      </td>
                      <td className="p-4 text-right font-medium">{formatCurrency(produto.preco_venda || 0)}</td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <span className="font-semibold text-sm">{produto.estoque_atual}</span>
                          {produto.estoque_atual <= produto.estoque_minimo && (
                            <Badge variant="destructive" className="text-[9px] px-1 py-0 h-4 animate-pulse">Min</Badge>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-center text-xs font-semibold text-slate-600">{produto.quantidade_vendida}x</td>
                      <td className="p-4 text-right font-bold text-green-600">{formatCurrency(produto.valor_vendido || 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const renderOrcamentos = () => {
    if (!relatorioData?.orcamentos) return null
    return (
      <div className="space-y-4">
        {/* Cards de Métricas */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200 shadow-sm">
            <div className="text-2xl font-bold text-blue-900">{relatorioData.total || 0}</div>
            <div className="text-xs font-semibold text-blue-700 uppercase tracking-wider mt-1">Total Orçamentos</div>
            <div className="text-sm font-bold text-blue-800 mt-2">{formatCurrency(relatorioData.valorTotal || 0)}</div>
          </div>
          <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200 shadow-sm">
            <div className="text-2xl font-bold text-green-900">{relatorioData.estatisticas?.aprovados || 0}</div>
            <div className="text-xs font-semibold text-green-700 uppercase tracking-wider mt-1">Aprovados</div>
          </div>
          <div className="p-4 bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl border border-amber-200 shadow-sm">
            <div className="text-2xl font-bold text-amber-900">{relatorioData.estatisticas?.pendentes || 0}</div>
            <div className="text-xs font-semibold text-amber-700 uppercase tracking-wider mt-1">Pendentes</div>
          </div>
          <div className="p-4 bg-gradient-to-br from-red-50 to-red-100 rounded-xl border border-red-200 shadow-sm">
            <div className="text-2xl font-bold text-red-900">{relatorioData.estatisticas?.rejeitados || 0}</div>
            <div className="text-xs font-semibold text-red-700 uppercase tracking-wider mt-1">Rejeitados</div>
          </div>
        </div>

        {/* Tabela de Orçamentos */}
        <Card className="border-0 shadow-lg bg-white overflow-hidden">
          <CardHeader className="bg-slate-50 border-b border-slate-100 py-4">
            <CardTitle className="text-lg text-slate-800">Orçamentos Gerados</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-700">
                <thead className="bg-slate-100/50 uppercase text-[11px] font-bold text-gray-500 border-b border-gray-200">
                  <tr>
                    <th className="p-4">Número</th>
                    <th className="p-4">Cliente</th>
                    <th className="p-4">Criado em</th>
                    <th className="p-4 text-center">Itens</th>
                    <th className="p-4 text-right">Valor Total</th>
                    <th className="p-4 text-center">Situação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-150">
                  {relatorioData.orcamentos.map((orcamento: any) => (
                    <tr key={orcamento.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 font-semibold font-mono text-xs">#{orcamento.numero}</td>
                      <td className="p-4">
                        <div className="font-semibold text-gray-900">{orcamento.cliente_nome}</div>
                      </td>
                      <td className="p-4 text-xs">{formatDate(orcamento.created_at)}</td>
                      <td className="p-4 text-center text-xs font-medium">{orcamento.total_itens} itens</td>
                      <td className="p-4 text-right font-bold text-slate-900">{formatCurrency(orcamento.valor_total || 0)}</td>
                      <td className="p-4 text-center">
                        <Badge
                          variant={
                            orcamento.situacao === "aprovado"
                              ? "default"
                              : orcamento.situacao === "pendente"
                                ? "secondary"
                                : "destructive"
                          }
                          className="text-xs uppercase"
                        >
                          {orcamento.situacao}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const renderFinanceiro = () => {
    if (!relatorioData?.boletos) return null
    return (
      <div className="space-y-4">
        {/* Cards de Estatísticas Financeiras */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200 shadow-sm">
            <div className="text-2xl font-bold text-green-950">{relatorioData.estatisticas?.pagos || 0}</div>
            <div className="text-xs font-bold text-green-700 uppercase tracking-wider mt-1">Boletos Pagos</div>
            <div className="text-lg font-bold text-green-800 mt-2">{formatCurrency(relatorioData.estatisticas?.valorPago || 0)}</div>
          </div>
          <div className="p-4 bg-gradient-to-br from-red-50 to-red-100 rounded-xl border border-red-200 shadow-sm">
            <div className="text-2xl font-bold text-red-950">{relatorioData.estatisticas?.vencidos || 0}</div>
            <div className="text-xs font-bold text-red-700 uppercase tracking-wider mt-1">Boletos Vencidos</div>
            <div className="text-lg font-bold text-red-800 mt-2">{formatCurrency(relatorioData.estatisticas?.valorVencido || 0)}</div>
          </div>
          <div className="p-4 bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl border border-amber-200 shadow-sm">
            <div className="text-2xl font-bold text-amber-950">{relatorioData.estatisticas?.pendentes || 0}</div>
            <div className="text-xs font-bold text-amber-700 uppercase tracking-wider mt-1">A Vencer / Pendentes</div>
            <div className="text-lg font-bold text-amber-800 mt-2">{formatCurrency(relatorioData.estatisticas?.valorPendente || 0)}</div>
          </div>
        </div>

        {/* Tabela de Boletos */}
        <Card className="border-0 shadow-lg bg-white overflow-hidden">
          <CardHeader className="bg-slate-50 border-b border-slate-100 py-4">
            <CardTitle className="text-lg text-slate-800">Lançamentos Financeiros</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-700">
                <thead className="bg-slate-100/50 uppercase text-[11px] font-bold text-gray-500 border-b border-gray-200">
                  <tr>
                    <th className="p-4">Boleto / Ref</th>
                    <th className="p-4">Cliente</th>
                    <th className="p-4">Data Vencimento</th>
                    <th className="p-4 text-right">Valor</th>
                    <th className="p-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-150">
                  {relatorioData.boletos.map((boleto: any) => (
                    <tr key={boleto.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 font-semibold font-mono text-xs">#{boleto.numero}</td>
                      <td className="p-4">
                        <div className="font-semibold text-gray-900">{boleto.cliente_nome}</div>
                      </td>
                      <td className="p-4 text-xs">
                        <div>{formatDate(boleto.data_vencimento)}</div>
                        {boleto.data_pagamento && (
                          <div className="text-[10px] text-green-600 font-semibold">Pago em: {formatDate(boleto.data_pagamento)}</div>
                        )}
                      </td>
                      <td className="p-4 text-right font-bold text-slate-900">{formatCurrency(boleto.valor || 0)}</td>
                      <td className="p-4">
                        <Badge
                          variant={
                            boleto.status === "pago"
                              ? "default"
                              : boleto.dias_vencimento > 0
                                ? "destructive"
                                : "secondary"
                          }
                          className="text-xs uppercase"
                        >
                          {boleto.status === "pago"
                            ? "Pago"
                            : boleto.dias_vencimento > 0
                              ? `Vencido (${boleto.dias_vencimento}d)`
                              : "Pendente"}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const renderOrdensServico = () => {
    if (!relatorioData?.ordensServico) return null
    return (
      <div className="space-y-4">
        {/* Métricas Gerais de OS */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="p-3 bg-white rounded-xl border border-gray-200 shadow-sm text-center">
            <div className="text-xl font-bold text-gray-900">{relatorioData.total || 0}</div>
            <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Total OS</div>
          </div>
          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 shadow-sm text-center">
            <div className="text-xl font-bold text-emerald-900">{relatorioData.estatisticas?.finalizadas || 0}</div>
            <div className="text-[10px] font-semibold text-emerald-700 uppercase tracking-wider">Finalizadas</div>
          </div>
          <div className="p-3 bg-blue-50 rounded-xl border border-blue-200 shadow-sm text-center">
            <div className="text-xl font-bold text-blue-900">{relatorioData.estatisticas?.agendadas || 0}</div>
            <div className="text-[10px] font-semibold text-blue-700 uppercase tracking-wider">Agendadas</div>
          </div>
          <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-200 shadow-sm text-center">
            <div className="text-xl font-bold text-indigo-900">{relatorioData.estatisticas?.emAndamento || 0}</div>
            <div className="text-[10px] font-semibold text-indigo-700 uppercase tracking-wider">Em Andamento</div>
          </div>
          <div className="p-3 bg-red-50 rounded-xl border border-red-200 shadow-sm text-center">
            <div className="text-xl font-bold text-red-900">{relatorioData.estatisticas?.canceladas || 0}</div>
            <div className="text-[10px] font-semibold text-red-700 uppercase tracking-wider">Canceladas</div>
          </div>
        </div>

        {/* Gráfico / Sumário de Técnicos e Tipos */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Por Tipo de Serviço */}
          <Card className="border-0 shadow-md bg-white">
            <CardHeader className="py-3 bg-slate-50 border-b border-slate-100">
              <CardTitle className="text-sm font-bold text-slate-800">Ordens por Tipo de Serviço</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-2">
              {relatorioData.estatisticas?.tipos?.length > 0 ? (
                relatorioData.estatisticas.tipos.map((item: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center text-sm border-b border-gray-100 pb-1">
                    <span className="font-medium text-gray-700">{item.nome}</span>
                    <Badge className="bg-slate-100 text-slate-800 border-0">{item.total} OS</Badge>
                  </div>
                ))
              ) : (
                <div className="text-center text-xs text-gray-400 py-4">Sem dados agrupados</div>
              )}
            </CardContent>
          </Card>

          {/* Por Técnico */}
          <Card className="border-0 shadow-md bg-white">
            <CardHeader className="py-3 bg-slate-50 border-b border-slate-100">
              <CardTitle className="text-sm font-bold text-slate-800">Ordens por Técnico</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-2">
              {relatorioData.estatisticas?.tecnicos?.length > 0 ? (
                relatorioData.estatisticas.tecnicos.map((item: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center text-sm border-b border-gray-100 pb-1">
                    <span className="font-medium text-gray-700">{item.nome}</span>
                    <Badge className="bg-slate-100 text-slate-800 border-0">{item.total} OS</Badge>
                  </div>
                ))
              ) : (
                <div className="text-center text-xs text-gray-400 py-4">Sem dados agrupados</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Tabela de Ordens de Serviço */}
        <Card className="border-0 shadow-lg bg-white overflow-hidden">
          <CardHeader className="bg-slate-50 border-b border-slate-100 py-4">
            <CardTitle className="text-lg text-slate-800">Ordens de Serviço Listadas</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-700">
                <thead className="bg-slate-100/50 uppercase text-[11px] font-bold text-gray-500 border-b border-gray-200">
                  <tr>
                    <th className="p-4">Número</th>
                    <th className="p-4">Cliente</th>
                    <th className="p-4">Técnico</th>
                    <th className="p-4">Serviço</th>
                    <th className="p-4">Agendamento</th>
                    <th className="p-4 text-center">Situação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-150">
                  {relatorioData.ordensServico.map((os: any) => (
                    <tr key={os.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 font-semibold font-mono text-xs">#{os.numero}</td>
                      <td className="p-4">
                        <div className="font-semibold text-gray-900">{os.cliente_nome}</div>
                      </td>
                      <td className="p-4 text-xs text-gray-600">{os.tecnico_name || "-"}</td>
                      <td className="p-4 text-xs font-medium">{os.tipo_servico}</td>
                      <td className="p-4 text-xs">
                        {os.data_agendamento ? formatDate(os.data_agendamento) : "-"}
                      </td>
                      <td className="p-4 text-center">
                        <Badge
                          variant={
                            os.situacao === "finalizada"
                              ? "default"
                              : os.situacao === "cancelada"
                                ? "destructive"
                                : "secondary"
                          }
                          className="text-xs uppercase"
                        >
                          {os.situacao}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const renderNotasFiscais = () => {
    if (!relatorioData?.notasFiscais) return null
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200 shadow-sm">
            <div className="text-2xl font-bold text-blue-900">{relatorioData.total || 0}</div>
            <div className="text-xs font-semibold text-blue-700 uppercase tracking-wider mt-1">Total Notas Fiscais</div>
            <div className="text-lg font-bold text-blue-800 mt-2">{formatCurrency(relatorioData.valorTotal || 0)}</div>
          </div>
          <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200 shadow-sm">
            <div className="text-2xl font-bold text-green-900">{relatorioData.estatisticas?.autorizadas || 0}</div>
            <div className="text-xs font-semibold text-green-700 uppercase tracking-wider mt-1">Autorizadas</div>
          </div>
          <div className="p-4 bg-gradient-to-br from-red-50 to-red-100 rounded-xl border border-red-200 shadow-sm">
            <div className="text-2xl font-bold text-red-900">{relatorioData.estatisticas?.canceladas || 0}</div>
            <div className="text-xs font-semibold text-red-700 uppercase tracking-wider mt-1">Canceladas</div>
          </div>
        </div>

        <Card className="border-0 shadow-lg bg-white overflow-hidden">
          <CardHeader className="bg-slate-50 border-b border-slate-100 py-4">
            <CardTitle className="text-lg text-slate-800">Notas Fiscais Emitidas</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-700">
                <thead className="bg-slate-100/50 uppercase text-[11px] font-bold text-gray-500 border-b border-gray-200">
                  <tr>
                    <th className="p-4">Número / Série</th>
                    <th className="p-4">Chave de Acesso</th>
                    <th className="p-4">Cliente</th>
                    <th className="p-4">Data Emissão</th>
                    <th className="p-4 text-right">Valor Total</th>
                    <th className="p-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-150">
                  {relatorioData.notasFiscais.map((nf: any) => (
                    <tr key={nf.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 font-semibold font-mono text-xs">#{nf.numero} / S.{nf.serie}</td>
                      <td className="p-4 text-xs font-mono text-gray-500 max-w-[150px] truncate">{nf.chave_acesso || "-"}</td>
                      <td className="p-4 font-medium text-gray-900">{nf.cliente_nome}</td>
                      <td className="p-4 text-xs">{formatDate(nf.data_emissao)}</td>
                      <td className="p-4 text-right font-bold text-slate-900">{formatCurrency(nf.valor || 0)}</td>
                      <td className="p-4 text-center">
                        <Badge
                          variant={
                            nf.status === "autorizada" || nf.status === "transmitida" || nf.status === "sucesso"
                              ? "default"
                              : "destructive"
                          }
                          className="text-xs uppercase"
                        >
                          {nf.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const renderPropostasContratos = () => {
    if (!relatorioData?.propostas) return null
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="p-4 bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl border border-indigo-200 shadow-sm">
            <div className="text-2xl font-bold text-indigo-900">{relatorioData.total || 0}</div>
            <div className="text-xs font-semibold text-indigo-700 uppercase tracking-wider mt-1">Total Propostas</div>
            <div className="text-lg font-bold text-indigo-800 mt-2">{formatCurrency(relatorioData.valorTotal || 0)}</div>
          </div>
          <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200 shadow-sm">
            <div className="text-2xl font-bold text-green-900">{relatorioData.estatisticas?.aprovadas || 0}</div>
            <div className="text-xs font-semibold text-green-700 uppercase tracking-wider mt-1">Aprovadas</div>
          </div>
          <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200 shadow-sm">
            <div className="text-2xl font-bold text-blue-900">{relatorioData.estatisticas?.enviadas || 0}</div>
            <div className="text-xs font-semibold text-blue-700 uppercase tracking-wider mt-1">Enviadas</div>
          </div>
          <div className="p-4 bg-gradient-to-br from-red-50 to-red-100 rounded-xl border border-red-200 shadow-sm">
            <div className="text-2xl font-bold text-red-900">{relatorioData.estatisticas?.rejeitadas || 0}</div>
            <div className="text-xs font-semibold text-red-700 uppercase tracking-wider mt-1">Rejeitadas</div>
          </div>
        </div>

        <Card className="border-0 shadow-lg bg-white overflow-hidden">
          <CardHeader className="bg-slate-50 border-b border-slate-100 py-4">
            <CardTitle className="text-lg text-slate-800">Propostas de Contratos</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-700">
                <thead className="bg-slate-100/50 uppercase text-[11px] font-bold text-gray-500 border-b border-gray-200">
                  <tr>
                    <th className="p-4">Número</th>
                    <th className="p-4">Cliente</th>
                    <th className="p-4">Data Proposta</th>
                    <th className="p-4">Tipo</th>
                    <th className="p-4 text-right">Valor Total</th>
                    <th className="p-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-150">
                  {relatorioData.propostas.map((p: any) => (
                    <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 font-semibold font-mono text-xs">#{p.numero}</td>
                      <td className="p-4 font-medium text-gray-900">{p.cliente_nome}</td>
                      <td className="p-4 text-xs">{formatDate(p.data_proposta)}</td>
                      <td className="p-4 text-xs uppercase">{p.tipo}</td>
                      <td className="p-4 text-right font-bold text-slate-900">{formatCurrency(p.valor || 0)}</td>
                      <td className="p-4 text-center">
                        <Badge
                          variant={
                            p.status === "aprovada" || p.status === "aprovado"
                              ? "default"
                              : p.status === "rejeitada" || p.status === "rejeitado"
                                ? "destructive"
                                : "secondary"
                          }
                          className="text-xs uppercase"
                        >
                          {p.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const renderContratosAtivos = () => {
    if (!relatorioData?.contratos) return null
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="p-4 bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl border border-indigo-200 shadow-sm">
            <div className="text-2xl font-bold text-indigo-900">{relatorioData.total || 0}</div>
            <div className="text-xs font-semibold text-indigo-700 uppercase tracking-wider mt-1">Total Contratos</div>
            <div className="text-lg font-bold text-indigo-800 mt-2">{formatCurrency(relatorioData.valorTotal || 0)}/mês</div>
          </div>
          <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200 shadow-sm">
            <div className="text-2xl font-bold text-green-900">{relatorioData.estatisticas?.ativos || 0}</div>
            <div className="text-xs font-semibold text-green-700 uppercase tracking-wider mt-1">Ativos</div>
          </div>
          <div className="p-4 bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl border border-amber-200 shadow-sm">
            <div className="text-2xl font-bold text-amber-900">{relatorioData.estatisticas?.suspensos || 0}</div>
            <div className="text-xs font-semibold text-amber-700 uppercase tracking-wider mt-1">Suspensos</div>
          </div>
          <div className="p-4 bg-gradient-to-br from-red-50 to-red-100 rounded-xl border border-red-200 shadow-sm">
            <div className="text-2xl font-bold text-red-900">{relatorioData.estatisticas?.cancelados || 0}</div>
            <div className="text-xs font-semibold text-red-700 uppercase tracking-wider mt-1">Cancelados</div>
          </div>
        </div>

        <Card className="border-0 shadow-lg bg-white overflow-hidden">
          <CardHeader className="bg-slate-50 border-b border-slate-100 py-4">
            <CardTitle className="text-lg text-slate-800">Contratos de Conservação</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-700">
                <thead className="bg-slate-100/50 uppercase text-[11px] font-bold text-gray-500 border-b border-gray-200">
                  <tr>
                    <th className="p-4">Número</th>
                    <th className="p-4">Cliente</th>
                    <th className="p-4">Data Início</th>
                    <th className="p-4">Data Fim</th>
                    <th className="p-4 text-right">Valor Mensal</th>
                    <th className="p-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-150">
                  {relatorioData.contratos.map((c: any) => (
                    <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 font-semibold font-mono text-xs">#{c.numero}</td>
                      <td className="p-4 font-medium text-gray-900">{c.cliente_nome}</td>
                      <td className="p-4 text-xs">{formatDate(c.data_inicio)}</td>
                      <td className="p-4 text-xs">{c.data_fim ? formatDate(c.data_fim) : "Indeterminado"}</td>
                      <td className="p-4 text-right font-bold text-slate-900">{formatCurrency(c.valor || 0)}</td>
                      <td className="p-4 text-center">
                        <Badge
                          variant={c.status === "ativo" ? "default" : c.status === "suspenso" ? "secondary" : "destructive"}
                          className="text-xs uppercase"
                        >
                          {c.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const renderUsuarios = () => {
    if (!relatorioData?.usuarios) return null
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200 shadow-sm flex items-center gap-4">
            <Users className="h-10 w-10 text-blue-600 bg-white p-2 rounded-lg shadow-sm" />
            <div>
              <div className="text-2xl font-bold text-blue-900">{relatorioData.total || 0}</div>
              <div className="text-xs font-semibold text-blue-700 uppercase tracking-wider">Total Usuários</div>
            </div>
          </div>
          <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200 shadow-sm">
            <div className="text-2xl font-bold text-green-900">{relatorioData.estatisticas?.ativos || 0}</div>
            <div className="text-xs font-semibold text-green-700 uppercase tracking-wider mt-1">Ativos</div>
          </div>
          <div className="p-4 bg-gradient-to-br from-slate-50 to-slate-200 rounded-xl border border-slate-300 shadow-sm">
            <div className="text-2xl font-bold text-slate-900">{relatorioData.estatisticas?.inativos || 0}</div>
            <div className="text-xs font-semibold text-slate-700 uppercase tracking-wider mt-1">Inativos</div>
          </div>
        </div>

        <Card className="border-0 shadow-lg bg-white overflow-hidden">
          <CardHeader className="bg-slate-50 border-b border-slate-100 py-4">
            <CardTitle className="text-lg text-slate-800">Usuários do Sistema</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-700">
                <thead className="bg-slate-100/50 uppercase text-[11px] font-bold text-gray-500 border-b border-gray-200">
                  <tr>
                    <th className="p-4">Nome</th>
                    <th className="p-4">E-mail</th>
                    <th className="p-4">Nível / Tipo</th>
                    <th className="p-4">Criado em</th>
                    <th className="p-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-150">
                  {relatorioData.usuarios.map((u: any) => (
                    <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 font-semibold text-gray-900">{u.nome}</td>
                      <td className="p-4 text-xs font-mono text-gray-500">{u.email}</td>
                      <td className="p-4 text-xs uppercase">{u.tipo}</td>
                      <td className="p-4 text-xs">{formatDate(u.created_at)}</td>
                      <td className="p-4 text-center">
                        <Badge variant={u.ativo ? "default" : "secondary"} className="text-xs">
                          {u.ativo ? "Ativo" : "Inativo"}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const renderLogs = () => {
    if (!relatorioData?.logs) return null
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200 shadow-sm">
            <div className="text-2xl font-bold text-blue-900">{relatorioData.total || 0}</div>
            <div className="text-xs font-semibold text-blue-700 uppercase tracking-wider mt-1">Total Logs</div>
          </div>
          <div className="p-4 bg-gradient-to-br from-sky-50 to-sky-100 rounded-xl border border-sky-200 shadow-sm">
            <div className="text-2xl font-bold text-sky-900">{relatorioData.estatisticas?.info || 0}</div>
            <div className="text-xs font-semibold text-sky-700 uppercase tracking-wider mt-1">Informações</div>
          </div>
          <div className="p-4 bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl border border-amber-200 shadow-sm">
            <div className="text-2xl font-bold text-amber-900">{relatorioData.estatisticas?.warning || 0}</div>
            <div className="text-xs font-semibold text-amber-700 uppercase tracking-wider mt-1">Avisos (Warn)</div>
          </div>
          <div className="p-4 bg-gradient-to-br from-red-50 to-red-100 rounded-xl border border-red-200 shadow-sm">
            <div className="text-2xl font-bold text-red-900">{relatorioData.estatisticas?.error || 0}</div>
            <div className="text-xs font-semibold text-red-700 uppercase tracking-wider mt-1">Erros</div>
          </div>
        </div>

        <Card className="border-0 shadow-lg bg-white overflow-hidden">
          <CardHeader className="bg-slate-50 border-b border-slate-100 py-4">
            <CardTitle className="text-lg text-slate-800">Logs do Sistema</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-700">
                <thead className="bg-slate-100/50 uppercase text-[11px] font-bold text-gray-500 border-b border-gray-200">
                  <tr>
                    <th className="p-4">Data/Hora</th>
                    <th className="p-4">Usuário</th>
                    <th className="p-4">Ação</th>
                    <th className="p-4">Módulo</th>
                    <th className="p-4">Tipo</th>
                    <th className="p-4 font-mono">IP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-150">
                  {relatorioData.logs.map((l: any) => (
                    <tr key={l.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 text-xs font-mono">{formatDate(l.data_hora)}</td>
                      <td className="p-4 font-medium text-gray-900">{l.usuario_nome || "Sistema"}</td>
                      <td className="p-4 text-xs text-gray-700">{l.acao}</td>
                      <td className="p-4 text-xs uppercase font-semibold text-gray-500">{l.modulo}</td>
                      <td className="p-4 text-xs">
                        <Badge
                          variant={
                            l.tipo?.toLowerCase() === "error"
                              ? "destructive"
                              : l.tipo?.toLowerCase() === "warning" || l.tipo?.toLowerCase() === "warn"
                                ? "secondary"
                                : "default"
                          }
                          className="text-[10px] px-1.5 py-0 uppercase"
                        >
                          {l.tipo}
                        </Badge>
                      </td>
                      <td className="p-4 text-xs font-mono text-gray-500">{l.ip_address || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const renderFeriados = () => {
    if (!relatorioData?.feriados) return null
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200 shadow-sm text-center">
            <div className="text-2xl font-bold text-blue-900">{relatorioData.estatisticas?.nacionais || 0}</div>
            <div className="text-xs font-semibold text-blue-700 uppercase tracking-wider mt-1">Nacionais</div>
          </div>
          <div className="p-4 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl border border-emerald-200 shadow-sm text-center">
            <div className="text-2xl font-bold text-emerald-900">{relatorioData.estatisticas?.estaduais || 0}</div>
            <div className="text-xs font-semibold text-emerald-700 uppercase tracking-wider mt-1">Estaduais</div>
          </div>
          <div className="p-4 bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl border border-indigo-200 shadow-sm text-center">
            <div className="text-2xl font-bold text-indigo-900">{relatorioData.estatisticas?.municipais || 0}</div>
            <div className="text-xs font-semibold text-indigo-700 uppercase tracking-wider mt-1">Municipais</div>
          </div>
          <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200 shadow-sm text-center">
            <div className="text-2xl font-bold text-purple-900">{relatorioData.estatisticas?.personalizados || 0}</div>
            <div className="text-xs font-semibold text-purple-700 uppercase tracking-wider mt-1">Personalizados</div>
          </div>
        </div>

        <Card className="border-0 shadow-lg bg-white overflow-hidden">
          <CardHeader className="bg-slate-50 border-b border-slate-100 py-4">
            <CardTitle className="text-lg text-slate-800">Feriados Cadastrados</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-700">
                <thead className="bg-slate-100/50 uppercase text-[11px] font-bold text-gray-500 border-b border-gray-200">
                  <tr>
                    <th className="p-4">Data</th>
                    <th className="p-4">Nome</th>
                    <th className="p-4">Tipo</th>
                    <th className="p-4 text-center">Recorrente</th>
                    <th className="p-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-150">
                  {relatorioData.feriados.map((f: any) => (
                    <tr key={f.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 font-semibold text-gray-900">{formatDate(f.data)}</td>
                      <td className="p-4 text-xs font-medium text-gray-800">{f.nome}</td>
                      <td className="p-4 text-xs uppercase font-semibold text-blue-600">{f.tipo}</td>
                      <td className="p-4 text-center text-xs">
                        <Badge variant={f.recorrente ? "default" : "secondary"}>
                          {f.recorrente ? "Sim" : "Não"}
                        </Badge>
                      </td>
                      <td className="p-4 text-center text-xs">
                        <Badge variant={f.ativo ? "outline" : "secondary"} className={f.ativo ? "border-green-300 text-green-700 bg-green-50" : ""}>
                          {f.ativo ? "Ativo" : "Inativo"}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const renderEquipamentos = () => {
    if (!relatorioData?.equipamentos) return null
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200 shadow-sm flex items-center gap-4">
            <Wrench className="h-10 w-10 text-blue-600 bg-white p-2 rounded-lg shadow-sm" />
            <div>
              <div className="text-2xl font-bold text-blue-900">{relatorioData.total || 0}</div>
              <div className="text-xs font-semibold text-blue-700 uppercase tracking-wider">Total Equipamentos</div>
            </div>
          </div>
          <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200 shadow-sm">
            <div className="text-2xl font-bold text-green-900">{relatorioData.estatisticas?.ativos || 0}</div>
            <div className="text-xs font-semibold text-green-700 uppercase tracking-wider mt-1">Ativos</div>
          </div>
          <div className="p-4 bg-gradient-to-br from-slate-50 to-slate-200 rounded-xl border border-slate-300 shadow-sm">
            <div className="text-2xl font-bold text-slate-900">{relatorioData.estatisticas?.inativos || 0}</div>
            <div className="text-xs font-semibold text-slate-700 uppercase tracking-wider mt-1">Inativos</div>
          </div>
        </div>

        <Card className="border-0 shadow-lg bg-white overflow-hidden">
          <CardHeader className="bg-slate-50 border-b border-slate-100 py-4">
            <CardTitle className="text-lg text-slate-800">Equipamentos e Ferramentas</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-700">
                <thead className="bg-slate-100/50 uppercase text-[11px] font-bold text-gray-500 border-b border-gray-200">
                  <tr>
                    <th className="p-4">Nome</th>
                    <th className="p-4">Categoria</th>
                    <th className="p-4 text-right">Valor Hora</th>
                    <th className="p-4">Descrição</th>
                    <th className="p-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-150">
                  {relatorioData.equipamentos.map((e: any) => (
                    <tr key={e.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 font-semibold text-gray-900">{e.nome}</td>
                      <td className="p-4 text-xs uppercase font-semibold text-gray-500">{e.categoria}</td>
                      <td className="p-4 text-right font-bold text-green-600">{formatCurrency(e.valor_hora || 0)}</td>
                      <td className="p-4 text-xs text-gray-600 max-w-[250px] truncate">{e.descricao || "-"}</td>
                      <td className="p-4 text-center text-xs">
                        <Badge variant={e.ativo ? "default" : "secondary"}>
                          {e.ativo ? "Ativo" : "Inativo"}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 pb-12">
      <div className="container mx-auto p-4 md:p-6 space-y-6">
        
        {/* Estilo Global de Impressão */}
        <style>{`
          @media print {
            /* Definir margens e tamanho do papel A4 */
            @page {
              size: A4 portrait;
              margin: 20mm 15mm 25mm 15mm; /* bottom margin 25mm to fit footer */
            }

            /* Resetar fundos e forçar cores padrão de impressão */
            html, body {
              background: white !important;
              color: black !important;
              height: auto !important;
              overflow: visible !important;
              font-family: 'Inter', sans-serif !important;
            }

            /* Ocultar elementos de navegação, cabeçalhos do app, botões, sidebar e blobs de fundo */
            aside,
            header,
            .no-print,
            [role="navigation"],
            button,
            .fixed,
            #sidebar-root,
            .pointer-events-none {
              display: none !important;
            }

            /* Resetar a estrutura de layout do Next.js/Tailwind para fluxo natural vertical */
            html, 
            body, 
            #__next, 
            div.flex.h-screen, 
            div.flex-1.flex.flex-col, 
            main.flex-1, 
            div.mx-auto, 
            div.max-w-7xl,
            .min-h-screen {
              height: auto !important;
              min-height: 0 !important;
              overflow: visible !important;
              position: static !important;
              display: block !important;
              padding: 0 !important;
              padding-bottom: 0 !important;
              margin: 0 !important;
              border: none !important;
              box-shadow: none !important;
              background: transparent !important;
            }

            /* Área principal do relatório impresso */
            #printable-report-area {
              display: block !important;
              width: 100% !important;
              background: white !important;
              color: black !important;
              padding: 0 !important;
              margin: 0 !important;
            }

            /* Garantir repetição do cabeçalho da tabela em cada página */
            thead {
              display: table-header-group !important;
            }
            
            /* Evitar quebras de página no meio de linhas de tabela ou blocos de métricas */
            tr {
              page-break-inside: avoid !important;
              page-break-after: auto !important;
            }
            
            .page-break-inside-avoid {
              page-break-inside: avoid !important;
            }

            /* Tabelas profissionais com linhas nítidas e cinza suave para leitura */
            table {
              width: 100% !important;
              border-collapse: collapse !important;
              margin-top: 15px !important;
              margin-bottom: 15px !important;
            }
            th {
              background-color: #f1f5f9 !important;
              color: #1e293b !important;
              font-weight: bold !important;
              border: 1px solid #cbd5e1 !important;
              padding: 8px 10px !important;
              font-size: 10px !important;
              text-transform: uppercase !important;
            }
            td {
              border: 1px solid #cbd5e1 !important;
              padding: 8px 10px !important;
              font-size: 10px !important;
              color: #334155 !important;
            }

            /* Rodapé fixo de página impresso */
            .print-footer {
              position: fixed !important;
              bottom: 0 !important;
              left: 0 !important;
              width: 100% !important;
              background: white !important;
              display: block !important;
            }
          }
        `}</style>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-250/50 pb-6 no-print">
          <div className="flex items-center gap-4">
            {logoMenu && (
              <img
                src={logoMenu || "/placeholder.svg"}
                alt="Logo"
                className="h-12 w-12 object-contain rounded-lg shadow-md bg-white p-1"
              />
            )}
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Relatórios
              </h1>
              <p className="text-gray-600 mt-1">Análises detalhadas, exportação e impressão de dados</p>
            </div>
          </div>

          {relatorioData && !loading && (
            <div className="flex gap-2">
              <Button
                onClick={handlePrint}
                className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 flex items-center gap-2"
              >
                <Printer className="h-4 w-4" />
                Imprimir
              </Button>
              <Button
                onClick={exportToCSV}
                className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Exportar CSV
              </Button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 no-print">
          {/* Filtros Lateral */}
          <div className="lg:col-span-1">
            <Card className="border-0 shadow-lg bg-white sticky top-6">
              <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-t-lg p-4">
                <CardTitle className="text-white flex items-center gap-2 text-base">
                  <Filter className="h-5 w-5" />
                  Parâmetros de Filtro
                </CardTitle>
                <CardDescription className="text-blue-100 text-xs">Configure o relatório abaixo</CardDescription>
              </CardHeader>
              <CardContent className="p-4">
                {renderFiltros()}

                <Button
                  onClick={gerarRelatorio}
                  disabled={loading}
                  className="w-full mt-5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium"
                >
                  {loading ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <BarChart className="h-4 w-4 mr-2" />
                  )}
                  {loading ? "Processando..." : "Gerar Relatório"}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Resultados na Tela */}
          <div className="lg:col-span-3 space-y-6">
            {error && (
              <Card className="border-red-200 bg-red-50">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 text-red-800">
                    <AlertCircle className="h-5 w-5" />
                    <div>
                      <h3 className="font-medium">Erro ao gerar relatório</h3>
                      <p className="text-sm mt-1">{error}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {loading && (
              <Card className="border-0 shadow-lg bg-white">
                <CardContent className="p-12 text-center">
                  <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <h3 className="text-xl font-medium text-gray-900 mb-2">Processando relatório...</h3>
                  <p className="text-gray-600">Aguarde enquanto estruturamos os dados do banco.</p>
                </CardContent>
              </Card>
            )}

            {relatorioData && !error && !loading && (
              <div className="animate-in fade-in duration-300">
                {tipoRelatorio === "clientes" && renderClientes()}
                {tipoRelatorio === "produtos" && renderProdutos()}
                {tipoRelatorio === "orcamentos" && renderOrcamentos()}
                {tipoRelatorio === "financeiro" && renderFinanceiro()}
                {tipoRelatorio === "ordens_servico" && renderOrdensServico()}
                {tipoRelatorio === "notas_fiscais" && renderNotasFiscais()}
                {tipoRelatorio === "propostas_contratos" && renderPropostasContratos()}
                {tipoRelatorio === "contratos_ativos" && renderContratosAtivos()}
                {tipoRelatorio === "usuarios" && renderUsuarios()}
                {tipoRelatorio === "logs_sistema" && renderLogs()}
                {tipoRelatorio === "feriados" && renderFeriados()}
                {tipoRelatorio === "equipamentos" && renderEquipamentos()}
              </div>
            )}

            {!relatorioData && !error && !loading && (
              <Card className="border-0 shadow-lg bg-white">
                <CardContent className="p-16 text-center">
                  <BarChart className="mx-auto h-16 w-16 text-gray-300 mb-4" />
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">Nenhum relatório gerado</h3>
                  <p className="text-gray-500 mb-6">Escolha o tipo de relatório e configure os parâmetros na barra lateral esquerda.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* 
          ════ AREA EXCLUSIVA DE IMPRESSÃO ════
          Este contêiner será exibido apenas quando o navegador entrar em modo de impressão.
          Garante um layout de relatório oficial e limpo.
        */}
        {relatorioData && (
          <div id="printable-report-area" className="hidden print:block bg-white text-black text-sm p-8">
            {/* Cabeçalho Timbrado */}
            <div className="flex items-center justify-between border-b-2 border-gray-800 pb-4 mb-6">
              <div className="flex items-center gap-3">
                {logoMenu && (
                  <img src={logoMenu} alt="Logo Empresa" className="h-14 w-14 object-contain" />
                )}
                <div>
                  <h2 className="text-xl font-bold tracking-tight uppercase">Gestor Financeiro</h2>
                  <p className="text-[10px] text-gray-600">Relatório Analítico Consolidado</p>
                </div>
              </div>
              <div className="text-right text-xs">
                <p className="font-bold text-gray-900 text-sm">{getNomeRelatorio()}</p>
                <p className="text-gray-600 mt-1">Período: {dataInicio ? formatDate(dataInicio) : "-"} até {dataFim ? formatDate(dataFim) : "-"}</p>
              </div>
            </div>

            {/* Listagem de Dados da Impressão */}
            <div className="mb-6">
              <h3 className="text-sm font-bold uppercase text-gray-700 border-b border-gray-300 pb-1 mb-3">Detalhamento Analítico</h3>
              <table className="w-full text-left text-xs border border-gray-300 border-collapse">
                <thead>
                  <tr className="bg-gray-100 border-b border-gray-300">
                    {tipoRelatorio === "clientes" && (
                      <>
                        <th className="p-2 border-r border-gray-300">Nome / Email</th>
                        <th className="p-2 border-r border-gray-300">Cidade/UF</th>
                        <th className="p-2 border-r border-gray-300 text-center">Orçamentos</th>
                        <th className="p-2 text-right">Total Faturamento</th>
                      </>
                    )}
                    {tipoRelatorio === "produtos" && (
                      <>
                        <th className="p-2 border-r border-gray-300">Código / Descrição</th>
                        <th className="p-2 border-r border-gray-300">Tipo/Marca</th>
                        <th className="p-2 border-r border-gray-300 text-right">Preço</th>
                        <th className="p-2 border-r border-gray-300 text-center">Estoque</th>
                        <th className="p-2 text-right">Qtd. Vendida</th>
                      </>
                    )}
                    {tipoRelatorio === "orcamentos" && (
                      <>
                        <th className="p-2 border-r border-gray-300">Nº</th>
                        <th className="p-2 border-r border-gray-300">Cliente</th>
                        <th className="p-2 border-r border-gray-300">Data Criação</th>
                        <th className="p-2 border-r border-gray-300 text-right">Valor Total</th>
                        <th className="p-2 text-center">Situação</th>
                      </>
                    )}
                    {tipoRelatorio === "financeiro" && (
                      <>
                        <th className="p-2 border-r border-gray-300">Nº Boleto</th>
                        <th className="p-2 border-r border-gray-300">Cliente</th>
                        <th className="p-2 border-r border-gray-300">Vencimento</th>
                        <th className="p-2 border-r border-gray-300 text-right">Valor</th>
                        <th className="p-2">Status</th>
                      </>
                    )}
                    {tipoRelatorio === "ordens_servico" && (
                      <>
                        <th className="p-2 border-r border-gray-300">Nº OS</th>
                        <th className="p-2 border-r border-gray-300">Cliente</th>
                        <th className="p-2 border-r border-gray-300">Técnico</th>
                        <th className="p-2 border-r border-gray-300">Tipo Serviço</th>
                        <th className="p-2 border-r border-gray-300">Agendamento</th>
                        <th className="p-2">Situação</th>
                      </>
                    )}
                    {tipoRelatorio === "notas_fiscais" && (
                      <>
                        <th className="p-2 border-r border-gray-300">Nº / Série</th>
                        <th className="p-2 border-r border-gray-300">Chave de Acesso</th>
                        <th className="p-2 border-r border-gray-300">Cliente</th>
                        <th className="p-2 border-r border-gray-300">Emissão</th>
                        <th className="p-2 border-r border-gray-300 text-right">Valor</th>
                        <th className="p-2">Status</th>
                      </>
                    )}
                    {tipoRelatorio === "propostas_contratos" && (
                      <>
                        <th className="p-2 border-r border-gray-300">Nº Proposta</th>
                        <th className="p-2 border-r border-gray-300">Cliente</th>
                        <th className="p-2 border-r border-gray-300">Data Proposta</th>
                        <th className="p-2 border-r border-gray-300">Tipo</th>
                        <th className="p-2 border-r border-gray-300 text-right">Valor Total</th>
                        <th className="p-2">Status</th>
                      </>
                    )}
                    {tipoRelatorio === "contratos_ativos" && (
                      <>
                        <th className="p-2 border-r border-gray-300">Nº Contrato</th>
                        <th className="p-2 border-r border-gray-300">Cliente</th>
                        <th className="p-2 border-r border-gray-300">Início</th>
                        <th className="p-2 border-r border-gray-300">Fim / Vencimento</th>
                        <th className="p-2 border-r border-gray-300 text-right">Valor Mensal</th>
                        <th className="p-2">Status</th>
                      </>
                    )}
                    {tipoRelatorio === "usuarios" && (
                      <>
                        <th className="p-2 border-r border-gray-300">Nome</th>
                        <th className="p-2 border-r border-gray-300 font-mono">E-mail</th>
                        <th className="p-2 border-r border-gray-300">Nível / Tipo</th>
                        <th className="p-2 border-r border-gray-300">Criado em</th>
                        <th className="p-2 text-center">Status</th>
                      </>
                    )}
                    {tipoRelatorio === "logs_sistema" && (
                      <>
                        <th className="p-2 border-r border-gray-300">Data/Hora</th>
                        <th className="p-2 border-r border-gray-300">Usuário</th>
                        <th className="p-2 border-r border-gray-300">Ação</th>
                        <th className="p-2 border-r border-gray-300">Módulo</th>
                        <th className="p-2 border-r border-gray-300">Tipo</th>
                        <th className="p-2 font-mono">Endereço IP</th>
                      </>
                    )}
                    {tipoRelatorio === "feriados" && (
                      <>
                        <th className="p-2 border-r border-gray-300">Data</th>
                        <th className="p-2 border-r border-gray-300">Nome</th>
                        <th className="p-2 border-r border-gray-300">Tipo</th>
                        <th className="p-2 border-r border-gray-300 text-center">Recorrente</th>
                        <th className="p-2 text-center">Status</th>
                      </>
                    )}
                    {tipoRelatorio === "equipamentos" && (
                      <>
                        <th className="p-2 border-r border-gray-300">Nome</th>
                        <th className="p-2 border-r border-gray-300">Categoria</th>
                        <th className="p-2 border-r border-gray-300 text-right">Valor Hora</th>
                        <th className="p-2 border-r border-gray-300">Descrição</th>
                        <th className="p-2 text-center">Status</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-300">
                  {tipoRelatorio === "clientes" && relatorioData.clientes?.map((cliente: any) => (
                    <tr key={cliente.id}>
                      <td className="p-2 border-r border-gray-300">{cliente.nome} ({cliente.email})</td>
                      <td className="p-2 border-r border-gray-300">{cliente.cidade || "-"}/{cliente.estado || "-"}</td>
                      <td className="p-2 border-r border-gray-300 text-center">{cliente.total_orcamentos}</td>
                      <td className="p-2 text-right font-bold">{formatCurrency(cliente.valor_orcamentos)}</td>
                    </tr>
                  ))}
                  {tipoRelatorio === "produtos" && relatorioData.produtos?.map((produto: any) => (
                    <tr key={produto.id}>
                      <td className="p-2 border-r border-gray-300">[{produto.codigo}] {produto.nome}</td>
                      <td className="p-2 border-r border-gray-300">{produto.tipo} / {produto.marca}</td>
                      <td className="p-2 border-r border-gray-300 text-right">{formatCurrency(produto.preco_venda)}</td>
                      <td className="p-2 border-r border-gray-300 text-center">{produto.estoque_atual}</td>
                      <td className="p-2 text-right">{produto.quantidade_vendida}</td>
                    </tr>
                  ))}
                  {tipoRelatorio === "orcamentos" && relatorioData.orcamentos?.map((orcamento: any) => (
                    <tr key={orcamento.id}>
                      <td className="p-2 border-r border-gray-300 font-mono">#{orcamento.numero}</td>
                      <td className="p-2 border-r border-gray-300">{orcamento.cliente_nome}</td>
                      <td className="p-2 border-r border-gray-300">{formatDate(orcamento.created_at)}</td>
                      <td className="p-2 border-r border-gray-300 text-right font-bold">{formatCurrency(orcamento.valor_total)}</td>
                      <td className="p-2 text-center uppercase">{orcamento.situacao}</td>
                    </tr>
                  ))}
                  {tipoRelatorio === "financeiro" && relatorioData.boletos?.map((boleto: any) => (
                    <tr key={boleto.id}>
                      <td className="p-2 border-r border-gray-300 font-mono">#{boleto.numero}</td>
                      <td className="p-2 border-r border-gray-300">{boleto.cliente_nome}</td>
                      <td className="p-2 border-r border-gray-300">{formatDate(boleto.data_vencimento)}</td>
                      <td className="p-2 border-r border-gray-300 text-right font-bold">{formatCurrency(boleto.valor)}</td>
                      <td className="p-2 uppercase">{boleto.status}</td>
                    </tr>
                  ))}
                  {tipoRelatorio === "ordens_servico" && relatorioData.ordensServico?.map((os: any) => (
                    <tr key={os.id}>
                      <td className="p-2 border-r border-gray-300 font-mono">#{os.numero}</td>
                      <td className="p-2 border-r border-gray-300">{os.cliente_nome}</td>
                      <td className="p-2 border-r border-gray-300">{os.tecnico_name || "-"}</td>
                      <td className="p-2 border-r border-gray-300">{os.tipo_servico}</td>
                      <td className="p-2 border-r border-gray-300">{os.data_agendamento ? formatDate(os.data_agendamento) : "-"}</td>
                      <td className="p-2 uppercase">{os.situacao}</td>
                    </tr>
                  ))}
                  {tipoRelatorio === "notas_fiscais" && relatorioData.notasFiscais?.map((nf: any) => (
                    <tr key={nf.id}>
                      <td className="p-2 border-r border-gray-300 font-mono">#{nf.numero} / S.{nf.serie}</td>
                      <td className="p-2 border-r border-gray-300 font-mono text-[9px]">{nf.chave_acesso || "-"}</td>
                      <td className="p-2 border-r border-gray-300">{nf.cliente_nome}</td>
                      <td className="p-2 border-r border-gray-300">{formatDate(nf.data_emissao)}</td>
                      <td className="p-2 text-right font-bold">{formatCurrency(nf.valor)}</td>
                      <td className="p-2 uppercase">{nf.status}</td>
                    </tr>
                  ))}
                  {tipoRelatorio === "propostas_contratos" && relatorioData.propostas?.map((p: any) => (
                    <tr key={p.id}>
                      <td className="p-2 border-r border-gray-300 font-mono">#{p.numero}</td>
                      <td className="p-2 border-r border-gray-300">{p.cliente_nome}</td>
                      <td className="p-2 border-r border-gray-300">{formatDate(p.data_proposta)}</td>
                      <td className="p-2 border-r border-gray-300 uppercase">{p.tipo}</td>
                      <td className="p-2 text-right font-bold">{formatCurrency(p.valor)}</td>
                      <td className="p-2 uppercase">{p.status}</td>
                    </tr>
                  ))}
                  {tipoRelatorio === "contratos_ativos" && relatorioData.contratos?.map((c: any) => (
                    <tr key={c.id}>
                      <td className="p-2 border-r border-gray-300 font-mono">#{c.numero}</td>
                      <td className="p-2 border-r border-gray-300">{c.cliente_nome}</td>
                      <td className="p-2 border-r border-gray-300">{formatDate(c.data_inicio)}</td>
                      <td className="p-2 border-r border-gray-300">{c.data_fim ? formatDate(c.data_fim) : "Indeterminado"}</td>
                      <td className="p-2 text-right font-bold">{formatCurrency(c.valor)}</td>
                      <td className="p-2 uppercase">{c.status}</td>
                    </tr>
                  ))}
                  {tipoRelatorio === "usuarios" && relatorioData.usuarios?.map((u: any) => (
                    <tr key={u.id}>
                      <td className="p-2 border-r border-gray-300">{u.nome}</td>
                      <td className="p-2 border-r border-gray-300 font-mono">{u.email}</td>
                      <td className="p-2 border-r border-gray-300 uppercase">{u.tipo}</td>
                      <td className="p-2 border-r border-gray-300">{formatDate(u.created_at)}</td>
                      <td className="p-2 text-center">{u.ativo ? "ATIVO" : "INATIVO"}</td>
                    </tr>
                  ))}
                  {tipoRelatorio === "logs_sistema" && relatorioData.logs?.map((l: any) => (
                    <tr key={l.id}>
                      <td className="p-2 border-r border-gray-300 font-mono">{formatDate(l.data_hora)}</td>
                      <td className="p-2 border-r border-gray-300">{l.usuario_nome || "Sistema"}</td>
                      <td className="p-2 border-r border-gray-300">{l.acao}</td>
                      <td className="p-2 border-r border-gray-300 uppercase">{l.modulo}</td>
                      <td className="p-2 border-r border-gray-300 uppercase">{l.tipo}</td>
                      <td className="p-2 font-mono">{l.ip_address || "-"}</td>
                    </tr>
                  ))}
                  {tipoRelatorio === "feriados" && relatorioData.feriados?.map((f: any) => (
                    <tr key={f.id}>
                      <td className="p-2 border-r border-gray-300">{formatDate(f.data)}</td>
                      <td className="p-2 border-r border-gray-300">{f.nome}</td>
                      <td className="p-2 border-r border-gray-300 uppercase">{f.tipo}</td>
                      <td className="p-2 border-r border-gray-300 text-center">{f.recorrente ? "SIM" : "NÃO"}</td>
                      <td className="p-2 text-center">{f.ativo ? "ATIVO" : "INATIVO"}</td>
                    </tr>
                  ))}
                  {tipoRelatorio === "equipamentos" && relatorioData.equipamentos?.map((e: any) => (
                    <tr key={e.id}>
                      <td className="p-2 border-r border-gray-300">{e.nome}</td>
                      <td className="p-2 border-r border-gray-300 uppercase">{e.categoria}</td>
                      <td className="p-2 border-r border-gray-300 text-right">{formatCurrency(e.valor_hora)}</td>
                      <td className="p-2 border-r border-gray-300 text-[10px]">{e.descricao || "-"}</td>
                      <td className="p-2 text-center">{e.ativo ? "ATIVO" : "INATIVO"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Sumário de Métricas para Impressão (Resumo Executivo no final) */}
            <div className="mb-6 page-break-inside-avoid">
              <h3 className="text-sm font-bold uppercase text-gray-700 border-b border-gray-300 pb-1 mb-3">Resumo Executivo</h3>
              
              {tipoRelatorio === "financeiro" && (
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="border border-gray-300 p-2 rounded">
                    <div className="text-[10px] uppercase text-gray-500 font-bold">Boletos Pagos</div>
                    <div className="text-lg font-bold">{formatCurrency(relatorioData.estatisticas?.valorPago || 0)}</div>
                    <div className="text-[10px] text-gray-600">({relatorioData.estatisticas?.pagos || 0} boletos)</div>
                  </div>
                  <div className="border border-gray-300 p-2 rounded">
                    <div className="text-[10px] uppercase text-gray-500 font-bold">Boletos Vencidos</div>
                    <div className="text-lg font-bold text-red-600">{formatCurrency(relatorioData.estatisticas?.valorVencido || 0)}</div>
                    <div className="text-[10px] text-red-600">({relatorioData.estatisticas?.vencidos || 0} boletos)</div>
                  </div>
                  <div className="border border-gray-300 p-2 rounded">
                    <div className="text-[10px] uppercase text-gray-500 font-bold">Pendentes / A Vencer</div>
                    <div className="text-lg font-bold">{formatCurrency(relatorioData.estatisticas?.valorPendente || 0)}</div>
                    <div className="text-[10px] text-gray-600">({relatorioData.estatisticas?.pendentes || 0} boletos)</div>
                  </div>
                </div>
              )}

              {tipoRelatorio === "orcamentos" && (
                <div className="grid grid-cols-5 gap-4 text-center">
                  <div className="border border-gray-300 p-2 rounded">
                    <div className="text-[10px] uppercase text-gray-500 font-bold">Total Orçamentos</div>
                    <div className="text-sm font-bold">{relatorioData.total || 0}</div>
                    <div className="text-[10px] text-gray-600">{formatCurrency(relatorioData.valorTotal || 0)}</div>
                  </div>
                  <div className="border border-gray-300 p-2 rounded bg-gray-50">
                    <div className="text-[10px] uppercase text-gray-500 font-bold">Aprovados</div>
                    <div className="text-sm font-bold text-green-700">{relatorioData.estatisticas?.aprovados || 0}</div>
                  </div>
                  <div className="border border-gray-300 p-2 rounded">
                    <div className="text-[10px] uppercase text-gray-500 font-bold">Pendentes</div>
                    <div className="text-sm font-bold">{relatorioData.estatisticas?.pendentes || 0}</div>
                  </div>
                  <div className="border border-gray-300 p-2 rounded">
                    <div className="text-[10px] uppercase text-gray-500 font-bold">Rejeitados</div>
                    <div className="text-sm font-bold text-red-600">{relatorioData.estatisticas?.rejeitados || 0}</div>
                  </div>
                  <div className="border border-gray-300 p-2 rounded">
                    <div className="text-[10px] uppercase text-gray-500 font-bold">Concluídos</div>
                    <div className="text-sm font-bold text-blue-600">{relatorioData.estatisticas?.concluidos || 0}</div>
                  </div>
                </div>
              )}

              {tipoRelatorio === "ordens_servico" && (
                <div className="grid grid-cols-5 gap-2 text-center">
                  <div className="border border-gray-300 p-1.5 rounded">
                    <div className="text-[9px] uppercase text-gray-500 font-bold">Total OS</div>
                    <div className="text-sm font-bold">{relatorioData.total || 0}</div>
                  </div>
                  <div className="border border-gray-300 p-1.5 rounded">
                    <div className="text-[9px] uppercase text-gray-500 font-bold">Finalizadas</div>
                    <div className="text-sm font-bold text-emerald-700">{relatorioData.estatisticas?.finalizadas || 0}</div>
                  </div>
                  <div className="border border-gray-300 p-1.5 rounded">
                    <div className="text-[9px] uppercase text-gray-500 font-bold">Agendadas</div>
                    <div className="text-sm font-bold">{relatorioData.estatisticas?.agendadas || 0}</div>
                  </div>
                  <div className="border border-gray-300 p-1.5 rounded">
                    <div className="text-[9px] uppercase text-gray-500 font-bold">Em Andamento</div>
                    <div className="text-sm font-bold">{relatorioData.estatisticas?.emAndamento || 0}</div>
                  </div>
                  <div className="border border-gray-300 p-1.5 rounded">
                    <div className="text-[9px] uppercase text-gray-500 font-bold">Canceladas</div>
                    <div className="text-sm font-bold text-red-600">{relatorioData.estatisticas?.canceladas || 0}</div>
                  </div>
                </div>
              )}

              {tipoRelatorio === "clientes" && (
                <div className="border border-gray-300 p-3 rounded">
                  <div className="text-[10px] uppercase text-gray-500 font-bold">Total de Clientes no Período</div>
                  <div className="text-xl font-bold">{relatorioData.total || 0} clientes ativos</div>
                </div>
              )}

              {tipoRelatorio === "produtos" && (
                <div className="border border-gray-300 p-3 rounded">
                  <div className="text-[10px] uppercase text-gray-500 font-bold">Total de Itens / Produtos no Catálogo</div>
                  <div className="text-xl font-bold">{relatorioData.total || 0} itens listados</div>
                </div>
              )}

              {tipoRelatorio === "notas_fiscais" && (
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="border border-gray-300 p-2 rounded">
                    <div className="text-[10px] uppercase text-gray-500 font-bold">Total Faturado</div>
                    <div className="text-lg font-bold">{formatCurrency(relatorioData.valorTotal || 0)}</div>
                    <div className="text-[10px] text-gray-600">({relatorioData.total || 0} notas)</div>
                  </div>
                  <div className="border border-gray-300 p-2 rounded bg-gray-50">
                    <div className="text-[10px] uppercase text-gray-500 font-bold">Autorizadas</div>
                    <div className="text-sm font-bold text-green-700">{relatorioData.estatisticas?.autorizadas || 0}</div>
                  </div>
                  <div className="border border-gray-300 p-2 rounded">
                    <div className="text-[10px] uppercase text-gray-500 font-bold">Canceladas</div>
                    <div className="text-sm font-bold text-red-600">{relatorioData.estatisticas?.canceladas || 0}</div>
                  </div>
                </div>
              )}

              {tipoRelatorio === "propostas_contratos" && (
                <div className="grid grid-cols-4 gap-4 text-center">
                  <div className="border border-gray-300 p-2 rounded">
                    <div className="text-[10px] uppercase text-gray-500 font-bold">Valor Total Proposta</div>
                    <div className="text-lg font-bold">{formatCurrency(relatorioData.valorTotal || 0)}</div>
                    <div className="text-[10px] text-gray-600">({relatorioData.total || 0} propostas)</div>
                  </div>
                  <div className="border border-gray-300 p-2 rounded bg-gray-50">
                    <div className="text-[10px] uppercase text-gray-500 font-bold">Aprovadas</div>
                    <div className="text-sm font-bold text-green-700">{relatorioData.estatisticas?.aprovadas || 0}</div>
                  </div>
                  <div className="border border-gray-300 p-2 rounded">
                    <div className="text-[10px] uppercase text-gray-500 font-bold">Enviadas</div>
                    <div className="text-sm font-bold">{relatorioData.estatisticas?.enviadas || 0}</div>
                  </div>
                  <div className="border border-gray-300 p-2 rounded">
                    <div className="text-[10px] uppercase text-gray-500 font-bold">Rejeitadas</div>
                    <div className="text-sm font-bold text-red-650">{relatorioData.estatisticas?.rejeitadas || 0}</div>
                  </div>
                </div>
              )}

              {tipoRelatorio === "contratos_ativos" && (
                <div className="grid grid-cols-4 gap-4 text-center">
                  <div className="border border-gray-300 p-2 rounded">
                    <div className="text-[10px] uppercase text-gray-500 font-bold">Mensalidade Total</div>
                    <div className="text-lg font-bold">{formatCurrency(relatorioData.valorTotal || 0)}/mês</div>
                    <div className="text-[10px] text-gray-600">({relatorioData.total || 0} contratos)</div>
                  </div>
                  <div className="border border-gray-300 p-2 rounded bg-gray-50">
                    <div className="text-[10px] uppercase text-gray-500 font-bold">Ativos</div>
                    <div className="text-sm font-bold text-green-700">{relatorioData.estatisticas?.ativos || 0}</div>
                  </div>
                  <div className="border border-gray-300 p-2 rounded">
                    <div className="text-[10px] uppercase text-gray-500 font-bold">Suspensos</div>
                    <div className="text-sm font-bold text-amber-700">{relatorioData.estatisticas?.suspensos || 0}</div>
                  </div>
                  <div className="border border-gray-300 p-2 rounded">
                    <div className="text-[10px] uppercase text-gray-500 font-bold">Cancelados</div>
                    <div className="text-sm font-bold text-red-650">{relatorioData.estatisticas?.cancelados || 0}</div>
                  </div>
                </div>
              )}

              {tipoRelatorio === "usuarios" && (
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="border border-gray-300 p-2 rounded bg-gray-50">
                    <div className="text-[10px] uppercase text-gray-500 font-bold">Usuários Ativos</div>
                    <div className="text-lg font-bold text-green-700">{relatorioData.estatisticas?.ativos || 0}</div>
                  </div>
                  <div className="border border-gray-300 p-2 rounded">
                    <div className="text-[10px] uppercase text-gray-500 font-bold">Usuários Inativos</div>
                    <div className="text-lg font-bold text-slate-650">{relatorioData.estatisticas?.inativos || 0}</div>
                  </div>
                </div>
              )}

              {tipoRelatorio === "logs_sistema" && (
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="border border-gray-300 p-2 rounded">
                    <div className="text-[10px] uppercase text-gray-500 font-bold">Informações (Info)</div>
                    <div className="text-lg font-bold text-blue-700">{relatorioData.estatisticas?.info || 0}</div>
                  </div>
                  <div className="border border-gray-300 p-2 rounded bg-gray-50">
                    <div className="text-[10px] uppercase text-gray-500 font-bold">Alertas (Warning)</div>
                    <div className="text-lg font-bold text-amber-700">{relatorioData.estatisticas?.warning || 0}</div>
                  </div>
                  <div className="border border-gray-300 p-2 rounded">
                    <div className="text-[10px] uppercase text-gray-500 font-bold">Erros Críticos</div>
                    <div className="text-lg font-bold text-red-600">{relatorioData.estatisticas?.error || 0}</div>
                  </div>
                </div>
              )}

              {tipoRelatorio === "feriados" && (
                <div className="grid grid-cols-4 gap-4 text-center">
                  <div className="border border-gray-300 p-2 rounded">
                    <div className="text-[10px] uppercase text-gray-500 font-bold">Nacionais</div>
                    <div className="text-sm font-bold">{relatorioData.estatisticas?.nacionais || 0}</div>
                  </div>
                  <div className="border border-gray-300 p-2 rounded">
                    <div className="text-[10px] uppercase text-gray-500 font-bold">Estaduais</div>
                    <div className="text-sm font-bold">{relatorioData.estatisticas?.estaduais || 0}</div>
                  </div>
                  <div className="border border-gray-300 p-2 rounded">
                    <div className="text-[10px] uppercase text-gray-500 font-bold">Municipais</div>
                    <div className="text-sm font-bold">{relatorioData.estatisticas?.municipais || 0}</div>
                  </div>
                  <div className="border border-gray-300 p-2 rounded">
                    <div className="text-[10px] uppercase text-gray-500 font-bold">Personalizados</div>
                    <div className="text-sm font-bold">{relatorioData.estatisticas?.personalizados || 0}</div>
                  </div>
                </div>
              )}

              {tipoRelatorio === "equipamentos" && (
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="border border-gray-300 p-2 rounded bg-gray-50">
                    <div className="text-[10px] uppercase text-gray-500 font-bold">Ativos</div>
                    <div className="text-lg font-bold text-green-700">{relatorioData.estatisticas?.ativos || 0}</div>
                  </div>
                  <div className="border border-gray-300 p-2 rounded">
                    <div className="text-[10px] uppercase text-gray-500 font-bold">Inativos</div>
                    <div className="text-lg font-bold text-red-650">{relatorioData.estatisticas?.inativos || 0}</div>
                  </div>
                </div>
              )}
            </div>

            {/* Rodapé de Assinatura e Data */}
            <div className="mt-16 pt-8 border-t border-gray-300 grid grid-cols-2 gap-8 text-center text-xs">
              <div>
                <p className="text-gray-500">Relatório extraído em:</p>
                <p className="font-semibold text-gray-800">{new Date().toLocaleString("pt-BR")}</p>
              </div>
              <div className="flex flex-col items-center">
                <div className="border-b border-gray-800 w-48 mb-1"></div>
                <p className="text-gray-600 uppercase text-[9px] font-bold">Assinatura do Responsável</p>
              </div>
            </div>
            {/* Rodapé fixo para controle de páginas (impressão) */}
            <div className="print-footer hidden print:block text-slate-500 fixed bottom-0 w-full left-0 px-8">
              <div className="border-t border-gray-300 pt-2 flex justify-between items-center text-[9px] font-sans">
                <div>Gestor Financeiro - {getNomeRelatorio()}</div>
                <div>Extraído em {new Date().toLocaleDateString("pt-BR")}</div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

interface ClienteFilterProps {
  value: string
  onValueChange: (value: string) => void
  clientes: any[]
}

function ClienteFilter({ value, onValueChange, clientes }: ClienteFilterProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")

  const filtered = useMemo(() => {
    if (!search) return clientes
    const s = search.toLowerCase()
    return clientes.filter((c) => c.nome?.toLowerCase().includes(s) || c.email?.toLowerCase().includes(s))
  }, [clientes, search])

  const selectedClienteName = useMemo(() => {
    if (value === "todos") return "Todos os Clientes"
    const c = clientes.find((c) => c.id.toString() === value)
    return c ? c.nome : "Selecionar Cliente"
  }, [value, clientes])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between bg-white text-gray-800 border border-gray-250 h-9 font-normal hover:bg-gray-50 mt-1"
        >
          <span className="truncate">{selectedClienteName}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput 
            placeholder="Buscar cliente..." 
            value={search} 
            onValueChange={setSearch} 
          />
          <CommandList>
            <CommandEmpty>Nenhum cliente encontrado.</CommandEmpty>
            <CommandGroup>
              <CommandItem
                value="todos"
                onSelect={() => {
                  onValueChange("todos")
                  setOpen(false)
                  setSearch("")
                }}
              >
                <Check className={cn("mr-2 h-4 w-4", value === "todos" ? "opacity-100" : "opacity-0")} />
                Todos os Clientes
              </CommandItem>
              {filtered.slice(0, 50).map((cliente) => (
                <CommandItem
                  key={cliente.id}
                  value={cliente.id.toString()}
                  onSelect={() => {
                    onValueChange(cliente.id.toString())
                    setOpen(false)
                    setSearch("")
                  }}
                >
                  <Check className={cn("mr-2 h-4 w-4", value === cliente.id.toString() ? "opacity-100" : "opacity-0")} />
                  {cliente.nome}
                </CommandItem>
              ))}
              {filtered.length > 50 && (
                <div className="text-[10px] text-gray-400 text-center py-1 border-t border-gray-100 mt-1">
                  Continue digitando para filtrar...
                </div>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
