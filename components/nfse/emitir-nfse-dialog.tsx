"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Loader2, Send, AlertCircle, User, FileText, DollarSign } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { formatCurrency } from "@/lib/utils"

interface EmitirNfseDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
  // Pré-preenchimento a partir de origem
  dadosOrigem?: {
    origem: string
    origem_id?: number
    origem_numero?: string
    cliente_id?: number
    cliente_nome?: string
    cliente_cnpj?: string
    cliente_cpf?: string
    cliente_email?: string
    cliente_telefone?: string
    cliente_endereco?: string
    cliente_bairro?: string
    cliente_cidade?: string
    cliente_uf?: string
    cliente_cep?: string
    valor?: number
    descricao?: string
  }
}

export function EmitirNfseDialog({ open, onOpenChange, onSuccess, dadosOrigem }: EmitirNfseDialogProps) {
  const [loading, setLoading] = useState(false)
  const [clientes, setClientes] = useState<any[]>([])
  const [clienteSelecionado, setClienteSelecionado] = useState<any>(null)
  const [searchCliente, setSearchCliente] = useState("")

  // Dados do formulário
  const [form, setForm] = useState({
    origem: dadosOrigem?.origem || "avulsa",
    origem_id: dadosOrigem?.origem_id || null,
    origem_numero: dadosOrigem?.origem_numero || "",
    cliente_id: dadosOrigem?.cliente_id || null,
    tomador_tipo: "PJ" as "PF" | "PJ",
    tomador_cpf_cnpj: "",
    tomador_inscricao_municipal: "",
    tomador_razao_social: "",
    tomador_email: "",
    tomador_telefone: "",
    tomador_endereco: "",
    tomador_numero: "",
    tomador_complemento: "",
    tomador_bairro: "",
    tomador_cidade: "",
    tomador_uf: "",
    tomador_cep: "",
    tomador_codigo_municipio: "",
    descricao_servico: dadosOrigem?.descricao || "",
    valor_servicos: dadosOrigem?.valor || 0,
    valor_deducoes: 0,
    iss_retido: false,
  })

  const { toast } = useToast()

  useEffect(() => {
    if (open) {
      fetchClientes()
      if (dadosOrigem) {
        preencherDadosOrigem()
      }
    }
  }, [open, dadosOrigem])

  const preencherDadosOrigem = () => {
    if (!dadosOrigem) return
    setForm((prev) => ({
      ...prev,
      origem: dadosOrigem.origem || "avulsa",
      origem_id: dadosOrigem.origem_id || null,
      origem_numero: dadosOrigem.origem_numero || "",
      cliente_id: dadosOrigem.cliente_id || null,
      tomador_tipo: dadosOrigem.cliente_cnpj ? "PJ" : "PF",
      tomador_cpf_cnpj: dadosOrigem.cliente_cnpj || dadosOrigem.cliente_cpf || "",
      tomador_razao_social: dadosOrigem.cliente_nome || "",
      tomador_email: dadosOrigem.cliente_email || "",
      tomador_telefone: dadosOrigem.cliente_telefone || "",
      tomador_endereco: dadosOrigem.cliente_endereco || "",
      tomador_bairro: dadosOrigem.cliente_bairro || "",
      tomador_cidade: dadosOrigem.cliente_cidade || "",
      tomador_uf: dadosOrigem.cliente_uf || "",
      tomador_cep: dadosOrigem.cliente_cep || "",
      descricao_servico: dadosOrigem.descricao || "",
      valor_servicos: dadosOrigem.valor || 0,
    }))
  }

  const fetchClientes = async () => {
    try {
      const response = await fetch("/api/clientes")
      const result = await response.json()
      if (result.success) {
        setClientes(result.data || [])
      }
    } catch (error) {
      console.error("Erro ao buscar clientes:", error)
    }
  }

  const selecionarCliente = (clienteId: string) => {
    const cliente = clientes.find((c) => String(c.id) === clienteId)
    if (cliente) {
      setClienteSelecionado(cliente)
      setForm((prev) => ({
        ...prev,
        cliente_id: cliente.id,
        tomador_tipo: cliente.cnpj ? "PJ" : "PF",
        tomador_cpf_cnpj: cliente.cnpj || cliente.cpf || "",
        tomador_razao_social: cliente.nome || "",
        tomador_email: cliente.email || "",
        tomador_telefone: cliente.telefone || "",
        tomador_endereco: cliente.endereco || "",
        tomador_bairro: cliente.bairro || "",
        tomador_cidade: cliente.cidade || "",
        tomador_uf: cliente.estado || "",
        tomador_cep: cliente.cep || "",
      }))
    }
  }

  const [submitError, setSubmitError] = useState<string | null>(null)

  const handleEmitir = async () => {
    setSubmitError(null)

    // Validacoes
    if (!form.tomador_cpf_cnpj) {
      const msg = "Informe o CPF/CNPJ do tomador"
      setSubmitError(msg)
      toast({ title: "Campo obrigatorio", description: msg, variant: "destructive" })
      return
    }
    if (!form.tomador_razao_social) {
      const msg = "Informe a razao social/nome do tomador"
      setSubmitError(msg)
      toast({ title: "Campo obrigatorio", description: msg, variant: "destructive" })
      return
    }
    if (!form.valor_servicos || form.valor_servicos <= 0) {
      const msg = "Informe o valor dos servicos"
      setSubmitError(msg)
      toast({ title: "Campo obrigatorio", description: msg, variant: "destructive" })
      return
    }
    if (!form.descricao_servico) {
      const msg = "Informe a descricao do servico"
      setSubmitError(msg)
      toast({ title: "Campo obrigatorio", description: msg, variant: "destructive" })
      return
    }

    setLoading(true)
    console.log("[v0] Emitindo NFS-e, dados:", {
      origem: form.origem,
      tomador: form.tomador_razao_social,
      valor: form.valor_servicos,
    })

    try {
      const response = await fetch("/api/nfse/emitir", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })

      console.log("[v0] Response status:", response.status)
      const result = await response.json()
      console.log("[v0] Response body:", result)

      if (result.success) {
        toast({
          title: "NFS-e Emitida!",
          description: result.message,
        })
        onOpenChange(false)
        onSuccess?.()
      } else {
        const msg = result.message || "Erro desconhecido ao emitir NFS-e"
        setSubmitError(msg)
        toast({
          title: "Erro na emissao",
          description: msg,
          variant: "destructive",
        })
      }
    } catch (error: any) {
      console.error("[v0] Erro fetch emitir:", error)
      const msg = "Erro de conexao ao emitir NFS-e: " + (error?.message || "Tente novamente.")
      setSubmitError(msg)
      toast({ title: "Erro de conexao", description: msg, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const updateForm = (field: string, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const clientesFiltrados = clientes.filter(
    (c) =>
      c.nome?.toLowerCase().includes(searchCliente.toLowerCase()) ||
      c.cnpj?.includes(searchCliente) ||
      c.cpf?.includes(searchCliente),
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[1650px] w-[95vw] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-emerald-600" />
            Emitir NFS-e
          </DialogTitle>
          <DialogDescription>
            {form.origem !== "avulsa" ? (
              <span>
                Emissao a partir de{" "}
                <Badge variant="outline" className="ml-1">
                  {form.origem === "orcamento" && "Orcamento"}
                  {form.origem === "ordem_servico" && "Ordem de Servico"}
                  {form.origem === "boleto" && "Boleto"}
                  {form.origem_numero && ` #${form.origem_numero}`}
                </Badge>
              </span>
            ) : (
              "Emissao avulsa de Nota Fiscal de Servico"
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Tomador (Cliente) */}
          <div>
            <h3 className="font-semibold text-gray-800 flex items-center gap-2 mb-3">
              <User className="h-4 w-4 text-blue-600" />
              Tomador do Servico
            </h3>

            {/* Seleção de cliente existente */}
            <div className="space-y-3">
              <div className="space-y-2">
                <Label>Selecionar Cliente Existente</Label>
                <Input
                  placeholder="Buscar cliente por nome ou CNPJ/CPF..."
                  value={searchCliente}
                  onChange={(e) => setSearchCliente(e.target.value)}
                />
                {searchCliente && clientesFiltrados.length > 0 && (
                  <div className="max-h-40 overflow-y-auto border rounded-md">
                    {clientesFiltrados.slice(0, 10).map((cliente) => (
                      <button
                        key={cliente.id}
                        className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm border-b last:border-b-0"
                        onClick={() => {
                          selecionarCliente(String(cliente.id))
                          setSearchCliente("")
                        }}
                      >
                        <span className="font-medium">{cliente.nome}</span>
                        {cliente.cnpj && (
                          <span className="text-gray-500 ml-2">CNPJ: {cliente.cnpj}</span>
                        )}
                        {cliente.cpf && (
                          <span className="text-gray-500 ml-2">CPF: {cliente.cpf}</span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select
                    value={form.tomador_tipo}
                    onValueChange={(v) => updateForm("tomador_tipo", v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PJ">Pessoa Juridica (CNPJ)</SelectItem>
                      <SelectItem value="PF">Pessoa Fisica (CPF)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{form.tomador_tipo === "PJ" ? "CNPJ" : "CPF"} *</Label>
                  <Input
                    value={form.tomador_cpf_cnpj}
                    onChange={(e) => updateForm("tomador_cpf_cnpj", e.target.value)}
                    placeholder={form.tomador_tipo === "PJ" ? "00.000.000/0000-00" : "000.000.000-00"}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Razao Social / Nome *</Label>
                  <Input
                    value={form.tomador_razao_social}
                    onChange={(e) => updateForm("tomador_razao_social", e.target.value)}
                    placeholder="Nome do tomador"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    value={form.tomador_email}
                    onChange={(e) => updateForm("tomador_email", e.target.value)}
                    placeholder="email@exemplo.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-2 md:col-span-2">
                  <Label>Endereco</Label>
                  <Input
                    value={form.tomador_endereco}
                    onChange={(e) => updateForm("tomador_endereco", e.target.value)}
                    placeholder="Logradouro"
                  />
                </div>
                <div className="space-y-2">
                  <Label>CEP</Label>
                  <Input
                    value={form.tomador_cep}
                    onChange={(e) => updateForm("tomador_cep", e.target.value)}
                    placeholder="00000-000"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="space-y-2">
                  <Label>Bairro</Label>
                  <Input
                    value={form.tomador_bairro}
                    onChange={(e) => updateForm("tomador_bairro", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Cidade</Label>
                  <Input
                    value={form.tomador_cidade}
                    onChange={(e) => updateForm("tomador_cidade", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>UF</Label>
                  <Input
                    value={form.tomador_uf}
                    onChange={(e) => updateForm("tomador_uf", e.target.value)}
                    maxLength={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Inscr. Municipal</Label>
                  <Input
                    value={form.tomador_inscricao_municipal}
                    onChange={(e) => updateForm("tomador_inscricao_municipal", e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Serviço */}
          <div>
            <h3 className="font-semibold text-gray-800 flex items-center gap-2 mb-3">
              <FileText className="h-4 w-4 text-emerald-600" />
              Dados do Servico
            </h3>

            <div className="space-y-3">
              <div className="space-y-2">
                <Label>Descricao do Servico *</Label>
                <Textarea
                  value={form.descricao_servico}
                  onChange={(e) => updateForm("descricao_servico", e.target.value)}
                  placeholder="Descricao detalhada do servico prestado"
                  rows={4}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Valores */}
          <div>
            <h3 className="font-semibold text-gray-800 flex items-center gap-2 mb-3">
              <DollarSign className="h-4 w-4 text-amber-600" />
              Valores
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label>Valor dos Servicos (R$) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.valor_servicos}
                  onChange={(e) => updateForm("valor_servicos", Number(e.target.value))}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label>Valor Deducoes (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.valor_deducoes}
                  onChange={(e) => updateForm("valor_deducoes", Number(e.target.value))}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label>ISS Retido pelo Tomador</Label>
                <div className="flex items-center gap-3 pt-2">
                  <Switch
                    checked={form.iss_retido}
                    onCheckedChange={(checked) => updateForm("iss_retido", checked)}
                  />
                  <span className="text-sm text-gray-600">
                    {form.iss_retido ? "Sim" : "Nao"}
                  </span>
                </div>
              </div>
            </div>

            {form.valor_servicos > 0 && (
              <div className="mt-3 p-3 bg-emerald-50 rounded-lg">
                <p className="text-sm font-medium text-emerald-800">
                  Valor Total da Nota: {formatCurrency(form.valor_servicos)}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Erro visivel */}
        {submitError && (
          <div className="p-3 bg-red-50 border border-red-300 rounded-lg flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-medium text-red-800 text-sm">Erro na emissao</p>
              <p className="text-xs text-red-600 mt-1">{submitError}</p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-red-500 hover:text-red-700"
              onClick={() => setSubmitError(null)}
            >
              Fechar
            </Button>
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button
            onClick={handleEmitir}
            disabled={loading}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Emitindo...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Emitir NFS-e
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
