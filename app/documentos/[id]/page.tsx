"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, Edit, Printer, FileText, Trash2 } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { DocumentoPrint } from "@/components/documento-print"
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

interface Documento {
  id: number
  codigo: string
  titulo: string
  conteudo: string
  cliente_id: number
  cliente_nome: string
  cliente_endereco: string
  cliente_telefone: string
  cliente_email: string
  tipo_documento: string
  status: string
  versao: number
  tags: string
  created_at: string
  updated_at: string
  created_by: string
  observacoes: string
}

export default function VisualizarDocumentoPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [documento, setDocumento] = useState<Documento | null>(null)
  const [loading, setLoading] = useState(true)
  const [showPrintDialog, setShowPrintDialog] = useState(false)
  const [deleting, setDeleting] = useState(false)

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
        setDocumento(data.data)
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

  const handleDelete = async () => {
    if (!documento) return

    try {
      setDeleting(true)
      const response = await fetch(`/api/documentos/${documento.id}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Sucesso",
          description: "Documento excluído com sucesso",
        })
        router.push("/documentos")
      } else {
        toast({
          title: "Erro",
          description: data.message || "Erro ao excluir documento",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Erro ao excluir documento:", error)
      toast({
        title: "Erro",
        description: "Erro ao excluir documento",
        variant: "destructive",
      })
    } finally {
      setDeleting(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      rascunho: { label: "Rascunho", variant: "secondary" as const },
      finalizado: { label: "Finalizado", variant: "default" as const },
      assinado: { label: "Assinado", variant: "success" as const },
      arquivado: { label: "Arquivado", variant: "outline" as const },
    }

    const config = statusConfig[status as keyof typeof statusConfig] || {
      label: status,
      variant: "secondary" as const,
    }

    return <Badge variant={config.variant}>{config.label}</Badge>
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
        <FileText className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Documento não encontrado</h3>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/documentos">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{documento.titulo}</h1>
            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
              <span>Código: {documento.codigo}</span>
              <span>•</span>
              <span>Versão {documento.versao}</span>
              <span>•</span>
              <span>
                Atualizado em{" "}
                {format(new Date(documento.updated_at), "dd/MM/yyyy HH:mm", {
                  locale: ptBR,
                })}
              </span>
              {documento.created_by && (
                <>
                  <span>•</span>
                  <span>por {documento.created_by}</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setShowPrintDialog(true)}>
            <Printer className="mr-2 h-4 w-4" />
            Imprimir
          </Button>
          <Link href={`/documentos/${documento.id}/editar`}>
            <Button>
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </Button>
          </Link>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                <AlertDialogDescription>
                  Tem certeza que deseja excluir o documento "{documento.titulo}"? Esta ação não pode ser desfeita.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} disabled={deleting} className="bg-red-600 hover:bg-red-700">
                  {deleting ? "Excluindo..." : "Excluir"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Conteúdo Principal */}
        <div className="lg:col-span-3">
          <Card>
            <CardContent className="p-8">
              <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: documento.conteudo }} />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar com Informações */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm font-medium text-muted-foreground">Código</div>
                <div className="mt-1 font-mono text-sm">{documento.codigo}</div>
              </div>

              <div>
                <div className="text-sm font-medium text-muted-foreground">Status</div>
                <div className="mt-1">{getStatusBadge(documento.status)}</div>
              </div>

              <div>
                <div className="text-sm font-medium text-muted-foreground">Tipo</div>
                <div className="mt-1 capitalize">{documento.tipo_documento}</div>
              </div>

              {documento.tags && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Tags</div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {documento.tags.split(",").map((tag, index) => (
                      <Badge key={index} variant="outline">
                        {tag.trim()}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <div className="text-sm font-medium text-muted-foreground">Criado em</div>
                <div className="mt-1 text-sm">
                  {format(new Date(documento.created_at), "dd/MM/yyyy HH:mm", {
                    locale: ptBR,
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          {documento.cliente_nome && (
            <Card>
              <CardHeader>
                <CardTitle>Cliente</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="font-medium">{documento.cliente_nome}</div>
                </div>
                {documento.cliente_endereco && (
                  <div className="text-sm text-muted-foreground">{documento.cliente_endereco}</div>
                )}
                {documento.cliente_telefone && (
                  <div className="text-sm text-muted-foreground">Tel: {documento.cliente_telefone}</div>
                )}
                {documento.cliente_email && (
                  <div className="text-sm text-muted-foreground">Email: {documento.cliente_email}</div>
                )}
              </CardContent>
            </Card>
          )}

          {documento.observacoes && (
            <Card>
              <CardHeader>
                <CardTitle>Observações</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{documento.observacoes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Dialog de Impressão */}
      <DocumentoPrint documento={documento} isOpen={showPrintDialog} onClose={() => setShowPrintDialog(false)} />
    </div>
  )
}
