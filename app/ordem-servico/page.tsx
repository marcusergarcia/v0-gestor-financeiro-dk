"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ResizableTable } from "@/components/ui/resizable-table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Wrench,
  Plus,
  Search,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  PlayCircle,
  Eye,
  Edit,
  Trash2,
  Calendar,
  User,
  FileText,
  CalendarRange,
} from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import Link from "next/link"
import { useRouter } from "next/navigation"
import type { OrdemServico } from "@/types/ordem-servico"
import { LotePreventivasDialog } from "@/components/ordem-servico/lote-preventivas-dialog"

export default function OrdemServicoPage() {
  const [loading, setLoading] = useState(true)
  const [ordensServico, setOrdensServico] = useState<OrdemServico[]>([])
  const [logoMenu, setLogoMenu] = useState<string | null>(null)
  const [searchInput, setSearchInput] = useState("")
  const [loteDialogOpen, setLoteDialogOpen] = useState(false)
  const [expandedOrdemId, setExpandedOrdemId] = useState<number | null>(null)

  const [situacaoFilter, setSituacaoFilter] = useState("todas")
  const [tipoServicoFilter, setTipoServicoFilter] = useState("todos")
  const [periodoFilter, setPeriodoFilter] = useState("todos")

  const [stats, setStats] = useState({
    total: 0,
    abertas: 0,
    agendadas: 0,
    em_andamento: 0,
    concluidas: 0,
    preventivas: 0,
    manutencoes: 0,
  })

  const router = useRouter()

  const filterByPeriod = (ordens: OrdemServico[]) => {
    if (periodoFilter === "todos") return ordens

    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)

    return ordens.filter((os) => {
      if (!os.data_atual) return false

      try {
        const dataString = os.data_atual.split("T")[0]
        const [ano, mes, dia] = dataString.split("-").map(Number)
        const dataOS = new Date(ano, mes - 1, dia)

        if (isNaN(dataOS.getTime())) return false

        dataOS.setHours(0, 0, 0, 0)

        switch (periodoFilter) {
          case "mes-anterior": {
            const mesAnterior = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1)
            const fimMesAnterior = new Date(hoje.getFullYear(), hoje.getMonth(), 0)
            return dataOS >= mesAnterior && dataOS <= fimMesAnterior
          }
          case "mes-atual": {
            const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
            const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0)
            return dataOS >= inicioMes && dataOS <= fimMes
          }
          case "mes-posterior": {
            const mesPosterior = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 1)
            const fimMesPosterior = new Date(hoje.getFullYear(), hoje.getMonth() + 2, 0)
            return dataOS >= mesPosterior && dataOS <= fimMesPosterior
          }
          case "trimestre": {
            const mesAtual = hoje.getMonth()
            const trimestreAtual = Math.floor(mesAtual / 3)
            const trimestreAnterior = trimestreAtual - 1
            let anoTrimestre = hoje.getFullYear()
            let trimestreCalculo = trimestreAnterior

            if (trimestreAnterior < 0) {
              anoTrimestre = hoje.getFullYear() - 1
              trimestreCalculo = 3
            }

            const inicioTrimestre = new Date(anoTrimestre, trimestreCalculo * 3, 1)
            const fimTrimestre = new Date(anoTrimestre, (trimestreCalculo + 1) * 3, 0)
            return dataOS >= inicioTrimestre && dataOS <= fimTrimestre
          }
          case "semestre": {
            const mesAtual = hoje.getMonth()
            const semestreAtual = Math.floor(mesAtual / 6)
            const semestreAnterior = semestreAtual - 1
            let anoSemestre = hoje.getFullYear()
            let semestreCalculo = semestreAnterior

            if (semestreAnterior < 0) {
              anoSemestre = hoje.getFullYear() - 1
              semestreCalculo = 1
            }

            const inicioSemestre = new Date(anoSemestre, semestreCalculo * 6, 1)
            const fimSemestre = new Date(anoSemestre, (semestreCalculo + 1) * 6, 0)
            return dataOS >= inicioSemestre && dataOS <= fimSemestre
          }
          default:
            return true
        }
      } catch (error) {
        console.error("[v0] Erro ao filtrar por período:", error)
        return false
      }
    })
  }

  const ordensFiltered = useMemo(() => {
    let filtered = ordensServico

    if (searchInput.trim()) {
      const searchLower = searchInput.toLowerCase()
      filtered = filtered.filter((os) => {
        return (
          os.numero?.toLowerCase().includes(searchLower) ||
          os.cliente_nome?.toLowerCase().includes(searchLower) ||
          os.tecnico_name?.toLowerCase().includes(searchLower) ||
          os.tipo_servico?.toLowerCase().includes(searchLower)
        )
      })
    }

    if (situacaoFilter !== "todas") {
      filtered = filtered.filter((os) => os.situacao === situacaoFilter)
    }

    if (tipoServicoFilter !== "todos") {
      filtered = filtered.filter((os) => os.tipo_servico === tipoServicoFilter)
    }

    filtered = filterByPeriod(filtered)

    return filtered
  }, [ordensServico, searchInput, situacaoFilter, tipoServicoFilter, periodoFilter])

  useEffect(() => {
    carregarDados()
  }, [])

  const carregarDados = async () => {
    try {
      setLoading(true)

      const logoResponse = await fetch("/api/configuracoes/logos")
      const logoResult = await logoResponse.json()

      if (logoResult.success && logoResult.data) {
        const logoMenuData = logoResult.data.find((logo: any) => logo.tipo === "menu")
        if (logoMenuData && logoMenuData.caminho) {
          setLogoMenu(logoMenuData.caminho)
        }
      }

      const params = new URLSearchParams()
      params.append("limit", "1000")

      const response = await fetch(`/api/ordens-servico?${params}`)
      const data = await response.json()

      if (data.success) {
        setOrdensServico(data.data)

        const total = data.data.length
        const abertas = data.data.filter((os: OrdemServico) => os.situacao === "aberta").length
        const agendadas = data.data.filter((os: OrdemServico) => os.situacao === "agendada").length
        const em_andamento = data.data.filter((os: OrdemServico) => os.situacao === "em_andamento").length
        const concluidas = data.data.filter((os: OrdemServico) => os.situacao === "concluida").length
        const preventivas = data.data.filter((os: OrdemServico) => os.tipo_servico === "preventiva").length
        const manutencoes = data.data.filter((os: OrdemServico) => os.tipo_servico === "manutencao").length

        setStats({ total, abertas, agendadas, em_andamento, concluidas, preventivas, manutencoes })
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Tem certeza que deseja excluir esta ordem de serviço?")) {
      return
    }

    try {
      const response = await fetch(`/api/ordens-servico/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        carregarDados()
      } else {
        alert("Erro ao excluir ordem de serviço")
      }
    } catch (error) {
      console.error("Erro ao excluir:", error)
      alert("Erro ao excluir ordem de serviço")
    }
  }

  const handleCardClick = (situacao: string) => {
    setSituacaoFilter(situacao)
  }

  const handleTipoServicoCardClick = (tipo: string) => {
    setTipoServicoFilter(tipo)
  }

  const getStatusBadge = (situacao: string) => {
    switch (situacao) {
      case "rascunho":
        return (
          <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-200">
            <AlertCircle className="w-3 h-3 mr-1" />
            Rascunho
          </Badge>
        )
      case "aberta":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">
            <Clock className="w-3 h-3 mr-1" />
            Aberta
          </Badge>
        )
      case "agendada":
        return (
          <Badge className="bg-cyan-100 text-cyan-800 hover:bg-cyan-200">
            <Calendar className="w-3 h-3 mr-1" />
            Agendada
          </Badge>
        )
      case "em_andamento":
        return (
          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">
            <PlayCircle className="w-3 h-3 mr-1" />
            Em Andamento
          </Badge>
        )
      case "concluida":
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
            <CheckCircle className="w-3 h-3 mr-1" />
            Concluída
          </Badge>
        )
      case "cancelada":
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-200">
            <XCircle className="w-3 h-3 mr-1" />
            Cancelada
          </Badge>
        )
      default:
        return (
          <Badge variant="secondary">
            <AlertCircle className="w-3 h-3 mr-1" />
            Indefinido
          </Badge>
        )
    }
  }

  const getTipoServicoLabel = (tipo: string) => {
    switch (tipo) {
      case "manutencao":
        return "Manutenção"
      case "orcamento":
        return "Orçamento"
      case "vistoria_contrato":
        return "Vistoria para Contrato"
      case "preventiva":
        return "Preventiva"
      default:
        return tipo
    }
  }

  if (loading) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 bg-gradient-to-br from-slate-50 to-orange-50/30">
        <div className="flex items-center gap-3 mb-6">
          {logoMenu && (
            <img src={logoMenu || "/placeholder.svg"} alt="Logo" className="h-8 w-8 object-contain rounded" />
          )}
          <div>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64 mt-2" />
          </div>
        </div>

        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 7 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-3 w-32 mt-2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  const hasActiveFilter = searchInput.trim() !== "" || situacaoFilter !== "todas" || tipoServicoFilter !== "todos" || periodoFilter !== "todos"

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 bg-gradient-to-br from-slate-50 to-orange-50/30">
      <div className="flex items-center gap-3 mb-4 md:mb-6">
        {logoMenu && (
          <img
            src={logoMenu || "/placeholder.svg"}
            alt="Logo"
            className="h-6 w-6 md:h-8 md:w-8 object-contain rounded"
          />
        )}
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
            Ordem de Serviço
          </h2>
          <p className="text-xs md:text-sm text-muted-foreground">Gerencie ordens de serviço e acompanhe execução</p>
        </div>
      </div>

      <div className="grid gap-2 md:gap-4 grid-cols-2 lg:grid-cols-4">
        <Card
          className={`bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 cursor-pointer transition-all hover:shadow-lg hover:scale-105 ${
            situacaoFilter === "todas" ? "ring-2 ring-orange-500" : ""
          }`}
          onClick={() => handleCardClick("todas")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 md:p-4 pb-2">
            <CardTitle className="text-xs md:text-sm font-medium text-orange-700">Total</CardTitle>
            <Wrench className="h-3 w-3 md:h-4 md:w-4 text-orange-600" />
          </CardHeader>
          <CardContent className="p-3 md:p-4 pt-0">
            <div className="text-xl md:text-2xl font-bold text-orange-800">{stats.total}</div>
            <p className="text-[10px] md:text-xs text-orange-600">ordens cadastradas</p>
          </CardContent>
        </Card>

        <Card
          className={`bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200 cursor-pointer transition-all hover:shadow-lg hover:scale-105 ${
            situacaoFilter === "aberta" ? "ring-2 ring-yellow-500" : ""
          }`}
          onClick={() => handleCardClick("aberta")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 md:p-4 pb-2">
            <CardTitle className="text-xs md:text-sm font-medium text-yellow-700">Abertas</CardTitle>
            <Clock className="h-3 w-3 md:h-4 md:w-4 text-yellow-600" />
          </CardHeader>
          <CardContent className="p-3 md:p-4 pt-0">
            <div className="text-xl md:text-2xl font-bold text-yellow-800">{stats.abertas}</div>
            <p className="text-[10px] md:text-xs text-yellow-600">aguardando</p>
          </CardContent>
        </Card>

        <Card
          className={`bg-gradient-to-br from-cyan-50 to-cyan-100 border-cyan-200 cursor-pointer transition-all hover:shadow-lg hover:scale-105 ${
            situacaoFilter === "agendada" ? "ring-2 ring-cyan-500" : ""
          }`}
          onClick={() => handleCardClick("agendada")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 md:p-4 pb-2">
            <CardTitle className="text-xs md:text-sm font-medium text-cyan-700">Agendadas</CardTitle>
            <Calendar className="h-3 w-3 md:h-4 md:w-4 text-cyan-600" />
          </CardHeader>
          <CardContent className="p-3 md:p-4 pt-0">
            <div className="text-xl md:text-2xl font-bold text-cyan-800">{stats.agendadas}</div>
            <p className="text-[10px] md:text-xs text-cyan-600">visitas agendadas</p>
          </CardContent>
        </Card>

        <Card
          className={`bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 cursor-pointer transition-all hover:shadow-lg hover:scale-105 ${
            situacaoFilter === "em_andamento" ? "ring-2 ring-blue-500" : ""
          }`}
          onClick={() => handleCardClick("em_andamento")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 md:p-4 pb-2">
            <CardTitle className="text-xs md:text-sm font-medium text-blue-700">Andamento</CardTitle>
            <PlayCircle className="h-3 w-3 md:h-4 md:w-4 text-blue-600" />
          </CardHeader>
          <CardContent className="p-3 md:p-4 pt-0">
            <div className="text-xl md:text-2xl font-bold text-blue-800">{stats.em_andamento}</div>
            <p className="text-[10px] md:text-xs text-blue-600">executando</p>
          </CardContent>
        </Card>

        <Card
          className={`bg-gradient-to-br from-green-50 to-green-100 border-green-200 cursor-pointer transition-all hover:shadow-lg hover:scale-105 ${
            situacaoFilter === "concluida" ? "ring-2 ring-green-500" : ""
          }`}
          onClick={() => handleCardClick("concluida")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 md:p-4 pb-2">
            <CardTitle className="text-xs md:text-sm font-medium text-green-700">Concluídas</CardTitle>
            <CheckCircle className="h-3 w-3 md:h-4 md:w-4 text-green-600" />
          </CardHeader>
          <CardContent className="p-3 md:p-4 pt-0">
            <div className="text-xl md:text-2xl font-bold text-green-800">{stats.concluidas}</div>
            <p className="text-[10px] md:text-xs text-green-600">finalizadas</p>
          </CardContent>
        </Card>

        <Card
          className={`bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 cursor-pointer transition-all hover:shadow-lg hover:scale-105 ${
            tipoServicoFilter === "preventiva" ? "ring-2 ring-purple-500" : ""
          }`}
          onClick={() => handleTipoServicoCardClick("preventiva")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 md:p-4 pb-2">
            <CardTitle className="text-xs md:text-sm font-medium text-purple-700">Preventivas</CardTitle>
            <Wrench className="h-3 w-3 md:h-4 md:w-4 text-purple-600" />
          </CardHeader>
          <CardContent className="p-3 md:p-4 pt-0">
            <div className="text-xl md:text-2xl font-bold text-purple-800">{stats.preventivas}</div>
            <p className="text-[10px] md:text-xs text-purple-600">manutenções preventivas</p>
          </CardContent>
        </Card>

        <Card
          className={`bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200 cursor-pointer transition-all hover:shadow-lg hover:scale-105 ${
            tipoServicoFilter === "manutencao" ? "ring-2 ring-indigo-500" : ""
          }`}
          onClick={() => handleTipoServicoCardClick("manutencao")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 md:p-4 pb-2">
            <CardTitle className="text-xs md:text-sm font-medium text-indigo-700">Manutenções</CardTitle>
            <Wrench className="h-3 w-3 md:h-4 md:w-4 text-indigo-600" />
          </CardHeader>
          <CardContent className="p-3 md:p-4 pt-0">
            <div className="text-xl md:text-2xl font-bold text-indigo-800">{stats.manutencoes}</div>
            <p className="text-[10px] md:text-xs text-indigo-600">manutenções corretivas</p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-white/60 backdrop-blur-sm border-white/20 shadow-xl">
        <CardHeader className="bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-t-lg p-4 lg:p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              <div>
                <CardTitle className="text-base md:text-lg">Gestão de Ordens de Serviço</CardTitle>
                <CardDescription className="text-orange-100 text-xs md:text-sm hidden md:block">
                  Gerencie e acompanhe todas as ordens de serviço
                </CardDescription>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => setLoteDialogOpen(true)}
                className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                size="sm"
              >
                <CalendarRange className="h-4 w-4 md:mr-2" />
                <span className="hidden md:inline">Preventivas em Lote</span>
              </Button>
              <Link href="/ordem-servico/nova">
                <Button className="bg-white/20 hover:bg-white/30 text-white border-white/30" size="sm">
                  <Plus className="h-4 w-4 md:mr-2" />
                  <span className="hidden md:inline">Nova OS</span>
                </Button>
              </Link>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 md:p-6">
          <div className="flex flex-col md:flex-row items-stretch md:items-center space-y-2 md:space-y-0 md:space-x-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar..."
                className="pl-8 text-sm"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-400 flex-shrink-0" />
              <Select value={situacaoFilter} onValueChange={setSituacaoFilter}>
                <SelectTrigger className="w-full md:w-48 text-sm">
                  <SelectValue placeholder="Situação" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas situações</SelectItem>
                  <SelectItem value="aberta">Aberta</SelectItem>
                  <SelectItem value="agendada">Agendada</SelectItem>
                  <SelectItem value="em_andamento">Em Andamento</SelectItem>
                  <SelectItem value="concluida">Concluída</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Wrench className="h-4 w-4 text-gray-400 flex-shrink-0" />
              <Select value={tipoServicoFilter} onValueChange={setTipoServicoFilter}>
                <SelectTrigger className="w-full md:w-48 text-sm">
                  <SelectValue placeholder="Tipo de Serviço" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os tipos</SelectItem>
                  <SelectItem value="manutencao">Manutenção</SelectItem>
                  <SelectItem value="preventiva">Preventiva</SelectItem>
                  <SelectItem value="orcamento">Orçamento</SelectItem>
                  <SelectItem value="vistoria_contrato">Vistoria para Contrato</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-400 flex-shrink-0" />
              <Select value={periodoFilter} onValueChange={setPeriodoFilter}>
                <SelectTrigger className="w-full md:w-48 text-sm">
                  <SelectValue placeholder="Período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="mes-anterior">Mês anterior</SelectItem>
                  <SelectItem value="mes-atual">Mês atual</SelectItem>
                  <SelectItem value="mes-posterior">Mês posterior</SelectItem>
                  <SelectItem value="trimestre">Trimestre</SelectItem>
                  <SelectItem value="semestre">Semestre</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="hidden md:block rounded-lg border border-slate-200 overflow-hidden">
            <ResizableTable<OrdemServico>
              storageKey="ordem-servico-lista"
              columns={[
                { key: "numero",      label: "Número",          width: 100, sortable: true },
                { key: "cliente",     label: "Cliente",           width: 200, sortable: true },
                { key: "tipo_servico",label: "Tipo de Serviço",   width: 170, sortable: true },
                { key: "tecnico",     label: "Técnico",           width: 160, sortable: true },
                { key: "data",        label: "Data",              width: 110, sortable: true },
                { key: "situacao",    label: "Situação",         width: 130, sortable: true },
                { key: "acoes",       label: "Ações",            width: 120, sortable: false, noResize: true },
              ]}
              data={ordensFiltered}
              rowKey={(row) => row.id}
              emptyState={
                <div className="text-center py-8 text-gray-500">Nenhuma ordem de serviço encontrada</div>
              }
              renderCell={(os, col) => {
                switch (col) {
                  case "numero":      return <span className="font-medium">{os.numero}</span>
                  case "cliente":     return <span>{os.cliente_nome}</span>
                  case "tipo_servico":return <span>{getTipoServicoLabel(os.tipo_servico)}</span>
                  case "tecnico":     return <span>{os.tecnico_name}</span>
                  case "data":
                    return (
                      <span>{os.data_atual ? new Date(os.data_atual.split("T")[0] + "T12:00:00").toLocaleDateString("pt-BR") : "Não informada"}</span>
                    )
                  case "situacao":    return getStatusBadge(os.situacao)
                  case "acoes":
                    return (
                      <div className="flex items-center gap-2">
                        <Link href={`/ordem-servico/${os.id}`}>
                          <Button variant="outline" size="sm" className="hover:bg-blue-50 bg-transparent">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Link href={`/ordem-servico/${os.id}/editar`}>
                          <Button variant="outline" size="sm" className="hover:bg-green-50 bg-transparent">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button variant="outline" size="sm" className="hover:bg-red-50 text-red-600 bg-transparent" onClick={() => handleDelete(os.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )
                  default: return null
                }
              }}
            />
          </div>

          <div className="md:hidden space-y-4">
            {hasActiveFilter && (
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider px-1">
                {ordensFiltered.length} ordem{ordensFiltered.length !== 1 ? "s" : ""} de serviço encontrada{ordensFiltered.length !== 1 ? "s" : ""}
              </p>
            )}

            {!hasActiveFilter ? (
              <div className="text-center py-12 bg-white rounded-xl border border-gray-150 p-6 shadow-sm">
                <Search className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                <h3 className="text-base font-medium text-gray-700 mb-1">Busque ou filtre para ver as ordens de serviço</h3>
                <p className="text-sm text-gray-500">Selecione uma situação, tipo de serviço, período ou digite na busca para começar.</p>
              </div>
            ) : ordensFiltered.length === 0 ? (
              <div className="text-center py-12">
                <Wrench className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                <h3 className="text-base font-medium text-gray-900 mb-1">Nenhuma ordem de serviço encontrada</h3>
                <p className="text-sm text-gray-500 mb-4">Tente ajustar os filtros de busca</p>
              </div>
            ) : (
              ordensFiltered.map((os) => {
                const isExpanded = expandedOrdemId === os.id

                return (
                  <div
                    key={os.id}
                    className={`rounded-xl border transition-all duration-200 overflow-hidden border-gray-200 bg-white ${
                      isExpanded ? "shadow-lg ring-1 ring-orange-200" : "shadow-sm hover:shadow-md"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setExpandedOrdemId(isExpanded ? null : os.id)}
                      className="w-full text-left p-3.5 flex items-center gap-3"
                    >
                      {/* Ícone */}
                      <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold bg-orange-50 text-orange-700`}>
                        <FileText className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="font-semibold text-sm text-gray-900 truncate block">OS {os.numero}</span>
                        <span className="text-[11px] text-gray-500 truncate block font-medium mt-0.5">{os.cliente_nome}</span>
                      </div>
                      <div className="text-right flex-shrink-0 mr-1">
                        {getStatusBadge(os.situacao)}
                      </div>
                      <ChevronRight className={`h-4 w-4 text-gray-400 transition-transform duration-200 flex-shrink-0 ${
                        isExpanded ? "rotate-90" : ""
                      }`} />
                    </button>

                    {isExpanded && (
                      <div className="px-3.5 pb-3.5 pt-0 animate-in slide-in-from-top-2 duration-200">
                        <div className="border-t border-gray-100 pt-3 space-y-2">
                          <div className="grid grid-cols-2 gap-2">
                            <div className="bg-gray-50 rounded-lg p-2.5 col-span-2">
                              <div className="flex items-center gap-1.5 mb-1">
                                <User className="h-3 w-3 text-gray-400" />
                                <span className="text-[10px] font-medium text-gray-500 uppercase">Cliente</span>
                              </div>
                              <p className="text-xs font-semibold text-gray-800 truncate">{os.cliente_nome}</p>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-2.5">
                              <div className="flex items-center gap-1.5 mb-1">
                                <Wrench className="h-3 w-3 text-gray-400" />
                                <span className="text-[10px] font-medium text-gray-500 uppercase">Tipo de Serviço</span>
                              </div>
                              <p className="text-xs text-gray-800 truncate">{getTipoServicoLabel(os.tipo_servico)}</p>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-2.5">
                              <div className="flex items-center gap-1.5 mb-1">
                                <Calendar className="h-3 w-3 text-gray-400" />
                                <span className="text-[10px] font-medium text-gray-500 uppercase">Data</span>
                              </div>
                              <p className="text-xs text-gray-800">
                                {os.data_atual
                                  ? new Date(os.data_atual.split("T")[0] + "T12:00:00").toLocaleDateString("pt-BR")
                                  : "Não informada"}
                              </p>
                            </div>
                            {os.tecnico_name && (
                              <div className="bg-gray-50 rounded-lg p-2.5 col-span-2">
                                <div className="flex items-center gap-1.5 mb-1">
                                  <User className="h-3 w-3 text-gray-400" />
                                  <span className="text-[10px] font-medium text-gray-500 uppercase">Técnico</span>
                                </div>
                                <p className="text-xs text-gray-800 truncate">{os.tecnico_name}</p>
                              </div>
                            )}
                          </div>
                          <div className="flex gap-2 pt-1">
                            <Link href={`/ordem-servico/${os.id}`} className="flex-1">
                              <Button
                                variant="outline"
                                size="sm"
                                className="w-full h-9 text-xs font-medium text-blue-600 border-blue-200 hover:bg-blue-50"
                              >
                                <Eye className="h-3.5 w-3.5 mr-1.5" />
                                Visualizar
                              </Button>
                            </Link>
                            <Link href={`/ordem-servico/${os.id}/editar`} className="flex-1">
                              <Button
                                variant="outline"
                                size="sm"
                                className="w-full h-9 text-xs font-medium text-green-600 border-green-200 hover:bg-green-50"
                              >
                                <Edit className="h-3.5 w-3.5 mr-1.5" />
                                Editar
                              </Button>
                            </Link>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-9 text-xs font-medium text-red-600 border-red-200 hover:bg-red-50 bg-transparent px-3"
                              onClick={() => handleDelete(os.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </CardContent>
      </Card>

      <LotePreventivasDialog open={loteDialogOpen} onOpenChange={setLoteDialogOpen} onSuccess={carregarDados} />
    </div>
  )
}
