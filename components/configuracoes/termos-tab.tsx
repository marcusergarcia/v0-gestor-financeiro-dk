"use client"

import type React from "react"
import { RichTextEditor } from "@/components/rich-text-editor"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { FileText, Edit, Trash2, Plus, Eye, Download } from "lucide-react"
import { toast } from "sonner"

interface Termo {
  id: number
  tipo: "termo_uso" | "termo_privacidade" | "contrato_conservacao" | "contrato_servico" | "orcamento"
  titulo: string
  conteudo: string
  versao: string
  ativo: boolean
  obrigatorio: boolean
  created_at: string
  updated_at: string
}

const tiposTermos: Record<string, { label: string; icon: string; color: string }> = {
  termo_uso: { label: "Termos de Uso", icon: "📋", color: "blue" },
  termo_privacidade: { label: "Política de Privacidade", icon: "🔒", color: "green" },
  contrato_conservacao: { label: "Contrato de Conservação", icon: "🔧", color: "orange" },
  contrato_servico: { label: "Contrato de Serviços", icon: "⚙️", color: "purple" },
  orcamento: { label: "Orçamento", icon: "📝", color: "blue" },
}

// Função auxiliar para obter informações do tipo
const getTipoInfo = (tipo: string) => {
  return tiposTermos[tipo] || { label: "Desconhecido", icon: "❓", color: "gray" }
}

export function TermosTab() {
  const [termos, setTermos] = useState<Termo[]>([])
  const [loading, setLoading] = useState(true)
  const [editingTermo, setEditingTermo] = useState<Termo | null>(null)
  const [viewingTermo, setViewingTermo] = useState<Termo | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  useEffect(() => {
    carregarTermos()
  }, [])

  const carregarTermos = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/configuracoes/termos")
      const data = await response.json()

      if (data.success) {
        setTermos(data.data || [])
      } else {
        toast.error("Erro ao carregar termos e contratos")
      }
    } catch (error) {
      console.error("Erro ao carregar termos:", error)
      toast.error("Erro de conexão ao carregar termos")
    } finally {
      setLoading(false)
    }
  }

  const handleSalvar = async (termo: Partial<Termo>) => {
    try {
      const url = termo.id ? `/api/configuracoes/termos/${termo.id}` : "/api/configuracoes/termos"
      const method = termo.id ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(termo),
      })

      const data = await response.json()

      if (data.success) {
        toast.success(termo.id ? "Termo atualizado com sucesso!" : "Termo criado com sucesso!")
        await carregarTermos()
        setEditingTermo(null)
        setIsDialogOpen(false)
      } else {
        toast.error(data.error || "Erro ao salvar termo")
      }
    } catch (error) {
      console.error("Erro ao salvar termo:", error)
      toast.error("Erro de conexão ao salvar termo")
    }
  }

  const handleRemover = async (id: number) => {
    try {
      const response = await fetch(`/api/configuracoes/termos/${id}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (data.success) {
        toast.success("Termo removido com sucesso!")
        await carregarTermos()
      } else {
        toast.error(data.error || "Erro ao remover termo")
      }
    } catch (error) {
      console.error("Erro ao remover termo:", error)
      toast.error("Erro de conexão ao remover termo")
    }
  }

  const handleExportar = (termo: Termo) => {
    const blob = new Blob([termo.conteudo], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${termo.titulo.replace(/[^a-zA-Z0-9]/g, "_")}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return <div className="text-center py-8">Carregando termos e contratos...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">📄 Termos e Contratos</h2>
          <p className="text-muted-foreground">Gerencie termos de uso, políticas e modelos de contratos</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingTermo(null)}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Termo/Contrato
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingTermo ? "Editar Termo/Contrato" : "Novo Termo/Contrato"}</DialogTitle>
              <DialogDescription>
                {editingTermo ? "Edite as informações do termo ou contrato" : "Crie um novo termo ou contrato"}
              </DialogDescription>
            </DialogHeader>
            <TermoForm
              termo={editingTermo}
              onSalvar={handleSalvar}
              onCancelar={() => {
                setEditingTermo(null)
                setIsDialogOpen(false)
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="todos" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="todos">Todos</TabsTrigger>
          <TabsTrigger value="termo_uso">Termos de Uso</TabsTrigger>
          <TabsTrigger value="termo_privacidade">Privacidade</TabsTrigger>
          <TabsTrigger value="contrato_conservacao">Conservação</TabsTrigger>
          <TabsTrigger value="contrato_servico">Serviços</TabsTrigger>
          <TabsTrigger value="orcamento">Orçamentos</TabsTrigger>
        </TabsList>

        <TabsContent value="todos" className="space-y-4">
          <TermosList
            termos={termos}
            onEditar={(termo) => {
              setEditingTermo(termo)
              setIsDialogOpen(true)
            }}
            onVisualizar={setViewingTermo}
            onRemover={handleRemover}
            onExportar={handleExportar}
          />
        </TabsContent>

        {Object.keys(tiposTermos).map((tipo) => (
          <TabsContent key={tipo} value={tipo} className="space-y-4">
            <TermosList
              termos={termos.filter((t) => t.tipo === tipo)}
              onEditar={(termo) => {
                setEditingTermo(termo)
                setIsDialogOpen(true)
              }}
              onVisualizar={setViewingTermo}
              onRemover={handleRemover}
              onExportar={handleExportar}
            />
          </TabsContent>
        ))}
      </Tabs>

      <Dialog open={!!viewingTermo} onOpenChange={() => setViewingTermo(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {viewingTermo && getTipoInfo(viewingTermo.tipo).icon}
              {viewingTermo?.titulo}
            </DialogTitle>
            <DialogDescription>Visualização do termo ou contrato</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Badge variant="outline">Versão {viewingTermo?.versao}</Badge>
              {viewingTermo?.obrigatorio && <Badge variant="destructive">Obrigatório</Badge>}
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <pre className="whitespace-pre-wrap text-sm">{viewingTermo?.conteudo}</pre>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => viewingTermo && handleExportar(viewingTermo)}>
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
              <Button onClick={() => setViewingTermo(null)}>Fechar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function TermosList({
  termos,
  onEditar,
  onVisualizar,
  onRemover,
  onExportar,
}: {
  termos: Termo[]
  onEditar: (termo: Termo) => void
  onVisualizar: (termo: Termo) => void
  onRemover: (id: number) => void
  onExportar: (termo: Termo) => void
}) {
  if (termos.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum termo encontrado</h3>
          <p className="text-gray-600">Crie seu primeiro termo ou contrato</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-4">
      {termos.map((termo) => {
        const tipoInfo = getTipoInfo(termo.tipo)
        return (
          <Card key={termo.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">{tipoInfo.icon}</div>
                  <div>
                    <CardTitle className="text-lg">{termo.titulo}</CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline">{tipoInfo.label}</Badge>
                      <Badge variant="outline">v{termo.versao}</Badge>
                      {termo.obrigatorio && <Badge variant="destructive">Obrigatório</Badge>}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => onVisualizar(termo)}>
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => onExportar(termo)}>
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => onEditar(termo)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 bg-transparent">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Confirmar Remoção</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tem certeza que deseja remover "{termo.titulo}"? Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => onRemover(termo.id)} className="bg-red-600 hover:bg-red-700">
                          Remover
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-2">{termo.conteudo.substring(0, 200)}...</p>
              <p className="text-xs text-muted-foreground">
                Atualizado em: {new Date(termo.updated_at).toLocaleDateString("pt-BR")}
              </p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

function TermoForm({
  termo,
  onSalvar,
  onCancelar,
}: {
  termo: Termo | null
  onSalvar: (termo: Partial<Termo>) => void
  onCancelar: () => void
}) {
  const [formData, setFormData] = useState({
    tipo: termo?.tipo || "termo_uso",
    titulo: termo?.titulo || "",
    conteudo: termo?.conteudo || "",
    versao: termo?.versao || "1.0",
    obrigatorio: termo?.obrigatorio || false,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.titulo || !formData.conteudo) {
      toast.error("Título e conteúdo são obrigatórios")
      return
    }

    onSalvar({
      ...formData,
      id: termo?.id,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="tipo">Tipo</Label>
          <select
            id="tipo"
            value={formData.tipo}
            onChange={(e) => setFormData({ ...formData, tipo: e.target.value as any })}
            className="w-full p-2 border rounded-md"
            disabled={!!termo}
          >
            {Object.entries(tiposTermos).map(([key, value]) => (
              <option key={key} value={key}>
                {value.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="versao">Versão</Label>
          <Input
            id="versao"
            value={formData.versao}
            onChange={(e) => setFormData({ ...formData, versao: e.target.value })}
            placeholder="1.0"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="titulo">Título</Label>
        <Input
          id="titulo"
          value={formData.titulo}
          onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
          placeholder="Digite o título do termo/contrato"
          required
        />
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="obrigatorio"
          checked={formData.obrigatorio}
          onCheckedChange={(checked) => setFormData({ ...formData, obrigatorio: checked })}
        />
        <Label htmlFor="obrigatorio">Obrigatório para criação de contas</Label>
      </div>

      <div>
        <Label htmlFor="conteudo">Conteúdo</Label>
        <div className="border rounded-md">
          <RichTextEditor
            value={formData.conteudo}
            onChange={(value) => setFormData({ ...formData, conteudo: value })}
            placeholder="Digite o conteúdo do termo/contrato. Use as variáveis disponíveis como [EMPRESA_NOME], [CLIENTE_NOME], etc."
          />
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Você pode usar HTML e variáveis como [EMPRESA_NOME], [CLIENTE_NOME], [ORCAMENTO_NUMERO], etc.
        </p>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancelar}>
          Cancelar
        </Button>
        <Button type="submit">{termo ? "Atualizar" : "Criar"}</Button>
      </div>
    </form>
  )
}
