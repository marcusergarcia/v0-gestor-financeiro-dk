"use client"

import { TableBody } from "@/components/ui/table"
import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Table, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  MapPin,
  Phone,
  Mail,
  FileText,
  Wrench,
  CheckCircle,
  XCircle,
  AlertCircle,
  PlayCircle,
  Edit,
  Printer,
  Camera,
  PenTool,
  UserCheck,
} from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import Link from "next/link"
import { OrdemServicoPrint } from "@/components/ordem-servico-print"

interface Cliente {
  id: number
  nome: string
  codigo?: string
  cnpj?: string
  cpf?: string
  email?: string
  telefone?: string
  endereco?: string
  bairro?: string
  cidade?: string
  estado?: string
  cep?: string
  distancia_km?: number
}

interface OrdemServicoItem {
  id: number
  equipamento_id?: number
  equipamento_nome: string
  equipamento_nome_atual?: string
  categoria?: string
  valor_hora?: number
  quantidade: number
  observacoes?: string
  situacao: string
  created_at: string
  updated_at: string
}

interface OrdemServicoFoto {
  id: number
  nome_arquivo: string
  caminho: string
  caminho_arquivo?: string
  descricao?: string
  data_upload?: string
  created_at?: string
}

interface OrdemServicoAssinatura {
  id: number
  tipo: "cliente" | "tecnico" | "responsavel"
  tipo_assinatura?: "cliente" | "tecnico" | "responsavel"
  nome: string
  nome_assinante?: string
  caminho: string
  caminho_arquivo?: string
  assinatura_base64?: string
  data_assinatura: string
}

export default function VisualizarOrdemServicoPage() {
  const params = useParams()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [ordemServico, setOrdemServico] = useState<any>(null)
  const [cliente, setCliente] = useState<Cliente | null>(null)
  const [itens, setItens] = useState<OrdemServicoItem[]>([])
  const [fotos, setFotos] = useState<OrdemServicoFoto[]>([])
  const [assinaturas, setAssinaturas] = useState<OrdemServicoAssinatura[]>([])
  const [logoMenu, setLogoMenu] = useState<string | null>(null)
  const [showPrintModal, setShowPrintModal] = useState(false)

  useEffect(() => {
    if (params.id) {
      carregarDados()
    }
  }, [params.id])

  const carregarDados = async () => {
    try {
      setLoading(true)

      // Carregar logo do menu
      const logoResponse = await fetch("/api/configuracoes/logos")
      const logoResult = await logoResponse.json()

      if (logoResult.success && logoResult.data) {
        const logoMenuData = logoResult.data.find((logo: any) => logo.tipo === "menu")
        if (logoMenuData && logoMenuData.caminho) {
          setLogoMenu(logoMenuData.caminho)
        }
      }

      // Carregar ordem de serviço
      const osResponse = await fetch(`/api/ordens-servico/${params.id}`)
      const osData = await osResponse.json()

      if (osData.success) {
        console.log("Ordem de serviço carregada:", osData.data)
        setOrdemServico(osData.data)

        // Carregar dados do cliente se tiver cliente_id
        if (osData.data.cliente_id) {
          const clienteResponse = await fetch(`/api/clientes/${osData.data.cliente_id}`)
          const clienteData = await clienteResponse.json()

          if (clienteData.success && clienteData.data) {
            console.log("Cliente carregado:", clienteData.data)
            setCliente(clienteData.data)
          }
        }
      }

      // Carregar itens
      const itensResponse = await fetch(`/api/ordens-servico/${params.id}/itens`)
      const itensData = await itensResponse.json()

      if (itensData.success) {
        console.log("Itens carregados:", itensData.data)
        setItens(itensData.data)
      }

      // Carregar fotos
      const fotosResponse = await fetch(`/api/ordens-servico/${params.id}/fotos`)
      const fotosData = await fotosResponse.json()

      if (fotosData.success) {
        console.log("Fotos carregadas:", fotosData.data)
        setFotos(fotosData.data)
      }

      // Carregar assinaturas
      const assinaturasResponse = await fetch(`/api/ordens-servico/${params.id}/assinaturas`)
      const assinaturasData = await assinaturasResponse.json()

      if (assinaturasData.success) {
        console.log("Assinaturas carregadas:", assinaturasData.data)
        setAssinaturas(assinaturasData.data)
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (situacao: string) => {
    switch (situacao) {
      case "rascunho":
        return (
          <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-200">
            <AlertCircle className="w-3 h-3 mr-1" />
            Rascunho
          </Badge>
        )
      case "aberta":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">
            <Clock className="w-3 h-3 mr-1" />
            Aberta
          </Badge>
        )
      case "agendada":
        return (
          <Badge className="bg-cyan-100 text-cyan-800 hover:bg-cyan-200">
            <Calendar className="w-3 h-3 mr-1" />
            Agendada
          </Badge>
        )
      case "em_andamento":
        return (
          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">
            <PlayCircle className="w-3 h-3 mr-1" />
            Em Andamento
          </Badge>
        )
      case "concluida":
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
            <CheckCircle className="w-3 h-3 mr-1" />
            Concluída
          </Badge>
        )
      case "cancelada":
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-200">
            <XCircle className="w-3 h-3 mr-1" />
            Cancelada
          </Badge>
        )
      default:
        return (
          <Badge variant="secondary">
            <AlertCircle className="w-3 h-3 mr-1" />
            Indefinido
          </Badge>
        )
    }
  }

  const getTipoServicoLabel = (tipo: string) => {
    switch (tipo) {
      case "manutencao":
        return "Manutenção"
      case "orcamento":
        return "Orçamento"
      case "vistoria_contrato":
        return "Vistoria para Contrato"
      case "preventiva":
        return "Preventiva"
      default:
        return tipo
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)
  }

  const formatDateTime = (dateString: string | null | undefined) => {
    if (!dateString) return "-"
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return "-"
      return date.toLocaleString("pt-BR")
    } catch {
      return "-"
    }
  }

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "Não informada"
    try {
      // Remove qualquer parte de hora se existir
      const dateOnly = dateString.split("T")[0]
      const [year, month, day] = dateOnly.split("-")

      // Cria a data usando os componentes individuais
      const date = new Date(Number.parseInt(year), Number.parseInt(month) - 1, Number.parseInt(day))

      if (isNaN(date.getTime())) return "Data inválida"

      return date.toLocaleDateString("pt-BR")
    } catch {
      return "Data inválida"
    }
  }

  const formatTime = (timeString: string | null | undefined) => {
    if (!timeString) return "-"
    return timeString
  }

  const handlePrint = () => {
    setShowPrintModal(true)
  }

  const getClienteNome = () => {
    return cliente?.nome || ordemServico?.cliente?.nome || ordemServico?.cliente_nome || "Cliente não informado"
  }

  const getClienteTelefone = () => {
    return cliente?.telefone || ordemServico?.cliente?.telefone || ordemServico?.cliente_telefone || null
  }

  const getClienteEmail = () => {
    return cliente?.email || ordemServico?.cliente?.email || ordemServico?.cliente_email || null
  }

  const getClienteEndereco = () => {
    return cliente?.endereco || ordemServico?.cliente?.endereco || ordemServico?.cliente_endereco || null
  }

  const getClienteBairro = () => {
    return cliente?.bairro || ordemServico?.cliente?.bairro || null
  }

  const getClienteCidade = () => {
    return cliente?.cidade || ordemServico?.cliente?.cidade || ordemServico?.cliente_cidade || null
  }

  const getClienteEstado = () => {
    return cliente?.estado || ordemServico?.cliente?.estado || ordemServico?.cliente_estado || null
  }

  const getClienteCep = () => {
    return cliente?.cep || ordemServico?.cliente?.cep || null
  }

  const getEnderecoCompleto = () => {
    const endereco = getClienteEndereco()
    const bairro = getClienteBairro()
    const cidade = getClienteCidade()
    const estado = getClienteEstado()
    const cep = getClienteCep()

    if (!endereco) return null

    let enderecoCompleto = endereco

    if (bairro) {
      enderecoCompleto += `, ${bairro}`
    }

    if (cidade || estado) {
      enderecoCompleto += ` - ${cidade || ""}${estado ? `/${estado}` : ""}`
    }

    if (cep) {
      enderecoCompleto += ` - CEP: ${cep}`
    }

    return enderecoCompleto
  }

  const getAssinaturaCaminho = (assinatura: any) => {
    return assinatura?.caminho || assinatura?.caminho_arquivo || assinatura?.assinatura_base64 || ""
  }

  const getAssinaturaNome = (assinatura: any) => {
    return assinatura?.nome || assinatura?.nome_assinante || ""
  }

  const getAssinaturaTipo = (assinatura: any) => {
    const tipo = assinatura?.tipo || assinatura?.tipo_assinatura
    return tipo === "responsavel" || tipo === "cliente" ? "responsavel" : "tecnico"
  }

  const getFotoCaminho = (foto: any) => {
    return foto?.caminho || foto?.caminho_arquivo || ""
  }

  if (loading) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 bg-gradient-to-br from-slate-50 to-orange-50/30">
        <div className="flex items-center gap-3 mb-6">
          <Skeleton className="h-8 w-8" />
          <div>
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-48 mt-2" />
          </div>
        </div>
        <div className="grid gap-6">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    )
  }

  if (!ordemServico) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 bg-gradient-to-br from-slate-50 to-orange-50/30">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900">Ordem de Serviço não encontrada</h2>
          <p className="text-gray-600 mt-2">A ordem de serviço solicitada não existe ou foi removida.</p>
          <Link href="/ordem-servico">
            <Button className="mt-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para Ordens de Serviço
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 bg-gradient-to-br from-slate-50 to-orange-50/30">
      <div className="flex items-center gap-3 mb-6">
        {logoMenu && <img src={logoMenu || "/placeholder.svg"} alt="Logo" className="h-8 w-8 object-contain rounded" />}
        <div className="flex-1">
          <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
            Ordem de Serviço #{ordemServico.numero}
          </h2>
          <p className="text-muted-foreground">Visualizar detalhes da ordem de serviço</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handlePrint} className="print:hidden bg-transparent">
            <Printer className="h-4 w-4 mr-2" />
            Imprimir
          </Button>
          <Link href={`/ordem-servico/${ordemServico.id}/editar`}>
            <Button className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700">
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Button>
          </Link>
          <Link href="/ordem-servico">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Informações Gerais */}
        <Card className="bg-white/60 backdrop-blur-sm border-white/20 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-t-lg p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wrench className="h-5 w-5" />
                <div>
                  <CardTitle>Informações Gerais</CardTitle>
                  <CardDescription className="text-orange-100">Dados principais da ordem de serviço</CardDescription>
                </div>
              </div>
              {getStatusBadge(ordemServico.situacao)}
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-orange-600" />
                  <span className="font-medium">Data de Criação:</span>
                  <span>
                    {ordemServico.data_atual
                      ? new Date(ordemServico.data_atual.split("T")[0] + "T12:00:00").toLocaleDateString("pt-BR")
                      : "Não informada"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-orange-600" />
                  <span className="font-medium">Cliente:</span>
                  <span>{getClienteNome()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Wrench className="h-4 w-4 text-orange-600" />
                  <span className="font-medium">Tipo de Serviço:</span>
                  <span>{getTipoServicoLabel(ordemServico.tipo_servico)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-orange-600" />
                  <span className="font-medium">Técnico:</span>
                  <span>{ordemServico.tecnico_name || "Técnico não informado"}</span>
                </div>
                {ordemServico.data_agendamento && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-orange-600" />
                    <span className="font-medium">Data Agendamento:</span>
                    <span>{formatDate(ordemServico.data_agendamento)}</span>
                  </div>
                )}
                {ordemServico.horario_entrada && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-orange-600" />
                    <span className="font-medium">Horário Entrada:</span>
                    <span>{formatTime(ordemServico.horario_entrada)}</span>
                  </div>
                )}
                {ordemServico.horario_saida && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-orange-600" />
                    <span className="font-medium">Horário Saída:</span>
                    <span>{formatTime(ordemServico.horario_saida)}</span>
                  </div>
                )}
                {ordemServico.solicitado_por && (
                  <div className="flex items-center gap-2">
                    <UserCheck className="h-4 w-4 text-orange-600" />
                    <span className="font-medium">Solicitado por:</span>
                    <span>{ordemServico.solicitado_por}</span>
                  </div>
                )}
              </div>
              <div className="space-y-4">
                {getEnderecoCompleto() && (
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-orange-600 mt-0.5" />
                    <div>
                      <span className="font-medium">Endereço:</span>
                      <p className="text-sm text-gray-600">{getEnderecoCompleto()}</p>
                    </div>
                  </div>
                )}
                {getClienteTelefone() && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-orange-600" />
                    <span className="font-medium">Telefone:</span>
                    <span>{getClienteTelefone()}</span>
                  </div>
                )}
                {getClienteEmail() && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-orange-600" />
                    <span className="font-medium">Email:</span>
                    <span>{getClienteEmail()}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Descrições e Observações */}
            {ordemServico.descricao_defeito && ordemServico.tipo_servico !== "preventiva" && (
              <>
                <Separator className="my-4" />
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="h-4 w-4 text-orange-600" />
                    <span className="font-medium">Descrição do Defeito:</span>
                  </div>
                  <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg whitespace-pre-wrap">
                    {ordemServico.descricao_defeito}
                  </p>
                </div>
              </>
            )}

            {ordemServico.necessidades_cliente && ordemServico.tipo_servico === "preventiva" && (
              <>
                <Separator className="my-4" />
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <User className="h-4 w-4 text-orange-600" />
                    <span className="font-medium">Necessidades do Cliente:</span>
                  </div>
                  <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg whitespace-pre-wrap">
                    {ordemServico.necessidades_cliente}
                  </p>
                </div>
              </>
            )}

            {ordemServico.servico_realizado && ordemServico.tipo_servico !== "preventiva" && (
              <>
                <Separator className="my-4" />
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Wrench className="h-4 w-4 text-orange-600" />
                    <span className="font-medium">Serviço Realizado:</span>
                  </div>
                  <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg whitespace-pre-wrap">
                    {ordemServico.servico_realizado}
                  </p>
                </div>
              </>
            )}

            {ordemServico.relatorio_visita && (
              <>
                <Separator className="my-4" />
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="h-4 w-4 text-orange-600" />
                    <span className="font-medium">Relatório da Visita:</span>
                  </div>
                  <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg whitespace-pre-wrap">
                    {ordemServico.relatorio_visita}
                  </p>
                </div>
              </>
            )}

            {ordemServico.observacoes && ordemServico.tipo_servico !== "preventiva" && (
              <>
                <Separator className="my-4" />
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="h-4 w-4 text-orange-600" />
                    <span className="font-medium">Observações:</span>
                  </div>
                  <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg whitespace-pre-wrap">
                    {ordemServico.observacoes}
                  </p>
                </div>
              </>
            )}

            {/* Responsável */}
            {(ordemServico.responsavel || ordemServico.nome_responsavel) && (
              <>
                <Separator className="my-4" />
                <div className="grid md:grid-cols-2 gap-4">
                  {ordemServico.responsavel && (
                    <div className="flex items-center gap-2">
                      <UserCheck className="h-4 w-4 text-orange-600" />
                      <span className="font-medium">Responsável:</span>
                      <span>{ordemServico.responsavel}</span>
                    </div>
                  )}
                  {ordemServico.nome_responsavel && (
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-orange-600" />
                      <span className="font-medium">Nome do Responsável:</span>
                      <span>{ordemServico.nome_responsavel}</span>
                    </div>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Equipamentos da Ordem de Serviço */}
        {itens.length > 0 && (
          <Card className="bg-white/60 backdrop-blur-sm border-white/20 shadow-xl">
            <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-t-lg p-4 lg:p-6">
              <CardTitle className="flex items-center gap-2">
                <Wrench className="h-5 w-5" />
                Equipamentos da Ordem de Serviço
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Equipamento</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {itens.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="font-medium">{item.equipamento_nome_atual || item.equipamento_nome}</div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Fotos */}
        {fotos.length > 0 && (
          <Card className="bg-white/60 backdrop-blur-sm border-white/20 shadow-xl">
            <CardHeader className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-t-lg p-4 lg:p-6">
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5" />
                Fotos da Ordem de Serviço
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {fotos.map((foto) => (
                  <div key={foto.id} className="space-y-2">
                    <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                      <img
                        src={getFotoCaminho(foto) || "/placeholder.svg"}
                        alt={foto.nome_arquivo}
                        className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
                        onClick={() => window.open(getFotoCaminho(foto), "_blank")}
                      />
                    </div>
                    <div className="text-xs text-gray-600">
                      <p className="font-medium truncate">{foto.nome_arquivo}</p>
                      {foto.descricao && <p className="truncate">{foto.descricao}</p>}
                      <p>{formatDateTime(foto.data_upload || foto.created_at)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Assinaturas */}
        {assinaturas.length > 0 && (
          <Card className="bg-white/60 backdrop-blur-sm border-white/20 shadow-xl">
            <CardHeader className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-t-lg p-4 lg:p-6">
              <CardTitle className="flex items-center gap-2">
                <PenTool className="h-5 w-5" />
                Assinaturas
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid md:grid-cols-2 gap-6">
                {assinaturas.map((assinatura) => (
                  <div key={assinatura.id} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant={getAssinaturaTipo(assinatura) === "responsavel" ? "default" : "secondary"}>
                        {getAssinaturaTipo(assinatura) === "responsavel" ? "Responsável" : "Técnico"}
                      </Badge>
                      <span className="font-medium">{getAssinaturaNome(assinatura)}</span>
                    </div>
                    <div className="border rounded-lg p-4 bg-white">
                      <img
                        src={getAssinaturaCaminho(assinatura) || "/placeholder.svg"}
                        alt={`Assinatura de ${getAssinaturaNome(assinatura)}`}
                        className="max-w-full h-24 object-contain"
                      />
                    </div>
                    <p className="text-xs text-gray-600">Assinado em: {formatDateTime(assinatura.data_assinatura)}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Modal de Impressão */}
      {showPrintModal && (
        <OrdemServicoPrint
          ordemServico={ordemServico}
          itens={itens}
          fotos={fotos}
          assinaturas={assinaturas}
          onClose={() => setShowPrintModal(false)}
        />
      )}
    </div>
  )
}
