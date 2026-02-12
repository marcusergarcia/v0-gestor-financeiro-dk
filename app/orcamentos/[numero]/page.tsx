"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Separator } from "@/components/ui/separator"
import {
  ArrowLeft,
  Edit,
  FileText,
  User,
  Package,
  Calculator,
  Calendar,
  MapPin,
  Clock,
  Printer,
  Building2,
  Send,
  CheckCircle,
  FileCheck,
  CreditCard,
} from "lucide-react"
import Link from "next/link"
import { formatCurrency, formatDate } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { OrcamentoPrintEditor } from "@/components/orcamento-print-editor"
import { EmitirNfseDialog } from "@/components/nfse/emitir-nfse-dialog"

interface Produto {
  id: string
  codigo: string
  descricao: string
  categoria_id: string
  marca_id: string
  ncm?: string
  unidade: string
  valor_unitario: number
  valor_mao_obra: number
  valor_custo: number
  margem_lucro: number
  estoque: number
  estoque_minimo: number
  observacoes?: string
  ativo: boolean
}

interface OrcamentoItem {
  id?: string
  produto_id: string
  produto: Produto
  quantidade: number
  valor_unitario: number
  valor_mao_obra: number
  valor_total: number
  marca_nome?: string
}

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
  cliente_cep?: string
  cliente_cidade?: string
  cliente_estado?: string
  nome_adm?: string
  contato_adm?: string
  telefone_adm?: string
  email_adm?: string
  tipo_servico: string
  detalhes_servico?: string
  valor_material: number
  valor_mao_obra: number
  desconto: number
  valor_total: number
  validade: number
  observacoes?: string
  situacao: string
  data_orcamento: string
  created_at: string
  itens: any[]
  distancia_km?: number
  valor_boleto?: number
  prazo_dias?: number
  data_inicio?: string
  juros_am?: number
  imposto_servico?: number
  imposto_material?: number
  desconto_mdo_percent?: number
  desconto_mdo_valor?: number
  parcelamento_mdo?: number
  parcelamento_material?: number
  material_a_vista?: boolean
  subtotal_mdo?: number
}

export default function VisualizarOrcamentoPage({ params }: { params: Promise<{ numero: string }> }) {
  const [orcamento, setOrcamento] = useState<Orcamento | null>(null)
  const [itens, setItens] = useState<OrcamentoItem[]>([])
  const [loading, setLoading] = useState(true)
  const [logoMenu, setLogoMenu] = useState<string>("")
  const [valorPorKm, setValorPorKm] = useState(1.5)
  const [showPrintEditor, setShowPrintEditor] = useState(false)
  const [nfseDialogOpen, setNfseDialogOpen] = useState(false)
  const [numeroOrcamento, setNumeroOrcamento] = useState<string>("")
  const { toast } = useToast()

  useEffect(() => {
    const resolveParams = async () => {
      try {
        const resolvedParams = await params
        setNumeroOrcamento(resolvedParams.numero)
      } catch (error) {
        console.error("Erro ao resolver params:", error)
        toast({
          title: "Erro",
          description: "Erro ao carregar parâmetros da página",
          variant: "destructive",
        })
      }
    }

    resolveParams()
  }, [params, toast])

  useEffect(() => {
    if (numeroOrcamento) {
      loadOrcamento()
      loadLogoMenu()
      loadValorPorKm()
    }
  }, [numeroOrcamento])

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

  const loadOrcamento = async () => {
    try {
      const response = await fetch(`/api/orcamentos/${numeroOrcamento}`)
      const result = await response.json()

      if (result.success) {
        const data = result.data
        setOrcamento(data)

        if (data.itens && data.itens.length > 0) {
          const itensFormatados = data.itens.map((item: any) => ({
            id: item.id,
            produto_id: item.produto_id,
            produto: {
              id: item.produto_id,
              codigo: item.produto_codigo,
              descricao: item.produto_descricao,
              unidade: item.produto_unidade,
              valor_unitario: Number(item.valor_unitario),
              valor_mao_obra: Number(item.valor_mao_obra),
              ncm: item.produto_ncm,
            },
            quantidade: Number(item.quantidade),
            valor_unitario: Number(item.valor_unitario),
            valor_mao_obra: Number(item.valor_mao_obra),
            valor_total: Number(item.valor_total),
            marca_nome: item.marca_nome,
          }))
          setItens(itensFormatados)
        }
      } else {
        toast({
          title: "Erro",
          description: "Orçamento não encontrado",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Erro ao carregar orçamento:", error)
      toast({
        title: "Erro",
        description: "Erro ao carregar orçamento",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pendente: {
        label: "Pendente",
        className: "bg-amber-100 text-amber-800 border-amber-200",
        icon: Clock,
      },
      aprovado: {
        label: "Aprovado",
        className: "bg-emerald-100 text-emerald-800 border-emerald-200",
        icon: CheckCircle,
      },
      "enviado por email": {
        label: "Enviado por Email",
        className: "bg-blue-100 text-blue-800 border-blue-200",
        icon: Send,
      },
      "nota fiscal emitida": {
        label: "Nota Fiscal Emitida",
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
      <Badge className={config.className}>
        <IconComponent className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    )
  }

  const handleNfseSuccess = async () => {
    if (orcamento) {
      try {
        await fetch(`/api/orcamentos/${orcamento.numero}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ situacao: "nota fiscal emitida" }),
        })
        toast({
          title: "Sucesso",
          description: "NFS-e emitida e situação atualizada para 'NF Emitida'",
        })
        loadOrcamento()
      } catch (error) {
        console.error("Erro ao atualizar situação:", error)
      }
    }
  }

  const safeNumber = (value: any): number => {
    const num = Number(value)
    return isNaN(num) ? 0 : num
  }

  const calcularCustoDeslocamento = () => {
    if (!orcamento) return 0
    const distancia = safeNumber(orcamento.distancia_km)
    const prazo = safeNumber(orcamento.prazo_dias)
    const valorKm = safeNumber(valorPorKm)
    return distancia * 2 * valorKm * prazo
  }

  const calcularValorJuros = () => {
    if (!orcamento) return 0
    const parcelamentoMdo = safeNumber(orcamento.parcelamento_mdo) || 1
    const parcelamentoMaterial = safeNumber(orcamento.parcelamento_material) || 1
    const jurosAm = safeNumber(orcamento.juros_am)
    const valorMaterial = safeNumber(orcamento.valor_material)
    return ((parcelamentoMdo + parcelamentoMaterial - 1) * jurosAm * valorMaterial) / 100
  }

  const calcularTaxaBoletoMdo = () => {
    if (!orcamento) return 0
    const parcelamento = safeNumber(orcamento.parcelamento_mdo) || 1
    const valorBoleto = safeNumber(orcamento.valor_boleto)
    return parcelamento * valorBoleto
  }

  const calcularTaxaBoletoMaterial = () => {
    if (!orcamento) return 0
    const parcelamento = safeNumber(orcamento.parcelamento_material) || 1
    const valorBoleto = safeNumber(orcamento.valor_boleto)
    return parcelamento * valorBoleto
  }

  const calcularImpostoServicoValor = () => {
    if (!orcamento) return 0
    const valorMaoObra = safeNumber(orcamento.valor_mao_obra)
    const descontoMdoValor = safeNumber(orcamento.desconto_mdo_valor)
    const custoDeslocamento = calcularCustoDeslocamento()
    const taxaBoletoMdo = calcularTaxaBoletoMdo()
    const impostoServico = safeNumber(orcamento.imposto_servico)

    const base = valorMaoObra - descontoMdoValor + custoDeslocamento + taxaBoletoMdo
    return (base * impostoServico) / 100
  }

  const calcularImpostoMaterialValor = () => {
    if (!orcamento) return 0
    const valorMaterial = safeNumber(orcamento.valor_material)
    const valorJuros = calcularValorJuros()
    const taxaBoletoMaterial = calcularTaxaBoletoMaterial()
    const impostoMaterial = safeNumber(orcamento.imposto_material)

    const base = valorMaterial + valorJuros + taxaBoletoMaterial
    const resultado = (base * impostoMaterial) / 100

    return resultado
  }

  const calcularSubtotalMdo = () => {
    if (!orcamento) return 0

    // Se parcelamento MDO for 0 (sem cobrança), subtotal MDO é 0
    const parcelamentoMdo = safeNumber(orcamento.parcelamento_mdo) || 1
    if (parcelamentoMdo === 0) {
      return 0
    }

    const valorMaoObra = safeNumber(orcamento.valor_mao_obra)
    const descontoMdoValor = safeNumber(orcamento.desconto_mdo_valor)
    const custoDeslocamento = calcularCustoDeslocamento()
    const taxaBoletoMdo = calcularTaxaBoletoMdo()
    const impostoServicoValor = calcularImpostoServicoValor()

    return valorMaoObra - descontoMdoValor + custoDeslocamento + taxaBoletoMdo + impostoServicoValor
  }

  const calcularSubtotalMaterial = () => {
    if (!orcamento) return 0
    const valorMaterial = safeNumber(orcamento.valor_material)
    const valorJuros = calcularValorJuros()
    const taxaBoletoMaterial = calcularTaxaBoletoMaterial()
    const impostoMaterialValor = calcularImpostoMaterialValor()

    const parcelamentoMdo = safeNumber(orcamento.parcelamento_mdo) || 1
    const custoDeslocamentoExtra = parcelamentoMdo === 0 ? calcularCustoDeslocamento() : 0

    return valorMaterial + valorJuros + taxaBoletoMaterial + impostoMaterialValor + custoDeslocamentoExtra
  }

  const calcularDataValidade = () => {
    if (!orcamento) return ""

    const dataOrcamentoStr = orcamento.data_orcamento.split("T")[0]
    const [year, month, day] = dataOrcamentoStr.split("-").map(Number)

    const dataOrcamento = new Date(year, month - 1, day)

    dataOrcamento.setDate(dataOrcamento.getDate() + 30)

    const validadeDay = String(dataOrcamento.getDate()).padStart(2, "0")
    const validadeMonth = String(dataOrcamento.getMonth() + 1).padStart(2, "0")
    const validadeYear = dataOrcamento.getFullYear()

    return `${validadeDay}/${validadeMonth}/${validadeYear}`
  }

  if (loading || !numeroOrcamento) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="container mx-auto p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Carregando orçamento...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!orcamento) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="container mx-auto p-6">
          <div className="text-center py-12">
            <FileText className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">Orçamento não encontrado</h3>
            <p className="text-gray-600 mb-6">O orçamento solicitado não existe ou foi removido</p>
            <Link href="/orcamentos">
              <Button className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar aos Orçamentos
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto p-6 space-y-6">
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
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Orçamento {orcamento.numero}
              </h1>
              <p className="text-gray-600 mt-1">
                Cliente: {orcamento.cliente_nome} - {formatDate(orcamento.data_orcamento)}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Link href="/orcamentos">
              <Button variant="outline" className="bg-transparent">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
            </Link>
            <Link href={`/orcamentos/${orcamento.numero}/editar`}>
              <Button className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg">
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </Button>
            </Link>
            {orcamento.situacao === "aprovado" && (
              <Button
                onClick={() => setNfseDialogOpen(true)}
                className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-lg"
              >
                <FileCheck className="h-4 w-4 mr-2" />
                Emitir NFS-e
              </Button>
            )}
            <Button
              onClick={() => setShowPrintEditor(true)}
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg"
            >
              <Printer className="h-4 w-4 mr-2" />
              Imprimir
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-0 shadow-lg bg-white">
              <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-t-lg p-4 lg:p-6">
                <CardTitle className="text-white flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Dados do Cliente
                </CardTitle>
                <CardDescription className="text-blue-100">
                  Informações do cliente e parâmetros do orçamento
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-2 mb-2">
                      {orcamento.cliente_codigo && (
                        <Badge variant="outline" className="font-mono">
                          {orcamento.cliente_codigo}
                        </Badge>
                      )}
                      <span className="font-medium text-blue-900">{orcamento.cliente_nome}</span>
                      {getStatusBadge(orcamento.situacao)}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                      <div>
                        {orcamento.cliente_cnpj && (
                          <div>
                            <strong>CNPJ:</strong> {orcamento.cliente_cnpj}
                          </div>
                        )}
                        {orcamento.cliente_cpf && (
                          <div>
                            <strong>CPF:</strong> {orcamento.cliente_cpf}
                          </div>
                        )}
                        {orcamento.cliente_email && (
                          <div>
                            <strong>Email:</strong> {orcamento.cliente_email}
                          </div>
                        )}
                        {orcamento.cliente_telefone && (
                          <div>
                            <strong>Telefone:</strong> {orcamento.cliente_telefone}
                          </div>
                        )}
                      </div>
                      <div>
                        {orcamento.cliente_endereco && (
                          <div>
                            <strong>Endereço:</strong> {orcamento.cliente_endereco}
                          </div>
                        )}
                        {orcamento.cliente_cep && (
                          <div>
                            <strong>CEP:</strong> {orcamento.cliente_cep}
                          </div>
                        )}
                        {orcamento.cliente_cidade && (
                          <div>
                            <strong>Cidade:</strong> {orcamento.cliente_cidade}/{orcamento.cliente_estado}
                          </div>
                        )}
                        {orcamento.distancia_km && (
                          <div>
                            <strong>Distância:</strong> {orcamento.distancia_km} km
                          </div>
                        )}
                      </div>
                    </div>

                    {(orcamento.nome_adm || orcamento.contato_adm || orcamento.telefone_adm || orcamento.email_adm) && (
                      <div className="mt-4 pt-3 border-t border-blue-200">
                        <div className="flex items-center gap-2 mb-2">
                          <Building2 className="h-4 w-4 text-blue-600" />
                          <span className="font-medium text-blue-800">Administradora</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                          <div>
                            {orcamento.nome_adm && (
                              <div>
                                <strong>Nome:</strong> {orcamento.nome_adm}
                              </div>
                            )}
                            {orcamento.contato_adm && (
                              <div>
                                <strong>Contato:</strong> {orcamento.contato_adm}
                              </div>
                            )}
                          </div>
                          <div>
                            {orcamento.telefone_adm && (
                              <div>
                                <strong>Telefone:</strong> {orcamento.telefone_adm}
                              </div>
                            )}
                            {orcamento.email_adm && (
                              <div>
                                <strong>Email:</strong> {orcamento.email_adm}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Tipo de Serviço</label>
                      <div className="mt-1 p-2 bg-gray-50 rounded border">{orcamento.tipo_servico}</div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Validade</label>
                      <div className="mt-1 p-2 bg-gray-50 rounded border flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        {calcularDataValidade()}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700">Data do Orçamento</label>
                    <div className="mt-1 p-2 bg-gray-50 rounded border flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      {formatDate(orcamento.data_orcamento)}
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Parâmetros do Orçamento
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Distância (Km)</label>
                        <div className="mt-1 p-2 bg-gray-50 rounded border">{orcamento.distancia_km || 0}</div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Valor do Boleto</label>
                        <div className="mt-1 p-2 bg-gray-50 rounded border">
                          {formatCurrency(orcamento.valor_boleto || 0)}
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Prazo (dias)</label>
                        <div className="mt-1 p-2 bg-gray-50 rounded border">{orcamento.prazo_dias || 0}</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Data Início</label>
                        <div className="mt-1 p-2 bg-gray-50 rounded border">
                          {orcamento.data_inicio ? formatDate(orcamento.data_inicio) : "Não definida"}
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Juros (a.m.)</label>
                        <div className="mt-1 p-2 bg-gray-50 rounded border">{orcamento.juros_am || 0}%</div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Desconto MDO</label>
                        <div className="mt-1 p-2 bg-gray-50 rounded border">{orcamento.desconto_mdo_percent || 0}%</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Imposto Serviço</label>
                        <div className="mt-1 p-2 bg-gray-50 rounded border">{orcamento.imposto_servico || 0}%</div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Imposto Material</label>
                        <div className="mt-1 p-2 bg-gray-50 rounded border">{orcamento.imposto_material || 0}%</div>
                      </div>
                    </div>
                  </div>

                  {orcamento.detalhes_servico && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">Detalhes do Serviço</label>
                      <div className="mt-1 p-3 bg-gray-50 rounded border whitespace-pre-wrap">
                        {orcamento.detalhes_servico}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-white">
              <CardHeader className="bg-gradient-to-r from-green-500 to-blue-600 text-white rounded-t-lg p-4 lg:p-6">
                <CardTitle className="text-white flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Itens do Orçamento
                </CardTitle>
                <CardDescription className="text-green-100">Produtos e serviços incluídos no orçamento</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                {itens.length > 0 ? (
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50">
                          <TableHead className="font-semibold">Produto</TableHead>
                          <TableHead className="font-semibold text-center w-20">Qtd</TableHead>
                          <TableHead className="font-semibold text-right w-28">Valor Unit.</TableHead>
                          <TableHead className="font-semibold text-right w-28">Mão de Obra</TableHead>
                          <TableHead className="font-semibold text-right w-28">Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {itens.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              <div>
                                <div className="font-medium">{item.produto.descricao}</div>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge
                                    variant="outline"
                                    className="text-xs font-mono bg-blue-50 text-blue-700 border-blue-200"
                                  >
                                    {item.produto.codigo}
                                  </Badge>
                                  {item.marca_nome && (
                                    <Badge className="text-xs bg-green-100 text-green-700 border-green-200">
                                      {item.marca_nome}
                                    </Badge>
                                  )}
                                  {item.produto.ncm && (
                                    <Badge className="text-xs bg-purple-100 text-purple-700 border-purple-200 hover:bg-purple-100 font-mono">
                                      NCM: {item.produto.ncm}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-center">{item.quantidade}</TableCell>
                            <TableCell className="text-right">{formatCurrency(item.valor_unitario)}</TableCell>
                            <TableCell className="text-right">{formatCurrency(item.valor_mao_obra)}</TableCell>
                            <TableCell className="text-right">
                              <div className="font-semibold text-green-600">{formatCurrency(item.valor_total)}</div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg p-4 lg:p-6">
                    <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-gray-600">Nenhum item encontrado</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {orcamento.observacoes && (
              <Card className="border-0 shadow-lg bg-white">
                <CardHeader>
                  <CardTitle>Observações</CardTitle>
                  <CardDescription>Informações adicionais sobre o orçamento</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="p-3 bg-gray-50 rounded border whitespace-pre-wrap">{orcamento.observacoes}</div>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-blue-50 sticky top-6">
              <CardHeader className="bg-gradient-to-r from-purple-500 to-blue-600 text-white rounded-t-lg p-4 lg:p-6">
                <CardTitle className="text-white flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Resumo do Orçamento
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="border-b pb-4">
                    <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      Parcelamento
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-2 bg-blue-50 rounded">
                        <div className="text-sm text-gray-600">MDO</div>
                        <div className="font-semibold text-blue-600">
                          {(orcamento.parcelamento_mdo || 1) === 0
                            ? "Sem cobrança"
                            : (orcamento.parcelamento_mdo || 1) === 1
                              ? "À vista"
                              : `${orcamento.parcelamento_mdo}x`}
                        </div>
                      </div>
                      <div className="text-center p-2 bg-green-50 rounded">
                        <div className="text-sm text-gray-600">Material</div>
                        <div className="font-semibold text-green-600">
                          {(orcamento.parcelamento_material || 1) === 0
                            ? "Sem cobrança"
                            : (orcamento.parcelamento_material || 1) === 1 && !orcamento.material_a_vista
                              ? "30dd"
                              : `${orcamento.parcelamento_material}x`}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Valor Material:</span>
                      <span className="font-medium">{formatCurrency(orcamento.valor_material)}</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Mão de Obra:</span>
                      <span className="font-medium">{formatCurrency(orcamento.valor_mao_obra)}</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Custo Deslocamento:</span>
                      <span className="font-medium">{formatCurrency(calcularCustoDeslocamento())}</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Valor dos Juros:</span>
                      <span className="font-medium">{formatCurrency(calcularValorJuros())}</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Taxa Boleto MDO:</span>
                      <span className="font-medium">{formatCurrency(calcularTaxaBoletoMdo())}</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Taxa Boleto Material:</span>
                      <span className="font-medium">{formatCurrency(calcularTaxaBoletoMaterial())}</span>
                    </div>

                    {(orcamento.desconto_mdo_percent || 0) > 0 && (
                      <div className="flex justify-between items-center text-red-600">
                        <span>Desconto MDO ({orcamento.desconto_mdo_percent}%):</span>
                        <span className="font-medium">-{formatCurrency(orcamento.desconto_mdo_valor || 0)}</span>
                      </div>
                    )}

                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Imposto Serviço:</span>
                      <span className="font-medium">{formatCurrency(calcularImpostoServicoValor())}</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Imposto Material:</span>
                      <span className="font-medium">{formatCurrency(calcularImpostoMaterialValor())}</span>
                    </div>

                    <div className="border-t pt-2">
                      <div className="flex justify-between items-center font-semibold">
                        <span>Subtotal MDO:</span>
                        <span className="text-blue-600">{formatCurrency(calcularSubtotalMdo())}</span>
                      </div>
                      <div className="flex justify-between items-center font-semibold">
                        <span>Subtotal Material:</span>
                        <span className="text-blue-600">{formatCurrency(calcularSubtotalMaterial())}</span>
                      </div>
                    </div>

                    {/* SEÇÃO DE PARCELAMENTO - ADICIONADA AQUI */}
                    <div className="border-t pt-3 mt-3 bg-gradient-to-r from-blue-50 to-purple-50 p-3 rounded-lg">
                      <h5 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-blue-600" />
                        Forma de Pagamento
                      </h5>

                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-blue-700 font-medium">Mão de Obra:</span>
                          <span className="font-semibold text-blue-800">
                            {(orcamento.parcelamento_mdo || 1) === 0
                              ? "Sem cobrança"
                              : (orcamento.parcelamento_mdo || 1) === 1
                                ? `À vista - ${formatCurrency(calcularSubtotalMdo())}`
                                : `${orcamento.parcelamento_mdo}x de ${formatCurrency(calcularSubtotalMdo() / (orcamento.parcelamento_mdo || 1))}`}
                          </span>
                        </div>

                        <div className="flex justify-between items-center text-sm">
                          <span className="text-green-700 font-medium">Material:</span>
                          <span className="font-semibold text-green-800">
                            {orcamento.material_a_vista
                              ? `À vista - ${formatCurrency(calcularSubtotalMaterial())}`
                              : (orcamento.parcelamento_material || 1) === 0
                                ? "Sem cobrança"
                                : (orcamento.parcelamento_material || 1) === 1
                                  ? `30dd - ${formatCurrency(calcularSubtotalMaterial())}`
                                  : `${orcamento.parcelamento_material}x de ${formatCurrency(calcularSubtotalMaterial() / (orcamento.parcelamento_material || 1))}`}
                          </span>
                        </div>
                      </div>
                    </div>

                    {orcamento.desconto > 0 && (
                      <div className="flex justify-between items-center text-red-600">
                        <span>Desconto:</span>
                        <span className="font-medium">-{formatCurrency(orcamento.desconto)}</span>
                      </div>
                    )}

                    <div className="border-t pt-4">
                      <div className="flex justify-between items-center text-lg font-bold">
                        <span>Total:</span>
                        <span className="text-green-600">{formatCurrency(orcamento.valor_total)}</span>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="pt-4 space-y-2 text-sm text-gray-600">
                    <div className="flex justify-between">
                      <span>Itens:</span>
                      <span>{itens.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Cliente:</span>
                      <span>{orcamento.cliente_nome}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Validade:</span>
                      <span>{calcularDataValidade()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Criado em:</span>
                      <span>{formatDate(orcamento.created_at)}</span>
                    </div>
                  </div>

                  <div className="pt-4 space-y-2">
                    <Link href={`/orcamentos/${orcamento.numero}/editar`}>
                      <Button className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg">
                        <Edit className="h-4 w-4 mr-2" />
                        Editar Orçamento
                      </Button>
                    </Link>
                    {orcamento.situacao === "aprovado" && (
                      <Button
                        onClick={() => setNfseDialogOpen(true)}
                        className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-lg"
                      >
                        <FileCheck className="h-4 w-4 mr-2" />
                        Emitir NFS-e
                      </Button>
                    )}
                    <Button onClick={() => setShowPrintEditor(true)} variant="outline" className="w-full">
                      <Printer className="h-4 w-4 mr-2" />
                      Imprimir
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {showPrintEditor && (
        <OrcamentoPrintEditor orcamento={orcamento} itens={itens} onClose={() => setShowPrintEditor(false)} />
      )}

      <EmitirNfseDialog
        open={nfseDialogOpen}
        onOpenChange={setNfseDialogOpen}
        onSuccess={handleNfseSuccess}
        dadosOrigem={{
          origem: "orcamento",
          origem_numero: orcamento.numero,
          cliente_id: Number(orcamento.cliente_id),
          cliente_nome: orcamento.cliente_nome,
          cliente_cnpj: orcamento.cliente_cnpj,
          cliente_cpf: orcamento.cliente_cpf,
          cliente_email: orcamento.cliente_email,
          cliente_telefone: orcamento.cliente_telefone,
          cliente_endereco: orcamento.cliente_endereco,
          cliente_bairro: orcamento.cliente_bairro,
          cliente_cidade: orcamento.cliente_cidade,
          cliente_uf: orcamento.cliente_estado,
          cliente_cep: orcamento.cliente_cep,
          descricao: orcamento.detalhes_servico || "",
          valor: calcularSubtotalMdo(),
        }}
      />
    </div>
  )
}
