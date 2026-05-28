"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, Users, Building2, Phone, Mail, Edit, Trash2, Filter, Plus, MapPin, FileText, ChevronRight, UserX, X } from "lucide-react"
import { ResizableTable, type ColumnDef } from "@/components/ui/resizable-table"
import { formatCNPJ, formatCPF, formatPhone } from "@/lib/utils"
import type { Cliente } from "@/types/database"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRouter } from "next/navigation"

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [distanceFilter, setDistanceFilter] = useState("all")
  const [cardFilter, setCardFilter] = useState<"all" | "empresas" | "com_contrato" | "sem_contrato">("all")
  const [logoMenu, setLogoMenu] = useState<string>("")
  const [expandedClientId, setExpandedClientId] = useState<string | null>(null)
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    loadClientes()
    loadLogoMenu()
  }, [])

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

  // Carregar clientes
  const loadClientes = async () => {
    try {
      setLoading(true)
      // Carregar todos os clientes sem filtro para fazer busca local
      const response = await fetch("/api/clientes?limit=1000")
      const result = await response.json()

      if (result.success) {
        console.log("Clientes carregados:", result.data?.length)
        setClientes(result.data || [])
      } else {
        console.error("Erro ao carregar clientes:", result.message)
        toast({
          title: "Erro",
          description: "Erro ao carregar clientes",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Erro ao carregar clientes:", error)
      toast({
        title: "Erro",
        description: "Erro de conexão ao carregar clientes",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Filtrar clientes usando useMemo para performance
  const filteredClientes = useMemo(() => {
    let filtered = [...clientes]

    // Filtro por card (categoria)
    if (cardFilter !== "all") {
      switch (cardFilter) {
        case "empresas":
          filtered = filtered.filter((c) => !!c.cnpj)
          break
        case "com_contrato":
          filtered = filtered.filter((c) => c.tem_contrato)
          break
        case "sem_contrato":
          filtered = filtered.filter((c) => !c.tem_contrato)
          break
      }
    }

    // Filtro por texto de busca
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase().trim()
      const searchNumbers = searchTerm.replace(/\D/g, "")

      filtered = filtered.filter((cliente) => {
        // Busca por nome (mais importante)
        const matchesName = cliente.nome?.toLowerCase().includes(searchLower) || false

        // Busca por código
        const matchesCodigo = cliente.codigo?.toLowerCase().includes(searchLower) || false

        // Busca por CNPJ (apenas números)
        const matchesCNPJ =
          searchNumbers.length > 0 && cliente.cnpj ? cliente.cnpj.replace(/\D/g, "").includes(searchNumbers) : false

        // Busca por CPF (apenas números)
        const matchesCPF =
          searchNumbers.length > 0 && cliente.cpf ? cliente.cpf.replace(/\D/g, "").includes(searchNumbers) : false

        // Busca por email
        const matchesEmail = cliente.email?.toLowerCase().includes(searchLower) || false

        // Busca por cidade
        const matchesCidade = cliente.cidade?.toLowerCase().includes(searchLower) || false

        // Busca por telefone (apenas números)
        const matchesTelefone =
          searchNumbers.length > 0 && cliente.telefone
            ? cliente.telefone.replace(/\D/g, "").includes(searchNumbers)
            : false

        // Busca por contato
        const matchesContato = cliente.contato?.toLowerCase().includes(searchLower) || false

        // Busca por endereço
        const matchesEndereco = cliente.endereco?.toLowerCase().includes(searchLower) || false

        // Busca por bairro
        const matchesBairro = cliente.bairro?.toLowerCase().includes(searchLower) || false

        return (
          matchesName ||
          matchesCodigo ||
          matchesCNPJ ||
          matchesCPF ||
          matchesEmail ||
          matchesCidade ||
          matchesTelefone ||
          matchesContato ||
          matchesEndereco ||
          matchesBairro
        )
      })
    }

    // Filtro por distância
    if (distanceFilter !== "all") {
      filtered = filtered.filter((cliente) => {
        const distance = cliente.distancia_km || 0
        switch (distanceFilter) {
          case "5":
            return distance <= 5
          case "10":
            return distance <= 10
          case "15":
            return distance <= 15
          case "20":
            return distance > 20
          default:
            return true
        }
      })
    }

    // Ordenar resultados: primeiro por contrato, depois por nome
    return filtered.sort((a, b) => {
      if (a.tem_contrato !== b.tem_contrato) {
        return b.tem_contrato ? 1 : -1
      }
      return (a.nome || "").localeCompare(b.nome || "")
    })
  }, [clientes, searchTerm, distanceFilter, cardFilter])

  const getCardFilterLabel = (filter: string) => {
    switch (filter) {
      case "empresas": return "Empresas"
      case "com_contrato": return "Com Contrato"
      case "sem_contrato": return "Sem Contrato"
      default: return ""
    }
  }

  const handleCardFilterToggle = (filter: "all" | "empresas" | "com_contrato" | "sem_contrato") => {
    setCardFilter(prev => prev === filter ? "all" : filter)
    setExpandedClientId(null)
  }

  const handleEditCliente = (cliente: Cliente) => {
    router.push(`/clientes/${cliente.id}/editar`)
  }

  const handleDeleteCliente = async (cliente: Cliente) => {
    try {
      const response = await fetch(`/api/clientes/${cliente.id}`, {
        method: "DELETE",
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Sucesso!",
          description: "Cliente excluído com sucesso",
        })
        setClientes((prev) => prev.filter((c) => c.id !== cliente.id))
      } else {
        toast({
          title: "Erro",
          description: result.message || "Erro ao excluir cliente",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Erro ao excluir cliente:", error)
      toast({
        title: "Erro",
        description: "Erro de conexão. Tente novamente.",
        variant: "destructive",
      })
    }
  }

  const formatDocument = (cnpj?: string, cpf?: string) => {
    if (cnpj) return formatCNPJ(cnpj)
    if (cpf) return formatCPF(cpf)
    return "N/A"
  }

  const getClienteType = (cnpj?: string, cpf?: string) => {
    if (cnpj) return "Empresa"
    if (cpf) return "Pessoa Física"
    return "N/A"
  }

  const getDistanceLabel = (distance?: number) => {
    if (!distance || distance === 0) return "N/A"
    return `${distance}km`
  }

  const getDistanceFilterLabel = (filter: string) => {
    switch (filter) {
      case "all":
        return "Todas as distâncias"
      case "5":
        return "Até 5km"
      case "10":
        return "Até 10km"
      case "15":
        return "Até 15km"
      case "20":
        return "Mais de 20km"
      default:
        return "Todas as distâncias"
    }
  }

  const handleNovoCliente = () => {
    router.push("/clientes/novo")
  }

  const toggleExpandClient = (id: string) => {
    setExpandedClientId(prev => prev === id ? null : id)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="container mx-auto p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Carregando clientes...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto p-3 md:p-6 space-y-4 md:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            {logoMenu && (
              <img
                src={logoMenu || "/placeholder.svg"}
                alt="Logo"
                className="h-12 w-12 object-contain rounded-lg shadow-md bg-white p-1"
              />
            )}
            <div>
              <h1 className="text-2xl lg:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Clientes
              </h1>
              <p className="text-sm lg:text-base text-gray-600 mt-1">Gerencie seus clientes e informações de contato</p>
            </div>
          </div>
          <Button onClick={handleNovoCliente}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Cliente
          </Button>
        </div>

        {/* Stats Cards — clicáveis como filtros */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6">
          <Card
            className={`border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100 hover:shadow-xl transition-all duration-300 cursor-pointer select-none ${
              cardFilter === "all" ? "ring-2 ring-blue-400 ring-offset-1" : "opacity-75 hover:opacity-100"
            }`}
            onClick={() => handleCardFilterToggle("all")}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 lg:p-6 pb-1 lg:pb-2">
              <CardTitle className="text-xs lg:text-sm font-medium text-blue-700">Total de Clientes</CardTitle>
              <Users className="h-3 w-3 lg:h-5 lg:w-5 text-blue-600" />
            </CardHeader>
            <CardContent className="p-3 lg:p-6 pt-0">
              <div className="text-lg lg:text-3xl font-bold text-blue-800">{clientes.length}</div>
              <p className="text-[10px] lg:text-xs text-blue-600 mt-0.5 lg:mt-1">
                {filteredClientes.length !== clientes.length && `${filteredClientes.length} filtrados`}
              </p>
            </CardContent>
          </Card>

          <Card
            className={`border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100 hover:shadow-xl transition-all duration-300 cursor-pointer select-none ${
              cardFilter === "empresas" ? "ring-2 ring-green-400 ring-offset-1" : "opacity-75 hover:opacity-100"
            }`}
            onClick={() => handleCardFilterToggle("empresas")}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 lg:p-6 pb-1 lg:pb-2">
              <CardTitle className="text-xs lg:text-sm font-medium text-green-700">Empresas</CardTitle>
              <Building2 className="h-3 w-3 lg:h-5 lg:w-5 text-green-600" />
            </CardHeader>
            <CardContent className="p-3 lg:p-6 pt-0">
              <div className="text-lg lg:text-3xl font-bold text-green-800">
                {clientes.filter((c) => c.cnpj).length}
              </div>
              <p className="text-[10px] lg:text-xs text-green-600 mt-0.5 lg:mt-1">Com CNPJ cadastrado</p>
            </CardContent>
          </Card>

          <Card
            className={`border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100 hover:shadow-xl transition-all duration-300 cursor-pointer select-none ${
              cardFilter === "com_contrato" ? "ring-2 ring-purple-400 ring-offset-1" : "opacity-75 hover:opacity-100"
            }`}
            onClick={() => handleCardFilterToggle("com_contrato")}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 lg:p-6 pb-1 lg:pb-2">
              <CardTitle className="text-xs lg:text-sm font-medium text-purple-700">Com Contrato</CardTitle>
              <FileText className="h-3 w-3 lg:h-5 lg:w-5 text-purple-600" />
            </CardHeader>
            <CardContent className="p-3 lg:p-6 pt-0">
              <div className="text-lg lg:text-3xl font-bold text-purple-800">
                {clientes.filter((c) => c.tem_contrato).length}
              </div>
              <p className="text-[10px] lg:text-xs text-purple-600 mt-0.5 lg:mt-1">Contratos ativos</p>
            </CardContent>
          </Card>

          <Card
            className={`border-0 shadow-lg bg-gradient-to-br from-orange-50 to-orange-100 hover:shadow-xl transition-all duration-300 cursor-pointer select-none ${
              cardFilter === "sem_contrato" ? "ring-2 ring-orange-400 ring-offset-1" : "opacity-75 hover:opacity-100"
            }`}
            onClick={() => handleCardFilterToggle("sem_contrato")}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 lg:p-6 pb-1 lg:pb-2">
              <CardTitle className="text-xs lg:text-sm font-medium text-orange-700">Sem Contrato</CardTitle>
              <UserX className="h-3 w-3 lg:h-5 lg:w-5 text-orange-600" />
            </CardHeader>
            <CardContent className="p-3 lg:p-6 pt-0">
              <div className="text-lg lg:text-3xl font-bold text-orange-800">
                {clientes.filter((c) => !c.tem_contrato).length}
              </div>
              <p className="text-[10px] lg:text-xs text-orange-600 mt-0.5 lg:mt-1">Sem contratos</p>
            </CardContent>
          </Card>
        </div>

        {/* Active card filter indicator */}
        {cardFilter !== "all" && (
          <div className="flex items-center gap-2 px-1">
            <Badge className="text-xs bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0 pl-2.5 pr-1.5 py-1 gap-1.5">
              Filtro: {getCardFilterLabel(cardFilter)}
              <button
                onClick={() => setCardFilter("all")}
                className="ml-0.5 rounded-full hover:bg-white/20 p-0.5 transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
            <span className="text-xs text-gray-500">
              {filteredClientes.length} cliente{filteredClientes.length !== 1 ? "s" : ""}
            </span>
          </div>
        )}

        {/* Search and Filters */}
        <Card className="border-0 shadow-lg bg-gradient-to-r from-white to-gray-50">
          <CardHeader className="p-3 md:p-6 pb-2 md:pb-3">
            <CardTitle className="text-base md:text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Buscar e Filtrar
            </CardTitle>
            <CardDescription className="text-xs md:text-sm">Pesquise por nome, código, documento, email, telefone ou cidade</CardDescription>
          </CardHeader>
          <CardContent className="p-3 md:p-6 pt-0">
            <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
              {/* Search Input */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Digite para buscar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              {/* Distance Filter */}
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-400" />
                <Select value={distanceFilter} onValueChange={setDistanceFilter}>
                  <SelectTrigger className="w-full sm:w-48 border-gray-200 focus:border-blue-500">
                    <SelectValue placeholder="Filtrar por distância" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as distâncias</SelectItem>
                    <SelectItem value="5">Até 5km</SelectItem>
                    <SelectItem value="10">Até 10km</SelectItem>
                    <SelectItem value="15">Até 15km</SelectItem>
                    <SelectItem value="20">Mais de 20km</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {(searchTerm || distanceFilter !== "all") && (
              <div className="mt-3 md:mt-4 flex flex-wrap gap-2">
                <p className="text-xs md:text-sm text-gray-600">
                  Mostrando {filteredClientes.length} de {clientes.length} clientes
                </p>
                {searchTerm && (
                  <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800">
                    Busca: &quot;{searchTerm}&quot;
                  </Badge>
                )}
                {distanceFilter !== "all" && (
                  <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-800">
                    {getDistanceFilterLabel(distanceFilter)}
                  </Badge>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ════════════════════════════════════════════════════════════════════
            MOBILE VIEW — Card-based layout (visible only on small screens)
           ════════════════════════════════════════════════════════════════════ */}
        <div className="md:hidden space-y-3">
          {/* Header count */}
          <div className="flex items-center justify-between px-1">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              {filteredClientes.length} cliente{filteredClientes.length !== 1 ? "s" : ""}
            </p>
          </div>

          {filteredClientes.length === 0 ? (
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-gray-300 mb-3" />
              <h3 className="text-base font-medium text-gray-900 mb-1">
                {searchTerm || distanceFilter !== "all" ? "Nenhum cliente encontrado" : "Nenhum cliente cadastrado"}
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                {searchTerm || distanceFilter !== "all"
                  ? "Tente ajustar os filtros"
                  : "Comece cadastrando seu primeiro cliente"}
              </p>
              {!searchTerm && distanceFilter === "all" && (
                <Button size="sm" onClick={handleNovoCliente}>
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                  Novo Cliente
                </Button>
              )}
            </div>
          ) : (
            filteredClientes.map((cliente) => {
              const isExpanded = expandedClientId === cliente.id

              return (
                <div
                  key={cliente.id}
                  className={`rounded-xl border transition-all duration-200 overflow-hidden ${
                    cliente.tem_contrato
                      ? "border-green-200 bg-gradient-to-r from-green-50/80 to-white"
                      : "border-gray-200 bg-white"
                  } ${isExpanded ? "shadow-lg ring-1 ring-blue-200" : "shadow-sm hover:shadow-md"}`}
                >
                  {/* Card principal — sempre visível */}
                  <button
                    type="button"
                    onClick={() => toggleExpandClient(cliente.id)}
                    className="w-full text-left p-3.5 flex items-center gap-3"
                  >
                    {/* Avatar / Iniciais */}
                    <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                      cliente.tem_contrato
                        ? "bg-green-100 text-green-700"
                        : cliente.cnpj
                          ? "bg-blue-100 text-blue-700"
                          : "bg-gray-100 text-gray-600"
                    }`}>
                      {(cliente.nome || "?").substring(0, 2).toUpperCase()}
                    </div>

                    {/* Info principal */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-gray-900 truncate">
                          {cliente.nome}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[11px] text-gray-500 font-mono">
                          {cliente.codigo}
                        </span>
                        <Badge
                          variant="secondary"
                          className={`text-[10px] px-1.5 py-0 h-4 ${
                            cliente.cnpj ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {getClienteType(cliente.cnpj, cliente.cpf)}
                        </Badge>
                        {cliente.tem_contrato && (
                          <Badge className="text-[10px] px-1.5 py-0 h-4 bg-green-100 text-green-700 border-0">
                            Contrato
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Chevron */}
                    <ChevronRight className={`h-4 w-4 text-gray-400 transition-transform duration-200 flex-shrink-0 ${
                      isExpanded ? "rotate-90" : ""
                    }`} />
                  </button>

                  {/* Conteúdo expandido — mini cards */}
                  {isExpanded && (
                    <div className="px-3.5 pb-3.5 pt-0 animate-in slide-in-from-top-2 duration-200">
                      <div className="border-t border-gray-100 pt-3 space-y-2">
                        {/* Grid de mini cards */}
                        <div className="grid grid-cols-2 gap-2">
                          {/* Documento */}
                          <div className="bg-gray-50 rounded-lg p-2.5">
                            <div className="flex items-center gap-1.5 mb-1">
                              <FileText className="h-3 w-3 text-gray-400" />
                              <span className="text-[10px] font-medium text-gray-500 uppercase">Documento</span>
                            </div>
                            <p className="text-xs font-mono text-gray-800 truncate">
                              {formatDocument(cliente.cnpj, cliente.cpf)}
                            </p>
                          </div>

                          {/* Distância */}
                          <div className="bg-gray-50 rounded-lg p-2.5">
                            <div className="flex items-center gap-1.5 mb-1">
                              <MapPin className="h-3 w-3 text-gray-400" />
                              <span className="text-[10px] font-medium text-gray-500 uppercase">Distância</span>
                            </div>
                            <p className="text-xs font-semibold text-gray-800">
                              {getDistanceLabel(cliente.distancia_km)}
                            </p>
                          </div>

                          {/* Telefone */}
                          {cliente.telefone && (
                            <div className="bg-gray-50 rounded-lg p-2.5">
                              <div className="flex items-center gap-1.5 mb-1">
                                <Phone className="h-3 w-3 text-gray-400" />
                                <span className="text-[10px] font-medium text-gray-500 uppercase">Telefone</span>
                              </div>
                              <a
                                href={`tel:${cliente.telefone}`}
                                className="text-xs text-blue-600 font-medium"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {formatPhone(cliente.telefone)}
                              </a>
                            </div>
                          )}

                          {/* Email */}
                          {cliente.email && (
                            <div className="bg-gray-50 rounded-lg p-2.5">
                              <div className="flex items-center gap-1.5 mb-1">
                                <Mail className="h-3 w-3 text-gray-400" />
                                <span className="text-[10px] font-medium text-gray-500 uppercase">Email</span>
                              </div>
                              <a
                                href={`mailto:${cliente.email}`}
                                className="text-xs text-blue-600 font-medium truncate block"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {cliente.email}
                              </a>
                            </div>
                          )}

                          {/* Contato */}
                          {cliente.contato && (
                            <div className="bg-gray-50 rounded-lg p-2.5">
                              <div className="flex items-center gap-1.5 mb-1">
                                <Users className="h-3 w-3 text-gray-400" />
                                <span className="text-[10px] font-medium text-gray-500 uppercase">Contato</span>
                              </div>
                              <p className="text-xs text-gray-800 truncate">{cliente.contato}</p>
                            </div>
                          )}

                          {/* Contrato */}
                          {cliente.tem_contrato && (
                            <div className="bg-green-50 rounded-lg p-2.5">
                              <div className="flex items-center gap-1.5 mb-1">
                                <FileText className="h-3 w-3 text-green-500" />
                                <span className="text-[10px] font-medium text-green-600 uppercase">Contrato</span>
                              </div>
                              <p className="text-xs font-semibold text-green-800">
                                {cliente.dia_contrato ? `Venc: Dia ${cliente.dia_contrato}` : "Ativo"}
                              </p>
                            </div>
                          )}

                          {/* Cidade */}
                          {cliente.cidade && (
                            <div className="bg-gray-50 rounded-lg p-2.5">
                              <div className="flex items-center gap-1.5 mb-1">
                                <Building2 className="h-3 w-3 text-gray-400" />
                                <span className="text-[10px] font-medium text-gray-500 uppercase">Cidade</span>
                              </div>
                              <p className="text-xs text-gray-800 truncate">
                                {cliente.cidade}{cliente.estado ? ` - ${cliente.estado}` : ""}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Endereço completo se existir */}
                        {cliente.endereco && (
                          <div className="bg-gray-50 rounded-lg p-2.5">
                            <div className="flex items-center gap-1.5 mb-1">
                              <MapPin className="h-3 w-3 text-gray-400" />
                              <span className="text-[10px] font-medium text-gray-500 uppercase">Endereço</span>
                            </div>
                            <p className="text-xs text-gray-800">
                              {cliente.endereco}{cliente.bairro ? ` - ${cliente.bairro}` : ""}
                            </p>
                          </div>
                        )}

                        {/* Botões de ação */}
                        <div className="flex gap-2 pt-1">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 h-9 text-xs font-medium text-blue-600 border-blue-200 hover:bg-blue-50"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleEditCliente(cliente)
                            }}
                          >
                            <Edit className="h-3.5 w-3.5 mr-1.5" />
                            Editar
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-9 text-xs font-medium text-red-600 border-red-200 hover:bg-red-50 bg-transparent px-3"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tem certeza que deseja excluir o cliente &quot;{cliente.nome}&quot;? Esta ação não pode ser desfeita.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteCliente(cliente)} className="bg-red-600 hover:bg-red-700">
                                  Excluir
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>

        {/* ════════════════════════════════════════════════════════════════════
            DESKTOP VIEW — ResizableTable (hidden on mobile)
           ════════════════════════════════════════════════════════════════════ */}
        <Card className="border-0 shadow-lg bg-white hidden md:block">
          <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-t-lg p-4 lg:p-6">
            <CardTitle className="text-white">Lista de Clientes</CardTitle>
            <CardDescription className="text-blue-100">
              {filteredClientes.length} cliente{filteredClientes.length !== 1 ? "s" : ""} encontrado
              {filteredClientes.length !== 1 ? "s" : ""} • Ordenados por contrato e nome
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {filteredClientes.length === 0 ? (
              <div className="text-center py-12">
                <Users className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                <h3 className="text-xl font-medium text-gray-900 mb-2">
                  {searchTerm || distanceFilter !== "all" ? "Nenhum cliente encontrado" : "Nenhum cliente cadastrado"}
                </h3>
                <p className="text-gray-600 mb-6">
                  {searchTerm || distanceFilter !== "all"
                    ? "Tente ajustar os termos de busca ou filtros"
                    : "Comece cadastrando seu primeiro cliente"}
                </p>
                {!searchTerm && distanceFilter === "all" && (
                  <Button onClick={handleNovoCliente}>
                    <Plus className="mr-2 h-4 w-4" />
                    Novo Cliente
                  </Button>
                )}
              </div>
            ) : (
              <ResizableTable<Cliente>
                storageKey="clientes"
                columns={[
                  { key: "codigo",       label: "Código",           width: 100, sortable: true },
                  { key: "nome",         label: "Nome/Razão Social", width: 220, sortable: true },
                  { key: "cnpj",         label: "Documento",         width: 160, sortable: false },
                  { key: "email",        label: "Contato",           width: 230, sortable: false },
                  { key: "distancia_km", label: "Distância",         width: 100, sortable: true },
                  { key: "tem_contrato", label: "Contrato",          width: 110, sortable: true },
                  { key: "acoes",        label: "Ações",             width: 100, sortable: false, noResize: true },
                ] as ColumnDef<Cliente>[]}
                data={filteredClientes}
                rowKey={(row) => row.id}
                rowClassName={(row) => row.tem_contrato ? "bg-green-50" : ""}
                renderCell={(cliente, col) => {
                  switch (col) {
                    case "codigo":
                      return <Badge variant="outline" className="font-mono">{cliente.codigo}</Badge>
                    case "nome":
                      return (
                        <div>
                          <div className="font-medium text-gray-900 truncate">{cliente.nome}</div>
                          {cliente.contato && <div className="text-sm text-gray-600">Contato: {cliente.contato}</div>}
                          <Badge
                            variant={cliente.cnpj ? "default" : "secondary"}
                            className={`mt-1 ${cliente.cnpj ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-800"}`}
                          >{getClienteType(cliente.cnpj, cliente.cpf)}</Badge>
                        </div>
                      )
                    case "cnpj":
                      return <div className="text-sm font-mono">{formatDocument(cliente.cnpj, cliente.cpf)}</div>
                    case "email":
                      return (
                        <div className="space-y-1">
                          {cliente.email && (
                            <div className="flex items-center text-sm">
                              <Mail className="h-3 w-3 mr-1 text-gray-400 flex-shrink-0" />
                              <span className="text-gray-700 truncate">{cliente.email}</span>
                            </div>
                          )}
                          {cliente.telefone && (
                            <div className="flex items-center text-sm">
                              <Phone className="h-3 w-3 mr-1 text-gray-400 flex-shrink-0" />
                              <span className="text-gray-700">{formatPhone(cliente.telefone)}</span>
                            </div>
                          )}
                        </div>
                      )
                    case "distancia_km":
                      return <Badge variant="outline" className="text-xs font-mono">{getDistanceLabel(cliente.distancia_km)}</Badge>
                    case "tem_contrato":
                      return (
                        <div>
                          <Badge
                            variant={cliente.tem_contrato ? "default" : "secondary"}
                            className={cliente.tem_contrato ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}
                          >{cliente.tem_contrato ? "Sim" : "Não"}</Badge>
                          {cliente.tem_contrato && cliente.dia_contrato && (
                            <div className="text-xs text-gray-600 mt-1">Venc: Dia {cliente.dia_contrato}</div>
                          )}
                        </div>
                      )
                    case "acoes":
                      return (
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleEditCliente(cliente)}
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 bg-transparent">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tem certeza que deseja excluir o cliente &quot;{cliente.nome}&quot;? Esta ação não pode ser desfeita.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteCliente(cliente)} className="bg-red-600 hover:bg-red-700">
                                  Excluir Cliente
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      )
                    default: return null
                  }
                }}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
