"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Printer, Edit, Trash2 } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { ContratoPrintEditor } from "@/components/contrato-print-editor"

interface Contrato {
  numero: string
  cliente_id: number
  proposta_id: string
  quantidade_visitas: number
  data_inicio: string
  data_fim: string
  valor_mensal: number
  frequencia: string
  dia_vencimento: number
  forma_pagamento: string
  equipamentos_inclusos: any[]
  servicos_inclusos: string
  observacoes: string
  status: string
  data_proposta: string
  prazo_meses: number
  conteudo_contrato: string
  // Dados do cliente
  cliente_nome: string
  cliente_codigo: string
  cliente_cnpj: string
  cliente_cpf: string
  cliente_email: string
  cliente_telefone: string
  cliente_endereco: string
  cliente_bairro: string
  cliente_cidade: string
  cliente_estado: string
  cliente_cep: string
  cliente_sindico: string
  cliente_rg_sindico: string
  cliente_cpf_sindico: string
  // Dados da proposta
  proposta_numero: string
  proposta_tipo: string
  valor_total_proposta: number
  proposta_desconto: number
  prazo_contrato: number
  // Itens da proposta
  itens_proposta: any[]
}

export default function ContratoPage() {
  const params = useParams()
  const router = useRouter()
  const [contrato, setContrato] = useState<Contrato | null>(null)
  const [loading, setLoading] = useState(true)
  const [showEditor, setShowEditor] = useState(false)
  const [conteudoFormatado, setConteudoFormatado] = useState("")

  const numero = params?.numero as string

  useEffect(() => {
    if (numero) {
      fetchContrato()
    }
  }, [numero])

  useEffect(() => {
    if (contrato && contrato.conteudo_contrato) {
      formatarConteudo()
    }
  }, [contrato])

  const fetchContrato = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/contratos/${numero}`)
      const result = await response.json()

      if (result.success) {
        setContrato(result.data)
      } else {
        toast({
          title: "Erro",
          description: result.message || "Erro ao carregar contrato",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Erro ao buscar contrato:", error)
      toast({
        title: "Erro",
        description: "Erro ao carregar contrato",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const formatarConteudo = async () => {
    if (!contrato || !contrato.conteudo_contrato) return

    try {
      // Buscar dados do timbrado
      const timbradoResponse = await fetch("/api/timbrado-config")
      const timbradoResult = await timbradoResponse.json()
      const timbradoConfig = timbradoResult.success ? timbradoResult.data : {}

      let conteudo = contrato.conteudo_contrato

      // Substituir campos da empresa (timbrado_config)
      conteudo = conteudo.replace(/\[EMPRESA_NOME\]/g, timbradoConfig.empresa_nome || "[EMPRESA_NOME]")
      conteudo = conteudo.replace(/\[EMPRESA_CNPJ\]/g, timbradoConfig.empresa_cnpj || "[EMPRESA_CNPJ]")
      conteudo = conteudo.replace(/\[EMPRESA_CEP\]/g, timbradoConfig.empresa_cep || "[EMPRESA_CEP]")
      conteudo = conteudo.replace(/\[EMPRESA_BAIRRO\]/g, timbradoConfig.empresa_bairro || "[EMPRESA_BAIRRO]")
      conteudo = conteudo.replace(/\[EMPRESA_CIDADE\]/g, timbradoConfig.empresa_cidade || "[EMPRESA_CIDADE]")
      conteudo = conteudo.replace(/\[EMPRESA_UF\]/g, timbradoConfig.empresa_uf || "[EMPRESA_UF]")
      conteudo = conteudo.replace(
        /\[EMPRESA_REPRESENTANTE_LEGAL\]/g,
        timbradoConfig.empresa_representante_legal || "[EMPRESA_REPRESENTANTE_LEGAL]",
      )
      conteudo = conteudo.replace(
        /\[REPRESENTANTE_NACIONALIDADE\]/g,
        timbradoConfig.representante_nacionalidade || "[REPRESENTANTE_NACIONALIDADE]",
      )
      conteudo = conteudo.replace(
        /\[REPRESENTANTE_ESTADO_CIVIL\]/g,
        timbradoConfig.representante_estado_civil || "[REPRESENTANTE_ESTADO_CIVIL]",
      )
      conteudo = conteudo.replace(/\[REPRESENTANTE_RG\]/g, timbradoConfig.representante_rg || "[REPRESENTANTE_RG]")
      conteudo = conteudo.replace(/\[REPRESENTANTE_CPF\]/g, timbradoConfig.representante_cpf || "[REPRESENTANTE_CPF]")

      // Substituir campos do cliente
      conteudo = conteudo.replace(/\[NOME\]/g, contrato.cliente_nome || "[NOME]")
      conteudo = conteudo.replace(/\[CNPJ\]/g, contrato.cliente_cnpj || contrato.cliente_cpf || "[CNPJ/CPF]")
      conteudo = conteudo.replace(/\[ENDERECO\]/g, contrato.cliente_endereco || "[ENDERECO]")
      conteudo = conteudo.replace(/\[CEP\]/g, contrato.cliente_cep || "[CEP]")
      conteudo = conteudo.replace(/\[BAIRRO\]/g, contrato.cliente_bairro || "[BAIRRO]")
      conteudo = conteudo.replace(/\[CIDADE\]/g, contrato.cliente_cidade || "[CIDADE]")
      conteudo = conteudo.replace(/\[ESTADO\]/g, contrato.cliente_estado || "[ESTADO]")
      conteudo = conteudo.replace(/\[SINDICO\]/g, contrato.cliente_sindico || "[SINDICO]")
      conteudo = conteudo.replace(/\[RG_SINDICO\]/g, contrato.cliente_rg_sindico || "[RG_SINDICO]")
      conteudo = conteudo.replace(/\[CPF_SINDICO\]/g, contrato.cliente_cpf_sindico || "[CPF_SINDICO]")

      // Substituir campos da proposta
      conteudo = conteudo.replace(/\[PRAZO_CONTRATO\]/g, contrato.prazo_contrato?.toString() || "[PRAZO_CONTRATO]")

      // Substituir campos do contrato
      conteudo = conteudo.replace(/\[DIA_VENCIMENTO\]/g, contrato.dia_vencimento?.toString() || "[DIA_VENCIMENTO]")
      conteudo = conteudo.replace(/\[DATA_INICIO\]/g, formatDate(contrato.data_inicio) || "[DATA_INICIO]")
      conteudo = conteudo.replace(/\[VALOR_MENSAL\]/g, formatCurrency(contrato.valor_mensal) || "[VALOR_MENSAL]")
      conteudo = conteudo.replace(
        /\[QUANTIDADE_VISITAS\]/g,
        contrato.quantidade_visitas?.toString() || "[QUANTIDADE_VISITAS]",
      )

      // Substituir equipamentos inclusos
      const equipamentosTexto =
        contrato.equipamentos_inclusos && contrato.equipamentos_inclusos.length > 0
          ? contrato.equipamentos_inclusos.map((eq: any) => (typeof eq === "string" ? eq : eq.nome || eq)).join(", ")
          : "Equipamentos conforme especificado na proposta"
      conteudo = conteudo.replace(/\[EQUIPAMENTOS_INCLUSOS\]/g, equipamentosTexto)

      // Formatação do texto
      conteudo = conteudo.replace(/\n\n/g, "</p><p>")
      conteudo = conteudo.replace(/\n/g, "<br>")
      conteudo = `<p>${conteudo}</p>`

      // Formatação de parágrafos específicos
      conteudo = conteudo.replace(
        /(CONTRATO DE CONSERVAÇÃO E PREVENÇÃO DE EQUIPAMENTOS ELETRÔNICOS)/g,
        '<h2 style="text-align: center; font-weight: bold; margin: 20px 0;">$1</h2>',
      )
      conteudo = conteudo.replace(
        /(CLÁUSULA [A-Z]+[^:]*:)/g,
        '<h3 style="font-weight: bold; margin: 15px 0 10px 0; color: #1f2937;">$1</h3>',
      )

      setConteudoFormatado(conteudo)
    } catch (error) {
      console.error("Erro ao formatar conteúdo:", error)
      setConteudoFormatado(contrato.conteudo_contrato)
    }
  }

  const handleDelete = async () => {
    if (!confirm("Tem certeza que deseja excluir este contrato?")) return

    try {
      const response = await fetch(`/api/contratos/${numero}`, {
        method: "DELETE",
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Sucesso",
          description: "Contrato excluído com sucesso",
        })
        router.push("/contratos")
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
        description: "Erro ao excluir contrato",
        variant: "destructive",
      })
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value || 0)
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return "-"
    return new Date(dateString + "T00:00:00").toLocaleDateString("pt-BR")
  }

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "ativo":
        return "bg-green-100 text-green-800"
      case "inativo":
        return "bg-red-100 text-red-800"
      case "suspenso":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Carregando contrato...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!contrato) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Contrato não encontrado</h1>
          <Button onClick={() => router.push("/contratos")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para Contratos
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={() => router.push("/contratos")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Contrato {contrato.numero}</h1>
            <p className="text-muted-foreground">Cliente: {contrato.cliente_nome}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Badge className={getStatusColor(contrato.status)}>{contrato.status?.toUpperCase() || "INDEFINIDO"}</Badge>
          <Button variant="outline" onClick={() => setShowEditor(true)}>
            <Printer className="mr-2 h-4 w-4" />
            Editor de Impressão
          </Button>
          <Button variant="outline" onClick={() => router.push(`/contratos/${numero}/editar`)}>
            <Edit className="mr-2 h-4 w-4" />
            Editar
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            <Trash2 className="mr-2 h-4 w-4" />
            Excluir
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="informacoes" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="informacoes">Informações</TabsTrigger>
          <TabsTrigger value="termo">Termo do Contrato</TabsTrigger>
          <TabsTrigger value="servicos">Serviços</TabsTrigger>
        </TabsList>

        {/* Aba Informações */}
        <TabsContent value="informacoes" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Dados do Cliente */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Dados do Cliente
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Nome</label>
                  <p className="font-medium">{contrato.cliente_nome}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Código</label>
                  <p>{contrato.cliente_codigo}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">CNPJ/CPF</label>
                  <p>{contrato.cliente_cnpj || contrato.cliente_cpf}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Email</label>
                  <p>{contrato.cliente_email || "-"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Telefone</label>
                  <p>{contrato.cliente_telefone || "-"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Endereço</label>
                  <p>{contrato.cliente_endereco || "-"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Cidade/Estado</label>
                  <p>
                    {contrato.cliente_cidade}/{contrato.cliente_estado}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">CEP</label>
                  <p>{contrato.cliente_cep || "-"}</p>
                </div>
                {contrato.cliente_sindico && (
                  <>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Síndico</label>
                      <p>{contrato.cliente_sindico}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">RG Síndico</label>
                      <p>{contrato.cliente_rg_sindico || "-"}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">CPF Síndico</label>
                      <p>{contrato.cliente_cpf_sindico || "-"}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Dados do Contrato */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                  Dados do Contrato
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Número</label>
                  <p className="font-medium">{contrato.numero}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <Badge className={getStatusColor(contrato.status)}>
                    {contrato.status?.toUpperCase() || "INDEFINIDO"}
                  </Badge>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Data de Início</label>
                  <p>{formatDate(contrato.data_inicio)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Data de Fim</label>
                  <p>{formatDate(contrato.data_fim)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Prazo (meses)</label>
                  <p>{contrato.prazo_meses} meses</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Valor Mensal</label>
                  <p className="font-medium text-green-600">{formatCurrency(contrato.valor_mensal)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Dia de Vencimento</label>
                  <p>Dia {contrato.dia_vencimento}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Forma de Pagamento</label>
                  <p className="capitalize">{contrato.forma_pagamento}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Frequência</label>
                  <p className="capitalize">{contrato.frequencia}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Quantidade de Visitas</label>
                  <p>{contrato.quantidade_visitas} visitas</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Dados da Proposta */}
          {contrato.proposta_id && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Dados da Proposta
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Número da Proposta</label>
                  <p className="font-medium">{contrato.proposta_numero}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Tipo</label>
                  <p className="capitalize">{contrato.proposta_tipo}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Prazo do Contrato</label>
                  <p>{contrato.prazo_contrato} meses</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Valor Total da Proposta</label>
                  <p className="font-medium text-green-600">{formatCurrency(contrato.valor_total_proposta)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Desconto</label>
                  <p className="font-medium text-red-600">{formatCurrency(contrato.proposta_desconto)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Data da Proposta</label>
                  <p>{formatDate(contrato.data_proposta)}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Aba Termo do Contrato */}
        <TabsContent value="termo" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                Termo do Contrato
              </CardTitle>
            </CardHeader>
            <CardContent>
              {conteudoFormatado ? (
                <div
                  className="prose prose-sm max-w-none text-justify leading-relaxed bg-white p-6 rounded-lg border shadow-sm"
                  style={{
                    fontSize: "14px",
                    lineHeight: "1.6",
                    fontFamily: "system-ui, -apple-system, sans-serif",
                  }}
                  dangerouslySetInnerHTML={{ __html: conteudoFormatado }}
                />
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">Termo do contrato não disponível</p>
                  <p className="text-sm text-muted-foreground">
                    O termo será carregado automaticamente da tabela de termos de contratos
                  </p>
                  <Button variant="outline" onClick={fetchContrato} className="mt-4 bg-transparent">
                    Recarregar
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba Serviços */}
        <TabsContent value="servicos" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Equipamentos Inclusos */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
                  Equipamentos Inclusos
                </CardTitle>
              </CardHeader>
              <CardContent>
                {contrato.equipamentos_inclusos && contrato.equipamentos_inclusos.length > 0 ? (
                  <ul className="space-y-2">
                    {contrato.equipamentos_inclusos.map((equipamento, index) => (
                      <li key={index} className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span>{equipamento.nome || equipamento}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted-foreground">Nenhum equipamento especificado</p>
                )}
              </CardContent>
            </Card>

            {/* Serviços Inclusos */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg bg-gradient-to-r from-teal-600 to-green-600 bg-clip-text text-transparent">
                  Serviços Inclusos
                </CardTitle>
              </CardHeader>
              <CardContent>
                {contrato.servicos_inclusos ? (
                  <div
                    className="prose max-w-none text-sm"
                    dangerouslySetInnerHTML={{ __html: contrato.servicos_inclusos }}
                  />
                ) : (
                  <p className="text-muted-foreground">Nenhum serviço especificado</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Itens da Proposta */}
          {contrato.itens_proposta && contrato.itens_proposta.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Itens da Proposta
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Equipamento</th>
                        <th className="text-left p-2">Categoria</th>
                        <th className="text-left p-2">Descrição</th>
                        <th className="text-right p-2">Quantidade</th>
                        <th className="text-right p-2">Valor Unit.</th>
                        <th className="text-right p-2">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {contrato.itens_proposta.map((item, index) => (
                        <tr key={index} className="border-b">
                          <td className="p-2">{item.equipamento_nome}</td>
                          <td className="p-2">{item.equipamento_categoria}</td>
                          <td className="p-2">{item.equipamento_descricao}</td>
                          <td className="p-2 text-right">{item.quantidade}</td>
                          <td className="p-2 text-right">{formatCurrency(item.valor_unitario)}</td>
                          <td className="p-2 text-right font-medium">{formatCurrency(item.valor_total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Observações */}
          {contrato.observacoes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                  Observações
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose max-w-none text-sm" dangerouslySetInnerHTML={{ __html: contrato.observacoes }} />
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Editor de Impressão */}
      {showEditor && <ContratoPrintEditor contrato={contrato} onClose={() => setShowEditor(false)} />}
    </div>
  )
}
