"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Receipt, Construction } from "lucide-react"

export function RecibosTab() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Recibos
          </h2>
          <p className="text-gray-600">Gerencie os recibos emitidos</p>
        </div>
        <Button disabled className="opacity-50">
          <Plus className="h-4 w-4 mr-2" />
          Novo Recibo
        </Button>
      </div>

      <Card className="border-0 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-t-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Receipt className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-white">Lista de Recibos</CardTitle>
              <CardDescription className="text-blue-100">Funcionalidade em desenvolvimento</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-12">
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Construction className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Em Desenvolvimento</h3>
            <p className="text-gray-600 mb-4">A funcionalidade de recibos será implementada em breve</p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
              <p className="text-sm text-blue-800">
                <strong>Próximas funcionalidades:</strong>
                <br />• Emissão de recibos
                <br />• Controle de numeração
                <br />• Integração com clientes
                <br />• Relatórios de recibos
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
