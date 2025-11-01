"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
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
} from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import Link from "next/link"
import { useRouter } from "next/navigation"
import type { OrdemServico } from "@/types/ordem-servico"

export default function OrdemServicoPage() {
  const [loading, setLoading] = useState(true)
  const [ordensServico, setOrdensServico] = useState<OrdemServico[]>([])
  const [logoMenu, setLogoMenu] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [situacaoFilter, setSituacaoFilter] = useState("todas")
  const [periodoFilter, setPeriodoFilter] = useState("todos")
  const [stats, setStats] = useState({
    total: 0,
    abertas: 0,
    em_andamento: 0,
    concluidas: 0,
  })
  const router = useRouter()

  useEffect(() => {
    carregarDados()
  }, [search, situacaoFilter, periodoFilter])

  const carregarDados = async () => {
    try {
      setLoading(true)

      // Carregar logo do menu
      const logoResponse = await fetch("/api/configuracoes/logos")
      const logoResult = await logoResponse.json()

      if (logoResult.success && logoResult.data) {
        const logoMenuData = logoResult.data.find((logo: any) => logo.tipo === "menu")
        if (logoMenuData && logoMenuData.caminho) {
          setLogoMenu(logoMenuData.caminho)
        }
      }

      // Carregar ordens de serviço
      const params = new URLSearchParams()
      if (search) params.append("search", search)
      if (situacaoFilter && situacaoFilter !== "todas") params.append("situacao", situacaoFilter)
      params.append("limit", "50")

      const response = await fetch(`/api/ordens-servico?${params}`)
      const data = await response.json()

      if (data.success) {
        // Aplicar filtro de período no frontend
        let ordensFiltered = data.data
        if (periodoFilter !== "todos") {
          ordensFiltered = filterByPeriod(ordensFiltered)
        }
        setOrdensServico(ordensFiltered)

        // Calcular estatísticas (sempre baseado no total, não no filtro)
        const statsResponse = await fetch("/api/ordens-servico?limit=1000")
        const statsData = await statsResponse.json()

        if (statsData.success) {
          const total = statsData.data.length
          const abertas = statsData.data.filter((os: OrdemServico) => os.situacao === "aberta").length
          const em_andamento = statsData.data.filter((os: OrdemServico) => os.situacao === "em_andamento").length
          const concluidas = statsData.data.filter((os: OrdemServico) => os.situacao === "concluida").length

          setStats({ total, abertas, em_andamento, concluidas })
        }
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error)
    } finally {
      setLoading(false)
    }
  }

  // Função para filtrar por período
  const filterByPeriod = (ordens: OrdemServico[]) => {
    if (periodoFilter === "todos") return ordens

    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)

    return ordens.filter((os) => {
      const dataOS = new Date(os.data_atual)
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
          const inicioTrimestre = new Date(hoje.getFullYear(), hoje.getMonth() - 2, 1)
          const fimTrimestre = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0)
          return dataOS >= inicioTrimestre && dataOS <= fimTrimestre
        }
        case "semestre": {
          const inicioSemestre = new Date(hoje.getFullYear(), hoje.getMonth() - 5, 1)
          const fimSemestre = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0)
          return dataOS >= inicioSemestre && dataOS <= fimSemestre
        }
        default:
          return true
      }
    })
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
          {Array.from({ length: 4 }).map((_, i) => (
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

      {/* Cards de Estatísticas - Versão compacta mobile */}
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
            <Link href="/ordem-servico/nova">
              <Button className="bg-white/20 hover:bg-white/30 text-white border-white/30" size="sm">
                <Plus className="h-4 w-4 md:mr-2" />
                <span className="hidden md:inline">Nova OS</span>
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="p-4 md:p-6">
          <div className="flex flex-col md:flex-row items-stretch md:items-center space-y-2 md:space-y-0 md:space-x-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar..."
                className="pl-8 text-sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
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

          {/* Versão Desktop - Tabela */}
          <div className="hidden md:block rounded-lg border border-slate-200 overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Tipo de Serviço</TableHead>
                  <TableHead>Técnico</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Situação</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ordensServico.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      Nenhuma ordem de serviço encontrada
                    </TableCell>
                  </TableRow>
                ) : (
                  ordensServico.map((os) => (
                    <TableRow key={os.id} className="hover:bg-slate-50/50 transition-colors">
                      <TableCell className="font-medium">{os.numero}</TableCell>
                      <TableCell>{os.cliente_nome}</TableCell>
                      <TableCell>{getTipoServicoLabel(os.tipo_servico)}</TableCell>
                      <TableCell>{os.tecnico_name}</TableCell>
                      <TableCell>{new Date(os.data_atual).toLocaleDateString("pt-BR")}</TableCell>
                      <TableCell>{getStatusBadge(os.situacao)}</TableCell>
                      <TableCell>
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
                          <Button
                            variant="outline"
                            size="sm"
                            className="hover:bg-red-50 text-red-600 bg-transparent"
                            onClick={() => handleDelete(os.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Versão Mobile - Cards */}
          <div className="md:hidden space-y-4">
            {ordensServico.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-sm">Nenhuma ordem de serviço encontrada</div>
            ) : (
              ordensServico.map((os) => (
                <Card
                  key={os.id}
                  className="border-2 border-slate-300 shadow-md hover:shadow-lg transition-shadow overflow-hidden"
                >
                  <CardContent className="p-3">
                    {/* Header do Card */}
                    <div className="flex items-start justify-between mb-3 pb-2 border-b-2 border-orange-100">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <FileText className="h-4 w-4 text-orange-600 flex-shrink-0" />
                          <span className="font-bold text-orange-600 text-sm">OS {os.numero}</span>
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(os.data_atual).toLocaleDateString("pt-BR")}
                        </div>
                      </div>
                      <div className="flex-shrink-0">{getStatusBadge(os.situacao)}</div>
                    </div>

                    {/* Informações */}
                    <div className="space-y-2 mb-3 text-sm">
                      <div className="flex items-start gap-2">
                        <User className="h-3.5 w-3.5 text-gray-400 flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900 truncate">{os.cliente_nome}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Wrench className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                        <div className="text-gray-600 text-xs">{getTipoServicoLabel(os.tipo_servico)}</div>
                      </div>
                      {os.tecnico_name && (
                        <div className="flex items-center gap-2">
                          <User className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                          <div className="text-gray-600 text-xs truncate">{os.tecnico_name}</div>
                        </div>
                      )}
                    </div>

                    {/* Botões de Ação */}
                    <div className="grid grid-cols-3 gap-2 pt-3 border-t-2 border-slate-200">
                      <Link href={`/ordem-servico/${os.id}`} className="w-full">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full h-9 text-xs bg-blue-50 hover:bg-blue-100 border-2 border-blue-300 text-blue-700 font-medium"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Link href={`/ordem-servico/${os.id}/editar`} className="w-full">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full h-9 text-xs bg-green-50 hover:bg-green-100 border-2 border-green-300 text-green-700 font-medium"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full h-9 text-xs bg-red-50 hover:bg-red-100 border-2 border-red-300 text-red-600 font-medium"
                        onClick={() => handleDelete(os.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
