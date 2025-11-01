"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { PermissoesSelector } from "./permissoes-selector"
import { Loader2 } from "lucide-react"
import type { Usuario } from "@/types/usuario"

interface EditarUsuarioDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  usuario: Usuario | null
  onUsuarioAtualizado: () => void
}

export function EditarUsuarioDialog({ open, onOpenChange, usuario, onUsuarioAtualizado }: EditarUsuarioDialogProps) {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    cpf: "",
    telefone: "",
    tipo: "usuario" as "admin" | "usuario" | "tecnico" | "vendedor",
    senha: "",
    ativo: true,
    permissoes: [] as string[],
  })

  useEffect(() => {
    if (usuario) {
      console.log("Carregando usuário:", usuario)
      setFormData({
        nome: usuario.nome || "",
        email: usuario.email || "",
        cpf: usuario.cpf || "",
        telefone: usuario.telefone || "",
        tipo: usuario.tipo || "usuario",
        senha: "",
        ativo: usuario.ativo === 1,
        permissoes: usuario.permissoes || [],
      })
    }
  }, [usuario])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!usuario) return

    setLoading(true)

    try {
      console.log("Enviando dados de edição:", formData)

      const response = await fetch(`/api/usuarios/${usuario.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          ativo: formData.ativo ? 1 : 0,
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Sucesso",
          description: "Usuário atualizado com sucesso!",
        })
        onOpenChange(false)
        onUsuarioAtualizado()
      } else {
        toast({
          title: "Erro",
          description: data.message || "Erro ao atualizar usuário",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Erro ao atualizar usuário:", error)
      toast({
        title: "Erro",
        description: "Erro ao atualizar usuário",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handlePermissoesChange = (novasPermissoes: string[]) => {
    console.log("Permissões mudaram no edit:", novasPermissoes)
    setFormData((prev) => ({
      ...prev,
      permissoes: novasPermissoes,
    }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Usuário</DialogTitle>
          <DialogDescription>Edite os dados do usuário</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-nome">Nome *</Label>
              <Input
                id="edit-nome"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-email">Email *</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-cpf">CPF</Label>
              <Input
                id="edit-cpf"
                value={formData.cpf}
                onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-telefone">Telefone</Label>
              <Input
                id="edit-telefone"
                value={formData.telefone}
                onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-tipo">Tipo de Usuário *</Label>
              <Select value={formData.tipo} onValueChange={(value: any) => setFormData({ ...formData, tipo: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="tecnico">Técnico</SelectItem>
                  <SelectItem value="vendedor">Vendedor</SelectItem>
                  <SelectItem value="usuario">Usuário</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-senha">Nova Senha (deixe em branco para não alterar)</Label>
              <Input
                id="edit-senha"
                type="password"
                value={formData.senha}
                onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="edit-ativo"
              checked={formData.ativo}
              onCheckedChange={(checked) => setFormData({ ...formData, ativo: checked })}
            />
            <Label htmlFor="edit-ativo">Usuário Ativo</Label>
          </div>

          <PermissoesSelector
            permissoesSelecionadas={formData.permissoes}
            onChange={handlePermissoesChange}
            tipo={formData.tipo}
          />

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar Alterações
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
