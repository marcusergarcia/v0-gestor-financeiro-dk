"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Save, ArrowLeft, Calculator, Package, User, Settings, Plus, Building2, FileText } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { formatCurrency } from "@/lib/utils"
import { ClienteCombobox, type Cliente } from "@/components/cliente-combobox"
import { ClienteFormDialog } from "@/components/cliente-form-dialog"
import { Badge } from "@/components/ui/badge"

interface Equipamento {
  id: number
  nome: string
  categoria: string
  valor_hora: number
}

interface EquipamentoSelecionado {
  equipamento_id: number
  equipamento: Equipamento
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

const PRAZO_CONTRATO_OPTIONS = [
  { value: "12", label: "12 meses" },
  { value: "24", label: "24 meses" },
  { value: "indeterminado", label: "Indeterminado" },
]

export default function NovaPropostaPage() {
  const router = useRouter()
  const { toast } = useToast()

  const [numeroProposta, setNumeroProposta] = useState<string>("")
  const [cliente, setCliente] = useState<Cliente | null>(null)
  const [equipamentos, setEquipamentos] = useState<Equipamento[]>([])
  const [equipamentosSelecionados, setEquipamentosSelecionados] = useState<EquipamentoSelecionado[]>([])
  const [tipo, setTipo] = useState("conservacao")
  const [frequencia, setFrequencia] = useState("mensal")
  const [observacoes, setObservacoes] = useState("")
  const [equipamentosConsignacao, setEquipamentosConsignacao] = useState("")
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showNewClientDialog, setShowNewClientDialog] = useState(false)

  // Campos de configuração
  const [distanciaKm, setDistanciaKm] = useState(0)
  const [quantidadeVisitas, setQuantidadeVisitas] = useState(1)
  const [formaPagamento, setFormaPagamento] = useState("mensal")
  const [prazoContrato, setPrazoContrato] = useState("12")
  const [garantia, setGarantia] = useState(90)
  const [valorPorKm, setValorPorKm] = useState(1.5)
  const [dataValidade, setDataValidade] = useState("")
  const [descontoVisitas, setDescontoVisitas] = useState(0)

  useEffect(() => {
    loadEquipamentos()
    loadValorPorKm()
    loadProximoNumero()
  }, [])

  useEffect(() => {
    loadDescontoVisitas()
  }, [quantidadeVisitas])

  useEffect(() => {
    // Calcular data de validade: data atual + 30 dias
    const hoje = new Date()
    const dataValidade = new Date(hoje)
    dataValidade.setDate(dataValidade.getDate() + 30)

    // Formatar para YYYY-MM-DD
    const dataFormatada = dataValidade.toISOString().split("T")[0]
    setDataValidade(dataFormatada)
  }, [])

  useEffect(() => {
    recalcularEquipamentos()
  }, [equipamentosSelecionados.length])

  const loadProximoNumero = async () => {
    try {
      const response = await fetch("/api/propostas-contratos/proximo-numero")
      const result = await response.json()
      if (result.success) {
        setNumeroProposta(result.data.numero)
      }
    } catch (error) {
      console.error("Erro ao carregar próximo número:", error)
    }
  }

  const loadEquipamentos = async () => {
    try {
      const response = await fetch("/api/equipamentos")
      const result = await response.json()
      if (result.success) {
        setEquipamentos(result.data || [])
        setLoading(false)
      }
    } catch (error) {
      console.error("Erro ao carregar equipamentos:", error)
      setLoading(false)
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

  const loadDescontoVisitas = async () => {
    try {
      const response = await fetch(`/api/configuracoes/visitas-tecnicas/desconto?quantidade=${quantidadeVisitas}`)
      const result = await response.json()
      if (result.success && result.data) {
        setDescontoVisitas(result.data.percentual_desconto || 0)
      }
    } catch (error) {
      console.error("Erro ao carregar desconto de visitas:", error)
      setDescontoVisitas(0)
    }
  }

  const calcularDescontoIndividual = (quantidade: number) => {
    if (quantidade === 1) return 0
    if (quantidade === 2) return 10
    if (quantidade >= 3 && quantidade <= 4) return 20
    if (quantidade >= 5) return 30
    return 0
  }

  const verificarCategoriaCompleta = (categoria: string) => {
    const equipamentosCategoria = equipamentos.filter((eq) => eq.categoria === categoria)
    const selecionadosCategoria = equipamentosSelecionados.filter((sel) => sel.equipamento.categoria === categoria)

    return (
      equipamentosCategoria.length > 0 &&
      equipamentosCategoria.every((eq) => selecionadosCategoria.some((sel) => sel.equipamento_id === eq.id))
    )
  }

  const recalcularEquipamentos = () => {
    setEquipamentosSelecionados((prevEquipamentos) =>
      prevEquipamentos.map((sel) => {
        const descontoIndividual = calcularDescontoIndividual(sel.quantidade)
        const valorComDesconto = sel.valor_unitario * (1 - descontoIndividual / 100)
        const categoriaCompleta = verificarCategoriaCompleta(sel.equipamento.categoria)
        const descontoCategoria = categoriaCompleta ? 10 : 0
        const valorFinal = valorComDesconto * (1 - descontoCategoria / 100)

        return {
          ...sel,
          valor_desconto_individual: ((sel.valor_unitario * descontoIndividual) / 100) * sel.quantidade,
          valor_desconto_categoria: categoriaCompleta
            ? ((valorComDesconto * descontoCategoria) / 100) * sel.quantidade
            : 0,
          valor_total: valorFinal * sel.quantidade,
        }
      }),
    )
  }

  const toggleEquipamento = (equipamento: Equipamento) => {
    const jaExiste = equipamentosSelecionados.find((sel) => sel.equipamento_id === equipamento.id)

    if (jaExiste) {
      setEquipamentosSelecionados(equipamentosSelecionados.filter((sel) => sel.equipamento_id !== equipamento.id))
    } else {
      const novoEquipamento: EquipamentoSelecionado = {
        equipamento_id: equipamento.id,
        equipamento,
        quantidade: 1,
        valor_unitario: equipamento.valor_hora,
        valor_desconto_individual: 0,
        valor_desconto_categoria: 0,
        valor_total: equipamento.valor_hora,
      }
      setEquipamentosSelecionados([...equipamentosSelecionados, novoEquipamento])
    }
  }

  const atualizarQuantidade = (equipamentoId: number, quantidade: number) => {
    setEquipamentosSelecionados(
      equipamentosSelecionados.map((sel) => {
        if (sel.equipamento_id === equipamentoId) {
          const descontoIndividual = calcularDescontoIndividual(quantidade)
          const valorComDesconto = sel.valor_unitario * (1 - descontoIndividual / 100)
          const categoriaCompleta = verificarCategoriaCompleta(sel.equipamento.categoria)
          const descontoCategoria = categoriaCompleta ? 10 : 0
          const valorFinal = valorComDesconto * (1 - descontoCategoria / 100)

          return {
            ...sel,
            quantidade,
            valor_desconto_individual: ((sel.valor_unitario * descontoIndividual) / 100) * quantidade,
            valor_desconto_categoria: categoriaCompleta
              ? ((valorComDesconto * descontoCategoria) / 100) * quantidade
              : 0,
            valor_total: valorFinal * quantidade,
          }
        }
        return sel
      }),
    )
  }

  const calcularValorEquipamentos = () => {
    const valorLiquido = equipamentosSelecionados.reduce((acc, item) => {
      return acc + (item.valor_total || 0)
    }, 0)
    return valorLiquido * (quantidadeVisitas || 1)
  }

  const calcularValorBrutoEquipamentos = () => {
    const valorBruto = equipamentosSelecionados.reduce((acc, item) => {
      return acc + (item.valor_unitario || 0) * (item.quantidade || 0)
    }, 0)
    return valorBruto * (quantidadeVisitas || 1)
  }

  const calcularDescontoTotal = () => {
    const descontoTotal = equipamentosSelecionados.reduce(
      (acc, item) => acc + (item.valor_desconto_individual || 0) + (item.valor_desconto_categoria || 0),
      0,
    )
    return descontoTotal * (quantidadeVisitas || 1)
  }

  const calcularDeslocamento = () => {
    return (distanciaKm || 0) * 2 * (valorPorKm || 0) * (quantidadeVisitas || 0)
  }

  const calcularValorVisitas = () => {
    const valorBrutoEquipamentos = calcularValorBrutoEquipamentos()
    const descontoVisitasValor = (valorBrutoEquipamentos * (descontoVisitas || 0)) / 100
    return -descontoVisitasValor
  }

  const calcularTotal = () => {
    return calcularValorEquipamentos() + calcularDeslocamento() + calcularValorVisitas()
  }

  const handleClienteChange = async (novoCliente: Cliente | null) => {
    setCliente(novoCliente)

    if (novoCliente && novoCliente.id) {
      try {
        const response = await fetch(`/api/clientes/${novoCliente.id}`)
        const result = await response.json()

        if (result.success && result.data) {
          const clienteCompleto = result.data
          setDistanciaKm(clienteCompleto.distancia_km || 0)
        }
      } catch (error) {
        console.error("Erro ao buscar dados do cliente:", error)
      }
    } else {
      setDistanciaKm(0)
    }
  }

  const handleClienteCreated = async (novoCliente: any) => {
    setShowNewClientDialog(false)

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

    await handleClienteChange(clienteFormatado)

    toast({
      title: "Cliente criado!",
      description: "O cliente foi criado e selecionado automaticamente.",
    })
  }

  const salvarProposta = async () => {
    if (!cliente) {
      toast({
        title: "Erro",
        description: "Selecione um cliente",
        variant: "destructive",
      })
      return
    }

    if (equipamentosSelecionados.length === 0) {
      toast({
        title: "Erro",
        description: "Selecione pelo menos um equipamento",
        variant: "destructive",
      })
      return
    }

    try {
      setSaving(true)

      const numeroResponse = await fetch("/api/propostas-contratos/proximo-numero")
      const numeroResult = await numeroResponse.json()

      if (!numeroResult.success) {
        throw new Error("Erro ao gerar número da proposta")
      }

      const propostaData = {
        numero: numeroResult.data.numero,
        cliente_id: cliente.id,
        tipo,
        frequencia,
        valor_equipamentos: calcularValorEquipamentos(),
        valor_desconto: calcularDescontoTotal(),
        valor_deslocamento: calcularDeslocamento(),
        valor_visitas: calcularValorVisitas(),
        valor_total_proposta: calcularTotal(),
        forma_pagamento: formaPagamento,
        prazo_contrato: prazoContrato,
        garantia,
        observacoes,
        equipamentos_consignacao: equipamentosConsignacao,
        status: "rascunho",
        data_validade: dataValidade,
        quantidade_visitas: quantidadeVisitas,
        itens: equipamentosSelecionados.map((item) => ({
          equipamento_id: item.equipamento_id,
          categoria: item.equipamento.categoria,
          quantidade: item.quantidade,
          valor_unitario: item.valor_unitario,
          valor_desconto_individual: item.valor_desconto_individual,
          valor_desconto_categoria: item.valor_desconto_categoria,
          valor_total: item.valor_total,
        })),
      }

      const response = await fetch("/api/propostas-contratos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(propostaData),
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Sucesso!",
          description: `Proposta ${numeroResult.data.numero} criada com sucesso`,
        })
        router.push(`/contratos/proposta/${numeroResult.data.numero}`)
      } else {
        toast({
          title: "Erro",
          description: result.message || "Erro ao criar proposta",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Erro ao salvar proposta:", error)
      toast({
        title: "Erro",
        description: "Erro de conexão. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="container mx-auto p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Carregando equipamentos...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
              Nova Proposta de Contrato
            </h1>
            <p className="text-gray-600 mt-1">Crie uma nova proposta de contrato de conservação</p>
            {numeroProposta && (
              <div className="flex items-center gap-2 mt-2">
                <FileText className="h-5 w-5 text-blue-600" />
                <span className="text-lg font-semibold text-blue-600 font-mono">Número: {numeroProposta}</span>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Link href="/contratos">
              <Button variant="outline" className="bg-transparent">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
            </Link>
            <Button
              onClick={salvarProposta}
              disabled={saving || !cliente || equipamentosSelecionados.length === 0}
              className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg"
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Salvando..." : "Salvar Proposta"}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Formulário Principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Dados do Cliente */}
            <Card className="border-0 shadow-lg bg-white">
              <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-t-lg  p-4 lg:p-6">
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
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <Label htmlFor="cliente">Cliente *</Label>
                      <ClienteCombobox
                        value={cliente}
                        onValueChange={handleClienteChange}
                        placeholder="Selecione um cliente..."
                        showNewClientButton={false}
                      />
                    </div>
                    {!cliente && (
                      <div className="flex items-end">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setShowNewClientDialog(true)}
                          className="bg-green-50 hover:bg-green-100 text-green-600 border-green-200 hover:border-green-300"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Novo Cliente
                        </Button>
                      </div>
                    )}
                  </div>

                  {cliente && (
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center gap-2 mb-2">
                        {cliente.codigo && (
                          <Badge variant="outline" className="font-mono">
                            {cliente.codigo}
                          </Badge>
                        )}
                        <span className="font-medium text-blue-900">{cliente.nome}</span>
                        {cliente.tem_contrato && (
                          <Badge variant="outline" className="text-green-600 border-green-200">
                            Contrato
                          </Badge>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                        <div>
                          {cliente.cnpj && (
                            <div>
                              <strong>CNPJ:</strong> {cliente.cnpj}
                            </div>
                          )}
                          {cliente.cpf && (
                            <div>
                              <strong>CPF:</strong> {cliente.cpf}
                            </div>
                          )}
                          {cliente.endereco && (
                            <div>
                              <strong>Endereço:</strong> {cliente.endereco}
                            </div>
                          )}
                          {cliente.email && (
                            <div>
                              <strong>Email:</strong> {cliente.email}
                            </div>
                          )}
                          {cliente.telefone && (
                            <div>
                              <strong>Telefone:</strong> {cliente.telefone}
                            </div>
                          )}
                        </div>
                        <div>
                          {cliente.cidade && (
                            <div>
                              <strong>Cidade:</strong> {cliente.cidade}/{cliente.estado}
                            </div>
                          )}
                          {cliente.distancia_km !== undefined && (
                            <div>
                              <strong>Distância:</strong> {cliente.distancia_km} km
                            </div>
                          )}
                        </div>
                      </div>

                      {(cliente.nome_adm || cliente.contato_adm || cliente.telefone_adm || cliente.email_adm) && (
                        <div className="mt-4 pt-3 border-t border-blue-200">
                          <div className="flex items-center gap-2 mb-2">
                            <Building2 className="h-4 w-4 text-blue-600" />
                            <span className="font-medium text-blue-800">Administradora</span>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                            <div>
                              {cliente.nome_adm && (
                                <div>
                                  <strong>Nome:</strong> {cliente.nome_adm}
                                </div>
                              )}
                              {cliente.contato_adm && (
                                <div>
                                  <strong>Contato:</strong> {cliente.contato_adm}
                                </div>
                              )}
                            </div>
                            <div>
                              {cliente.telefone_adm && (
                                <div>
                                  <strong>Telefone:</strong> {cliente.telefone_adm}
                                </div>
                              )}
                              {cliente.email_adm && (
                                <div>
                                  <strong>Email:</strong> {cliente.email_adm}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="tipo">Tipo de Serviço</Label>
                      <Select value={tipo} onValueChange={setTipo}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="conservacao">Conservação</SelectItem>
                          <SelectItem value="servicos">Serviços</SelectItem>
                          <SelectItem value="manutencao">Manutenção</SelectItem>
                          <SelectItem value="bimestral">Bimestral</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="frequencia">Frequência</Label>
                      <Select value={frequencia} onValueChange={setFrequencia}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="mensal">Mensal</SelectItem>
                          <SelectItem value="quinzenal">Quinzenal</SelectItem>
                          <SelectItem value="semanal">Semanal</SelectItem>
                          <SelectItem value="bimestral">Bimestral</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="distancia_km">Distância (Km)</Label>
                      <Input
                        id="distancia_km"
                        type="number"
                        step="0.1"
                        min="0"
                        value={distanciaKm || 0}
                        onChange={(e) => setDistanciaKm(Number.parseFloat(e.target.value) || 0)}
                        className="bg-blue-50"
                      />
                      <p className="text-xs text-gray-500 mt-1">Distância: {distanciaKm || 0} km</p>
                    </div>
                    <div>
                      <Label htmlFor="quantidade_visitas">Quantidade de Visitas</Label>
                      <Input
                        id="quantidade_visitas"
                        type="number"
                        min="1"
                        value={quantidadeVisitas || 1}
                        onChange={(e) => setQuantidadeVisitas(Number.parseInt(e.target.value) || 1)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="data_validade">Data de Validade</Label>
                      <Input
                        id="data_validade"
                        type="date"
                        value={dataValidade}
                        onChange={(e) => setDataValidade(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Equipamentos por Categoria */}
            <Card className="border-0 shadow-lg bg-white">
              <CardHeader className="bg-gradient-to-r from-green-500 to-blue-600 text-white rounded-t-lg  p-4 lg:p-6">
                <CardTitle className="text-white flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Equipamentos por Categoria
                </CardTitle>
                <CardDescription className="text-green-100">
                  Selecione os equipamentos necessários para o contrato
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-6">
                  {Object.entries(CATEGORIAS).map(([categoria, config]) => {
                    const equipamentosCategoria = equipamentos.filter((eq) => eq.categoria === categoria)

                    return (
                      <div key={categoria} className="space-y-3">
                        <h3 className="text-lg font-semibold text-gray-800">{config.nome}</h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {equipamentosCategoria.map((equipamento) => {
                            const selecionado = equipamentosSelecionados.find(
                              (sel) => sel.equipamento_id === equipamento.id,
                            )

                            return (
                              <div key={equipamento.id} className="border rounded-lg p-3">
                                <div className="flex items-center space-x-2 mb-2">
                                  <Checkbox
                                    checked={!!selecionado}
                                    onCheckedChange={() => toggleEquipamento(equipamento)}
                                  />
                                  <div className="flex-1">
                                    <div className="font-medium text-sm">{equipamento.nome}</div>
                                    <div className="text-xs text-gray-500">
                                      {formatCurrency(equipamento.valor_hora)}/hora
                                    </div>
                                  </div>
                                </div>

                                {selecionado && (
                                  <div className="mt-2 space-y-2">
                                    <div className="flex items-center gap-2">
                                      <Label className="text-xs">Quantidade:</Label>
                                      <Input
                                        type="number"
                                        min="1"
                                        value={selecionado.quantidade}
                                        onChange={(e) =>
                                          atualizarQuantidade(equipamento.id, Number.parseInt(e.target.value) || 1)
                                        }
                                        className="w-20 h-8 text-xs"
                                      />
                                    </div>
                                    <div className="text-xs space-y-1">
                                      <div className="flex justify-between">
                                        <span>Valor unitário:</span>
                                        <span>{formatCurrency(selecionado.valor_unitario || 0)}</span>
                                      </div>
                                      {(selecionado.valor_desconto_individual || 0) > 0 && (
                                        <div className="flex justify-between text-red-600">
                                          <span>Desconto individual:</span>
                                          <span>-{formatCurrency(selecionado.valor_desconto_individual || 0)}</span>
                                        </div>
                                      )}
                                      {(selecionado.valor_desconto_categoria || 0) > 0 && (
                                        <div className="flex justify-between text-blue-600">
                                          <span>Desconto categoria:</span>
                                          <span>-{formatCurrency(selecionado.valor_desconto_categoria || 0)}</span>
                                        </div>
                                      )}
                                      <div className="flex justify-between font-semibold border-t pt-1">
                                        <span>Total:</span>
                                        <span className="text-green-600">
                                          {formatCurrency(selecionado.valor_total || 0)}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Condições do Contrato */}
            <Card className="border-0 shadow-lg bg-white">
              <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-t-lg  p-4 lg:p-6">
                <CardTitle className="text-white flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Condições do Contrato
                </CardTitle>
                <CardDescription className="text-purple-100">Configure as condições comerciais</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="forma_pagamento">Forma de Pagamento</Label>
                    <Select value={formaPagamento} onValueChange={setFormaPagamento}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mensal">Mensal</SelectItem>
                        <SelectItem value="bimestral">Bimestral</SelectItem>
                        <SelectItem value="trimestral">Trimestral</SelectItem>
                        <SelectItem value="semestral">Semestral</SelectItem>
                        <SelectItem value="anual">Anual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="prazo_contrato">Prazo do Contrato</Label>
                    <Select value={prazoContrato} onValueChange={setPrazoContrato}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PRAZO_CONTRATO_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="garantia">Garantia dos Serviços (dias)</Label>
                    <Input
                      id="garantia"
                      type="number"
                      min="0"
                      value={garantia}
                      onChange={(e) => setGarantia(Number.parseInt(e.target.value) || 90)}
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <Label htmlFor="equipamentos_consignacao">Equipamentos em Consignação</Label>
                  <Textarea
                    id="equipamentos_consignacao"
                    value={equipamentosConsignacao}
                    onChange={(e) => setEquipamentosConsignacao(e.target.value)}
                    placeholder="Liste os equipamentos fornecidos em consignação (ex: 2x Interfone, 1x Controle Remoto Universal)..."
                    rows={3}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    ℹ️ Opcional. Será exibido na visualização e impressão logo após os equipamentos inclusos
                  </p>
                </div>

                <div className="mt-4">
                  <Label htmlFor="observacoes">Observações</Label>
                  <Textarea
                    id="observacoes"
                    value={observacoes}
                    onChange={(e) => setObservacoes(e.target.value)}
                    placeholder="Observações adicionais sobre a proposta..."
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Resumo da Proposta */}
          <div className="space-y-6">
            <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-blue-50 sticky top-6">
              <CardHeader className="bg-gradient-to-r from-green-500 to-blue-600 text-white rounded-t-lg  p-4 lg:p-6">
                <CardTitle className="text-white flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Resumo da Proposta
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {numeroProposta && (
                    <div className="p-3 bg-blue-100 rounded-lg border border-blue-300 mb-4">
                      <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-blue-700" />
                        <div>
                          <div className="text-xs text-blue-600 font-medium">Número da Proposta</div>
                          <div className="text-lg font-bold text-blue-800 font-mono">{numeroProposta}</div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Valor Bruto dos Equipamentos:</span>
                      <span className="font-medium">{formatCurrency(calcularValorBrutoEquipamentos())}</span>
                    </div>

                    {calcularDescontoTotal() > 0 && (
                      <div className="flex justify-between items-center text-red-600">
                        <span>Desconto Total:</span>
                        <span className="font-medium">-{formatCurrency(calcularDescontoTotal())}</span>
                      </div>
                    )}

                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Valor dos Equipamentos (líquido):</span>
                      <span className="font-medium">{formatCurrency(calcularValorEquipamentos())}</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Valor do Deslocamento:</span>
                      <span className="font-medium">{formatCurrency(calcularDeslocamento())}</span>
                    </div>
                    <div className="text-xs text-gray-500 text-center">
                      ({distanciaKm}km × 2 × {formatCurrency(valorPorKm)} × {quantidadeVisitas})
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Desconto Visitas Técnicas:</span>
                      <span className={`font-medium ${calcularValorVisitas() < 0 ? "text-red-600" : "text-green-600"}`}>
                        {formatCurrency(calcularValorVisitas())}
                      </span>
                    </div>

                    <div className="border-t pt-4">
                      <div className="flex justify-between items-center text-lg font-bold">
                        <span>Valor Total da Proposta:</span>
                        <span className="text-green-600">{formatCurrency(calcularTotal())}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 space-y-2 text-sm text-gray-600">
                    <div className="flex justify-between">
                      <span>Equipamentos:</span>
                      <span>{equipamentosSelecionados.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Cliente:</span>
                      <span>{cliente ? cliente.nome : "Não selecionado"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Distância:</span>
                      <span>{distanciaKm || 0} km</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Visitas:</span>
                      <span>{quantidadeVisitas}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Prazo:</span>
                      <span>
                        {PRAZO_CONTRATO_OPTIONS.find((opt) => opt.value === prazoContrato)?.label || prazoContrato}
                      </span>
                    </div>
                  </div>

                  <Button
                    onClick={salvarProposta}
                    disabled={saving || !cliente || equipamentosSelecionados.length === 0}
                    className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? "Salvando..." : "Salvar Proposta"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Modal de Novo Cliente */}
        <ClienteFormDialog
          open={showNewClientDialog}
          onOpenChange={setShowNewClientDialog}
          onSuccess={handleClienteCreated}
        />
      </div>
    </div>
  )
}
