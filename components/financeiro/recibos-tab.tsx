"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Receipt, Eye, Printer } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import Link from "next/link"

interface Recibo {
  id: number
  numero: string
  cliente_id: number
  cliente_nome: string
  valor: number
  data_emissao: string
  descricao: string
  observacoes: string
  created_at: string
}

export function RecibosTab() {
  const { toast } = useToast()
  const [recibos, setRecibos] = useState<Recibo[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRecibos()
  }, [])

  const fetchRecibos = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/recibos")
      const data = await response.json()

      if (data.success) {
        setRecibos(data.data)
      } else {
        toast({
          title: "Erro",
          description: "Erro ao carregar recibos",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Erro ao buscar recibos:", error)
      toast({
        title: "Erro",
        description: "Erro ao carregar recibos",
        variant: "destructive",
      })
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Recibos
          </h2>
          <p className="text-gray-600">Gerencie os recibos emitidos</p>
        </div>
        <Link href="/financeiro/novo-recibo">
          <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
            <Plus className="h-4 w-4 mr-2" />
            Novo Recibo
          </Button>
        </Link>
      </div>

      <Card className="border-0 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-t-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Receipt className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-white">Lista de Recibos</CardTitle>
              <CardDescription className="text-blue-100">
                {recibos.length} {recibos.length === 1 ? "recibo emitido" : "recibos emitidos"}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg animate-pulse"
                >
                  <div className="h-12 w-12 bg-gray-200 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/3" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                  </div>
                  <div className="h-8 w-24 bg-gray-200 rounded" />
                </div>
              ))}
            </div>
          ) : recibos.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <Receipt className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum recibo encontrado</h3>
              <p className="text-gray-600 mb-6">Comece criando seu primeiro recibo</p>
              <Link href="/financeiro/novo-recibo">
                <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeiro Recibo
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recibos.map((recibo) => (
                <div
                  key={recibo.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50/30 transition-all"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
                      <Receipt className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-gray-900">Recibo #{recibo.numero}</span>
                        <span className="text-sm text-gray-500">•</span>
                        <span className="text-sm text-gray-600">{recibo.cliente_nome}</span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span>📅 {format(new Date(recibo.data_emissao), "dd/MM/yyyy", { locale: ptBR })}</span>
                        <span className="font-semibold text-green-600">{formatCurrency(recibo.valor)}</span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1 truncate">{recibo.descricao}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" className="hover:bg-blue-100">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="hover:bg-purple-100">
                      <Printer className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
