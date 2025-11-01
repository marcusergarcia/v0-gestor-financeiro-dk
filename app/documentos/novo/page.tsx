"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { RichTextEditor } from "@/components/rich-text-editor"
import { ClienteCombobox } from "@/components/cliente-combobox"
import { ClienteFormDialog } from "@/components/cliente-form-dialog"
import { ArrowLeft, Save, RefreshCw, Plus } from "lucide-react"
import Link from "next/link"

interface Cliente {
  id: string
  nome: string
  codigo?: string
  cnpj?: string
  cpf?: string
  endereco?: string
  cep?: string
  email?: string
  distancia_km?: number
  tem_contrato?: boolean
  status?: string
}

export default function NovoDocumentoPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [loadingCodigo, setLoadingCodigo] = useState(false)
  const [cliente, setCliente] = useState<Cliente | null>(null)
  const [showNovoClienteDialog, setShowNovoClienteDialog] = useState(false)
  const [refreshClientes, setRefreshClientes] = useState(0)

  const [formData, setFormData] = useState({
    codigo: "",
    titulo: "",
    conteudo: "",
    tipo_documento: "documento",
    status: "rascunho",
    tags: "",
    observacoes: "",
  })

  // Gerar código automaticamente ao carregar a página
  useEffect(() => {
    gerarProximoCodigo()
  }, [])

  const gerarProximoCodigo = async () => {
    try {
      setLoadingCodigo(true)
      const response = await fetch("/api/documentos/proximo-codigo")
      const data = await response.json()

      if (data.success && data.codigo) {
        setFormData((prev) => ({
          ...prev,
          codigo: data.codigo,
        }))
      } else {
        toast({
          title: "Aviso",
          description: "Não foi possível gerar código automático",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Erro ao gerar código:", error)
      toast({
        title: "Aviso",
        description: "Erro ao gerar código automático",
        variant: "destructive",
      })
    } finally {
      setLoadingCodigo(false)
    }
  }

  const handleNovoClienteSuccess = async (novoCliente: any) => {
    // Selecionar automaticamente o novo cliente
    setCliente({
      id: novoCliente.id.toString(),
      nome: novoCliente.nome,
      codigo: novoCliente.codigo,
      cnpj: novoCliente.cnpj,
      cpf: novoCliente.cpf,
      endereco: novoCliente.endereco,
      cep: novoCliente.cep,
      email: novoCliente.email,
      distancia_km: novoCliente.distancia_km,
      tem_contrato: novoCliente.tem_contrato,
      status: novoCliente.status,
    })

    // Atualizar a lista de clientes
    setRefreshClientes((prev) => prev + 1)

    toast({
      title: "Sucesso",
      description: "Cliente cadastrado e selecionado automaticamente",
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.titulo.trim()) {
      toast({
        title: "Erro",
        description: "O título é obrigatório",
        variant: "destructive",
      })
      return
    }

    if (!formData.codigo.trim()) {
      toast({
        title: "Erro",
        description: "O código é obrigatório",
        variant: "destructive",
      })
      return
    }

    try {
      setLoading(true)

      const response = await fetch("/api/documentos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          cliente_id: cliente?.id ? Number.parseInt(cliente.id) : null,
          created_by: "Sistema",
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Sucesso",
          description: "Documento criado com sucesso",
        })
        router.push(`/documentos/${data.data.id}`)
      } else {
        toast({
          title: "Erro",
          description: data.message || "Erro ao criar documento",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Erro ao criar documento:", error)
      toast({
        title: "Erro",
        description: "Erro ao criar documento",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/documentos">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Novo Documento</h1>
          <p className="text-muted-foreground">Crie um novo documento ou contrato</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Formulário Principal */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Informações Básicas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="codigo">Código do Documento</Label>
                  <div className="flex gap-2">
                    <Input
                      id="codigo"
                      value={formData.codigo}
                      onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                      placeholder="Código será gerado automaticamente"
                      required
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={gerarProximoCodigo}
                      disabled={loadingCodigo}
                    >
                      {loadingCodigo ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Formato: AAAAMMDDNNN (Ano+Mês+Dia+Sequencial)</p>
                </div>

                <div>
                  <Label htmlFor="titulo">Título *</Label>
                  <Input
                    id="titulo"
                    value={formData.titulo}
                    onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                    placeholder="Digite o título do documento"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="tipo_documento">Tipo de Documento</Label>
                    <Select
                      value={formData.tipo_documento}
                      onValueChange={(value) => setFormData({ ...formData, tipo_documento: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="documento">Documento</SelectItem>
                        <SelectItem value="contrato">Contrato</SelectItem>
                        <SelectItem value="proposta">Proposta</SelectItem>
                        <SelectItem value="relatorio">Relatório</SelectItem>
                        <SelectItem value="ata">Ata</SelectItem>
                        <SelectItem value="oficio">Ofício</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => setFormData({ ...formData, status: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="rascunho">Rascunho</SelectItem>
                        <SelectItem value="finalizado">Finalizado</SelectItem>
                        <SelectItem value="assinado">Assinado</SelectItem>
                        <SelectItem value="arquivado">Arquivado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="tags">Tags</Label>
                  <Input
                    id="tags"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    placeholder="Separe as tags por vírgula"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Editor de Conteúdo */}
            <Card>
              <CardHeader>
                <CardTitle>Conteúdo do Documento</CardTitle>
              </CardHeader>
              <CardContent>
                <RichTextEditor
                  value={formData.conteudo}
                  onChange={(value) => setFormData({ ...formData, conteudo: value })}
                  placeholder="Digite o conteúdo do documento aqui..."
                />
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Cliente</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <Label>Selecionar Cliente</Label>
                      <ClienteCombobox
                        value={cliente}
                        onValueChange={setCliente}
                        placeholder="Buscar cliente..."
                        key={refreshClientes}
                      />
                    </div>
                    {!cliente && (
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

                  {cliente && (
                    <div className="p-3 bg-gray-50 rounded-lg space-y-2">
                      <div className="font-medium">{cliente.nome}</div>
                      {cliente.codigo && <div className="text-sm text-gray-600">Código: {cliente.codigo}</div>}
                      {cliente.cnpj && <div className="text-sm text-gray-600">CNPJ: {cliente.cnpj}</div>}
                      {cliente.cpf && <div className="text-sm text-gray-600">CPF: {cliente.cpf}</div>}
                      {cliente.endereco && <div className="text-sm text-gray-600">{cliente.endereco}</div>}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Observações</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={formData.observacoes}
                  onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                  placeholder="Observações internas sobre o documento"
                  rows={4}
                />
              </CardContent>
            </Card>

            <div className="flex gap-2">
              <Button type="submit" disabled={loading} className="flex-1">
                <Save className="mr-2 h-4 w-4" />
                {loading ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </div>
        </div>
      </form>

      {/* Dialog de Novo Cliente */}
      <ClienteFormDialog
        open={showNovoClienteDialog}
        onOpenChange={setShowNovoClienteDialog}
        onSuccess={handleNovoClienteSuccess}
      />
    </div>
  )
}
