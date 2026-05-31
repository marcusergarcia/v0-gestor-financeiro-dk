"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, Users, Building2, Phone, Mail, Edit, Trash2, Filter, Plus, MapPin, FileText, ChevronLeft, ChevronRight, UserX, X, MoreHorizontal } from "lucide-react"
import { ResizableTable, type ColumnDef } from "@/components/ui/resizable-table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { formatCNPJ, formatCPF, formatPhone } from "@/lib/utils"
import type { Cliente } from "@/types/database"
import { ClienteFormDialog } from "@/components/cliente-form-dialog"
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { useRouter } from "next/navigation"

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [distanceFilter, setDistanceFilter] = useState("all")
  const [cardFilter, setCardFilter] = useState<"all" | "empresas" | "com_contrato" | "sem_contrato">("all")
  const [logoMenu, setLogoMenu] = useState<string>("")
  const [expandedClientId, setExpandedClientId] = useState<string | null>(null)
  const [pageIndex, setPageIndex] = useState(0)
  const [isClienteFormOpen, setIsClienteFormOpen] = useState(false)
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null)
  const [isEditClienteOpen, setIsEditClienteOpen] = useState(false)
  const [isDeleteClienteOpen, setIsDeleteClienteOpen] = useState(false)
  const [clienteToDelete, setClienteToDelete] = useState<Cliente | null>(null)
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    loadClientes()
    loadLogoMenu()
  }, [])

  useEffect(() => {
    setPageIndex(0)
  }, [searchTerm, distanceFilter, cardFilter])

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

  const paginatedClientes = useMemo(() => {
    return filteredClientes.slice(pageIndex * 10, (pageIndex + 1) * 10)
  }, [filteredClientes, pageIndex])

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
    setSelectedCliente(cliente)
    setIsEditClienteOpen(true)
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
    setIsClienteFormOpen(true)
  }

  const toggleExpandClient = (id: string) => {
    setExpandedClientId(prev => prev === id ? null : id)
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-muted-foreground text-sm">Carregando clientes...</p>
          </div>
        </div>
      </div>
    )
  }

  const hasActiveFilter = searchTerm.trim() !== "" || distanceFilter !== "all" || cardFilter !== "all"

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
              Clientes
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5 font-medium">Gerencie seus clientes e informações de contato</p>
          </div>
        </div>
        <Button onClick={handleNovoCliente} className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm h-9 px-4 text-sm font-medium transition-all">
          <Plus className="mr-2 h-4 w-4" />
          Novo Cliente
        </Button>
      </div>

      {/* Stats Cards — clicáveis como filtros */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card
          className={`border border-border shadow-xs hover:border-muted-foreground/30 transition-all duration-200 bg-card cursor-pointer select-none ${
            cardFilter === "all" ? "ring-2 ring-indigo-500 ring-offset-2 ring-offset-background" : ""
          }`}
          onClick={() => handleCardFilterToggle("all")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2">
            <CardTitle className="text-xs lg:text-sm font-semibold text-muted-foreground">Total de Clientes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground/70" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-xl lg:text-2xl font-bold text-foreground">{clientes.length}</div>
            <p className="text-[10px] lg:text-xs text-muted-foreground mt-0.5">
              {filteredClientes.length !== clientes.length ? `${filteredClientes.length} filtrados` : "cadastrados no sistema"}
            </p>
          </CardContent>
        </Card>

        <Card
          className={`border border-border shadow-xs hover:border-muted-foreground/30 transition-all duration-200 bg-card cursor-pointer select-none ${
            cardFilter === "empresas" ? "ring-2 ring-indigo-500 ring-offset-2 ring-offset-background" : ""
          }`}
          onClick={() => handleCardFilterToggle("empresas")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2">
            <CardTitle className="text-xs lg:text-sm font-semibold text-muted-foreground">Empresas</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground/70" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-xl lg:text-2xl font-bold text-foreground">
              {clientes.filter((c) => c.cnpj).length}
            </div>
            <p className="text-[10px] lg:text-xs text-muted-foreground mt-0.5">Com CNPJ cadastrado</p>
          </CardContent>
        </Card>

        <Card
          className={`border border-border shadow-xs hover:border-muted-foreground/30 transition-all duration-200 bg-card cursor-pointer select-none ${
            cardFilter === "com_contrato" ? "ring-2 ring-indigo-500 ring-offset-2 ring-offset-background" : ""
          }`}
          onClick={() => handleCardFilterToggle("com_contrato")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2">
            <CardTitle className="text-xs lg:text-sm font-semibold text-muted-foreground">Com Contrato</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground/70" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-xl lg:text-2xl font-bold text-foreground">
              {clientes.filter((c) => c.tem_contrato).length}
            </div>
            <p className="text-[10px] lg:text-xs text-muted-foreground mt-0.5">Contratos ativos</p>
          </CardContent>
        </Card>

        <Card
          className={`border border-border shadow-xs hover:border-muted-foreground/30 transition-all duration-200 bg-card cursor-pointer select-none ${
            cardFilter === "sem_contrato" ? "ring-2 ring-indigo-500 ring-offset-2 ring-offset-background" : ""
          }`}
          onClick={() => handleCardFilterToggle("sem_contrato")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2">
            <CardTitle className="text-xs lg:text-sm font-semibold text-muted-foreground">Sem Contrato</CardTitle>
            <UserX className="h-4 w-4 text-muted-foreground/70" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-xl lg:text-2xl font-bold text-foreground">
              {clientes.filter((c) => !c.tem_contrato).length}
            </div>
            <p className="text-[10px] lg:text-xs text-muted-foreground mt-0.5">Sem contratos</p>
          </CardContent>
        </Card>
      </div>

      {/* Active card filter indicator */}
      {cardFilter !== "all" && (
        <div className="flex items-center gap-2 px-1">
          <Badge variant="secondary" className="text-xs bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 border border-indigo-150 pl-2.5 pr-1.5 py-1 gap-1.5 font-medium rounded-lg">
            Filtro: {getCardFilterLabel(cardFilter)}
            <button
              onClick={() => setCardFilter("all")}
              className="ml-0.5 rounded-full hover:bg-indigo-100 dark:hover:bg-indigo-900/50 p-0.5 transition-colors text-indigo-700 dark:text-indigo-400"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
          <span className="text-xs text-muted-foreground font-medium">
            {filteredClientes.length} cliente{filteredClientes.length !== 1 ? "s" : ""}
          </span>
        </div>
      )}

      {/* Search and Filters */}
      <Card className="border border-border shadow-sm bg-card">
        <CardHeader className="p-4 md:p-6 pb-2">
          <CardTitle className="text-sm font-semibold text-foreground">
            Buscar e Filtrar
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground mt-0.5">
            Pesquise por nome, código, documento, email, telefone ou cidade
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 md:p-6 pt-0">
          <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground/60" />
              <Input
                placeholder="Digite para buscar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-border bg-background text-foreground focus-visible:ring-indigo-500"
              />
            </div>

            {/* Distance Filter */}
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground/60" />
              <Select value={distanceFilter} onValueChange={setDistanceFilter}>
                <SelectTrigger className="w-full sm:w-48 border-border bg-background text-foreground focus:ring-indigo-500">
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
              <p className="text-xs md:text-sm text-muted-foreground">
                Mostrando {filteredClientes.length} de {clientes.length} clientes
              </p>
              {searchTerm && (
                <Badge variant="secondary" className="text-xs bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 border border-indigo-100">
                  Busca: &quot;{searchTerm}&quot;
                </Badge>
              )}
              {distanceFilter !== "all" && (
                <Badge variant="secondary" className="text-xs bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 border border-indigo-100">
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
          {hasActiveFilter && (
            <div className="flex items-center justify-between px-1">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                {filteredClientes.length} cliente{filteredClientes.length !== 1 ? "s" : ""}
              </p>
            </div>
          )}

          {!hasActiveFilter ? (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-150 p-6 shadow-sm">
              <Search className="mx-auto h-12 w-12 text-gray-300 mb-3" />
              <h3 className="text-base font-medium text-gray-700 mb-1">Busque ou filtre para ver os clientes</h3>
              <p className="text-sm text-gray-500">Digite na busca ou selecione um filtro para começar.</p>
            </div>
          ) : filteredClientes.length === 0 ? (
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-gray-300 mb-3" />
              <h3 className="text-base font-medium text-gray-900 mb-1">Nenhum cliente encontrado</h3>
              <p className="text-sm text-gray-500 mb-4">Tente ajustar os filtros de busca.</p>
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
                        <span className="font-semibold text-sm text-gray-900 break-words whitespace-normal leading-tight">
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
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-9 text-xs font-medium text-red-600 border-red-200 hover:bg-red-50 bg-transparent px-3"
                            onClick={(e) => {
                              e.stopPropagation()
                              setClienteToDelete(cliente)
                              setIsDeleteClienteOpen(true)
                            }}
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

        {/* ════════════════════════════════════════════════════════════════════
            DESKTOP VIEW — ResizableTable (hidden on mobile)
           ════════════════════════════════════════════════════════════════════ */}
        <Card className="border border-border shadow-sm overflow-hidden hidden md:block">
          <CardHeader className="bg-muted/40 border-b border-border p-4 flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-sm font-semibold text-foreground">Lista de Clientes</CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                {filteredClientes.length} cliente{filteredClientes.length !== 1 ? "s" : ""} encontrado{filteredClientes.length !== 1 ? "s" : ""} • Ordenados por contrato e nome
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {filteredClientes.length === 0 ? (
              <div className="text-center py-12">
                <Users className="mx-auto h-16 w-16 text-muted-foreground/60 mb-4" />
                <h3 className="text-xl font-medium text-foreground mb-2">
                  {searchTerm || distanceFilter !== "all" ? "Nenhum cliente encontrado" : "Nenhum cliente cadastrado"}
                </h3>
                <p className="text-muted-foreground mb-6">
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
              <>
                <ResizableTable<Cliente>
                  storageKey="clientes"
                  columns={[
                    { key: "codigo",       label: "Código",           width: 100, sortable: true },
                    { key: "nome",         label: "Nome/Razão Social", width: 220, sortable: true },
                    { key: "cnpj",         label: "Documento",         width: 160, sortable: false },
                    { key: "email",        label: "Contato",           width: 230, sortable: false },
                    { key: "distancia_km", label: "Distância",         width: 100, sortable: true },
                    { key: "tem_contrato", label: "Contrato",          width: 110, sortable: true },
                    { key: "acoes",        label: "Ações",             width: 120, sortable: false, noResize: true },
                  ] as ColumnDef<Cliente>[]}
                  data={paginatedClientes}
                  rowKey={(row) => row.id}
                  rowClassName={(row) => row.tem_contrato ? "bg-emerald-500/5 dark:bg-emerald-950/20 hover:bg-emerald-500/10 dark:hover:bg-emerald-950/30" : ""}
                  renderCell={(cliente, col) => {
                    switch (col) {
                      case "codigo":
                        return <Badge variant="outline" className="font-mono text-xs bg-background text-foreground border-border">{cliente.codigo}</Badge>
                      case "nome":
                        return (
                          <div>
                            <div className="font-medium text-foreground truncate">{cliente.nome}</div>
                            {cliente.contato && <div className="text-xs text-muted-foreground">Contato: {cliente.contato}</div>}
                            <Badge
                              variant={cliente.cnpj ? "default" : "secondary"}
                              className={`mt-1 text-[10px] px-1.5 py-0 h-4 ${cliente.cnpj ? "bg-blue-100 dark:bg-blue-950/50 text-blue-800 dark:text-blue-300" : "bg-muted text-muted-foreground"}`}
                            >{getClienteType(cliente.cnpj, cliente.cpf)}</Badge>
                          </div>
                        )
                      case "cnpj":
                        return <div className="text-sm font-mono text-muted-foreground">{formatDocument(cliente.cnpj, cliente.cpf)}</div>
                      case "email":
                        return (
                          <div className="space-y-1">
                            {cliente.email && (
                              <div className="flex items-center text-xs">
                                <Mail className="h-3.5 w-3.5 mr-1 text-muted-foreground flex-shrink-0" />
                                <span className="text-foreground truncate">{cliente.email}</span>
                              </div>
                            )}
                            {cliente.telefone && (
                              <div className="flex items-center text-xs">
                                <Phone className="h-3.5 w-3.5 mr-1 text-muted-foreground flex-shrink-0" />
                                <span className="text-foreground">{formatPhone(cliente.telefone)}</span>
                              </div>
                            )}
                          </div>
                        )
                      case "distancia_km":
                        return <Badge variant="outline" className="text-xs font-mono bg-background text-foreground border-border">{getDistanceLabel(cliente.distancia_km)}</Badge>
                      case "tem_contrato":
                        return (
                          <div>
                            <Badge
                              variant={cliente.tem_contrato ? "default" : "secondary"}
                              className={cliente.tem_contrato ? "bg-green-100 dark:bg-green-950/50 text-green-800 dark:text-green-300 border-0" : "bg-muted text-muted-foreground"}
                            >{cliente.tem_contrato ? "Sim" : "Não"}</Badge>
                            {cliente.tem_contrato && cliente.dia_contrato && (
                              <div className="text-[11px] text-muted-foreground mt-1">Venc: Dia {cliente.dia_contrato}</div>
                            )}
                          </div>
                        )
                      case "acoes":
                        return (
                          <div className="flex items-center gap-1">
                            {/* Desktop View: Show buttons directly on large screens */}
                            <div className="hidden xl:flex gap-1">
                              <Button variant="outline" size="sm" onClick={() => handleEditCliente(cliente)}
                                className="text-blue-600 dark:text-blue-400 hover:bg-blue-500/10 border-blue-200 dark:border-blue-900/50 bg-transparent h-8 w-8 p-0" title="Editar">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="outline" size="sm"
                                onClick={() => {
                                  setClienteToDelete(cliente)
                                  setIsDeleteClienteOpen(true)
                                }}
                                className="text-red-600 dark:text-red-400 hover:bg-red-500/10 border-red-200 dark:border-red-900/50 bg-transparent h-8 w-8 p-0" title="Excluir">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                            {/* Mobile/Tablet View: Show dropdown menu on smaller screens */}
                            <div className="xl:hidden">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleEditCliente(cliente)}>
                                    <Edit className="h-4 w-4 mr-2" />Editar
                                  </DropdownMenuItem>
                                  <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={() => {
                                    setClienteToDelete(cliente)
                                    setIsDeleteClienteOpen(true)
                                  }}>
                                    <Trash2 className="h-4 w-4 mr-2" />Excluir
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        )
                      default: return null
                    }
                  }}
                />

                {/* Pagination Controls */}
                {filteredClientes.length > 0 && (
                  <div className="p-4 border-t border-border/40 flex items-center justify-between gap-4">
                    <div className="text-[10px] sm:text-xs text-muted-foreground">
                      Mostrando <span className="font-medium text-foreground">{paginatedClientes.length}</span> de{" "}
                      <span className="font-medium text-foreground">{filteredClientes.length}</span> registros
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
                        disabled={(pageIndex + 1) * 10 >= filteredClientes.length}
                        className="h-8 px-2 text-xs border-border bg-card"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
        <ClienteFormDialog
          open={isClienteFormOpen}
          onOpenChange={setIsClienteFormOpen}
          asDrawer={true}
          onSuccess={loadClientes}
        />
        <ClienteFormDialog
          open={isEditClienteOpen}
          onOpenChange={(open) => {
            setIsEditClienteOpen(open)
            if (!open) setSelectedCliente(null)
          }}
          asDrawer={true}
          cliente={selectedCliente}
          onSuccess={() => {
            loadClientes()
            setIsEditClienteOpen(false)
            setSelectedCliente(null)
          }}
        />
        <Sheet open={isDeleteClienteOpen} onOpenChange={setIsDeleteClienteOpen}>
          <SheetContent className="w-full sm:max-w-md h-full flex flex-col p-6 border-l border-border shadow-2xl bg-card text-foreground">
            <SheetHeader className="mb-6">
              <SheetTitle className="flex items-center gap-2 text-red-600">
                <Trash2 className="h-5 w-5" />
                Excluir Cliente
              </SheetTitle>
              <SheetDescription>
                Confirme a exclusão definitiva do cliente do sistema.
              </SheetDescription>
            </SheetHeader>
            <div className="flex-1 space-y-4">
              <p className="text-sm">
                Tem certeza que deseja excluir o cliente <strong className="text-foreground">{clienteToDelete?.nome}</strong>?
              </p>
              <p className="text-xs text-muted-foreground bg-destructive/10 text-destructive p-3 rounded-lg border border-destructive/20">
                Aviso: Esta ação não pode ser desfeita e removerá permanentemente o registro deste cliente.
              </p>
            </div>
            <div className="flex gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => setIsDeleteClienteOpen(false)}
                className="flex-1 bg-transparent border-border hover:bg-muted"
              >
                Cancelar
              </Button>
              <Button
                onClick={async () => {
                  if (clienteToDelete) {
                    await handleDeleteCliente(clienteToDelete)
                    setIsDeleteClienteOpen(false)
                  }
                }}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              >
                Excluir
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    )
  }
