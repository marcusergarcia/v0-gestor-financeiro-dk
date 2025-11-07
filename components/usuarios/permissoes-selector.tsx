"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import {
  Users,
  Package,
  FileText,
  FileSignature,
  File,
  DollarSign,
  Wrench,
  BarChart3,
  Shield,
  ScrollText,
  Settings,
  LayoutDashboard,
  Calendar,
} from "lucide-react"

interface PermissoesSelectorProps {
  permissoesSelecionadas: string[]
  onChange: (permissoes: string[]) => void
  tipo: "admin" | "usuario" | "tecnico" | "vendedor"
}

const permissoesDisponiveis = [
  { id: "dashboard", nome: "Dashboard", descricao: "Visualizar painel principal", icone: LayoutDashboard },
  { id: "clientes", nome: "Clientes", descricao: "Gerenciar clientes", icone: Users },
  { id: "produtos", nome: "Produtos", descricao: "Gerenciar produtos e serviços", icone: Package },
  { id: "orcamentos", nome: "Orçamentos", descricao: "Criar e gerenciar orçamentos", icone: FileText },
  { id: "contratos", nome: "Contratos", descricao: "Gerenciar contratos", icone: FileSignature },
  { id: "documentos", nome: "Documentos", descricao: "Gerenciar documentos", icone: File },
  { id: "financeiro", nome: "Financeiro", descricao: "Gestão financeira", icone: DollarSign },
  { id: "ordem_servico", nome: "Ordem de Serviço", descricao: "Gerenciar ordens de serviço", icone: Wrench },
  { id: "calendario", nome: "Calendário", descricao: "Visualizar calendário de agendamentos", icone: Calendar },
  { id: "relatorios", nome: "Relatórios", descricao: "Visualizar relatórios", icone: BarChart3 },
  { id: "usuarios", nome: "Usuários", descricao: "Gerenciar usuários", icone: Shield },
  { id: "logs", nome: "Logs", descricao: "Visualizar logs do sistema", icone: ScrollText },
  { id: "configuracoes", nome: "Configurações", descricao: "Configurações do sistema", icone: Settings },
]

const permissoesPadrao = {
  admin: [
    "dashboard",
    "clientes",
    "produtos",
    "orcamentos",
    "contratos",
    "documentos",
    "financeiro",
    "ordem_servico",
    "calendario",
    "relatorios",
    "usuarios",
    "logs",
    "configuracoes",
  ],
  tecnico: ["dashboard", "ordem_servico", "calendario", "clientes", "produtos"],
  vendedor: ["dashboard", "clientes", "orcamentos", "contratos", "financeiro"],
  usuario: ["dashboard"],
}

export function PermissoesSelector({ permissoesSelecionadas, onChange, tipo }: PermissoesSelectorProps) {
  const [permissoes, setPermissoes] = useState<string[]>(permissoesSelecionadas || [])

  useEffect(() => {
    console.log("PermissoesSelector - permissoesSelecionadas mudou:", permissoesSelecionadas)
    setPermissoes(permissoesSelecionadas || [])
  }, [permissoesSelecionadas])

  const handleToggle = (permissaoId: string, checked: boolean) => {
    console.log("Checkbox changed:", permissaoId, checked)
    let novasPermissoes: string[]

    if (checked) {
      novasPermissoes = [...permissoes, permissaoId]
      console.log("Adicionando permissão:", permissaoId)
    } else {
      novasPermissoes = permissoes.filter((p) => p !== permissaoId)
      console.log("Removendo permissão:", permissaoId)
    }

    console.log("Novas permissões:", novasPermissoes)
    setPermissoes(novasPermissoes)
    onChange(novasPermissoes)
  }

  const aplicarPadrao = () => {
    const padrao = permissoesPadrao[tipo]
    console.log("Aplicando permissões padrão para", tipo, ":", padrao)
    setPermissoes(padrao)
    onChange(padrao)
  }

  const selecionarTodas = () => {
    const todas = permissoesDisponiveis.map((p) => p.id)
    console.log("Selecionando todas as permissões:", todas)
    setPermissoes(todas)
    onChange(todas)
  }

  const limparTodas = () => {
    console.log("Limpando todas as permissões")
    setPermissoes([])
    onChange([])
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Permissões do Usuário</CardTitle>
            <CardDescription>Selecione os módulos que o usuário terá acesso</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={aplicarPadrao}>
              Padrão
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={selecionarTodas}>
              Todas
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={limparTodas}>
              Limpar
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {permissoesDisponiveis.map((permissao) => {
            const Icone = permissao.icone
            const isChecked = permissoes.includes(permissao.id)
            console.log(`Permissão ${permissao.id} checked:`, isChecked)

            return (
              <div
                key={permissao.id}
                className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-slate-50 transition-colors"
              >
                <Checkbox
                  id={`permissao-${permissao.id}`}
                  checked={isChecked}
                  onCheckedChange={(checked) => handleToggle(permissao.id, checked as boolean)}
                />
                <div className="flex-1">
                  <Label
                    htmlFor={`permissao-${permissao.id}`}
                    className="flex items-center gap-2 font-medium cursor-pointer"
                  >
                    <Icone className="h-4 w-4 text-purple-600" />
                    {permissao.nome}
                  </Label>
                  <p className="text-xs text-muted-foreground mt-1">{permissao.descricao}</p>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
