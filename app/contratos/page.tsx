"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ResizableTable } from "@/components/ui/resizable-table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
  Plus,
  FileText,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Calendar,
  DollarSign,
  TrendingUp,
  CheckCircle,
  MoreHorizontal,
  FileCheck,
  Package,
  ChevronRight,
  Search,
  User,
  Filter,
  X,
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { formatCurrency } from "@/lib/utils"
import { EmitirNfseDialog } from "@/components/nfse/emitir-nfse-dialog"
import { NovoContratoDialog } from "@/components/contratos/novo-contrato-dialog"
import { EditarContratoDialog } from "@/components/contratos/editar-contrato-dialog"
import { VisualizarContratoDialog } from "@/components/contratos/visualizar-contrato-dialog"
import { NovaPropostaDialog } from "@/components/contratos/nova-proposta-dialog"
import { EditarPropostaDialog } from "@/components/contratos/editar-proposta-dialog"
import { VisualizarPropostaDialog } from "@/components/contratos/visualizar-proposta-dialog"

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
  cliente_id: string
  cliente_nome: string
  cliente_cnpj?: string
  cliente_cpf?: string
  cliente_email?: string
  cliente_telefone?: string
  cliente_endereco?: string
  cliente_bairro?: string
  cliente_cidade?: string
  cliente_estado?: string
  cliente_cep?: string
  tipo: string
  frequencia: string
  valor_mensal: number
  forma_pagamento: string
  prazo_meses: string | number
  status: string
  data_inicio: string
  data_fim: string
  data_assinatura: string
  dia_vencimento?: number
  equipamentos_inclusos?: string
  equipamentos_consignacao?: string
  servicos_inclusos?: string
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

  const [ocultarValores, setOcultarValores] = useState(true)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener("resize", checkMobile)

    const saved = localStorage.getItem("ocultar-valores")
    if (saved !== null) {
      setOcultarValores(JSON.parse(saved))
    }

    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  const toggleOcultarValores = () => {
    const newValue = !ocultarValores
    setOcultarValores(newValue)
    localStorage.setItem("ocultar-valores", JSON.stringify(newValue))
  }

  const shouldHideValues = ocultarValores || isMobile
  const [contratoStats, setContratoStats] = useState<ContratoStats>({
    total: 0,
    ativos: 0,
    suspensos: 0,
    cancelados: 0,
    valor_total: 0,
  })
  const [loading, setLoading] = useState(true)
  const [logoMenu, setLogoMenu] = useState<string>("")
  const [searchPropostas, setSearchPropostas] = useState("")
  const [searchContratos, setSearchContratos] = useState("")
  const [expandedPropostaId, setExpandedPropostaId] = useState<string | null>(null)
  const [expandedContratoId, setExpandedContratoId] = useState<string | null>(null)

  // Drawer states
  const [selectedContratoNumero, setSelectedContratoNumero] = useState<string | null>(null)
  const [selectedPropostaNumero, setSelectedPropostaNumero] = useState<string | null>(null)

  const [isNovoContratoOpen, setIsNovoContratoOpen] = useState(false)
  const [isEditarContratoOpen, setIsEditarContratoOpen] = useState(false)
  const [isVisualizarContratoOpen, setIsVisualizarContratoOpen] = useState(false)

  const [isNovaPropostaOpen, setIsNovaPropostaOpen] = useState(false)
  const [isEditarPropostaOpen, setIsEditarPropostaOpen] = useState(false)
  const [isVisualizarPropostaOpen, setIsVisualizarPropostaOpen] = useState(false)
  const [propostaStatusFilter, setPropostaStatusFilter] = useState("all")
  const [contratoStatusFilter, setContratoStatusFilter] = useState("all")
  // NFS-e state
  const [nfseDialogOpen, setNfseDialogOpen] = useState(false)
  const [nfseContrato, setNfseContrato] = useState<Contrato | null>(null)
  const [nfseMesReferencia, setNfseMesReferencia] = useState("")
  const [nfseMesPreventivaRef, setNfseMesPreventivaRef] = useState("")
  const [notasEmitidasContrato, setNotasEmitidasContrato] = useState<Record<string, { temNfse: boolean }>>({})
  // Month reference dialog
  const [mesRefDialogOpen, setMesRefDialogOpen] = useState(false)
  const [mesRefContrato, setMesRefContrato] = useState<Contrato | null>(null)
  const [mesRefSelecionado, setMesRefSelecionado] = useState("")
  const [anoRefSelecionado, setAnoRefSelecionado] = useState("")
  // Mes da preventiva (para a descricao)
  const [mesPreventivaRef, setMesPreventivaRef] = useState("")
  const [anoPreventivaRef, setAnoPreventivaRef] = useState("")
  const { toast } = useToast()

  const MESES = [
    { value: "01", label: "Janeiro" },
    { value: "02", label: "Fevereiro" },
    { value: "03", label: "Marco" },
    { value: "04", label: "Abril" },
    { value: "05", label: "Maio" },
    { value: "06", label: "Junho" },
    { value: "07", label: "Julho" },
    { value: "08", label: "Agosto" },
    { value: "09", label: "Setembro" },
    { value: "10", label: "Outubro" },
    { value: "11", label: "Novembro" },
    { value: "12", label: "Dezembro" },
  ]

  const currentYear = new Date().getFullYear()
  const ANOS = Array.from({ length: 5 }, (_, i) => String(currentYear - 1 + i))

  // Funcao para obter nome do mes
  const getMesNome = (mes: string): string => {
    return MESES.find(m => m.value === mes)?.label || mes
  }

  useEffect(() => {
    loadPropostas()
    loadContratos()
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
      // Buscar notas emitidas para controlar icones
      await fetchNotasEmitidasPorContrato()
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

  const fetchNotasEmitidasPorContrato = async () => {
    try {
      const nfseRes = await fetch("/api/nfse").catch(() => null)
      const mapa: Record<string, { temNfse: boolean }> = {}

      if (nfseRes?.ok) {
        const nfseData = await nfseRes.json()
        if (nfseData.success && nfseData.data) {
          for (const nf of nfseData.data) {
            if (nf.origem === "contrato" && nf.origem_numero && (nf.status === "emitida" || nf.status === "processando")) {
              const num = String(nf.origem_numero)
              // Track per month: key = "contrato_numero|mes_referencia"
              const mesRef = nf.descricao_servico?.match(/Ref\.\s*(\d{2}\/\d{4})/)?.[1] || ""
              const chave = mesRef ? `${num}|${mesRef}` : num
              if (!mapa[chave]) mapa[chave] = { temNfse: false }
              mapa[chave].temNfse = true
              // Also mark general
              if (!mapa[num]) mapa[num] = { temNfse: false }
              mapa[num].temNfse = true
            }
          }
        }
      }

      setNotasEmitidasContrato(mapa)
    } catch (error) {
      console.error("Erro ao buscar notas emitidas:", error)
    }
  }

  const parseEquipamentos = (contrato: Contrato): Array<{ nome: string; quantidade: number }> => {
    try {
      if (!contrato.equipamentos_inclusos) return []
      const parsed = JSON.parse(contrato.equipamentos_inclusos)
      if (Array.isArray(parsed)) {
        return parsed.map((item: any) => ({
          nome: item.nome || item.descricao || "Equipamento",
          quantidade: Number(item.quantidade) || 1,
        }))
      }
      return []
    } catch {
      return []
    }
  }

  const handleIniciarEmitirNfse = (contrato: Contrato) => {
    setMesRefContrato(contrato)
    // Default to current month for nota, and previous month for preventiva
    const now = new Date()
    setMesRefSelecionado(String(now.getMonth() + 1).padStart(2, "0"))
    setAnoRefSelecionado(String(now.getFullYear()))
    // Mes anterior para a preventiva
    const mesAnterior = now.getMonth() === 0 ? 12 : now.getMonth()
    const anoAnterior = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear()
    setMesPreventivaRef(String(mesAnterior).padStart(2, "0"))
    setAnoPreventivaRef(String(anoAnterior))
    setMesRefDialogOpen(true)
  }

  const handleConfirmarMesRef = () => {
    if (!mesRefSelecionado || !anoRefSelecionado || !mesRefContrato) return

    const mesReferencia = `${mesRefSelecionado}/${anoRefSelecionado}`
    
    setNfseMesReferencia(mesReferencia)
    // Guardar o mes da preventiva formatado
    const mesPreventivaFormatado = mesPreventivaRef && anoPreventivaRef 
      ? `${mesPreventivaRef}/${anoPreventivaRef}` 
      : ""
    setNfseMesPreventivaRef(mesPreventivaFormatado)
    setNfseContrato(mesRefContrato)
    setMesRefDialogOpen(false)
    setMesRefContrato(null)
    setNfseDialogOpen(true)
  }

  const buildDescricaoContrato = (contrato: Contrato, mesPreventivaFormatado?: string): string => {
    // Se tiver mes da preventiva, adicionar na descricao
    let descricao = mesPreventivaFormatado 
      ? `Referente a preventiva realizada em ${mesPreventivaFormatado} - Contrato ${contrato.numero}`
      : `Contrato ${contrato.numero}`

    const equipamentos = parseEquipamentos(contrato)
    if (equipamentos.length > 0) {
      descricao += `\n\nEquipamentos:`
      equipamentos.forEach((eq) => {
        descricao += `\n- ${eq.quantidade} ${eq.nome}`
      })
    }

    if (contrato.equipamentos_consignacao) {
      descricao += `\n\nEquipamentos em consignacao:`
      // Split by newlines to list each item on its own line
      const linhas = contrato.equipamentos_consignacao.split(/[\n\r]+/).filter(l => l.trim())
      linhas.forEach((linha) => {
        descricao += `\n- ${linha.trim()}`
      })
    }

    return descricao
  }

  const handleNfseSuccess = async () => {
    toast({
      title: "Sucesso!",
      description: "NFS-e emitida com sucesso!",
    })
    setNfseContrato(null)
    setNfseMesReferencia("")
    loadContratos()
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

  const filteredPropostas = useMemo(() => {
    let result = propostas
    if (propostaStatusFilter !== "all") {
      result = result.filter((p) => p.status === propostaStatusFilter)
    }
    if (searchPropostas.trim()) {
      const s = searchPropostas.toLowerCase()
      result = result.filter(
        (p) =>
          p.numero.toLowerCase().includes(s) ||
          p.cliente_nome.toLowerCase().includes(s) ||
          p.cliente_codigo?.toLowerCase().includes(s)
      )
    }
    return result
  }, [propostas, propostaStatusFilter, searchPropostas])

  const filteredContratos = useMemo(() => {
    let result = contratos
    if (contratoStatusFilter !== "all") {
      result = result.filter((c) => c.status === contratoStatusFilter)
    }
    if (searchContratos.trim()) {
      const s = searchContratos.toLowerCase()
      result = result.filter(
        (c) =>
          c.numero.toLowerCase().includes(s) ||
          c.cliente_nome.toLowerCase().includes(s)
      )
    }
    return result
  }, [contratos, contratoStatusFilter, searchContratos])

  const hasActiveFilterProposta = searchPropostas.trim() !== "" || propostaStatusFilter !== "all"
  const hasActiveFilterContrato = searchContratos.trim() !== "" || contratoStatusFilter !== "all"

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-muted-foreground text-sm">Carregando contratos...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto w-full text-foreground">
      {/* Header */}
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex items-center gap-4">
          {logoMenu && (
            <img
              src={logoMenu}
              alt="Logo"
              className="h-10 w-10 object-contain rounded-lg border border-border bg-card p-1"
            />
          )}
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground tracking-tight">
              Contratos & Propostas
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5 font-medium">Gerencie contratos e propostas de manutenção</p>
            <div className="mt-4">
              <Button
                onClick={toggleOcultarValores}
                variant="outline"
                className="border-indigo-200 dark:border-indigo-900/50 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 bg-background h-10 px-4 text-xs lg:text-sm font-semibold rounded-xl"
              >
                {shouldHideValues ? <Eye className="h-4 w-4 mr-2" /> : <EyeOff className="h-4 w-4 mr-2" />}
                {shouldHideValues ? "Mostrar Valores" : "Ocultar Valores"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards - Propostas */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 lg:gap-4">
        <Card
          className={`border border-border shadow-xs hover:border-muted-foreground/30 transition-all duration-200 bg-card cursor-pointer select-none ${
            propostaStatusFilter === "all" ? "ring-2 ring-blue-500 ring-offset-2 ring-offset-background" : ""
          }`}
          onClick={() => setPropostaStatusFilter("all")}
        >
          <CardContent className="p-3 lg:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 dark:text-blue-400 text-xs lg:text-sm font-medium">Total Propostas</p>
                <p className="text-lg lg:text-2xl font-bold text-foreground">{propostaStats.total}</p>
              </div>
              <FileText className="h-6 w-6 lg:h-8 lg:w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card
          className={`border border-border shadow-xs hover:border-muted-foreground/30 transition-all duration-200 bg-card cursor-pointer select-none ${
            propostaStatusFilter === "rascunho" ? "ring-2 ring-yellow-500 ring-offset-2 ring-offset-background" : ""
          }`}
          onClick={() => setPropostaStatusFilter("rascunho")}
        >
          <CardContent className="p-3 lg:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-600 dark:text-yellow-400 text-xs lg:text-sm font-medium">Rascunhos</p>
                <p className="text-lg lg:text-2xl font-bold text-foreground">{propostaStats.rascunhos}</p>
              </div>
              <Edit className="h-6 w-6 lg:h-8 lg:w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card
          className={`border border-border shadow-xs hover:border-muted-foreground/30 transition-all duration-200 bg-card cursor-pointer select-none ${
            propostaStatusFilter === "enviada" ? "ring-2 ring-purple-500 ring-offset-2 ring-offset-background" : ""
          }`}
          onClick={() => setPropostaStatusFilter("enviada")}
        >
          <CardContent className="p-3 lg:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-600 dark:text-purple-400 text-xs lg:text-sm font-medium">Enviadas</p>
                <p className="text-lg lg:text-2xl font-bold text-foreground">{propostaStats.enviadas}</p>
              </div>
              <Calendar className="h-6 w-6 lg:h-8 lg:w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card
          className={`border border-border shadow-xs hover:border-muted-foreground/30 transition-all duration-200 bg-card cursor-pointer select-none ${
            contratoStatusFilter === "ativo" ? "ring-2 ring-green-500 ring-offset-2 ring-offset-background" : ""
          }`}
          onClick={() => setContratoStatusFilter("ativo")}
        >
          <CardContent className="p-3 lg:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 dark:text-green-400 text-xs lg:text-sm font-medium">Contratos Ativos</p>
                <p className="text-lg lg:text-2xl font-bold text-foreground">{contratoStats.ativos}</p>
              </div>
              <CheckCircle className="h-6 w-6 lg:h-8 lg:w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border shadow-xs bg-card col-span-2 lg:col-span-1">
          <CardContent className="p-3 lg:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-600 dark:text-emerald-400 text-xs lg:text-sm font-medium">Valor Contratos</p>
                <p className="text-sm lg:text-xl font-bold text-foreground">
                  {shouldHideValues ? "R$ •••" : formatCurrency(contratoStats.valor_total)}
                </p>
              </div>
              <DollarSign className="h-6 w-6 lg:h-8 lg:w-8 text-emerald-500" />
            </div>
          </CardContent>
        </Card>
      </div>

        {/* Tabs */}
        <Tabs defaultValue="propostas" className="space-y-4 lg:space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:w-[400px] p-1 bg-muted dark:bg-slate-900/60 border border-border">
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
            {/* Search and Filters Propostas */}
            <Card className="border border-border shadow-md bg-card text-card-foreground">
              <CardHeader className="p-3 md:p-6 pb-2 md:pb-3">
                <CardTitle className="text-base md:text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-purple-400">
                  Buscar e Filtrar Propostas
                </CardTitle>
                <CardDescription className="text-xs md:text-sm">Pesquise por número ou nome do cliente</CardDescription>
              </CardHeader>
              <CardContent className="p-3 md:p-6 pt-0">
                <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
                  {/* Search Input */}
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Digite para buscar..."
                      value={searchPropostas}
                      onChange={(e) => setSearchPropostas(e.target.value)}
                      className="pl-10 border-border bg-background text-foreground focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>

                  {/* Status Filter */}
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-gray-400" />
                    <Select value={propostaStatusFilter} onValueChange={setPropostaStatusFilter}>
                      <SelectTrigger className="w-full sm:w-48 border-border bg-background text-foreground focus:border-blue-500">
                        <SelectValue placeholder="Filtrar por status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os status</SelectItem>
                        <SelectItem value="rascunho">Rascunho</SelectItem>
                        <SelectItem value="enviada">Enviada</SelectItem>
                        <SelectItem value="aprovada">Aprovada</SelectItem>
                        <SelectItem value="rejeitada">Rejeitada</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {(searchPropostas || propostaStatusFilter !== "all") && (
                  <div className="mt-3 md:mt-4 flex flex-wrap gap-2">
                    <p className="text-xs md:text-sm text-gray-600">
                      Mostrando {filteredPropostas.length} de {propostas.length} propostas
                    </p>
                    {searchPropostas && (
                      <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800">
                        Busca: &quot;{searchPropostas}&quot;
                      </Badge>
                    )}
                    {propostaStatusFilter !== "all" && (
                      <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-800">
                        Status: {propostaStatusFilter}
                      </Badge>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Desktop Table View */}
            <div className="hidden md:block">
              <Card className="border border-border shadow-md bg-card text-card-foreground">
                <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-t-lg p-4 lg:p-6 dark:from-blue-900/50 dark:to-purple-900/50 dark:border-b dark:border-border">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div>
                      <CardTitle className="text-white flex items-center gap-2 text-lg lg:text-xl">
                        <FileText className="h-4 w-4 lg:h-5 lg:w-5" />
                        Propostas de Contratos
                      </CardTitle>
                      <CardDescription className="text-blue-100 text-sm">
                        {filteredPropostas.length} proposta{filteredPropostas.length !== 1 ? "s" : ""} encontrada{filteredPropostas.length !== 1 ? "s" : ""}
                      </CardDescription>
                    </div>
                    <Link 
                      href="/contratos/proposta/nova"
                      onClick={(e) => {
                        e.preventDefault()
                        setIsNovaPropostaOpen(true)
                      }}
                    >
                      <Button className="bg-white text-blue-600 hover:bg-blue-50 text-sm lg:text-base dark:bg-slate-900 dark:text-blue-400 dark:hover:bg-slate-800 dark:border-slate-800">
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
                        <Link 
                          href="/contratos/proposta/nova"
                          onClick={(e) => {
                            e.preventDefault()
                            setIsNovaPropostaOpen(true)
                          }}
                        >
                          <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white">
                            <Plus className="h-4 w-4 mr-2" />
                            Nova Proposta
                          </Button>
                        </Link>
                      )}
                    </div>
                  ) : (
                    <ResizableTable
                      storageKey="propostas"
                      columns={[
                        { key: "numero",                label: "Número",      width: 100, sortable: true },
                        { key: "cliente_nome",          label: "Cliente",      width: 180, sortable: true },
                        { key: "tipo",                  label: "Tipo",         width: 100, sortable: true },
                        { key: "frequencia",             label: "Frequência",   width: 110, sortable: true },
                        { key: "valor_total_proposta",   label: "Valor Total",  width: 130, sortable: true },
                        { key: "status",                label: "Status",       width: 100, sortable: true },
                        { key: "data_proposta",          label: "Data",         width: 90,  sortable: true },
                        { key: "data_validade",          label: "Validade",     width: 90,  sortable: true },
                        { key: "acoes",                 label: "Ações",        width: 120,  sortable: false, noResize: true },
                      ]}
                      data={filteredPropostas}
                      rowKey={(row) => row.id}
                      renderCell={(proposta, col) => {
                        switch (col) {
                          case "numero": return <Badge variant="outline" className="font-mono text-xs">{proposta.numero}</Badge>
                          case "cliente_nome":
                            return (
                              <div>
                                <div className="font-medium text-sm truncate">{proposta.cliente_nome}</div>
                                {proposta.cliente_codigo && <div className="text-xs text-gray-500">{proposta.cliente_codigo}</div>}
                              </div>
                            )
                          case "tipo": return <Badge variant="outline" className="capitalize text-xs">{proposta.tipo}</Badge>
                          case "frequencia": return <span className="capitalize text-sm">{proposta.frequencia}</span>
                          case "valor_total_proposta": return <span className="font-medium text-green-600 text-sm">{shouldHideValues ? "R$ •••" : formatCurrency(proposta.valor_total_proposta)}</span>
                          case "status": return getStatusBadge(proposta.status)
                          case "data_proposta": return <span className="text-sm">{formatDateShort(proposta.data_proposta)}</span>
                          case "data_validade": return <span className="text-sm">{proposta.data_validade ? formatDateShort(proposta.data_validade) : "-"}</span>
                          case "acoes":
                            return (
                              <div className="flex items-center gap-1">
                                {/* Desktop View: Show buttons directly on large screens */}
                                <div className="hidden xl:flex gap-1">
                                  <Button size="sm" variant="outline"
                                    onClick={() => {
                                      setSelectedPropostaNumero(proposta.numero)
                                      setIsVisualizarPropostaOpen(true)
                                    }}
                                    className="text-blue-600 dark:text-blue-400 hover:bg-blue-500/10 border-blue-200 dark:border-blue-900/50 bg-transparent h-8 w-8 p-0" title="Visualizar">
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button size="sm" variant="outline"
                                    onClick={() => {
                                      setSelectedPropostaNumero(proposta.numero)
                                      setIsEditarPropostaOpen(true)
                                    }}
                                    className="text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/10 border-indigo-200 dark:border-indigo-900/50 bg-transparent h-8 w-8 p-0" title="Editar">
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button size="sm" variant="outline"
                                    onClick={() => excluirProposta(proposta.numero)}
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
                                      <DropdownMenuItem onClick={() => {
                                        setSelectedPropostaNumero(proposta.numero)
                                        setIsVisualizarPropostaOpen(true)
                                      }}>
                                        <Eye className="h-4 w-4 mr-2" />Visualizar
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => {
                                        setSelectedPropostaNumero(proposta.numero)
                                        setIsEditarPropostaOpen(true)
                                      }}>
                                        <Edit className="h-4 w-4 mr-2" />Editar
                                      </DropdownMenuItem>
                                      <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={() => excluirProposta(proposta.numero)}>
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
                  )}
                </CardContent>
              </Card>
            </div>

            {/* MOBILE VIEW - Card-based layout */}
            <div className="md:hidden space-y-3">
              <div className="flex justify-between items-center px-1 mb-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {filteredPropostas.length} proposta{filteredPropostas.length !== 1 ? "s" : ""}
                </p>
                <Link 
                  href="/contratos/proposta/nova"
                  onClick={(e) => {
                    e.preventDefault()
                    setIsNovaPropostaOpen(true)
                  }}
                >
                  <Button size="sm" className="bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs h-8">
                    <Plus className="h-3.5 w-3.5 mr-1" /> Nova Proposta
                  </Button>
                </Link>
              </div>

              {!hasActiveFilterProposta ? (
                <div className="text-center py-12 bg-card rounded-xl border border-border p-6 shadow-sm">
                  <Search className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                  <h3 className="text-base font-medium text-gray-700 mb-1">Busque ou filtre para ver as propostas</h3>
                  <p className="text-sm text-gray-500">Digite na busca ou selecione um filtro para começar.</p>
                </div>
              ) : filteredPropostas.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                  <h3 className="text-base font-medium text-gray-900 mb-1">Nenhuma proposta encontrada</h3>
                  <p className="text-sm text-gray-500">Tente ajustar os filtros de busca.</p>
                </div>
              ) : (
                filteredPropostas.map((proposta) => {
                  const isExpanded = expandedPropostaId === proposta.id
                  return (
                    <div
                      key={proposta.id}
                      className={`rounded-xl border transition-all duration-200 overflow-hidden ${
                        proposta.status === "aprovada"
                          ? "border-green-200/30 bg-gradient-to-r from-green-950/20 to-card"
                          : "border-border bg-card text-card-foreground"
                      } ${isExpanded ? "shadow-lg ring-1 ring-blue-200/30" : "shadow-sm hover:shadow-md"}`}
                    >
                      <button
                        type="button"
                        onClick={() => setExpandedPropostaId(prev => prev === proposta.id ? null : proposta.id)}
                        className="w-full text-left p-3.5 flex items-center gap-3"
                      >
                        <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                          proposta.status === "aprovada"
                            ? "bg-green-100 text-green-700"
                            : "bg-blue-100 text-blue-700"
                        }`}>
                          {(proposta.cliente_nome || "?").substring(0, 2).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm text-foreground break-words whitespace-normal leading-tight">
                              {proposta.cliente_nome}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[11px] text-muted-foreground font-mono">
                              {proposta.numero}
                            </span>
                            <Badge variant="outline" className="capitalize text-[10px] px-1.5 py-0 h-4">
                              {proposta.tipo}
                            </Badge>
                            {getStatusBadge(proposta.status)}
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform duration-200 flex-shrink-0" />
                      </button>

                      {isExpanded && (
                        <div className="px-3.5 pb-3.5 pt-0 animate-in slide-in-from-top-2 duration-200">
                          <div className="border-t border-border/40 pt-3 space-y-2">
                            <div className="grid grid-cols-2 gap-2">
                              <div className="bg-muted/40 rounded-lg p-2.5">
                                <span className="text-[10px] font-medium text-muted-foreground uppercase block mb-0.5">Frequência</span>
                                <p className="text-xs font-semibold text-foreground capitalize">{proposta.frequencia}</p>
                              </div>
                              <div className="bg-muted/40 rounded-lg p-2.5">
                                <span className="text-[10px] font-medium text-muted-foreground uppercase block mb-0.5">Valor Total</span>
                                <p className="text-xs font-semibold text-green-600">
                                  {shouldHideValues ? "R$ •••" : formatCurrency(proposta.valor_total_proposta)}
                                </p>
                              </div>
                              <div className="bg-muted/40 rounded-lg p-2.5">
                                <span className="text-[10px] font-medium text-muted-foreground uppercase block mb-0.5">Data Proposta</span>
                                <p className="text-xs text-foreground">{formatDate(proposta.data_proposta)}</p>
                              </div>
                              <div className="bg-muted/40 rounded-lg p-2.5">
                                <span className="text-[10px] font-medium text-muted-foreground uppercase block mb-0.5">Validade</span>
                                <p className="text-xs text-foreground">{proposta.data_validade ? formatDate(proposta.data_validade) : "-"}</p>
                              </div>
                            </div>
                            <div className="flex gap-2 pt-2">
                              <Link 
                                href={`/contratos/proposta/${proposta.numero}`} 
                                className="flex-1"
                                onClick={(e) => {
                                  e.preventDefault()
                                  setSelectedPropostaNumero(proposta.numero)
                                  setIsVisualizarPropostaOpen(true)
                                }}
                              >
                                <Button size="sm" variant="outline" className="w-full text-xs">
                                  <Eye className="h-3 w-3 mr-1" /> Visualizar
                                </Button>
                              </Link>
                              <Link 
                                href={`/contratos/proposta/${proposta.numero}/editar`} 
                                className="flex-1"
                                onClick={(e) => {
                                  e.preventDefault()
                                  setSelectedPropostaNumero(proposta.numero)
                                  setIsEditarPropostaOpen(true)
                                }}
                              >
                                <Button size="sm" variant="outline" className="w-full text-xs">
                                  <Edit className="h-3 w-3 mr-1" /> Editar
                                </Button>
                              </Link>
                              <Button
                                size="sm"
                                variant="destructive"
                                className="text-xs"
                                onClick={() => excluirProposta(proposta.numero)}
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
          </TabsContent>

          <TabsContent value="contratos" className="space-y-4 lg:space-y-6">
            <Card className="border border-border shadow-md bg-card text-card-foreground">
              <CardHeader className="p-3 md:p-6 pb-2 md:pb-3">
                <CardTitle className="text-base md:text-xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent dark:from-green-400 dark:to-blue-400">
                  Buscar e Filtrar Contratos
                </CardTitle>
                <CardDescription className="text-xs md:text-sm">Pesquise por número ou nome do cliente</CardDescription>
              </CardHeader>
              <CardContent className="p-3 md:p-6 pt-0">
                <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
                  {/* Search Input */}
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Digite para buscar..."
                      value={searchContratos}
                      onChange={(e) => setSearchContratos(e.target.value)}
                      className="pl-10 border-border bg-background text-foreground focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>

                  {/* Status Filter */}
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-gray-400" />
                    <Select value={contratoStatusFilter} onValueChange={setContratoStatusFilter}>
                      <SelectTrigger className="w-full sm:w-48 border-border bg-background text-foreground focus:border-blue-500">
                        <SelectValue placeholder="Filtrar por status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os status</SelectItem>
                        <SelectItem value="ativo">Ativo</SelectItem>
                        <SelectItem value="suspenso">Suspenso</SelectItem>
                        <SelectItem value="cancelado">Cancelado</SelectItem>
                        <SelectItem value="finalizado">Finalizado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {(searchContratos || contratoStatusFilter !== "all") && (
                  <div className="mt-3 md:mt-4 flex flex-wrap gap-2">
                    <p className="text-xs md:text-sm text-gray-600">
                      Mostrando {filteredContratos.length} de {contratos.length} contratos
                    </p>
                    {searchContratos && (
                      <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800">
                        Busca: &quot;{searchContratos}&quot;
                      </Badge>
                    )}
                    {contratoStatusFilter !== "all" && (
                      <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-800">
                        Status: {contratoStatusFilter}
                      </Badge>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Desktop Table View */}
            <div className="hidden md:block">
              <Card className="border border-border shadow-md bg-card text-card-foreground">
                <CardHeader className="bg-gradient-to-r from-green-500 to-blue-600 text-white rounded-t-lg p-4 lg:p-6 dark:from-green-900/50 dark:to-blue-900/50 dark:border-b dark:border-border">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div>
                      <CardTitle className="text-white flex items-center gap-2 text-lg lg:text-xl">
                        <TrendingUp className="h-4 w-4 lg:h-5 lg:w-5" />
                        Contratos Ativos
                      </CardTitle>
                      <CardDescription className="text-green-100 text-sm">
                        {filteredContratos.length} contrato{filteredContratos.length !== 1 ? "s" : ""} encontrado{filteredContratos.length !== 1 ? "s" : ""}
                      </CardDescription>
                    </div>
                  </div>
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
                    <ResizableTable
                      storageKey="contratos-ativos"
                      columns={[
                        { key: "numero",         label: "Número",              width: 100, sortable: true },
                        { key: "cliente_nome",   label: "Cliente/Equipamentos", width: 220, sortable: true },
                        { key: "valor_mensal",   label: "Valor Mensal",        width: 130, sortable: true },
                        { key: "dia_vencimento", label: "Dia",                 width: 60,  sortable: true },
                        { key: "status",         label: "Status",              width: 100, sortable: true },
                        { key: "data_inicio",    label: "Início",              width: 90,  sortable: true },
                        { key: "prazo_meses",    label: "Prazo",               width: 100, sortable: true },
                        { key: "acoes",          label: "Ações",               width: 160, sortable: false, noResize: true },
                      ]}
                      data={filteredContratos}
                      rowKey={(row) => row.id}
                      renderCell={(contrato, col) => {
                        const equipamentos = parseEquipamentos(contrato)
                        switch (col) {
                          case "numero": return <Badge variant="outline" className="font-mono text-xs">{contrato.numero}</Badge>
                          case "cliente_nome":
                            return (
                              <div>
                                <div className="font-medium text-sm truncate">{contrato.cliente_nome}</div>
                                {equipamentos.length > 0 && (
                                  <div className="mt-1">
                                    {equipamentos.map((eq, idx) => (
                                      <div key={idx} className="flex items-center gap-1 text-xs text-gray-500">
                                        <Package className="h-3 w-3 flex-shrink-0" />
                                        <span>{eq.nome}</span>
                                        {eq.quantidade > 1 && <Badge variant="secondary" className="text-[10px] h-4 px-1">x{eq.quantidade}</Badge>}
                                      </div>
                                    ))}
                                  </div>
                                )}
                                {contrato.equipamentos_consignacao && (
                                  <div className="mt-1 text-xs text-amber-600 truncate">Consig.: {contrato.equipamentos_consignacao}</div>
                                )}
                              </div>
                            )
                          case "valor_mensal": return <span className="font-medium text-green-600 text-sm">{shouldHideValues ? "R$ •••" : formatCurrency(contrato.valor_mensal)}</span>
                          case "dia_vencimento": return <Badge variant="outline" className="font-mono text-xs">{contrato.dia_vencimento || "-"}</Badge>
                          case "status": return getContratoStatusBadge(contrato.status)
                          case "data_inicio": return <span className="text-sm">{formatDateShort(contrato.data_inicio)}</span>
                          case "prazo_meses": return <Badge variant="outline" className="text-xs">{formatPrazo(contrato.prazo_meses)}</Badge>
                          case "acoes":
                            return (
                              <div className="flex items-center gap-1">
                                {/* Desktop View: Show buttons directly on large screens */}
                                <div className="hidden xl:flex gap-1">
                                  {contrato.status === "ativo" && (
                                    <Button size="sm" variant="outline" onClick={() => handleIniciarEmitirNfse(contrato)}
                                      className="h-8 w-8 p-0 text-emerald-600 hover:bg-emerald-50/10 border-emerald-200 bg-transparent" title="Emitir NFS-e">
                                      <FileCheck className="h-4 w-4" />
                                    </Button>
                                  )}
                                  <Button size="sm" variant="outline"
                                    onClick={() => {
                                      setSelectedContratoNumero(contrato.numero)
                                      setIsVisualizarContratoOpen(true)
                                    }}
                                    className="text-blue-600 dark:text-blue-400 hover:bg-blue-500/10 border-blue-200 dark:border-blue-900/50 bg-transparent h-8 w-8 p-0" title="Visualizar">
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button size="sm" variant="outline"
                                    onClick={() => {
                                      setSelectedContratoNumero(contrato.numero)
                                      setIsEditarContratoOpen(true)
                                    }}
                                    className="text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/10 border-indigo-200 dark:border-indigo-900/50 bg-transparent h-8 w-8 p-0" title="Editar">
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button size="sm" variant="outline"
                                    onClick={() => excluirContrato(contrato.numero)}
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
                                      {contrato.status === "ativo" && (
                                        <DropdownMenuItem onClick={() => handleIniciarEmitirNfse(contrato)}>
                                          <FileCheck className="h-4 w-4 mr-2" />Emitir NFS-e
                                        </DropdownMenuItem>
                                      )}
                                      <DropdownMenuItem onClick={() => {
                                        setSelectedContratoNumero(contrato.numero)
                                        setIsVisualizarContratoOpen(true)
                                      }}>
                                        <Eye className="h-4 w-4 mr-2" />Visualizar
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => {
                                        setSelectedContratoNumero(contrato.numero)
                                        setIsEditarContratoOpen(true)
                                      }}>
                                        <Edit className="h-4 w-4 mr-2" />Editar
                                      </DropdownMenuItem>
                                      <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={() => excluirContrato(contrato.numero)}>
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
                  )}
                </CardContent>
              </Card>
            </div>

            {/* MOBILE VIEW - Card-based layout */}
            <div className="md:hidden space-y-3">
              <div className="flex justify-between items-center px-1 mb-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {filteredContratos.length} contrato{filteredContratos.length !== 1 ? "s" : ""}
                </p>
              </div>

              {!hasActiveFilterContrato ? (
                <div className="text-center py-12 bg-card rounded-xl border border-border p-6 shadow-sm">
                  <Search className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                  <h3 className="text-base font-medium text-gray-700 mb-1">Busque ou filtre para ver os contratos</h3>
                  <p className="text-sm text-gray-500">Digite na busca ou selecione um filtro para começar.</p>
                </div>
              ) : filteredContratos.length === 0 ? (
                <div className="text-center py-12">
                  <TrendingUp className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                  <h3 className="text-base font-medium text-gray-900 mb-1">Nenhum contrato encontrado</h3>
                  <p className="text-sm text-gray-500">Tente ajustar os filtros de busca.</p>
                </div>
              ) : (
                filteredContratos.map((contrato) => {
                  const isExpanded = expandedContratoId === contrato.id
                  const equipamentos = parseEquipamentos(contrato)
                  return (
                    <div
                      key={contrato.id}
                      className={`rounded-xl border transition-all duration-200 overflow-hidden ${
                        contrato.status === "ativo"
                          ? "border-green-200/30 bg-gradient-to-r from-green-950/20 to-card"
                          : "border-border bg-card text-card-foreground"
                      } ${isExpanded ? "shadow-lg ring-1 ring-blue-200/30" : "shadow-sm hover:shadow-md"}`}
                    >
                      <button
                        type="button"
                        onClick={() => setExpandedContratoId(prev => prev === contrato.id ? null : contrato.id)}
                        className="w-full text-left p-3.5 flex items-center gap-3"
                      >
                        <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                          contrato.status === "ativo"
                            ? "bg-green-100 text-green-700"
                            : "bg-blue-100 text-blue-700"
                        }`}>
                          {(contrato.cliente_nome || "?").substring(0, 2).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm text-foreground break-words whitespace-normal leading-tight">
                              {contrato.cliente_nome}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[11px] text-muted-foreground font-mono">
                              {contrato.numero}
                            </span>
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
                              Dia venc.: {contrato.dia_vencimento || "-"}
                            </Badge>
                            {getContratoStatusBadge(contrato.status)}
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform duration-200 flex-shrink-0" />
                      </button>

                      {isExpanded && (
                        <div className="px-3.5 pb-3.5 pt-0 animate-in slide-in-from-top-2 duration-200">
                          <div className="border-t border-border/40 pt-3 space-y-2">
                            {equipamentos.length > 0 && (
                              <div className="bg-muted/40 rounded-lg p-2.5">
                                <span className="text-[10px] font-medium text-muted-foreground uppercase block mb-1">Equipamentos</span>
                                <div className="space-y-1">
                                  {equipamentos.map((eq, idx) => (
                                    <div key={idx} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                      <Package className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                                      <span>{eq.nome}</span>
                                      {eq.quantidade > 1 && <Badge variant="secondary" className="text-[9px] h-3.5 px-1 py-0">x{eq.quantidade}</Badge>}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {contrato.equipamentos_consignacao && (
                              <div className="bg-amber-500/10 rounded-lg p-2.5 border border-amber-500/20">
                                <span className="text-[10px] font-medium text-amber-600 dark:text-amber-400 uppercase block mb-0.5">Consignado</span>
                                <p className="text-xs text-amber-700 dark:text-amber-300 font-medium">{contrato.equipamentos_consignacao}</p>
                              </div>
                            )}

                            <div className="grid grid-cols-2 gap-2">
                              <div className="bg-muted/40 rounded-lg p-2.5">
                                <span className="text-[10px] font-medium text-muted-foreground uppercase block mb-0.5">Valor Mensal</span>
                                <p className="text-xs font-semibold text-green-600">
                                  {shouldHideValues ? "R$ •••" : formatCurrency(contrato.valor_mensal)}
                                </p>
                              </div>
                              <div className="bg-muted/40 rounded-lg p-2.5">
                                <span className="text-[10px] font-medium text-muted-foreground uppercase block mb-0.5">Prazo</span>
                                <p className="text-xs font-semibold text-foreground">{formatPrazo(contrato.prazo_meses)}</p>
                              </div>
                              <div className="bg-muted/40 rounded-lg p-2.5">
                                <span className="text-[10px] font-medium text-muted-foreground uppercase block mb-0.5">Início</span>
                                <p className="text-xs text-foreground">{formatDate(contrato.data_inicio)}</p>
                              </div>
                              <div className="bg-muted/40 rounded-lg p-2.5">
                                <span className="text-[10px] font-medium text-muted-foreground uppercase block mb-0.5">Fim / Término</span>
                                <p className="text-xs text-foreground">{formatDate(contrato.data_fim)}</p>
                              </div>
                            </div>

                            <div className="flex gap-2 pt-2">
                              {contrato.status === "ativo" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleIniciarEmitirNfse(contrato)}
                                  className="text-xs text-emerald-600 hover:bg-emerald-50 border-emerald-200 bg-white"
                                >
                                  <FileCheck className="h-3.5 w-3.5 mr-1" /> NFS-e
                                </Button>
                              )}
                              <Link 
                                 href={`/contratos/${contrato.numero}`} 
                                 className="flex-1"
                                 onClick={(e) => {
                                   e.preventDefault()
                                   setSelectedContratoNumero(contrato.numero)
                                   setIsVisualizarContratoOpen(true)
                                 }}
                               >
                                 <Button size="sm" variant="outline" className="w-full text-xs">
                                   <Eye className="h-3 w-3 mr-1" /> Visualizar
                                 </Button>
                               </Link>
                               <Link 
                                 href={`/contratos/${contrato.numero}/editar`} 
                                 className="flex-1"
                                 onClick={(e) => {
                                   e.preventDefault()
                                   setSelectedContratoNumero(contrato.numero)
                                   setIsEditarContratoOpen(true)
                                 }}
                               >
                                 <Button size="sm" variant="outline" className="w-full text-xs">
                                   <Edit className="h-3 w-3 mr-1" /> Editar
                                 </Button>
                               </Link>
                              <Button
                                size="sm"
                                variant="destructive"
                                className="text-xs"
                                onClick={() => excluirContrato(contrato.numero)}
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
          </TabsContent>
        </Tabs>
      

      {/* Drawer de Mes de Referencia */}
      <Sheet open={mesRefDialogOpen} onOpenChange={(open) => {
        setMesRefDialogOpen(open)
        if (!open) {
          setMesRefContrato(null)
        }
      }}>
        <SheetContent side="right" className="w-full sm:max-w-[450px] bg-card text-foreground border-border overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-emerald-600" />
              Mês de Referência
            </SheetTitle>
            <SheetDescription>
              Selecione o mês e ano de referência para a NFS-e do contrato{" "}
              <span className="font-semibold">{mesRefContrato?.numero}</span>
            </SheetDescription>
          </SheetHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="mes-ref">Mês</Label>
              <Select value={mesRefSelecionado} onValueChange={setMesRefSelecionado}>
                <SelectTrigger id="mes-ref" className="bg-background text-foreground border-border">
                  <SelectValue placeholder="Selecione o mês" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border text-foreground">
                  {MESES.map((mes) => (
                    <SelectItem key={mes.value} value={mes.value}>
                      {mes.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="ano-ref">Ano</Label>
              <Select value={anoRefSelecionado} onValueChange={setAnoRefSelecionado}>
                <SelectTrigger id="ano-ref" className="bg-background text-foreground border-border">
                  <SelectValue placeholder="Selecione o ano" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border text-foreground">
                  {ANOS.map((ano) => (
                    <SelectItem key={ano} value={ano}>
                      {ano}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Mes da Preventiva */}
            <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">
              <Label className="text-sm font-semibold text-blue-600 dark:text-blue-400 mb-2 block">
                Mês da Preventiva (para descrição)
              </Label>
              <div className="grid grid-cols-2 gap-2">
                <Select value={mesPreventivaRef} onValueChange={setMesPreventivaRef}>
                  <SelectTrigger className="bg-background text-foreground border-border">
                    <SelectValue placeholder="Mês" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border text-foreground">
                    {MESES.map((mes) => (
                      <SelectItem key={mes.value} value={mes.value}>
                        {mes.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={anoPreventivaRef} onValueChange={setAnoPreventivaRef}>
                  <SelectTrigger className="bg-background text-foreground border-border">
                    <SelectValue placeholder="Ano" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border text-foreground">
                    {ANOS.map((ano) => (
                      <SelectItem key={ano} value={ano}>
                        {ano}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-2 font-medium">
                Descrição: {mesPreventivaRef && anoPreventivaRef 
                  ? `Referente a preventiva realizada em ${mesPreventivaRef}/${anoPreventivaRef} - Contrato ...`
                  : "Contrato ..."}
              </p>
            </div>
            
            {mesRefContrato && (() => {
              const equipamentos = parseEquipamentos(mesRefContrato)
              const mesRef = mesRefSelecionado && anoRefSelecionado ? `${mesRefSelecionado}/${anoRefSelecionado}` : ""
              const chaveVerificacao = mesRef ? `${mesRefContrato.numero}|${mesRef}` : ""
              const jaEmitidaMes = chaveVerificacao && notasEmitidasContrato[chaveVerificacao]?.temNfse
              return (
                <div className="space-y-3">
                  {jaEmitidaMes && (
                    <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4">
                      <p className="text-xs font-semibold text-yellow-600 dark:text-yellow-400 flex items-center gap-1">
                        <FileCheck className="h-3.5 w-3.5" />
                        NFS-e já emitida para {MESES.find(m => m.value === mesRefSelecionado)?.label}/{anoRefSelecionado}
                      </p>
                      <p className="text-xs text-yellow-600/80 dark:text-yellow-400/80 mt-1">
                        Selecione outro mês ou continue para emitir novamente.
                      </p>
                    </div>
                  )}
                  {equipamentos.length > 0 && (
                    <div className="rounded-xl border border-border bg-muted/30 p-4">
                      <p className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1.5">
                        <Package className="h-3.5 w-3.5 text-primary" />
                        Equipamentos do Contrato
                      </p>
                      <div className="space-y-1.5">
                        {equipamentos.map((eq, idx) => (
                          <div key={idx} className="text-xs text-muted-foreground flex items-center gap-1">
                            <span>- {eq.nome}</span>
                            {eq.quantidade > 1 && <span className="text-muted-foreground/75 font-semibold">(Qtd: {eq.quantidade})</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })()}
          </div>
          <div className="flex justify-end gap-2 mt-6 border-t border-border pt-4">
            <Button variant="outline" onClick={() => {
              setMesRefDialogOpen(false)
              setMesRefContrato(null)
            }} className="border-border text-foreground hover:bg-muted">
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmarMesRef}
              disabled={!mesRefSelecionado || !anoRefSelecionado}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl"
            >
              <FileCheck className="h-4 w-4 mr-2" />
              Continuar para NFS-e
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Dialog de Emissao NFS-e */}
      {nfseContrato && (
        <EmitirNfseDialog
          open={nfseDialogOpen}
          onOpenChange={(open) => {
            setNfseDialogOpen(open)
            if (!open) {
              setNfseContrato(null)
              setNfseMesReferencia("")
            }
          }}
          onSuccess={handleNfseSuccess}
          dadosOrigem={{
            origem: "contrato",
            origem_numero: nfseContrato.numero,
            cliente_id: Number(nfseContrato.cliente_id),
            cliente_nome: nfseContrato.cliente_nome,
            cliente_cnpj: nfseContrato.cliente_cnpj,
            cliente_cpf: nfseContrato.cliente_cpf,
            cliente_email: nfseContrato.cliente_email,
            cliente_telefone: nfseContrato.cliente_telefone,
            cliente_endereco: nfseContrato.cliente_endereco,
            cliente_bairro: nfseContrato.cliente_bairro,
            cliente_cidade: nfseContrato.cliente_cidade,
            cliente_uf: nfseContrato.cliente_estado,
            cliente_cep: nfseContrato.cliente_cep,
            descricao: buildDescricaoContrato(nfseContrato, nfseMesPreventivaRef || undefined),
            valor: Number(nfseContrato.valor_mensal) || 0,
          }}
        />
      )}

      {/* Drawers para Contratos e Propostas */}
      <NovoContratoDialog
        open={isNovoContratoOpen}
        onOpenChange={setIsNovoContratoOpen}
        onSuccess={() => {
          loadContratos()
          loadPropostas()
        }}
      />

      <EditarContratoDialog
        numero={selectedContratoNumero}
        open={isEditarContratoOpen}
        onOpenChange={setIsEditarContratoOpen}
        onSuccess={() => {
          loadContratos()
          loadPropostas()
        }}
      />

      <VisualizarContratoDialog
        numero={selectedContratoNumero}
        open={isVisualizarContratoOpen}
        onOpenChange={setIsVisualizarContratoOpen}
        onEditClick={(numero) => {
          setIsVisualizarContratoOpen(false)
          setSelectedContratoNumero(numero)
          setIsEditarContratoOpen(true)
        }}
        onSuccess={() => {
          loadContratos()
          loadPropostas()
        }}
      />

      <NovaPropostaDialog
        open={isNovaPropostaOpen}
        onOpenChange={setIsNovaPropostaOpen}
        onSuccess={() => {
          loadPropostas()
        }}
      />

      <EditarPropostaDialog
        numero={selectedPropostaNumero}
        open={isEditarPropostaOpen}
        onOpenChange={setIsEditarPropostaOpen}
        onSuccess={() => {
          loadPropostas()
          loadContratos()
        }}
      />

      <VisualizarPropostaDialog
        numero={selectedPropostaNumero}
        open={isVisualizarPropostaOpen}
        onOpenChange={setIsVisualizarPropostaOpen}
        onEditClick={(numero) => {
          setIsVisualizarPropostaOpen(false)
          setSelectedPropostaNumero(numero)
          setIsEditarPropostaOpen(true)
        }}
      />
    </div>
  )
}
