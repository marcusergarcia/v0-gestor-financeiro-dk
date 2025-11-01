"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Package, Tag, Award, DollarSign, Archive } from "lucide-react"

interface Produto {
  id: string
  codigo: string
  descricao: string
  categoria_nome?: string
  marca_nome?: string
  valor_unitario: number
  valor_mao_obra: number
  valor_custo: number
  estoque: number
  estoque_minimo: number
  ativo: boolean
}

interface ProdutoInfoCardProps {
  produto: Produto
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value)
}

export function ProdutoInfoCard({ produto }: ProdutoInfoCardProps) {
  const margemLucro =
    produto.valor_custo > 0 ? ((produto.valor_unitario - produto.valor_custo) / produto.valor_custo) * 100 : 0

  return (
    <Card className="bg-blue-50 border-blue-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg text-blue-800 flex items-center gap-2">
          <Package className="h-5 w-5" />
          Informações do Produto
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-medium text-blue-800">{produto.codigo}</span>
              <Badge variant="outline" className="text-xs">
                {produto.ativo ? "Ativo" : "Inativo"}
              </Badge>
            </div>
            <p className="text-sm font-medium">{produto.descricao}</p>

            {produto.categoria_nome && (
              <div className="flex items-center gap-2 text-sm">
                <Tag className="h-4 w-4 text-blue-600" />
                <span>{produto.categoria_nome}</span>
              </div>
            )}

            {produto.marca_nome && (
              <div className="flex items-center gap-2 text-sm">
                <Award className="h-4 w-4 text-blue-600" />
                <span>{produto.marca_nome}</span>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <DollarSign className="h-4 w-4 text-green-600" />
              <span className="font-medium text-green-700">{formatCurrency(produto.valor_unitario)}</span>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <Archive className="h-4 w-4 text-blue-600" />
              <span>Estoque: {produto.estoque}</span>
              {produto.estoque <= produto.estoque_minimo && produto.estoque_minimo > 0 && (
                <Badge className="bg-red-100 text-red-800 text-xs">Baixo</Badge>
              )}
            </div>

            <div className="text-xs text-blue-700 bg-blue-100 p-2 rounded">
              <div>Custo: {formatCurrency(produto.valor_custo)}</div>
              <div>Margem: {margemLucro.toFixed(1)}%</div>
              {produto.valor_mao_obra > 0 && <div>Mão de obra: {formatCurrency(produto.valor_mao_obra)}</div>}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
