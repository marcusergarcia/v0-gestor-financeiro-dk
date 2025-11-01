"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Plus,
  FileText,
  Edit,
  Trash2,
  Eye,
  Calendar,
  DollarSign,
  TrendingUp,
  CheckCircle,
  MoreHorizontal,
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { formatCurrency } from "@/lib/utils"

interface PropostaContrato {
  id: string
  numero: string
  cliente_nome: string
  cliente_codigo: string
  tipo: string
  frequencia: string
  valor_total_proposta: number
  status: string
  data_proposta: string
  data_validade: string
  created_at: string
}

interface Contrato {
  id: string
  numero: string
  proposta_id: string
  cliente_nome: string
  tipo: string
  frequencia: string
  valor_mensal: number
  forma_pagamento: string
  prazo_meses: string | number
  status: string
  data_inicio: string
  data_fim: string
  data_assinatura: string
  created_at: string
}

interface PropostaStats {
  total: number
  rascunhos: number
  enviadas: number
  aprovadas: number
  valor_total: number
}

interface ContratoStats {
  total: number
  ativos: number
  suspensos: number
  cancelados: number
  valor_total: number
}

const formatDate = (dateString: string) => {
  if (!dateString) return "-"
  const date = new Date(dateString + "T00:00:00")
  return date.toLocaleDateString("pt-BR")
}

const formatDateShort = (dateString: string) => {
  if (!dateString) return "-"
  const date = new Date(dateString + "T00:00:00")
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })
}

const formatPrazo = (prazo: string | number) => {
  if (!prazo) return "-"
  if (prazo === "indeterminado") return "Indeterminado"
  return `${prazo} meses`
}

export default function ContratosPage() {
  const [propostas, setPropostas] = useState<PropostaContrato[]>([])
  const [contratos, setContratos] = useState<Contrato[]>([])
  const [propostaStats, setPropostaStats] = useState<PropostaStats>({
    total: 0,
    rascunhos: 0,
    enviadas: 0,
    aprovadas: 0,
    valor_total: 0,
  })
  const [contratoStats, setContratoStats] = useState<ContratoStats>({
    total: 0,
    ativos: 0,
    suspensos: 0,
    cancelados: 0,
    valor_total: 0,
  })
  const [loading, setLoading] = useState(true)
  const [propostaStatusFilter, setPropostaStatusFilter] = useState("all")
  const [contratoStatusFilter, setContratoStatusFilter] = useState("all")
  const { toast } = useToast()

  useEffect(() => {
    loadPropostas()
    loadContratos()
  }, [])

  const loadPropostas = async () => {
    try {
      const response = await fetch("/api/propostas-contratos")
      const result = await response.json()

      if (result.success) {
        setPropostas(result.data || [])
        setPropostaStats(result.stats || propostaStats)
      } else {
        toast({
          title: "Erro",
          description: result.message || "Erro ao carregar propostas",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Erro ao carregar propostas:", error)
      toast({
        title: "Erro",
        description: "Erro de conexão. Tente novamente.",
        variant: "destructive",
      })
    }
  }

  const loadContratos = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/contratos")
      const result = await response.json()

      if (result.success) {
        setContratos(result.data || [])
        setContratoStats(result.stats || contratoStats)
      } else {
        toast({
          title: "Erro",
          description: result.message || "Erro ao carregar contratos",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Erro ao carregar contratos:", error)
      toast({
        title: "Erro",
        description: "Erro de conexão. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const excluirProposta = async (numero: string) => {
    if (!confirm("Tem certeza que deseja excluir esta proposta?")) {
      return
    }

    try {
      const response = await fetch(`/api/propostas-contratos/${numero}`, {
        method: "DELETE",
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Sucesso!",
          description: "Proposta excluída com sucesso",
        })
        loadPropostas()
      } else {
        toast({
          title: "Erro",
          description: result.message || "Erro ao excluir proposta",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Erro ao excluir proposta:", error)
      toast({
        title: "Erro",
        description: "Erro de conexão. Tente novamente.",
        variant: "destructive",
      })
    }
  }

  const excluirContrato = async (numero: string) => {
    if (!confirm("Tem certeza que deseja excluir este contrato? Esta ação não pode ser desfeita.")) {
      return
    }

    try {
      const response = await fetch(`/api/contratos?numero=${numero}`, {
        method: "DELETE",
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Sucesso!",
          description: "Contrato excluído com sucesso",
        })
        loadContratos()
      } else {
        toast({
          title: "Erro",
          description: result.message || "Erro ao excluir contrato",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Erro ao excluir contrato:", error)
      toast({
        title: "Erro",
        description: "Erro de conexão. Tente novamente.",
        variant: "destructive",
      })
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      rascunho: { label: "Rascunho", variant: "secondary" as const },
      enviada: { label: "Enviada", variant: "default" as const },
      aprovada: { label: "Aprovada", variant: "default" as const },
      rejeitada: { label: "Rejeitada", variant: "destructive" as const },
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.rascunho

    return (
      <Badge variant={config.variant} className={status === "aprovada" ? "bg-green-500 hover:bg-green-600" : ""}>
        {config.label}
      </Badge>
    )
  }

  const getContratoStatusBadge = (status: string) => {
    const statusConfig = {
      ativo: { label: "Ativo", variant: "default" as const, color: "bg-green-500 hover:bg-green-600" },
      suspenso: { label: "Suspenso", variant: "secondary" as const, color: "bg-yellow-500 hover:bg-yellow-600" },
      cancelado: { label: "Cancelado", variant: "destructive" as const, color: "" },
      finalizado: { label: "Finalizado", variant: "outline" as const, color: "" },
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.ativo

    return (
      <Badge variant={config.variant} className={config.color}>
        {config.label}
      </Badge>
    )
  }

  const filteredPropostas = propostas.filter((proposta) => {
    if (propostaStatusFilter === "all") return true
    return proposta.status === propostaStatusFilter
  })

  const filteredContratos = contratos.filter((contrato) => {
    if (contratoStatusFilter === "all") return true
    return contrato.status === contratoStatusFilter
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="container mx-auto p-4 lg:p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Carregando contratos...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto p-4 lg:p-6 space-y-4 lg:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Contratos
            </h1>
            <p className="text-gray-600 mt-1 text-sm lg:text-base">Gerencie contratos e propostas de manutenção</p>
          </div>
        </div>

        {/* Stats Cards - Propostas */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 lg:gap-4">
          <Card
            className={`border-0 shadow-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white cursor-pointer hover:scale-105 transition-all duration-300 ${
              propostaStatusFilter === "all" ? "ring-2 ring-blue-300 ring-offset-2" : ""
            }`}
            onClick={() => setPropostaStatusFilter("all")}
          >
            <CardContent className="p-3 lg:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-xs lg:text-sm">Total Propostas</p>
                  <p className="text-lg lg:text-2xl font-bold">{propostaStats.total}</p>
                </div>
                <FileText className="h-6 w-6 lg:h-8 lg:w-8 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card
            className={`border-0 shadow-lg bg-gradient-to-br from-yellow-500 to-yellow-600 text-white cursor-pointer hover:scale-105 transition-all duration-300 ${
              propostaStatusFilter === "rascunho" ? "ring-2 ring-yellow-300 ring-offset-2" : ""
            }`}
            onClick={() => setPropostaStatusFilter("rascunho")}
          >
            <CardContent className="p-3 lg:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-100 text-xs lg:text-sm">Rascunhos</p>
                  <p className="text-lg lg:text-2xl font-bold">{propostaStats.rascunhos}</p>
                </div>
                <Edit className="h-6 w-6 lg:h-8 lg:w-8 text-yellow-200" />
              </div>
            </CardContent>
          </Card>

          <Card
            className={`border-0 shadow-lg bg-gradient-to-br from-purple-500 to-purple-600 text-white cursor-pointer hover:scale-105 transition-all duration-300 ${
              propostaStatusFilter === "enviada" ? "ring-2 ring-purple-300 ring-offset-2" : ""
            }`}
            onClick={() => setPropostaStatusFilter("enviada")}
          >
            <CardContent className="p-3 lg:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-xs lg:text-sm">Enviadas</p>
                  <p className="text-lg lg:text-2xl font-bold">{propostaStats.enviadas}</p>
                </div>
                <Calendar className="h-6 w-6 lg:h-8 lg:w-8 text-purple-200" />
              </div>
            </CardContent>
          </Card>

          <Card
            className={`border-0 shadow-lg bg-gradient-to-br from-green-500 to-green-600 text-white cursor-pointer hover:scale-105 transition-all duration-300 ${
              contratoStatusFilter === "ativo" ? "ring-2 ring-green-300 ring-offset-2" : ""
            }`}
            onClick={() => setContratoStatusFilter("ativo")}
          >
            <CardContent className="p-3 lg:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-xs lg:text-sm">Contratos Ativos</p>
                  <p className="text-lg lg:text-2xl font-bold">{contratoStats.ativos}</p>
                </div>
                <CheckCircle className="h-6 w-6 lg:h-8 lg:w-8 text-green-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-500 to-emerald-600 text-white col-span-2 lg:col-span-1">
            <CardContent className="p-3 lg:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-emerald-100 text-xs lg:text-sm">Valor Contratos</p>
                  <p className="text-sm lg:text-xl font-bold">{formatCurrency(contratoStats.valor_total)}</p>
                </div>
                <DollarSign className="h-6 w-6 lg:h-8 lg:w-8 text-emerald-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="propostas" className="space-y-4 lg:space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:w-[400px] p-1 bg-white">
            <TabsTrigger
              value="propostas"
              className="text-xs lg:text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white"
            >
              Propostas de Contratos
            </TabsTrigger>
            <TabsTrigger
              value="contratos"
              className="text-xs lg:text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-blue-600 data-[state=active]:text-white"
            >
              Contratos Ativos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="propostas" className="space-y-4 lg:space-y-6">
            <Card className="border-0 shadow-lg bg-white">
              <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-t-lg p-4 lg:p-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div>
                    <CardTitle className="text-white flex items-center gap-2 text-lg lg:text-xl">
                      <FileText className="h-4 w-4 lg:h-5 lg:w-5" />
                      Propostas de Contratos
                    </CardTitle>
                    <CardDescription className="text-blue-100 text-sm">
                      {filteredPropostas.length} proposta{filteredPropostas.length !== 1 ? "s" : ""} encontrada
                      {filteredPropostas.length !== 1 ? "s" : ""}
                    </CardDescription>
                  </div>
                  <Link href="/contratos/proposta/nova">
                    <Button className="bg-white text-blue-600 hover:bg-blue-50 text-sm lg:text-base">
                      <Plus className="h-4 w-4 mr-2" />
                      Nova Proposta
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="p-4 lg:p-6">
                {filteredPropostas.length === 0 ? (
                  <div className="text-center py-8 lg:py-12">
                    <FileText className="h-12 w-12 lg:h-16 lg:w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-base lg:text-lg font-semibold text-gray-600 mb-2">
                      {propostaStatusFilter === "all"
                        ? "Nenhuma proposta encontrada"
                        : "Nenhuma proposta nesta categoria"}
                    </h3>
                    <p className="text-gray-500 mb-6 text-sm lg:text-base">
                      {propostaStatusFilter === "all"
                        ? "Crie sua primeira proposta de contrato"
                        : "Tente ajustar os filtros"}
                    </p>
                    {propostaStatusFilter === "all" && (
                      <Link href="/contratos/proposta/nova">
                        <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white">
                          <Plus className="h-4 w-4 mr-2" />
                          Nova Proposta
                        </Button>
                      </Link>
                    )}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[100px]">Número</TableHead>
                          <TableHead className="min-w-[150px]">Cliente</TableHead>
                          <TableHead className="hidden md:table-cell w-[80px]">Tipo</TableHead>
                          <TableHead className="hidden lg:table-cell w-[100px]">Frequência</TableHead>
                          <TableHead className="w-[120px]">Valor Total</TableHead>
                          <TableHead className="w-[80px]">Status</TableHead>
                          <TableHead className="hidden sm:table-cell w-[90px]">Data</TableHead>
                          <TableHead className="hidden lg:table-cell w-[90px]">Validade</TableHead>
                          <TableHead className="w-[60px]">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredPropostas.map((proposta) => (
                          <TableRow key={proposta.id}>
                            <TableCell className="font-medium">
                              <Badge variant="outline" className="font-mono text-xs">
                                {proposta.numero}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div>
                                <div className="font-medium text-sm">{proposta.cliente_nome}</div>
                                {proposta.cliente_codigo && (
                                  <div className="text-xs text-gray-500 hidden sm:block">{proposta.cliente_codigo}</div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="hidden md:table-cell">
                              <Badge variant="outline" className="capitalize text-xs">
                                {proposta.tipo}
                              </Badge>
                            </TableCell>
                            <TableCell className="capitalize text-sm hidden lg:table-cell">
                              {proposta.frequencia}
                            </TableCell>
                            <TableCell className="font-medium text-green-600 text-sm">
                              {formatCurrency(proposta.valor_total_proposta)}
                            </TableCell>
                            <TableCell>{getStatusBadge(proposta.status)}</TableCell>
                            <TableCell className="text-sm hidden sm:table-cell">
                              {formatDateShort(proposta.data_proposta)}
                            </TableCell>
                            <TableCell className="text-sm hidden lg:table-cell">
                              {proposta.data_validade ? formatDateShort(proposta.data_validade) : "-"}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center justify-end">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem asChild>
                                      <Link
                                        href={`/contratos/proposta/${proposta.numero}`}
                                        className="flex items-center"
                                      >
                                        <Eye className="h-4 w-4 mr-2" />
                                        Visualizar
                                      </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                      <Link
                                        href={`/contratos/proposta/${proposta.numero}/editar`}
                                        className="flex items-center"
                                      >
                                        <Edit className="h-4 w-4 mr-2" />
                                        Editar
                                      </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      className="text-red-600 focus:text-red-600"
                                      onClick={() => excluirProposta(proposta.numero)}
                                    >
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Excluir
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contratos" className="space-y-4 lg:space-y-6">
            <Card className="border-0 shadow-lg bg-white">
              <CardHeader className="bg-gradient-to-r from-green-500 to-blue-600 text-white rounded-t-lg p-4 lg:p-6">
                <CardTitle className="text-white flex items-center gap-2 text-lg lg:text-xl">
                  <TrendingUp className="h-4 w-4 lg:h-5 lg:w-5" />
                  Contratos Ativos
                </CardTitle>
                <CardDescription className="text-green-100 text-sm">
                  {filteredContratos.length} contrato{filteredContratos.length !== 1 ? "s" : ""} encontrado
                  {filteredContratos.length !== 1 ? "s" : ""}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 lg:p-6">
                {filteredContratos.length === 0 ? (
                  <div className="text-center py-8 lg:py-12">
                    <TrendingUp className="h-12 w-12 lg:h-16 lg:w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-base lg:text-lg font-semibold text-gray-600 mb-2">
                      {contratoStatusFilter === "all" ? "Nenhum contrato ativo" : "Nenhum contrato nesta categoria"}
                    </h3>
                    <p className="text-gray-500 text-sm lg:text-base">
                      {contratoStatusFilter === "all"
                        ? "Contratos aparecerão aqui quando propostas forem aprovadas"
                        : "Tente ajustar os filtros"}
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[100px]">Número</TableHead>
                          <TableHead className="min-w-[150px]">Cliente</TableHead>
                          <TableHead className="hidden md:table-cell w-[80px]">Tipo</TableHead>
                          <TableHead className="w-[120px]">Valor Mensal</TableHead>
                          <TableHead className="w-[80px]">Status</TableHead>
                          <TableHead className="hidden sm:table-cell w-[90px]">Início</TableHead>
                          <TableHead className="hidden lg:table-cell w-[100px]">Prazo</TableHead>
                          <TableHead className="w-[60px]">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredContratos.map((contrato) => (
                          <TableRow key={contrato.id}>
                            <TableCell className="font-medium">
                              <Badge variant="outline" className="font-mono text-xs">
                                {contrato.numero}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="font-medium text-sm">{contrato.cliente_nome}</div>
                            </TableCell>
                            <TableCell className="hidden md:table-cell">
                              <Badge variant="outline" className="capitalize text-xs">
                                {contrato.tipo || "Conservação"}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-medium text-green-600 text-sm">
                              {formatCurrency(contrato.valor_mensal)}
                            </TableCell>
                            <TableCell>{getContratoStatusBadge(contrato.status)}</TableCell>
                            <TableCell className="text-sm hidden sm:table-cell">
                              {formatDateShort(contrato.data_inicio)}
                            </TableCell>
                            <TableCell className="hidden lg:table-cell">
                              <Badge variant="outline" className="text-xs">
                                {formatPrazo(contrato.prazo_meses)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center justify-end">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem asChild>
                                      <Link href={`/contratos/${contrato.numero}`} className="flex items-center">
                                        <Eye className="h-4 w-4 mr-2" />
                                        Visualizar
                                      </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                      <Link href={`/contratos/${contrato.numero}/editar`} className="flex items-center">
                                        <Edit className="h-4 w-4 mr-2" />
                                        Editar
                                      </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      className="text-red-600 focus:text-red-600"
                                      onClick={() => excluirContrato(contrato.numero)}
                                    >
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Excluir
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
