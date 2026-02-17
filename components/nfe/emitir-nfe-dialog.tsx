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
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Loader2, Send, AlertCircle, User, Package, DollarSign, Trash2, Search, Plus, Check, ChevronsUpDown } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { formatCurrency, cn } from "@/lib/utils"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface ItemNFe {
  produto_id?: number
  codigo_produto: string
  descricao: string
  ncm: string
  unidade: string
  quantidade: number
  valor_unitario: number
  valor_total: number
}

interface EmitirNfeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
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
    cliente_numero?: string
    cliente_complemento?: string
    cliente_bairro?: string
    cliente_cidade?: string
    cliente_uf?: string
    cliente_cep?: string
    cliente_codigo_municipio?: string
    itens?: ItemNFe[]
    valor_material?: number
  }
}

export function EmitirNfeDialog({ open, onOpenChange, onSuccess, dadosOrigem }: EmitirNfeDialogProps) {
  const [loading, setLoading] = useState(false)
  const [clientes, setClientes] = useState<any[]>([])
  const [searchCliente, setSearchCliente] = useState("")
  const [submitError, setSubmitError] = useState<string | null>(null)

  const [form, setForm] = useState({
    origem: dadosOrigem?.origem || "avulsa",
    origem_id: dadosOrigem?.origem_id || null,
    origem_numero: dadosOrigem?.origem_numero || "",
    cliente_id: dadosOrigem?.cliente_id || null,
    dest_tipo: "PJ" as "PF" | "PJ",
    dest_cpf_cnpj: "",
    dest_razao_social: "",
    dest_email: "",
    dest_telefone: "",
    dest_inscricao_estadual: "",
    dest_ind_ie_dest: 9,
    dest_endereco: "",
    dest_numero: "",
    dest_complemento: "",
    dest_bairro: "",
    dest_cidade: "",
    dest_uf: "",
    dest_cep: "",
    dest_codigo_municipio: "3550308",
    info_complementar: "",
    natureza_operacao: "Venda",
    // Novos campos obrigatorios para NF-e
    tipo_nota: 1 as number, // 0 = Entrada, 1 = Saida (padrao)
    natureza_tipo: "Venda" as string, // Venda, Remessa, Transferencia, Devolucao
    origem_produto: "estoque" as string, // estoque, producao, terceiros
    consumidor_final: 1 as number, // 0 = Nao, 1 = Sim (padrao)
    meio_pagamento: "15" as string, // 15 = Boleto, 01 = Dinheiro, 03 = Cartao Credito, etc.
    tipo_venda: 1 as number, // 1 = Presencial, 2 = Internet, 9 = Outros
  })

  const [itens, setItens] = useState<ItemNFe[]>(dadosOrigem?.itens || [])

  // Produto search state
  const [produtos, setProdutos] = useState<any[]>([])
  const [produtoSearchOpen, setProdutoSearchOpen] = useState(false)
  const [produtoSearchValue, setProdutoSearchValue] = useState("")
  const [loadingProdutos, setLoadingProdutos] = useState(false)

  const { toast } = useToast()

  const fetchProdutos = async () => {
    try {
      setLoadingProdutos(true)
      const response = await fetch("/api/produtos?limit=1000")
      const result = await response.json()
      if (result.success) {
        setProdutos(result.data || [])
      }
    } catch (error) {
      console.error("Erro ao carregar produtos:", error)
    } finally {
      setLoadingProdutos(false)
    }
  }

  useEffect(() => {
    if (open) {
      fetchClientes()
      fetchProdutos()
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
      dest_tipo: dadosOrigem.cliente_cnpj ? "PJ" : "PF",
      dest_cpf_cnpj: dadosOrigem.cliente_cnpj || dadosOrigem.cliente_cpf || "",
      dest_razao_social: dadosOrigem.cliente_nome || "",
      dest_email: dadosOrigem.cliente_email || "",
      dest_telefone: dadosOrigem.cliente_telefone || "",
      dest_endereco: dadosOrigem.cliente_endereco || "",
      dest_numero: dadosOrigem.cliente_numero || "",
      dest_complemento: dadosOrigem.cliente_complemento || "",
      dest_bairro: dadosOrigem.cliente_bairro || "",
      dest_cidade: dadosOrigem.cliente_cidade || "",
      dest_uf: dadosOrigem.cliente_uf || "",
      dest_cep: dadosOrigem.cliente_cep || "",
      dest_codigo_municipio: dadosOrigem.cliente_codigo_municipio || "3550308",
    }))
    if (dadosOrigem.itens && dadosOrigem.itens.length > 0) {
      setItens(dadosOrigem.itens)
    }
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
      setForm((prev) => ({
        ...prev,
        cliente_id: cliente.id,
        dest_tipo: cliente.cnpj ? "PJ" : "PF",
        dest_cpf_cnpj: cliente.cnpj || cliente.cpf || "",
        dest_razao_social: cliente.nome || "",
        dest_email: cliente.email || "",
        dest_telefone: cliente.telefone || "",
        dest_endereco: cliente.endereco || "",
        dest_numero: cliente.numero || "",
        dest_complemento: cliente.complemento || "",
        dest_bairro: cliente.bairro || "",
        dest_cidade: cliente.cidade || "",
        dest_uf: cliente.estado || "",
        dest_cep: cliente.cep || "",
        dest_codigo_municipio: cliente.codigo_municipio || prev.dest_codigo_municipio,
        // IE do destinatario: preencher se o cliente tiver
        dest_inscricao_estadual: cliente.inscricao_estadual || "",
        dest_ind_ie_dest: cliente.inscricao_estadual ? 1 : 9,
      }))
    }
  }

  const adicionarProduto = (produto: any) => {
    // Validar se o produto possui NCM
    const ncmLimpo = (produto.ncm || "").replace(/\D/g, "")
    if (!ncmLimpo || ncmLimpo === "00000000" || ncmLimpo.length < 2) {
      toast({
        title: "Produto sem NCM",
        description: `O produto "${produto.descricao || produto.codigo}" nao possui NCM cadastrado. Atualize o cadastro do produto antes de emitir a NF-e.`,
        variant: "destructive",
      })
      setProdutoSearchOpen(false)
      setProdutoSearchValue("")
      return
    }
    const valorUnit = Number(produto.valor_unitario) || 0
    setItens((prev) => [...prev, {
      produto_id: Number(produto.id),
      codigo_produto: produto.codigo || "",
      descricao: produto.descricao || "",
      ncm: ncmLimpo.padStart(8, "0"),
      unidade: produto.unidade || "UN",
      quantidade: 1,
      valor_unitario: valorUnit,
      valor_total: valorUnit,
    }])
    setProdutoSearchOpen(false)
    setProdutoSearchValue("")
  }

  const adicionarItemManual = () => {
    setItens((prev) => [...prev, {
      codigo_produto: "",
      descricao: "",
      ncm: "",
      unidade: "UN",
      quantidade: 1,
      valor_unitario: 0,
      valor_total: 0,
    }])
  }

  const filteredProdutos = produtos.filter(
    (p) =>
      p.descricao?.toLowerCase().includes(produtoSearchValue.toLowerCase()) ||
      p.codigo?.toLowerCase().includes(produtoSearchValue.toLowerCase()),
  )

  const atualizarItem = (index: number, field: keyof ItemNFe, value: any) => {
    setItens((prev) => {
      const novosItens = [...prev]
      const item = { ...novosItens[index], [field]: value }
      if (field === "quantidade" || field === "valor_unitario") {
        item.valor_total = Number(item.quantidade) * Number(item.valor_unitario)
      }
      novosItens[index] = item
      return novosItens
    })
  }

  const removerItem = (index: number) => {
    setItens((prev) => prev.filter((_, i) => i !== index))
  }

  const valorTotalItens = itens.reduce((acc, item) => acc + (item.valor_total || 0), 0)

  const handleEmitir = async () => {
    setSubmitError(null)

    if (!form.dest_cpf_cnpj) {
      const msg = "Informe o CPF/CNPJ do destinatario"
      setSubmitError(msg)
      toast({ title: "Campo obrigatorio", description: msg, variant: "destructive" })
      return
    }
    if (!form.dest_razao_social) {
      const msg = "Informe a razao social/nome do destinatario"
      setSubmitError(msg)
      toast({ title: "Campo obrigatorio", description: msg, variant: "destructive" })
      return
    }
    // Validar IE do destinatario quando contribuinte ICMS
    if (form.dest_ind_ie_dest === 1 && !form.dest_inscricao_estadual.trim()) {
      const msg = "Inscricao Estadual do destinatario e obrigatoria quando Indicador IE = Contribuinte ICMS"
      setSubmitError(msg)
      toast({ title: "Campo obrigatorio", description: msg, variant: "destructive" })
      return
    }
    if (itens.length === 0) {
      const msg = "Adicione pelo menos um produto usando a busca na tabela"
      setSubmitError(msg)
      toast({ title: "Campo obrigatorio", description: msg, variant: "destructive" })
      return
    }
    const itensInvalidos = itens.filter((i) => !i.descricao || i.valor_total <= 0)
    if (itensInvalidos.length > 0) {
      const msg = "Todos os itens devem ter descricao e valor maior que zero"
      setSubmitError(msg)
      toast({ title: "Item invalido", description: msg, variant: "destructive" })
      return
    }
    // Validar NCM de todos os itens
    const itensSemNcm = itens.filter((i) => {
      const ncm = (i.ncm || "").replace(/\D/g, "")
      return !ncm || ncm === "00000000" || ncm.length < 2
    })
    if (itensSemNcm.length > 0) {
      const nomes = itensSemNcm.map((i) => i.descricao || i.codigo_produto).join(", ")
      const msg = `Os seguintes itens nao possuem NCM valido: ${nomes}. Atualize o cadastro dos produtos.`
      setSubmitError(msg)
      toast({ title: "Produto sem NCM", description: msg, variant: "destructive" })
      return
    }

    setLoading(true)

    try {
      const response = await fetch("/api/nfe/emitir", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          itens: itens.map((item) => ({
            produto_id: item.produto_id || null,
            codigo_produto: item.codigo_produto,
            descricao: item.descricao,
            ncm: (item.ncm || "").replace(/\D/g, "").padStart(8, "0"),
            unidade: item.unidade || "UN",
            quantidade: item.quantidade,
            valor_unitario: item.valor_unitario,
            valor_total: item.valor_total,
          })),
        }),
      })

      const result = await response.json()

      if (result.success) {
        toast({ title: "NF-e Emitida!", description: result.message })
        onOpenChange(false)
        onSuccess?.()
      } else {
        const msg = result.message || "Erro desconhecido ao emitir NF-e"
        setSubmitError(msg)
        toast({ title: "Erro na emissao", description: msg, variant: "destructive" })
      }
    } catch (error: any) {
      const msg = "Erro de conexao ao emitir NF-e: " + (error?.message || "Tente novamente.")
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
      <DialogContent className="max-w-6xl w-[85vw] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-blue-600" />
            Emitir NF-e Material (SEFAZ)
          </DialogTitle>
          <DialogDescription>
            {form.origem !== "avulsa" ? (
              <span>
                {"Emissao a partir de "}
                <Badge variant="outline" className="ml-1">
                  {form.origem === "orcamento" && "Orcamento"}
                  {form.origem_numero && ` #${form.origem_numero}`}
                </Badge>
              </span>
            ) : (
              "Emissao de Nota Fiscal Eletronica de Material/Produto (SEFAZ - Modelo 55)"
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Dados da Nota */}
          <div className="p-4 bg-muted/30 rounded-lg space-y-3">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="font-medium text-foreground whitespace-nowrap">{"Emissao de nota fiscal de"}</span>
              <Select
                value={String(form.tipo_nota)}
                onValueChange={(v) => updateForm("tipo_nota", Number(v))}
              >
                <SelectTrigger className="w-[120px] h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Saida</SelectItem>
                  <SelectItem value="0">Entrada</SelectItem>
                </SelectContent>
              </Select>
              <span className="font-medium text-foreground whitespace-nowrap">para</span>
              <Select
                value={form.dest_tipo}
                onValueChange={(v) => updateForm("dest_tipo", v)}
              >
                <SelectTrigger className="w-[170px] h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PJ">Pessoa Juridica</SelectItem>
                  <SelectItem value="PF">Pessoa Fisica</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="font-medium text-foreground whitespace-nowrap">{"com natureza da operacao de"}</span>
              <Select
                value={form.natureza_tipo}
                onValueChange={(v) => {
                  updateForm("natureza_tipo", v)
                  updateForm("natureza_operacao", v)
                }}
              >
                <SelectTrigger className="w-[160px] h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Venda">Venda</SelectItem>
                  <SelectItem value="Remessa">Remessa</SelectItem>
                  <SelectItem value="Transferencia">Transferencia</SelectItem>
                  <SelectItem value="Devolucao">Devolucao</SelectItem>
                </SelectContent>
              </Select>
              <span className="font-medium text-foreground whitespace-nowrap">{"de produtos do"}</span>
              <Select
                value={form.origem_produto}
                onValueChange={(v) => updateForm("origem_produto", v)}
              >
                <SelectTrigger className="w-[150px] h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="estoque">Estoque</SelectItem>
                  <SelectItem value="producao">Producao</SelectItem>
                  <SelectItem value="terceiros">Terceiros</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="font-medium text-foreground whitespace-nowrap">{"e meu cliente"}</span>
              <Select
                value={String(form.dest_ind_ie_dest)}
                onValueChange={(v) => updateForm("dest_ind_ie_dest", Number(v))}
              >
                <SelectTrigger className="w-[200px] h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Contribuinte ICMS</SelectItem>
                  <SelectItem value="2">Contribuinte Isento</SelectItem>
                  <SelectItem value="9">Nao Contribuinte</SelectItem>
                </SelectContent>
              </Select>
              <span className="font-medium text-foreground whitespace-nowrap">de ICMS.</span>
            </div>

            <Separator />

            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="font-medium text-foreground whitespace-nowrap">{"Esta e uma venda para consumidor final?"}</span>
              <Select
                value={String(form.consumidor_final)}
                onValueChange={(v) => updateForm("consumidor_final", Number(v))}
              >
                <SelectTrigger className="w-[100px] h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Sim</SelectItem>
                  <SelectItem value="0">Nao</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="font-medium text-foreground whitespace-nowrap">Meio de pagamento</span>
              <Select
                value={form.meio_pagamento}
                onValueChange={(v) => updateForm("meio_pagamento", v)}
              >
                <SelectTrigger className="w-[200px] h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">Boleto bancario</SelectItem>
                  <SelectItem value="01">Dinheiro</SelectItem>
                  <SelectItem value="02">Cheque</SelectItem>
                  <SelectItem value="03">Cartao de Credito</SelectItem>
                  <SelectItem value="04">Cartao de Debito</SelectItem>
                  <SelectItem value="05">Credito Loja</SelectItem>
                  <SelectItem value="10">Vale Alimentacao</SelectItem>
                  <SelectItem value="11">Vale Refeicao</SelectItem>
                  <SelectItem value="12">Vale Presente</SelectItem>
                  <SelectItem value="13">Vale Combustivel</SelectItem>
                  <SelectItem value="14">Duplicata Mercantil</SelectItem>
                  <SelectItem value="16">Deposito Bancario</SelectItem>
                  <SelectItem value="17">PIX</SelectItem>
                  <SelectItem value="18">Transferencia bancaria</SelectItem>
                  <SelectItem value="99">Outros</SelectItem>
                  <SelectItem value="90">Sem pagamento</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="font-medium text-foreground whitespace-nowrap">Tipo de venda</span>
              <Select
                value={String(form.tipo_venda)}
                onValueChange={(v) => updateForm("tipo_venda", Number(v))}
              >
                <SelectTrigger className="w-[160px] h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Presencial</SelectItem>
                  <SelectItem value="2">Internet</SelectItem>
                  <SelectItem value="3">Telemarketing</SelectItem>
                  <SelectItem value="4">Delivery</SelectItem>
                  <SelectItem value="9">Outros</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          {/* Destinatario */}
          <div>
            <h3 className="font-semibold text-foreground flex items-center gap-2 mb-3">
              <User className="h-4 w-4 text-blue-600" />
              Destinatario
            </h3>

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
                        className="w-full text-left px-3 py-2 hover:bg-accent text-sm border-b last:border-b-0"
                        onClick={() => {
                          selecionarCliente(String(cliente.id))
                          setSearchCliente("")
                        }}
                      >
                        <span className="font-medium">{cliente.nome}</span>
                        {cliente.cnpj && (
                          <span className="text-muted-foreground ml-2">CNPJ: {cliente.cnpj}</span>
                        )}
                        {cliente.cpf && (
                          <span className="text-muted-foreground ml-2">CPF: {cliente.cpf}</span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <Separator />

              <div className="grid grid-cols-4 gap-3">
                <div className="space-y-2">
                  <Label>{form.dest_tipo === "PJ" ? "CNPJ" : "CPF"} *</Label>
                  <Input
                    value={form.dest_cpf_cnpj}
                    onChange={(e) => updateForm("dest_cpf_cnpj", e.target.value)}
                    placeholder={form.dest_tipo === "PJ" ? "00.000.000/0000-00" : "000.000.000-00"}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Razao Social / Nome *</Label>
                  <Input
                    value={form.dest_razao_social}
                    onChange={(e) => updateForm("dest_razao_social", e.target.value)}
                    placeholder="Nome do destinatario"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    value={form.dest_email}
                    onChange={(e) => updateForm("dest_email", e.target.value)}
                    placeholder="email@exemplo.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-6 gap-3">
                <div className="space-y-2 col-span-2">
                  <Label>Endereco</Label>
                  <Input
                    value={form.dest_endereco}
                    onChange={(e) => updateForm("dest_endereco", e.target.value)}
                    placeholder="Logradouro"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Numero</Label>
                  <Input
                    value={form.dest_numero}
                    onChange={(e) => updateForm("dest_numero", e.target.value)}
                    placeholder="S/N"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Bairro</Label>
                  <Input
                    value={form.dest_bairro}
                    onChange={(e) => updateForm("dest_bairro", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Cidade</Label>
                  <Input
                    value={form.dest_cidade}
                    onChange={(e) => updateForm("dest_cidade", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>UF</Label>
                  <Input
                    value={form.dest_uf}
                    onChange={(e) => updateForm("dest_uf", e.target.value)}
                    maxLength={2}
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-3">
                <div className="space-y-2">
                  <Label>CEP</Label>
                  <Input
                    value={form.dest_cep}
                    onChange={(e) => updateForm("dest_cep", e.target.value)}
                    placeholder="00000-000"
                  />
                </div>
                {form.dest_ind_ie_dest === 1 && (
                  <div className="space-y-2">
                    <Label>Inscricao Estadual</Label>
                    <Input
                      value={form.dest_inscricao_estadual}
                      onChange={(e) => updateForm("dest_inscricao_estadual", e.target.value)}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Itens / Produtos */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <Package className="h-4 w-4 text-blue-600" />
                Produtos / Itens ({itens.length})
              </h3>
            </div>

            <div className="border rounded-md overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[60px]">#</TableHead>
                    <TableHead className="w-[100px]">Codigo</TableHead>
                    <TableHead>Descricao</TableHead>
                    <TableHead className="w-[100px]">NCM</TableHead>
                    <TableHead className="w-[60px]">Unid.</TableHead>
                    <TableHead className="w-[70px]">Qtd.</TableHead>
                    <TableHead className="w-[110px]">Vl. Unit.</TableHead>
                    <TableHead className="w-[110px]">Vl. Total</TableHead>
                    <TableHead className="w-[40px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {itens.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="text-muted-foreground">{index + 1}</TableCell>
                      <TableCell>
                        <Input
                          value={item.codigo_produto}
                          onChange={(e) => atualizarItem(index, "codigo_produto", e.target.value)}
                          className="h-8 text-xs"
                          placeholder="COD"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={item.descricao}
                          onChange={(e) => atualizarItem(index, "descricao", e.target.value)}
                          className="h-8 text-xs"
                          placeholder="Descricao do produto"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={item.ncm}
                          onChange={(e) => atualizarItem(index, "ncm", e.target.value)}
                          className="h-8 text-xs"
                          placeholder="NCM"
                          maxLength={8}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={item.unidade}
                          onChange={(e) => atualizarItem(index, "unidade", e.target.value)}
                          className="h-8 text-xs w-14"
                          placeholder="UN"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={item.quantidade}
                          onChange={(e) => atualizarItem(index, "quantidade", Number(e.target.value))}
                          className="h-8 text-xs w-16"
                          min={1}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          step="0.01"
                          value={item.valor_unitario}
                          onChange={(e) => atualizarItem(index, "valor_unitario", Number(e.target.value))}
                          className="h-8 text-xs"
                        />
                      </TableCell>
                      <TableCell className="font-medium text-xs">
                        {formatCurrency(item.valor_total)}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                          onClick={() => removerItem(index)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}

                  {/* Linha de adicionar produto */}
                  <TableRow className="bg-muted/30 hover:bg-muted/50">
                    <TableCell colSpan={9} className="p-2">
                      <div className="flex items-center gap-2">
                        <Popover open={produtoSearchOpen} onOpenChange={(o) => { setProdutoSearchOpen(o); if (o && produtos.length === 0) fetchProdutos() }}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={produtoSearchOpen}
                              className="flex-1 justify-start gap-2 h-9 bg-background text-sm font-normal text-muted-foreground hover:text-foreground"
                            >
                              <Search className="h-4 w-4 shrink-0" />
                              Buscar e adicionar produto...
                              <ChevronsUpDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[500px] p-0" align="start">
                            <Command>
                              <CommandInput
                                placeholder="Digite o nome ou codigo do produto..."
                                value={produtoSearchValue}
                                onValueChange={setProdutoSearchValue}
                                className="h-10"
                              />
                              <CommandList className="max-h-[250px]">
                                {loadingProdutos ? (
                                  <div className="flex items-center justify-center p-4 text-sm text-muted-foreground gap-2">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Carregando produtos...
                                  </div>
                                ) : (
                                  <>
                                    <CommandEmpty>Nenhum produto encontrado.</CommandEmpty>
                                    <CommandGroup heading="Produtos">
                                      {filteredProdutos.slice(0, 50).map((produto) => (
                                        <CommandItem
                                          key={produto.id}
                                          value={`${produto.codigo} ${produto.descricao}`}
                                          onSelect={() => adicionarProduto(produto)}
                                          className="flex items-center gap-3 p-2.5 cursor-pointer"
                                        >
                                          <Plus className="h-4 w-4 text-blue-600 shrink-0" />
                                          <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                              <Badge variant="outline" className="text-[10px] font-mono shrink-0">
                                                {produto.codigo}
                                              </Badge>
                                              <span className="text-sm font-medium truncate">{produto.descricao}</span>
                                            </div>
                                            <div className="text-[11px] text-muted-foreground mt-0.5">
                                              {produto.unidade} | NCM: {produto.ncm || "N/A"} | R$ {Number(produto.valor_unitario || 0).toFixed(2)}
                                            </div>
                                          </div>
                                        </CommandItem>
                                      ))}
                                    </CommandGroup>
                                  </>
                                )}
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={adicionarItemManual}
                          className="h-9 px-3 text-xs text-muted-foreground hover:text-foreground shrink-0"
                          title="Adicionar item manualmente"
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Manual
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>

            {itens.length > 0 && (
              <div className="flex justify-end mt-2">
                <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg text-right">
                  <p className="text-xs text-muted-foreground">Total dos Produtos</p>
                  <p className="text-lg font-bold text-blue-700 dark:text-blue-300">{formatCurrency(valorTotalItens)}</p>
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Informacoes Complementares */}
          <div>
            <h3 className="font-semibold text-foreground flex items-center gap-2 mb-3">
              <DollarSign className="h-4 w-4 text-amber-600" />
              Informacoes Adicionais
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Natureza da Operacao</Label>
                <Input
                  value={form.natureza_operacao}
                  onChange={(e) => updateForm("natureza_operacao", e.target.value)}
                  placeholder="Venda"
                />
              </div>
            </div>
            <div className="space-y-2 mt-3">
              <Label>Informacoes Complementares</Label>
              <Textarea
                value={form.info_complementar}
                onChange={(e) => updateForm("info_complementar", e.target.value)}
                placeholder="Informacoes adicionais que aparecerao na NF-e (ex: referencia do orcamento, condicoes, etc.)"
                rows={2}
              />
            </div>
          </div>
        </div>

        {/* Erro */}
        {submitError && (
          <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-medium text-destructive text-sm">Erro na emissao</p>
              <p className="text-xs text-destructive/80 mt-1">{submitError}</p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-destructive hover:text-destructive"
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
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Enviando para SEFAZ...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Emitir NF-e Material
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
