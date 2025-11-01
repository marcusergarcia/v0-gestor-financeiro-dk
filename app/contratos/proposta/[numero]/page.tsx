"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  ArrowLeft,
  Edit,
  Printer,
  FileText,
  User,
  Calendar,
  MapPin,
  Package,
  Calculator,
  Clock,
  Shield,
  CreditCard,
} from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { formatCurrency, formatDate } from "@/lib/utils"
import { PropostaPrint } from "@/components/proposta-print"

interface PropostaDetalhes {
  id: string
  numero: string
  cliente_id: string
  cliente_nome: string
  cliente_codigo: string
  cliente_email: string
  cliente_telefone: string
  cliente_endereco: string
  distancia_km: number
  tipo: string
  frequencia: string
  valor_equipamentos: number
  valor_desconto: number
  valor_deslocamento: number
  valor_visitas: number
  valor_total_proposta: number
  forma_pagamento: string
  prazo_contrato: string
  garantia: number
  observacoes: string
  equipamentos_consignacao: string
  status: string
  data_proposta: string
  data_validade: string
  itens: ItemProposta[]
}

interface ItemProposta {
  id: string
  equipamento_id: number
  equipamento_nome: string
  equipamento_categoria: string
  categoria: string
  quantidade: number
  valor_unitario: number
  valor_desconto_individual: number
  valor_desconto_categoria: number
  valor_total: number
}

const CATEGORIAS = {
  basicos: {
    nome: "Básicos",
    cor: "bg-blue-500",
    corClara: "bg-blue-100 text-blue-800",
  },
  portoes_veiculos: {
    nome: "Portões de Veículos",
    cor: "bg-green-500",
    corClara: "bg-green-100 text-green-800",
  },
  portoes_pedestre: {
    nome: "Portões de Pedestre",
    cor: "bg-purple-500",
    corClara: "bg-purple-100 text-purple-800",
  },
  software_redes: {
    nome: "Software e Redes",
    cor: "bg-orange-500",
    corClara: "bg-orange-100 text-orange-800",
  },
}

const STATUS_COLORS = {
  rascunho: "bg-gray-100 text-gray-800",
  enviada: "bg-blue-100 text-blue-800",
  aprovada: "bg-green-100 text-green-800",
  rejeitada: "bg-red-100 text-red-800",
  expirada: "bg-yellow-100 text-yellow-800",
}

const PRAZO_CONTRATO_LABELS: Record<string, string> = {
  "12": "12 meses",
  "24": "24 meses",
  indeterminado: "Indeterminado",
}

export default function VisualizarPropostaPage() {
  const params = useParams()
  const numero = params.numero as string
  const { toast } = useToast()

  const [proposta, setProposta] = useState<PropostaDetalhes | null>(null)
  const [loading, setLoading] = useState(true)
  const [showPrintModal, setShowPrintModal] = useState(false)

  useEffect(() => {
    if (numero) {
      loadProposta()
    }
  }, [numero])

  const loadProposta = async () => {
    try {
      const response = await fetch(`/api/propostas-contratos/${numero}`)
      const result = await response.json()

      if (result.success) {
        setProposta(result.data)
      } else {
        toast({
          title: "Erro",
          description: result.message || "Erro ao carregar proposta",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Erro ao carregar proposta:", error)
      toast({
        title: "Erro",
        description: "Erro de conexão. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const agruparItensPorCategoria = () => {
    if (!proposta?.itens) return {}

    return proposta.itens.reduce(
      (acc, item) => {
        const categoria = item.categoria || "outros"
        if (!acc[categoria]) {
          acc[categoria] = []
        }
        acc[categoria].push(item)
        return acc
      },
      {} as Record<string, ItemProposta[]>,
    )
  }

  const formatarPrazoContrato = (prazo: string) => {
    return PRAZO_CONTRATO_LABELS[prazo] || prazo
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="container mx-auto p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Carregando proposta...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!proposta) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="container mx-auto p-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">Proposta não encontrada</h1>
            <Link href="/contratos">
              <Button>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar para Contratos
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const itensAgrupados = agruparItensPorCategoria()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Proposta {proposta.numero}
            </h1>
            <p className="text-gray-600 mt-1">Visualização detalhada da proposta de contrato</p>
          </div>
          <div className="flex gap-2">
            <Link href="/contratos">
              <Button variant="outline" className="bg-transparent">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
            </Link>
            <Button variant="outline" className="bg-transparent" onClick={() => setShowPrintModal(true)}>
              <Printer className="h-4 w-4 mr-2" />
              Imprimir
            </Button>
            <Link href={`/contratos/proposta/${numero}/editar`}>
              <Button className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg">
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Informações Principais */}
          <div className="lg:col-span-2 space-y-6">
            {/* Status e Informações Gerais */}
            <Card className="border-0 shadow-lg bg-white">
              <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-t-lg  p-4 lg:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Informações Gerais
                    </CardTitle>
                    <CardDescription className="text-blue-100">Dados básicos da proposta</CardDescription>
                  </div>
                  <Badge
                    className={
                      STATUS_COLORS[proposta.status as keyof typeof STATUS_COLORS] || "bg-gray-100 text-gray-800"
                    }
                  >
                    {proposta.status?.toUpperCase()}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Calendar className="h-5 w-5 text-blue-500" />
                      <div>
                        <p className="text-sm text-gray-600">Data da Proposta</p>
                        <p className="font-medium">{formatDate(proposta.data_proposta)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Clock className="h-5 w-5 text-orange-500" />
                      <div>
                        <p className="text-sm text-gray-600">Validade</p>
                        <p className="font-medium">{formatDate(proposta.data_validade)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Package className="h-5 w-5 text-green-500" />
                      <div>
                        <p className="text-sm text-gray-600">Tipo de Serviço</p>
                        <p className="font-medium capitalize">{proposta.tipo}</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Calendar className="h-5 w-5 text-purple-500" />
                      <div>
                        <p className="text-sm text-gray-600">Frequência</p>
                        <p className="font-medium capitalize">{proposta.frequencia}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <CreditCard className="h-5 w-5 text-blue-500" />
                      <div>
                        <p className="text-sm text-gray-600">Forma de Pagamento</p>
                        <p className="font-medium capitalize">{proposta.forma_pagamento}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Clock className="h-5 w-5 text-indigo-500" />
                      <div>
                        <p className="text-sm text-gray-600">Prazo do Contrato</p>
                        <p className="font-medium">{formatarPrazoContrato(proposta.prazo_contrato)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Shield className="h-5 w-5 text-green-500" />
                      <div>
                        <p className="text-sm text-gray-600">Garantia</p>
                        <p className="font-medium">{proposta.garantia} dias</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Dados do Cliente */}
            <Card className="border-0 shadow-lg bg-white">
              <CardHeader className="bg-gradient-to-r from-green-500 to-blue-600 text-white rounded-t-lg  p-4 lg:p-6">
                <CardTitle className="text-white flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Dados do Cliente
                </CardTitle>
                <CardDescription className="text-green-100">Informações do cliente da proposta</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Nome</p>
                      <p className="font-medium text-lg">{proposta.cliente_nome}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Código</p>
                      <p className="font-medium">{proposta.cliente_codigo}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <p className="font-medium">{proposta.cliente_email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Telefone</p>
                      <p className="font-medium">{proposta.cliente_telefone}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-red-500 mt-1" />
                    <div className="flex-1">
                      <p className="text-sm text-gray-600">Endereço</p>
                      <p className="font-medium">{proposta.cliente_endereco}</p>
                      {proposta.distancia_km > 0 && (
                        <p className="text-sm text-blue-600 mt-1">Distância: {proposta.distancia_km} km</p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Equipamentos por Categoria */}
            <Card className="border-0 shadow-lg bg-white">
              <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-t-lg  p-4 lg:p-6">
                <CardTitle className="text-white flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Equipamentos
                </CardTitle>
                <CardDescription className="text-purple-100">Equipamentos incluídos na proposta</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-6">
                  {Object.entries(itensAgrupados).map(([categoria, itens]) => (
                    <div key={categoria} className="space-y-3">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold text-gray-800">
                          {CATEGORIAS[categoria as keyof typeof CATEGORIAS]?.nome || categoria}
                        </h3>
                        <Badge
                          className={
                            CATEGORIAS[categoria as keyof typeof CATEGORIAS]?.corClara || "bg-gray-100 text-gray-800"
                          }
                        >
                          {itens.length} {itens.length === 1 ? "item" : "itens"}
                        </Badge>
                      </div>

                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Equipamento</TableHead>
                              <TableHead className="text-center">Qtd</TableHead>
                              <TableHead className="text-right">Valor Unit.</TableHead>
                              <TableHead className="text-right">Desc. Indiv.</TableHead>
                              <TableHead className="text-right">Desc. Categ.</TableHead>
                              <TableHead className="text-right">Total</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {itens.map((item) => (
                              <TableRow key={item.id}>
                                <TableCell className="font-medium">{item.equipamento_nome}</TableCell>
                                <TableCell className="text-center">{item.quantidade}</TableCell>
                                <TableCell className="text-right">{formatCurrency(item.valor_unitario || 0)}</TableCell>
                                <TableCell className="text-right text-red-600">
                                  {(item.valor_desconto_individual || 0) > 0
                                    ? `-${formatCurrency(item.valor_desconto_individual)}`
                                    : "-"}
                                </TableCell>
                                <TableCell className="text-right text-blue-600">
                                  {(item.valor_desconto_categoria || 0) > 0
                                    ? `-${formatCurrency(item.valor_desconto_categoria)}`
                                    : "-"}
                                </TableCell>
                                <TableCell className="text-right font-semibold text-green-600">
                                  {formatCurrency(item.valor_total || 0)}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Equipamentos em Consignação */}
            {proposta.equipamentos_consignacao && (
              <Card className="border-0 shadow-lg bg-white">
                <CardHeader className="bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-t-lg  p-4 lg:p-6">
                  <CardTitle className="text-white flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Equipamentos em Consignação
                  </CardTitle>
                  <CardDescription className="text-amber-100">
                    Equipamentos fornecidos em regime de consignação
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                      {proposta.equipamentos_consignacao}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Observações */}
            {proposta.observacoes && (
              <Card className="border-0 shadow-lg bg-white">
                <CardHeader className="bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-t-lg  p-4 lg:p-6">
                  <CardTitle className="text-white">Observações</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <p className="text-gray-700 whitespace-pre-wrap">{proposta.observacoes}</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Resumo Financeiro */}
          <div className="space-y-6">
            <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-blue-50 sticky top-6">
              <CardHeader className="bg-gradient-to-r from-green-500 to-blue-600 text-white rounded-t-lg  p-4 lg:p-6">
                <CardTitle className="text-white flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Resumo Financeiro
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Valor dos Equipamentos:</span>
                      <span className="font-medium">{formatCurrency(proposta.valor_equipamentos || 0)}</span>
                    </div>

                    {(proposta.valor_desconto || 0) > 0 && (
                      <div className="flex justify-between items-center text-red-600">
                        <span>Desconto Total:</span>
                        <span className="font-medium">-{formatCurrency(proposta.valor_desconto || 0)}</span>
                      </div>
                    )}

                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Valor do Deslocamento:</span>
                      <span className="font-medium">{formatCurrency(proposta.valor_deslocamento || 0)}</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Desconto Visitas Técnicas:</span>
                      <span
                        className={`font-medium ${(proposta.valor_visitas || 0) < 0 ? "text-red-600" : "text-green-600"}`}
                      >
                        {formatCurrency(proposta.valor_visitas || 0)}
                      </span>
                    </div>

                    <Separator />

                    <div className="flex justify-between items-center text-lg font-bold">
                      <span>Valor Total:</span>
                      <span className="text-green-600">{formatCurrency(proposta.valor_total_proposta || 0)}</span>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex justify-between">
                      <span>Prazo do Contrato:</span>
                      <span>{formatarPrazoContrato(proposta.prazo_contrato)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Equipamentos:</span>
                      <span>{proposta.itens?.length || 0}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Modal de Impressão */}
      <PropostaPrint proposta={proposta} isOpen={showPrintModal} onClose={() => setShowPrintModal(false)} />

      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-content,
          .print-content * {
            visibility: visible;
          }
          .print-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>
    </div>
  )
}
