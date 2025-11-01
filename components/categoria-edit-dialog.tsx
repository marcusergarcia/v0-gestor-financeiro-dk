"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"

interface Categoria {
  id: string
  nome: string
  codigo: string
  descricao?: string
  ativo: boolean
}

interface CategoriaEditDialogProps {
  categoria: Categoria | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function CategoriaEditDialog({ categoria, open, onOpenChange, onSuccess }: CategoriaEditDialogProps) {
  const [nome, setNome] = useState("")
  const [codigo, setCodigo] = useState("")
  const [descricao, setDescricao] = useState("")
  const [ativo, setAtivo] = useState(true)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (categoria) {
      setNome(categoria.nome)
      setCodigo(categoria.codigo)
      setDescricao(categoria.descricao || "")
      setAtivo(categoria.ativo)
    }
  }, [categoria])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!categoria) return

    setLoading(true)

    try {
      const response = await fetch(`/api/categorias/${categoria.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nome,
          codigo,
          descricao,
          ativo,
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Sucesso",
          description: "Categoria atualizada com sucesso",
        })
        onSuccess()
        onOpenChange(false)
      } else {
        toast({
          title: "Erro",
          description: data.message || "Erro ao atualizar categoria",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Erro ao atualizar categoria:", error)
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Categoria</DialogTitle>
          <DialogDescription>Faça as alterações necessárias na categoria.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="nome" className="text-right">
                Nome
              </Label>
              <Input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} className="col-span-3" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="codigo" className="text-right">
                Código
              </Label>
              <Input id="codigo" value={codigo} onChange={(e) => setCodigo(e.target.value)} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="descricao" className="text-right">
                Descrição
              </Label>
              <Textarea
                id="descricao"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                className="col-span-3"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="ativo" className="text-right">
                Ativo
              </Label>
              <Switch id="ativo" checked={ativo} onCheckedChange={setAtivo} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
