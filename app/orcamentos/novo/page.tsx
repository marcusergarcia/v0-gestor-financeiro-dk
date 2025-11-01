"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Minus,
  Save,
  ArrowLeft,
  Calculator,
  Package,
  User,
  MapPin,
  Calendar,
  Edit2,
  Hash,
  DollarSign,
  Building2,
  Plus,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { formatCurrency } from "@/lib/utils"
import { ClienteCombobox, type Cliente } from "@/components/cliente-combobox"
import { ProdutoCombobox } from "@/components/produto-combobox"
import { ProdutoFormDialog } from "@/components/produto-form-dialog"
import { ClienteFormDialog } from "@/components/cliente-form-dialog"
import { EditarServicoDialog } from "@/components/editar-servico-dialog"

interface OrcamentoItem {
  produto_id: string
  produto: any
  quantidade: number
  valor_unitario: number
  valor_mao_obra: number
  valor_total: number
  marca_nome?: string
  produto_ncm?: string
  valor_unitario_ajustado?: number
  valor_total_ajustado?: number
}

export default function NovoOrcamentoPage() {
  const [cliente, setCliente] = useState<Cliente | null>(null)
  const [itens, setItens] = useState<OrcamentoItem[]>([])
  const [tipoServico, setTipoServico] = useState("")
  const [detalhesServico, setDetalhesServico] = useState("")
  const [observacoes, setObservacoes] = useState("")
  const [validade, setValidade] = useState(30)
  const [desconto, setDesconto] = useState(0)
  const [situacao, setSituacao] = useState("pendente")
  const [saving, setSaving] = useState(false)
  const [logoMenu, setLogoMenu] = useState<string>("")
  const [proximoNumero, setProximoNumero] = useState<string>("")

  const [produtoEditDialog, setProdutoEditDialog] = useState(false)
  const [produtoParaEditar, setProdutoParaEditar] = useState<any | null>(null)

  const [servicoEditDialog, setServicoEditDialog] = useState(false)
  const [servicoParaEditar, setServicoParaEditar] = useState<any | null>(null)

  const [showNewClientDialog, setShowNewClientDialog] = useState(false)
  const [showNewProductDialog, setShowNewProductDialog] = useState(false)
  const [produtoComboboxKey, setProdutoComboboxKey] = useState(0)

  const [distanciaKm, setDistanciaKm] = useState(0)
  const [valorBoleto, setValorBoleto] = useState(3.5)
  const [prazoDias, setPrazoDias] = useState(5)
  const [dataInicio, setDataInicio] = useState("")
  const [jurosAm, setJurosAm] = useState(2.0)
  const [impostoServico, setImpostoServico] = useState(10.9)
  const [impostoMaterial, setImpostoMaterial] = useState(12.7)
  const [descontoMdoPercent, setDescontoMdoPercent] = useState(0)

  const [parcelamentoMdo, setParcelamentoMdo] = useState(1)
  const [parcelamentoMaterial, setParcelamentoMaterial] = useState(1)
  const [materialAVista, setMaterialAVista] = useState(false)

  const [valorPorKm, setValorPorKm] = useState(1.5)
  const [dataOrcamento, setDataOrcamento] = useState(new Date().toISOString().split("T")[0])
  const [mostrarValoresAjustados, setMostrarValoresAjustados] = useState(false)

  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    loadLogoMenu()
    loadValorPorKm()
    loadProximoNumero()
  }, [])

  useEffect(() => {
    if (cliente?.distancia_km) {
      setDistanciaKm(cliente.distancia_km)
    }
  }, [cliente])

  useEffect(() => {
    loadProximoNumero()
  }, [dataOrcamento])

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

  const loadProximoNumero = async () => {
    try {
      const response = await fetch(`/api/orcamentos/proximo-numero?data=${dataOrcamento}`)
      const result = await response.json()
      if (result.success && result.data) {
        setProximoNumero(result.data.numero)
      }
    } catch (error) {
      console.error("Erro ao carregar próximo número:", error)
    }
  }

  const handleClienteCreated = (novoCliente: any) => {
    setShowNewClientDialog(false)

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
    setCliente(clienteFormatado)

    // Carregar distância do cliente
    if (clienteFormatado.distancia_km) {
      setDistanciaKm(clienteFormatado.distancia_km)
    }

    toast({
      title: "Cliente criado!",
      description: "O cliente foi criado e selecionado automaticamente.",
    })
  }

  const handleProdutoCreated = async (produtoCriado?: any) => {
    setShowNewProductDialog(false)
    setProdutoComboboxKey((prev) => prev + 1)

    if (produtoCriado) {
      try {
        const response = await fetch(`/api/produtos/${produtoCriado.id}`)
        const result = await response.json()

        if (result.success && result.data) {
          const produtoCompleto = result.data
          await adicionarItem(produtoCompleto)

          toast({
            title: "Produto criado e adicionado",
            description: `${produtoCompleto.descricao} foi criado e adicionado ao orçamento automaticamente.`,
          })
        } else {
          toast({
            title: "Produto criado",
            description: "O produto foi criado com sucesso. Agora você pode selecioná-lo na lista.",
          })
        }
      } catch (error) {
        console.error("Erro ao buscar produto criado:", error)
        toast({
          title: "Produto criado",
          description: "O produto foi criado com sucesso. Agora você pode selecioná-lo na lista.",
        })
      }
    } else {
      toast({
        title: "Produto criado",
        description: "O produto foi criado com sucesso. Agora você pode selecioná-lo na lista.",
      })
    }
  }

  const adicionarItem = async (produto: any) => {
    try {
      const response = await fetch(`/api/produtos/${produto.id}`)
      const result = await response.json()

      let marcaNome = null
      let produtoNcm = null
      if (result.success && result.data) {
        marcaNome = result.data.marca || null
        produtoNcm = result.data.ncm || null
      }

      const novoItem: OrcamentoItem = {
        produto_id: produto.id,
        produto: {
          ...produto,
          ncm: produtoNcm,
        },
        quantidade: 1,
        valor_unitario: produto.valor_unitario,
        valor_mao_obra: produto.valor_mao_obra || 0,
        valor_total: 1 * (produto.valor_unitario + (produto.valor_mao_obra || 0)),
        marca_nome: marcaNome,
        produto_ncm: produtoNcm,
      }
      setItens([...itens, novoItem])
      toast({
        title: "Produto adicionado",
        description: `${produto.descricao} foi adicionado ao orçamento`,
      })
    } catch (error) {
      console.error("Erro ao buscar dados do produto:", error)
      const novoItem: OrcamentoItem = {
        produto_id: produto.id,
        produto,
        quantidade: 1,
        valor_unitario: produto.valor_unitario,
        valor_mao_obra: produto.valor_mao_obra || 0,
        valor_total: 1 * (produto.valor_unitario + (produto.valor_mao_obra || 0)),
      }
      setItens([...itens, novoItem])
    }
  }

  const removerItem = (index: number) => {
    setItens(itens.filter((_, i) => i !== index))
  }

  const atualizarItem = (index: number, campo: keyof OrcamentoItem, valor: any) => {
    const novosItens = [...itens]
    novosItens[index] = { ...novosItens[index], [campo]: valor }

    if (campo === "quantidade" || campo === "valor_unitario" || campo === "valor_mao_obra") {
      const item = novosItens[index]
      novosItens[index].valor_total = item.quantidade * (item.valor_unitario + item.valor_mao_obra)
    }

    setItens(novosItens)
  }

  const editarProduto = async (produto: any) => {
    try {
      const response = await fetch(`/api/produtos/${produto.id}`)
      const result = await response.json()

      if (result.success && result.data) {
        const produtoCompleto = result.data

        if (produtoCompleto.codigo && produtoCompleto.codigo.startsWith("015")) {
          setServicoParaEditar({
            id: produtoCompleto.id.toString(),
            codigo: produtoCompleto.codigo,
            descricao: produtoCompleto.descricao,
            valor_mao_obra: produtoCompleto.valor_mao_obra || 180,
            observacoes: produtoCompleto.observacoes || "",
            ativo: produtoCompleto.ativo !== false,
          })
          setServicoEditDialog(true)
        } else {
          setProdutoParaEditar(produtoCompleto)
          setProdutoEditDialog(true)
        }
      }
    } catch (error) {
      console.error("Erro ao carregar produto para edição:", error)
      toast({
        title: "Erro",
        description: "Erro ao carregar dados do produto",
        variant: "destructive",
      })
    }
  }

  const handleProdutoEditSuccess = async () => {
    if (produtoParaEditar) {
      try {
        const response = await fetch(`/api/produtos/${produtoParaEditar.id}`)
        const result = await response.json()

        if (result.success && result.data) {
          const produtoAtualizado = result.data
          const marcaNome = produtoAtualizado.marca || null
          const produtoNcm = produtoAtualizado.ncm || null

          const novosItens = itens.map((item) => {
            if (item.produto_id === produtoParaEditar.id.toString()) {
              const novoValorUnitario = produtoAtualizado.preco_venda || produtoAtualizado.valor_unitario
              const novoValorMaoObra = produtoAtualizado.valor_mao_obra || 0
              return {
                ...item,
                produto: {
                  ...item.produto,
                  descricao: produtoAtualizado.nome || produtoAtualizado.descricao,
                  valor_unitario: novoValorUnitario,
                  valor_mao_obra: novoValorMaoObra,
                },
                valor_unitario: novoValorUnitario,
                valor_mao_obra: novoValorMaoObra,
                valor_total: item.quantidade * (novoValorUnitario + novoValorMaoObra),
                marca_nome: marcaNome,
                produto_ncm: produtoNcm,
              }
            }
            return item
          })

          setItens(novosItens)
          toast({
            title: "Produto atualizado",
            description: "Os valores do produto foram atualizados no orçamento",
          })
        }
      } catch (error) {
        console.error("Erro ao recarregar produto:", error)
      }
    }

    setProdutoEditDialog(false)
    setProdutoParaEditar(null)
  }

  const handleProdutoEditCancel = (open: boolean) => {
    if (!open) {
      setProdutoEditDialog(false)
      setProdutoParaEditar(null)
    }
  }

  const handleServicoEditSuccess = async () => {
    if (servicoParaEditar) {
      try {
        const response = await fetch(`/api/produtos/${servicoParaEditar.id}`)
        const result = await response.json()

        if (result.success && result.data) {
          const servicoAtualizado = result.data

          const novosItens = itens.map((item) => {
            if (item.produto_id === servicoParaEditar.id.toString()) {
              const novoValorMaoObra = servicoAtualizado.valor_mao_obra || 180
              return {
                ...item,
                produto: {
                  ...item.produto,
                  descricao: servicoAtualizado.descricao,
                  valor_mao_obra: novoValorMaoObra,
                },
                valor_mao_obra: novoValorMaoObra,
                valor_total: item.quantidade * (item.valor_unitario + novoValorMaoObra),
              }
            }
            return item
          })

          setItens(novosItens)
          toast({
            title: "Serviço atualizado",
            description: "Os valores do serviço foram atualizados no orçamento",
          })
        }
      } catch (error) {
        console.error("Erro ao recarregar serviço:", error)
      }
    }

    setServicoEditDialog(false)
    setServicoParaEditar(null)
  }

  const handleServicoEditCancel = (open: boolean) => {
    if (!open) {
      setServicoEditDialog(false)
      setServicoParaEditar(null)
    }
  }

  const calcularValorMaterial = () => {
    return itens.reduce((acc, item) => acc + item.quantidade * item.valor_unitario, 0)
  }

  const calcularValorMaoObra = () => {
    return itens.reduce((acc, item) => acc + item.quantidade * item.valor_mao_obra, 0)
  }

  const calcularCustoDeslocamento = () => {
    return distanciaKm * 2 * valorPorKm * prazoDias
  }

  const calcularSubtotalMdo = () => {
    // Se parcelamento MDO for 0 (sem cobrança), subtotal MDO é 0
    if (parcelamentoMdo === 0) {
      return 0
    }

    // Caso contrário, calcula normally com custo de deslocamento
    return (
      calcularValorMaoObra() -
      calcularDescontoMdoValor() +
      calcularCustoDeslocamento() +
      calcularTaxaBoletoMdo() +
      calcularImpostoServicoValor()
    )
  }

  const calcularSubtotalMaterial = () => {
    if (parcelamentoMaterial === 0 && !materialAVista) return 0

    const custoDeslocamentoExtra = parcelamentoMdo === 0 ? calcularCustoDeslocamento() : 0

    return (
      calcularValorMaterial() +
      calcularValorJuros() +
      calcularTaxaBoletoMaterial() +
      calcularImpostoMaterialValor() +
      custoDeslocamentoExtra
    )
  }

  const calcularValorJuros = () => {
    if (materialAVista || parcelamentoMaterial === 0) return 0
    return ((parcelamentoMdo + parcelamentoMaterial - 1) * jurosAm * calcularValorMaterial()) / 100
  }

  const calcularTaxaBoletoMdo = () => {
    return parcelamentoMdo * valorBoleto
  }

  const calcularTaxaBoletoMaterial = () => {
    if (materialAVista) return valorBoleto
    if (parcelamentoMaterial === 0) return 0
    return parcelamentoMaterial * valorBoleto
  }

  const calcularDescontoMdoValor = () => {
    return (calcularValorMaoObra() * descontoMdoPercent) / 100
  }

  const calcularImpostoServicoValor = () => {
    const base =
      calcularValorMaoObra() - calcularDescontoMdoValor() + calcularCustoDeslocamento() + calcularTaxaBoletoMdo()
    return (base * impostoServico) / 100
  }

  const calcularImpostoMaterialValor = () => {
    if (parcelamentoMaterial === 0 && !materialAVista) return 0
    const base = calcularValorMaterial() + calcularValorJuros() + calcularTaxaBoletoMaterial()
    return (base * impostoMaterial) / 100
  }

  // const calcularSubtotalMdo = () => {
  //   return (
  //     calcularValorMaoObra() -
  //     calcularDescontoMdoValor() +
  //     calcularCustoDeslocamento() +
  //     calcularTaxaBoletoMdo() +
  //     calcularImpostoServicoValor()
  //   )
  // }

  // const calcularSubtotalMaterial = () => {
  //   if (parcelamentoMaterial === 0 && !materialAVista) return 0
  //   return (
  //     calcularValorMaterial() + calcularValorJuros() + calcularTaxaBoletoMaterial() + calcularImpostoMaterialValor()
  //   )
  // }

  const calcularTotal = () => {
    return calcularSubtotalMdo() + calcularSubtotalMaterial() - desconto
  }

  const obterValoresAjustados = () => {
    const valorMaterialBruto = calcularValorMaterial()
    const subtotalMaterial = calcularSubtotalMaterial()

    if (valorMaterialBruto === 0 || subtotalMaterial === 0) {
      return itens
    }

    const fatorAjuste = subtotalMaterial / valorMaterialBruto

    return itens.map((item) => {
      const valorUnitarioAjustado = item.valor_unitario * fatorAjuste
      const valorTotalAjustado = item.quantidade * valorUnitarioAjustado

      return {
        ...item,
        valor_unitario_ajustado: valorUnitarioAjustado,
        valor_total_ajustado: valorTotalAjustado,
      }
    })
  }

  const obterValorUnitario = (item: OrcamentoItem) => {
    if (!mostrarValoresAjustados) return item.valor_unitario

    const valorMaterialBruto = calcularValorMaterial()
    const subtotalMaterial = calcularSubtotalMaterial()

    if (valorMaterialBruto === 0 || subtotalMaterial === 0) return item.valor_unitario

    const fatorAjuste = subtotalMaterial / valorMaterialBruto
    return item.valor_unitario * fatorAjuste
  }

  const obterValorTotalMaterial = (item: OrcamentoItem) => {
    if (!mostrarValoresAjustados) return item.quantidade * item.valor_unitario

    const valorMaterialBruto = calcularValorMaterial()
    const subtotalMaterial = calcularSubtotalMaterial()

    if (valorMaterialBruto === 0 || subtotalMaterial === 0) return item.quantidade * item.valor_unitario

    const fatorAjuste = subtotalMaterial / valorMaterialBruto
    return item.quantidade * (item.valor_unitario * fatorAjuste)
  }

  const salvarOrcamento = async () => {
    if (!cliente) {
      toast({
        title: "Erro",
        description: "Selecione um cliente",
        variant: "destructive",
      })
      return
    }

    if (!tipoServico.trim()) {
      toast({
        title: "Erro",
        description: "Informe o tipo de serviço",
        variant: "destructive",
      })
      return
    }

    if (itens.length === 0) {
      toast({
        title: "Erro",
        description: "Adicione pelo menos um item ao orçamento",
        variant: "destructive",
      })
      return
    }

    try {
      setSaving(true)

      const itensComValoresAjustados = obterValoresAjustados()

      const orcamentoData = {
        cliente_id: cliente.id,
        tipo_servico: tipoServico,
        detalhes_servico: detalhesServico,
        valor_material: calcularValorMaterial(),
        valor_mao_obra: calcularValorMaoObra(),
        desconto,
        valor_total: calcularTotal(),
        validade,
        observacoes,
        situacao,
        data_orcamento: dataOrcamento,
        data_inicio: dataInicio || null,
        distancia_km: distanciaKm,
        valor_boleto: valorBoleto,
        prazo_dias: prazoDias,
        juros_am: jurosAm,
        imposto_servico: impostoServico,
        imposto_material: impostoMaterial,
        desconto_mdo_percent: descontoMdoPercent,
        desconto_mdo_valor: calcularDescontoMdoValor(),
        parcelamento_mdo: parcelamentoMdo,
        parcelamento_material: materialAVista ? 1 : parcelamentoMaterial,
        material_a_vista: materialAVista,
        custo_deslocamento: calcularCustoDeslocamento(),
        valor_juros: calcularValorJuros(),
        taxa_boleto_mdo: calcularTaxaBoletoMdo(),
        taxa_boleto_material: calcularTaxaBoletoMaterial(),
        valor_imposto_servico: calcularImpostoServicoValor(),
        valor_imposto_material: calcularImpostoMaterialValor(),
        subtotal_mdo: calcularSubtotalMdo(),
        subtotal_material: calcularSubtotalMaterial(),
        itens: itensComValoresAjustados.map((item) => ({
          produto_id: item.produto_id,
          quantidade: item.quantidade,
          valor_unitario: item.valor_unitario,
          valor_mao_obra: item.valor_mao_obra,
          valor_total: item.valor_total,
          marca_nome: item.marca_nome,
          produto_ncm: item.produto_ncm,
          valor_unitario_ajustado: item.valor_unitario_ajustado,
          valor_total_ajustado: item.valor_total_ajustado,
        })),
      }

      const response = await fetch("/api/orcamentos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orcamentoData),
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Sucesso!",
          description: `Orçamento ${result.data.numero} criado com sucesso`,
        })
        router.push("/orcamentos")
      } else {
        toast({
          title: "Erro",
          description: result.message || "Erro ao criar orçamento",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Erro ao salvar orçamento:", error)
      toast({
        title: "Erro",
        description: "Erro de conexão. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto p-6 space-y-6">
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
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Novo Orçamento
              </h1>
              <p className="text-gray-600 mt-1">Crie um novo orçamento para seus clientes</p>
              {proximoNumero && (
                <div className="flex items-center gap-2 mt-2">
                  <Hash className="h-4 w-4 text-gray-500" />
                  <Badge variant="outline" className="font-mono text-sm">
                    Próximo: {proximoNumero}
                  </Badge>
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Link href="/orcamentos">
              <Button variant="outline" className="bg-transparent">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
            </Link>
            <Button
              onClick={salvarOrcamento}
              disabled={saving || !cliente || itens.length === 0 || !tipoServico.trim()}
              className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white shadow-lg"
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Salvando..." : "Salvar Orçamento"}
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
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <Label htmlFor="cliente">Cliente *</Label>
                      <ClienteCombobox
                        value={cliente}
                        onValueChange={setCliente}
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
                          {cliente.cep && (
                            <div>
                              <strong>CEP:</strong> {cliente.cep}
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
                          {cliente.distancia_km && (
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
                      <Label htmlFor="tipo_servico">Tipo de Serviço *</Label>
                      <Input
                        id="tipo_servico"
                        value={tipoServico}
                        onChange={(e) => setTipoServico(e.target.value)}
                        placeholder="Ex: Manutenção, Instalação, Reparo..."
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="validade">Validade (dias)</Label>
                      <Input
                        id="validade"
                        type="number"
                        min="1"
                        value={validade}
                        onChange={(e) => setValidade(Number.parseInt(e.target.value) || 30)}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="data_orcamento">Data do Orçamento</Label>
                    <Input
                      id="data_orcamento"
                      type="date"
                      value={dataOrcamento}
                      onChange={(e) => setDataOrcamento(e.target.value)}
                    />
                    <p className="text-xs text-gray-500 mt-1">O número do orçamento será gerado baseado nesta data</p>
                  </div>

                  <div className="border-t pt-4">
                    <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Parâmetros do Orçamento
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="distancia_km">Distância (Km)</Label>
                        <Input
                          id="distancia_km"
                          type="number"
                          step="0.1"
                          min="0"
                          value={distanciaKm}
                          onChange={(e) => setDistanciaKm(Number.parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="valor_boleto">Valor do Boleto (R$)</Label>
                        <Input
                          id="valor_boleto"
                          type="number"
                          step="0.01"
                          min="0"
                          value={valorBoleto}
                          onChange={(e) => setValorBoleto(Number.parseFloat(e.target.value) || 3.5)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="prazo_dias">Prazo (dias)</Label>
                        <Input
                          id="prazo_dias"
                          type="number"
                          min="1"
                          value={prazoDias}
                          onChange={(e) => setPrazoDias(Number.parseInt(e.target.value) || 5)}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                      <div>
                        <Label htmlFor="data_inicio">Data Início</Label>
                        <Input
                          id="data_inicio"
                          type="date"
                          value={dataInicio}
                          onChange={(e) => setDataInicio(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="juros_am">Juros (a.m.) %</Label>
                        <Input
                          id="juros_am"
                          type="number"
                          step="0.01"
                          min="0"
                          value={jurosAm}
                          onChange={(e) => setJurosAm(Number.parseFloat(e.target.value) || 2.0)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="desconto_mdo_percent">Desconto MDO (%)</Label>
                        <Input
                          id="desconto_mdo_percent"
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          value={descontoMdoPercent}
                          onChange={(e) => setDescontoMdoPercent(Number.parseFloat(e.target.value) || 0)}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <div>
                        <Label htmlFor="imposto_servico">Imposto Serviço (%)</Label>
                        <Input
                          id="imposto_servico"
                          type="number"
                          step="0.01"
                          min="0"
                          value={impostoServico}
                          onChange={(e) => setImpostoServico(Number.parseFloat(e.target.value) || 10.9)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="imposto_material">Imposto Material (%)</Label>
                        <Input
                          id="imposto_material"
                          type="number"
                          step="0.01"
                          min="0"
                          value={impostoMaterial}
                          onChange={(e) => setImpostoMaterial(Number.parseFloat(e.target.value) || 12.7)}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="situacao">Situação</Label>
                      <Select value={situacao} onValueChange={setSituacao}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pendente">Pendente</SelectItem>
                          <SelectItem value="enviado por email">Enviado por Email</SelectItem>
                          <SelectItem value="nota fiscal emitida">Nota Fiscal Emitida</SelectItem>
                          <SelectItem value="concluido">Concluído</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="detalhes_servico">Detalhes do Serviço</Label>
                    <Textarea
                      id="detalhes_servico"
                      value={detalhesServico}
                      onChange={(e) => setDetalhesServico(e.target.value)}
                      placeholder="Descreva os detalhes do serviço a ser executado..."
                      rows={3}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Itens do Orçamento */}
            <Card className="border-0 shadow-lg bg-white">
              <CardHeader className="bg-gradient-to-r from-green-500 to-blue-600 text-white rounded-t-lg p-4 lg:p-6">
                <CardTitle className="text-white flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Itens do Orçamento
                </CardTitle>
                <CardDescription className="text-green-100">Adicione produtos e serviços ao orçamento</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Label>Adicionar Produto/Serviço</Label>
                      <ProdutoCombobox
                        key={produtoComboboxKey}
                        onSelect={adicionarItem}
                        placeholder="Busque e selecione um produto..."
                      />
                    </div>
                    <div className="flex items-end">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowNewProductDialog(true)}
                        className="bg-blue-50 hover:bg-blue-100 text-blue-600 border-blue-200 hover:border-blue-300"
                        title="Adicionar novo produto"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Novo Produto
                      </Button>
                    </div>
                  </div>

                  {itens.length > 0 && calcularSubtotalMaterial() > 0 && (
                    <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <DollarSign className="h-4 w-4 text-yellow-600" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-yellow-800">Valores Ajustados para Nota Fiscal</p>
                        <p className="text-xs text-yellow-600">
                          Distribui proporcionalmente impostos, juros e taxas nos valores unitários
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant={mostrarValoresAjustados ? "default" : "outline"}
                        onClick={() => setMostrarValoresAjustados(!mostrarValoresAjustados)}
                        className="text-xs"
                      >
                        {mostrarValoresAjustados ? "Valores Originais" : "Valores Ajustados"}
                      </Button>
                    </div>
                  )}

                  {itens.length > 0 && (
                    <div className="border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-gray-50">
                            <TableHead className="font-semibold">Produto</TableHead>
                            <TableHead className="font-semibold w-32">Quantidade</TableHead>
                            <TableHead className="font-semibold w-28">
                              Valor Unit.
                              {mostrarValoresAjustados && <span className="text-xs text-blue-600"> (Ajust.)</span>}
                            </TableHead>
                            <TableHead className="font-semibold w-28">Mão de Obra</TableHead>
                            <TableHead className="font-semibold w-28">
                              Total{mostrarValoresAjustados && <span className="text-xs text-blue-600"> (Mat.)</span>}
                            </TableHead>
                            <TableHead className="font-semibold w-20">Ações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {itens.map((item, index) => (
                            <TableRow key={index}>
                              <TableCell>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium">{item.produto.descricao}</span>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => editarProduto(item.produto)}
                                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 p-1 h-6 w-6"
                                      title="Editar produto"
                                    >
                                      <Edit2 className="h-3 w-3" />
                                    </Button>
                                  </div>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Badge
                                      variant="outline"
                                      className="text-xs font-mono bg-blue-50 text-blue-700 border-blue-200"
                                    >
                                      {item.produto.codigo}
                                    </Badge>
                                    {item.marca_nome && (
                                      <Badge className="text-xs bg-green-100 text-green-700 border-green-200 hover:bg-green-100">
                                        {item.marca_nome}
                                      </Badge>
                                    )}
                                    {item.produto_ncm && (
                                      <Badge className="text-xs bg-purple-100 text-purple-700 border-purple-200 hover:bg-purple-100 font-mono">
                                        {item.produto_ncm}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  min="1"
                                  step="1"
                                  value={item.quantidade}
                                  onChange={(e) =>
                                    atualizarItem(index, "quantidade", Number.parseInt(e.target.value) || 1)
                                  }
                                  className="w-full text-center font-medium"
                                />
                              </TableCell>
                              <TableCell>
                                <div className="text-sm">
                                  <span className={`font-medium ${mostrarValoresAjustados ? "text-blue-600" : ""}`}>
                                    {formatCurrency(obterValorUnitario(item))}
                                  </span>
                                  {mostrarValoresAjustados && item.valor_unitario_ajustado && (
                                    <div className="text-xs text-gray-500">
                                      Orig: {formatCurrency(item.valor_unitario)}
                                    </div>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <span className="text-sm font-medium">{formatCurrency(item.valor_mao_obra)}</span>
                              </TableCell>
                              <TableCell>
                                <div className="text-sm">
                                  <div
                                    className={`font-semibold ${mostrarValoresAjustados ? "text-blue-600" : "text-green-600"}`}
                                  >
                                    {mostrarValoresAjustados
                                      ? formatCurrency(obterValorTotalMaterial(item))
                                      : formatCurrency(item.valor_total)}
                                  </div>
                                  {mostrarValoresAjustados && (
                                    <div className="text-xs text-gray-500">
                                      + MDO: {formatCurrency(item.quantidade * item.valor_mao_obra)}
                                    </div>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => removerItem(index)}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                                  title="Remover item"
                                >
                                  <Minus className="h-3 w-3" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}

                  {itens.length === 0 && (
                    <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                      <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <p className="text-gray-600">Nenhum item adicionado</p>
                      <p className="text-sm text-gray-500">Use o campo acima para adicionar produtos</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Observações */}
            <Card className="border-0 shadow-lg bg-white">
              <CardHeader className="bg-gradient-to-r from-green-500 to-blue-600 text-white rounded-t-lg p-4 lg:p-6">
                <CardTitle>Observações</CardTitle>
                <CardDescription>Informações adicionais sobre o orçamento</CardDescription>
              </CardHeader>
              <CardContent>
                <div>
                  <Textarea
                    placeholder="Digite observações sobre o orçamento..."
                    value={observacoes}
                    onChange={(e) => setObservacoes(e.target.value)}
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Resumo */}
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
                      <Calendar className="h-4 w-4" />
                      Parcelamento
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label htmlFor="parcelamento_mdo" className="text-xs">
                          MDO
                        </Label>
                        <Input
                          id="parcelamento_mdo"
                          type="number"
                          min="0" // Changed from 1 to 0 to allow for "Sem cobrança"
                          value={parcelamentoMdo}
                          onChange={(e) => setParcelamentoMdo(Number.parseInt(e.target.value) || 0)}
                          className="text-sm"
                        />
                        <div className="text-xs text-gray-500 mt-1">
                          {parcelamentoMdo === 0
                            ? "Sem cobrança"
                            : parcelamentoMdo === 1
                              ? "À vista"
                              : parcelamentoMdo === 2
                                ? "À vista + 30dd"
                                : parcelamentoMdo === 3
                                  ? "À vista + 30dd + 60dd"
                                  : `À vista + ${parcelamentoMdo - 1}x 30dd`}
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="parcelamento_material" className="text-xs">
                          Material
                        </Label>
                        <Input
                          id="parcelamento_material"
                          type="number"
                          min="0"
                          value={parcelamentoMaterial}
                          onChange={(e) => setParcelamentoMaterial(Number.parseInt(e.target.value) || 0)}
                          className="text-sm"
                          disabled={materialAVista}
                        />
                        <div className="text-xs text-gray-500 mt-1">
                          {materialAVista
                            ? "À vista"
                            : parcelamentoMaterial === 0
                              ? "Sem cobrança"
                              : parcelamentoMaterial === 1
                                ? "À vista"
                                : `${parcelamentoMaterial}x`}
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <input
                            type="checkbox"
                            id="material_a_vista"
                            checked={materialAVista}
                            onChange={(e) => {
                              setMaterialAVista(e.target.checked)
                              if (e.target.checked) {
                                setParcelamentoMaterial(1)
                              }
                            }}
                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <Label htmlFor="material_a_vista" className="text-xs cursor-pointer">
                            Material à vista
                          </Label>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Valor Material:</span>
                      <span className="font-medium">{formatCurrency(calcularValorMaterial())}</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Mão de Obra:</span>
                      <span className="font-medium text-blue-600">
                        {parcelamentoMdo === 0
                          ? "Sem cobrança"
                          : parcelamentoMdo === 1
                            ? `À vista - ${formatCurrency(calcularSubtotalMdo())}`
                            : `${parcelamentoMdo}x de ${formatCurrency(calcularSubtotalMdo() / parcelamentoMdo)}`}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Material:</span>
                      <span className="font-medium text-blue-600">
                        {materialAVista
                          ? `À vista - ${formatCurrency(calcularSubtotalMaterial())}`
                          : parcelamentoMaterial === 0
                            ? "Sem cobrança"
                            : parcelamentoMaterial === 1
                              ? `À vista - ${formatCurrency(calcularSubtotalMaterial())}`
                              : `${parcelamentoMaterial}x de ${formatCurrency(calcularSubtotalMaterial() / parcelamentoMaterial)}`}
                      </span>
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

                    {descontoMdoPercent > 0 && (
                      <div className="flex justify-between items-center text-red-600">
                        <span>Desconto MDO ({descontoMdoPercent}%):</span>
                        <span className="font-medium">-{formatCurrency(calcularDescontoMdoValor())}</span>
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

                    {mostrarValoresAjustados && calcularSubtotalMaterial() > 0 && (
                      <div className="bg-blue-50 p-2 rounded border border-blue-200">
                        <div className="text-xs font-medium text-blue-800 mb-1">Distribuição Proporcional:</div>
                        <div className="flex justify-between text-xs text-blue-700">
                          <span>Fator de Ajuste:</span>
                          <span>{((calcularSubtotalMaterial() / calcularValorMaterial()) * 100).toFixed(2)}%</span>
                        </div>
                        <div className="flex justify-between text-xs text-blue-700">
                          <span>Diferença Distribuída:</span>
                          <span>{formatCurrency(calcularSubtotalMaterial() - calcularValorMaterial())}</span>
                        </div>
                      </div>
                    )}

                    {desconto > 0 && (
                      <div className="flex justify-between items-center text-red-600">
                        <span>Desconto:</span>
                        <span className="font-medium">-{formatCurrency(desconto)}</span>
                      </div>
                    )}

                    <div className="border-t pt-4">
                      <div className="flex justify-between items-center text-lg font-bold">
                        <span>Total:</span>
                        <span className="text-green-600">{formatCurrency(calcularTotal())}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 space-y-2 text-sm text-gray-600">
                    <div className="flex justify-between">
                      <span>Itens:</span>
                      <span>{itens.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Cliente:</span>
                      <span>{cliente ? cliente.nome : "Não selecionado"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Validade:</span>
                      <span>{validade} dias</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Situação:</span>
                      <Badge variant="outline" className="text-xs">
                        {situacao === "pendente" && "Pendente"}
                        {situacao === "enviado por email" && "Enviado por Email"}
                        {situacao === "nota fiscal emitida" && "Nota Fiscal Emitida"}
                        {situacao === "concluido" && "Concluído"}
                      </Badge>
                    </div>
                    {proximoNumero && (
                      <div className="flex justify-between">
                        <span>Número:</span>
                        <Badge variant="outline" className="text-xs font-mono">
                          {proximoNumero}
                        </Badge>
                      </div>
                    )}
                  </div>

                  <Button
                    onClick={salvarOrcamento}
                    disabled={saving || !cliente || itens.length === 0 || !tipoServico.trim()}
                    className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white shadow-lg"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? "Salvando..." : "Salvar Orçamento"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <ProdutoFormDialog
        open={produtoEditDialog}
        onOpenChange={handleProdutoEditCancel}
        produto={produtoParaEditar}
        onSuccess={handleProdutoEditSuccess}
      />

      <ClienteFormDialog
        open={showNewClientDialog}
        onOpenChange={setShowNewClientDialog}
        onSuccess={handleClienteCreated}
      />

      <ProdutoFormDialog
        open={showNewProductDialog}
        onOpenChange={setShowNewProductDialog}
        onSuccess={handleProdutoCreated}
      />

      <EditarServicoDialog
        open={servicoEditDialog}
        onOpenChange={handleServicoEditCancel}
        servico={servicoParaEditar}
        onSuccess={handleServicoEditSuccess}
      />
    </div>
  )
}
