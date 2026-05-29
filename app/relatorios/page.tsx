"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BarChart, Filter, AlertCircle, RefreshCw, Printer, Download, Calendar, Users, Package, FileText, DollarSign, Wrench } from "lucide-react"
import { formatCurrency, formatDate } from "@/lib/utils"
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
    window.print()
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
    } else if (tipoRelatorio === "ordens_servico" && relatorioData.ordensServico) {
      headers = ["Número", "Cliente", "Técnico", "Tipo Serviço", "Data Agendamento", "Status"]
      rows = (relatorioData.ordensServico as any[]).map((os: any) => [
        os.numero, os.cliente_nome, os.tecnico_name, os.tipo_servico, os.data_agendamento ? formatDate(os.data_agendamento) : "-", os.situacao
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
    link.setAttribute("download", `relatorio_${tipoRelatorio}_${new Date().toISOString().split("T")[0]}.csv`)
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
        {(tipoRelatorio === "orcamentos" || tipoRelatorio === "financeiro" || tipoRelatorio === "ordens_servico") && (
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
        {(tipoRelatorio === "clientes" || tipoRelatorio === "orcamentos" || tipoRelatorio === "financeiro" || tipoRelatorio === "ordens_servico") && (
          <div>
            <Label htmlFor="cliente" className="font-semibold text-gray-700">Cliente</Label>
            <Select value={clienteId} onValueChange={setClienteId}>
              <SelectTrigger className="bg-white border-gray-200 mt-1">
                <SelectValue placeholder="Selecione o cliente" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os Clientes</SelectItem>
                {clientes.map((cliente) => (
                  <SelectItem key={cliente.id} value={cliente.id.toString()}>
                    {cliente.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 pb-12">
      <div className="container mx-auto p-4 md:p-6 space-y-6">
        
        {/* Estilo Global de Impressão */}
        <style>{`
          @media print {
            /* Resetar fundos e forçar cores padrão */
            html, body {
              background: white !important;
              color: black !important;
              height: auto !important;
              overflow: visible !important;
            }

            /* Ocultar elementos desnecessários do app e a própria visualização em tela */
            aside,
            header,
            .no-print,
            [role="navigation"],
            button,
            .fixed {
              display: none !important;
            }

            /* Resetar estrutura flex e containers de scroll para fluxo vertical contínuo */
            .flex,
            .flex-1,
            main,
            .mx-auto,
            .max-w-7xl,
            div:not(#printable-report-area):not(#printable-report-area *) {
              height: auto !important;
              min-height: 0 !important;
              overflow: visible !important;
              display: block !important;
              padding: 0 !important;
              margin: 0 !important;
              border: none !important;
              box-shadow: none !important;
            }

            /* Forçar a exibição do bloco de impressão */
            #printable-report-area {
              display: block !important;
              position: absolute !important;
              left: 0 !important;
              top: 0 !important;
              width: 100% !important;
              z-index: 99999 !important;
              background: white !important;
              color: black !important;
              padding: 0 !important;
              margin: 0 !important;
            }

            /* Forçar exibição de tabelas completas */
            table {
              width: 100% !important;
              border-collapse: collapse !important;
              page-break-inside: auto !important;
            }
            tr {
              page-break-inside: avoid !important;
              page-break-after: auto !important;
            }
            th, td {
              border: 1px solid #ddd !important;
              padding: 6px !important;
              text-align: left !important;
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
                {logoMenu ? (
                  <img src={logoMenu} alt="Logo Empresa" className="h-14 w-14 object-contain" />
                ) : (
                  <div className="h-10 w-10 bg-gray-200 rounded flex items-center justify-center font-bold">OS</div>
                )}
                <div>
                  <h2 className="text-xl font-bold tracking-tight uppercase">Gestor Financeiro</h2>
                  <p className="text-[10px] text-gray-600">Relatório Analítico Consolidado</p>
                </div>
              </div>
              <div className="text-right text-xs">
                <p className="font-semibold text-gray-800">TIPO: Relatório de {tipoRelatorio.toUpperCase()}</p>
                <p className="text-gray-600">Periodo: {dataInicio ? formatDate(dataInicio) : "-"} até {dataFim ? formatDate(dataFim) : "-"}</p>
              </div>
            </div>

            {/* Sumário de Métricas para Impressão */}
            <div className="mb-6">
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
                <div className="grid grid-cols-4 gap-4 text-center">
                  <div className="border border-gray-300 p-2 rounded">
                    <div className="text-[10px] uppercase text-gray-500 font-bold">Total Orçamentos</div>
                    <div className="text-sm font-bold">{relatorioData.total || 0}</div>
                    <div className="text-[10px] text-gray-600">{formatCurrency(relatorioData.valorTotal || 0)}</div>
                  </div>
                  <div className="border border-gray-300 p-2 rounded bg-gray-50">
                    <div className="text-[10px] uppercase text-gray-500 font-bold">Aprovados</div>
                    <div className="text-sm font-bold">{relatorioData.estatisticas?.aprovados || 0}</div>
                  </div>
                  <div className="border border-gray-300 p-2 rounded">
                    <div className="text-[10px] uppercase text-gray-500 font-bold">Pendentes</div>
                    <div className="text-sm font-bold">{relatorioData.estatisticas?.pendentes || 0}</div>
                  </div>
                  <div className="border border-gray-300 p-2 rounded">
                    <div className="text-[10px] uppercase text-gray-500 font-bold">Rejeitados</div>
                    <div className="text-sm font-bold">{relatorioData.estatisticas?.rejeitados || 0}</div>
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
            </div>

            {/* Listagem de Dados da Impressão */}
            <div>
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
                </tbody>
              </table>
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
          </div>
        )}

      </div>
    </div>
  )
}
