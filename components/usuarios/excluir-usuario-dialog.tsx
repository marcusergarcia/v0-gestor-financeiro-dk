"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { Usuario } from "@/types/usuario"

interface ExcluirUsuarioDialogProps {
  usuario: Usuario | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onUsuarioExcluido: () => void
}

export function ExcluirUsuarioDialog({ usuario, open, onOpenChange, onUsuarioExcluido }: ExcluirUsuarioDialogProps) {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleExcluir = async () => {
    if (!usuario) return

    setLoading(true)

    try {
      const response = await fetch(`/api/usuarios/${usuario.id}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Sucesso",
          description: "Usuário excluído com sucesso",
        })
        onOpenChange(false)
        onUsuarioExcluido()
      } else {
        toast({
          title: "Erro",
          description: data.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao excluir usuário",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Confirmar Exclusão
          </DialogTitle>
          <DialogDescription>
            Tem certeza que deseja excluir o usuário <strong>{usuario?.nome}</strong>?
            <br />
            Esta ação não pode ser desfeita.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={handleExcluir} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Excluir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
