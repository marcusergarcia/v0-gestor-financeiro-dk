"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Activity,
  Search,
  AlertTriangle,
  XCircle,
  Info,
  Download,
  LogIn,
  LogOut,
  Plus,
  Edit,
  Trash2,
  Eye,
  Clock,
  User,
  RefreshCw,
  Globe,
} from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"

interface Log {
  id: number
  usuario_id?: number
  usuario_nome?: string
  usuario_email?: string
  acao: string
  modulo: string
  tipo: "login" | "logout" | "create" | "update" | "delete" | "view" | "error" | "warning" | "info"
  detalhes?: string
  ip_address?: string
  user_agent?: string
  sessao_id?: string
  tempo_sessao?: number
  tempo_sessao_formatado?: string
  dados_anteriores?: any
  dados_novos?: any
  data_hora: string
  data_formatada: string
}

interface Stats {
  total: number
  logins: number
  logouts: number
  creates: number
  updates: number
  deletes: number
  errors: number
}

export default function LogsPage() {
  const [loading, setLoading] = useState(true)
  const [logs, setLogs] = useState<Log[]>([])
  const [logoMenu, setLogoMenu] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [tipoFilter, setTipoFilter] = useState("all")
  const [moduloFilter, setModuloFilter] = useState("all")
  const [currentTime, setCurrentTime] = useState<string>("")
  const [stats, setStats] = useState<Stats>({
    total: 0,
    logins: 0,
    logouts: 0,
    creates: 0,
    updates: 0,
    deletes: 0,
    errors: 0,
  })
  const { toast } = useToast()

  useEffect(() => {
    carregarDados()

    // Atualizar horário atual a cada segundo
    const interval = setInterval(() => {
      setCurrentTime(
        new Date().toLocaleString("pt-BR", {
          timeZone: "America/Sao_Paulo",
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
      )
    }, 1000)

    return () => clearInterval(interval)
  }, [search, tipoFilter, moduloFilter])

  const carregarDados = async () => {
    try {
      console.log("=== CARREGANDO DADOS DA PÁGINA DE LOGS ===")
      setLoading(true)

      // Carregar logo do menu
      try {
        const logoResponse = await fetch("/api/configuracoes/logos")
        const logoResult = await logoResponse.json()

        if (logoResult.success && logoResult.data) {
          const logoMenuData = logoResult.data.find((logo: any) => logo.tipo === "menu")
          if (logoMenuData && logoMenuData.caminho) {
            setLogoMenu(logoMenuData.caminho)
          }
        }
      } catch (error) {
        console.log("Logo não encontrado, continuando...")
      }

      // Carregar logs
      const params = new URLSearchParams()
      if (search) params.append("search", search)
      if (tipoFilter !== "all") params.append("tipo", tipoFilter)
      if (moduloFilter !== "all") params.append("modulo", moduloFilter)
      params.append("limit", "100")

      const url = `/api/logs?${params}`
      console.log("URL da requisição:", url)

      const logsResponse = await fetch(url)
      console.log("Status da resposta:", logsResponse.status)

      const logsResult = await logsResponse.json()
      console.log("Resultado da API:", logsResult)

      if (logsResult.success) {
        setLogs(logsResult.data || [])
        console.log("Logs carregados:", logsResult.data?.length || 0)

        // Usar estatísticas da API se disponíveis, senão calcular localmente
        if (logsResult.stats) {
          console.log("Usando estatísticas da API:", logsResult.stats)
          setStats(logsResult.stats)
        } else {
          console.log("Calculando estatísticas localmente...")
          const data = logsResult.data || []
          const calculatedStats = {
            total: data.length,
            logins: data.filter((log: Log) => log.tipo === "login").length,
            logouts: data.filter((log: Log) => log.tipo === "logout").length,
            creates: data.filter((log: Log) => log.tipo === "create").length,
            updates: data.filter((log: Log) => log.tipo === "update").length,
            deletes: data.filter((log: Log) => log.tipo === "delete").length,
            errors: data.filter((log: Log) => log.tipo === "error").length,
          }
          console.log("Estatísticas calculadas:", calculatedStats)
          setStats(calculatedStats)
        }
      } else {
        console.error("Erro na resposta da API:", logsResult)
        toast({
          title: "Erro",
          description: logsResult.message || "Erro ao carregar logs do sistema",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error)
      toast({
        title: "Erro",
        description: "Erro ao carregar logs do sistema",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const getTipoBadge = (tipo: string) => {
    switch (tipo) {
      case "login":
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
            <LogIn className="w-3 h-3 mr-1" />
            Login
          </Badge>
        )
      case "logout":
        return (
          <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-200">
            <LogOut className="w-3 h-3 mr-1" />
            Logout
          </Badge>
        )
      case "create":
        return (
          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">
            <Plus className="w-3 h-3 mr-1" />
            Criação
          </Badge>
        )
      case "update":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">
            <Edit className="w-3 h-3 mr-1" />
            Edição
          </Badge>
        )
      case "delete":
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-200">
            <Trash2 className="w-3 h-3 mr-1" />
            Exclusão
          </Badge>
        )
      case "view":
        return (
          <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-200">
            <Eye className="w-3 h-3 mr-1" />
            Visualização
          </Badge>
        )
      case "error":
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-200">
            <XCircle className="w-3 h-3 mr-1" />
            Erro
          </Badge>
        )
      case "warning":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Aviso
          </Badge>
        )
      case "info":
        return (
          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">
            <Info className="w-3 h-3 mr-1" />
            Info
          </Badge>
        )
      default:
        return <Badge variant="secondary">-</Badge>
    }
  }

  const exportarLogs = async () => {
    try {
      const params = new URLSearchParams()
      if (search) params.append("search", search)
      if (tipoFilter !== "all") params.append("tipo", tipoFilter)
      if (moduloFilter !== "all") params.append("modulo", moduloFilter)
      params.append("limit", "1000")

      const response = await fetch(`/api/logs?${params}`)
      const result = await response.json()

      if (result.success) {
        const csvContent = [
          "Data/Hora,Usuário,Email,Ação,Módulo,Tipo,Detalhes,IP,Tempo Sessão",
          ...result.data.map(
            (log: Log) =>
              `"${log.data_formatada}","${log.usuario_nome || ""}","${log.usuario_email || ""}","${log.acao}","${log.modulo}","${log.tipo}","${log.detalhes || ""}","${log.ip_address || ""}","${log.tempo_sessao_formatado || ""}"`,
          ),
        ].join("\n")

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
        const link = document.createElement("a")
        link.href = URL.createObjectURL(blob)
        link.download = `logs_sistema_${new Date().toISOString().split("T")[0]}.csv`
        link.click()

        toast({
          title: "Sucesso",
          description: "Logs exportados com sucesso",
        })
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao exportar logs",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 bg-gradient-to-br from-slate-50 to-gray-50/30">
        <div className="flex items-center gap-3 mb-6">
          {logoMenu && (
            <img src={logoMenu || "/placeholder.svg"} alt="Logo" className="h-8 w-8 object-contain rounded" />
          )}
          <div>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64 mt-2" />
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-7 gap-3 lg:gap-4">
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

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 bg-gradient-to-br from-slate-50 to-gray-50/30">
      <div className="flex items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          {logoMenu && (
            <img src={logoMenu || "/placeholder.svg"} alt="Logo" className="h-8 w-8 object-contain rounded" />
          )}
          <div>
            <h2 className="text-2xl lg:text-3xl font-bold tracking-tight bg-gradient-to-r from-gray-600 to-slate-600 bg-clip-text text-transparent">
              Logs do Sistema
            </h2>
            <p className="text-sm lg:text-base text-muted-foreground">
              Monitore atividades, login/logout e operações dos usuários
            </p>
          </div>
        </div>

        {/* Horário atual */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-white/50 px-3 py-2 rounded-lg border">
          <Globe className="h-4 w-4" />
          <div>
            <div className="font-medium">Horário Atual (SP)</div>
            <div className="font-mono">{currentTime}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-7 gap-3 lg:gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 lg:p-4 pb-1 lg:pb-2">
            <CardTitle className="text-xs lg:text-sm font-medium text-blue-700">Total de Logs</CardTitle>
            <Activity className="h-3 w-3 lg:h-4 lg:w-4 text-blue-600" />
          </CardHeader>
          <CardContent className="p-3 lg:p-4 pt-0">
            <div className="text-lg lg:text-2xl font-bold text-blue-800">{stats.total}</div>
            <p className="text-[10px] lg:text-xs text-blue-600 mt-0.5">registros</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 lg:p-4 pb-1 lg:pb-2">
            <CardTitle className="text-xs lg:text-sm font-medium text-green-700">Logins</CardTitle>
            <LogIn className="h-3 w-3 lg:h-4 lg:w-4 text-green-600" />
          </CardHeader>
          <CardContent className="p-3 lg:p-4 pt-0">
            <div className="text-lg lg:text-2xl font-bold text-green-800">{stats.logins}</div>
            <p className="text-[10px] lg:text-xs text-green-600 mt-0.5">acessos</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 lg:p-4 pb-1 lg:pb-2">
            <CardTitle className="text-xs lg:text-sm font-medium text-orange-700">Logouts</CardTitle>
            <LogOut className="h-3 w-3 lg:h-4 lg:w-4 text-orange-600" />
          </CardHeader>
          <CardContent className="p-3 lg:p-4 pt-0">
            <div className="text-lg lg:text-2xl font-bold text-orange-800">{stats.logouts}</div>
            <p className="text-[10px] lg:text-xs text-orange-600 mt-0.5">saídas</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 lg:p-4 pb-1 lg:pb-2">
            <CardTitle className="text-xs lg:text-sm font-medium text-purple-700">Criações</CardTitle>
            <Plus className="h-3 w-3 lg:h-4 lg:w-4 text-purple-600" />
          </CardHeader>
          <CardContent className="p-3 lg:p-4 pt-0">
            <div className="text-lg lg:text-2xl font-bold text-purple-800">{stats.creates}</div>
            <p className="text-[10px] lg:text-xs text-purple-600 mt-0.5">novos registros</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 lg:p-4 pb-1 lg:pb-2">
            <CardTitle className="text-xs lg:text-sm font-medium text-yellow-700">Edições</CardTitle>
            <Edit className="h-3 w-3 lg:h-4 lg:w-4 text-yellow-600" />
          </CardHeader>
          <CardContent className="p-3 lg:p-4 pt-0">
            <div className="text-lg lg:text-2xl font-bold text-yellow-800">{stats.updates}</div>
            <p className="text-[10px] lg:text-xs text-yellow-600 mt-0.5">alterações</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 lg:p-4 pb-1 lg:pb-2">
            <CardTitle className="text-xs lg:text-sm font-medium text-red-700">Exclusões</CardTitle>
            <Trash2 className="h-3 w-3 lg:h-4 lg:w-4 text-red-600" />
          </CardHeader>
          <CardContent className="p-3 lg:p-4 pt-0">
            <div className="text-lg lg:text-2xl font-bold text-red-800">{stats.deletes}</div>
            <p className="text-[10px] lg:text-xs text-red-600 mt-0.5">remoções</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 lg:p-4 pb-1 lg:pb-2">
            <CardTitle className="text-xs lg:text-sm font-medium text-red-700">Erros</CardTitle>
            <XCircle className="h-3 w-3 lg:h-4 lg:w-4 text-red-600" />
          </CardHeader>
          <CardContent className="p-3 lg:p-4 pt-0">
            <div className="text-lg lg:text-2xl font-bold text-red-800">{stats.errors}</div>
            <p className="text-[10px] lg:text-xs text-red-600 mt-0.5">problemas</p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-white/60 backdrop-blur-sm border-white/20 shadow-xl">
        <CardHeader className="bg-gradient-to-r from-gray-500 to-slate-600 text-white rounded-t-lg p-4 lg:p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              <div>
                <CardTitle>Logs de Atividade</CardTitle>
                <CardDescription className="text-gray-100">
                  Histórico completo de ações, login/logout e tempo de sessão (Horário de Brasília)
                </CardDescription>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={carregarDados}
                className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                size="sm"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Atualizar
              </Button>
              <Button
                onClick={exportarLogs}
                className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                size="sm"
              >
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por usuário, ação ou detalhes..."
                className="pl-8"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={tipoFilter} onValueChange={setTipoFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filtrar por tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value="login">Login</SelectItem>
                <SelectItem value="logout">Logout</SelectItem>
                <SelectItem value="create">Criação</SelectItem>
                <SelectItem value="update">Edição</SelectItem>
                <SelectItem value="delete">Exclusão</SelectItem>
                <SelectItem value="view">Visualização</SelectItem>
                <SelectItem value="error">Erro</SelectItem>
                <SelectItem value="warning">Aviso</SelectItem>
                <SelectItem value="info">Info</SelectItem>
              </SelectContent>
            </Select>
            <Select value={moduloFilter} onValueChange={setModuloFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filtrar por módulo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os módulos</SelectItem>
                <SelectItem value="Autenticação">Autenticação</SelectItem>
                <SelectItem value="Clientes">Clientes</SelectItem>
                <SelectItem value="Produtos">Produtos</SelectItem>
                <SelectItem value="Orçamentos">Orçamentos</SelectItem>
                <SelectItem value="Financeiro">Financeiro</SelectItem>
                <SelectItem value="Usuários">Usuários</SelectItem>
                <SelectItem value="Configurações">Configurações</SelectItem>
                <SelectItem value="Sistema">Sistema</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-lg border border-slate-200 overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead>Data/Hora (SP)</TableHead>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Ação</TableHead>
                  <TableHead>Módulo</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Tempo Sessão</TableHead>
                  <TableHead>IP</TableHead>
                  <TableHead>Detalhes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      Nenhum log encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log) => (
                    <TableRow key={log.id} className="hover:bg-slate-50/50 transition-colors">
                      <TableCell className="font-mono text-sm">{log.data_formatada}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="font-medium">{log.usuario_nome || "Sistema"}</div>
                            <div className="text-xs text-muted-foreground">{log.usuario_email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{log.acao}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{log.modulo}</Badge>
                      </TableCell>
                      <TableCell>{getTipoBadge(log.tipo)}</TableCell>
                      <TableCell>
                        {log.tempo_sessao_formatado ? (
                          <div className="flex items-center gap-1 text-sm">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            {log.tempo_sessao_formatado}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-sm">{log.ip_address || "-"}</TableCell>
                      <TableCell className="max-w-xs truncate text-sm text-muted-foreground">
                        {log.detalhes || "-"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
