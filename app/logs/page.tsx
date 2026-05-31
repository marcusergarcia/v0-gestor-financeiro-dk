"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ResizableTable } from "@/components/ui/resizable-table"
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
  ChevronRight,
} from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

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
  const [expandedLogId, setExpandedLogId] = useState<number | null>(null)
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
        const formattedLogs = (logsResult.data || []).map((log: any) => {
          let dateObj = null
          if (log.data_hora) {
            const dateStr = String(log.data_hora)
            if (dateStr.includes("Z") || (dateStr.includes("-") && dateStr.includes("T"))) {
              dateObj = new Date(dateStr)
            } else {
              const isoStr = dateStr.replace(" ", "T") + (dateStr.endsWith("Z") ? "" : "Z")
              dateObj = new Date(isoStr)
            }
          }
          return {
            ...log,
            data_formatada: dateObj && !isNaN(dateObj.getTime())
              ? dateObj.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })
              : "-"
          }
        })
        setLogs(formattedLogs)
        console.log("Logs carregados:", formattedLogs.length)

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
          <Badge className="bg-green-950/40 text-green-400 border border-green-900/50 hover:bg-green-950/60">
            <LogIn className="w-3 h-3 mr-1" />
            Login
          </Badge>
        )
      case "logout":
        return (
          <Badge className="bg-orange-950/40 text-orange-400 border border-orange-900/50 hover:bg-orange-950/60">
            <LogOut className="w-3 h-3 mr-1" />
            Logout
          </Badge>
        )
      case "create":
        return (
          <Badge className="bg-blue-950/40 text-blue-400 border border-blue-900/50 hover:bg-blue-950/60">
            <Plus className="w-3 h-3 mr-1" />
            Criação
          </Badge>
        )
      case "update":
        return (
          <Badge className="bg-yellow-950/40 text-yellow-400 border border-yellow-900/50 hover:bg-yellow-950/60">
            <Edit className="w-3 h-3 mr-1" />
            Edição
          </Badge>
        )
      case "delete":
        return (
          <Badge className="bg-red-950/40 text-red-400 border border-red-900/50 hover:bg-red-950/60">
            <Trash2 className="w-3 h-3 mr-1" />
            Exclusão
          </Badge>
        )
      case "view":
        return (
          <Badge className="bg-purple-950/40 text-purple-400 border border-purple-900/50 hover:bg-purple-950/60">
            <Eye className="w-3 h-3 mr-1" />
            Visualização
          </Badge>
        )
      case "error":
        return (
          <Badge className="bg-red-950/40 text-red-400 border border-red-900/50 hover:bg-red-950/60">
            <XCircle className="w-3 h-3 mr-1" />
            Erro
          </Badge>
        )
      case "warning":
        return (
          <Badge className="bg-yellow-950/40 text-yellow-400 border border-yellow-900/50 hover:bg-yellow-950/60">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Aviso
          </Badge>
        )
      case "info":
        return (
          <Badge className="bg-blue-950/40 text-blue-400 border border-blue-900/50 hover:bg-blue-950/60">
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
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 bg-background text-foreground min-h-screen">
        <div className="flex items-center gap-3 mb-6">
          {logoMenu && (
            <img src={logoMenu || "/placeholder.svg"} alt="Logo" className="h-8 w-8 object-contain rounded" />
          )}
          <div>
            <Skeleton className="h-8 w-48 bg-muted" />
            <Skeleton className="h-4 w-64 mt-2 bg-muted" />
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-7 gap-3 lg:gap-4">
          {Array.from({ length: 7 }).map((_, i) => (
            <Card key={i} className="bg-card border-border">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24 bg-muted" />
                <Skeleton className="h-4 w-4 bg-muted" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 bg-muted" />
                <Skeleton className="h-3 w-32 mt-2 bg-muted" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 bg-background text-foreground min-h-screen">
      <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
        <div className="flex items-center gap-3">
          {logoMenu && (
            <img src={logoMenu || "/placeholder.svg"} alt="Logo" className="h-8 w-8 object-contain rounded" />
          )}
          <div>
            <h2 className="text-2xl lg:text-3xl font-bold tracking-tight bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
              Logs do Sistema
            </h2>
            <p className="text-sm lg:text-base text-muted-foreground">
              Monitore atividades, login/logout e operações dos usuários
            </p>
          </div>
        </div>

        {/* Horário atual */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/40 px-3 py-2 rounded-lg border border-border">
          <Globe className="h-4 w-4 text-purple-400" />
          <div>
            <div className="font-medium text-foreground">Horário Atual (SP)</div>
            <div className="font-mono text-purple-300">{currentTime}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-7 gap-3 lg:gap-4">
        <Card 
          onClick={() => setTipoFilter("all")}
          className={cn(
            "bg-blue-950/20 border-blue-900/50 cursor-pointer select-none transition-all duration-200 hover:scale-105 hover:bg-blue-950/30",
            tipoFilter === "all" ? "ring-2 ring-blue-500 ring-offset-1" : "opacity-85 hover:opacity-100"
          )}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 lg:p-4 pb-1 lg:pb-2">
            <CardTitle className="text-xs lg:text-sm font-medium text-blue-400">Total de Logs</CardTitle>
            <Activity className="h-3 w-3 lg:h-4 lg:w-4 text-blue-400" />
          </CardHeader>
          <CardContent className="p-3 lg:p-4 pt-0">
            <div className="text-lg lg:text-2xl font-bold text-blue-200">{stats.total}</div>
            <p className="text-[10px] lg:text-xs text-blue-400/80 mt-0.5">registros</p>
          </CardContent>
        </Card>

        <Card 
          onClick={() => setTipoFilter("login")}
          className={cn(
            "bg-green-950/20 border-green-900/50 cursor-pointer select-none transition-all duration-200 hover:scale-105 hover:bg-green-950/30",
            tipoFilter === "login" ? "ring-2 ring-green-500 ring-offset-1" : "opacity-85 hover:opacity-100"
          )}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 lg:p-4 pb-1 lg:pb-2">
            <CardTitle className="text-xs lg:text-sm font-medium text-green-400">Logins</CardTitle>
            <LogIn className="h-3 w-3 lg:h-4 lg:w-4 text-green-400" />
          </CardHeader>
          <CardContent className="p-3 lg:p-4 pt-0">
            <div className="text-lg lg:text-2xl font-bold text-green-200">{stats.logins}</div>
            <p className="text-[10px] lg:text-xs text-green-400/80 mt-0.5">acessos</p>
          </CardContent>
        </Card>

        <Card 
          onClick={() => setTipoFilter("logout")}
          className={cn(
            "bg-orange-950/20 border-orange-900/50 cursor-pointer select-none transition-all duration-200 hover:scale-105 hover:bg-orange-950/30",
            tipoFilter === "logout" ? "ring-2 ring-orange-500 ring-offset-1" : "opacity-85 hover:opacity-100"
          )}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 lg:p-4 pb-1 lg:pb-2">
            <CardTitle className="text-xs lg:text-sm font-medium text-orange-400">Logouts</CardTitle>
            <LogOut className="h-3 w-3 lg:h-4 lg:w-4 text-orange-400" />
          </CardHeader>
          <CardContent className="p-3 lg:p-4 pt-0">
            <div className="text-lg lg:text-2xl font-bold text-orange-800">{stats.logouts}</div>
            <p className="text-[10px] lg:text-xs text-orange-400/80 mt-0.5">saídas</p>
          </CardContent>
        </Card>

        <Card 
          onClick={() => setTipoFilter("create")}
          className={cn(
            "bg-purple-950/20 border-purple-900/50 cursor-pointer select-none transition-all duration-200 hover:scale-105 hover:bg-purple-950/30",
            tipoFilter === "create" ? "ring-2 ring-purple-500 ring-offset-1" : "opacity-85 hover:opacity-100"
          )}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 lg:p-4 pb-1 lg:pb-2">
            <CardTitle className="text-xs lg:text-sm font-medium text-purple-400">Criações</CardTitle>
            <Plus className="h-3 w-3 lg:h-4 lg:w-4 text-purple-400" />
          </CardHeader>
          <CardContent className="p-3 lg:p-4 pt-0">
            <div className="text-lg lg:text-2xl font-bold text-purple-200">{stats.creates}</div>
            <p className="text-[10px] lg:text-xs text-purple-400/80 mt-0.5">novos registros</p>
          </CardContent>
        </Card>

        <Card 
          onClick={() => setTipoFilter("update")}
          className={cn(
            "bg-yellow-950/20 border-yellow-900/50 cursor-pointer select-none transition-all duration-200 hover:scale-105 hover:bg-yellow-950/30",
            tipoFilter === "update" ? "ring-2 ring-yellow-500 ring-offset-1" : "opacity-85 hover:opacity-100"
          )}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 lg:p-4 pb-1 lg:pb-2">
            <CardTitle className="text-xs lg:text-sm font-medium text-yellow-400">Edições</CardTitle>
            <Edit className="h-3 w-3 lg:h-4 lg:w-4 text-yellow-400" />
          </CardHeader>
          <CardContent className="p-3 lg:p-4 pt-0">
            <div className="text-lg lg:text-2xl font-bold text-yellow-200">{stats.updates}</div>
            <p className="text-[10px] lg:text-xs text-yellow-400/80 mt-0.5">alterações</p>
          </CardContent>
        </Card>

        <Card 
          onClick={() => setTipoFilter("delete")}
          className={cn(
            "bg-red-950/20 border-red-900/50 cursor-pointer select-none transition-all duration-200 hover:scale-105 hover:bg-red-950/30",
            tipoFilter === "delete" ? "ring-2 ring-red-500 ring-offset-1" : "opacity-85 hover:opacity-100"
          )}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 lg:p-4 pb-1 lg:pb-2">
            <CardTitle className="text-xs lg:text-sm font-medium text-red-400">Exclusões</CardTitle>
            <Trash2 className="h-3 w-3 lg:h-4 lg:w-4 text-red-400" />
          </CardHeader>
          <CardContent className="p-3 lg:p-4 pt-0">
            <div className="text-lg lg:text-2xl font-bold text-red-200">{stats.deletes}</div>
            <p className="text-[10px] lg:text-xs text-red-400/80 mt-0.5">remoções</p>
          </CardContent>
        </Card>

        <Card 
          onClick={() => setTipoFilter("error")}
          className={cn(
            "bg-rose-950/20 border-rose-900/50 cursor-pointer select-none transition-all duration-200 hover:scale-105 hover:bg-rose-950/30",
            tipoFilter === "error" ? "ring-2 ring-rose-500 ring-offset-1" : "opacity-85 hover:opacity-100"
          )}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 lg:p-4 pb-1 lg:pb-2">
            <CardTitle className="text-xs lg:text-sm font-medium text-rose-400">Erros</CardTitle>
            <XCircle className="h-3 w-3 lg:h-4 lg:w-4 text-rose-400" />
          </CardHeader>
          <CardContent className="p-3 lg:p-4 pt-0">
            <div className="text-lg lg:text-2xl font-bold text-rose-200">{stats.errors}</div>
            <p className="text-[10px] lg:text-xs text-rose-400/80 mt-0.5">problemas</p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card border-border shadow-xl">
        <CardHeader className="bg-gradient-to-r from-gray-950/60 via-slate-950/60 to-gray-950/60 text-white border-b border-border/40 rounded-t-lg p-4 lg:p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-purple-400" />
              <div>
                <CardTitle className="text-foreground">Logs de Atividade</CardTitle>
                <CardDescription className="text-muted-foreground">
                  Histórico completo de ações, login/logout e tempo de sessão (Horário de Brasília)
                </CardDescription>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={carregarDados}
                className="bg-muted/40 hover:bg-muted/60 text-foreground border-border"
                size="sm"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Atualizar
              </Button>
              <Button
                onClick={exportarLogs}
                className="bg-muted/40 hover:bg-muted/60 text-foreground border-border"
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
                className="pl-8 bg-background border-border text-foreground focus:border-purple-500"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={tipoFilter} onValueChange={setTipoFilter}>
              <SelectTrigger className="w-full md:w-48 bg-background border-border text-foreground">
                <SelectValue placeholder="Filtrar por tipo" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border text-foreground">
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
              <SelectTrigger className="w-full md:w-48 bg-background border-border text-foreground">
                <SelectValue placeholder="Filtrar por módulo" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border text-foreground">
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

          {/* DESKTOP VIEW */}
          <div className="hidden md:block">
            <ResizableTable
              storageKey="logs"
              columns={[
                { key: "data_formatada",         label: "Data/Hora (SP)",  width: 160, sortable: true },
                { key: "usuario_nome",            label: "Usuário",         width: 170, sortable: true },
                { key: "acao",                    label: "Ação",            width: 200, sortable: true },
                { key: "modulo",                  label: "Módulo",          width: 120, sortable: true },
                { key: "tipo",                    label: "Tipo",            width: 110, sortable: true },
                { key: "tempo_sessao_formatado",  label: "Tempo Sessão",    width: 120, sortable: false },
                { key: "ip_address",              label: "IP",              width: 130, sortable: false },
                { key: "detalhes",                label: "Detalhes",        width: 220, sortable: false },
              ]}
              data={logs}
              rowKey={(row) => row.id}
              emptyState={<div className="text-center py-8 text-muted-foreground">Nenhum log encontrado</div>}
              renderCell={(log, col) => {
                switch (col) {
                  case "data_formatada":
                    return <span className="font-mono text-sm text-foreground">{log.data_formatada}</span>
                  case "usuario_nome":
                    return (
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <div>
                          <div className="font-medium text-foreground">{log.usuario_nome || "Sistema"}</div>
                          <div className="text-xs text-muted-foreground truncate">{log.usuario_email}</div>
                        </div>
                      </div>
                    )
                  case "acao": return <span className="font-medium text-foreground truncate">{log.acao}</span>
                  case "modulo": return <Badge variant="outline" className="border-border bg-muted/20 text-muted-foreground">{log.modulo}</Badge>
                  case "tipo": return getTipoBadge(log.tipo)
                  case "tempo_sessao_formatado":
                    return log.tempo_sessao_formatado ? (
                      <div className="flex items-center gap-1 text-sm text-foreground">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        {log.tempo_sessao_formatado}
                      </div>
                    ) : <span className="text-muted-foreground">-</span>
                  case "ip_address": return <span className="font-mono text-sm text-foreground">{log.ip_address || "-"}</span>
                  case "detalhes": return <span className="text-sm text-muted-foreground truncate">{log.detalhes || "-"}</span>
                  default: return null
                }
              }}
            />
          </div>

          {/* MOBILE VIEW */}
          <div className="md:hidden space-y-3">
            {!(search.trim() !== "" || tipoFilter !== "all" || moduloFilter !== "all") ? (
              <div className="text-center py-12 bg-card rounded-xl border border-border p-6 shadow-sm">
                <Search className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
                <h3 className="text-base font-medium text-foreground mb-1">Busque ou filtre para ver os logs</h3>
                <p className="text-sm text-muted-foreground">Digite na busca, filtre por módulo/tipo ou selecione um card de filtro para começar.</p>
              </div>
            ) : logs.length === 0 ? (
              <div className="text-center py-12">
                <Activity className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
                <h3 className="text-base font-medium text-foreground mb-1">Nenhum log encontrado</h3>
                <p className="text-sm text-muted-foreground">Tente ajustar os filtros de busca ou tipo.</p>
              </div>
            ) : (
              logs.map((log) => {
                const isExpanded = expandedLogId === log.id
                return (
                  <div
                    key={log.id}
                    className={`rounded-xl border transition-all duration-200 overflow-hidden bg-card border-border ${
                      isExpanded ? "shadow-lg ring-1 ring-slate-900/50" : "shadow-sm hover:shadow-md"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setExpandedLogId(prev => prev === log.id ? null : log.id)}
                      className="w-full text-left p-3.5 flex items-center gap-3"
                    >
                      <div className="h-10 w-10 flex-shrink-0 bg-muted rounded-full flex items-center justify-center">
                        <User className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="font-semibold text-sm text-foreground break-words whitespace-normal leading-tight mt-1 block">
                          {log.usuario_nome || "Sistema"}
                        </span>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          {getTipoBadge(log.tipo)}
                          <Badge variant="outline" className="text-xs border-border bg-muted/20 text-muted-foreground">{log.modulo}</Badge>
                        </div>
                      </div>
                      <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform duration-200 flex-shrink-0 ${
                        isExpanded ? "rotate-90" : ""
                      }`} />
                    </button>

                    {isExpanded && (
                      <div className="px-3.5 pb-3.5 pt-0 animate-in slide-in-from-top-2 duration-200">
                        <div className="border-t border-border pt-3 space-y-2">
                          <div className="grid grid-cols-2 gap-2">
                            <div className="bg-muted/40 border border-border rounded-lg p-2.5 col-span-2">
                              <span className="text-[10px] font-medium text-muted-foreground uppercase block mb-0.5">Ação</span>
                              <p className="text-xs text-foreground font-medium">{log.acao}</p>
                            </div>
                            {log.usuario_email && (
                              <div className="bg-muted/40 border border-border rounded-lg p-2.5 col-span-2">
                                <span className="text-[10px] font-medium text-muted-foreground uppercase block mb-0.5">Email</span>
                                <p className="text-xs text-foreground truncate">{log.usuario_email}</p>
                              </div>
                            )}
                            <div className="bg-muted/40 border border-border rounded-lg p-2.5">
                              <span className="text-[10px] font-medium text-muted-foreground uppercase block mb-0.5">Data/Hora (SP)</span>
                              <p className="text-xs text-foreground font-mono">{log.data_formatada}</p>
                            </div>
                            <div className="bg-muted/40 border border-border rounded-lg p-2.5">
                              <span className="text-[10px] font-medium text-muted-foreground uppercase block mb-0.5">IP</span>
                              <p className="text-xs text-foreground font-mono">{log.ip_address || "-"}</p>
                            </div>
                            {log.tempo_sessao_formatado && (
                              <div className="bg-muted/40 border border-border rounded-lg p-2.5 col-span-2">
                                <span className="text-[10px] font-medium text-muted-foreground uppercase block mb-0.5">Tempo Sessão</span>
                                <p className="text-xs text-foreground">{log.tempo_sessao_formatado}</p>
                              </div>
                            )}
                            {log.detalhes && (
                              <div className="bg-muted/40 border border-border rounded-lg p-2.5 col-span-2">
                                <span className="text-[10px] font-medium text-muted-foreground uppercase block mb-0.5">Detalhes</span>
                                <p className="text-xs text-foreground whitespace-pre-wrap">{log.detalhes}</p>
                              </div>
                            )}
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
    </div>
  )
}
