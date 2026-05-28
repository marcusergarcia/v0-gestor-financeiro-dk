"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  DollarSign,
  FileText,
  Calculator,
  Users,
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye,
  EyeOff,
  Plus,
  LucideContrast as FileContract,
  Wrench,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Receipt,
  Package,
} from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { canAccessRoute } from "@/lib/redirect-helper"
import { useToast } from "@/hooks/use-toast"
import { formatCurrency, cn } from "@/lib/utils"
import Link from "next/link"

interface DashboardStats {
  totalClientes: number
  clientesComContrato: number
  totalEmpresas: number
  totalBoletos: number
  valorTotalBoletos: number
  boletosPendentes: number
  boletosVencidos: number
  totalOrcamentos: number
  orcamentosAbertos: number
  orcamentosAprovados: number
  valorTotalOrcamentos: number
}

interface RecentItem {
  id: number
  numero: string
  cliente_nome: string
  valor: number
  data: string
  status: string
  tipo: "boleto" | "orcamento"
}

// Componente de Loading Skeleton adaptado ao novo padrão
function DashboardSkeleton() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 bg-gradient-to-br from-slate-50 to-orange-50/30 min-h-screen">
      {/* Header Skeleton */}
      <div className="flex items-center gap-3 mb-6">
        <Skeleton className="h-8 w-8 rounded" />
        <div>
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96 mt-2" />
        </div>
      </div>

      {/* Stats Cards Skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="border-2 rounded-xl">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4" />
              </div>
              <Skeleton className="h-8 w-24 mt-4" />
              <Skeleton className="h-3 w-32 mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Activity Section Skeleton */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="xl:col-span-2 border-2 rounded-2xl">
          <CardHeader>
            <Skeleton className="h-6 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-14 w-full rounded-lg" />
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 rounded-2xl">
          <CardHeader>
            <Skeleton className="h-6 w-36 mb-2" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-10 w-full rounded-lg" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Componente de Card de KPI adaptado ao padrão visual premium do Calendário e Ordem de Serviço
function KPICard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendValue,
  color,
  onClick,
}: {
  title: string
  value: string | number
  subtitle: string
  icon: React.ElementType
  trend?: "up" | "down" | "neutral"
  trendValue?: string
  color: "primary" | "success" | "warning" | "destructive" | "info"
  onClick?: () => void
}) {
  const colorStyles = {
    primary: {
      card: "bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 dark:from-slate-900/60 dark:to-blue-950/30 dark:border-blue-900/40 text-blue-800",
      title: "text-blue-700 dark:text-blue-400",
      desc: "text-blue-600/80 dark:text-blue-500/80",
      icon: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-50 dark:bg-blue-950/40",
      badge: "bg-blue-600 text-white"
    },
    success: {
      card: "bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200 dark:from-slate-900/60 dark:to-emerald-950/30 dark:border-emerald-900/40 text-emerald-800",
      title: "text-emerald-700 dark:text-emerald-400",
      desc: "text-emerald-600/80 dark:text-emerald-500/80",
      icon: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-50 dark:bg-emerald-950/40",
      badge: "bg-emerald-600 text-white"
    },
    warning: {
      card: "bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200 dark:from-slate-900/60 dark:to-amber-950/30 dark:border-amber-900/40 text-amber-800",
      title: "text-amber-700 dark:text-amber-400",
      desc: "text-amber-600/80 dark:text-amber-500/80",
      icon: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-50 dark:bg-amber-950/40",
      badge: "bg-amber-600 text-white"
    },
    destructive: {
      card: "bg-gradient-to-br from-red-50 to-red-100 border-red-200 dark:from-slate-900/60 dark:to-red-950/30 dark:border-red-900/40 text-red-800",
      title: "text-red-700 dark:text-red-400",
      desc: "text-red-600/80 dark:text-red-500/80",
      icon: "text-red-600 dark:text-red-400",
      bg: "bg-red-50 dark:bg-red-950/40",
      badge: "bg-red-600 text-white"
    },
    info: {
      card: "bg-gradient-to-br from-cyan-50 to-cyan-100 border-cyan-200 dark:from-slate-900/60 dark:to-cyan-950/30 dark:border-cyan-900/40 text-cyan-800",
      title: "text-cyan-700 dark:text-cyan-400",
      desc: "text-cyan-600/80 dark:text-cyan-500/80",
      icon: "text-cyan-600 dark:text-cyan-400",
      bg: "bg-cyan-50 dark:bg-cyan-950/40",
      badge: "bg-cyan-600 text-white"
    }
  }

  const style = colorStyles[color]

  return (
    <Card
      className={cn(
        "cursor-pointer transition-all hover:shadow-lg hover:scale-105 border-2 rounded-xl overflow-hidden shadow-sm",
        style.card
      )}
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 md:p-4 pb-1">
        <CardTitle className={cn("text-xs md:text-sm font-medium", style.title)}>{title}</CardTitle>
        <Icon className={cn("h-4 w-4", style.icon)} />
      </CardHeader>
      <CardContent className="p-3 md:p-4 pt-0">
        <div className="text-xl md:text-2xl font-bold">{value}</div>
        <p className={cn("text-[10px] md:text-xs font-medium", style.desc)}>{subtitle}</p>
        {trend && trendValue && (
          <Badge className={cn("mt-2 border-0 text-[10px] py-0 px-2", style.badge)}>
            {trend === "up" && <TrendingUp className="h-2.5 w-2.5 mr-1" />}
            {trend === "down" && <TrendingDown className="h-2.5 w-2.5 mr-1" />}
            {trendValue}
          </Badge>
        )}
      </CardContent>
    </Card>
  )
}

export default function DashboardPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentItems, setRecentItems] = useState<RecentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showValues, setShowValues] = useState(true)
  const [logoMenu, setLogoMenu] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    if (user) {
      const hasAccess = canAccessRoute(user, "/dashboard")

      if (!hasAccess) {
        router.push("/sem-permissoes")
        return
      }
    }

    const savedShowValues = localStorage.getItem("dashboard-show-values")
    if (savedShowValues !== null) {
      setShowValues(savedShowValues === "true")
    }

    loadData()
  }, [user, router])

  const toggleShowValues = () => {
    const newValue = !showValues
    setShowValues(newValue)
    localStorage.setItem("dashboard-show-values", String(newValue))
  }

  const formatValueOrHide = (value: number) => {
    if (!showValues) {
      return "R$ ****"
    }
    return formatCurrency(value)
  }

  const loadData = async () => {
    try {
      setLoading(true)

      const [clientesRes, boletosRes, orcamentosRes, logoRes] = await Promise.all([
        fetch("/api/clientes"),
        fetch("/api/boletos"),
        fetch("/api/orcamentos"),
        fetch("/api/configuracoes/logos"),
      ])

      const [clientesData, boletosData, orcamentosData, logoResult] = await Promise.all([
        clientesRes.json(),
        boletosRes.json(),
        orcamentosRes.json(),
        logoRes.json(),
      ])

      if (logoResult.success && logoResult.data) {
        const logoMenuData = logoResult.data.find((logo: any) => logo.tipo === "menu")
        if (logoMenuData && logoMenuData.caminho) {
          setLogoMenu(logoMenuData.caminho)
        }
      }

      if (clientesData.success && boletosData.success && orcamentosData.success) {
        const clientes = clientesData.data || []
        const boletos = boletosData.data || []
        const orcamentos = orcamentosData.data || []

        const hoje = new Date()
        hoje.setHours(0, 0, 0, 0)

        const boletosVencidos = boletos.filter((b: any) => {
          if (b.status === "vencido") {
            return true
          }

          if (b.status === "pendente" && b.data_vencimento) {
            const vencimento = new Date(b.data_vencimento)
            vencimento.setHours(0, 0, 0, 0)
            return vencimento < hoje
          }

          return false
        })

        const dashboardStats: DashboardStats = {
          totalClientes: clientes.length,
          clientesComContrato: clientes.filter((c: any) => c.tem_contrato).length,
          totalEmpresas: clientes.filter((c: any) => c.cnpj && c.cnpj.trim() !== "").length,
          totalBoletos: boletos.length,
          valorTotalBoletos: boletos.reduce((acc: number, b: any) => acc + Number(b.valor || 0), 0),
          boletosPendentes: boletos.filter((b: any) => b.status === "pendente").length,
          boletosVencidos: boletosVencidos.length,
          totalOrcamentos: orcamentos.length,
          orcamentosAbertos: orcamentos.filter((o: any) => o.situacao === "pendente").length,
          orcamentosAprovados: orcamentos.filter((o: any) => o.situacao === "concluido").length,
          valorTotalOrcamentos: orcamentos.reduce((acc: number, o: any) => acc + Number(o.valor_total || 0), 0),
        }

        setStats(dashboardStats)

        const recentBoletos = boletos.slice(0, 3).map((b: any) => ({
          id: b.id,
          numero: b.numero,
          cliente_nome: b.cliente_nome || "Cliente não encontrado",
          valor: Number(b.valor || 0),
          data: b.created_at,
          status: b.status,
          tipo: "boleto" as const,
        }))

        const recentOrcamentos = orcamentos.slice(0, 3).map((o: any) => ({
          id: o.id,
          numero: o.numero,
          cliente_nome: o.cliente_nome || "Cliente não encontrado",
          valor: Number(o.valor_total || 0),
          data: o.created_at,
          status: o.situacao,
          tipo: "orcamento" as const,
        }))

        setRecentItems(
          [...recentBoletos, ...recentOrcamentos]
            .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
            .slice(0, 6),
        )
      }
    } catch (error) {
      console.error("Erro ao carregar dados do dashboard:", error)
      toast({
        title: "Erro",
        description: "Erro ao carregar dados do dashboard",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const getStatusConfig = (status: string, tipo: string) => {
    const statusConfig: any = {
      boleto: {
        pendente: { label: "Pendente", className: "bg-[hsl(var(--warning))]/10 text-[hsl(var(--warning))]", icon: Clock },
        pago: { label: "Pago", className: "bg-[hsl(var(--success))]/10 text-[hsl(var(--success))]", icon: CheckCircle },
        vencido: { label: "Vencido", className: "bg-destructive/10 text-destructive", icon: AlertTriangle },
        cancelado: { label: "Cancelado", className: "bg-muted text-muted-foreground", icon: AlertTriangle },
      },
      orcamento: {
        pendente: { label: "Aberto", className: "bg-primary/10 text-primary", icon: Clock },
        aprovado: { label: "Aprovado", className: "bg-[hsl(var(--success))]/10 text-[hsl(var(--success))]", icon: CheckCircle },
        concluido: { label: "Concluído", className: "bg-[hsl(var(--success))]/10 text-[hsl(var(--success))]", icon: CheckCircle },
        rejeitado: { label: "Rejeitado", className: "bg-destructive/10 text-destructive", icon: AlertTriangle },
        cancelado: { label: "Cancelado", className: "bg-muted text-muted-foreground", icon: AlertTriangle },
      },
    }

    return statusConfig[tipo]?.[status] || statusConfig.boleto.pendente
  }

  if (loading) {
    return <DashboardSkeleton />
  }

  if (!stats) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 bg-gradient-to-br from-slate-50 to-orange-50/30 min-h-screen">
        <div className="text-center py-20 bg-white/60 backdrop-blur-sm border-2 rounded-2xl p-6">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
          <p className="text-foreground font-medium text-lg">Erro ao carregar dados</p>
          <p className="text-muted-foreground text-sm mt-1">Tente recarregar a página</p>
        </div>
      </div>
    )
  }

  if (user && !canAccessRoute(user, "/dashboard")) {
    return (
      <div className="flex h-full items-center justify-center p-6 bg-gradient-to-br from-slate-50 to-orange-50/30 min-h-screen">
        <Card className="w-full max-w-md border-2 rounded-2xl shadow-xl">
          <CardHeader className="text-center">
            <div className="w-16 h-16 rounded-full bg-[hsl(var(--warning))]/10 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="h-8 w-8 text-[hsl(var(--warning))]" />
            </div>
            <CardTitle className="font-display font-bold text-xl">Acesso Restrito</CardTitle>
            <CardDescription>Você não tem permissão para acessar o Dashboard.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  const taxaConversao = stats.totalOrcamentos > 0 
    ? Math.round((stats.orcamentosAprovados / stats.totalOrcamentos) * 100) 
    : 0

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 bg-gradient-to-br from-slate-50 to-orange-50/30 min-h-screen animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          {logoMenu && (
            <img
              src={logoMenu || "/placeholder.svg"}
              alt="Logo"
              className="h-6 w-6 md:h-8 md:w-8 object-contain rounded"
            />
          )}
          <div>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Dashboard
            </h2>
            <p className="text-xs md:text-sm text-muted-foreground">
              Visão geral dos indicadores e performance do sistema
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={toggleShowValues}
          className="flex items-center justify-center gap-2 h-9 rounded-lg border-2 bg-transparent hover:bg-slate-50"
        >
          {showValues ? (
            <>
              <EyeOff className="h-4 w-4" />
              <span className="text-xs font-semibold">Ocultar Valores</span>
            </>
          ) : (
            <>
              <Eye className="h-4 w-4" />
              <span className="text-xs font-semibold">Mostrar Valores</span>
            </>
          )}
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total de Clientes"
          value={stats.totalClientes}
          subtitle={`${stats.clientesComContrato} contratos ativos`}
          icon={Users}
          color="primary"
          onClick={() => router.push("/clientes")}
        />

        <KPICard
          title="Receita em Boletos"
          value={formatValueOrHide(stats.valorTotalBoletos)}
          subtitle={`${stats.totalBoletos} boletos emitidos`}
          icon={DollarSign}
          color="success"
          onClick={() => router.push("/financeiro")}
        />

        <KPICard
          title="Total em Orçamentos"
          value={formatValueOrHide(stats.valorTotalOrcamentos)}
          subtitle={`${stats.orcamentosAbertos} pendentes`}
          icon={Calculator}
          trend={taxaConversao >= 50 ? "up" : "down"}
          trendValue={`${taxaConversao}% conversão`}
          color="info"
          onClick={() => router.push("/orcamentos")}
        />

        <KPICard
          title="Alertas"
          value={stats.boletosVencidos}
          subtitle={`${stats.boletosPendentes} boletos pendentes`}
          icon={AlertTriangle}
          color={stats.boletosVencidos > 0 ? "destructive" : "success"}
          onClick={() => router.push("/financeiro?status=vencido")}
        />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <Card className="xl:col-span-2 bg-white/60 backdrop-blur-sm border-white/20 shadow-xl rounded-2xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-4 lg:p-6 rounded-t-2xl">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base md:text-lg text-white">Atividade Recente</CardTitle>
                <CardDescription className="text-blue-100 text-xs md:text-sm">Últimos boletos e orçamentos emitidos</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild className="text-white hover:text-blue-200 hover:bg-white/10">
                <Link href="/financeiro">
                  Ver Todos
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-4 md:p-6">
            {recentItems.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                  <FileText className="h-7 w-7 text-muted-foreground" />
                </div>
                <p className="font-medium text-foreground">Nenhuma atividade</p>
                <p className="text-sm text-muted-foreground mt-1">Comece criando seu primeiro orçamento ou boleto</p>
              </div>
            ) : (
              <div className="space-y-2">
                {recentItems.map((item) => {
                  const config = getStatusConfig(item.status, item.tipo)
                  const StatusIcon = config.icon

                  return (
                    <div
                      key={`${item.tipo}-${item.id}`}
                      className="flex items-center justify-between p-3 rounded-lg bg-slate-50/50 border border-slate-200 hover:bg-slate-100/60 hover:shadow-sm transition-all duration-200 group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={cn(
                          "p-2 rounded-lg shrink-0",
                          item.tipo === "boleto" ? "bg-emerald-50 border border-emerald-200" : "bg-blue-50 border border-blue-200"
                        )}>
                          {item.tipo === "boleto" ? (
                            <Receipt className={cn("h-4 w-4 text-emerald-600")} />
                          ) : (
                            <FileText className="h-4 w-4 text-blue-600" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-foreground">{item.numero}</span>
                            <Badge className={cn("text-[10px] border py-0 px-2 font-semibold", config.className)}>
                              <StatusIcon className="h-2.5 w-2.5 mr-1" />
                              {config.label}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground truncate mt-0.5">{item.cliente_nome}</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-bold text-sm text-foreground">
                          {showValues ? formatCurrency(item.valor) : "R$ ****"}
                        </p>
                        <p className="text-[10px] font-medium text-muted-foreground mt-0.5">
                          {item.tipo === "boleto" ? "Boleto" : "Orçamento"}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="bg-white/60 backdrop-blur-sm border-white/20 shadow-xl rounded-2xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-4 lg:p-6 rounded-t-2xl">
            <CardTitle className="text-base md:text-lg text-white">Ações Rápidas</CardTitle>
            <CardDescription className="text-indigo-100 text-xs md:text-sm">Acesso direto às principais telas</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 p-4 md:p-6">
            <Button
              variant="ghost"
              className="w-full justify-start h-11 hover:bg-orange-50 hover:text-orange-700 rounded-lg group border-2 border-transparent hover:border-orange-200 transition-all duration-200"
              asChild
            >
              <Link href="/ordem-servico/nova">
                <div className="p-1.5 rounded-lg bg-orange-50 mr-3 group-hover:bg-orange-100 transition-colors border border-orange-200">
                  <Wrench className="h-4 w-4 text-orange-600" />
                </div>
                Nova Ordem de Serviço
              </Link>
            </Button>

            <Button
              variant="ghost"
              className="w-full justify-start h-11 hover:bg-emerald-50 hover:text-emerald-700 rounded-lg group border-2 border-transparent hover:border-emerald-200 transition-all duration-200"
              asChild
            >
              <Link href="/orcamentos/novo">
                <div className="p-1.5 rounded-lg bg-emerald-50 mr-3 group-hover:bg-emerald-100 transition-colors border border-emerald-200">
                  <Plus className="h-4 w-4 text-emerald-600" />
                </div>
                Novo Orçamento
              </Link>
            </Button>

            <Button
              variant="ghost"
              className="w-full justify-start h-11 hover:bg-blue-50 hover:text-blue-700 rounded-lg group border-2 border-transparent hover:border-blue-200 transition-all duration-200"
              asChild
            >
              <Link href="/financeiro/novo">
                <div className="p-1.5 rounded-lg bg-blue-50 mr-3 group-hover:bg-blue-100 transition-colors border border-blue-200">
                  <DollarSign className="h-4 w-4 text-blue-600" />
                </div>
                Novo Boleto
              </Link>
            </Button>

            <Button
              variant="ghost"
              className="w-full justify-start h-11 hover:bg-amber-50 hover:text-amber-700 rounded-lg group border-2 border-transparent hover:border-amber-200 transition-all duration-200"
              asChild
            >
              <Link href="/clientes/novo">
                <div className="p-1.5 rounded-lg bg-amber-50 mr-3 group-hover:bg-amber-100 transition-colors border border-amber-200">
                  <Users className="h-4 w-4 text-amber-600" />
                </div>
                Novo Cliente
              </Link>
            </Button>

            <Button
              variant="ghost"
              className="w-full justify-start h-11 hover:bg-slate-100 hover:text-slate-700 rounded-lg group border-2 border-transparent hover:border-slate-300 transition-all duration-200"
              asChild
            >
              <Link href="/produtos/novo">
                <div className="p-1.5 rounded-lg bg-slate-100 mr-3 group-hover:bg-slate-200 transition-colors border border-slate-300">
                  <Package className="h-4 w-4 text-slate-700" />
                </div>
                Novo Produto
              </Link>
            </Button>

            <Button
              variant="ghost"
              className="w-full justify-start h-11 hover:bg-cyan-50 hover:text-cyan-700 rounded-lg group border-2 border-transparent hover:border-cyan-200 transition-all duration-200"
              asChild
            >
              <Link href="/contratos/proposta/nova">
                <div className="p-1.5 rounded-lg bg-cyan-50 mr-3 group-hover:bg-cyan-100 transition-colors border border-cyan-200">
                  <FileContract className="h-4 w-4 text-cyan-600" />
                </div>
                Nova Proposta
              </Link>
            </Button>

            {/* Status do Sistema */}
            <div className="mt-4 p-4 bg-slate-50/80 border border-slate-200 rounded-xl shadow-xs">
              <h4 className="font-bold text-xs text-foreground mb-3 flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse border border-emerald-600" />
                Status do Sistema
              </h4>
              <div className="space-y-2 text-[10px] font-semibold">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Servidores</span>
                  <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] py-0 px-2">
                    Online
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Banco de Dados</span>
                  <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] py-0 px-2">
                    Conectado
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts Section */}
      {(stats.boletosVencidos > 0 || stats.boletosPendentes > 5) && (
        <Card className="border-2 border-red-200 bg-gradient-to-r from-red-50 to-rose-50 shadow-md rounded-2xl overflow-hidden">
          <CardContent className="p-4 lg:p-6">
            <div className="flex items-start gap-4">
              <div className="p-2.5 rounded-xl bg-red-100 border-2 border-red-300 shrink-0">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-red-800 text-sm md:text-base">Atenção Requerida</h3>
                <p className="text-xs md:text-sm text-red-700 mt-1">
                  {stats.boletosVencidos > 0 && (
                    <span>
                      Você possui <strong className="text-red-900 font-extrabold">{stats.boletosVencidos} boleto{stats.boletosVencidos > 1 ? "s" : ""} vencido{stats.boletosVencidos > 1 ? "s" : ""}</strong>
                      {stats.boletosPendentes > 5 && " e "}
                    </span>
                  )}
                  {stats.boletosPendentes > 5 && (
                    <span>
                      <strong className="text-amber-800 font-extrabold">{stats.boletosPendentes} boletos pendentes</strong> aguardando pagamento
                    </span>
                  )}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3 border-2 border-red-300 text-red-700 hover:bg-red-600 hover:text-white hover:border-red-600 transition-all font-semibold"
                  asChild
                >
                  <Link href="/financeiro?status=vencido">
                    Resolver Agora
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
