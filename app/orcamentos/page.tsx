"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ResizableTable } from "@/components/ui/resizable-table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Plus,
  Eye,
  EyeOff,
  Edit,
  Trash2,
  FileText,
  DollarSign,
  Calendar,
  User,
  Send,
  CheckCircle,
  FileCheck,
  Search,
  Filter,
  Wrench,
  Package,
  ChevronRight,
  MoreHorizontal
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { formatCurrency, formatDate } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { EmitirNfseDialog } from "@/components/nfse/emitir-nfse-dialog"
import { EmitirNfeDialog } from "@/components/nfe/emitir-nfe-dialog"
import { NovoOrcamentoDialog } from "@/components/orcamentos/novo-orcamento-dialog"
import { VisualizarOrcamentoDialog } from "@/components/orcamentos/visualizar-orcamento-dialog"
import { EditarOrcamentoDialog } from "@/components/orcamentos/editar-orcamento-dialog"
import { OrcamentoDeleteDialog } from "@/components/orcamentos/orcamento-delete-dialog"

interface Orcamento {
  id: string
  numero: string
  cliente_id: string
  cliente_nome: string
  cliente_codigo?: string
  cliente_cnpj?: string
  cliente_cpf?: string
  cliente_email?: string
  cliente_telefone?: string
  cliente_endereco?: string
  cliente_bairro?: string
  cliente_cidade?: string
  cliente_estado?: string
  cliente_cep?: string
  data_orcamento: string
  data_criacao: string
  detalhes_servico?: string
  valor_total: number
  valor_mao_obra?: number
  valor_material?: number
  subtotal_mdo?: number
  situacao: string
  tipo_servico: string
  distancia_km?: number
  valor_boleto?: number
  prazo_dias?: number
  juros_am?: number
  imposto_servico?: number
  imposto_material?: number
  desconto_mdo_percent?: number
  desconto_mdo_valor?: number
  parcelamento_mdo?: number
  parcelamento_material?: number
}

export default function OrcamentosPage({
  searchParams,
}: {
  searchParams?: Promise<{
    novo?: string
  }>
}) {
  const router = useRouter()
  const [orcamentos, setOrcamentos] = useState<Orcamento[]>([])
  const [loading, setLoading] = useState(true)
  const [logoMenu, setLogoMenu] = useState<string>("")
  const [searchTerm, setSearchTerm] = useState("")
  const [situacaoFilter, setSituacaoFilter] = useState("todos")
  const [expandedOrcamentoId, setExpandedOrcamentoId] = useState<string | null>(null)
  const [isNovoOrcamentoOpen, setIsNovoOrcamentoOpen] = useState(false)
  const [selectedOrcamentoNumeroVisualizar, setSelectedOrcamentoNumeroVisualizar] = useState<string | null>(null)
  const [isVisualizarOrcamentoOpen, setIsVisualizarOrcamentoOpen] = useState(false)
  const [selectedOrcamentoNumeroEditar, setSelectedOrcamentoNumeroEditar] = useState<string | null>(null)
  const [isEditarOrcamentoOpen, setIsEditarOrcamentoOpen] = useState(false)

  // Parse URL Search Params
  useEffect(() => {
    if (searchParams) {
      searchParams.then((params) => {
        if (params.novo === "true") {
          setIsNovoOrcamentoOpen(true)
        }
        // Clear params to keep URL clean
        if (Object.keys(params).length > 0) {
          router.replace("/orcamentos")
        }
      })
    }
  }, [searchParams, router])
  const [nfseDialogOpen, setNfseDialogOpen] = useState(false)
  const [nfseOrcamento, setNfseOrcamento] = useState<Orcamento | null>(null)
  const [nfeDialogOpen, setNfeDialogOpen] = useState(false)
  const [nfeOrcamento, setNfeOrcamento] = useState<Orcamento | null>(null)
  const [nfeItens, setNfeItens] = useState<any[]>([])
  const [valorPorKm, setValorPorKm] = useState(1.5)
  // Mapa de orcamento numero -> { temNfse, temNfe } para controlar icones
  const [notasEmitidas, setNotasEmitidas] = useState<Record<string, { temNfse: boolean; temNfe: boolean }>>({})
  const { toast } = useToast()

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

  useEffect(() => {
    fetchOrcamentos()
    loadLogoMenu()
    loadValorPorKm()
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

  const loadValorPorKm = async () => {
    try {
      const response = await fetch("/api/configuracoes/valor-km")
      const result = await response.json()
      if (result.success && result.data) {
        setValorPorKm(result.data.valor_por_km || 1.5)
      }
    } catch (error) {
      console.error("Erro ao carregar valor por km:", error)
    }
  }

  const safeNumber = (value: any): number => {
    const num = Number(value)
    return isNaN(num) ? 0 : num
  }

  // Calcula o Subtotal MDO (valor da nota de servico NFS-e) para um orcamento
  const calcularSubtotalMdoOrcamento = (orc: Orcamento): number => {
    const parcelamentoMdo = safeNumber(orc.parcelamento_mdo) || 1
    if (parcelamentoMdo === 0) return 0

    const valorMaoObra = safeNumber(orc.valor_mao_obra)
    const descontoMdoValor = safeNumber(orc.desconto_mdo_valor)
    const distancia = safeNumber(orc.distancia_km)
    const prazo = safeNumber(orc.prazo_dias)
    const valorBoleto = safeNumber(orc.valor_boleto)
    const impostoServico = safeNumber(orc.imposto_servico)

    const custoDeslocamento = distancia * 2 * safeNumber(valorPorKm) * prazo
    const taxaBoletoMdo = parcelamentoMdo * valorBoleto

    const baseImposto = valorMaoObra - descontoMdoValor + custoDeslocamento + taxaBoletoMdo
    const impostoServicoValor = (baseImposto * impostoServico) / 100

    return valorMaoObra - descontoMdoValor + custoDeslocamento + taxaBoletoMdo + impostoServicoValor
  }

  const fetchNotasEmitidasPorOrcamento = async () => {
    try {
      const [nfseRes, nfeRes] = await Promise.all([
        fetch("/api/nfse").catch(() => null),
        fetch("/api/nfe").catch(() => null),
      ])

      const mapa: Record<string, { temNfse: boolean; temNfe: boolean }> = {}

      if (nfseRes?.ok) {
        const nfseData = await nfseRes.json()
        if (nfseData.success && nfseData.data) {
          for (const nf of nfseData.data) {
            if (nf.origem === "orcamento" && nf.origem_numero && (nf.status === "emitida" || nf.status === "processando")) {
              const num = String(nf.origem_numero)
              if (!mapa[num]) mapa[num] = { temNfse: false, temNfe: false }
              mapa[num].temNfse = true
            }
          }
        }
      }

      if (nfeRes?.ok) {
        const nfeData = await nfeRes.json()
        if (nfeData.success && nfeData.data) {
          for (const nf of nfeData.data) {
            if (nf.origem === "orcamento" && nf.origem_numero && (nf.status === "autorizada" || nf.status === "processando")) {
              const num = String(nf.origem_numero)
              if (!mapa[num]) mapa[num] = { temNfse: false, temNfe: false }
              mapa[num].temNfe = true
            }
          }
        }
      }

      setNotasEmitidas(mapa)
    } catch (error) {
      console.error("Erro ao buscar notas emitidas:", error)
    }
  }

  const fetchOrcamentos = async () => {
    try {
      const response = await fetch("/api/orcamentos")
      const data = await response.json()
      if (data.success) {
        const orcamentosOrdenados = (data.data || []).sort((a: Orcamento, b: Orcamento) => {
          const ordemPrioridade = {
            pendente: 1,
            "nota fiscal emitida": 2,
            aprovado: 3,
            "enviado por email": 4,
            concluido: 5,
          }

          const prioridadeA = ordemPrioridade[a.situacao as keyof typeof ordemPrioridade] || 5
          const prioridadeB = ordemPrioridade[b.situacao as keyof typeof ordemPrioridade] || 5

          if (prioridadeA !== prioridadeB) {
            return prioridadeA - prioridadeB
          }

          return new Date(b.data_criacao).getTime() - new Date(a.data_criacao).getTime()
        })

        setOrcamentos(orcamentosOrdenados)
      }
      // Buscar notas emitidas para controlar icones
      await fetchNotasEmitidasPorOrcamento()
    } catch (error) {
      console.error("Erro ao buscar orçamentos:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (numero: string) => {
    if (!confirm("Tem certeza que deseja excluir este orçamento?")) {
      return
    }

    try {
      const response = await fetch(`/api/orcamentos/${numero}`, {
        method: "DELETE",
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Sucesso",
          description: "Orçamento excluído com sucesso",
        })
        fetchOrcamentos()
      } else {
        toast({
          title: "Erro",
          description: result.message || "Erro ao excluir orçamento",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Erro ao excluir orçamento:", error)
      toast({
        title: "Erro",
        description: "Erro de conexão. Tente novamente.",
        variant: "destructive",
      })
    }
  }

  const handleEmitirNfse = (orcamento: Orcamento) => {
    setNfseOrcamento(orcamento)
    setNfseDialogOpen(true)
  }

  const handleNfseSuccess = async () => {
    if (nfseOrcamento) {
      try {
        // Verificar se precisa emitir NF-e
        const parcelamentoMaterial = safeNumber(nfseOrcamento.parcelamento_material)
        const subtotalMaterial = calcularSubtotalMaterialOrcamento(nfseOrcamento)
        const precisaNfe = parcelamentoMaterial !== 0 && subtotalMaterial > 0
        
        // Verificar se NF-e já foi emitida
        const nfeRes = await fetch("/api/nfe").catch(() => null)
        let nfeJaEmitida = false
        if (nfeRes?.ok) {
          const nfeData = await nfeRes.json()
          if (nfeData.success && nfeData.data) {
            nfeJaEmitida = nfeData.data.some(
              (nf: any) => 
                nf.origem === "orcamento" && 
                String(nf.origem_numero) === String(nfseOrcamento.numero) && 
                (nf.status === "autorizada" || nf.status === "processando")
            )
          }
        }
        
        // Se não precisa de NF-e OU já tem NF-e emitida, marcar como concluído
        if (!precisaNfe || nfeJaEmitida) {
          await fetch(`/api/orcamentos/${nfseOrcamento.numero}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ situacao: "concluido" }),
          })
          toast({
            title: "Sucesso",
            description: "NFS-e emitida e orçamento concluído!",
          })
        } else {
          await fetch(`/api/orcamentos/${nfseOrcamento.numero}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ situacao: "nota fiscal emitida" }),
          })
          toast({
            title: "Sucesso",
            description: "NFS-e emitida. Ainda falta emitir NF-e de material.",
          })
        }
      } catch (error) {
        console.error("Erro ao atualizar situação:", error)
      }
      setNfseOrcamento(null)
      fetchOrcamentos()
    }
  }

  // Calcular Subtotal Material para um orçamento (valor da NF-e)
  const calcularSubtotalMaterialOrcamento = (orc: Orcamento): number => {
    const parcelamentoMaterial = safeNumber(orc.parcelamento_material) || 1
    if (parcelamentoMaterial === 0) return 0

    const valorMaterial = safeNumber(orc.valor_material)
    const parcelamentoMdo = safeNumber(orc.parcelamento_mdo) || 1
    const distancia = safeNumber(orc.distancia_km)
    const prazo = safeNumber(orc.prazo_dias)
    const valorBoleto = safeNumber(orc.valor_boleto)
    const impostoMaterialPerc = safeNumber(orc.imposto_material)
    const jurosAm = safeNumber(orc.juros_am)

    const valorJuros = ((parcelamentoMdo + parcelamentoMaterial - 1) * jurosAm * valorMaterial) / 100
    const taxaBoletoMaterial = parcelamentoMaterial * valorBoleto
    const baseImposto = valorMaterial + valorJuros + taxaBoletoMaterial
    const impostoMaterialValor = (baseImposto * impostoMaterialPerc) / 100
    const custoDeslocamentoExtra = parcelamentoMdo === 0 ? (distancia * 2 * safeNumber(valorPorKm) * prazo) : 0

    return valorMaterial + valorJuros + taxaBoletoMaterial + impostoMaterialValor + custoDeslocamentoExtra
  }

  const handleEmitirNfe = async (orcamento: Orcamento) => {
    // Buscar itens do orçamento para popular o dialog de NF-e
    try {
      const response = await fetch(`/api/orcamentos/${orcamento.numero}`)
      const result = await response.json()

      if (result.success && result.data.itens) {
        const valorMaterialBruto = result.data.itens.reduce(
          (acc: number, item: any) => acc + safeNumber(item.quantidade) * safeNumber(item.valor_unitario),
          0
        )
        const subtotalMaterial = calcularSubtotalMaterialOrcamento(orcamento)
        const fatorAjuste = valorMaterialBruto > 0 ? subtotalMaterial / valorMaterialBruto : 1

        const itensFormatados = result.data.itens
          .filter((item: any) => safeNumber(item.valor_unitario) > 0)
          .map((item: any) => {
            const valorUnitarioAjustado = safeNumber(item.valor_unitario) * fatorAjuste
            return {
              produto_id: Number(item.produto_id),
              codigo_produto: item.produto_codigo || "",
              descricao: item.produto_descricao || "",
              ncm: item.produto_ncm || "00000000",
              unidade: item.produto_unidade || "UN",
              quantidade: safeNumber(item.quantidade),
              valor_unitario: valorUnitarioAjustado,
              valor_total: safeNumber(item.quantidade) * valorUnitarioAjustado,
            }
          })

        setNfeItens(itensFormatados)
        setNfeOrcamento(orcamento)
        setNfeDialogOpen(true)
      }
    } catch (error) {
      console.error("Erro ao buscar itens do orçamento:", error)
      toast({
        title: "Erro",
        description: "Erro ao buscar dados do orçamento para NF-e",
        variant: "destructive",
      })
    }
  }

  const handleNfeSuccess = async () => {
    if (nfeOrcamento) {
      try {
        // Verificar se precisa emitir NFS-e
        const parcelamentoMdo = safeNumber(nfeOrcamento.parcelamento_mdo)
        const subtotalMdo = calcularSubtotalMdoOrcamento(nfeOrcamento)
        const precisaNfse = parcelamentoMdo !== 0 && subtotalMdo > 0
        
        // Verificar se NFS-e já foi emitida
        const nfseRes = await fetch("/api/nfse").catch(() => null)
        let nfseJaEmitida = false
        if (nfseRes?.ok) {
          const nfseData = await nfseRes.json()
          if (nfseData.success && nfseData.data) {
            nfseJaEmitida = nfseData.data.some(
              (nf: any) => 
                nf.origem === "orcamento" && 
                String(nf.origem_numero) === String(nfeOrcamento.numero) && 
                (nf.status === "emitida" || nf.status === "processando")
            )
          }
        }
        
        // Se não precisa de NFS-e OU já tem NFS-e emitida, marcar como concluído
        if (!precisaNfse || nfseJaEmitida) {
          await fetch(`/api/orcamentos/${nfeOrcamento.numero}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ situacao: "concluido" }),
          })
          toast({
            title: "Sucesso",
            description: "NF-e emitida e orçamento concluído!",
          })
        } else {
          await fetch(`/api/orcamentos/${nfeOrcamento.numero}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ situacao: "nota fiscal emitida" }),
          })
          toast({
            title: "Sucesso",
            description: "NF-e de material emitida. Ainda falta emitir NFS-e de serviço.",
          })
        }
      } catch (error) {
        console.error("Erro ao atualizar situação:", error)
      }
      setNfeOrcamento(null)
      setNfeItens([])
      fetchOrcamentos()
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pendente: {
        label: "Pendente",
        className: "bg-yellow-500/10 text-yellow-500 border-0",
        icon: Calendar,
      },
      aprovado: {
        label: "Aprovado",
        className: "bg-emerald-500/10 text-emerald-500 border-0",
        icon: CheckCircle,
      },
      "enviado por email": {
        label: "Enviado",
        className: "bg-blue-500/10 text-blue-500 border-0",
        icon: Send,
      },
      "nota fiscal emitida": {
        label: "NF Emitida",
        className: "bg-purple-500/10 text-purple-500 border-0",
        icon: FileCheck,
      },
      concluido: {
        label: "Concluído",
        className: "bg-emerald-500/10 text-emerald-500 border-0",
        icon: CheckCircle,
      },
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pendente
    const IconComponent = config.icon

    return (
      <Badge className={`${config.className} whitespace-nowrap text-xs gap-1 py-1`}>
        <IconComponent className="h-3 w-3" />
        {config.label}
      </Badge>
    )
  }

  const calcularEstatisticas = () => {
    const total = orcamentos.length
    const pendentes = orcamentos.filter((o) => o.situacao === "pendente").length
    const aprovados = orcamentos.filter((o) => o.situacao === "aprovado").length
    const enviados = orcamentos.filter((o) => o.situacao === "enviado por email").length
    const notaFiscal = orcamentos.filter((o) => o.situacao === "nota fiscal emitida").length
    const concluidos = orcamentos.filter((o) => o.situacao === "concluido").length
    const valorTotal = orcamentos.reduce((acc, o) => acc + Number(o.valor_total), 0)

    return { total, pendentes, aprovados, enviados, notaFiscal, concluidos, valorTotal }
  }

  const getTipoServicoLabel = (tipo: string) => {
    const tipos: Record<string, string> = {
      manutencao: "Manutenção",
      orcamento: "Orçamento",
      vistoria_contrato: "Vistoria Contrato",
      preventiva: "Preventiva",
      instalacao: "Instalação",
      outros: "Outros",
    }
    return tipos[tipo] || tipo
  }

  const filteredOrcamentos = orcamentos.filter((orcamento) => {
    const matchesSearch =
      orcamento.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
      orcamento.cliente_nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (orcamento.cliente_codigo && orcamento.cliente_codigo.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesSituacao =
      situacaoFilter === "todos" ||
      (situacaoFilter === "pendente" && orcamento.situacao === "pendente") ||
      (situacaoFilter === "aprovado" && orcamento.situacao === "aprovado") ||
      (situacaoFilter === "enviado" && orcamento.situacao === "enviado por email") ||
      (situacaoFilter === "nf-emitida" && orcamento.situacao === "nota fiscal emitida") ||
      (situacaoFilter === "concluido" && orcamento.situacao === "concluido")

    return matchesSearch && matchesSituacao
  })

  const { total, pendentes, aprovados, enviados, notaFiscal, concluidos, valorTotal } = calcularEstatisticas()
  const hasActiveFilter = searchTerm.trim() !== "" || situacaoFilter !== "todos"

  if (loading) {
    return (
      <div className="p-6 space-y-6 max-w-[1600px] mx-auto w-full">
        <div className="flex items-center gap-4 mb-6">
          <div className="h-10 w-10 bg-muted animate-pulse rounded-lg" />
          <div className="space-y-2">
            <div className="h-8 w-48 bg-muted animate-pulse rounded" />
            <div className="h-4 w-64 bg-muted animate-pulse rounded" />
          </div>
        </div>
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="border border-border bg-card animate-pulse">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 w-24 bg-muted rounded" />
                <div className="h-4 w-4 bg-muted rounded" />
              </CardHeader>
              <CardContent>
                <div className="h-8 w-16 bg-muted rounded" />
                <div className="h-3 w-32 bg-muted mt-2 rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto w-full text-foreground bg-background">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
        <div className="flex items-center gap-4">
          {logoMenu && (
            <img
              src={logoMenu || "/placeholder.svg"}
              alt="Logo"
              className="h-10 w-10 object-contain rounded-lg border border-border bg-card p-1"
            />
          )}
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-foreground">
              Orçamentos
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5 font-medium">
              Gerencie e acompanhe todos os orçamentos e faturamentos do sistema
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={toggleOcultarValores}
            variant="outline"
            className="border-border text-foreground hover:bg-muted/40 h-9 text-xs font-semibold hidden md:inline-flex"
          >
            {shouldHideValues ? <Eye className="h-4 w-4 mr-2" /> : <EyeOff className="h-4 w-4 mr-2" />}
            {shouldHideValues ? "Mostrar Valores" : "Ocultar Valores"}
          </Button>
          <Button
            onClick={() => setIsNovoOrcamentoOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm h-9 px-4 text-xs lg:text-sm font-medium transition-all"
          >
            <Plus className="mr-2 h-4 w-4" />
            Novo Orçamento
          </Button>
        </div>
      </div>

      {/* Stats Cards - Clicáveis */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <Card
          className={`border border-border shadow-xs hover:border-muted-foreground/30 transition-all duration-200 bg-card cursor-pointer select-none ${
            situacaoFilter === "todos" ? "ring-2 ring-indigo-500 ring-offset-2 ring-offset-background" : ""
          }`}
          onClick={() => setSituacaoFilter("todos")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2">
            <CardTitle className="text-xs lg:text-sm font-semibold text-muted-foreground">Total</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground/70" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-xl lg:text-2xl font-bold text-foreground">{total}</div>
            <p className="text-[10px] lg:text-xs text-muted-foreground mt-0.5">orçamentos</p>
          </CardContent>
        </Card>

        <Card
          className={`border border-border shadow-xs hover:border-muted-foreground/30 transition-all duration-200 bg-card cursor-pointer select-none ${
            situacaoFilter === "pendente" ? "ring-2 ring-indigo-500 ring-offset-2 ring-offset-background" : ""
          }`}
          onClick={() => setSituacaoFilter("pendente")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2">
            <CardTitle className="text-xs lg:text-sm font-semibold text-muted-foreground">Pendentes</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground/70" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-xl lg:text-2xl font-bold text-foreground">{pendentes}</div>
            <p className="text-[10px] lg:text-xs text-muted-foreground mt-0.5">aguardando</p>
          </CardContent>
        </Card>

        <Card
          className={`border border-border shadow-xs hover:border-muted-foreground/30 transition-all duration-200 bg-card cursor-pointer select-none ${
            situacaoFilter === "aprovado" ? "ring-2 ring-indigo-500 ring-offset-2 ring-offset-background" : ""
          }`}
          onClick={() => setSituacaoFilter("aprovado")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2">
            <CardTitle className="text-xs lg:text-sm font-semibold text-muted-foreground">Aprovados</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground/70" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-xl lg:text-2xl font-bold text-foreground">{aprovados}</div>
            <p className="text-[10px] lg:text-xs text-muted-foreground mt-0.5">aprovados</p>
          </CardContent>
        </Card>

        <Card
          className={`border border-border shadow-xs hover:border-muted-foreground/30 transition-all duration-200 bg-card cursor-pointer select-none ${
            situacaoFilter === "enviado" ? "ring-2 ring-indigo-500 ring-offset-2 ring-offset-background" : ""
          }`}
          onClick={() => setSituacaoFilter("enviado")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2">
            <CardTitle className="text-xs lg:text-sm font-semibold text-muted-foreground">Enviados</CardTitle>
            <Send className="h-4 w-4 text-muted-foreground/70" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-xl lg:text-2xl font-bold text-foreground">{enviados}</div>
            <p className="text-[10px] lg:text-xs text-muted-foreground mt-0.5">por email</p>
          </CardContent>
        </Card>

        <Card
          className={`border border-border shadow-xs hover:border-muted-foreground/30 transition-all duration-200 bg-card cursor-pointer select-none ${
            situacaoFilter === "nf-emitida" ? "ring-2 ring-indigo-500 ring-offset-2 ring-offset-background" : ""
          }`}
          onClick={() => setSituacaoFilter("nf-emitida")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2">
            <CardTitle className="text-xs lg:text-sm font-semibold text-muted-foreground">NF Emitida</CardTitle>
            <FileCheck className="h-4 w-4 text-muted-foreground/70" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-xl lg:text-2xl font-bold text-foreground">{notaFiscal}</div>
            <p className="text-[10px] lg:text-xs text-muted-foreground mt-0.5">faturados</p>
          </CardContent>
        </Card>

        <Card
          className={`border border-border shadow-xs hover:border-muted-foreground/30 transition-all duration-200 bg-card cursor-pointer select-none ${
            situacaoFilter === "concluido" ? "ring-2 ring-indigo-500 ring-offset-2 ring-offset-background" : ""
          }`}
          onClick={() => setSituacaoFilter("concluido")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2">
            <CardTitle className="text-xs lg:text-sm font-semibold text-muted-foreground">Concluídos</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground/70" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-xl lg:text-2xl font-bold text-foreground">{concluidos}</div>
            <p className="text-[10px] lg:text-xs text-muted-foreground mt-0.5">finalizados</p>
          </CardContent>
        </Card>

        <Card className="border border-border bg-card col-span-2 md:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2">
            <CardTitle className="text-xs lg:text-sm font-semibold text-muted-foreground">Soma Total</CardTitle>
            <DollarSign className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-xl lg:text-2xl font-bold text-foreground truncate">
              {shouldHideValues ? "R$ •••" : formatCurrency(valorTotal)}
            </div>
            <p className="text-[10px] lg:text-xs text-muted-foreground mt-0.5">valor bruto</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de orçamentos */}
      <Card className="border border-border bg-card">
        <CardHeader className="border-b border-border/60 p-4 lg:p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-foreground text-lg">Lista de Orçamentos</CardTitle>
              <CardDescription className="text-muted-foreground text-xs mt-1">
                Acompanhe e emita notas fiscais (NF-e/NFS-e) para orçamentos aprovados.
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar orçamento..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 h-9 text-xs border-border bg-background text-foreground"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select value={situacaoFilter} onValueChange={setSituacaoFilter}>
                  <SelectTrigger className="w-full sm:w-44 h-9 text-xs border-border bg-background">
                    <SelectValue placeholder="Situação" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todas situações</SelectItem>
                    <SelectItem value="pendente">Pendentes</SelectItem>
                    <SelectItem value="aprovado">Aprovados</SelectItem>
                    <SelectItem value="enviado">Enviados</SelectItem>
                    <SelectItem value="nf-emitida">NF Emitida</SelectItem>
                    <SelectItem value="concluido">Concluídos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filteredOrcamentos.length === 0 ? (
            <div className="text-center py-12 px-4">
              <FileText className="mx-auto h-16 w-16 text-muted-foreground mb-4 opacity-50" />
              <h3 className="text-lg font-medium text-foreground mb-2">Nenhum orçamento encontrado</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {searchTerm || situacaoFilter !== "todos"
                  ? "Tente ajustar os filtros de busca"
                  : "Comece criando seu primeiro orçamento"}
              </p>
              {!searchTerm && situacaoFilter === "todos" && (
                <Link href="/orcamentos/novo">
                  <Button className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm h-9">
                    <Plus className="mr-2 h-4 w-4" />
                    Criar Primeiro Orçamento
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <>
              {/* Desktop — tabela redimensionável */}
              <div className="hidden md:block">
                <ResizableTable
                  storageKey="orcamentos"
                  columns={[
                    { key: "numero", label: "Número", width: 110, sortable: true },
                    { key: "cliente_nome", label: "Cliente", width: 220, sortable: true },
                    { key: "tipo_servico", label: "Tipo de Serviço", width: 150, sortable: true },
                    { key: "data_orcamento", label: "Data", width: 110, sortable: true },
                    { key: "valor_total", label: "Valor Total", width: 130, sortable: true },
                    { key: "situacao", label: "Status", width: 130, sortable: true },
                    { key: "acoes", label: "Ações", width: 160, sortable: false, noResize: true },
                  ]}
                  data={filteredOrcamentos}
                  rowKey={(row) => row.id}
                  renderCell={(orcamento, col) => {
                    switch (col) {
                      case "numero":
                        return <Badge variant="outline" className="font-mono text-xs text-foreground bg-muted/40 border-border">{orcamento.numero}</Badge>
                      case "cliente_nome":
                        return (
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <div className="min-w-0">
                              <span className="font-medium block truncate text-foreground">{orcamento.cliente_nome}</span>
                              {orcamento.cliente_codigo && <div className="text-[10px] text-muted-foreground">{orcamento.cliente_codigo}</div>}
                            </div>
                          </div>
                        )
                      case "tipo_servico":
                        return (
                          <div className="flex items-center gap-1.5">
                            <Wrench className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                            <span className="text-sm truncate text-foreground">{getTipoServicoLabel(orcamento.tipo_servico)}</span>
                          </div>
                        )
                      case "data_orcamento":
                        return (
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
                            <span className="text-sm text-foreground">{formatDate(orcamento.data_orcamento)}</span>
                          </div>
                        )
                      case "valor_total":
                        return (
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                            <span className="font-semibold text-emerald-600 dark:text-emerald-400 text-sm">
                              {shouldHideValues ? "R$ •••" : formatCurrency(Number(orcamento.valor_total))}
                            </span>
                          </div>
                        )
                      case "situacao":
                        return getStatusBadge(orcamento.situacao)
                      case "acoes": {
                        const notaInfo = notasEmitidas[orcamento.numero]
                        const nfseJaEmitida = notaInfo?.temNfse || false
                        const nfeJaEmitida = notaInfo?.temNfe || false
                        const parcelamentoMdo = safeNumber(orcamento.parcelamento_mdo)
                        const subtotalMdo = calcularSubtotalMdoOrcamento(orcamento)
                        const precisaNfse = parcelamentoMdo !== 0 && subtotalMdo > 0
                        const parcelamentoMaterial = safeNumber(orcamento.parcelamento_material)
                        const subtotalMaterial = calcularSubtotalMaterialOrcamento(orcamento)
                        const precisaNfe = parcelamentoMaterial !== 0 && subtotalMaterial > 0
                        const mostraNfBtns = orcamento.situacao === "aprovado" || orcamento.situacao === "nota fiscal emitida"
                        
                        const handleVisualizarClick = () => {
                          setSelectedOrcamentoNumeroVisualizar(orcamento.numero)
                          setIsVisualizarOrcamentoOpen(true)
                        }
                        
                        const handleEditarClick = () => {
                          setSelectedOrcamentoNumeroEditar(orcamento.numero)
                          setIsEditarOrcamentoOpen(true)
                        }

                        return (
                          <div className="flex items-center gap-1">
                            {/* Desktop View: Show buttons directly on large screens */}
                            <div className="hidden xl:flex gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={handleVisualizarClick}
                                className="text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/10 border-indigo-200 dark:border-indigo-900/50 bg-transparent h-8 w-8 p-0"
                                title="Visualizar"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={handleEditarClick}
                                className="text-green-600 dark:text-green-400 hover:bg-green-500/10 border-green-200 dark:border-green-900/50 bg-transparent h-8 w-8 p-0"
                                title="Editar"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              {mostraNfBtns && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={!precisaNfse || nfseJaEmitida}
                                  onClick={() => !(!precisaNfse || nfseJaEmitida) && handleEmitirNfse(orcamento)}
                                  className={`h-8 w-8 p-0 ${
                                    !precisaNfse || nfseJaEmitida
                                      ? "text-muted-foreground border-border bg-muted/20 opacity-50 cursor-not-allowed"
                                      : "text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 border-emerald-200 dark:border-emerald-900/50 bg-transparent"
                                  }`}
                                  title={!precisaNfse ? "Sem cobrança" : nfseJaEmitida ? "Já emitida" : "NFS-e"}
                                >
                                  <FileCheck className="h-4 w-4" />
                                </Button>
                              )}
                              {mostraNfBtns && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={!precisaNfe || nfeJaEmitida}
                                  onClick={() => !(!precisaNfe || nfeJaEmitida) && handleEmitirNfe(orcamento)}
                                  className={`h-8 w-8 p-0 ${
                                    !precisaNfe || nfeJaEmitida
                                      ? "text-muted-foreground border-border bg-muted/20 opacity-50 cursor-not-allowed"
                                      : "text-blue-600 dark:text-blue-400 hover:bg-blue-500/10 border-blue-200 dark:border-blue-900/50 bg-transparent"
                                  }`}
                                  title={!precisaNfe ? "Sem material" : nfeJaEmitida ? "Já emitida" : "NF-e"}
                                >
                                  <Package className="h-4 w-4" />
                                </Button>
                              )}
                              <OrcamentoDeleteDialog orcamento={orcamento} onSuccess={fetchOrcamentos} />
                            </div>
                            
                            {/* Mobile/Tablet View: Show dropdown menu on smaller screens */}
                            <div className="xl:hidden">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={handleVisualizarClick}>
                                    <Eye className="h-4 w-4 mr-2" />Visualizar
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={handleEditarClick}>
                                    <Edit className="h-4 w-4 mr-2" />Editar
                                  </DropdownMenuItem>
                                  {mostraNfBtns && precisaNfse && !nfseJaEmitida && (
                                    <DropdownMenuItem onClick={() => handleEmitirNfse(orcamento)}>
                                      <FileCheck className="h-4 w-4 mr-2" />Emitir NFS-e
                                    </DropdownMenuItem>
                                  )}
                                  {mostraNfBtns && precisaNfe && !nfeJaEmitida && (
                                    <DropdownMenuItem onClick={() => handleEmitirNfe(orcamento)}>
                                      <Package className="h-4 w-4 mr-2" />Emitir NF-e
                                    </DropdownMenuItem>
                                  )}
                                  <OrcamentoDeleteDialog
                                    orcamento={orcamento}
                                    onSuccess={fetchOrcamentos}
                                    trigger={
                                      <DropdownMenuItem className="text-red-600 focus:text-red-600" onSelect={(e) => e.preventDefault()}>
                                        <Trash2 className="h-4 w-4 mr-2" />Excluir
                                      </DropdownMenuItem>
                                    }
                                  />
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        )
                      }
                      default:
                        return null
                    }
                  }}
                />
              </div>

              {/* Mobile — cards compactos */}
              <div className="md:hidden p-4 space-y-4">
                {filteredOrcamentos.map((orcamento) => {
                  const isExpanded = expandedOrcamentoId === orcamento.id

                  return (
                    <div
                      key={orcamento.id}
                      className={`rounded-xl border transition-all duration-200 overflow-hidden border-border bg-card ${
                        isExpanded ? "shadow-lg ring-1 ring-indigo-500" : "shadow-xs hover:shadow-sm"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => setExpandedOrcamentoId(isExpanded ? null : orcamento.id)}
                        className="w-full text-left p-4 flex items-center gap-3"
                      >
                        {/* Ícone */}
                        <div className="flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center bg-indigo-500/10 text-indigo-500">
                          <FileText className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="font-semibold text-sm text-foreground truncate block">Orç. {orcamento.numero}</span>
                          <span className="text-[11px] text-muted-foreground break-words whitespace-normal leading-tight mt-1 block">{orcamento.cliente_nome}</span>
                        </div>
                        <div className="text-right flex-shrink-0 mr-1">
                          {getStatusBadge(orcamento.situacao)}
                        </div>
                        <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform duration-200 flex-shrink-0 ${
                          isExpanded ? "rotate-90" : ""
                        }`} />
                      </button>

                      {isExpanded && (
                        <div className="px-4 pb-4 pt-0 animate-in slide-in-from-top-2 duration-200">
                          <div className="border-t border-border pt-3 space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                              <div className="bg-muted/40 rounded-lg p-2.5 col-span-2 border border-border/40">
                                <div className="flex items-center gap-1.5 mb-1">
                                  <User className="h-3 w-3 text-muted-foreground" />
                                  <span className="text-[10px] font-medium text-muted-foreground uppercase">Cliente</span>
                                </div>
                                <p className="text-xs font-semibold text-foreground truncate">{orcamento.cliente_nome}</p>
                              </div>
                              <div className="bg-muted/40 rounded-lg p-2.5 border border-border/40">
                                <div className="flex items-center gap-1.5 mb-1">
                                  <Wrench className="h-3 w-3 text-muted-foreground" />
                                  <span className="text-[10px] font-medium text-muted-foreground uppercase">Serviço</span>
                                </div>
                                <p className="text-xs text-foreground truncate">{getTipoServicoLabel(orcamento.tipo_servico)}</p>
                              </div>
                              <div className="bg-muted/40 rounded-lg p-2.5 border border-border/40">
                                <div className="flex items-center gap-1.5 mb-1">
                                  <Calendar className="h-3 w-3 text-muted-foreground" />
                                  <span className="text-[10px] font-medium text-muted-foreground uppercase">Data</span>
                                </div>
                                <p className="text-xs text-foreground">{formatDate(orcamento.data_orcamento)}</p>
                              </div>
                              <div className="bg-emerald-500/10 rounded-lg p-2.5 col-span-2 border border-emerald-500/10">
                                <div className="flex items-center gap-1.5 mb-1">
                                  <DollarSign className="h-3 w-3 text-emerald-500" />
                                  <span className="text-[10px] font-medium text-emerald-500 uppercase">Valor Total</span>
                                </div>
                                <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                                  {shouldHideValues ? "R$ •••" : formatCurrency(Number(orcamento.valor_total))}
                                </p>
                              </div>
                            </div>

                            {/* Ações */}
                            {(() => {
                              const mostraNfBtns = orcamento.situacao === "aprovado" || orcamento.situacao === "nota fiscal emitida"
                              const notaInfo = notasEmitidas[orcamento.numero]
                              const nfseJaEmitida = notaInfo?.temNfse || false
                              const nfeJaEmitida = notaInfo?.temNfe || false
                              
                              // Lógica para NFS-e
                              const parcelamentoMdo = safeNumber(orcamento.parcelamento_mdo)
                              const subtotalMdo = calcularSubtotalMdoOrcamento(orcamento)
                              const precisaNfse = parcelamentoMdo !== 0 && subtotalMdo > 0
                              const nfseDesabilitado = !precisaNfse || nfseJaEmitida
                              
                              // Lógica para NF-e
                              const parcelamentoMaterial = safeNumber(orcamento.parcelamento_material)
                              const subtotalMaterial = calcularSubtotalMaterialOrcamento(orcamento)
                              const precisaNfe = parcelamentoMaterial !== 0 && subtotalMaterial > 0
                              const nfeDesabilitado = !precisaNfe || nfeJaEmitida

                              return (
                                <div className="flex flex-wrap gap-2 pt-1">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedOrcamentoNumeroVisualizar(orcamento.numero)
                                      setIsVisualizarOrcamentoOpen(true)
                                    }}
                                    className="flex-1 h-9 text-xs font-medium text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900/50 bg-transparent hover:bg-indigo-500/10"
                                  >
                                    <Eye className="h-3.5 w-3.5 mr-1.5" />
                                    Visualizar
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedOrcamentoNumeroEditar(orcamento.numero)
                                      setIsEditarOrcamentoOpen(true)
                                    }}
                                    className="flex-1 h-9 text-xs font-medium text-green-600 dark:text-green-400 border-green-200 dark:border-green-900/50 bg-transparent hover:bg-green-500/10"
                                  >
                                    <Edit className="h-3.5 w-3.5 mr-1.5" />
                                    Editar
                                  </Button>
                                  {mostraNfBtns && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      disabled={nfseDesabilitado}
                                      className={`h-9 text-xs font-medium border px-3 flex-1 ${
                                        nfseDesabilitado
                                          ? "bg-muted border-border text-muted-foreground cursor-not-allowed opacity-50"
                                          : "bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/20 text-emerald-500"
                                      }`}
                                      onClick={() => !nfseDesabilitado && handleEmitirNfse(orcamento)}
                                      title={!precisaNfse ? "Sem cobrança de serviço" : nfseJaEmitida ? "NFS-e já emitida" : "NFS-e"}
                                    >
                                      <FileCheck className="h-4 w-4" />
                                    </Button>
                                  )}
                                  {mostraNfBtns && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      disabled={nfeDesabilitado}
                                      className={`h-9 text-xs font-medium border px-3 flex-1 ${
                                        nfeDesabilitado
                                          ? "bg-muted border-border text-muted-foreground cursor-not-allowed opacity-50"
                                          : "bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/20 text-blue-500"
                                      }`}
                                      onClick={() => !nfeDesabilitado && handleEmitirNfe(orcamento)}
                                      title={!precisaNfe ? "Sem cobrança de material" : nfeJaEmitida ? "NF-e já emitida" : "NF-e"}
                                    >
                                      <Package className="h-4 w-4" />
                                    </Button>
                                  )}
                                  <OrcamentoDeleteDialog
                                    orcamento={orcamento}
                                    onSuccess={fetchOrcamentos}
                                    trigger={
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-9 text-xs bg-red-500/10 hover:bg-red-500/20 border-red-500/20 text-red-500 font-medium px-3"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    }
                                  />
                                </div>
                              )
                            })()}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {nfseOrcamento && (
        <EmitirNfseDialog
          open={nfseDialogOpen}
          onOpenChange={(open) => {
            setNfseDialogOpen(open)
            if (!open) setNfseOrcamento(null)
          }}
          onSuccess={handleNfseSuccess}
          dadosOrigem={{
            origem: "orcamento",
            origem_numero: nfseOrcamento.numero,
            cliente_id: Number(nfseOrcamento.cliente_id),
            cliente_nome: nfseOrcamento.cliente_nome,
            cliente_cnpj: nfseOrcamento.cliente_cnpj,
            cliente_cpf: nfseOrcamento.cliente_cpf,
            cliente_email: nfseOrcamento.cliente_email,
            cliente_telefone: nfseOrcamento.cliente_telefone,
            cliente_endereco: nfseOrcamento.cliente_endereco,
            cliente_bairro: nfseOrcamento.cliente_bairro,
            cliente_cidade: nfseOrcamento.cliente_cidade,
            cliente_uf: nfseOrcamento.cliente_estado,
            cliente_cep: nfseOrcamento.cliente_cep,
            descricao: nfseOrcamento.detalhes_servico || "",
            valor: calcularSubtotalMdoOrcamento(nfseOrcamento),
            valor_material: safeNumber(nfseOrcamento.valor_material),
            valor_total_orcamento: safeNumber(nfseOrcamento.valor_total),
          }}
        />
      )}

      {nfeOrcamento && (
        <EmitirNfeDialog
          open={nfeDialogOpen}
          onOpenChange={(open) => {
            setNfeDialogOpen(open)
            if (!open) {
              setNfeOrcamento(null)
              setNfeItens([])
            }
          }}
          onSuccess={handleNfeSuccess}
          dadosOrigem={{
            origem: "orcamento",
            origem_numero: nfeOrcamento.numero,
            cliente_id: Number(nfeOrcamento.cliente_id),
            cliente_nome: nfeOrcamento.cliente_nome,
            cliente_cnpj: nfeOrcamento.cliente_cnpj,
            cliente_cpf: nfeOrcamento.cliente_cpf,
            cliente_email: nfeOrcamento.cliente_email,
            cliente_telefone: nfeOrcamento.cliente_telefone,
            cliente_endereco: nfeOrcamento.cliente_endereco,
            cliente_numero: "",
            cliente_complemento: "",
            cliente_bairro: nfeOrcamento.cliente_bairro,
            cliente_cidade: nfeOrcamento.cliente_cidade,
            cliente_uf: nfeOrcamento.cliente_estado,
            cliente_cep: nfeOrcamento.cliente_cep,
            itens: nfeItens,
            valor_material: calcularSubtotalMaterialOrcamento(nfeOrcamento),
          }}
        />
      )}

      <NovoOrcamentoDialog
        open={isNovoOrcamentoOpen}
        onOpenChange={setIsNovoOrcamentoOpen}
        onSuccess={fetchOrcamentos}
      />

      <VisualizarOrcamentoDialog
        numero={selectedOrcamentoNumeroVisualizar}
        open={isVisualizarOrcamentoOpen}
        onOpenChange={(open) => {
          setIsVisualizarOrcamentoOpen(open)
          if (!open) setSelectedOrcamentoNumeroVisualizar(null)
        }}
        onEditClick={(numero) => {
          setSelectedOrcamentoNumeroEditar(numero)
          setIsEditarOrcamentoOpen(true)
        }}
        onSuccess={fetchOrcamentos}
      />

      <EditarOrcamentoDialog
        numero={selectedOrcamentoNumeroEditar}
        open={isEditarOrcamentoOpen}
        onOpenChange={(open) => {
          setIsEditarOrcamentoOpen(open)
          if (!open) setSelectedOrcamentoNumeroEditar(null)
        }}
        onSuccess={fetchOrcamentos}
      />
    </div>
  )
}
