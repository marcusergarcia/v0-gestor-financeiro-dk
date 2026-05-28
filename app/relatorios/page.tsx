"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BarChart, Filter, AlertCircle, RefreshCw } from "lucide-react"
import { formatCurrency, formatDate } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

interface RelatorioData {
  periodo?: string
  totalClientes?: number
  totalProdutos?: number
  orcamentos?: {
    total: number
    aprovados: number
    pendentes: number
    rejeitados: number
    valorTotal: number
  }
  boletos?: {
    total: number
    valorTotal: number
    pagos: number
    vencidos: number
    pendentes: number
  }
  clientes?: any[]
  produtos?: any[]
  tipos?: any[]
  total?: number
  valorTotal?: number
  estatisticas?: any
  filtros?: any
}

export default function RelatoriosPage() {
  const [loading, setLoading] = useState(false)
  const [tipoRelatorio, setTipoRelatorio] = useState("clientes")
  const [periodo, setPeriodo] = useState("30")
  const [status, setStatus] = useState("todos")
  const [clienteId, setClienteId] = useState("todos")
  const [categoriaId, setCategoriaId] = useState("todos")
  const [relatorioData, setRelatorioData] = useState<RelatorioData | null>(null)
  const [logoMenu, setLogoMenu] = useState<string>("")
  const [error, setError] = useState<string>("")
  const [clientes, setClientes] = useState<any[]>([])
  const [tipos, setTipos] = useState<any[]>([])
  const { toast } = useToast()

  useEffect(() => {
    loadLogoMenu()
    loadClientes()
    loadTipos()
  }, [])

  const loadLogoMenu = async () => {
    try {
      const response = await fetch("/api/configuracoes/logos")
      if (response.ok) {
        const result = await response.json()
        if (result.success && result.data?.length > 0) {
          const menuLogo = result.data.find((logo: any) => logo.tipo === "menu")
          if (menuLogo?.arquivo_base64) {
            setLogoMenu(menuLogo.arquivo_base64)
          }
        }
      }
    } catch (error) {
      console.error("Erro ao carregar logo do menu:", error)
    }
  }

  const loadClientes = async () => {
    try {
      const response = await fetch("/api/clientes")
      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setClientes(result.data || [])
        }
      }
    } catch (error) {
      console.error("Erro ao carregar clientes:", error)
    }
  }

  const loadTipos = async () => {
    try {
      // Buscar tipos únicos dos produtos
      const response = await fetch("/api/produtos")
      if (response.ok) {
        const result = await response.json()
        if (result.success && result.data) {
          // Extrair tipos únicos
          const tiposUnicos = [...new Set(result.data.map((p: any) => p.tipo).filter(Boolean))]
          setTipos(tiposUnicos.map((tipo, index) => ({ id: tipo, nome: tipo })))
        }
      }
    } catch (error) {
      console.error("Erro ao carregar tipos:", error)
    }
  }

  const gerarRelatorio = async () => {
    try {
      setLoading(true)
      setError("")
      setRelatorioData(null)

      const params = new URLSearchParams({
        tipo: tipoRelatorio,
        periodo,
        status,
        clienteId,
        categoriaId,
      })

      console.log("Gerando relatório:", { tipoRelatorio, periodo, status, clienteId, categoriaId })

      const response = await fetch(`/api/relatorios?${params}`)
      const responseText = await response.text()

      console.log("Response status:", response.status)
      console.log("Response text:", responseText)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${responseText}`)
      }

      let result
      try {
        result = JSON.parse(responseText)
      } catch (parseError) {
        throw new Error(`Erro ao processar resposta: ${responseText}`)
      }

      console.log("Resultado da API:", result)

      if (result.success) {
        setRelatorioData(result.data)
        // Se temos tipos no resultado, atualizar a lista
        if (result.data.tipos) {
          setTipos(result.data.tipos.map((t: any) => ({ id: t.tipo, nome: t.tipo })))
        }
        toast({
          title: "Sucesso!",
          description: "Relatório gerado com sucesso",
        })
      } else {
        setError(result.message || "Erro ao gerar relatório")
        toast({
          title: "Erro",
          description: result.message || "Erro ao gerar relatório",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Erro ao gerar relatório:", error)
      const errorMessage = error instanceof Error ? error.message : "Erro de conexão"
      setError(errorMessage)
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const renderFiltros = () => {
    return (
      <div className="space-y-4">
        <div>
          <Label htmlFor="tipo">Tipo de Relatório</Label>
          <Select
            value={tipoRelatorio}
            onValueChange={(value) => {
              setTipoRelatorio(value)
              // Reset filtros quando mudar tipo
              setStatus("todos")
              setClienteId("todos")
              setCategoriaId("todos")
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione o tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="clientes">Relatório de Clientes</SelectItem>
              <SelectItem value="produtos">Relatório de Produtos</SelectItem>
              <SelectItem value="orcamentos">Relatório de Orçamentos</SelectItem>
              <SelectItem value="financeiro">Relatório Financeiro</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {(tipoRelatorio === "orcamentos" || tipoRelatorio === "financeiro") && (
          <div>
            <Label htmlFor="status">Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                {tipoRelatorio === "orcamentos" && (
                  <>
                    <SelectItem value="pendente">Pendentes</SelectItem>
                    <SelectItem value="aprovado">Aprovados</SelectItem>
                    <SelectItem value="rejeitado">Rejeitados</SelectItem>
                  </>
                )}
                {tipoRelatorio === "financeiro" && (
                  <>
                    <SelectItem value="pendente">Pendentes</SelectItem>
                    <SelectItem value="pago">Pagos</SelectItem>
                    <SelectItem value="vencidos">Vencidos</SelectItem>
                    <SelectItem value="vencer">A Vencer (7 dias)</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
          </div>
        )}

        {tipoRelatorio === "produtos" && (
          <>
            <div>
              <Label htmlFor="categoria">Tipo de Produto</Label>
              <Select value={categoriaId} onValueChange={setCategoriaId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  {tipos.map((tipo) => (
                    <SelectItem key={tipo.id} value={tipo.id.toString()}>
                      {tipo.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="status">Situação do Estoque</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a situação" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="baixo_estoque">Baixo Estoque</SelectItem>
                  <SelectItem value="sem_estoque">Sem Estoque</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        )}

        {(tipoRelatorio === "clientes" || tipoRelatorio === "orcamentos" || tipoRelatorio === "financeiro") && (
          <div>
            <Label htmlFor="cliente">Cliente</Label>
            <Select value={clienteId} onValueChange={setClienteId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o cliente" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                {clientes.map((cliente) => (
                  <SelectItem key={cliente.id} value={cliente.id.toString()}>
                    {cliente.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
    )
  }

  const renderClientes = () => {
    if (!relatorioData?.clientes) return null

    return (
      <Card className="border-0 shadow-lg bg-white">
        <CardHeader>
          <CardTitle>Clientes ({relatorioData.total || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {relatorioData.clientes.map((cliente: any) => (
              <div key={cliente.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="font-medium">{cliente.nome}</div>
                  <div className="text-sm text-gray-600">{cliente.email}</div>
                  <div className="text-xs text-gray-500">
                    {cliente.cidade}, {cliente.estado}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">{cliente.total_orcamentos} orçamentos</div>
                  <div className="text-sm text-green-600">{formatCurrency(cliente.valor_orcamentos || 0)}</div>
                  <div className="text-xs text-gray-500">{cliente.total_boletos} boletos</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  const renderProdutos = () => {
    if (!relatorioData?.produtos) return null

    return (
      <Card className="border-0 shadow-lg bg-white">
        <CardHeader>
          <CardTitle>Produtos ({relatorioData.total || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {relatorioData.produtos.map((produto: any) => (
              <div key={produto.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="font-medium">{produto.nome}</div>
                  <div className="text-sm text-gray-600">
                    {produto.tipo} - {produto.marca}
                  </div>
                  <div className="text-xs text-gray-500">Código: {produto.codigo}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">{formatCurrency(produto.preco_venda || 0)}</div>
                  <div className="text-sm">Estoque: {produto.estoque_atual}</div>
                  <div className="text-xs text-gray-500">Vendido: {produto.quantidade_vendida}x</div>
                  {produto.estoque_atual <= produto.estoque_minimo && (
                    <Badge variant="destructive" className="text-xs">
                      Baixo Estoque
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  const renderOrcamentos = () => {
    if (!relatorioData?.orcamentos) return null

    return (
      <>
        {/* Estatísticas */}
        <Card className="border-0 shadow-lg bg-white">
          <CardHeader>
            <CardTitle>Estatísticas de Orçamentos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-800">{relatorioData.total || 0}</div>
                <div className="text-sm text-blue-600">Total</div>
                <div className="text-xs text-blue-500">{formatCurrency(relatorioData.valorTotal || 0)}</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-800">{relatorioData.estatisticas?.aprovados || 0}</div>
                <div className="text-sm text-green-600">Aprovados</div>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-800">{relatorioData.estatisticas?.pendentes || 0}</div>
                <div className="text-sm text-yellow-600">Pendentes</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-800">{relatorioData.estatisticas?.rejeitados || 0}</div>
                <div className="text-sm text-red-600">Rejeitados</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Orçamentos */}
        <Card className="border-0 shadow-lg bg-white">
          <CardHeader>
            <CardTitle>Orçamentos ({relatorioData.total || 0})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {(relatorioData.orcamentos as any[]).map((orcamento: any) => (
                <div key={orcamento.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">#{orcamento.numero}</div>
                    <div className="text-sm text-gray-600">{orcamento.cliente_nome}</div>
                    <div className="text-xs text-gray-500">{formatDate(orcamento.created_at)}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">{formatCurrency(orcamento.valor_total || 0)}</div>
                    <div className="text-xs text-gray-500">{orcamento.total_itens} itens</div>
                    <Badge
                      variant={
                        orcamento.situacao === "aprovado"
                          ? "default"
                          : orcamento.situacao === "pendente"
                            ? "secondary"
                            : "destructive"
                      }
                      className="text-xs"
                    >
                      {orcamento.situacao}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </>
    )
  }

  const renderFinanceiro = () => {
    if (!relatorioData?.boletos) return null

    return (
      <>
        {/* Estatísticas Financeiras */}
        <Card className="border-0 shadow-lg bg-white">
          <CardHeader>
            <CardTitle>Estatísticas Financeiras</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-6 bg-green-50 rounded-lg border border-green-200">
                <div className="text-3xl font-bold text-green-800 mb-2">{relatorioData.estatisticas?.pagos || 0}</div>
                <div className="text-sm text-green-600 mb-1">Boletos Pagos</div>
                <div className="text-lg font-bold text-green-700">
                  {formatCurrency(relatorioData.estatisticas?.valorPago || 0)}
                </div>
              </div>

              <div className="text-center p-6 bg-red-50 rounded-lg border border-red-200">
                <div className="text-3xl font-bold text-red-800 mb-2">{relatorioData.estatisticas?.vencidos || 0}</div>
                <div className="text-sm text-red-600 mb-1">Boletos Vencidos</div>
                <div className="text-lg font-bold text-red-700">
                  {formatCurrency(relatorioData.estatisticas?.valorVencido || 0)}
                </div>
              </div>

              <div className="text-center p-6 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="text-3xl font-bold text-yellow-800 mb-2">
                  {relatorioData.estatisticas?.pendentes || 0}
                </div>
                <div className="text-sm text-yellow-600 mb-1">Boletos Pendentes</div>
                <div className="text-lg font-bold text-yellow-700">
                  {formatCurrency(relatorioData.estatisticas?.valorPendente || 0)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Boletos */}
        <Card className="border-0 shadow-lg bg-white">
          <CardHeader>
            <CardTitle>Boletos ({relatorioData.total || 0})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {(relatorioData.boletos as any[]).map((boleto: any) => (
                <div key={boleto.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">#{boleto.numero}</div>
                    <div className="text-sm text-gray-600">{boleto.cliente_nome}</div>
                    <div className="text-xs text-gray-500">Venc: {formatDate(boleto.data_vencimento)}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">{formatCurrency(boleto.valor || 0)}</div>
                    {boleto.data_pagamento && (
                      <div className="text-xs text-green-600">Pago em {formatDate(boleto.data_pagamento)}</div>
                    )}
                    <Badge
                      variant={
                        boleto.status === "pago" ? "default" : boleto.dias_vencimento > 0 ? "destructive" : "secondary"
                      }
                      className="text-xs"
                    >
                      {boleto.status === "pago"
                        ? "Pago"
                        : boleto.dias_vencimento > 0
                          ? `Vencido (${boleto.dias_vencimento}d)`
                          : "Pendente"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          {logoMenu && (
            <img
              src={logoMenu || "/placeholder.svg"}
              alt="Logo"
              className="h-12 w-12 object-contain rounded-lg shadow-md bg-white p-1"
            />
          )}
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Relatórios
            </h1>
            <p className="text-gray-600 mt-1">Análises e estatísticas do sistema</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Filtros */}
          <div className="lg:col-span-1">
            <Card className="border-0 shadow-lg bg-white sticky top-6">
              <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-t-lg p-4 lg:p-6">
                <CardTitle className="text-white flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Filtros
                </CardTitle>
                <CardDescription className="text-blue-100">Configure os parâmetros do relatório</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                {renderFiltros()}

                <Button
                  onClick={gerarRelatorio}
                  disabled={loading}
                  className="w-full mt-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
                >
                  {loading ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <BarChart className="h-4 w-4 mr-2" />
                  )}
                  {loading ? "Gerando..." : "Gerar Relatório"}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Resultados */}
          <div className="lg:col-span-2 space-y-6">
            {error && (
              <Card className="border-red-200 bg-red-50">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 text-red-800">
                    <AlertCircle className="h-5 w-5" />
                    <div>
                      <h3 className="font-medium">Erro ao gerar relatório</h3>
                      <p className="text-sm mt-1">{error}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {loading && (
              <Card className="border-0 shadow-lg bg-white">
                <CardContent className="p-12 text-center">
                  <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <h3 className="text-xl font-medium text-gray-900 mb-2">Gerando relatório...</h3>
                  <p className="text-gray-600">Aguarde enquanto processamos os dados</p>
                </CardContent>
              </Card>
            )}

            {relatorioData && !error && !loading && (
              <>
                {tipoRelatorio === "clientes" && renderClientes()}
                {tipoRelatorio === "produtos" && renderProdutos()}
                {tipoRelatorio === "orcamentos" && renderOrcamentos()}
                {tipoRelatorio === "financeiro" && renderFinanceiro()}
              </>
            )}

            {!relatorioData && !error && !loading && (
              <Card className="border-0 shadow-lg bg-white">
                <CardContent className="p-12 text-center">
                  <BarChart className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                  <h3 className="text-xl font-medium text-gray-900 mb-2">Nenhum relatório gerado</h3>
                  <p className="text-gray-600 mb-6">Configure os filtros e clique em "Gerar Relatório"</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
