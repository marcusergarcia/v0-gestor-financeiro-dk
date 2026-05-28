"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { RichTextEditor } from "@/components/rich-text-editor"
import { ClienteCombobox } from "@/components/cliente-combobox"
import { ArrowLeft, Save, Eye } from "lucide-react"
import Link from "next/link"

interface Cliente {
  id: number
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

interface Documento {
  id: number
  titulo: string
  conteudo: string
  cliente_id: number
  cliente_nome: string
  tipo_documento: string
  status: string
  versao: number
  tags: string
  observacoes: string
}

export default function EditarDocumentoPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [documento, setDocumento] = useState<Documento | null>(null)
  const [cliente, setCliente] = useState<Cliente | null>(null)

  const [formData, setFormData] = useState({
    titulo: "",
    conteudo: "",
    tipo_documento: "documento",
    status: "rascunho",
    tags: "",
    observacoes: "",
  })

  useEffect(() => {
    if (params.id) {
      fetchDocumento()
    }
  }, [params.id])

  const fetchDocumento = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/documentos/${params.id}`)
      const data = await response.json()

      if (data.success) {
        const doc = data.data
        setDocumento(doc)
        setFormData({
          titulo: doc.titulo,
          conteudo: doc.conteudo,
          tipo_documento: doc.tipo_documento,
          status: doc.status,
          tags: doc.tags || "",
          observacoes: doc.observacoes || "",
        })

        // Se há cliente associado, buscar dados completos
        if (doc.cliente_id) {
          fetchCliente(doc.cliente_id)
        }
      } else {
        toast({
          title: "Erro",
          description: "Documento não encontrado",
          variant: "destructive",
        })
        router.push("/documentos")
      }
    } catch (error) {
      console.error("Erro ao buscar documento:", error)
      toast({
        title: "Erro",
        description: "Erro ao carregar documento",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchCliente = async (clienteId: number) => {
    try {
      const response = await fetch(`/api/clientes/${clienteId}`)
      const data = await response.json()
      if (data.success) {
        setCliente(data.data)
      }
    } catch (error) {
      console.error("Erro ao buscar cliente:", error)
    }
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

    try {
      setSaving(true)

      const response = await fetch(`/api/documentos/${params.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          cliente_id: cliente?.id || null,
          versao: documento?.versao || 1,
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Sucesso",
          description: "Documento atualizado com sucesso",
        })
        router.push(`/documentos/${params.id}`)
      } else {
        toast({
          title: "Erro",
          description: data.message || "Erro ao atualizar documento",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Erro ao atualizar documento:", error)
      toast({
        title: "Erro",
        description: "Erro ao atualizar documento",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="h-9 w-20 bg-gray-200 animate-pulse rounded" />
          <div>
            <div className="h-8 w-48 bg-gray-200 animate-pulse rounded mb-2" />
            <div className="h-4 w-64 bg-gray-200 animate-pulse rounded" />
          </div>
        </div>
        <div className="h-96 bg-gray-200 animate-pulse rounded" />
      </div>
    )
  }

  if (!documento) {
    return (
      <div className="text-center py-12">
        <h3 className="mt-2 text-sm font-medium text-gray-900">Documento não encontrado</h3>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/documentos/${params.id}`}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Editar Documento</h1>
            <p className="text-muted-foreground">
              Versão {documento.versao} - {documento.titulo}
            </p>
          </div>
        </div>

        <Link href={`/documentos/${params.id}`}>
          <Button variant="outline">
            <Eye className="mr-2 h-4 w-4" />
            Visualizar
          </Button>
        </Link>
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
                  height="500px"
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
                  <div>
                    <Label>Selecionar Cliente</Label>
                    <ClienteCombobox value={cliente} onValueChange={setCliente} placeholder="Buscar cliente..." />
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
              <Button type="submit" disabled={saving} className="flex-1">
                <Save className="mr-2 h-4 w-4" />
                {saving ? "Salvando..." : "Salvar Alterações"}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
