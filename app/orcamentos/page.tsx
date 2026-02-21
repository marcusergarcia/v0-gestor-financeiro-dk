"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Plus,
  Eye,
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
} from "lucide-react"
import Link from "next/link"
import { formatCurrency, formatDate } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { EmitirNfseDialog } from "@/components/nfse/emitir-nfse-dialog"
import { EmitirNfeDialog } from "@/components/nfe/emitir-nfe-dialog"

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

export default function OrcamentosPage() {
  const [orcamentos, setOrcamentos] = useState<Orcamento[]>([])
  const [loading, setLoading] = useState(true)
  const [logoMenu, setLogoMenu] = useState<string>("")
  const [searchTerm, setSearchTerm] = useState("")
  const [situacaoFilter, setSituacaoFilter] = useState("todos")
  const [nfseDialogOpen, setNfseDialogOpen] = useState(false)
  const [nfseOrcamento, setNfseOrcamento] = useState<Orcamento | null>(null)
  const [nfeDialogOpen, setNfeDialogOpen] = useState(false)
  const [nfeOrcamento, setNfeOrcamento] = useState<Orcamento | null>(null)
  const [nfeItens, setNfeItens] = useState<any[]>([])
  const [valorPorKm, setValorPorKm] = useState(1.5)
  // Mapa de orcamento numero -> { temNfse, temNfe } para controlar icones
  const [notasEmitidas, setNotasEmitidas] = useState<Record<string, { temNfse: boolean; temNfe: boolean }>>({})
  const { toast } = useToast()

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
            aprovado: 2,
            "enviado por email": 3,
            "nota fiscal emitida": 4,
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
        // O backend (verificarEConcluirOrcamento) ja cuida de marcar como "concluido"
        // quando ambas as notas existem. Aqui so marcamos como "nota fiscal emitida"
        // se o orcamento ainda nao estiver concluido.
        const checkRes = await fetch(`/api/orcamentos/${nfseOrcamento.numero}`)
        const checkData = await checkRes.json()
        const situacaoAtual = checkData?.data?.situacao

        if (situacaoAtual !== "concluido") {
          await fetch(`/api/orcamentos/${nfseOrcamento.numero}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ situacao: "nota fiscal emitida" }),
          })
        }
        toast({
          title: "Sucesso",
          description: "NFS-e emitida com sucesso!",
        })
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
        // O backend (verificarEConcluirOrcamento) ja cuida de marcar como "concluido"
        // quando ambas as notas existem. Aqui so marcamos como "nota fiscal emitida"
        // se o orcamento ainda nao estiver concluido.
        const checkRes = await fetch(`/api/orcamentos/${nfeOrcamento.numero}`)
        const checkData = await checkRes.json()
        const situacaoAtual = checkData?.data?.situacao

        if (situacaoAtual !== "concluido") {
          await fetch(`/api/orcamentos/${nfeOrcamento.numero}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ situacao: "nota fiscal emitida" }),
          })
        }
      } catch (error) {
        console.error("Erro ao atualizar situação:", error)
      }
      toast({
        title: "Sucesso",
        description: "NF-e de material emitida com sucesso!",
      })
      setNfeOrcamento(null)
      setNfeItens([])
      fetchOrcamentos()
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pendente: {
        label: "Pendente",
        className: "bg-amber-100 text-amber-800 border-amber-200",
        icon: Calendar,
      },
      aprovado: {
        label: "Aprovado",
        className: "bg-emerald-100 text-emerald-800 border-emerald-200",
        icon: CheckCircle,
      },
      "enviado por email": {
        label: "Enviado",
        className: "bg-blue-100 text-blue-800 border-blue-200",
        icon: Send,
      },
      "nota fiscal emitida": {
        label: "NF Emitida",
        className: "bg-purple-100 text-purple-800 border-purple-200",
        icon: FileCheck,
      },
      concluido: {
        label: "Concluído",
        className: "bg-green-100 text-green-800 border-green-200",
        icon: CheckCircle,
      },
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pendente
    const IconComponent = config.icon

    return (
      <Badge className={`${config.className} whitespace-nowrap text-xs`}>
        <IconComponent className="h-3 w-3 mr-1" />
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

  const truncateText = (text: string, maxLength = 15) => {
    if (!text) return "-"
    return text.length > maxLength ? text.substring(0, maxLength) + "..." : text
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="container mx-auto p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Carregando orçamentos...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto p-3 lg:p-6 space-y-3 lg:space-y-6 max-w-full">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2 lg:gap-4">
            {logoMenu && (
              <img
                src={logoMenu || "/placeholder.svg"}
                alt="Logo"
                className="h-8 w-8 lg:h-12 lg:w-12 object-contain rounded-lg shadow-md bg-white p-1"
              />
            )}
            <div>
              <h1 className="text-2xl lg:text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Orçamentos
              </h1>
              <p className="text-xs lg:text-base text-gray-600 mt-1">Gerencie todos os orçamentos do sistema</p>
            </div>
          </div>
          <Link href="/orcamentos/novo">
            <Button className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white shadow-lg text-xs lg:text-sm h-8 lg:h-10">
              <Plus className="mr-1 lg:mr-2 h-3 w-3 lg:h-4 lg:w-4" />
              Novo Orçamento
            </Button>
          </Link>
        </div>

        {/* Stats Cards - Agora clicáveis */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-2 lg:gap-4">
          <Card
            className={`border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100 hover:shadow-xl transition-all duration-300 cursor-pointer hover:scale-105 ${
              situacaoFilter === "todos" ? "ring-2 ring-blue-400 ring-offset-2" : ""
            }`}
            onClick={() => setSituacaoFilter("todos")}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 lg:pb-2 p-3 lg:p-6">
              <CardTitle className="text-xs lg:text-sm font-medium text-blue-700">Total</CardTitle>
              <FileText className="h-4 w-4 lg:h-5 lg:w-5 text-blue-600" />
            </CardHeader>
            <CardContent className="p-3 pt-0 lg:p-6 lg:pt-0">
              <div className="text-xl lg:text-3xl font-bold text-blue-800">{total}</div>
              <p className="text-[10px] lg:text-xs text-blue-600 mt-1">Orçamentos</p>
            </CardContent>
          </Card>

          <Card
            className={`border-0 shadow-lg bg-gradient-to-br from-amber-50 to-amber-100 hover:shadow-xl transition-all duration-300 cursor-pointer hover:scale-105 ${
              situacaoFilter === "pendente" ? "ring-2 ring-amber-400 ring-offset-2" : ""
            }`}
            onClick={() => setSituacaoFilter("pendente")}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 lg:pb-2 p-3 lg:p-6">
              <CardTitle className="text-xs lg:text-sm font-medium text-amber-700">Pendentes</CardTitle>
              <Calendar className="h-4 w-4 lg:h-5 lg:w-5 text-amber-600" />
            </CardHeader>
            <CardContent className="p-3 pt-0 lg:p-6 lg:pt-0">
              <div className="text-xl lg:text-3xl font-bold text-amber-800">{pendentes}</div>
              <p className="text-[10px] lg:text-xs text-amber-600 mt-1">Aguardando</p>
            </CardContent>
          </Card>

          <Card
            className={`border-0 shadow-lg bg-gradient-to-br from-emerald-50 to-emerald-100 hover:shadow-xl transition-all duration-300 cursor-pointer hover:scale-105 ${
              situacaoFilter === "aprovado" ? "ring-2 ring-emerald-400 ring-offset-2" : ""
            }`}
            onClick={() => setSituacaoFilter("aprovado")}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 lg:pb-2 p-3 lg:p-6">
              <CardTitle className="text-xs lg:text-sm font-medium text-emerald-700">Aprovados</CardTitle>
              <CheckCircle className="h-4 w-4 lg:h-5 lg:w-5 text-emerald-600" />
            </CardHeader>
            <CardContent className="p-3 pt-0 lg:p-6 lg:pt-0">
              <div className="text-xl lg:text-3xl font-bold text-emerald-800">{aprovados}</div>
              <p className="text-[10px] lg:text-xs text-emerald-600 mt-1">Aprovados</p>
            </CardContent>
          </Card>

          <Card
            className={`border-0 shadow-lg bg-gradient-to-br from-cyan-50 to-cyan-100 hover:shadow-xl transition-all duration-300 cursor-pointer hover:scale-105 ${
              situacaoFilter === "enviado" ? "ring-2 ring-cyan-400 ring-offset-2" : ""
            }`}
            onClick={() => setSituacaoFilter("enviado")}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 lg:pb-2 p-3 lg:p-6">
              <CardTitle className="text-xs lg:text-sm font-medium text-cyan-700">Enviados</CardTitle>
              <Send className="h-4 w-4 lg:h-5 lg:w-5 text-cyan-600" />
            </CardHeader>
            <CardContent className="p-3 pt-0 lg:p-6 lg:pt-0">
              <div className="text-xl lg:text-3xl font-bold text-cyan-800">{enviados}</div>
              <p className="text-[10px] lg:text-xs text-cyan-600 mt-1">Por email</p>
            </CardContent>
          </Card>

          <Card
            className={`border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100 hover:shadow-xl transition-all duration-300 cursor-pointer hover:scale-105 ${
              situacaoFilter === "nf-emitida" ? "ring-2 ring-purple-400 ring-offset-2" : ""
            }`}
            onClick={() => setSituacaoFilter("nf-emitida")}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 lg:pb-2 p-3 lg:p-6">
              <CardTitle className="text-xs lg:text-sm font-medium text-purple-700">NF Emitida</CardTitle>
              <FileCheck className="h-4 w-4 lg:h-5 lg:w-5 text-purple-600" />
            </CardHeader>
            <CardContent className="p-3 pt-0 lg:p-6 lg:pt-0">
              <div className="text-xl lg:text-3xl font-bold text-purple-800">{notaFiscal}</div>
              <p className="text-[10px] lg:text-xs text-purple-600 mt-1">Nota fiscal</p>
            </CardContent>
          </Card>

          <Card
            className={`border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100 hover:shadow-xl transition-all duration-300 cursor-pointer hover:scale-105 ${
              situacaoFilter === "concluido" ? "ring-2 ring-green-400 ring-offset-2" : ""
            }`}
            onClick={() => setSituacaoFilter("concluido")}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 lg:pb-2 p-3 lg:p-6">
              <CardTitle className="text-xs lg:text-sm font-medium text-green-700">Concluídos</CardTitle>
              <CheckCircle className="h-4 w-4 lg:h-5 lg:w-5 text-green-600" />
            </CardHeader>
            <CardContent className="p-3 pt-0 lg:p-6 lg:pt-0">
              <div className="text-xl lg:text-3xl font-bold text-green-800">{concluidos}</div>
              <p className="text-[10px] lg:text-xs text-green-600 mt-1">Finalizados</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-white rounded-lg overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 lg:pb-2 p-3 lg:p-6">
              <CardTitle className="text-xs lg:text-sm font-medium text-indigo-700">Valor Total</CardTitle>
              <DollarSign className="h-4 w-4 lg:h-5 lg:w-5 text-indigo-600" />
            </CardHeader>
            <CardContent className="p-3 pt-0 lg:p-6 lg:pt-0">
              <div className="text-2xl lg:text-3xl font-bold text-indigo-800">{formatCurrency(valorTotal)}</div>
              <p className="text-xs lg:text-sm text-indigo-600 mt-1">Soma total</p>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card className="bg-gradient-to-r from-white to-gray-50">
          <CardContent className="p-3 lg:p-4">
            <div className="flex flex-col sm:flex-row gap-2 lg:gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 lg:top-3 h-3 w-3 lg:h-4 lg:w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por número, cliente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 lg:pl-10 h-8 lg:h-10 text-xs lg:text-sm"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="h-3 w-3 lg:h-4 lg:w-4 text-gray-400" />
                <Select value={situacaoFilter} onValueChange={setSituacaoFilter}>
                  <SelectTrigger className="w-full sm:w-48 h-8 lg:h-10 text-xs lg:text-sm">
                    <SelectValue placeholder="Filtrar por situação" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todas as situações</SelectItem>
                    <SelectItem value="pendente">Pendentes</SelectItem>
                    <SelectItem value="aprovado">Aprovados</SelectItem>
                    <SelectItem value="enviado">Enviados</SelectItem>
                    <SelectItem value="nf-emitida">NF Emitida</SelectItem>
                    <SelectItem value="concluido">Concluídos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabela Desktop e Cards Mobile */}
        <div className="border-0 shadow-lg bg-white rounded-lg overflow-hidden">
          <div className="bg-gradient-to-r from-purple-500 to-blue-600 text-white px-3 py-2 lg:px-6 lg:py-4">
            <h2 className="text-base lg:text-xl font-semibold">Lista de Orçamentos</h2>
            <p className="text-xs lg:text-sm text-purple-100 mt-1">
              {filteredOrcamentos.length} orçamento{filteredOrcamentos.length !== 1 ? "s" : ""} encontrado
              {filteredOrcamentos.length !== 1 ? "s" : ""}
            </p>
          </div>

          {filteredOrcamentos.length === 0 ? (
            <div className="text-center py-8 lg:py-12 px-3">
              <FileText className="mx-auto h-12 w-12 lg:h-16 lg:w-16 text-gray-400 mb-3 lg:mb-4" />
              <h3 className="text-lg lg:text-xl font-medium text-gray-900 mb-2">Nenhum orçamento encontrado</h3>
              <p className="text-sm lg:text-base text-gray-600 mb-4 lg:mb-6">
                {searchTerm || situacaoFilter !== "todos"
                  ? "Tente ajustar os filtros de busca"
                  : "Comece criando seu primeiro orçamento"}
              </p>
              {!searchTerm && situacaoFilter === "todos" && (
                <Link href="/orcamentos/novo">
                  <Button className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white text-xs lg:text-sm">
                    <Plus className="mr-1 lg:mr-2 h-3 w-3 lg:h-4 lg:w-4" />
                    Criar Primeiro Orçamento
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <>
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="font-semibold whitespace-nowrap">Número</TableHead>
                      <TableHead className="font-semibold whitespace-nowrap">Cliente</TableHead>
                      <TableHead className="font-semibold whitespace-nowrap">Tipo de Serviço</TableHead>
                      <TableHead className="font-semibold whitespace-nowrap">Data</TableHead>
                      <TableHead className="font-semibold whitespace-nowrap">Valor Total</TableHead>
                      <TableHead className="font-semibold whitespace-nowrap">Status</TableHead>
                      <TableHead className="font-semibold whitespace-nowrap">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrcamentos.map((orcamento) => (
                      <TableRow key={orcamento.id} className="hover:bg-gray-50 transition-colors">
                        <TableCell className="font-medium whitespace-nowrap">
                          <Badge variant="outline" className="font-mono text-xs">
                            {orcamento.numero}
                          </Badge>
                        </TableCell>
                        <TableCell className="min-w-[200px]">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-gray-400 flex-shrink-0" />
                            <div className="min-w-0">
                              <span className="font-medium block">{orcamento.cliente_nome}</span>
                              {orcamento.cliente_codigo && (
                                <div className="text-xs text-gray-500">{orcamento.cliente_codigo}</div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <div className="flex items-center gap-1" title={getTipoServicoLabel(orcamento.tipo_servico)}>
                            <Wrench className="h-3 w-3 text-gray-400 flex-shrink-0" />
                            <span className="text-sm">{truncateText(getTipoServicoLabel(orcamento.tipo_servico))}</span>
                          </div>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3 text-gray-400 flex-shrink-0" />
                            <span className="text-sm">{formatDate(orcamento.data_orcamento)}</span>
                          </div>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3 text-green-600 flex-shrink-0" />
                            <span className="font-semibold text-green-600 text-sm">
                              {formatCurrency(Number(orcamento.valor_total))}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">{getStatusBadge(orcamento.situacao)}</TableCell>
                        <TableCell className="whitespace-nowrap">
                          <div className="flex gap-1">
                            <Link href={`/orcamentos/${orcamento.numero}`}>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200 bg-transparent h-8 w-8 p-0"
                                title="Visualizar orçamento"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Link href={`/orcamentos/${orcamento.numero}/editar`}>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200 bg-transparent h-8 w-8 p-0"
                                title="Editar orçamento"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </Link>
                            {(orcamento.situacao === "aprovado" || orcamento.situacao === "nota fiscal emitida") && (() => {
                              const notaInfo = notasEmitidas[orcamento.numero]
                              const nfseJaEmitida = notaInfo?.temNfse || false
                              return (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleEmitirNfse(orcamento)}
                                  disabled={nfseJaEmitida}
                                  className={`h-8 w-8 p-0 ${nfseJaEmitida
                                    ? "text-gray-400 border-gray-200 bg-gray-50 cursor-not-allowed opacity-50"
                                    : "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 border-emerald-200 bg-transparent"
                                  }`}
                                  title={nfseJaEmitida ? "NFS-e ja emitida" : "Emitir NFS-e (Servico)"}
                                >
                                  <FileCheck className="h-4 w-4" />
                                </Button>
                              )
                            })()}
                            {(orcamento.situacao === "aprovado" || orcamento.situacao === "nota fiscal emitida") && safeNumber(orcamento.valor_material) > 0 && (() => {
                              const notaInfo = notasEmitidas[orcamento.numero]
                              const nfeJaEmitida = notaInfo?.temNfe || false
                              return (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleEmitirNfe(orcamento)}
                                  disabled={nfeJaEmitida}
                                  className={`h-8 w-8 p-0 ${nfeJaEmitida
                                    ? "text-gray-400 border-gray-200 bg-gray-50 cursor-not-allowed opacity-50"
                                    : "text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200 bg-transparent"
                                  }`}
                                  title={nfeJaEmitida ? "NF-e ja emitida" : "Emitir NF-e (Material)"}
                                >
                                  <Package className="h-4 w-4" />
                                </Button>
                              )
                            })()}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDelete(orcamento.numero)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 bg-transparent h-8 w-8 p-0"
                              title="Excluir orçamento"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="md:hidden p-3 space-y-4">
                {filteredOrcamentos.map((orcamento) => (
                  <Card
                    key={orcamento.id}
                    className="border-2 border-slate-300 shadow-md hover:shadow-lg transition-shadow overflow-hidden"
                  >
                    <CardContent className="p-3">
                      {/* Header do Card */}
                      <div className="flex items-start justify-between mb-3 pb-2 border-b-2 border-purple-100">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <FileText className="h-4 w-4 text-purple-600 flex-shrink-0" />
                            <span className="font-bold text-purple-600 text-sm">Orç. {orcamento.numero}</span>
                          </div>
                          <div className="text-xs text-gray-500">{formatDate(orcamento.data_orcamento)}</div>
                        </div>
                        <div className="flex-shrink-0">{getStatusBadge(orcamento.situacao)}</div>
                      </div>

                      {/* Informações */}
                      <div className="space-y-2 mb-3 text-sm">
                        <div className="flex items-start gap-2">
                          <User className="h-3.5 w-3.5 text-gray-400 flex-shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-900 truncate">{orcamento.cliente_nome}</div>
                            {orcamento.cliente_codigo && (
                              <div className="text-xs text-gray-500">{orcamento.cliente_codigo}</div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Wrench className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                          <div className="text-gray-600 text-xs">{getTipoServicoLabel(orcamento.tipo_servico)}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-3.5 w-3.5 text-green-600 flex-shrink-0" />
                          <div className="font-semibold text-green-600 text-sm">
                            {formatCurrency(Number(orcamento.valor_total))}
                          </div>
                        </div>
                      </div>

                      {/* Botões de Ação */}
                      {(() => {
                        const mostraNfBtns = orcamento.situacao === "aprovado" || orcamento.situacao === "nota fiscal emitida"
                        const notaInfo = notasEmitidas[orcamento.numero]
                        const nfseJaEmitida = notaInfo?.temNfse || false
                        const nfeJaEmitida = notaInfo?.temNfe || false
                        const temMaterial = safeNumber(orcamento.valor_material) > 0
                        const totalCols = 2 + (mostraNfBtns ? 1 : 0) + (mostraNfBtns && temMaterial ? 1 : 0) + 1
                        const gridColsClass = totalCols === 3 ? "grid-cols-3" : totalCols === 4 ? "grid-cols-4" : "grid-cols-5"
                        return (
                          <div className={`grid gap-2 pt-3 border-t-2 border-slate-200 ${gridColsClass}`}>
                            <Link href={`/orcamentos/${orcamento.numero}`} className="w-full">
                              <Button
                                variant="outline"
                                size="sm"
                                className="w-full h-9 text-xs bg-blue-50 hover:bg-blue-100 border-2 border-blue-300 text-blue-700 font-medium"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Link href={`/orcamentos/${orcamento.numero}/editar`} className="w-full">
                              <Button
                                variant="outline"
                                size="sm"
                                className="w-full h-9 text-xs bg-green-50 hover:bg-green-100 border-2 border-green-300 text-green-700 font-medium"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </Link>
                            {mostraNfBtns && (
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={nfseJaEmitida}
                                className={`w-full h-9 text-xs font-medium border-2 ${nfseJaEmitida
                                  ? "bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed opacity-50"
                                  : "bg-emerald-50 hover:bg-emerald-100 border-emerald-300 text-emerald-700"
                                }`}
                                onClick={() => !nfseJaEmitida && handleEmitirNfse(orcamento)}
                                title={nfseJaEmitida ? "NFS-e ja emitida" : "NFS-e"}
                              >
                                <FileCheck className="h-4 w-4" />
                              </Button>
                            )}
                            {mostraNfBtns && temMaterial && (
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={nfeJaEmitida}
                                className={`w-full h-9 text-xs font-medium border-2 ${nfeJaEmitida
                                  ? "bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed opacity-50"
                                  : "bg-blue-50 hover:bg-blue-100 border-blue-300 text-blue-700"
                                }`}
                                onClick={() => !nfeJaEmitida && handleEmitirNfe(orcamento)}
                                title={nfeJaEmitida ? "NF-e ja emitida" : "NF-e"}
                              >
                                <Package className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full h-9 text-xs bg-red-50 hover:bg-red-100 border-2 border-red-300 text-red-600 font-medium"
                              onClick={() => handleDelete(orcamento.numero)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )
                      })()}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

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
    </div>
  )
}
