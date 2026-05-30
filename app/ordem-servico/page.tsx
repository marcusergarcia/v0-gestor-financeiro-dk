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
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import Link from "next/link"
import { useRouter } from "next/navigation"
import type { OrdemServico } from "@/types/ordem-servico"
import { LotePreventivasDialog } from "@/components/ordem-servico/lote-preventivas-dialog"
import { NovaOSDialog } from "@/components/ordem-servico/nova-os-dialog"

export default function OrdemServicoPage({ searchParams }: { searchParams: Promise<{ nova?: string }> }) {
  const [loading, setLoading] = useState(true)
  const [ordensServico, setOrdensServico] = useState<OrdemServico[]>([])
  const [logoMenu, setLogoMenu] = useState<string | null>(null)
  const [searchInput, setSearchInput] = useState("")
  const [loteDialogOpen, setLoteDialogOpen] = useState(false)
  const [expandedOrdemId, setExpandedOrdemId] = useState<number | null>(null)
  const [pageIndex, setPageIndex] = useState(0)
  const [isNovaOSOpen, setIsNovaOSOpen] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    searchParams.then((params) => {
      if (params.nova === "true") {
        setIsNovaOSOpen(true)
        router.replace("/ordem-servico")
      }
    })
  }, [searchParams, router])

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

  const paginatedOrdens = useMemo(() => {
    return ordensFiltered.slice(pageIndex * 10, (pageIndex + 1) * 10)
  }, [ordensFiltered, pageIndex])

  useEffect(() => {
    carregarDados()
  }, [])

  useEffect(() => {
    setPageIndex(0)
  }, [searchInput, situacaoFilter, tipoServicoFilter, periodoFilter])

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
          <Badge className="bg-muted text-muted-foreground border-0">
            <AlertCircle className="w-3 h-3 mr-1" />
            Rascunho
          </Badge>
        )
      case "aberta":
        return (
          <Badge className="bg-yellow-100 dark:bg-yellow-950/50 text-yellow-800 dark:text-yellow-300 border-0">
            <Clock className="w-3 h-3 mr-1" />
            Aberta
          </Badge>
        )
      case "agendada":
        return (
          <Badge className="bg-cyan-100 dark:bg-cyan-950/50 text-cyan-800 dark:text-cyan-300 border-0">
            <Calendar className="w-3 h-3 mr-1" />
            Agendada
          </Badge>
        )
      case "em_andamento":
        return (
          <Badge className="bg-blue-100 dark:bg-blue-950/50 text-blue-800 dark:text-blue-300 border-0">
            <PlayCircle className="w-3 h-3 mr-1" />
            Em Andamento
          </Badge>
        )
      case "concluida":
        return (
          <Badge className="bg-green-100 dark:bg-green-950/50 text-green-800 dark:text-green-300 border-0">
            <CheckCircle className="w-3 h-3 mr-1" />
            Concluída
          </Badge>
        )
      case "cancelada":
        return (
          <Badge className="bg-red-100 dark:bg-red-950/50 text-red-800 dark:text-red-300 border-0">
            <XCircle className="w-3 h-3 mr-1" />
            Cancelada
          </Badge>
        )
      default:
        return (
          <Badge variant="secondary" className="border-0">
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
      <div className="p-6 space-y-6 max-w-[1600px] mx-auto w-full">
        <div className="flex items-center gap-4 mb-6">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <div>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64 mt-2" />
          </div>
        </div>

        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="border border-border">
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
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto w-full">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          {logoMenu && (
            <img
              src={logoMenu || "/placeholder.svg"}
              alt="Logo"
              className="h-10 w-10 object-contain rounded-lg border border-border bg-card p-1"
            />
          )}
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground tracking-tight">
              Ordem de Serviço
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5 font-medium font-medium">Gerencie ordens de serviço e acompanhe execução</p>
          </div>
        </div>
        <div className="hidden md:block">
          <Link href="/ordem-servico/nova">
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm h-9 px-4 text-sm font-medium transition-all">
              <Plus className="mr-2 h-4 w-4" />
              Nova Ordem de Serviço
            </Button>
          </Link>
        </div>
      </div>

      <div className="md:hidden">
        <Button
          onClick={() => setIsNovaOSOpen(true)}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-5 shadow-xs rounded-xl"
        >
          <Plus className="h-5 w-5 mr-2" />
          Nova Ordem de Serviço
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card
          className={`border border-border shadow-xs hover:border-muted-foreground/30 transition-all duration-200 bg-card cursor-pointer select-none ${
            situacaoFilter === "todas" ? "ring-2 ring-indigo-500 ring-offset-2 ring-offset-background" : ""
          }`}
          onClick={() => handleCardClick("todas")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2">
            <CardTitle className="text-xs lg:text-sm font-semibold text-muted-foreground">Total</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground/70" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-xl lg:text-2xl font-bold text-foreground">{stats.total}</div>
            <p className="text-[10px] lg:text-xs text-muted-foreground mt-0.5">ordens cadastradas</p>
          </CardContent>
        </Card>

        <Card
          className={`border border-border shadow-xs hover:border-muted-foreground/30 transition-all duration-200 bg-card cursor-pointer select-none ${
            situacaoFilter === "aberta" ? "ring-2 ring-indigo-500 ring-offset-2 ring-offset-background" : ""
          }`}
          onClick={() => handleCardClick("aberta")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2">
            <CardTitle className="text-xs lg:text-sm font-semibold text-muted-foreground">Abertas</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground/70" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-xl lg:text-2xl font-bold text-foreground">{stats.abertas}</div>
            <p className="text-[10px] lg:text-xs text-muted-foreground mt-0.5">aguardando</p>
          </CardContent>
        </Card>

        <Card
          className={`border border-border shadow-xs hover:border-muted-foreground/30 transition-all duration-200 bg-card cursor-pointer select-none ${
            situacaoFilter === "agendada" ? "ring-2 ring-indigo-500 ring-offset-2 ring-offset-background" : ""
          }`}
          onClick={() => handleCardClick("agendada")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2">
            <CardTitle className="text-xs lg:text-sm font-semibold text-muted-foreground">Agendadas</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground/70" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-xl lg:text-2xl font-bold text-foreground">{stats.agendadas}</div>
            <p className="text-[10px] lg:text-xs text-muted-foreground mt-0.5">visitas agendadas</p>
          </CardContent>
        </Card>

        <Card
          className={`border border-border shadow-xs hover:border-muted-foreground/30 transition-all duration-200 bg-card cursor-pointer select-none ${
            situacaoFilter === "em_andamento" ? "ring-2 ring-indigo-500 ring-offset-2 ring-offset-background" : ""
          }`}
          onClick={() => handleCardClick("em_andamento")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2">
            <CardTitle className="text-xs lg:text-sm font-semibold text-muted-foreground">Andamento</CardTitle>
            <PlayCircle className="h-4 w-4 text-muted-foreground/70" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-xl lg:text-2xl font-bold text-foreground">{stats.em_andamento}</div>
            <p className="text-[10px] lg:text-xs text-muted-foreground mt-0.5">executando</p>
          </CardContent>
        </Card>

        <Card
          className={`border border-border shadow-xs hover:border-muted-foreground/30 transition-all duration-200 bg-card cursor-pointer select-none ${
            situacaoFilter === "concluida" ? "ring-2 ring-indigo-500 ring-offset-2 ring-offset-background" : ""
          }`}
          onClick={() => handleCardClick("concluida")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2">
            <CardTitle className="text-xs lg:text-sm font-semibold text-muted-foreground">Concluídas</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground/70" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-xl lg:text-2xl font-bold text-foreground">{stats.concluidas}</div>
            <p className="text-[10px] lg:text-xs text-muted-foreground mt-0.5">finalizadas</p>
          </CardContent>
        </Card>

        <Card
          className={`border border-border shadow-xs hover:border-muted-foreground/30 transition-all duration-200 bg-card cursor-pointer select-none ${
            tipoServicoFilter === "preventiva" ? "ring-2 ring-indigo-500 ring-offset-2 ring-offset-background" : ""
          }`}
          onClick={() => handleTipoServicoCardClick("preventiva")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2">
            <CardTitle className="text-xs lg:text-sm font-semibold text-muted-foreground">Preventivas</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground/70" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-xl lg:text-2xl font-bold text-foreground">{stats.preventivas}</div>
            <p className="text-[10px] lg:text-xs text-muted-foreground mt-0.5">manutenções preventivas</p>
          </CardContent>
        </Card>

        <Card
          className={`border border-border shadow-xs hover:border-muted-foreground/30 transition-all duration-200 bg-card cursor-pointer select-none ${
            tipoServicoFilter === "manutencao" ? "ring-2 ring-indigo-500 ring-offset-2 ring-offset-background" : ""
          }`}
          onClick={() => handleTipoServicoCardClick("manutencao")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2">
            <CardTitle className="text-xs lg:text-sm font-semibold text-muted-foreground">Manutenções</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground/70" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-xl lg:text-2xl font-bold text-foreground">{stats.manutencoes}</div>
            <p className="text-[10px] lg:text-xs text-muted-foreground mt-0.5">manutenções corretivas</p>
          </CardContent>
        </Card>
      </div>

      {/* OS Management Card */}
      <Card className="border border-border shadow-sm overflow-hidden bg-card">
        <CardHeader className="bg-muted/40 border-b border-border p-4 flex flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-2">
            <Wrench className="h-5 w-5 text-muted-foreground" />
            <div>
              <CardTitle className="text-sm font-semibold text-foreground">Gestão de Ordens de Serviço</CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-0.5 hidden md:block">
                Gerencie e acompanhe todas as ordens de serviço
              </CardDescription>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setLoteDialogOpen(true)}
              variant="outline"
              size="sm"
              className="border-border bg-card hover:bg-muted text-foreground h-8 px-3 text-xs"
            >
              <CalendarRange className="h-4 w-4 md:mr-2" />
              <span className="hidden md:inline">Preventivas em Lote</span>
            </Button>
            <Button
              onClick={() => setIsNovaOSOpen(true)}
              variant="outline"
              size="sm"
              className="border-border bg-card hover:bg-muted text-foreground h-8 px-3 text-xs"
            >
              <Plus className="h-4 w-4 md:mr-2" />
              <span className="hidden md:inline">Nova OS</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-4 md:p-6 pt-4">
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground/60" />
              <Input
                placeholder="Buscar..."
                className="pl-10 text-sm border-border bg-background text-foreground"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground/60 flex-shrink-0" />
              <Select value={situacaoFilter} onValueChange={setSituacaoFilter}>
                <SelectTrigger className="w-full md:w-48 text-sm border-border bg-background text-foreground">
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
              <Wrench className="h-4 w-4 text-muted-foreground/60 flex-shrink-0" />
              <Select value={tipoServicoFilter} onValueChange={setTipoServicoFilter}>
                <SelectTrigger className="w-full md:w-48 text-sm border-border bg-background text-foreground">
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
              <Calendar className="h-4 w-4 text-muted-foreground/60 flex-shrink-0" />
              <Select value={periodoFilter} onValueChange={setPeriodoFilter}>
                <SelectTrigger className="w-full md:w-48 text-sm border-border bg-background text-foreground">
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

          {/* Desktop Table View */}
          <div className="hidden md:block">
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
              data={paginatedOrdens}
              rowKey={(row) => row.id}
              emptyState={
                <div className="text-center py-8 text-muted-foreground/60">Nenhuma ordem de serviço encontrada</div>
              }
              renderCell={(os, col) => {
                switch (col) {
                  case "numero":      return <span className="font-medium text-foreground">{os.numero}</span>
                  case "cliente":     return <span className="text-foreground">{os.cliente_nome}</span>
                  case "tipo_servico":return <span className="text-foreground">{getTipoServicoLabel(os.tipo_servico)}</span>
                  case "tecnico":     return <span className="text-foreground">{os.tecnico_name}</span>
                  case "data":
                    return (
                      <span className="text-foreground">{os.data_atual ? new Date(os.data_atual.split("T")[0] + "T12:00:00").toLocaleDateString("pt-BR") : "Não informada"}</span>
                    )
                  case "situacao":    return getStatusBadge(os.situacao)
                  case "acoes":
                    return (
                      <div className="flex items-center gap-1">
                        <Link href={`/ordem-servico/${os.id}`}>
                          <Button variant="outline" size="sm" className="text-blue-600 dark:text-blue-400 hover:bg-blue-500/10 border-blue-200 dark:border-blue-900/50 bg-transparent h-8 w-8 p-0" title="Visualizar">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Link href={`/ordem-servico/${os.id}/editar`}>
                          <Button variant="outline" size="sm" className="text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 border-emerald-200 dark:border-emerald-900/50 bg-transparent h-8 w-8 p-0" title="Editar">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button variant="outline" size="sm" className="text-red-600 dark:text-red-400 hover:bg-red-500/10 border-red-200 dark:border-red-900/50 bg-transparent h-8 w-8 p-0" title="Excluir" onClick={() => handleDelete(os.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )
                  default: return null
                }
              }}
            />

            {/* Pagination Controls */}
            {ordensFiltered.length > 0 && (
              <div className="p-4 border-t border-border/40 flex items-center justify-between gap-4">
                <div className="text-[10px] sm:text-xs text-muted-foreground">
                  Mostrando <span className="font-medium text-foreground">{paginatedOrdens.length}</span> de{" "}
                  <span className="font-medium text-foreground">{ordensFiltered.length}</span> registros
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPageIndex(prev => Math.max(0, prev - 1))}
                    disabled={pageIndex === 0}
                    className="h-8 px-2 text-xs border-border bg-card"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPageIndex(prev => prev + 1)}
                    disabled={(pageIndex + 1) * 10 >= ordensFiltered.length}
                    className="h-8 px-2 text-xs border-border bg-card"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Mobile View */}
          <div className="md:hidden space-y-4">
            {hasActiveFilter && (
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-1">
                {ordensFiltered.length} ordem{ordensFiltered.length !== 1 ? "s" : ""} de serviço encontrada{ordensFiltered.length !== 1 ? "s" : ""}
              </p>
            )}

            {!hasActiveFilter ? (
              <div className="text-center py-12 bg-card rounded-xl border border-border p-6 shadow-xs">
                <Search className="mx-auto h-12 w-12 text-muted-foreground/60 mb-3" />
                <h3 className="text-base font-medium text-foreground mb-1">Busque ou filtre para ver as ordens de serviço</h3>
                <p className="text-sm text-muted-foreground">Selecione uma situação, tipo de serviço, período ou digite na busca para começar.</p>
              </div>
            ) : ordensFiltered.length === 0 ? (
              <div className="text-center py-12">
                <Wrench className="mx-auto h-12 w-12 text-muted-foreground/60 mb-3" />
                <h3 className="text-base font-medium text-foreground mb-1">Nenhuma ordem de serviço encontrada</h3>
                <p className="text-sm text-muted-foreground mb-4">Tente ajustar os filtros de busca</p>
              </div>
            ) : (
              ordensFiltered.map((os) => {
                const isExpanded = expandedOrdemId === os.id

                return (
                  <div
                    key={os.id}
                    className={`rounded-xl border transition-all duration-200 overflow-hidden border-border bg-card ${
                      isExpanded ? "shadow-lg ring-1 ring-indigo-500" : "shadow-xs hover:shadow-md"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setExpandedOrdemId(isExpanded ? null : os.id)}
                      className="w-full text-left p-3.5 flex items-center gap-3 bg-transparent text-foreground"
                    >
                      {/* Icon */}
                      <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300`}>
                        <FileText className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="font-semibold text-sm text-foreground truncate block">OS {os.numero}</span>
                        <span className="text-[11px] text-muted-foreground truncate block font-medium mt-0.5">{os.cliente_nome}</span>
                      </div>
                      <div className="text-right flex-shrink-0 mr-1">
                        {getStatusBadge(os.situacao)}
                      </div>
                      <ChevronRight className={`h-4 w-4 text-muted-foreground/60 transition-transform duration-200 flex-shrink-0 ${
                        isExpanded ? "rotate-90" : ""
                      }`} />
                    </button>

                    {isExpanded && (
                      <div className="px-3.5 pb-3.5 pt-0 animate-in slide-in-from-top-2 duration-200">
                        <div className="border-t border-border/40 pt-3 space-y-2">
                          <div className="grid grid-cols-2 gap-2">
                            <div className="bg-muted/40 rounded-lg p-2.5 col-span-2">
                              <div className="flex items-center gap-1.5 mb-1">
                                <User className="h-3 w-3 text-muted-foreground" />
                                <span className="text-[10px] font-medium text-muted-foreground uppercase">Cliente</span>
                              </div>
                              <p className="text-xs font-semibold text-foreground truncate">{os.cliente_nome}</p>
                            </div>
                            <div className="bg-muted/40 rounded-lg p-2.5">
                              <div className="flex items-center gap-1.5 mb-1">
                                <Wrench className="h-3 w-3 text-muted-foreground" />
                                <span className="text-[10px] font-medium text-muted-foreground uppercase">Tipo de Serviço</span>
                              </div>
                              <p className="text-xs text-foreground truncate">{getTipoServicoLabel(os.tipo_servico)}</p>
                            </div>
                            <div className="bg-muted/40 rounded-lg p-2.5">
                              <div className="flex items-center gap-1.5 mb-1">
                                <Calendar className="h-3 w-3 text-muted-foreground" />
                                <span className="text-[10px] font-medium text-muted-foreground uppercase">Data</span>
                              </div>
                              <p className="text-xs text-foreground">
                                {os.data_atual
                                  ? new Date(os.data_atual.split("T")[0] + "T12:00:00").toLocaleDateString("pt-BR")
                                  : "Não informada"}
                              </p>
                            </div>
                            {os.tecnico_name && (
                              <div className="bg-muted/40 rounded-lg p-2.5 col-span-2">
                                <div className="flex items-center gap-1.5 mb-1">
                                  <User className="h-3 w-3 text-muted-foreground" />
                                  <span className="text-[10px] font-medium text-muted-foreground uppercase">Técnico</span>
                                </div>
                                <p className="text-xs text-foreground truncate">{os.tecnico_name}</p>
                              </div>
                            )}
                          </div>
                          <div className="flex gap-2 pt-1">
                            <Link href={`/ordem-servico/${os.id}`} className="flex-1">
                              <Button
                                variant="outline"
                                size="sm"
                                className="w-full h-9 text-xs font-medium text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900/50 bg-transparent hover:bg-blue-500/10"
                              >
                                <Eye className="h-3.5 w-3.5 mr-1.5" />
                                Visualizar
                              </Button>
                            </Link>
                            <Link href={`/ordem-servico/${os.id}/editar`} className="flex-1">
                              <Button
                                variant="outline"
                                size="sm"
                                className="w-full h-9 text-xs font-medium text-green-600 dark:text-green-400 border-green-200 dark:border-green-900/50 bg-transparent hover:bg-green-500/10"
                              >
                                <Edit className="h-3.5 w-3.5 mr-1.5" />
                                Editar
                              </Button>
                            </Link>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-9 text-xs font-medium text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/50 bg-transparent hover:bg-red-500/10 px-3"
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
      <NovaOSDialog open={isNovaOSOpen} onOpenChange={setIsNovaOSOpen} onSuccess={carregarDados} />
    </div>
  )
}
