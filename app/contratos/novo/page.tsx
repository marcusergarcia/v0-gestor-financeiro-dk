"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, Save, Loader2 } from "lucide-react"

interface Cliente {
  id: string
  nome: string
  codigo: string
}

interface Proposta {
  numero: string
  cliente_id: string
  cliente_nome: string
  valor_total_proposta: number
  prazo_contrato: string
  tipo: string
}

const PRAZO_CONTRATO_OPTIONS = [
  { value: "12", label: "12 meses" },
  { value: "24", label: "24 meses" },
  { value: "indeterminado", label: "Indeterminado" },
]

export default function NovoContratoPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [propostas, setPropostas] = useState<Proposta[]>([])
  const [loadingClientes, setLoadingClientes] = useState(true)
  const [loadingPropostas, setLoadingPropostas] = useState(true)

  const [formData, setFormData] = useState({
    numero: "",
    cliente_id: "",
    proposta_id: "",
    data_inicio: new Date().toISOString().split("T")[0],
    data_assinatura: new Date().toISOString().split("T")[0],
    valor_mensal: "",
    frequencia: "mensal",
    dia_vencimento: "10",
    forma_pagamento: "boleto",
    prazo_meses: "12",
    garantia: "90",
    servicos_inclusos: "",
    observacoes: "",
    status: "ativo",
  })

  // Carregar clientes
  useEffect(() => {
    const fetchClientes = async () => {
      try {
        const response = await fetch("/api/clientes")
        const data = await response.json()
        if (data.success) {
          setClientes(data.data)
        }
      } catch (error) {
        console.error("Erro ao carregar clientes:", error)
      } finally {
        setLoadingClientes(false)
      }
    }

    fetchClientes()
  }, [])

  // Carregar propostas
  useEffect(() => {
    const fetchPropostas = async () => {
      try {
        const response = await fetch("/api/propostas-contratos")
        const data = await response.json()
        if (data.success) {
          setPropostas(data.data)
        }
      } catch (error) {
        console.error("Erro ao carregar propostas:", error)
      } finally {
        setLoadingPropostas(false)
      }
    }

    fetchPropostas()
  }, [])

  // Gerar número do contrato
  useEffect(() => {
    const generateNumber = () => {
      const today = new Date()
      const year = today.getFullYear()
      const month = String(today.getMonth() + 1).padStart(2, "0")
      const day = String(today.getDate()).padStart(2, "0")
      const random = Math.floor(Math.random() * 1000)
        .toString()
        .padStart(3, "0")
      return `${year}${month}${day}-${random}`
    }

    if (!formData.numero) {
      setFormData((prev) => ({
        ...prev,
        numero: generateNumber(),
      }))
    }
  }, [formData.numero])

  // Quando selecionar uma proposta, preencher dados automaticamente
  const handlePropostaChange = (propostaNumero: string) => {
    const proposta = propostas.find((p) => p.numero === propostaNumero)
    if (proposta) {
      setFormData((prev) => ({
        ...prev,
        proposta_id: propostaNumero,
        cliente_id: proposta.cliente_id,
        valor_mensal: proposta.valor_total_proposta.toString(),
        prazo_meses: proposta.prazo_contrato,
      }))
    } else {
      setFormData((prev) => ({
        ...prev,
        proposta_id: propostaNumero,
      }))
    }
  }

  const calcularDataFim = () => {
    if (!formData.data_inicio || formData.prazo_meses === "indeterminado") {
      return ""
    }

    const inicio = new Date(formData.data_inicio)
    const meses = Number.parseInt(formData.prazo_meses)
    inicio.setMonth(inicio.getMonth() + meses)
    return inicio.toISOString().split("T")[0]
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Validações básicas
      if (!formData.numero || !formData.cliente_id) {
        toast({
          title: "Erro",
          description: "Número do contrato e cliente são obrigatórios",
          variant: "destructive",
        })
        return
      }

      const response = await fetch("/api/contratos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          valor_mensal: Number.parseFloat(formData.valor_mensal) || 0,
          dia_vencimento: Number.parseInt(formData.dia_vencimento) || 10,
          prazo_meses: formData.prazo_meses,
          garantia: Number.parseInt(formData.garantia) || 90,
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Sucesso",
          description: "Contrato criado com sucesso",
        })
        router.push(`/contratos/${formData.numero}`)
      } else {
        toast({
          title: "Erro",
          description: data.message || "Erro ao criar contrato",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Erro ao criar contrato:", error)
      toast({
        title: "Erro",
        description: "Erro interno do servidor",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <h1 className="text-2xl font-bold">Novo Contrato</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Informações Básicas */}
          <Card>
            <CardHeader>
              <CardTitle>Informações Básicas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="numero">Número do Contrato</Label>
                <Input
                  id="numero"
                  value={formData.numero}
                  onChange={(e) => setFormData((prev) => ({ ...prev, numero: e.target.value }))}
                  required
                />
              </div>

              <div>
                <Label htmlFor="proposta">Proposta (Opcional)</Label>
                <Select value={formData.proposta_id} onValueChange={handlePropostaChange}>
                  <SelectTrigger>
                    <SelectValue placeholder={loadingPropostas ? "Carregando..." : "Selecione uma proposta"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhuma proposta</SelectItem>
                    {propostas.map((proposta) => (
                      <SelectItem key={proposta.numero} value={proposta.numero}>
                        {proposta.numero} - {proposta.cliente_nome} - R$ {proposta.valor_total_proposta.toFixed(2)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="cliente">Cliente</Label>
                <Select
                  value={formData.cliente_id}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, cliente_id: value }))}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder={loadingClientes ? "Carregando..." : "Selecione um cliente"} />
                  </SelectTrigger>
                  <SelectContent>
                    {clientes.map((cliente) => (
                      <SelectItem key={cliente.id} value={cliente.id}>
                        {cliente.codigo} - {cliente.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="data_inicio">Data de Início</Label>
                  <Input
                    id="data_inicio"
                    type="date"
                    value={formData.data_inicio}
                    onChange={(e) => setFormData((prev) => ({ ...prev, data_inicio: e.target.value }))}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="data_assinatura">Data de Assinatura</Label>
                  <Input
                    id="data_assinatura"
                    type="date"
                    value={formData.data_assinatura}
                    onChange={(e) => setFormData((prev) => ({ ...prev, data_assinatura: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, status: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ativo">Ativo</SelectItem>
                    <SelectItem value="suspenso">Suspenso</SelectItem>
                    <SelectItem value="cancelado">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Informações Financeiras */}
          <Card>
            <CardHeader>
              <CardTitle>Informações Financeiras</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="valor_mensal">Valor Mensal (R$)</Label>
                <Input
                  id="valor_mensal"
                  type="number"
                  step="0.01"
                  value={formData.valor_mensal}
                  onChange={(e) => setFormData((prev) => ({ ...prev, valor_mensal: e.target.value }))}
                  required
                />
              </div>

              <div>
                <Label htmlFor="frequencia">Frequência</Label>
                <Select
                  value={formData.frequencia}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, frequencia: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mensal">Mensal</SelectItem>
                    <SelectItem value="trimestral">Trimestral</SelectItem>
                    <SelectItem value="semestral">Semestral</SelectItem>
                    <SelectItem value="anual">Anual</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="dia_vencimento">Dia do Vencimento</Label>
                <Input
                  id="dia_vencimento"
                  type="number"
                  min="1"
                  max="31"
                  value={formData.dia_vencimento}
                  onChange={(e) => setFormData((prev) => ({ ...prev, dia_vencimento: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="forma_pagamento">Forma de Pagamento</Label>
                <Select
                  value={formData.forma_pagamento}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, forma_pagamento: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="boleto">Boleto</SelectItem>
                    <SelectItem value="pix">PIX</SelectItem>
                    <SelectItem value="transferencia">Transferência</SelectItem>
                    <SelectItem value="cartao">Cartão</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="prazo_contrato">Prazo do Contrato</Label>
                <Select
                  value={formData.prazo_meses}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, prazo_meses: value }))}
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

              {formData.prazo_meses !== "indeterminado" && formData.data_inicio && (
                <div>
                  <Label>Data de Término (Calculada)</Label>
                  <Input type="date" value={calcularDataFim()} disabled />
                </div>
              )}

              <div>
                <Label htmlFor="garantia">Garantia (dias)</Label>
                <Input
                  id="garantia"
                  type="number"
                  min="0"
                  value={formData.garantia}
                  onChange={(e) => setFormData((prev) => ({ ...prev, garantia: e.target.value }))}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Informações Adicionais */}
        <Card>
          <CardHeader>
            <CardTitle>Informações Adicionais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="servicos_inclusos">Serviços Inclusos</Label>
              <Textarea
                id="servicos_inclusos"
                value={formData.servicos_inclusos}
                onChange={(e) => setFormData((prev) => ({ ...prev, servicos_inclusos: e.target.value }))}
                placeholder="Descreva os serviços inclusos no contrato..."
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                value={formData.observacoes}
                onChange={(e) => setFormData((prev) => ({ ...prev, observacoes: e.target.value }))}
                placeholder="Observações adicionais..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Botões */}
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancelar
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Salvar Contrato
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
