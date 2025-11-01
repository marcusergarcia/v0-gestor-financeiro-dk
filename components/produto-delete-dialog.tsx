"use client"

import type React from "react"

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
import { toast } from "sonner"

interface Produto {
  id: string
  codigo: string
  descricao: string
  categoria_nome?: string
  marca_nome?: string
  valor_unitario: number
  estoque: number
  ativo: boolean
}

interface ProdutoDeleteDialogProps {
  produto: Produto
  onSuccess: () => void
  trigger?: React.ReactNode
}

export function ProdutoDeleteDialog({ produto, onSuccess, trigger }: ProdutoDeleteDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/produtos/${produto.id}`, {
        method: "DELETE",
      })

      const result = await response.json()

      if (result.success) {
        toast.success("Produto excluído com sucesso!")
        setOpen(false)
        onSuccess()
      } else {
        toast.error(result.message || "Erro ao excluir produto")
      }
    } catch (error) {
      toast.error("Erro ao excluir produto")
      console.error("Erro:", error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        {trigger || (
          <Button variant="destructive" size="sm">
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
          </div>
          <AlertDialogDescription>
            Esta ação não pode ser desfeita. O produto será permanentemente removido do sistema.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-muted p-4 rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Código:</span>
              <span className="font-mono">{produto.codigo}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Descrição:</span>
              <span className="text-right max-w-[200px] truncate">{produto.descricao}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Categoria:</span>
              <span>{produto.categoria_nome || "-"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Marca:</span>
              <span>{produto.marca_nome || "-"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Valor:</span>
              <span className="font-medium">{formatCurrency(produto.valor_unitario)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Estoque:</span>
              <span>{produto.estoque}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Status:</span>
              <Badge variant={produto.ativo ? "default" : "secondary"}>{produto.ativo ? "Ativo" : "Inativo"}</Badge>
            </div>
          </div>

          {produto.estoque > 0 && (
            <div className="bg-red-50 border border-red-200 p-3 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <span className="text-sm text-red-800 font-medium">Não é possível excluir!</span>
              </div>
              <p className="text-sm text-red-700 mt-1">
                Este produto possui {produto.estoque} unidades em estoque. Para excluir, primeiro zere o estoque.
              </p>
            </div>
          )}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={loading || produto.estoque > 0}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {produto.estoque > 0 ? "Estoque não zerado" : "Excluir Produto"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
