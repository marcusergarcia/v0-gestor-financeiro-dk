"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ResizableTable } from "@/components/ui/resizable-table"
import {
  DollarSign,
  FileText,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  Search,
  Plus,
  Eye,
  EyeOff,
  Edit,
  Trash2,
  Filter,
  XCircle,
  AlertCircle,
  Printer,
  Send,
  Loader2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  X,
  TrendingUp,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { formatCurrency, formatDate } from "@/lib/utils"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
import { NovoBoletoDialog } from "@/components/financeiro/novo-boleto-dialog"
import { EditarBoletoDialog } from "@/components/financeiro/editar-boleto-dialog"
import { VisualizarBoletosDialog } from "@/components/financeiro/visualizar-boletos-dialog"
import { FluxoCaixaTab } from "@/components/financeiro/fluxo-caixa-tab"
import Link from "next/link"

interface Boleto {
  id: number
  numero: string
  cliente_id: number
  cliente_nome: string
  valor: number
  data_vencimento: string
  data_pagamento?: string
  status: "pendente" | "aguardando_pagamento" | "pago" | "vencido" | "cancelado"
  numero_parcela: number
  total_parcelas: number
  observacoes?: string
  created_at: string
  // Campos do Asaas
  asaas_id?: string | null
  asaas_customer_id?: string | null
  asaas_invoice_url?: string | null
  asaas_bankslip_url?: string | null
  asaas_linha_digitavel?: string | null
  asaas_barcode?: string | null
  asaas_nosso_numero?: string | null
  gateway?: string | null
}

interface Recibo {
  id: number
  numero: string
  cliente_id: number
  cliente_nome: string
  valor: number
  data_emissao: string
  descricao: string
  observacoes?: string
  created_at: string
}

function criarDataLocal(dateString: string | null | undefined): Date | null {
  if (!dateString) return null
  const [ano, mes, dia] = dateString.split("T")[0].split("-").map(Number)
  return new Date(ano, mes - 1, dia)
}

function obterHojeZerado(): Date {
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  return hoje
}

export default function FinanceiroPage() {
  const [boletos, setBoletos] = useState<Boleto[]>([])
  const [recibos, setRecibos] = useState<Recibo[]>([])
  const [loading, setLoading] = useState(true)
  const [searchBoletos, setSearchBoletos] = useState("")
  const [searchRecibos, setSearchRecibos] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [periodoFilter, setPeriodoFilter] = useState("todos")
  const [logoMenu, setLogoMenu] = useState<string>("")
  const [showNovoBoleto, setShowNovoBoleto] = useState(false)
  const [showEditarBoleto, setShowEditarBoleto] = useState(false)
  const [showVisualizarBoletos, setShowVisualizarBoletos] = useState(false)
  const [boletoParaEditar, setBoletoParaEditar] = useState<Boleto | null>(null)
  const [boletoParaVisualizar, setBoletoParaVisualizar] = useState<string>("")
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [boletoParaExcluir, setBoletoParaExcluir] = useState<Boleto | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [enviandoParaAsaas, setEnviandoParaAsaas] = useState<number | null>(null)
  const [valoresOcultos, setValoresOcultos] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const [expandedBoletoId, setExpandedBoletoId] = useState<number | null>(null)
  const [expandedReciboId, setExpandedReciboId] = useState<number | null>(null)
  const [pageIndexBoletos, setPageIndexBoletos] = useState(0)
  const [pageIndexRecibos, setPageIndexRecibos] = useState(0)
  const { toast } = useToast()

  useEffect(() => {
    loadData()
    loadLogoMenu()

    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener("resize", checkMobile)

    const savedPreference = localStorage.getItem("ocultar-valores")
    if (savedPreference !== null) {
      setValoresOcultos(savedPreference === "true")
    }

    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  useEffect(() => {
    setPageIndexBoletos(0)
  }, [searchBoletos, statusFilter, periodoFilter])

  useEffect(() => {
    setPageIndexRecibos(0)
  }, [searchRecibos])

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
      const [boletosRes, recibosRes] = await Promise.all([fetch("/api/boletos"), fetch("/api/recibos")])

      const [boletosData, recibosData] = await Promise.all([boletosRes.json(), recibosRes.json()])

      if (boletosData.success) {
        const boletosProcessados = boletosData.data.map((boleto: any) => ({
          ...boleto,
          valor: typeof boleto.valor === "string" ? Number.parseFloat(boleto.valor) : boleto.valor,
          cliente_id: typeof boleto.cliente_id === "string" ? Number.parseInt(boleto.cliente_id) : boleto.cliente_id,
          numero_parcela:
            typeof boleto.numero_parcela === "string" ? Number.parseInt(boleto.numero_parcela) : boleto.numero_parcela,
          total_parcelas:
            typeof boleto.total_parcelas === "string" ? Number.parseInt(boleto.total_parcelas) : boleto.total_parcelas,
        }))
        setBoletos(boletosProcessados || [])
      }
      if (recibosData.success) {
        setRecibos(recibosData.data || [])
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error)
      toast({
        title: "Erro",
        description: "Erro ao carregar dados financeiros",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const toggleValoresOcultos = () => {
    const novoEstado = !valoresOcultos
    setValoresOcultos(novoEstado)
    localStorage.setItem("ocultar-valores", novoEstado.toString())
  }

  const formatarValor = (valor: number) => {
    if (valoresOcultos || isMobile) {
      return "R$ •••"
    }
    return formatCurrency(valor)
  }

  const handleVisualizarBoleto = (boleto: Boleto) => {
    setBoletoParaVisualizar(boleto.numero)
    setShowVisualizarBoletos(true)
  }

  const handleImprimirBoleto = async (boleto: Boleto) => {
    if (boleto.asaas_bankslip_url) {
      window.open(boleto.asaas_bankslip_url, "_blank")
    } else if (boleto.asaas_invoice_url) {
      window.open(boleto.asaas_invoice_url, "_blank")
    } else {
      toast({
        title: "PDF não disponível",
        description: "Este boleto ainda não foi enviado ao Asaas.",
        variant: "destructive",
      })
    }
  }

  const handleEditarBoleto = (boleto: Boleto) => {
    setBoletoParaEditar(boleto)
    setShowEditarBoleto(true)
  }

  const handleExcluirBoleto = (boleto: Boleto) => {
    setBoletoParaExcluir(boleto)
    setShowDeleteDialog(true)
  }

  const handleMarcarPago = async (boleto: Boleto) => {
    if (!confirm(`⚠️ TESTE: Marcar o boleto ${boleto.numero} como PAGO manualmente?`)) {
      return
    }

    try {
      const response = await fetch(`/api/boletos/${boleto.id}/marcar-pago`, {
        method: "POST",
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Sucesso (TESTE)",
          description: `Boleto ${result.data.numero_boleto} marcado como pago`,
        })
        await loadData()
      } else {
        toast({
          title: "Erro",
          description: result.message || "Erro ao marcar boleto como pago",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Erro ao marcar boleto como pago:", error)
      toast({
        title: "Erro",
        description: "Erro ao marcar boleto como pago",
        variant: "destructive",
      })
    }
  }

  // FUNCTION: Handle sending boleto to Asaas
  const handleEnviarAsaas = async (boleto: Boleto) => {
    if (
      !confirm(`Enviar boleto ${boleto.numero} para o Asaas?\n\nIsso irá gerar o código de barras e linha digitável.`)
    ) {
      return
    }

    try {
      setEnviandoParaAsaas(boleto.id)

      const response = await fetch(`/api/boletos/${boleto.id}/enviar-asaas`, {
        method: "POST",
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Sucesso!",
          description: `Boleto ${boleto.numero} enviado ao Asaas com sucesso!`,
        })
        await loadData()
      } else {
        toast({
          title: "Erro",
          description: result.message || "Erro ao enviar boleto ao Asaas",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Erro ao enviar boleto ao Asaas:", error)
      toast({
        title: "Erro",
        description: "Erro ao enviar boleto ao Asaas",
        variant: "destructive",
      })
    } finally {
      setEnviandoParaAsaas(null)
    }
  }

  const confirmarExclusao = async () => {
    if (!boletoParaExcluir) return

    try {
      setDeletingId(boletoParaExcluir.id)

      const response = await fetch(`/api/boletos/${boletoParaExcluir.id}`, {
        method: "DELETE",
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Sucesso",
          description: "Boleto excluído com sucesso!",
        })
        await loadData()
      } else {
        toast({
          title: "Erro",
          description: result.message || "Erro ao excluir boleto",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao excluir boleto",
        variant: "destructive",
      })
    } finally {
      setDeletingId(null)
      setShowDeleteDialog(false)
      setBoletoParaExcluir(null)
    }
  }

  const getStatusBadge = (status: string, dataVencimento: string | null) => {
    const hoje = obterHojeZerado()
    const vencimento = criarDataLocal(dataVencimento)

    const isVencido = (status === "pendente" || status === "aguardando_pagamento") && vencimento && vencimento < hoje

    if (status === "pago") {
      return (
        <Badge className="bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50 hover:bg-emerald-100 dark:hover:bg-emerald-950 font-medium px-3 py-1">
          <CheckCircle className="w-3 h-3 mr-1" />
          Pago
        </Badge>
      )
    }

    if (status === "cancelado") {
      return (
        <Badge className="bg-gray-50/80 dark:bg-muted text-gray-700 dark:text-muted-foreground border-gray-200 dark:border-border hover:bg-gray-100 dark:hover:bg-muted font-medium px-3 py-1">
          <XCircle className="w-3 h-3 mr-1" />
          Cancelado
        </Badge>
      )
    }

    if (isVencido || status === "vencido") {
      return (
        <Badge className="bg-red-50/80 dark:bg-red-950/40 text-red-700 dark:text-red-400 border-red-200 dark:border-red-900/50 hover:bg-red-100 dark:hover:bg-red-950 font-medium px-3 py-1 animate-pulse">
          <AlertCircle className="w-3 h-3 mr-1" />
          Vencido
        </Badge>
      )
    }

    if (status === "aguardando_pagamento") {
      return (
        <Badge className="bg-blue-50/80 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-900/50 hover:bg-blue-100 dark:hover:bg-blue-950/50 font-medium px-3 py-1">
          <Send className="w-3 h-3 mr-1" />
          Aguardando
        </Badge>
      )
    }

    return (
      <Badge className="bg-amber-50/80 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/50 hover:bg-amber-100 dark:hover:bg-amber-950 font-medium px-3 py-1">
        <Clock className="w-3 h-3 mr-1" />
        Pendente
      </Badge>
    )
  }

  const formatMesEmissao = (createdAt: string) => {
    try {
      const date = new Date(createdAt)
      if (isNaN(date.getTime())) return "-"

      return date
        .toLocaleDateString("pt-BR", {
          month: "long",
          year: "numeric",
        })
        .replace(/^\w/, (c) => c.toUpperCase())
    } catch {
      return "-"
    }
  }

  const filterByPeriod = (boleto: Boleto) => {
    if (periodoFilter === "todos") return true

    const hoje = new Date()
    const dataVencimento = new Date(boleto.data_vencimento)

    switch (periodoFilter) {
      case "mes-anterior": {
        const mesAnterior = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1)
        const fimMesAnterior = new Date(hoje.getFullYear(), hoje.getMonth(), 0)
        return dataVencimento >= mesAnterior && dataVencimento <= fimMesAnterior
      }
      case "mes-atual": {
        const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
        const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0)
        return dataVencimento >= inicioMes && dataVencimento <= fimMes
      }
      case "mes-posterior": {
        const mesPosterior = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 1)
        const fimMesPosterior = new Date(hoje.getFullYear(), hoje.getMonth() + 2, 0)
        return dataVencimento >= mesPosterior && dataVencimento <= fimMesPosterior
      }
      case "trimestre": {
        const inicioTrimestre = new Date(hoje.getFullYear(), hoje.getMonth() - 2, 1)
        const fimTrimestre = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0)
        return dataVencimento >= inicioTrimestre && dataVencimento <= fimTrimestre
      }
      case "semestre": {
        const inicioSemestre = new Date(hoje.getFullYear(), hoje.getMonth() - 5, 1)
        const fimSemestre = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0)
        return dataVencimento >= inicioSemestre && dataVencimento <= fimSemestre
      }
      default:
        return true
    }
  }

  const filteredBoletos = boletos.filter((boleto) => {
    const matchesSearch =
      boleto.numero.toLowerCase().includes(searchBoletos.toLowerCase()) ||
      boleto.cliente_nome.toLowerCase().includes(searchBoletos.toLowerCase())

    let matchesStatus = true
    if (statusFilter !== "all") {
      if (statusFilter === "vencido") {
        const hoje = obterHojeZerado()
        const vencimento = criarDataLocal(boleto.data_vencimento)
        matchesStatus = ((boleto.status === "pendente" || boleto.status === "aguardando_pagamento") && vencimento && vencimento < hoje) || boleto.status === "vencido"
      } else if (statusFilter === "pendente") {
        // Filtro pendente mostra apenas pendentes
        matchesStatus = boleto.status === "pendente"
      } else if (statusFilter === "aguardando_pagamento") {
        // Filtro aguardando_pagamento mostra apenas aguardando pagamento
        matchesStatus = boleto.status === "aguardando_pagamento"
      } else {
        matchesStatus = boleto.status === statusFilter
      }
    }

    const matchesPeriod = filterByPeriod(boleto)

    return matchesSearch && matchesStatus && matchesPeriod
  })

  const filteredRecibos = recibos.filter(
    (recibo) =>
      recibo.numero.toLowerCase().includes(searchRecibos.toLowerCase()) ||
      recibo.cliente_nome.toLowerCase().includes(searchRecibos.toLowerCase()) ||
      recibo.descricao.toLowerCase().includes(searchRecibos.toLowerCase()),
  )

  const handleDeleteRecibo = async (recibo: Recibo) => {
    try {
      const response = await fetch(`/api/recibos/${recibo.id}`, {
        method: "DELETE",
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Sucesso!",
          description: "Recibo excluído com sucesso",
        })
        loadData()
      } else {
        toast({
          title: "Erro",
          description: result.message || "Erro ao excluir recibo",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Erro ao excluir recibo:", error)
      toast({
        title: "Erro",
        description: "Erro de conexão. Tente novamente.",
        variant: "destructive",
      })
    }
  }

  const boletosStats = {
    total: filteredBoletos.length,
    pendentes: filteredBoletos.filter((b) => {
      const hoje = obterHojeZerado()
      const vencimento = criarDataLocal(b.data_vencimento)
      return (b.status === "pendente" || b.status === "aguardando_pagamento") && vencimento && vencimento >= hoje
    }).length,
    pagos: filteredBoletos.filter((b) => b.status === "pago").length,
    vencidos: filteredBoletos.filter((b) => {
      const hoje = obterHojeZerado()
      const vencimento = criarDataLocal(b.data_vencimento)
      return ((b.status === "pendente" || b.status === "aguardando_pagamento") && vencimento && vencimento < hoje) || b.status === "vencido"
    }).length,
    valorTotal: filteredBoletos.reduce((acc, b) => {
      const valor = typeof b.valor === "number" && !isNaN(b.valor) ? b.valor : 0
      return acc + valor
    }, 0),
    valorPago: filteredBoletos
      .filter((b) => b.status === "pago")
      .reduce((acc, b) => {
        const valor = typeof b.valor === "number" && !isNaN(b.valor) ? b.valor : 0
        return acc + valor
      }, 0),
  }

  const recibosStats = {
    total: recibos.length,
    valorTotal: recibos.reduce((acc, r) => acc + r.valor, 0),
  }

  // Isso permite que os cards sempre mostrem todos os status, mas filtrados pelo período
  const boletosFiltradosPorPeriodo = boletos.filter(filterByPeriod)

  const boletosStatsPorPeriodo = {
    total: boletosFiltradosPorPeriodo.length,
    pendentes: boletosFiltradosPorPeriodo.filter((b) => {
      const hoje = obterHojeZerado()
      const vencimento = criarDataLocal(b.data_vencimento)
      return (b.status === "pendente" || b.status === "aguardando_pagamento") && vencimento && vencimento >= hoje
    }).length,
    pagos: boletosFiltradosPorPeriodo.filter((b) => b.status === "pago").length,
    vencidos: boletosFiltradosPorPeriodo.filter((b) => {
      const hoje = obterHojeZerado()
      const vencimento = criarDataLocal(b.data_vencimento)
      return ((b.status === "pendente" || b.status === "aguardando_pagamento") && vencimento && vencimento < hoje) || b.status === "vencido"
    }).length,
    valorPagos: boletosFiltradosPorPeriodo
      .filter((b) => b.status === "pago")
      .reduce((acc, b) => acc + (typeof b.valor === "number" ? b.valor : 0), 0),
    valorPendentes: boletosFiltradosPorPeriodo
      .filter((b) => {
        const hoje = obterHojeZerado()
        const vencimento = criarDataLocal(b.data_vencimento)
        return (b.status === "pendente" || b.status === "aguardando_pagamento") && vencimento && vencimento >= hoje
      })
      .reduce((acc, b) => acc + (typeof b.valor === "number" ? b.valor : 0), 0),
    valorVencidos: boletosFiltradosPorPeriodo
      .filter((b) => {
        const hoje = obterHojeZerado()
        const vencimento = criarDataLocal(b.data_vencimento)
        return ((b.status === "pendente" || b.status === "aguardando_pagamento") && vencimento && vencimento < hoje) || b.status === "vencido"
      })
      .reduce((acc, b) => acc + (typeof b.valor === "number" ? b.valor : 0), 0),
  }

  const paginatedBoletos = useMemo(() => {
    return filteredBoletos.slice(pageIndexBoletos * 10, (pageIndexBoletos + 1) * 10)
  }, [filteredBoletos, pageIndexBoletos])

  const paginatedRecibos = useMemo(() => {
    return filteredRecibos.slice(pageIndexRecibos * 10, (pageIndexRecibos + 1) * 10)
  }, [filteredRecibos, pageIndexRecibos])

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando dados financeiros...</p>
          </div>
        </div>
      </div>
    )
  }

  const hasActiveFilterBoletos = searchBoletos.trim() !== "" || statusFilter !== "all" || periodoFilter !== "todos"
  const hasActiveFilterRecibos = searchRecibos.trim() !== ""

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
              Gestão Financeira
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">Controle de boletos e recibos</p>
          </div>
        </div>

        {/* Botão de Toggle de Valores */}
        <Button
          onClick={toggleValoresOcultos}
          variant="outline"
          className="hidden md:flex items-center gap-2 border border-border hover:bg-muted transition-all duration-200 bg-card text-foreground h-9 px-3 text-sm"
        >
          {valoresOcultos ? (
            <>
              <EyeOff className="h-4 w-4 text-muted-foreground" />
              <span className="hidden sm:inline font-medium">Mostrar Valores</span>
            </>
          ) : (
            <>
              <Eye className="h-4 w-4 text-muted-foreground" />
              <span className="hidden sm:inline font-medium">Ocultar Valores</span>
            </>
          )}
        </Button>
      </div>

      {/* Stats Cards - Agora clicáveis */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card
          className={`border border-border shadow-sm hover:border-muted-foreground/30 transition-all duration-200 bg-card cursor-pointer ${
            statusFilter === "all" ? "ring-2 ring-indigo-500 ring-offset-2 ring-offset-background" : ""
          }`}
          onClick={() => setStatusFilter("all")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2">
            <CardTitle className="text-xs lg:text-sm font-semibold text-muted-foreground">Total</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground/70" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-xl lg:text-2xl font-bold text-foreground">{boletosStatsPorPeriodo.total}</div>
            <p className="text-[10px] lg:text-xs text-muted-foreground mt-0.5">boletos no período</p>
          </CardContent>
        </Card>

        <Card
          className={`border border-border shadow-sm hover:border-muted-foreground/30 transition-all duration-200 bg-card cursor-pointer ${
            statusFilter === "pago" ? "ring-2 ring-emerald-500 ring-offset-2 ring-offset-background" : ""
          }`}
          onClick={() => setStatusFilter("pago")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2">
            <CardTitle className="text-xs lg:text-sm font-semibold text-muted-foreground">Boletos Pagos</CardTitle>
            <CheckCircle className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-xl lg:text-2xl font-bold text-foreground">{boletosStatsPorPeriodo.pagos}</div>
            <p className="text-[10px] lg:text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">
              {formatarValor(boletosStatsPorPeriodo.valorPagos)}
            </p>
          </CardContent>
        </Card>

        <Card
          className={`border border-border shadow-sm hover:border-muted-foreground/30 transition-all duration-200 bg-card cursor-pointer ${
            statusFilter === "pendente" ? "ring-2 ring-amber-500 ring-offset-2 ring-offset-background" : ""
          }`}
          onClick={() => setStatusFilter("pendente")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2">
            <CardTitle className="text-xs lg:text-sm font-semibold text-muted-foreground">Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-xl lg:text-2xl font-bold text-foreground">{boletosStatsPorPeriodo.pendentes}</div>
            <p className="text-[10px] lg:text-xs font-semibold text-amber-600 dark:text-amber-400 mt-0.5">
              {formatarValor(boletosStatsPorPeriodo.valorPendentes)}
            </p>
          </CardContent>
        </Card>

        <Card
          className={`border border-border shadow-sm hover:border-muted-foreground/30 transition-all duration-200 bg-card cursor-pointer ${
            statusFilter === "vencido" ? "ring-2 ring-red-500 ring-offset-2 ring-offset-background" : ""
          }`}
          onClick={() => setStatusFilter("vencido")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2">
            <CardTitle className="text-xs lg:text-sm font-semibold text-muted-foreground">Vencidos</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-xl lg:text-2xl font-bold text-foreground">{boletosStatsPorPeriodo.vencidos}</div>
            <p className="text-[10px] lg:text-xs font-semibold text-red-600 dark:text-red-400 mt-0.5">
              {formatarValor(boletosStatsPorPeriodo.valorVencidos)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="boletos" className="space-y-4 lg:space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:w-[500px] p-1 bg-muted dark:bg-slate-900/60 border border-border">
          <TabsTrigger
            value="boletos"
            className="text-xs lg:text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white"
          >
            Boletos ({boletosStatsPorPeriodo.total})
          </TabsTrigger>
          <TabsTrigger
            value="recibos"
            className="text-xs lg:text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-blue-600 data-[state=active]:text-white"
          >
            Recibos ({recibosStats.total})
          </TabsTrigger>
          <TabsTrigger
            value="fluxo-caixa"
            className="text-xs lg:text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-600 data-[state=active]:text-white"
          >
            Fluxo de Caixa
          </TabsTrigger>
        </TabsList>

        <TabsContent value="boletos" className="space-y-4 lg:space-y-6">

            {/* Boletos Filters */}
            <Card className="border border-border shadow-md bg-card text-card-foreground">
              <CardHeader className="p-3 md:p-6 pb-2 md:pb-3">
                <CardTitle className="text-base md:text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-purple-400">
                  Buscar e Filtrar Boletos
                </CardTitle>
                <CardDescription className="text-xs md:text-sm">Pesquise por número ou cliente</CardDescription>
              </CardHeader>
              <CardContent className="p-3 md:p-6 pt-0">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar boletos..."
                      value={searchBoletos}
                      onChange={(e) => setSearchBoletos(e.target.value)}
                      className="pl-10 border-border bg-background text-foreground"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-48 border-border bg-background text-foreground">
                        <SelectValue placeholder="Filtrar por status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os status</SelectItem>
                        <SelectItem value="pendente">Pendentes</SelectItem>
                        <SelectItem value="aguardando_pagamento">Aguardando Pagamento</SelectItem>
                        <SelectItem value="pago">Pagos</SelectItem>
                        <SelectItem value="vencido">Vencidos</SelectItem>
                        <SelectItem value="cancelado">Cancelados</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <Select value={periodoFilter} onValueChange={setPeriodoFilter}>
                      <SelectTrigger className="w-48 border-border bg-background text-foreground">
                        <SelectValue placeholder="Filtrar por período" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos os períodos</SelectItem>
                        <SelectItem value="mes-anterior">Mês anterior</SelectItem>
                        <SelectItem value="mes-atual">Mês atual</SelectItem>
                        <SelectItem value="mes-posterior">Mês posterior</SelectItem>
                        <SelectItem value="trimestre">Trimestre</SelectItem>
                        <SelectItem value="semestre">Semestre</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Desktop Table View */}
            <div className="hidden md:block">
              <Card className="border border-border shadow-md bg-card text-card-foreground">
                <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-t-lg p-4 lg:p-6 dark:from-blue-900/50 dark:to-purple-900/50 dark:border-b dark:border-border">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 w-full">
                    <div>
                      <CardTitle className="text-white flex items-center gap-2 text-lg lg:text-xl">
                        <FileText className="h-4 w-4 lg:h-5 lg:w-5" />
                        Boletos de Cobrança
                      </CardTitle>
                      <CardDescription className="text-blue-100 text-sm">
                        {filteredBoletos.length} boleto{filteredBoletos.length !== 1 ? "s" : ""} encontrado{filteredBoletos.length !== 1 ? "s" : ""}
                      </CardDescription>
                    </div>
                    <Button
                      onClick={() => setShowNovoBoleto(true)}
                      className="bg-white text-blue-600 hover:bg-blue-50 text-sm lg:text-base dark:bg-slate-900 dark:text-blue-400 dark:hover:bg-slate-800 dark:border-slate-800"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Novo Boleto
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {filteredBoletos.length === 0 ? (
                    <div className="text-center py-12">
                      <FileText className="mx-auto h-16 w-16 text-muted-foreground/60 mb-4" />
                      <h3 className="text-xl font-medium text-foreground mb-2">
                        {searchBoletos || statusFilter !== "all" || periodoFilter !== "todos"
                          ? "Nenhum boleto encontrado"
                          : "Nenhum boleto cadastrado"}
                      </h3>
                      <p className="text-muted-foreground mb-6">
                        {searchBoletos || statusFilter !== "all" || periodoFilter !== "todos"
                          ? "Tente ajustar os filtros de busca"
                          : "Comece criando seu primeiro boleto"}
                      </p>
                      {!searchBoletos && statusFilter === "all" && periodoFilter === "todos" && (
                        <Button
                          onClick={() => setShowNovoBoleto(true)}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm h-9 px-4 text-sm font-medium transition-all"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Criar Primeiro Boleto
                        </Button>
                      )}
                    </div>
                  ) : (
                    <>
                      <ResizableTable
                        storageKey="financeiro-boletos"
                        columns={[
                          { key: "numero",          label: "Número",      width: 110, sortable: true },
                          { key: "cliente_nome",    label: "Cliente",      width: 180, sortable: true },
                          { key: "valor",           label: "Valor",        width: 120, sortable: true },
                          { key: "data_vencimento", label: "Vencimento",   width: 130, sortable: true },
                          { key: "created_at",      label: "Mês Emissão", width: 130, sortable: true },
                          { key: "status",          label: "Status",       width: 130, sortable: true },
                          { key: "numero_parcela",  label: "Parcela",      width: 80,  sortable: true },
                          { key: "acoes",           label: "Ações",        width: 160, sortable: false, noResize: true },
                        ]}
                        data={paginatedBoletos}
                        rowKey={(row) => row.id}
                        renderCell={(boleto, col) => {
                          switch (col) {
                            case "numero": return <Badge variant="outline" className="font-mono text-xs bg-background text-foreground border-border">{boleto.numero}</Badge>
                            case "cliente_nome": return <div className="font-medium text-foreground truncate">{boleto.cliente_nome}</div>
                            case "valor": return <div className="font-semibold text-emerald-600 dark:text-emerald-400">{formatarValor(boleto.valor)}</div>
                            case "data_vencimento":
                              return (
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                  <span>{formatDate(boleto.data_vencimento)}</span>
                                </div>
                              )
                            case "created_at":
                              return (
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-4 w-4 text-blue-400 flex-shrink-0" />
                                  <span className="text-blue-700 dark:text-blue-400 font-medium">{formatMesEmissao(boleto.created_at)}</span>
                                </div>
                              )
                            case "status": return getStatusBadge(boleto.status, boleto.data_vencimento)
                            case "numero_parcela": return <span className="text-foreground font-medium">{boleto.numero_parcela}/{boleto.total_parcelas}</span>
                            case "acoes":
                              return (
                                <div className="flex gap-1 flex-wrap">
                                  <Button size="sm" variant="outline" onClick={() => handleVisualizarBoleto(boleto)}
                                    className="text-blue-600 dark:text-blue-400 hover:bg-blue-500/10 border-blue-200 dark:border-blue-900/50 bg-transparent h-8 w-8 p-0" title="Visualizar">
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  {!(boleto.status === "pago" && boleto.data_pagamento) && (
                                    <>
                                      {!boleto.asaas_id && (
                                        <Button variant="outline" size="sm" onClick={() => handleEnviarAsaas(boleto)}
                                          disabled={enviandoParaAsaas === boleto.id}
                                          className="border-teal-500 dark:border-teal-700 text-teal-600 dark:text-teal-400 hover:bg-teal-500/10 h-8 w-8 p-0" title="Enviar Asaas">
                                          {enviandoParaAsaas === boleto.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                                        </Button>
                                      )}
                                      {boleto.asaas_bankslip_url && (
                                        <Button variant="outline" size="sm" onClick={() => window.open(boleto.asaas_bankslip_url || "#", "_blank")}
                                          className="border-purple-500 dark:border-purple-700 text-purple-600 dark:text-purple-400 hover:bg-purple-500/10 h-8 w-8 p-0" title="Imprimir">
                                          <Printer className="h-4 w-4" />
                                        </Button>
                                      )}
                                      {(boleto.status === "pendente" || boleto.status === "aguardando_pagamento") && (
                                        <Button size="sm" variant="outline" onClick={() => handleMarcarPago(boleto)}
                                          className="text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 border-emerald-200 dark:border-emerald-900/50 bg-transparent h-8 w-8 p-0" title="Marcar como Pago">
                                          <CheckCircle className="h-4 w-4" />
                                        </Button>
                                      )}
                                      <Button size="sm" variant="outline" onClick={() => handleEditarBoleto(boleto)}
                                        className="text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 border-emerald-200 dark:border-emerald-900/50 bg-transparent h-8 w-8 p-0" title="Editar">
                                        <Edit className="h-4 w-4" />
                                      </Button>
                                    </>
                                  )}
                                  <Button size="sm" variant="outline" onClick={() => handleExcluirBoleto(boleto)}
                                    disabled={deletingId === boleto.id}
                                    className="text-red-600 dark:text-red-400 hover:bg-red-500/10 border-red-200 dark:border-red-900/50 bg-transparent h-8 w-8 p-0" title="Excluir">
                                    {deletingId === boleto.id ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600" /> : <Trash2 className="h-4 w-4" />}
                                  </Button>
                                </div>
                              )
                            default: return null
                          }
                        }}
                      />

                      {/* Pagination Controls */}
                      <div className="p-4 border-t border-border/40 flex items-center justify-between gap-4">
                        <div className="text-[10px] sm:text-xs text-muted-foreground">
                          Mostrando <span className="font-medium text-foreground">{paginatedBoletos.length}</span> de{" "}
                          <span className="font-medium text-foreground">{filteredBoletos.length}</span> registros
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPageIndexBoletos(prev => Math.max(0, prev - 1))}
                            disabled={pageIndexBoletos === 0}
                            className="h-8 px-2 text-xs border-border bg-card"
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPageIndexBoletos(prev => prev + 1)}
                            disabled={(pageIndexBoletos + 1) * 10 >= filteredBoletos.length}
                            className="h-8 px-2 text-xs border-border bg-card"
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* MOBILE VIEW - Card-based layout */}
            <div className="md:hidden space-y-3">
              {hasActiveFilterBoletos && (
                <div className="flex justify-between items-center px-1 mb-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {filteredBoletos.length} boleto{filteredBoletos.length !== 1 ? "s" : ""}
                  </p>
                </div>
              )}

              {!hasActiveFilterBoletos ? (
                <div className="text-center py-12 bg-card rounded-xl border border-border p-6 shadow-sm">
                  <Search className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
                  <h3 className="text-base font-medium text-foreground mb-1">Busque ou filtre para ver os boletos</h3>
                  <p className="text-sm text-muted-foreground">Digite na busca ou selecione um filtro para começar.</p>
                </div>
              ) : filteredBoletos.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
                  <h3 className="text-base font-medium text-foreground mb-1">Nenhum boleto encontrado</h3>
                  <p className="text-sm text-muted-foreground">Tente ajustar os filtros de busca.</p>
                </div>
              ) : (
                filteredBoletos.map((boleto) => {
                  const isExpanded = expandedBoletoId === boleto.id
                  return (
                    <div
                      key={boleto.id}
                      className={`rounded-xl border transition-all duration-200 overflow-hidden ${
                        boleto.status === "pago"
                          ? "border-emerald-500/20 bg-emerald-500/5"
                          : "border-border bg-card"
                      } ${isExpanded ? "shadow-lg ring-1 ring-indigo-500" : "shadow-sm hover:shadow-md"}`}
                    >
                      <button
                        type="button"
                        onClick={() => setExpandedBoletoId(prev => prev === boleto.id ? null : boleto.id)}
                        className="w-full text-left p-3.5 flex items-center gap-3 bg-transparent text-foreground"
                      >
                        <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                          boleto.status === "pago"
                            ? "bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400"
                            : "bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400"
                        }`}>
                          {(boleto.cliente_nome || "?").substring(0, 2).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm text-foreground truncate">
                              {boleto.cliente_nome}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[11px] text-muted-foreground font-sans">
                              {boleto.numero}
                            </span>
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-border text-foreground">
                              Parc.: {boleto.numero_parcela}/{boleto.total_parcelas}
                            </Badge>
                            {getStatusBadge(boleto.status, boleto.data_vencimento)}
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0 mr-1">
                          <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                            {formatarValor(boleto.valor)}
                          </div>
                          <div className="text-[10px] text-muted-foreground">
                            Venc: {formatDate(boleto.data_vencimento)}
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
                              <div className="bg-muted/50 rounded-lg p-2.5">
                                <span className="text-[10px] font-medium text-muted-foreground uppercase block mb-0.5">Valor</span>
                                <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">{formatarValor(boleto.valor)}</p>
                              </div>
                              <div className="bg-muted/50 rounded-lg p-2.5">
                                <span className="text-[10px] font-medium text-muted-foreground uppercase block mb-0.5">Vencimento</span>
                                <p className="text-xs font-semibold text-foreground">{formatDate(boleto.data_vencimento)}</p>
                              </div>
                              <div className="bg-muted/50 rounded-lg p-2.5 col-span-2">
                                <span className="text-[10px] font-medium text-muted-foreground uppercase block mb-0.5">Mês Emissão</span>
                                <p className="text-xs text-foreground">{formatMesEmissao(boleto.created_at)}</p>
                              </div>
                              {boleto.observacoes && (
                                <div className="bg-muted/50 rounded-lg p-2.5 col-span-2">
                                  <span className="text-[10px] font-medium text-muted-foreground uppercase block mb-0.5">Observações</span>
                                  <p className="text-xs text-muted-foreground whitespace-pre-wrap">{boleto.observacoes}</p>
                                </div>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-2 pt-2">
                              <Button size="sm" variant="outline" onClick={() => handleVisualizarBoleto(boleto)}
                                className="flex-1 text-xs text-blue-600 dark:text-blue-400 hover:bg-blue-500/10 border-blue-200 dark:border-blue-900/50 bg-card">
                                <Eye className="h-3.5 w-3.5 mr-1" /> Ver
                              </Button>
                              {!(boleto.status === "pago" && boleto.data_pagamento) && (
                                <>
                                  {!boleto.asaas_id && (
                                    <Button variant="outline" size="sm" onClick={() => handleEnviarAsaas(boleto)}
                                      disabled={enviandoParaAsaas === boleto.id}
                                      className="flex-1 text-xs border-teal-500 dark:border-teal-700 text-teal-600 dark:text-teal-400 hover:bg-teal-500/10 bg-card">
                                      {enviandoParaAsaas === boleto.id ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Send className="h-3.5 w-3.5 mr-1" />}
                                      Asaas
                                    </Button>
                                  )}
                                  {boleto.asaas_bankslip_url && (
                                    <Button variant="outline" size="sm" onClick={() => window.open(boleto.asaas_bankslip_url || "#", "_blank")}
                                      className="flex-1 text-xs border-purple-500 dark:border-purple-700 text-purple-600 dark:text-purple-400 hover:bg-purple-500/10 bg-card">
                                      <Printer className="h-3.5 w-3.5 mr-1" /> Imprimir
                                    </Button>
                                  )}
                                  {(boleto.status === "pendente" || boleto.status === "aguardando_pagamento") && (
                                    <Button size="sm" variant="outline" onClick={() => handleMarcarPago(boleto)}
                                      className="flex-1 text-xs text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 border-emerald-200 dark:border-emerald-900/50 bg-card">
                                      <CheckCircle className="h-3.5 w-3.5 mr-1" /> Pagar
                                    </Button>
                                  )}
                                  <Button size="sm" variant="outline" onClick={() => handleEditarBoleto(boleto)}
                                    className="flex-1 text-xs text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 border-emerald-200 dark:border-emerald-900/50 bg-card">
                                    <Edit className="h-3.5 w-3.5 mr-1" /> Editar
                                  </Button>
                                </>
                              )}
                              <Button size="sm" variant="destructive" onClick={() => handleExcluirBoleto(boleto)}
                                disabled={deletingId === boleto.id} className="text-xs">
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

          <TabsContent value="recibos" className="space-y-4 lg:space-y-6">

            {/* Recibos Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="border border-border shadow-sm bg-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2">
                  <CardTitle className="text-xs lg:text-sm font-semibold text-muted-foreground">Total de Recibos</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="text-xl lg:text-2xl font-bold text-foreground">{recibosStats.total}</div>
                  <p className="text-[10px] lg:text-xs text-muted-foreground mt-0.5">Recibos emitidos no período</p>
                </CardContent>
              </Card>

              <Card className="border border-border shadow-sm bg-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2">
                  <CardTitle className="text-xs lg:text-sm font-semibold text-muted-foreground">Valor Total</CardTitle>
                  <DollarSign className="h-4 w-4 text-emerald-500" />
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="text-xl lg:text-2xl font-bold text-foreground">
                    {formatarValor(recibosStats.valorTotal)}
                  </div>
                  <p className="text-[10px] lg:text-xs text-muted-foreground mt-0.5">Valor acumulado dos recibos</p>
                </CardContent>
              </Card>
            </div>

            {/* Recibos Filters */}
            <Card className="border border-border shadow-md bg-card text-card-foreground">
              <CardHeader className="p-3 md:p-6 pb-2 md:pb-3">
                <CardTitle className="text-base md:text-xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent dark:from-emerald-400 dark:to-blue-400">
                  Buscar e Filtrar Recibos
                </CardTitle>
                <CardDescription className="text-xs md:text-sm">Pesquise por número, cliente ou descrição</CardDescription>
              </CardHeader>
              <CardContent className="p-3 md:p-6 pt-0">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar recibos..."
                    value={searchRecibos}
                    onChange={(e) => setSearchRecibos(e.target.value)}
                    className="pl-10 border-border bg-background text-foreground"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Desktop Table View */}
            <div className="hidden md:block">
              <Card className="border border-border shadow-md bg-card text-card-foreground">
                <CardHeader className="bg-gradient-to-r from-emerald-500 to-blue-600 text-white rounded-t-lg p-4 lg:p-6 dark:from-emerald-900/50 dark:to-blue-900/50 dark:border-b dark:border-border">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 w-full">
                    <div>
                      <CardTitle className="text-white flex items-center gap-2 text-lg lg:text-xl">
                        <DollarSign className="h-4 w-4 lg:h-5 lg:w-5" />
                        Recibos Emitidos
                      </CardTitle>
                      <CardDescription className="text-emerald-100 text-sm">
                        {filteredRecibos.length} recibo{filteredRecibos.length !== 1 ? "s" : ""} encontrado{filteredRecibos.length !== 1 ? "s" : ""}
                      </CardDescription>
                    </div>
                    <Link href="/financeiro/novo-recibo">
                      <Button className="bg-white text-emerald-600 hover:bg-emerald-50 text-sm lg:text-base dark:bg-slate-900 dark:text-emerald-400 dark:hover:bg-slate-800 dark:border-slate-800">
                        <Plus className="h-4 w-4 mr-2" />
                        Novo Recibo
                      </Button>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {filteredRecibos.length === 0 ? (
                    <div className="text-center py-12">
                      <DollarSign className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
                      <h3 className="text-xl font-medium text-foreground mb-2">
                        {searchRecibos ? "Nenhum recibo encontrado" : "Nenhum recibo cadastrado"}
                      </h3>
                      <p className="text-muted-foreground mb-6">
                        {searchRecibos ? "Tente ajustar os termos de busca" : "Comece criando seu primeiro recibo"}
                      </p>
                      {!searchRecibos && (
                        <Link href="/financeiro/novo-recibo">
                          <Button className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm h-9 px-4 text-sm font-medium transition-all">
                            <Plus className="h-4 w-4 mr-2" />
                            Criar Primeiro Recibo
                          </Button>
                        </Link>
                      )}
                    </div>
                  ) : (
                    <>
                      <ResizableTable
                        storageKey="financeiro-recibos"
                        columns={[
                          { key: "numero",       label: "Número",      width: 110, sortable: true },
                          { key: "cliente_nome", label: "Cliente",      width: 180, sortable: true },
                          { key: "descricao",    label: "Descrição",    width: 220, sortable: false },
                          { key: "valor",        label: "Valor",        width: 120, sortable: true },
                          { key: "data_emissao", label: "Data Emissão", width: 130, sortable: true },
                          { key: "acoes",        label: "Ações",        width: 120, sortable: false, noResize: true },
                        ]}
                        data={paginatedRecibos}
                        rowKey={(row) => row.id}
                        renderCell={(recibo, col) => {
                          switch (col) {
                            case "numero": return <Badge variant="outline" className="font-mono text-xs bg-background text-foreground border-border">{recibo.numero}</Badge>
                            case "cliente_nome": return <div className="font-medium text-foreground truncate">{recibo.cliente_nome}</div>
                            case "descricao": return <div className="max-w-xs truncate text-muted-foreground text-xs">{recibo.descricao}</div>
                            case "valor": return <div className="font-semibold text-emerald-600 dark:text-emerald-400">{formatarValor(recibo.valor)}</div>
                            case "data_emissao":
                              return (
                                <div className="flex items-center gap-2 text-xs">
                                  <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                  <span>{formatDate(recibo.data_emissao)}</span>
                                </div>
                              )
                            case "acoes":
                              return (
                                <div className="flex gap-2">
                                  <Button size="sm" variant="outline" className="text-blue-600 dark:text-blue-400 hover:bg-blue-500/10 border-border bg-transparent h-8 w-8 p-0">
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button size="sm" variant="outline" className="text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 border-border bg-transparent h-8 w-8 p-0">
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button size="sm" variant="outline" className="text-destructive hover:bg-destructive/10 border-border bg-transparent h-8 w-8 p-0">
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent className="border-border bg-card text-foreground">
                                      <AlertDialogHeader>
                                        <AlertDialogTitle className="text-foreground">Confirmar Exclusão</AlertDialogTitle>
                                        <AlertDialogDescription className="text-muted-foreground">Tem certeza que deseja excluir o recibo "{recibo.numero}"? Esta ação não pode ser desfeita.</AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel className="border-border bg-transparent hover:bg-muted text-foreground">Cancelar</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleDeleteRecibo(recibo)} className="bg-red-600 hover:bg-red-700 text-white border-0">Excluir Recibo</AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </div>
                              )
                            default: return null
                          }
                        }}
                      />

                      {/* Pagination Controls */}
                      <div className="p-4 border-t border-border/40 flex items-center justify-between gap-4">
                        <div className="text-[10px] sm:text-xs text-muted-foreground">
                          Mostrando <span className="font-medium text-foreground">{paginatedRecibos.length}</span> de{" "}
                          <span className="font-medium text-foreground">{filteredRecibos.length}</span> registros
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPageIndexRecibos(prev => Math.max(0, prev - 1))}
                            disabled={pageIndexRecibos === 0}
                            className="h-8 px-2 text-xs border-border bg-card"
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPageIndexRecibos(prev => prev + 1)}
                            disabled={(pageIndexRecibos + 1) * 10 >= filteredRecibos.length}
                            className="h-8 px-2 text-xs border-border bg-card"
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* MOBILE VIEW - Card-based layout */}
            <div className="md:hidden space-y-3">
              {hasActiveFilterRecibos && (
                <div className="flex justify-between items-center px-1 mb-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {filteredRecibos.length} recibo{filteredRecibos.length !== 1 ? "s" : ""}
                  </p>
                </div>
              )}

              {!hasActiveFilterRecibos ? (
                <div className="text-center py-12 bg-card rounded-xl border border-border p-6 shadow-sm">
                  <Search className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
                  <h3 className="text-base font-medium text-foreground mb-1">Busque para ver os recibos</h3>
                  <p className="text-sm text-muted-foreground">Digite na busca para começar.</p>
                </div>
              ) : filteredRecibos.length === 0 ? (
                <div className="text-center py-12">
                  <DollarSign className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
                  <h3 className="text-base font-medium text-foreground mb-1">Nenhum recibo encontrado</h3>
                  <p className="text-sm text-muted-foreground">Tente ajustar os filtros de busca.</p>
                </div>
              ) : (
                filteredRecibos.map((recibo) => {
                  const isExpanded = expandedReciboId === recibo.id
                  return (
                    <div
                      key={recibo.id}
                      className={`rounded-xl border border-border bg-card transition-all duration-200 overflow-hidden ${
                        isExpanded ? "shadow-lg ring-1 ring-indigo-500" : "shadow-sm hover:shadow-md"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => setExpandedReciboId(prev => prev === recibo.id ? null : recibo.id)}
                        className="w-full text-left p-3.5 flex items-center gap-3 bg-transparent text-foreground"
                      >
                        <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
                          {(recibo.cliente_nome || "?").substring(0, 2).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm text-foreground truncate">
                              {recibo.cliente_nome}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[11px] text-muted-foreground font-sans">
                              {recibo.numero}
                            </span>
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-border text-foreground">
                              {formatDate(recibo.data_emissao)}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0 mr-1">
                          <div className="text-sm font-bold text-blue-600 dark:text-blue-400">
                            {formatarValor(recibo.valor)}
                          </div>
                          <div className="text-[10px] text-muted-foreground font-medium">
                            {formatDate(recibo.data_emissao)}
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
                              <div className="bg-muted/50 rounded-lg p-2.5">
                                <span className="text-[10px] font-medium text-muted-foreground uppercase block mb-0.5">Valor</span>
                                <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">{formatarValor(recibo.valor)}</p>
                              </div>
                              <div className="bg-muted/50 rounded-lg p-2.5">
                                <span className="text-[10px] font-medium text-muted-foreground uppercase block mb-0.5">Emissão</span>
                                <p className="text-xs font-semibold text-foreground">{formatDate(recibo.data_emissao)}</p>
                              </div>
                              <div className="bg-muted/50 rounded-lg p-2.5 col-span-2">
                                <span className="text-[10px] font-medium text-muted-foreground uppercase block mb-0.5">Descrição</span>
                                <p className="text-xs text-foreground whitespace-pre-wrap">{recibo.descricao}</p>
                              </div>
                              {recibo.observacoes && (
                                <div className="bg-muted/50 rounded-lg p-2.5 col-span-2">
                                  <span className="text-[10px] font-medium text-muted-foreground uppercase block mb-0.5">Observações</span>
                                  <p className="text-xs text-muted-foreground whitespace-pre-wrap">{recibo.observacoes}</p>
                                </div>
                              )}
                            </div>
                            <div className="flex gap-2 pt-2">
                              <Button size="sm" variant="outline" className="flex-1 text-xs text-blue-600 dark:text-blue-400 hover:bg-blue-500/10 border-border bg-card">
                                <Eye className="h-3.5 w-3.5 mr-1" /> Ver
                              </Button>
                              <Button size="sm" variant="outline" className="flex-1 text-xs text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 border-border bg-card">
                                <Edit className="h-3.5 w-3.5 mr-1" /> Editar
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button size="sm" variant="destructive" className="text-xs">
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="border-border bg-card text-foreground">
                                  <AlertDialogHeader>
                                    <AlertDialogTitle className="text-foreground">Confirmar Exclusão</AlertDialogTitle>
                                    <AlertDialogDescription className="text-muted-foreground">Tem certeza que deseja excluir o recibo "{recibo.numero}"? Esta ação não pode ser desfeita.</AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel className="border-border bg-transparent hover:bg-muted text-foreground">Cancelar</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDeleteRecibo(recibo)} className="bg-red-600 hover:bg-red-700 text-white border-0">Excluir Recibo</AlertDialogAction>
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
          </TabsContent>

          <TabsContent value="fluxo-caixa" className="p-0">
            <FluxoCaixaTab />
          </TabsContent>
        </Tabs>

      {/* Dialogs */}
      <NovoBoletoDialog open={showNovoBoleto} onOpenChange={setShowNovoBoleto} onSuccess={loadData} />

      {boletoParaEditar && (
        <EditarBoletoDialog
          open={showEditarBoleto}
          onOpenChange={setShowEditarBoleto}
          boleto={boletoParaEditar}
          onSuccess={loadData}
        />
      )}

      <VisualizarBoletosDialog
        open={showVisualizarBoletos}
        onOpenChange={setShowVisualizarBoletos}
        numeroBase={boletoParaVisualizar}
      />

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="border-border bg-card text-foreground shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold text-foreground flex items-center gap-2">
              <AlertCircle className="h-6 w-6 text-red-600" />
              Confirmar Exclusão
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground text-base">
              Tem certeza que deseja excluir o boleto{" "}
              <strong className="text-foreground">{boletoParaExcluir?.numero}</strong>?
              <br />
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-3">
            <AlertDialogCancel className="border-border hover:bg-muted text-foreground bg-transparent">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmarExclusao}
              className="bg-red-600 hover:bg-red-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 h-9 lg:h-12 text-sm lg:text-base border-0"
              disabled={deletingId !== null}
            >
              {deletingId !== null ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Excluindo...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
