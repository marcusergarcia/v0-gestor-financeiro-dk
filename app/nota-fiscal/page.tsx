"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
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
} from "@/components/ui/alert-dialog"
import {
  FileText,
  Plus,
  Search,
  Eye,
  XCircle,
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2,
  FileCheck,
  DollarSign,
  Send,
  RefreshCw,
  Printer,
  Receipt,
  Package,
  Wrench,
} from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { formatCurrency } from "@/lib/utils"
import { EmitirNfseDialog } from "@/components/nfse/emitir-nfse-dialog"
import { DetalheNfseDialog } from "@/components/nfse/detalhe-nfse-dialog"
import { ImprimirNfseDialog } from "@/components/nfse/imprimir-nfse-dialog"
import { NovoBoletoDialog } from "@/components/financeiro/novo-boleto-dialog"
import { VisualizarBoletosDialog } from "@/components/financeiro/visualizar-boletos-dialog"
import { DetalheNfeDialog } from "@/components/nfe/detalhe-nfe-dialog"
import { DanfeDialog } from "@/components/nfe/danfe-dialog"
import Link from "next/link"

// Tipo unificado para ambas as notas
interface NotaUnificada {
  id: number
  tipo: "nfse" | "nfe" // Tipo da nota
  // Campos comuns
  numero: string | null // numero_nfse ou numero_nfe
  origem: string
  origem_id: number | null
  origem_numero: string | null
  cliente_id: number | null
  cliente_nome: string | null
  tomador_razao_social: string
  tomador_cpf_cnpj: string
  valor_total: number
  status: string
  data_emissao: string | null
  created_at: string
  mensagem_erro: string | null
  // Campos NFS-e
  numero_nfse?: string | null
  numero_rps?: number
  serie_rps?: string
  codigo_verificacao?: string | null
  valor_servicos?: number
  descricao_servico?: string | null
  // Campos NF-e
  numero_nfe?: number
  serie?: number
  chave_acesso?: string
  protocolo?: string
  valor_produtos?: number
  natureza_operacao?: string
}

function formatDateBR(dateStr: string | null): string {
  if (!dateStr) return "-"
  try {
    return new Date(dateStr).toLocaleDateString("pt-BR")
  } catch {
    return dateStr
  }
}

export default function NotaFiscalPage() {
  const [notas, setNotas] = useState<NotaUnificada[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("todos")
  const [origemFilter, setOrigemFilter] = useState("todos")
  const [tipoFilter, setTipoFilter] = useState("todos")

  // NFS-e states
  const [emitirNfseOpen, setEmitirNfseOpen] = useState(false)
  const [detalheNfseOpen, setDetalheNfseOpen] = useState(false)
  const [nfseSelecionada, setNfseSelecionada] = useState<number | null>(null)
  const [imprimirNfseOpen, setImprimirNfseOpen] = useState(false)
  const [notaImprimirNfse, setNotaImprimirNfse] = useState<number | null>(null)

  // NF-e states
  const [detalheNfeOpen, setDetalheNfeOpen] = useState(false)
  const [nfeSelecionada, setNfeSelecionada] = useState<number | null>(null)
  const [danfeOpen, setDanfeOpen] = useState(false)
  const [danfeNfeId, setDanfeNfeId] = useState<number | null>(null)

  // Cancelamento
  const [cancelarOpen, setCancelarOpen] = useState(false)
  const [notaCancelar, setNotaCancelar] = useState<NotaUnificada | null>(null)
  const [motivoCancelamento, setMotivoCancelamento] = useState("")
  const [cancelando, setCancelando] = useState(false)

  const [consultandoId, setConsultandoId] = useState<number | null>(null)
  const [logoMenu, setLogoMenu] = useState<string>("")

  // Boleto
  const [boletoOpen, setBoletoOpen] = useState(false)
  const [notaParaBoleto, setNotaParaBoleto] = useState<any>(null)
  const [visualizarBoletosOpen, setVisualizarBoletosOpen] = useState(false)
  const [visualizarBoletosNumero, setVisualizarBoletosNumero] = useState("")
  const [boletoStatusMap, setBoletoStatusMap] = useState<Record<string, { temBoleto: boolean; aguardandoPagamento: boolean }>>({})

  const { toast } = useToast()

  const [stats, setStats] = useState({
    total: 0,
    emitidas: 0,
    pendentes: 0,
    canceladas: 0,
    erros: 0,
    valorTotal: 0,
    totalNfse: 0,
    totalNfe: 0,
  })

  useEffect(() => {
    fetchTodasNotas()
    loadLogoMenu()
  }, [])

  useEffect(() => {
    calcularStats()
  }, [notas])

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
      console.error("Erro ao carregar logo:", error)
    }
  }

  const fetchTodasNotas = async () => {
    try {
      // Fetch NFS-e and NF-e em paralelo
      const [nfseResponse, nfeResponse] = await Promise.all([
        fetch("/api/nfse").catch(() => null),
        fetch("/api/nfe").catch(() => null),
      ])

      const notasUnificadas: NotaUnificada[] = []

      // Processar NFS-e
      if (nfseResponse?.ok) {
        const nfseResult = await nfseResponse.json()
        if (nfseResult.success && nfseResult.data) {
          for (const n of nfseResult.data) {
            notasUnificadas.push({
              id: n.id,
              tipo: "nfse",
              numero: n.numero_nfse || null,
              numero_nfse: n.numero_nfse,
              numero_rps: n.numero_rps,
              serie_rps: n.serie_rps,
              codigo_verificacao: n.codigo_verificacao,
              origem: n.origem || "avulsa",
              origem_id: n.origem_id,
              origem_numero: n.origem_numero,
              cliente_id: n.cliente_id,
              cliente_nome: n.cliente_nome,
              tomador_razao_social: n.tomador_razao_social || n.cliente_nome || "",
              tomador_cpf_cnpj: n.tomador_cpf_cnpj || "",
              valor_servicos: n.valor_servicos,
              valor_total: Number(n.valor_total) || 0,
              descricao_servico: n.descricao_servico,
              status: n.status,
              data_emissao: n.data_emissao,
              created_at: n.created_at,
              mensagem_erro: n.mensagem_erro,
            })
          }
          // Fetch boleto status for NFS-e
          fetchBoletoStatus(nfseResult.data)
        }
      }

      // Processar NF-e
      if (nfeResponse?.ok) {
        const nfeResult = await nfeResponse.json()
        if (nfeResult.success && nfeResult.data) {
          for (const n of nfeResult.data) {
            notasUnificadas.push({
              id: n.id,
              tipo: "nfe",
              numero: n.numero_nfe ? String(n.numero_nfe) : null,
              numero_nfe: n.numero_nfe,
              serie: n.serie,
              chave_acesso: n.chave_acesso,
              protocolo: n.protocolo,
              origem: n.origem || "avulsa",
              origem_id: n.origem_id,
              origem_numero: n.origem_numero,
              cliente_id: n.cliente_id,
              cliente_nome: n.cliente_nome,
              tomador_razao_social: n.dest_razao_social || n.cliente_nome || "",
              tomador_cpf_cnpj: n.dest_cpf_cnpj || "",
              valor_produtos: n.valor_produtos,
              valor_total: Number(n.valor_total) || Number(n.valor_produtos) || 0,
              natureza_operacao: n.natureza_operacao,
              status: n.status,
              data_emissao: n.data_emissao || n.data_autorizacao,
              created_at: n.created_at,
              mensagem_erro: n.mensagem_erro,
            })
          }
        }
      }

      // Ordenar por data de criacao (mais recente primeiro)
      notasUnificadas.sort((a, b) => {
        const dateA = new Date(a.created_at || 0).getTime()
        const dateB = new Date(b.created_at || 0).getTime()
        return dateB - dateA
      })

      setNotas(notasUnificadas)
    } catch {
      setNotas([])
    } finally {
      setLoading(false)
    }
  }

  const fetchBoletoStatus = async (notasList: any[]) => {
    try {
      const emitidas = notasList.filter((n: any) => n.status === "emitida" && n.numero_nfse)
      if (emitidas.length === 0) return

      const response = await fetch("/api/boletos/status-por-nota")
      const result = await response.json()
      if (result.success && result.data) {
        setBoletoStatusMap(result.data)
      }
    } catch (error) {
      console.error("Erro ao buscar status dos boletos:", error)
    }
  }

  const calcularStats = () => {
    const statusEmitida = notas.filter((n) => n.status === "emitida" || n.status === "autorizada")
    setStats({
      total: notas.length,
      emitidas: statusEmitida.length,
      pendentes: notas.filter((n) => n.status === "pendente" || n.status === "processando").length,
      canceladas: notas.filter((n) => n.status === "cancelada").length,
      erros: notas.filter((n) => n.status === "erro" || n.status === "rejeitada").length,
      valorTotal: statusEmitida.reduce((sum, n) => sum + Number(n.valor_total), 0),
      totalNfse: notas.filter((n) => n.tipo === "nfse").length,
      totalNfe: notas.filter((n) => n.tipo === "nfe").length,
    })
  }

  const handleConsultarNfse = async (notaId: number) => {
    setConsultandoId(notaId)
    try {
      const response = await fetch(`/api/nfse/${notaId}/consultar`, { method: "POST" })
      const result = await response.json()

      if (result.success) {
        toast({ title: "NFS-e Encontrada!", description: result.message })
        fetchTodasNotas()
      } else {
        toast({
          title: "Consulta NFS-e",
          description: result.message,
          variant: result.data?.status === "processando" ? "default" : "destructive",
        })
        if (result.data?.status === "erro") fetchTodasNotas()
      }
    } catch {
      toast({ title: "Erro", description: "Erro ao consultar status da NFS-e", variant: "destructive" })
    } finally {
      setConsultandoId(null)
    }
  }

  const handleConsultarNfe = async (notaId: number) => {
    setConsultandoId(notaId)
    try {
      const response = await fetch(`/api/nfe/${notaId}/consultar`, { method: "POST" })
      const result = await response.json()

      if (result.success) {
        toast({ title: "NF-e Consultada!", description: `cStat: ${result.data?.cStat} - ${result.data?.xMotivo}` })
        fetchTodasNotas()
      } else {
        toast({ title: "Consulta NF-e", description: result.message, variant: "destructive" })
      }
    } catch {
      toast({ title: "Erro", description: "Erro ao consultar NF-e na SEFAZ", variant: "destructive" })
    } finally {
      setConsultandoId(null)
    }
  }

  const handleConsultarTodas = async () => {
    const processando = notas.filter((n) => n.status === "processando")
    if (processando.length === 0) {
      toast({ title: "Nenhuma nota pendente", description: "Nao ha notas em processamento para consultar." })
      return
    }

    toast({ title: "Consultando...", description: `Consultando ${processando.length} nota(s)...` })

    for (const nota of processando) {
      if (nota.tipo === "nfse") {
        await handleConsultarNfse(nota.id)
      } else {
        await handleConsultarNfe(nota.id)
      }
      await new Promise((r) => setTimeout(r, 1000))
    }

    fetchTodasNotas()
  }

  const handleCancelar = async () => {
    if (!notaCancelar) return
    setCancelando(true)
    try {
      if (notaCancelar.tipo === "nfse") {
        const response = await fetch(`/api/nfse/${notaCancelar.id}/cancelar`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ motivo: motivoCancelamento }),
        })
        const result = await response.json()
        if (result.success) {
          toast({ title: "NFS-e cancelada", description: "Nota fiscal de servico cancelada com sucesso" })
          fetchTodasNotas()
        } else {
          toast({ title: "Erro", description: result.message, variant: "destructive" })
        }
      } else {
        toast({ title: "Info", description: "Cancelamento de NF-e sera implementado em breve." })
      }
    } catch {
      toast({ title: "Erro", description: "Erro ao cancelar nota fiscal", variant: "destructive" })
    } finally {
      setCancelando(false)
      setCancelarOpen(false)
      setNotaCancelar(null)
      setMotivoCancelamento("")
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "emitida":
      case "autorizada":
        return (
          <Badge className="bg-green-100 text-green-700 border-green-300 gap-1">
            <CheckCircle2 className="h-3 w-3" />
            {status === "autorizada" ? "Autorizada" : "Emitida"}
          </Badge>
        )
      case "processando":
        return (
          <Badge className="bg-blue-100 text-blue-700 border-blue-300 gap-1">
            <Loader2 className="h-3 w-3 animate-spin" />
            Processando
          </Badge>
        )
      case "pendente":
        return (
          <Badge className="bg-amber-100 text-amber-700 border-amber-300 gap-1">
            <Clock className="h-3 w-3" />
            Pendente
          </Badge>
        )
      case "cancelada":
        return (
          <Badge className="bg-red-100 text-red-700 border-red-300 gap-1">
            <XCircle className="h-3 w-3" />
            Cancelada
          </Badge>
        )
      case "erro":
      case "rejeitada":
        return (
          <Badge className="bg-red-100 text-red-700 border-red-300 gap-1">
            <AlertCircle className="h-3 w-3" />
            {status === "rejeitada" ? "Rejeitada" : "Erro"}
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getTipoBadge = (tipo: "nfse" | "nfe") => {
    if (tipo === "nfse") {
      return (
        <Badge className="bg-emerald-100 text-emerald-700 border-emerald-300 gap-1 text-[10px]">
          <Wrench className="h-3 w-3" />
          NFS-e
        </Badge>
      )
    }
    return (
      <Badge className="bg-blue-100 text-blue-700 border-blue-300 gap-1 text-[10px]">
        <Package className="h-3 w-3" />
        NF-e
      </Badge>
    )
  }

  const getOrigemLabel = (origem: string) => {
    switch (origem) {
      case "orcamento": return "Orcamento"
      case "ordem_servico": return "O.S."
      case "boleto": return "Boleto"
      case "avulsa": return "Avulsa"
      default: return origem
    }
  }

  const notasFiltradas = notas.filter((nota) => {
    // Filtro de tipo
    if (tipoFilter !== "todos" && nota.tipo !== tipoFilter) return false
    // Filtro de status
    if (statusFilter !== "todos") {
      if (statusFilter === "emitida" && nota.status !== "emitida" && nota.status !== "autorizada") return false
      if (statusFilter === "erro" && nota.status !== "erro" && nota.status !== "rejeitada") return false
      if (statusFilter !== "emitida" && statusFilter !== "erro" && nota.status !== statusFilter) return false
    }
    // Filtro de origem
    if (origemFilter !== "todos" && nota.origem !== origemFilter) return false
    // Filtro de busca
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      const matchSearch =
        nota.numero?.toLowerCase().includes(search) ||
        nota.numero_nfse?.toLowerCase().includes(search) ||
        String(nota.numero_nfe || "").includes(search) ||
        nota.tomador_razao_social?.toLowerCase().includes(search) ||
        nota.cliente_nome?.toLowerCase().includes(search) ||
        String(nota.numero_rps || "").includes(search) ||
        nota.tomador_cpf_cnpj?.includes(search) ||
        nota.chave_acesso?.includes(search)
      if (!matchSearch) return false
    }
    return true
  })

  const handleVerDetalhes = (nota: NotaUnificada) => {
    if (nota.tipo === "nfse") {
      setNfseSelecionada(nota.id)
      setDetalheNfseOpen(true)
    } else {
      setNfeSelecionada(nota.id)
      setDetalheNfeOpen(true)
    }
  }

  const handleImprimir = (nota: NotaUnificada) => {
    if (nota.tipo === "nfse") {
      setNotaImprimirNfse(nota.id)
      setImprimirNfseOpen(true)
    } else {
      setDanfeNfeId(nota.id)
      setDanfeOpen(true)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto p-6 space-y-6 pb-32 md:pb-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {logoMenu && (
              <img
                src={logoMenu || "/placeholder.svg"}
                alt="Logo"
                className="h-12 w-12 object-contain rounded-lg shadow-md bg-white p-1"
              />
            )}
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                Notas Fiscais
              </h1>
              <p className="text-gray-600 mt-1">NFS-e (Servico) e NF-e (Material)</p>
            </div>
          </div>
          <Button
            onClick={() => setEmitirNfseOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            <span className="hidden md:inline">Emitir NFS-e</span>
            <span className="md:hidden">Nova</span>
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <Card className="border-0 shadow-md bg-white">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FileText className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
                  <p className="text-xs text-gray-500">Total</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md bg-white">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <Wrench className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-emerald-700">{stats.totalNfse}</p>
                  <p className="text-xs text-gray-500">NFS-e</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md bg-white">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Package className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-700">{stats.totalNfe}</p>
                  <p className="text-xs text-gray-500">NF-e</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md bg-white">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-700">{stats.emitidas}</p>
                  <p className="text-xs text-gray-500">Emitidas</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md bg-white">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-amber-700">{stats.erros}</p>
                  <p className="text-xs text-gray-500">Erros</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md bg-white">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <DollarSign className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-lg font-bold text-emerald-700">{formatCurrency(stats.valorTotal)}</p>
                  <p className="text-xs text-gray-500">Valor Total</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros e Tabela */}
        <Card className="border-0 shadow-lg bg-white">
          <CardHeader>
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <CardTitle className="flex items-center gap-2">
                <FileCheck className="h-5 w-5 text-emerald-600" />
                Notas Fiscais Emitidas
              </CardTitle>
              <div className="flex items-center gap-2">
                {stats.pendentes > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleConsultarTodas}
                    disabled={consultandoId !== null}
                    className="text-blue-600 border-blue-300 hover:bg-blue-50"
                  >
                    {consultandoId !== null ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4 mr-2" />
                    )}
                    Consultar Pendentes ({stats.pendentes})
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={() => { setLoading(true); fetchTodasNotas() }}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Atualizar
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Filtros */}
            <div className="flex flex-col md:flex-row gap-3 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por numero, nome, CNPJ, chave de acesso..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={tipoFilter} onValueChange={setTipoFilter}>
                <SelectTrigger className="w-full md:w-36">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos Tipos</SelectItem>
                  <SelectItem value="nfse">NFS-e</SelectItem>
                  <SelectItem value="nfe">NF-e</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos Status</SelectItem>
                  <SelectItem value="emitida">Emitida/Autorizada</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="processando">Processando</SelectItem>
                  <SelectItem value="erro">Erro/Rejeitada</SelectItem>
                  <SelectItem value="cancelada">Cancelada</SelectItem>
                </SelectContent>
              </Select>
              <Select value={origemFilter} onValueChange={setOrigemFilter}>
                <SelectTrigger className="w-full md:w-40">
                  <SelectValue placeholder="Origem" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas Origens</SelectItem>
                  <SelectItem value="orcamento">Orcamento</SelectItem>
                  <SelectItem value="ordem_servico">O.S.</SelectItem>
                  <SelectItem value="avulsa">Avulsa</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Tabela */}
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : notasFiltradas.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600">Nenhuma nota fiscal encontrada</h3>
                <p className="text-gray-500 mt-1">
                  Emita notas a partir de orcamentos aprovados ou clique em "Emitir NFS-e" para uma nota avulsa.
                </p>
                <Button
                  onClick={() => setEmitirNfseOpen(true)}
                  className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Emitir NFS-e
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Numero</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Origem</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead className="text-right">Acoes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {notasFiltradas.map((nota) => (
                      <TableRow key={`${nota.tipo}-${nota.id}`} className="hover:bg-gray-50">
                        <TableCell>
                          {getTipoBadge(nota.tipo)}
                        </TableCell>
                        <TableCell>
                          <div>
                            {nota.tipo === "nfse" ? (
                              <>
                                {nota.numero_nfse ? (
                                  <span className="font-semibold text-emerald-700">
                                    {String(nota.numero_nfse).padStart(8, "0")}
                                  </span>
                                ) : (nota.status === "processando" || nota.status === "erro") ? (
                                  <button
                                    className="text-blue-600 text-xs font-medium hover:underline flex items-center gap-1"
                                    onClick={() => handleConsultarNfse(nota.id)}
                                    disabled={consultandoId === nota.id}
                                  >
                                    {consultandoId === nota.id ? (
                                      <Loader2 className="h-3 w-3 animate-spin" />
                                    ) : (
                                      <RefreshCw className="h-3 w-3" />
                                    )}
                                    Consultar
                                  </button>
                                ) : (
                                  <span className="text-gray-400 text-xs italic">-</span>
                                )}
                                <p className="text-xs text-gray-400">RPS: {nota.serie_rps || "11"}.{String(nota.numero_rps || 0).padStart(8, "0")}</p>
                              </>
                            ) : (
                              <>
                                {nota.numero_nfe ? (
                                  <span className="font-semibold text-blue-700">
                                    {String(nota.numero_nfe).padStart(9, "0")}
                                  </span>
                                ) : (
                                  <span className="text-gray-400 text-xs italic">-</span>
                                )}
                                {nota.serie && (
                                  <p className="text-xs text-gray-400">Serie: {nota.serie}</p>
                                )}
                              </>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm truncate max-w-[200px]">
                              {nota.tomador_razao_social || nota.cliente_nome || "-"}
                            </p>
                            {nota.tomador_cpf_cnpj && (
                              <p className="text-xs text-gray-400">{nota.tomador_cpf_cnpj}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {getOrigemLabel(nota.origem)}
                            {nota.origem_numero && ` #${nota.origem_numero}`}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatCurrency(nota.valor_total)}
                        </TableCell>
                        <TableCell>{getStatusBadge(nota.status)}</TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {formatDateBR(nota.data_emissao || nota.created_at)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-1">
                            {/* Consultar (NFS-e processando/erro) */}
                            {nota.tipo === "nfse" && (nota.status === "processando" || nota.status === "erro") && !nota.numero_nfse && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                onClick={() => handleConsultarNfse(nota.id)}
                                disabled={consultandoId === nota.id}
                                title="Consultar status na prefeitura"
                              >
                                {consultandoId === nota.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <RefreshCw className="h-4 w-4" />
                                )}
                              </Button>
                            )}
                            {/* Consultar (NF-e processando/rejeitada) */}
                            {nota.tipo === "nfe" && (nota.status === "processando" || nota.status === "rejeitada") && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                onClick={() => handleConsultarNfe(nota.id)}
                                disabled={consultandoId === nota.id}
                                title="Consultar status na SEFAZ"
                              >
                                {consultandoId === nota.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <RefreshCw className="h-4 w-4" />
                                )}
                              </Button>
                            )}
                            {/* Ver detalhes */}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleVerDetalhes(nota)}
                              title="Ver detalhes"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {/* Imprimir (NFS-e emitida/cancelada ou NF-e autorizada) */}
                            {((nota.tipo === "nfse" && (nota.status === "emitida" || nota.status === "cancelada")) ||
                              (nota.tipo === "nfe" && nota.status === "autorizada")) && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                onClick={() => handleImprimir(nota)}
                                title={nota.tipo === "nfse" ? "Imprimir NFS-e" : "Imprimir DANFE"}
                              >
                                <Printer className="h-4 w-4" />
                              </Button>
                            )}
                            {/* Boleto (somente NFS-e emitida) */}
                            {nota.tipo === "nfse" && nota.status === "emitida" && (() => {
                              const nfseNum = String(nota.numero_nfse || "")
                              const boletoInfo = boletoStatusMap[nfseNum]

                              if (boletoInfo?.temBoleto && boletoInfo.aguardandoPagamento) {
                                return (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-teal-600 hover:text-teal-700 hover:bg-teal-50"
                                    onClick={() => {
                                      setVisualizarBoletosNumero(nfseNum)
                                      setVisualizarBoletosOpen(true)
                                    }}
                                    title="Imprimir Boleto / Parcelas"
                                  >
                                    <Receipt className="h-4 w-4" />
                                  </Button>
                                )
                              }

                              if (boletoInfo?.temBoleto) return null

                              return (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                  onClick={() => {
                                    setNotaParaBoleto(nota)
                                    setBoletoOpen(true)
                                  }}
                                  title="Gerar Boleto"
                                >
                                  <DollarSign className="h-4 w-4" />
                                </Button>
                              )
                            })()}
                            {/* Cancelar (NFS-e emitida) */}
                            {nota.tipo === "nfse" && nota.status === "emitida" && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() => {
                                  setNotaCancelar(nota)
                                  setCancelarOpen(true)
                                }}
                                title="Cancelar NFS-e"
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            )}
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

        {/* Info sobre credenciamento */}
        <Card className="border-0 shadow-md bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-800">Sobre as Notas Fiscais</h4>
                <p className="text-sm text-blue-700 mt-1">
                  <strong>NFS-e (Servico)</strong>: emitida via Prefeitura de SP para mao de obra. <strong>NF-e (Material)</strong>: emitida via SEFAZ para materiais.
                  Configure certificados e dados fiscais em{" "}
                  <Link href="/configuracoes" className="underline font-medium">
                    Configuracoes
                  </Link>
                  .
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dialogs NFS-e */}
      <EmitirNfseDialog
        open={emitirNfseOpen}
        onOpenChange={setEmitirNfseOpen}
        onSuccess={() => fetchTodasNotas()}
      />

      <DetalheNfseDialog
        open={detalheNfseOpen}
        onOpenChange={setDetalheNfseOpen}
        notaId={nfseSelecionada}
        onPrint={(id) => {
          setNotaImprimirNfse(id)
          setImprimirNfseOpen(true)
        }}
        onBoleto={(nota) => {
          setNotaParaBoleto(nota)
          setBoletoOpen(true)
        }}
      />

      <ImprimirNfseDialog
        open={imprimirNfseOpen}
        onOpenChange={setImprimirNfseOpen}
        notaId={notaImprimirNfse}
      />

      {/* Dialogs NF-e */}
      <DetalheNfeDialog
        open={detalheNfeOpen}
        onOpenChange={setDetalheNfeOpen}
        nfeId={nfeSelecionada}
        onPrint={(id) => {
          setDanfeNfeId(id)
          setDanfeOpen(true)
        }}
      />

      <DanfeDialog
        open={danfeOpen}
        onOpenChange={setDanfeOpen}
        nfeId={danfeNfeId}
      />

      {/* Boletos */}
      <NovoBoletoDialog
        open={boletoOpen}
        onOpenChange={(open) => {
          setBoletoOpen(open)
          if (!open) setNotaParaBoleto(null)
        }}
        notaFiscal={notaParaBoleto}
        onSuccess={() => {
          setBoletoOpen(false)
          setNotaParaBoleto(null)
          fetchTodasNotas()
        }}
      />

      <VisualizarBoletosDialog
        open={visualizarBoletosOpen}
        onOpenChange={setVisualizarBoletosOpen}
        numeroBase={visualizarBoletosNumero}
      />

      {/* Dialog de Cancelamento */}
      <AlertDialog open={cancelarOpen} onOpenChange={setCancelarOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Cancelar {notaCancelar?.tipo === "nfse" ? "NFS-e" : "NF-e"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja cancelar a {notaCancelar?.tipo === "nfse" ? "NFS-e" : "NF-e"}{" "}
              {notaCancelar?.numero || `#${notaCancelar?.id}`}?
              Esta acao nao pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2 py-2">
            <label className="text-sm font-medium">Motivo do Cancelamento</label>
            <Textarea
              value={motivoCancelamento}
              onChange={(e) => setMotivoCancelamento(e.target.value)}
              placeholder="Informe o motivo do cancelamento"
              rows={3}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancelando}>Voltar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelar}
              disabled={cancelando || !motivoCancelamento}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {cancelando ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Cancelando...
                </>
              ) : (
                "Confirmar Cancelamento"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
