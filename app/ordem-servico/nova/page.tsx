"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"
import {
  ArrowLeft,
  Save,
  FileText,
  User,
  Clock,
  Package,
  CheckCircle,
  XCircle,
  Calendar,
  Shield,
  DollarSign,
  Plus,
  Trash2,
} from "lucide-react"
import { ClienteCombobox, type Cliente } from "@/components/cliente-combobox"
import { EquipamentoCombobox } from "@/components/equipamento-combobox"
import { useToast } from "@/hooks/use-toast"
import { ClienteFormDialog } from "@/components/cliente-form-dialog"

interface Equipamento {
  id: number
  nome: string
  descricao?: string
  categoria?: string
  valor_hora?: number
  ativo: boolean
}

interface EquipamentoContrato {
  id: string | number
  nome: string
  descricao?: string
  categoria?: string
  valor_hora?: number
  observacoes?: string
  do_contrato?: boolean
}

interface ContratoConservacao {
  numero: string
  id: number
  data_inicio: string
  data_fim: string
  status: string
  cliente_id: number
  valor_mensal?: number
  observacoes?: string
  equipamentos_inclusos?: string
  equipamentos_inclusos_parsed?: EquipamentoContrato[]
  frequencia?: string
  quantidade_visitas?: number
  prazo_meses?: number
}

interface EquipamentoSelecionado extends Equipamento {
  observacoes: string
  do_contrato?: boolean
}

export default function NovaOrdemServicoPage() {
  const router = useRouter()
  const { toast } = useToast()

  const [loading, setLoading] = useState(false)
  const [loadingContrato, setLoadingContrato] = useState(false)
  const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(null)
  const [contratoConservacao, setContratoConservacao] = useState<ContratoConservacao | null>(null)
  const [equipamentosSelecionados, setEquipamentosSelecionados] = useState<EquipamentoSelecionado[]>([])
  const [numeroOS, setNumeroOS] = useState("")
  const [showNovoClienteDialog, setShowNovoClienteDialog] = useState(false)
  const [desejaAgendar, setDesejaAgendar] = useState(false)

  const [formData, setFormData] = useState({
    tipo_servico: "manutencao",
    data_atual: new Date().toISOString().split("T")[0],
    solicitado_por: "",
    descricao_defeito: "",
    contrato_numero: "Cliente sem contrato",
    data_agendamento: "",
    periodo_agendamento: "" as "" | "manha" | "tarde",
  })

  // Gerar número da OS quando cliente for selecionado
  useEffect(() => {
    if (clienteSelecionado) {
      gerarNumeroOS()
    }
  }, [clienteSelecionado, formData.data_atual])

  // Preencher "Solicitado Por" automaticamente quando for preventiva
  useEffect(() => {
    if (formData.tipo_servico === "preventiva") {
      setFormData((prev) => ({
        ...prev,
        solicitado_por: "Contrato de Manutenção",
      }))
    }
  }, [formData.tipo_servico])

  // Carregar equipamentos do contrato apenas para preventiva
  useEffect(() => {
    if (contratoConservacao && formData.tipo_servico === "preventiva") {
      if (
        contratoConservacao.equipamentos_inclusos_parsed &&
        contratoConservacao.equipamentos_inclusos_parsed.length > 0
      ) {
        const equipamentosDoContrato = contratoConservacao.equipamentos_inclusos_parsed.map(
          (eq: EquipamentoContrato, index: number) => ({
            id: typeof eq.id === "string" ? Number.parseInt(eq.id.replace("temp_", "")) || 1000 + index : eq.id,
            nome: eq.nome,
            descricao: eq.descricao || "",
            categoria: eq.categoria || "Contrato",
            valor_hora: eq.valor_hora || 0,
            ativo: true,
            observacoes: eq.observacoes || "Equipamento incluído no contrato de conservação",
            do_contrato: true,
          }),
        )
        setEquipamentosSelecionados(equipamentosDoContrato)
      }
    } else {
      // Limpar equipamentos do contrato se não for preventiva
      setEquipamentosSelecionados([])
    }
  }, [contratoConservacao, formData.tipo_servico])

  const gerarNumeroOS = async () => {
    if (!clienteSelecionado) return

    try {
      const dataAtual = formData.data_atual || new Date().toISOString().split("T")[0]
      const response = await fetch(
        `/api/ordens-servico/proximo-numero?cliente_id=${clienteSelecionado.id}&data=${dataAtual}`,
      )
      const result = await response.json()

      if (result.success) {
        setNumeroOS(result.numero)
      }
    } catch (error) {
      console.error("Erro ao gerar número:", error)
    }
  }

  const buscarContratoConservacao = async (clienteId: number) => {
    try {
      setLoadingContrato(true)
      const response = await fetch(`/api/contratos-conservacao/cliente/${clienteId}`)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()

      if (result.success && result.data) {
        const contrato = result.data
        setContratoConservacao(contrato)

        setFormData((prev) => ({
          ...prev,
          contrato_numero: contrato.numero,
        }))

        toast({
          title: "Contrato encontrado!",
          description: `Contrato ${contrato.numero} carregado.`,
        })
      } else {
        setContratoConservacao(null)
        setFormData((prev) => ({
          ...prev,
          contrato_numero: "Cliente sem contrato",
        }))
        setEquipamentosSelecionados([])
      }
    } catch (error) {
      setContratoConservacao(null)
      setFormData((prev) => ({
        ...prev,
        contrato_numero: "Cliente sem contrato",
      }))
      setEquipamentosSelecionados([])
    } finally {
      setLoadingContrato(false)
    }
  }

  const handleClienteChange = (cliente: Cliente | null) => {
    setClienteSelecionado(cliente)
    setContratoConservacao(null)
    setEquipamentosSelecionados([])

    if (cliente) {
      buscarContratoConservacao(cliente.id)
    } else {
      setFormData((prev) => ({
        ...prev,
        contrato_numero: "Cliente sem contrato",
        tipo_servico: "manutencao",
      }))
    }
  }

  const handleEquipamentoSelect = (equipamento: Equipamento) => {
    const jaAdicionado = equipamentosSelecionados.find((eq) => eq.id === equipamento.id)
    if (jaAdicionado) {
      toast({
        title: "Equipamento já adicionado",
        description: "Este equipamento já está na lista.",
        variant: "destructive",
      })
      return
    }

    const novoEquipamento: EquipamentoSelecionado = {
      ...equipamento,
      observacoes: "",
      do_contrato: false,
    }

    setEquipamentosSelecionados((prev) => [...prev, novoEquipamento])

    toast({
      title: "Equipamento adicionado",
      description: `${equipamento.nome} foi adicionado à ordem de serviço.`,
    })
  }

  const removerEquipamento = (equipamentoId: number) => {
    setEquipamentosSelecionados((prev) => prev.filter((eq) => eq.id !== equipamentoId))
  }

  const formatarData = (data: string) => {
    return new Date(data).toLocaleDateString("pt-BR")
  }

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(valor)
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

  const handleSubmit = async () => {
    if (!clienteSelecionado) {
      toast({
        title: "Cliente obrigatório",
        description: "Selecione um cliente para continuar.",
        variant: "destructive",
      })
      return
    }

    if (
      !formData.tipo_servico ||
      !formData.data_atual ||
      !formData.solicitado_por ||
      (formData.tipo_servico !== "preventiva" && !formData.descricao_defeito)
    ) {
      toast({
        title: "Campos obrigatórios",
        description:
          formData.tipo_servico !== "preventiva"
            ? "Preencha todos os campos obrigatórios: Tipo de Serviço, Data, Solicitado Por e Descrição do Problema."
            : "Preencha todos os campos obrigatórios: Tipo de Serviço, Data e Solicitado Por.",
        variant: "destructive",
      })
      return
    }

    if (desejaAgendar && !formData.data_agendamento) {
      toast({
        title: "Data de agendamento obrigatória",
        description: "Informe a data de agendamento ou desmarque a opção 'Deseja agendar?'.",
        variant: "destructive",
      })
      return
    }

    if (desejaAgendar && !formData.periodo_agendamento) {
      toast({
        title: "Período obrigatório",
        description: "Selecione o período (Manhã ou Tarde) para o agendamento.",
        variant: "destructive",
      })
      return
    }

    try {
      setLoading(true)

      const ordemData = {
        numero: numeroOS,
        cliente_id: clienteSelecionado.id,
        contrato_id: contratoConservacao?.id || null,
        contrato_numero: formData.contrato_numero,
        tecnico_id: null,
        tecnico_name: "A definir",
        tecnico_email: null,
        solicitado_por: formData.solicitado_por,
        data_atual: formData.data_atual,
        data_agendamento: desejaAgendar ? formData.data_agendamento : null,
        periodo_agendamento: desejaAgendar ? formData.periodo_agendamento : null,
        data_execucao: null,
        horario_entrada: null,
        horario_saida: null,
        tipo_servico: formData.tipo_servico,
        relatorio_visita: null,
        descricao_defeito: formData.descricao_defeito,
        servico_realizado: null,
        observacoes: null,
        responsavel: null,
        nome_responsavel: null,
        situacao: desejaAgendar ? "agendada" : "aberta",
        equipamentos: equipamentosSelecionados.map((eq) => ({
          equipamento_id: eq.id,
          equipamento_nome: eq.nome,
          observacoes: eq.observacoes,
          situacao: "pendente",
        })),
      }

      console.log("Enviando dados:", ordemData)

      const response = await fetch("/api/ordens-servico", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ordemData),
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Ordem de serviço criada!",
          description: `OS ${numeroOS} criada com sucesso e está ${desejaAgendar ? "AGENDADA" : "ABERTA"} para execução.`,
        })
        router.push("/ordem-servico")
      } else {
        throw new Error(result.error || "Erro desconhecido")
      }
    } catch (error) {
      console.error("Erro completo:", error)
      toast({
        title: "Erro ao criar",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao criar a ordem de serviço.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleNovoClienteCriado = (novoCliente: any) => {
    // Converter o cliente para o formato esperado
    const clienteFormatado: Cliente = {
      id: novoCliente.id.toString(),
      codigo: novoCliente.codigo,
      nome: novoCliente.nome,
      cnpj: novoCliente.cnpj,
      cpf: novoCliente.cpf,
      email: novoCliente.email,
      telefone: novoCliente.telefone,
      endereco: novoCliente.endereco,
      bairro: novoCliente.bairro,
      cidade: novoCliente.cidade,
      estado: novoCliente.estado,
      cep: novoCliente.cep,
      distancia_km: novoCliente.distancia_km,
      nome_adm: novoCliente.nome_adm,
      contato_adm: novoCliente.contato_adm,
      telefone_adm: novoCliente.telefone_adm,
      email_adm: novoCliente.email_adm,
    }

    // Selecionar o cliente automaticamente
    handleClienteChange(clienteFormatado)

    toast({
      title: "Cliente criado!",
      description: "O cliente foi criado e selecionado automaticamente.",
    })
  }

  const clienteTemContrato = contratoConservacao !== null
  const isPreventiva = formData.tipo_servico === "preventiva"

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                Nova Ordem de Serviço
              </h1>
              <p className="text-gray-600 mt-1">Crie uma nova ordem de serviço</p>
              {numeroOS && (
                <div className="flex items-center gap-2 mt-2">
                  <FileText className="h-4 w-4 text-gray-500" />
                  <Badge variant="outline" className="font-mono text-sm">
                    Número: {numeroOS}
                  </Badge>
                  <Badge
                    className={
                      desejaAgendar
                        ? "bg-cyan-100 text-cyan-800 border-cyan-200"
                        : "bg-yellow-100 text-yellow-800 border-yellow-200"
                    }
                  >
                    <Clock className="h-3 w-3 mr-1" />
                    Será criada como {desejaAgendar ? "AGENDADA" : "ABERTA"}
                  </Badge>
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.back()} className="bg-transparent">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Formulário Principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Dados do Cliente */}
            <Card className="border-0 shadow-lg bg-white">
              <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-t-lg p-4 lg:p-6">
                <CardTitle className="text-white flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Dados do Cliente
                </CardTitle>
                <CardDescription className="text-blue-100">
                  Selecione o cliente e configure os parâmetros
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="cliente">Cliente *</Label>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <ClienteCombobox
                          value={clienteSelecionado}
                          onValueChange={handleClienteChange}
                          placeholder="Selecione um cliente..."
                        />
                      </div>
                      {!clienteSelecionado && (
                        <div className="flex items-end">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setShowNovoClienteDialog(true)}
                            className="bg-green-50 hover:bg-green-100 text-green-600 border-green-200 hover:border-green-300"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Novo Cliente
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  {clienteSelecionado && (
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center gap-2 mb-2">
                        {clienteSelecionado.codigo && (
                          <Badge variant="outline" className="font-mono">
                            {clienteSelecionado.codigo}
                          </Badge>
                        )}
                        <span className="font-medium text-blue-900">{clienteSelecionado.nome}</span>
                        {clienteTemContrato ? (
                          <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Com Contrato
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50">
                            <XCircle className="h-3 w-3 mr-1" />
                            Sem Contrato
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-gray-600">
                        <div>ID: {clienteSelecionado.id}</div>
                        {clienteSelecionado.cnpj && <div>CNPJ: {clienteSelecionado.cnpj}</div>}
                        {clienteSelecionado.cpf && <div>CPF: {clienteSelecionado.cpf}</div>}
                        {clienteSelecionado.endereco && <div>Endereço: {clienteSelecionado.endereco}</div>}
                        {clienteSelecionado.email && <div>Email: {clienteSelecionado.email}</div>}
                        {clienteSelecionado.telefone && <div>Telefone: {clienteSelecionado.telefone}</div>}
                        {clienteSelecionado.distancia_km && <div>Distância: {clienteSelecionado.distancia_km} km</div>}
                      </div>
                    </div>
                  )}

                  <div>
                    <Label htmlFor="contrato_numero">Número do Contrato</Label>
                    <Input
                      id="contrato_numero"
                      value={formData.contrato_numero}
                      readOnly
                      className={
                        formData.contrato_numero === "Cliente sem contrato"
                          ? "bg-red-50 border-red-200"
                          : "bg-green-50 border-green-200"
                      }
                    />
                    {loadingContrato && (
                      <div className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                        <span>Carregando informações do contrato...</span>
                      </div>
                    )}
                    {formData.contrato_numero === "Cliente sem contrato" && (
                      <div className="text-xs text-red-600 mt-1">
                        Este cliente não possui contrato de conservação ativo
                      </div>
                    )}
                    {contratoConservacao && (
                      <div className="text-xs text-green-600 mt-1">
                        ✓ Contrato de conservação encontrado e carregado
                      </div>
                    )}
                  </div>

                  {contratoConservacao && (
                    <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex items-center gap-2 mb-3">
                        <Shield className="h-5 w-5 text-green-600" />
                        <span className="font-medium text-green-900">Contrato de Conservação</span>
                        <Badge
                          variant="outline"
                          className={`text-sm ${
                            contratoConservacao.status === "ativo"
                              ? "text-green-600 border-green-200 bg-green-50"
                              : "text-orange-600 border-orange-200 bg-orange-50"
                          }`}
                        >
                          {contratoConservacao.status.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label className="text-sm font-medium text-gray-700">Número do Contrato</Label>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="font-mono text-sm bg-white">
                                {contratoConservacao.numero}
                              </Badge>
                            </div>
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-gray-700">Frequência</Label>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-sm bg-white">
                                {contratoConservacao.frequencia?.toUpperCase() || "N/A"}
                              </Badge>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label className="text-sm font-medium text-gray-700">Data de Início</Label>
                            <div className="flex items-center gap-2 mt-1">
                              <Calendar className="h-4 w-4 text-gray-500" />
                              <span className="text-sm">{formatarData(contratoConservacao.data_inicio)}</span>
                            </div>
                          </div>
                          {contratoConservacao.data_fim && (
                            <div>
                              <Label className="text-sm font-medium text-gray-700">Data de Fim</Label>
                              <div className="flex items-center gap-2 mt-1">
                                <Calendar className="h-4 w-4 text-gray-500" />
                                <span className="text-sm">{formatarData(contratoConservacao.data_fim)}</span>
                              </div>
                            </div>
                          )}
                        </div>

                        {contratoConservacao.valor_mensal && (
                          <div>
                            <Label className="text-sm font-medium text-gray-700">Valor Mensal</Label>
                            <div className="flex items-center gap-2 mt-1">
                              <DollarSign className="h-4 w-4 text-gray-500" />
                              <span className="text-sm font-medium text-green-600">
                                {formatarMoeda(contratoConservacao.valor_mensal)}
                              </span>
                            </div>
                          </div>
                        )}

                        {contratoConservacao.observacoes && (
                          <div>
                            <Label className="text-sm font-medium text-gray-700">Observações</Label>
                            <div className="text-sm text-gray-600 mt-1 p-2 bg-white rounded border">
                              {contratoConservacao.observacoes}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Informações Básicas */}
            <Card className="border-0 shadow-lg bg-white">
              <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-t-lg p-4 lg:p-6">
                <CardTitle className="text-white flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Informações Básicas
                </CardTitle>
                <CardDescription className="text-purple-100">Dados iniciais da ordem de serviço</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="tipo_servico">Tipo de Serviço *</Label>
                      <Select
                        value={formData.tipo_servico}
                        onValueChange={(value) => setFormData((prev) => ({ ...prev, tipo_servico: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="manutencao">Manutenção</SelectItem>
                          <SelectItem value="orcamento">Orçamento</SelectItem>
                          <SelectItem value="vistoria_contrato">Vistoria para Contrato</SelectItem>
                          <SelectItem value="preventiva">Preventiva</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="data_atual">Data de Criação *</Label>
                      <Input
                        id="data_atual"
                        type="date"
                        value={formData.data_atual}
                        onChange={(e) => setFormData((prev) => ({ ...prev, data_atual: e.target.value }))}
                      />
                      <div className="text-xs text-gray-500 mt-1">Data em que a ordem foi criada</div>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="solicitado_por">Solicitado Por *</Label>
                    <Input
                      id="solicitado_por"
                      value={formData.solicitado_por}
                      onChange={(e) => setFormData((prev) => ({ ...prev, solicitado_por: e.target.value }))}
                      placeholder="Nome de quem solicitou o serviço"
                    />
                  </div>

                  <Separator className="my-4" />

                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="deseja_agendar"
                        checked={desejaAgendar}
                        onCheckedChange={(checked) => {
                          setDesejaAgendar(checked as boolean)
                          // Limpar data de agendamento se desmarcar
                          if (!checked) {
                            setFormData((prev) => ({ ...prev, data_agendamento: "", periodo_agendamento: "" }))
                          }
                        }}
                      />
                      <Label
                        htmlFor="deseja_agendar"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        Deseja agendar esta ordem de serviço?
                      </Label>
                    </div>

                    {desejaAgendar && (
                      <div className="pl-6 space-y-4">
                        <div>
                          <Label htmlFor="data_agendamento">Data de Agendamento *</Label>
                          <Input
                            id="data_agendamento"
                            type="date"
                            value={formData.data_agendamento}
                            onChange={(e) => setFormData((prev) => ({ ...prev, data_agendamento: e.target.value }))}
                            min={formData.data_atual}
                          />
                          <div className="text-xs text-gray-500 mt-1">
                            Data em que a visita está agendada para ser realizada
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="periodo_agendamento">Período *</Label>
                          <Select
                            value={formData.periodo_agendamento}
                            onValueChange={(value: "manha" | "tarde") =>
                              setFormData((prev) => ({ ...prev, periodo_agendamento: value }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o período" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="manha">Manhã</SelectItem>
                              <SelectItem value="tarde">Tarde</SelectItem>
                            </SelectContent>
                          </Select>
                          <div className="text-xs text-gray-500 mt-1">Horário de funcionamento: Segunda a Sexta</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Equipamentos */}
            <Card className="border-0 shadow-lg bg-white">
              <CardHeader className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-t-lg p-4 lg:p-6">
                <CardTitle className="text-white flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Equipamentos
                </CardTitle>
                <CardDescription className="text-indigo-100">Equipamentos do contrato e adicionais</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div>
                    <Label>Adicionar Equipamento Adicional</Label>
                    <EquipamentoCombobox
                      onSelect={handleEquipamentoSelect}
                      placeholder="Selecione um equipamento adicional..."
                      disabled={!clienteSelecionado}
                    />
                    <div className="text-xs text-gray-500 mt-1">
                      Para serviços preventivos, os equipamentos do contrato são carregados automaticamente
                    </div>
                  </div>

                  {equipamentosSelecionados.length > 0 && (
                    <div className="space-y-3">
                      <Separator />
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-gray-900">Equipamentos Selecionados</h4>
                        <Badge variant="outline" className="text-xs">
                          {equipamentosSelecionados.filter((eq) => eq.do_contrato).length} do contrato +{" "}
                          {equipamentosSelecionados.filter((eq) => !eq.do_contrato).length} adicionais
                        </Badge>
                      </div>

                      {equipamentosSelecionados.map((equipamento) => (
                        <div key={equipamento.id} className="flex items-center gap-3 p-3 border rounded-lg bg-gray-50">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <Package className="h-4 w-4 text-gray-500" />
                              <span className="font-medium text-gray-900">{equipamento.nome}</span>
                              {equipamento.do_contrato ? (
                                <Badge
                                  variant="outline"
                                  className="text-green-600 border-green-200 bg-green-50 text-xs"
                                >
                                  <Shield className="h-3 w-3 mr-1" />
                                  Contrato
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50 text-xs">
                                  <Plus className="h-3 w-3 mr-1" />
                                  Adicional
                                </Badge>
                              )}
                            </div>
                          </div>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removerEquipamento(equipamento.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
                            disabled={equipamento.do_contrato}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  {equipamentosSelecionados.length === 0 && (
                    <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                      <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <div className="text-gray-600">Nenhum equipamento selecionado</div>
                      <div className="text-sm text-gray-500">
                        {clienteTemContrato && formData.tipo_servico === "preventiva"
                          ? "Os equipamentos do contrato foram carregados automaticamente"
                          : "Use o combobox acima para adicionar equipamentos manualmente"}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Descrições */}
            {formData.tipo_servico !== "preventiva" && (
              <Card className="border-0 shadow-lg bg-white">
                <CardHeader className="bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-t-lg p-4 lg:p-6">
                  <CardTitle className="text-white flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Descrição do Problema
                  </CardTitle>
                  <CardDescription className="text-teal-100">
                    Descreva o defeito ou serviço a ser realizado
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="descricao_defeito">Descrição do Problema/Defeito</Label>
                      <Textarea
                        id="descricao_defeito"
                        value={formData.descricao_defeito}
                        onChange={(e) => setFormData((prev) => ({ ...prev, descricao_defeito: e.target.value }))}
                        placeholder="Descreva o defeito apresentado ou serviço a ser realizado"
                        rows={6}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Resumo */}
          <div className="space-y-6">
            <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-red-50 sticky top-6">
              <CardHeader className="bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-t-lg p-4 lg:p-6">
                <CardTitle className="text-white flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Resumo da Ordem
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div
                    className={`p-3 border rounded-lg ${desejaAgendar ? "bg-cyan-50 border-cyan-200" : "bg-yellow-50 border-yellow-200"}`}
                  >
                    <div className={`flex items-center gap-2 ${desejaAgendar ? "text-cyan-800" : "text-yellow-800"}`}>
                      {desejaAgendar ? <Calendar className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                      <span className="text-sm font-medium">
                        A ordem será criada como {desejaAgendar ? "AGENDADA" : "ABERTA"}
                      </span>
                    </div>
                    <p className={`text-xs mt-1 ${desejaAgendar ? "text-cyan-700" : "text-yellow-700"}`}>
                      {desejaAgendar
                        ? "A ordem ficará agendada para a data selecionada"
                        : "O técnico poderá iniciar a execução depois"}
                    </p>
                  </div>

                  <Separator />

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Número:</span>
                      <Badge variant="outline" className="font-mono">
                        {numeroOS || "Selecione cliente"}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Cliente:</span>
                      <span className="font-medium">
                        {clienteSelecionado ? clienteSelecionado.nome : "Não selecionado"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Contrato:</span>
                      <span
                        className={`font-medium ${formData.contrato_numero === "Cliente sem contrato" ? "text-red-600" : "text-green-600"}`}
                      >
                        {formData.contrato_numero || "Não definido"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tipo:</span>
                      <span className="font-medium">
                        {getTipoServicoLabel(formData.tipo_servico) || "Não definido"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Data Criação:</span>
                      <span className="font-medium">
                        {formData.data_atual
                          ? new Date(formData.data_atual + "T00:00:00").toLocaleDateString("pt-BR")
                          : "Não definida"}
                      </span>
                    </div>
                    {desejaAgendar && formData.data_agendamento && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Data Agendamento:</span>
                          <span className="font-medium text-cyan-600">
                            {new Date(formData.data_agendamento + "T00:00:00").toLocaleDateString("pt-BR")}
                          </span>
                        </div>
                        {formData.periodo_agendamento && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Período:</span>
                            <span className="font-medium text-cyan-600">
                              {formData.periodo_agendamento === "manha" ? "Manhã" : "Tarde"}
                            </span>
                          </div>
                        )}
                      </>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-600">Solicitado por:</span>
                      <span className="font-medium">{formData.solicitado_por || "Não informado"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Equipamentos:</span>
                      <span className="font-medium">{equipamentosSelecionados.length} selecionados</span>
                    </div>
                  </div>

                  <Separator />

                  {equipamentosSelecionados.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-medium text-gray-900 text-sm">Equipamentos:</h4>
                      <div className="space-y-1 max-h-32 overflow-y-auto">
                        {equipamentosSelecionados.map((eq) => (
                          <div key={eq.id} className="text-xs">
                            <div className="flex items-center gap-1">
                              <span className="font-medium">{eq.nome}</span>
                              {eq.do_contrato ? (
                                <Badge
                                  variant="outline"
                                  className="text-green-600 border-green-200 bg-green-50 text-xs px-1 py-0"
                                >
                                  C
                                </Badge>
                              ) : (
                                <Badge
                                  variant="outline"
                                  className="text-blue-600 border-blue-200 bg-blue-50 text-xs px-1 py-0"
                                >
                                  +
                                </Badge>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="pt-4">
                    <Button
                      onClick={handleSubmit}
                      disabled={
                        loading ||
                        !clienteSelecionado ||
                        !formData.tipo_servico ||
                        !formData.data_atual ||
                        !formData.solicitado_por ||
                        (desejaAgendar && !formData.data_agendamento) ||
                        (desejaAgendar && !formData.periodo_agendamento) // Adicionada verificação do período
                      }
                      className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {loading ? "Criando..." : desejaAgendar ? "Criar Ordem Agendada" : "Criar Ordem Aberta"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <ClienteFormDialog
        open={showNovoClienteDialog}
        onOpenChange={setShowNovoClienteDialog}
        onSuccess={handleNovoClienteCriado}
      />
    </div>
  )
}
