"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ProdutoCombobox } from "./produto-combobox"
import { useToast } from "@/hooks/use-toast"

interface AdicionarProdutoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  orcamentoNumero: string
  onProdutoAdicionado: () => void
}

export function AdicionarProdutoDialog({
  open,
  onOpenChange,
  orcamentoNumero,
  onProdutoAdicionado,
}: AdicionarProdutoDialogProps) {
  const [produtoId, setProdutoId] = useState("")
  const [quantidade, setQuantidade] = useState("1")
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!produtoId) {
      toast({
        title: "Erro",
        description: "Selecione um produto",
        variant: "destructive",
      })
      return
    }

    if (!quantidade || Number.parseFloat(quantidade) <= 0) {
      toast({
        title: "Erro",
        description: "Informe uma quantidade válida",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      const response = await fetch(`/api/orcamentos/${orcamentoNumero}/itens`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          produto_id: Number.parseInt(produtoId),
          quantidade: Number.parseFloat(quantidade),
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Sucesso",
          description: "Produto adicionado com sucesso",
        })
        setProdutoId("")
        setQuantidade("1")
        onOpenChange(false)
        onProdutoAdicionado()
      } else {
        toast({
          title: "Erro",
          description: data.message || "Erro ao adicionar produto",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Erro ao adicionar produto:", error)
      toast({
        title: "Erro",
        description: "Erro ao adicionar produto",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setProdutoId("")
    setQuantidade("1")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Adicionar Produto</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="produto">Produto</Label>
            <ProdutoCombobox value={produtoId} onValueChange={setProdutoId} placeholder="Selecione o produto" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="quantidade">Quantidade</Label>
            <Input
              id="quantidade"
              type="number"
              min="0.01"
              step="0.01"
              value={quantidade}
              onChange={(e) => setQuantidade(e.target.value)}
              placeholder="1"
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Adicionando..." : "Adicionar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
