"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RefreshCw, Play, CheckCircle2, XCircle, Clock } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export function WhatsAppTimeoutTab() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const handleRunCheck = async () => {
    setLoading(true)
    setResult(null)

    try {
      const response = await fetch("/api/whatsapp/check-timeouts")
      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({
        success: false,
        error: "Erro ao executar verificação",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-emerald-700">
            <Clock className="h-5 w-5" />
            Timeout de Conversas WhatsApp
          </CardTitle>
          <CardDescription>
            Configure e teste o sistema de avisos de inatividade (5 minutos) e finalização automática (10 minutos)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className="border-blue-200 bg-blue-50">
            <AlertDescription className="text-sm text-blue-800">
              <strong>Como funciona:</strong>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Após 5 minutos sem resposta, o usuário recebe um aviso</li>
                <li>Após 10 minutos sem resposta, o atendimento é finalizado automaticamente</li>
                <li>O usuário pode continuar o atendimento enviando qualquer mensagem</li>
              </ul>
            </AlertDescription>
          </Alert>

          <div className="flex gap-3">
            <Button
              onClick={handleRunCheck}
              disabled={loading}
              className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700"
            >
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Verificando...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Executar Verificação Agora
                </>
              )}
            </Button>
          </div>

          {result && (
            <Card className={result.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  {result.success ? (
                    <>
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      <span className="text-green-700">Verificação Concluída</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-5 w-5 text-red-600" />
                      <span className="text-red-700">Erro na Verificação</span>
                    </>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {result.success ? (
                  <div className="space-y-2">
                    <p className="text-sm text-gray-700">{result.message}</p>
                    <div className="grid grid-cols-3 gap-4 mt-4">
                      <div className="text-center p-3 bg-white rounded-lg border border-yellow-200">
                        <div className="text-2xl font-bold text-yellow-600">{result.results.warnings_sent}</div>
                        <div className="text-xs text-gray-600">Avisos Enviados</div>
                      </div>
                      <div className="text-center p-3 bg-white rounded-lg border border-red-200">
                        <div className="text-2xl font-bold text-red-600">{result.results.conversations_closed}</div>
                        <div className="text-xs text-gray-600">Finalizações</div>
                      </div>
                      <div className="text-center p-3 bg-white rounded-lg border border-gray-200">
                        <div className="text-2xl font-bold text-gray-600">{result.results.errors}</div>
                        <div className="text-xs text-gray-600">Erros</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-red-700">{result.error}</p>
                )}
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
