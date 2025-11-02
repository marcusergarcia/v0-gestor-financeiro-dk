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
} from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { canAccessRoute } from "@/lib/redirect-helper"
import { useToast } from "@/hooks/use-toast"
import { formatCurrency } from "@/lib/utils"
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
    <div className="p-4 lg:p-6 space-y-4 lg:space-y-6">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6 lg:mb-8">
        <Skeleton className="h-10 w-10 lg:h-12 lg:w-12 rounded-lg" />
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
      </div>

      {/* Stats Cards Skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-5 w-5 rounded-full" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Activity Section Skeleton */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6">
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <Skeleton className="h-6 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardHeader>
            <Skeleton className="h-6 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentItems, setRecentItems] = useState<RecentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [logoMenu, setLogoMenu] = useState<string>("")
  const [showValues, setShowValues] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    console.log("=== Dashboard Page useEffect ===")
    console.log("User:", user?.nome)

    if (user) {
      const hasAccess = canAccessRoute(user, "/dashboard")
      console.log("Tem acesso ao dashboard?", hasAccess)

      if (!hasAccess) {
        console.log("Usuário sem acesso ao dashboard, redirecionando...")
        router.push("/sem-permissoes")
        return
      }
    }

    // Carregar preferência de exibição de valores do localStorage
    const savedShowValues = localStorage.getItem("dashboard-show-values")
    if (savedShowValues !== null) {
      setShowValues(savedShowValues === "true")
    }

    loadData()
    loadLogoMenu()
  }, [user, router])

  const toggleShowValues = () => {
    const newValue = !showValues
    setShowValues(newValue)
    localStorage.setItem("dashboard-show-values", String(newValue))
  }

  const formatValueOrHide = (value: number) => {
    if (!showValues) {
      return "R$ ••••••"
    }
    return formatCurrency(value)
  }

  const loadLogoMenu = async () => {
    try {
      const response = await fetch("/api/configuracoes/logos")
      const result = await response.json()
      if (result.success && result.data?.length > 0) {
        const menuLogo = result.data.find((logo: any) => logo.tipo === "menu")
        if (menuLogo?.arquivo_base64) {
          setLogoMenu(menuLogo.arquivo_base64)
        }
      }
    } catch (error) {
      console.error("Erro ao carregar logo do menu:", error)
    }
  }

  const loadData = async () => {
    try {
      setLoading(true)

      // Carregar estatísticas
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

        console.log("[v0] === DEBUG BOLETOS VENCIDOS ===")
        console.log("[v0] Total de boletos:", boletos.length)

        const boletosVencidos = boletos.filter((b: any) => {
          const isVencido = b.status === "vencido"
          if (isVencido) {
            console.log("[v0] Boleto vencido encontrado:", {
              numero: b.numero,
              status: b.status,
              vencimento: b.data_vencimento,
              valor: b.valor,
            })
          }
          return isVencido
        })

        console.log("[v0] Total de boletos vencidos:", boletosVencidos.length)
        console.log("[v0] Boletos vencidos:", boletosVencidos)

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

        // Combinar itens recentes
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

  const getStatusBadge = (status: string, tipo: string) => {
    const statusConfig: any = {
      boleto: {
        pendente: { label: "Pendente", className: "bg-yellow-100 text-yellow-800", icon: Clock },
        pago: { label: "Pago", className: "bg-green-100 text-green-800", icon: CheckCircle },
        vencido: { label: "Vencido", className: "bg-red-100 text-red-800", icon: AlertTriangle },
        cancelado: { label: "Cancelado", className: "bg-gray-100 text-gray-800", icon: AlertTriangle },
      },
      orcamento: {
        pendente: { label: "Aberto", className: "bg-blue-100 text-blue-800", icon: Clock },
        aprovado: { label: "Aprovado", className: "bg-green-100 text-green-800", icon: CheckCircle },
        rejeitado: { label: "Rejeitado", className: "bg-red-100 text-red-800", icon: AlertTriangle },
        cancelado: { label: "Cancelado", className: "bg-gray-100 text-gray-800", icon: AlertTriangle },
      },
    }

    const config = statusConfig[tipo]?.[status] || statusConfig.boleto.pendente
    const IconComponent = config.icon

    return (
      <Badge className={`${config.className} text-xs`}>
        <IconComponent className="h-3 w-3 mr-1" />
        <span className="hidden sm:inline">{config.label}</span>
        <span className="sm:hidden">{config.label.slice(0, 3)}</span>
      </Badge>
    )
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: window.innerWidth < 768 ? "2-digit" : "numeric",
    })
  }

  // Mostrar skeleton enquanto carrega
  if (loading) {
    return <DashboardSkeleton />
  }

  if (!stats) {
    return (
      <div className="p-4 lg:p-6">
        <div className="text-center">
          <p className="text-gray-600">Erro ao carregar dados do dashboard</p>
        </div>
      </div>
    )
  }

  // Verifica se o usuário tem permissão
  if (user && !canAccessRoute(user, "/dashboard")) {
    return (
      <div className="flex h-full items-center justify-center">
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Acesso Negado
            </CardTitle>
            <CardDescription>Você não tem permissão para acessar o Dashboard.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-4 lg:p-6 space-y-4 lg:space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 lg:mb-8">
        <div className="flex items-center gap-4">
          {logoMenu && (
            <img
              src={logoMenu || "/placeholder.svg"}
              alt="Logo"
              className="h-10 w-10 lg:h-12 lg:w-12 object-contain rounded-lg shadow-md bg-white p-1"
            />
          )}
          <div>
            <h1 className="text-2xl lg:text-4xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
              Dashboard Executivo
            </h1>
            <p className="text-sm lg:text-base text-gray-600 mt-1">
              Visão geral dos indicadores financeiros e operacionais
            </p>
          </div>
        </div>

        {/* Botão de Ocultar/Mostrar Valores */}
        <Button
          variant="outline"
          size="sm"
          onClick={toggleShowValues}
          className="flex items-center gap-2 bg-white hover:bg-gray-50 border-gray-300 shadow-sm"
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

      {/* Stats Cards - Grid 2x2 otimizado para mobile */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 lg:gap-6">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100 hover:shadow-xl transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 lg:p-6 pb-1 lg:pb-2">
            <CardTitle className="text-xs lg:text-sm font-medium text-blue-700">
              <span className="hidden sm:inline">Total Clientes</span>
              <span className="sm:hidden">Clientes</span>
            </CardTitle>
            <Users className="h-3 w-3 lg:h-5 lg:w-5 text-blue-600" />
          </CardHeader>
          <CardContent className="p-3 lg:p-6 pt-0">
            <div className="text-lg lg:text-3xl font-bold text-blue-800">{stats.totalClientes}</div>
            <p className="text-[10px] lg:text-xs text-blue-600 mt-0.5 lg:mt-1">
              <span className="hidden lg:inline">
                {stats.clientesComContrato} com contrato • {stats.totalEmpresas} empresas
              </span>
              <span className="lg:hidden">{stats.clientesComContrato} contratos</span>
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100 hover:shadow-xl transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 lg:p-6 pb-1 lg:pb-2">
            <CardTitle className="text-xs lg:text-sm font-medium text-green-700">
              <span className="hidden sm:inline">Receita Boletos</span>
              <span className="sm:hidden">Receita</span>
            </CardTitle>
            <DollarSign className="h-3 w-3 lg:h-5 lg:w-5 text-green-600" />
          </CardHeader>
          <CardContent className="p-3 lg:p-6 pt-0">
            <div className="text-sm lg:text-2xl font-bold text-green-800">
              {formatValueOrHide(stats.valorTotalBoletos)}
            </div>
            <p className="text-[10px] lg:text-xs text-green-600 mt-0.5 lg:mt-1">
              <span className="hidden lg:inline">{stats.totalBoletos} boletos emitidos</span>
              <span className="lg:hidden">{stats.totalBoletos} boletos</span>
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100 hover:shadow-xl transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 lg:p-6 pb-1 lg:pb-2">
            <CardTitle className="text-xs lg:text-sm font-medium text-purple-700">Orçamentos</CardTitle>
            <Calculator className="h-3 w-3 lg:h-5 lg:w-5 text-purple-600" />
          </CardHeader>
          <CardContent className="p-3 lg:p-6 pt-0">
            <div className="text-sm lg:text-2xl font-bold text-purple-800">
              {formatValueOrHide(stats.valorTotalOrcamentos)}
            </div>
            <p className="text-[10px] lg:text-xs text-purple-600 mt-0.5 lg:mt-1">
              <span className="hidden lg:inline">
                {stats.orcamentosAbertos} pendentes • {stats.orcamentosAprovados} concluídos
              </span>
              <span className="lg:hidden">{stats.orcamentosAbertos} pendentes</span>
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-yellow-50 to-yellow-100 hover:shadow-xl transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 lg:p-6 pb-1 lg:pb-2">
            <CardTitle className="text-xs lg:text-sm font-medium text-yellow-700">Alertas</CardTitle>
            <AlertTriangle className="h-3 w-3 lg:h-5 lg:w-5 text-yellow-600" />
          </CardHeader>
          <CardContent className="p-3 lg:p-6 pt-0">
            <div className="text-lg lg:text-3xl font-bold text-red-600">{stats.boletosVencidos}</div>
            <p className="text-[10px] lg:text-xs text-yellow-600 mt-0.5 lg:mt-1">
              <span className="hidden lg:inline">Boletos vencidos • {stats.boletosPendentes} pendentes</span>
              <span className="lg:hidden">Vencidos</span>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6">
        <Card className="border-0 shadow-lg bg-white hidden md:block">
          <CardHeader className="p-4 lg:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <CardTitle className="text-lg lg:text-xl font-bold text-gray-900">Atividade Recente</CardTitle>
                <CardDescription className="text-sm">Últimos boletos e orçamentos criados</CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild className="self-start sm:self-auto bg-transparent">
                <Link href="/financeiro">
                  <Eye className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Ver Todos</span>
                  <span className="sm:hidden">Ver</span>
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {recentItems.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-600">Nenhuma atividade recente</p>
              </div>
            ) : (
              <div className="w-full">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b">
                      <th className="text-left p-3 text-xs lg:text-sm font-semibold text-gray-700 w-[80px]">Tipo</th>
                      <th className="text-left p-3 text-xs lg:text-sm font-semibold text-gray-700 w-[100px]">Número</th>
                      <th className="text-left p-3 text-xs lg:text-sm font-semibold text-gray-700">Cliente</th>
                      <th className="text-right p-3 text-xs lg:text-sm font-semibold text-gray-700 w-[120px]">Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentItems.map((item) => (
                      <tr key={`${item.tipo}-${item.id}`} className="border-b hover:bg-gray-50">
                        <td className="p-3">
                          <Badge
                            variant="outline"
                            className={`text-xs ${item.tipo === "boleto" ? "text-green-600 border-green-200" : "text-blue-600 border-blue-200"}`}
                          >
                            {item.tipo === "boleto" ? (
                              <FileText className="h-3 w-3 mr-1" />
                            ) : (
                              <Calculator className="h-3 w-3 mr-1" />
                            )}
                            <span className="hidden sm:inline">{item.tipo === "boleto" ? "Boleto" : "Orçamento"}</span>
                            <span className="sm:hidden">{item.tipo === "boleto" ? "B" : "O"}</span>
                          </Badge>
                        </td>
                        <td className="p-3 font-medium text-xs lg:text-sm">{item.numero}</td>
                        <td className="p-3 text-xs lg:text-sm">
                          <div className="max-w-[200px] truncate" title={item.cliente_nome}>
                            {item.cliente_nome}
                          </div>
                        </td>
                        <td className="p-3 font-semibold text-green-600 text-xs lg:text-sm text-right">
                          {showValues ? formatCurrency(item.valor) : "R$ ••••"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-white">
          <CardHeader className="p-4 lg:p-6">
            <CardTitle className="text-lg lg:text-xl font-bold text-gray-900">Ações Rápidas</CardTitle>
            <CardDescription className="text-sm">Acesso rápido às principais funcionalidades</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 lg:space-y-3 p-4 lg:p-6">
            <div className="grid grid-cols-1 gap-2">
              <Button
                className="bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white justify-start h-9 text-sm"
                asChild
              >
                <Link href="/ordem-servico/nova">
                  <Wrench className="h-3 w-3 mr-2" />
                  Nova OS
                </Link>
              </Button>

              <Button
                className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white justify-start h-9 text-sm"
                asChild
              >
                <Link href="/orcamentos/novo">
                  <Plus className="h-3 w-3 mr-2" />
                  Novo Orçamento
                </Link>
              </Button>

              <Button
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white justify-start h-9 text-sm"
                asChild
              >
                <Link href="/financeiro/novo">
                  <Plus className="h-3 w-3 mr-2" />
                  Novo Boleto
                </Link>
              </Button>

              <Button
                className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white justify-start h-9 text-sm"
                asChild
              >
                <Link href="/clientes/novo">
                  <Plus className="h-3 w-3 mr-2" />
                  Novo Cliente
                </Link>
              </Button>

              <Button
                className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white justify-start h-9 text-sm"
                asChild
              >
                <Link href="/produtos/novo">
                  <Plus className="h-3 w-3 mr-2" />
                  Novo Produto
                </Link>
              </Button>

              <Button
                className="bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white justify-start h-9 text-sm"
                asChild
              >
                <Link href="/contratos/proposta/nova">
                  <FileContract className="h-3 w-3 mr-2" />
                  Nova Proposta
                </Link>
              </Button>
            </div>

            {/* Status do Sistema */}
            <div className="mt-3 lg:mt-6 p-3 lg:p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2 text-sm lg:text-base">
                <CheckCircle className="h-4 w-4 text-green-600" />
                Status do Sistema
              </h4>
              <div className="space-y-1 text-xs lg:text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Sistema</span>
                  <Badge className="bg-green-100 text-green-800 text-xs">Online</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">
                    <span className="hidden sm:inline">Última atualização</span>
                    <span className="sm:hidden">Atualização</span>
                  </span>
                  <span className="text-gray-500">Agora</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Backup</span>
                  <Badge className="bg-green-100 text-green-800 text-xs">Ativo</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alertas Importantes */}
      {(stats.boletosVencidos > 0 || stats.boletosPendentes > 5) && (
        <Card className="border-0 shadow-lg bg-gradient-to-r from-red-50 to-orange-50">
          <CardHeader className="p-4 lg:p-6">
            <CardTitle className="text-lg lg:text-xl font-bold text-red-800 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Alertas Importantes
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 lg:p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-4">
              {stats.boletosVencidos > 0 && (
                <div className="flex items-center gap-3 p-3 lg:p-4 bg-red-100 rounded-lg">
                  <AlertTriangle className="h-5 w-5 lg:h-6 lg:w-6 text-red-600 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-red-800 text-sm lg:text-base">
                      {stats.boletosVencidos} boleto{stats.boletosVencidos > 1 ? "s" : ""} vencido
                      {stats.boletosVencidos > 1 ? "s" : ""}
                    </p>
                    <p className="text-xs lg:text-sm text-red-600">
                      <span className="hidden sm:inline">Requer atenção imediata</span>
                      <span className="sm:hidden">Atenção imediata</span>
                    </p>
                  </div>
                </div>
              )}

              {stats.boletosPendentes > 5 && (
                <div className="flex items-center gap-3 p-3 lg:p-4 bg-yellow-100 rounded-lg">
                  <Clock className="h-5 w-5 lg:h-6 lg:w-6 text-yellow-600 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-yellow-800 text-sm lg:text-base">
                      {stats.boletosPendentes} boletos pendentes
                    </p>
                    <p className="text-xs lg:text-sm text-yellow-600">
                      <span className="hidden sm:inline">Acompanhar pagamentos</span>
                      <span className="sm:hidden">Acompanhar</span>
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
