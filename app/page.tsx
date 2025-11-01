"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Skeleton } from "@/components/ui/skeleton"
import { getFirstAvailableRoute } from "@/lib/redirect-helper"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Calculator,
  FileText,
  Users,
  Package,
  DollarSign,
  TrendingUp,
  Calendar,
  Settings,
  BarChart3,
  PlusCircle,
} from "lucide-react"
import Link from "next/link"

export default function Home() {
  const router = useRouter()
  const { user, loading } = useAuth()

  useEffect(() => {
    if (!loading) {
      if (user) {
        // Redirecionar para a primeira rota disponível
        const firstRoute = getFirstAvailableRoute(user)
        router.replace(firstRoute)
      } else {
        // Se não estiver autenticado, redirecionar para login
        router.replace("/login")
      }
    }
  }, [user, loading, router])

  // Mostrar loading enquanto verifica autenticação
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="h-16 w-16 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-48 mx-auto" />
            <Skeleton className="h-4 w-64 mx-auto" />
          </div>
          <p className="text-sm text-gray-600">Carregando sistema...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between bg-white/70 backdrop-blur-sm rounded-xl p-6 shadow-soft border border-white/20">
        <div>
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Dashboard
          </h1>
          <p className="text-slate-600 mt-2">Bem-vindo ao Gestor Financeiro - Visão geral do sistema</p>
        </div>
        <Badge variant="secondary" className="text-sm bg-green-100 text-green-700 border-green-200">
          Sistema Ativo
        </Badge>
      </div>

      {/* Cards de Estatísticas Rápidas */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="card-glass card-hover border-0 shadow-soft">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-700">Orçamentos</CardTitle>
            <div className="p-2 bg-blue-100 rounded-lg">
              <Calculator className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">12</div>
            <p className="text-xs text-slate-500">+2 desde ontem</p>
          </CardContent>
        </Card>

        <Card className="card-glass card-hover border-0 shadow-soft">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-700">Boletos</CardTitle>
            <div className="p-2 bg-green-100 rounded-lg">
              <FileText className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">8</div>
            <p className="text-xs text-slate-500">3 vencendo hoje</p>
          </CardContent>
        </Card>

        <Card className="card-glass card-hover border-0 shadow-soft">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-700">Clientes</CardTitle>
            <div className="p-2 bg-purple-100 rounded-lg">
              <Users className="h-4 w-4 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">45</div>
            <p className="text-xs text-slate-500">+5 este mês</p>
          </CardContent>
        </Card>

        <Card className="card-glass card-hover border-0 shadow-soft">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-700">Receita</CardTitle>
            <div className="p-2 bg-emerald-100 rounded-lg">
              <DollarSign className="h-4 w-4 text-emerald-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">R$ 12.450</div>
            <p className="text-xs text-slate-500">+15% desde o mês passado</p>
          </CardContent>
        </Card>
      </div>

      {/* Ações Rápidas */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="card-glass card-hover border-0 shadow-soft group">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                <Calculator className="h-5 w-5 text-blue-600" />
              </div>
              <span className="text-slate-800">Novo Orçamento</span>
            </CardTitle>
            <CardDescription className="text-slate-600">Criar um novo orçamento para cliente</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/orcamentos/novo">
              <Button className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg">
                <PlusCircle className="h-4 w-4 mr-2" />
                Criar Orçamento
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="card-glass card-hover border-0 shadow-soft group">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
                <FileText className="h-5 w-5 text-green-600" />
              </div>
              <span className="text-slate-800">Gestão Financeira</span>
            </CardTitle>
            <CardDescription className="text-slate-600">Gerenciar boletos e recibos</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/financeiro">
              <Button
                variant="outline"
                className="w-full border-green-200 text-green-700 hover:bg-green-50 bg-transparent"
              >
                <DollarSign className="h-4 w-4 mr-2" />
                Acessar Financeiro
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="card-glass card-hover border-0 shadow-soft group">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
                <Users className="h-5 w-5 text-purple-600" />
              </div>
              <span className="text-slate-800">Clientes</span>
            </CardTitle>
            <CardDescription className="text-slate-600">Gerenciar cadastro de clientes</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/clientes">
              <Button
                variant="outline"
                className="w-full border-purple-200 text-purple-700 hover:bg-purple-50 bg-transparent"
              >
                <Users className="h-4 w-4 mr-2" />
                Ver Clientes
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Módulos do Sistema */}
      <Card className="card-glass border-0 shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <BarChart3 className="h-5 w-5 text-indigo-600" />
            </div>
            <span className="text-slate-800">Módulos do Sistema</span>
          </CardTitle>
          <CardDescription className="text-slate-600">Acesse todos os módulos disponíveis</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Link
              href="/orcamentos"
              className="flex items-center gap-3 p-4 rounded-xl bg-white/50 border border-white/20 hover:bg-white/80 hover:shadow-md transition-all duration-200 group"
            >
              <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                <Calculator className="h-4 w-4 text-blue-600" />
              </div>
              <span className="font-medium text-slate-700">Orçamentos</span>
            </Link>

            <Link
              href="/financeiro"
              className="flex items-center gap-3 p-4 rounded-xl bg-white/50 border border-white/20 hover:bg-white/80 hover:shadow-md transition-all duration-200 group"
            >
              <div className="p-2 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
                <DollarSign className="h-4 w-4 text-green-600" />
              </div>
              <span className="font-medium text-slate-700">Financeiro</span>
            </Link>

            <Link
              href="/clientes"
              className="flex items-center gap-3 p-4 rounded-xl bg-white/50 border border-white/20 hover:bg-white/80 hover:shadow-md transition-all duration-200 group"
            >
              <div className="p-2 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
                <Users className="h-4 w-4 text-purple-600" />
              </div>
              <span className="font-medium text-slate-700">Clientes</span>
            </Link>

            <Link
              href="/produtos"
              className="flex items-center gap-3 p-4 rounded-xl bg-white/50 border border-white/20 hover:bg-white/80 hover:shadow-md transition-all duration-200 group"
            >
              <div className="p-2 bg-orange-100 rounded-lg group-hover:bg-orange-200 transition-colors">
                <Package className="h-4 w-4 text-orange-600" />
              </div>
              <span className="font-medium text-slate-700">Produtos</span>
            </Link>

            <Link
              href="/contratos"
              className="flex items-center gap-3 p-4 rounded-xl bg-white/50 border border-white/20 hover:bg-white/80 hover:shadow-md transition-all duration-200 group"
            >
              <div className="p-2 bg-indigo-100 rounded-lg group-hover:bg-indigo-200 transition-colors">
                <FileText className="h-4 w-4 text-indigo-600" />
              </div>
              <span className="font-medium text-slate-700">Contratos</span>
            </Link>

            <Link
              href="/ordem-servico"
              className="flex items-center gap-3 p-4 rounded-xl bg-white/50 border border-white/20 hover:bg-white/80 hover:shadow-md transition-all duration-200 group"
            >
              <div className="p-2 bg-red-100 rounded-lg group-hover:bg-red-200 transition-colors">
                <Settings className="h-4 w-4 text-red-600" />
              </div>
              <span className="font-medium text-slate-700">Ordem de Serviço</span>
            </Link>

            <Link
              href="/relatorios"
              className="flex items-center gap-3 p-4 rounded-xl bg-white/50 border border-white/20 hover:bg-white/80 hover:shadow-md transition-all duration-200 group"
            >
              <div className="p-2 bg-cyan-100 rounded-lg group-hover:bg-cyan-200 transition-colors">
                <TrendingUp className="h-4 w-4 text-cyan-600" />
              </div>
              <span className="font-medium text-slate-700">Relatórios</span>
            </Link>

            <Link
              href="/configuracoes"
              className="flex items-center gap-3 p-4 rounded-xl bg-white/50 border border-white/20 hover:bg-white/80 hover:shadow-md transition-all duration-200 group"
            >
              <div className="p-2 bg-slate-100 rounded-lg group-hover:bg-slate-200 transition-colors">
                <Settings className="h-4 w-4 text-slate-600" />
              </div>
              <span className="font-medium text-slate-700">Configurações</span>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Atividades Recentes */}
      <Card className="card-glass border-0 shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Calendar className="h-5 w-5 text-amber-600" />
            </div>
            <span className="text-slate-800">Atividades Recentes</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 rounded-xl bg-blue-50/50 border border-blue-100/50 hover:bg-blue-50 transition-colors">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Calculator className="h-4 w-4 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-800">Orçamento #001 criado</p>
                <p className="text-xs text-slate-500">Cliente: João Silva - há 2 horas</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 rounded-xl bg-green-50/50 border border-green-100/50 hover:bg-green-50 transition-colors">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="h-4 w-4 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-800">Boleto #002 pago</p>
                <p className="text-xs text-slate-500">Valor: R$ 1.500,00 - há 4 horas</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 rounded-xl bg-purple-50/50 border border-purple-100/50 hover:bg-purple-50 transition-colors">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="h-4 w-4 text-purple-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-800">Novo cliente cadastrado</p>
                <p className="text-xs text-slate-500">Maria Santos - há 1 dia</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
