"use client"

import { useState } from "react"
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
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Trash2, AlertTriangle, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Categoria {
  id: string
  codigo: string
  nome: string
  ativo: boolean
  total_produtos: number
}

interface CategoriaDeleteDialogProps {
  categoria: Categoria
  onSuccess: () => void
}

export function CategoriaDeleteDialog({ categoria, onSuccess }: CategoriaDeleteDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleDelete = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/categorias/${categoria.id}`, {
        method: "DELETE",
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Sucesso!",
          description: "Categoria excluída com sucesso!",
        })
        setOpen(false)
        onSuccess()
      } else {
        toast({
          title: "Erro",
          description: result.message || "Erro ao excluir categoria",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao excluir categoria",
        variant: "destructive",
      })
      console.error("Erro:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm" className="text-destructive hover:text-destructive bg-transparent">
          <Trash2 className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
          </div>
          <AlertDialogDescription>
            Esta ação não pode ser desfeita. A categoria será permanentemente removida do sistema.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-muted p-4 rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Código:</span>
              <span className="font-mono">{categoria.codigo}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Nome:</span>
              <span className="font-medium">{categoria.nome}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Produtos vinculados:</span>
              <Badge variant="outline">{categoria.total_produtos}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Status:</span>
              <Badge variant={categoria.ativo ? "default" : "secondary"}>{categoria.ativo ? "Ativo" : "Inativo"}</Badge>
            </div>
          </div>

          {categoria.total_produtos > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <span className="text-sm text-yellow-800 font-medium">Atenção!</span>
              </div>
              <p className="text-sm text-yellow-700 mt-1">
                Esta categoria possui {categoria.total_produtos} produto(s) vinculado(s). A exclusão não será permitida.
              </p>
            </div>
          )}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={loading || categoria.total_produtos > 0}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Excluir Categoria
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
