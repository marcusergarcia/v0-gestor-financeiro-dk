"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, Save, User, Package, FileText } from "lucide-react"

interface ContratoData {
  numero: string
  cliente_id: string
  proposta_id?: string
  quantidade_visitas: number
  data_inicio: string
  data_fim: string
  valor_mensal: number
  frequencia: string
  dia_vencimento: number
  forma_pagamento: string
  equipamentos_inclusos: any[]
  equipamentos_consignacao: string
  servicos_inclusos: string
  observacoes: string
  status: string
  data_proposta: string
  prazo_meses: string
  cliente_nome: string
  cliente_codigo: string
  cliente_cnpj?: string
  cliente_cpf?: string
  cliente_email: string
  cliente_telefone: string
  cliente_endereco: string
  cliente_bairro?: string
  cliente_cidade: string
  cliente_estado: string
  cliente_cep: string
  cliente_contato?: string
  cliente_distancia_km?: number
  cliente_sindico?: string
  cliente_rg_sindico?: string
  cliente_cpf_sindico?: string
  cliente_zelador?: string
  cliente_tem_contrato?: boolean
  cliente_dia_contrato?: number
  cliente_observacoes?: string
  proposta_numero?: string
  proposta_tipo?: string
  valor_total_proposta?: number
  proposta_desconto?: number
  prazo_contrato?: string
  itens_proposta: any[]
}

const PRAZO_CONTRATO_OPTIONS = [
  { value: "12", label: "12 meses" },
  { value: "24", label: "24 meses" },
  { value: "indeterminado", label: "Indeterminado (1 mês)" },
]

export default function EditarContratoPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [contrato, setContrato] = useState<ContratoData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const numero = params.numero as string

  const fetchContrato = async () => {
    try {
      const response = await fetch(`/api/contratos/${numero}`)
      const result = await response.json()

      if (result.success) {
        const contratoData = result.data
        // Garantir que prazo_meses seja string
        if (contratoData.prazo_contrato) {
          contratoData.prazo_meses = contratoData.prazo_contrato.toString()
        } else if (contratoData.prazo_meses) {
          contratoData.prazo_meses = contratoData.prazo_meses.toString()
        } else {
          contratoData.prazo_meses = "12"
        }
        setContrato(contratoData)
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

  const handleSave = async () => {
    if (!contrato) return

    setSaving(true)
    try {
      const dadosParaSalvar = {
        cliente_id: contrato.cliente_id,
        proposta_id: contrato.proposta_id,
        quantidade_visitas: contrato.quantidade_visitas,
        data_inicio: contrato.data_inicio,
        data_fim: contrato.data_fim,
        valor_mensal: contrato.valor_mensal,
        frequencia: contrato.frequencia,
        dia_vencimento: contrato.dia_vencimento,
        forma_pagamento: contrato.forma_pagamento,
        equipamentos_inclusos: contrato.equipamentos_inclusos,
        equipamentos_consignacao: contrato.equipamentos_consignacao || "",
        observacoes: contrato.observacoes,
        status: contrato.status,
        data_proposta: contrato.data_proposta,
        prazo_meses: contrato.prazo_meses,
        cliente_dia_contrato: contrato.cliente_dia_contrato,
      }

      console.log("Salvando contrato com dados:", dadosParaSalvar)

      const response = await fetch(`/api/contratos/${numero}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dadosParaSalvar),
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Sucesso",
          description: "Contrato atualizado com sucesso",
        })
        router.push(`/contratos/${numero}`)
      } else {
        toast({
          title: "Erro",
          description: result.message || "Erro ao salvar contrato",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Erro ao salvar contrato:", error)
      toast({
        title: "Erro",
        description: "Erro ao salvar contrato",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const calculateDataFim = (dataInicio: string, prazoMeses: string) => {
    if (!dataInicio || !prazoMeses) return ""

    const dataInicioDate = new Date(dataInicio)
    const dataFimDate = new Date(dataInicioDate)

    // Se for indeterminado, calcular como 1 mês
    const meses = prazoMeses === "indeterminado" ? 1 : Number.parseInt(prazoMeses)

    dataFimDate.setMonth(dataFimDate.getMonth() + meses)
    return dataFimDate.toISOString().split("T")[0]
  }

  const updateContrato = (field: string, value: any) => {
    if (!contrato) return

    setContrato((prev) => {
      if (!prev) return null

      const updated = { ...prev, [field]: value }

      if (field === "data_inicio" || field === "prazo_meses") {
        const novaDataFim = calculateDataFim(
          field === "data_inicio" ? value : updated.data_inicio,
          field === "prazo_meses" ? value : updated.prazo_meses,
        )
        updated.data_fim = novaDataFim
      }

      return updated
    })
  }

  const updateCliente = async (field: string, value: any) => {
    if (!contrato) return

    setContrato((prev) => {
      if (!prev) return null

      const updated = { ...prev, [field]: value }

      if (field === "cliente_dia_contrato") {
        updated.dia_vencimento = value
      }

      return updated
    })

    try {
      const clienteData = {
        nome: contrato.cliente_nome,
        codigo: contrato.cliente_codigo,
        cnpj: contrato.cliente_cnpj || null,
        cpf: contrato.cliente_cpf || null,
        email: contrato.cliente_email || "",
        telefone: contrato.cliente_telefone || "",
        endereco: contrato.cliente_endereco || "",
        bairro: contrato.cliente_bairro || "",
        cidade: contrato.cliente_cidade || "",
        estado: contrato.cliente_estado || "",
        cep: contrato.cliente_cep || "",
        contato: contrato.cliente_contato || "",
        distancia_km: contrato.cliente_distancia_km || 0,
        sindico: contrato.cliente_sindico || "",
        rg_sindico: contrato.cliente_rg_sindico || "",
        cpf_sindico: contrato.cliente_cpf_sindico || "",
        zelador: contrato.cliente_zelador || "",
        tem_contrato: contrato.cliente_tem_contrato || false,
        dia_contrato: contrato.cliente_dia_contrato || null,
        observacoes: contrato.cliente_observacoes || "",
        [field.replace("cliente_", "")]: value,
      }

      const response = await fetch(`/api/clientes/${contrato.cliente_id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(clienteData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        toast({
          title: "Aviso",
          description: "Erro ao atualizar dados do cliente: " + (errorData.message || "Erro desconhecido"),
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Erro ao atualizar cliente:", error)
      toast({
        title: "Aviso",
        description: "Erro ao atualizar dados do cliente",
        variant: "destructive",
      })
    }
  }

  const formatCNPJ = (cnpj: string) => {
    if (!cnpj) return ""
    const numbers = cnpj.replace(/\D/g, "")
    if (numbers.length <= 14) {
      return numbers.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5")
    }
    return cnpj
  }

  useEffect(() => {
    fetchContrato()
  }, [numero])

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Carregando contrato...</div>
        </div>
      </div>
    )
  }

  if (!contrato) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-red-600">Contrato não encontrado</div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Editar Contrato</h1>
            <p className="text-muted-foreground">Contrato #{contrato.numero}</p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? "Salvando..." : "Salvar"}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="bg-blue-50">
            <CardTitle className="flex items-center gap-2 text-blue-700">
              <User className="h-5 w-5" />
              Dados do Cliente
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <div>
              <Label className="text-sm font-medium">Nome</Label>
              <p className="text-sm font-semibold">{contrato.cliente_nome}</p>
            </div>

            <div>
              <Label className="text-sm font-medium">Código</Label>
              <p className="text-sm">{contrato.cliente_codigo}</p>
            </div>

            {contrato.cliente_cnpj && (
              <div>
                <Label className="text-sm font-medium">CNPJ</Label>
                <p className="text-sm font-mono">{formatCNPJ(contrato.cliente_cnpj)}</p>
              </div>
            )}

            {contrato.cliente_cpf && (
              <div>
                <Label className="text-sm font-medium">CPF</Label>
                <p className="text-sm font-mono">{contrato.cliente_cpf}</p>
              </div>
            )}

            <div>
              <Label htmlFor="cliente_email">Email</Label>
              <Input
                id="cliente_email"
                type="email"
                value={contrato.cliente_email || ""}
                onChange={(e) => updateCliente("cliente_email", e.target.value)}
                placeholder="email@exemplo.com"
              />
            </div>

            <div>
              <Label htmlFor="cliente_telefone">Telefone</Label>
              <Input
                id="cliente_telefone"
                value={contrato.cliente_telefone || ""}
                onChange={(e) => updateCliente("cliente_telefone", e.target.value)}
                placeholder="(11) 99999-9999"
              />
            </div>

            <div>
              <Label htmlFor="cliente_endereco">Endereço</Label>
              <Input
                id="cliente_endereco"
                value={contrato.cliente_endereco || ""}
                onChange={(e) => updateCliente("cliente_endereco", e.target.value)}
                placeholder="Rua, número"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="cliente_bairro">Bairro</Label>
                <Input
                  id="cliente_bairro"
                  value={contrato.cliente_bairro || ""}
                  onChange={(e) => updateCliente("cliente_bairro", e.target.value)}
                  placeholder="Bairro"
                />
              </div>
              <div>
                <Label htmlFor="cliente_cep">CEP</Label>
                <Input
                  id="cliente_cep"
                  value={contrato.cliente_cep || ""}
                  onChange={(e) => updateCliente("cliente_cep", e.target.value)}
                  placeholder="00000-000"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="cliente_cidade">Cidade</Label>
                <Input
                  id="cliente_cidade"
                  value={contrato.cliente_cidade || ""}
                  onChange={(e) => updateCliente("cliente_cidade", e.target.value)}
                  placeholder="Cidade"
                />
              </div>
              <div>
                <Label htmlFor="cliente_estado">Estado</Label>
                <Input
                  id="cliente_estado"
                  value={contrato.cliente_estado || ""}
                  onChange={(e) => updateCliente("cliente_estado", e.target.value)}
                  placeholder="SP"
                  maxLength={2}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="cliente_contato">Contato</Label>
              <Input
                id="cliente_contato"
                value={contrato.cliente_contato || ""}
                onChange={(e) => updateCliente("cliente_contato", e.target.value)}
                placeholder="Nome do contato"
              />
            </div>

            <div>
              <Label htmlFor="cliente_sindico">Síndico</Label>
              <Input
                id="cliente_sindico"
                value={contrato.cliente_sindico || ""}
                onChange={(e) => updateCliente("cliente_sindico", e.target.value)}
                placeholder="Nome do síndico"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="cliente_rg_sindico">RG do Síndico</Label>
                <Input
                  id="cliente_rg_sindico"
                  value={contrato.cliente_rg_sindico || ""}
                  onChange={(e) => updateCliente("cliente_rg_sindico", e.target.value)}
                  placeholder="00.000.000-0"
                />
              </div>
              <div>
                <Label htmlFor="cliente_cpf_sindico">CPF do Síndico</Label>
                <Input
                  id="cliente_cpf_sindico"
                  value={contrato.cliente_cpf_sindico || ""}
                  onChange={(e) => updateCliente("cliente_cpf_sindico", e.target.value)}
                  placeholder="000.000.000-00"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="cliente_zelador">Zelador</Label>
              <Input
                id="cliente_zelador"
                value={contrato.cliente_zelador || ""}
                onChange={(e) => updateCliente("cliente_zelador", e.target.value)}
                placeholder="Nome do zelador"
              />
            </div>

            <div>
              <Label htmlFor="cliente_distancia_km">Distância (km)</Label>
              <Input
                id="cliente_distancia_km"
                type="number"
                step="0.1"
                value={contrato.cliente_distancia_km || ""}
                onChange={(e) => updateCliente("cliente_distancia_km", Number(e.target.value))}
                placeholder="0.0"
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border-2 border-blue-200">
              <div className="flex-1">
                <Label htmlFor="cliente_tem_contrato" className="text-sm font-semibold cursor-pointer">
                  Cliente tem contrato ativo
                </Label>
                <p className="text-xs text-muted-foreground mt-1">Ative para definir o dia do contrato</p>
              </div>
              <Switch
                id="cliente_tem_contrato"
                checked={contrato.cliente_tem_contrato || false}
                onCheckedChange={(checked) => updateCliente("cliente_tem_contrato", checked)}
                className="ml-2"
              />
            </div>

            {contrato.cliente_tem_contrato && (
              <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                <Label htmlFor="cliente_dia_contrato">Dia do Contrato</Label>
                <Input
                  id="cliente_dia_contrato"
                  type="number"
                  min="1"
                  max="31"
                  value={contrato.cliente_dia_contrato || ""}
                  onChange={(e) => updateCliente("cliente_dia_contrato", Number(e.target.value))}
                  placeholder="Dia do mês"
                  className="mt-2"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  ℹ️ Este valor também será usado como dia de vencimento do contrato
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {contrato.itens_proposta && contrato.itens_proposta.length > 0 && (
          <Card>
            <CardHeader className="bg-green-50">
              <CardTitle className="flex items-center gap-2 text-green-700">
                <Package className="h-5 w-5" />
                Equipamentos Inclusos
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-3">
                {contrato.itens_proposta.map((item, index) => (
                  <div key={index} className="border-b pb-2 last:border-b-0">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{item.equipamento_nome}</p>
                        <p className="text-xs text-muted-foreground">{item.equipamento_categoria}</p>
                        {item.equipamento_descricao && (
                          <p className="text-xs text-muted-foreground mt-1">{item.equipamento_descricao}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">Qtd: {item.quantidade}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="bg-orange-50">
            <CardTitle className="flex items-center gap-2 text-orange-700">
              <FileText className="h-5 w-5" />
              Dados do Contrato
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="quantidade_visitas">Visitas/Mês</Label>
                <Input
                  id="quantidade_visitas"
                  type="number"
                  min="1"
                  value={contrato.quantidade_visitas}
                  onChange={(e) => updateContrato("quantidade_visitas", Number(e.target.value))}
                />
              </div>
              <div>
                <Label htmlFor="valor_mensal">Valor Mensal (R$)</Label>
                <Input
                  id="valor_mensal"
                  type="number"
                  step="0.01"
                  min="0"
                  value={contrato.valor_mensal}
                  onChange={(e) => updateContrato("valor_mensal", Number(e.target.value))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="data_inicio">Data Início</Label>
                <Input
                  id="data_inicio"
                  type="date"
                  value={contrato.data_inicio}
                  onChange={(e) => updateContrato("data_inicio", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="data_fim">Data Fim (Calculada)</Label>
                <Input
                  id="data_fim"
                  type="date"
                  value={contrato.data_fim}
                  disabled
                  className="bg-gray-50 text-gray-600"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {contrato.prazo_meses === "indeterminado"
                    ? "Renovação automática mensal"
                    : "Calculada automaticamente"}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="prazo_contrato">Prazo do Contrato</Label>
                <Select
                  value={contrato.prazo_meses || "12"}
                  onValueChange={(value) => updateContrato("prazo_meses", value)}
                >
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
                <Label htmlFor="dia_vencimento">Dia Vencimento</Label>
                <Input
                  id="dia_vencimento"
                  type="number"
                  min="1"
                  max="31"
                  value={contrato.dia_vencimento}
                  disabled
                  className="bg-gray-50 text-gray-600"
                />
                <p className="text-xs text-muted-foreground mt-1">Sincronizado com o dia do contrato do cliente</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="frequencia">Frequência</Label>
                <Select value={contrato.frequencia} onValueChange={(value) => updateContrato("frequencia", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="semanal">Semanal</SelectItem>
                    <SelectItem value="quinzenal">Quinzenal</SelectItem>
                    <SelectItem value="mensal">Mensal</SelectItem>
                    <SelectItem value="bimestral">Bimestral</SelectItem>
                    <SelectItem value="trimestral">Trimestral</SelectItem>
                    <SelectItem value="semestral">Semestral</SelectItem>
                    <SelectItem value="anual">Anual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="forma_pagamento">Forma de Pagamento</Label>
                <Select
                  value={contrato.forma_pagamento}
                  onValueChange={(value) => updateContrato("forma_pagamento", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="boleto">Boleto</SelectItem>
                    <SelectItem value="pix">PIX</SelectItem>
                    <SelectItem value="transferencia">Transferência</SelectItem>
                    <SelectItem value="dinheiro">Dinheiro</SelectItem>
                    <SelectItem value="cartao_debito">Cartão de Débito</SelectItem>
                    <SelectItem value="cartao_credito">Cartão de Crédito</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={contrato.status} onValueChange={(value) => updateContrato("status", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="suspenso">Suspenso</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
                  <SelectItem value="finalizado">Finalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="equipamentos_consignacao">Equipamentos em Consignação</Label>
              <Textarea
                id="equipamentos_consignacao"
                value={contrato.equipamentos_consignacao || ""}
                onChange={(e) => updateContrato("equipamentos_consignacao", e.target.value)}
                rows={4}
                placeholder="Liste os equipamentos fornecidos em consignação ao cliente..."
              />
              <p className="text-xs text-muted-foreground mt-1">
                ℹ️ Será exibido na minuta do contrato logo após os equipamentos inclusos
              </p>
            </div>

            <div>
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                value={contrato.observacoes || ""}
                onChange={(e) => updateContrato("observacoes", e.target.value)}
                rows={3}
                placeholder="Observações adicionais sobre o contrato..."
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
