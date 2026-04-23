"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Progress } from "@/components/ui/progress"
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
  Building2,
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

// Componente de Loading Skeleton
function DashboardSkeleton() {
  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header Skeleton */}
      <div className="flex flex-col gap-4 mb-8">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>

      {/* Stats Cards Skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="border border-border">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <Skeleton className="h-10 w-10 rounded-xl" />
                <Skeleton className="h-5 w-16" />
              </div>
              <Skeleton className="h-8 w-24 mt-4" />
              <Skeleton className="h-3 w-32 mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Activity Section Skeleton */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="xl:col-span-2 border border-border">
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

        <Card className="border border-border">
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

// Componente de Card de KPI
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
  const colorClasses = {
    primary: {
      bg: "bg-primary/10",
      icon: "text-primary",
      badge: "bg-primary/10 text-primary",
    },
    success: {
      bg: "bg-[hsl(var(--success))]/10",
      icon: "text-[hsl(var(--success))]",
      badge: "bg-[hsl(var(--success))]/10 text-[hsl(var(--success))]",
    },
    warning: {
      bg: "bg-[hsl(var(--warning))]/10",
      icon: "text-[hsl(var(--warning))]",
      badge: "bg-[hsl(var(--warning))]/10 text-[hsl(var(--warning))]",
    },
    destructive: {
      bg: "bg-destructive/10",
      icon: "text-destructive",
      badge: "bg-destructive/10 text-destructive",
    },
    info: {
      bg: "bg-accent/10",
      icon: "text-accent",
      badge: "bg-accent/10 text-accent",
    },
  }

  const classes = colorClasses[color]

  return (
    <Card
      className={cn(
        "border border-border bg-card hover:shadow-lg transition-all duration-300 group",
        onClick && "cursor-pointer hover:border-primary/30",
      )}
      onClick={onClick}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className={cn("p-2.5 rounded-xl", classes.bg)}>
            <Icon className={cn("h-5 w-5", classes.icon)} />
          </div>
          {trend && trendValue && (
            <Badge variant="secondary" className={cn("text-xs font-medium", classes.badge)}>
              {trend === "up" && <TrendingUp className="h-3 w-3 mr-1" />}
              {trend === "down" && <TrendingDown className="h-3 w-3 mr-1" />}
              {trendValue}
            </Badge>
          )}
        </div>
        <div className="mt-4">
          <p className="text-2xl lg:text-3xl font-bold text-foreground tracking-tight">{value}</p>
          <p className="text-xs text-muted-foreground mt-1">{title}</p>
          <p className="text-[10px] lg:text-xs text-muted-foreground/70 mt-0.5">{subtitle}</p>
        </div>
        {onClick && (
          <div className="mt-3 flex items-center text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity">
            <span>Ver detalhes</span>
            <ArrowRight className="h-3 w-3 ml-1" />
          </div>
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

      const [clientesRes, boletosRes, orcamentosRes] = await Promise.all([
        fetch("/api/clientes"),
        fetch("/api/boletos"),
        fetch("/api/orcamentos"),
      ])

      const [clientesData, boletosData, orcamentosData] = await Promise.all([
        clientesRes.json(),
        boletosRes.json(),
        orcamentosRes.json(),
      ])

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
      <div className="p-4 lg:p-6">
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
          <p className="text-foreground font-medium">Erro ao carregar dados</p>
          <p className="text-muted-foreground text-sm mt-1">Tente recarregar a página</p>
        </div>
      </div>
    )
  }

  if (user && !canAccessRoute(user, "/dashboard")) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <Card className="w-full max-w-md border-border">
          <CardHeader className="text-center">
            <div className="w-16 h-16 rounded-full bg-[hsl(var(--warning))]/10 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="h-8 w-8 text-[hsl(var(--warning))]" />
            </div>
            <CardTitle>Acesso Restrito</CardTitle>
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
    <div className="p-4 lg:p-6 space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground tracking-tight">
            Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Visão geral dos indicadores do sistema
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={toggleShowValues}
          className="flex items-center gap-2 h-9 rounded-lg"
        >
          {showValues ? (
            <>
              <EyeOff className="h-4 w-4" />
              <span className="hidden sm:inline">Ocultar Valores</span>
            </>
          ) : (
            <>
              <Eye className="h-4 w-4" />
              <span className="hidden sm:inline">Mostrar Valores</span>
            </>
          )}
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total de Clientes"
          value={stats.totalClientes}
          subtitle={`${stats.clientesComContrato} com contrato ativo`}
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
        <Card className="xl:col-span-2 border border-border bg-card">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-semibold">Atividade Recente</CardTitle>
                <CardDescription className="text-sm">Últimos boletos e orçamentos</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild className="text-primary hover:text-primary hover:bg-primary/10">
                <Link href="/financeiro">
                  Ver Todos
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
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
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={cn(
                          "p-2 rounded-lg shrink-0",
                          item.tipo === "boleto" ? "bg-[hsl(var(--success))]/10" : "bg-primary/10"
                        )}>
                          {item.tipo === "boleto" ? (
                            <Receipt className={cn("h-4 w-4", "text-[hsl(var(--success))]")} />
                          ) : (
                            <FileText className="h-4 w-4 text-primary" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm text-foreground">{item.numero}</span>
                            <Badge variant="secondary" className={cn("text-xs border-0", config.className)}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {config.label}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground truncate">{item.cliente_nome}</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-semibold text-sm text-foreground">
                          {showValues ? formatCurrency(item.valor) : "R$ ****"}
                        </p>
                        <p className="text-xs text-muted-foreground">
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
        <Card className="border border-border bg-card">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold">Ações Rápidas</CardTitle>
            <CardDescription className="text-sm">Acesso às principais funcionalidades</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              variant="ghost"
              className="w-full justify-start h-11 hover:bg-accent/10 hover:text-accent rounded-lg group"
              asChild
            >
              <Link href="/ordem-servico/nova">
                <div className="p-1.5 rounded-lg bg-accent/10 mr-3 group-hover:bg-accent/20 transition-colors">
                  <Wrench className="h-4 w-4 text-accent" />
                </div>
                Nova Ordem de Serviço
              </Link>
            </Button>

            <Button
              variant="ghost"
              className="w-full justify-start h-11 hover:bg-[hsl(var(--success))]/10 hover:text-[hsl(var(--success))] rounded-lg group"
              asChild
            >
              <Link href="/orcamentos/novo">
                <div className="p-1.5 rounded-lg bg-[hsl(var(--success))]/10 mr-3 group-hover:bg-[hsl(var(--success))]/20 transition-colors">
                  <Plus className="h-4 w-4 text-[hsl(var(--success))]" />
                </div>
                Novo Orçamento
              </Link>
            </Button>

            <Button
              variant="ghost"
              className="w-full justify-start h-11 hover:bg-primary/10 hover:text-primary rounded-lg group"
              asChild
            >
              <Link href="/financeiro/novo">
                <div className="p-1.5 rounded-lg bg-primary/10 mr-3 group-hover:bg-primary/20 transition-colors">
                  <DollarSign className="h-4 w-4 text-primary" />
                </div>
                Novo Boleto
              </Link>
            </Button>

            <Button
              variant="ghost"
              className="w-full justify-start h-11 hover:bg-[hsl(var(--warning))]/10 hover:text-[hsl(var(--warning))] rounded-lg group"
              asChild
            >
              <Link href="/clientes/novo">
                <div className="p-1.5 rounded-lg bg-[hsl(var(--warning))]/10 mr-3 group-hover:bg-[hsl(var(--warning))]/20 transition-colors">
                  <Users className="h-4 w-4 text-[hsl(var(--warning))]" />
                </div>
                Novo Cliente
              </Link>
            </Button>

            <Button
              variant="ghost"
              className="w-full justify-start h-11 hover:bg-muted rounded-lg group"
              asChild
            >
              <Link href="/produtos/novo">
                <div className="p-1.5 rounded-lg bg-muted mr-3 group-hover:bg-muted/80 transition-colors">
                  <Package className="h-4 w-4 text-foreground" />
                </div>
                Novo Produto
              </Link>
            </Button>

            <Button
              variant="ghost"
              className="w-full justify-start h-11 hover:bg-primary/10 hover:text-primary rounded-lg group"
              asChild
            >
              <Link href="/contratos/proposta/nova">
                <div className="p-1.5 rounded-lg bg-primary/10 mr-3 group-hover:bg-primary/20 transition-colors">
                  <FileContract className="h-4 w-4 text-primary" />
                </div>
                Nova Proposta
              </Link>
            </Button>

            {/* Status do Sistema */}
            <div className="mt-4 p-4 bg-muted/30 rounded-lg">
              <h4 className="font-medium text-sm text-foreground mb-3 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[hsl(var(--success))] animate-pulse" />
                Status do Sistema
              </h4>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Sistema</span>
                  <Badge variant="secondary" className="bg-[hsl(var(--success))]/10 text-[hsl(var(--success))] border-0 text-xs">
                    Online
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Backup</span>
                  <Badge variant="secondary" className="bg-[hsl(var(--success))]/10 text-[hsl(var(--success))] border-0 text-xs">
                    Ativo
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts Section */}
      {(stats.boletosVencidos > 0 || stats.boletosPendentes > 5) && (
        <Card className="border border-destructive/30 bg-destructive/5">
          <CardContent className="p-4 lg:p-6">
            <div className="flex items-start gap-4">
              <div className="p-2.5 rounded-xl bg-destructive/10 shrink-0">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">Atenção Necessária</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {stats.boletosVencidos > 0 && (
                    <span>
                      Você tem <strong className="text-destructive">{stats.boletosVencidos} boleto{stats.boletosVencidos > 1 ? "s" : ""} vencido{stats.boletosVencidos > 1 ? "s" : ""}</strong>
                      {stats.boletosPendentes > 5 && " e "}
                    </span>
                  )}
                  {stats.boletosPendentes > 5 && (
                    <span>
                      <strong className="text-[hsl(var(--warning))]">{stats.boletosPendentes} boletos pendentes</strong> aguardando pagamento
                    </span>
                  )}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3 border-destructive/30 text-destructive hover:bg-destructive hover:text-destructive-foreground"
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
