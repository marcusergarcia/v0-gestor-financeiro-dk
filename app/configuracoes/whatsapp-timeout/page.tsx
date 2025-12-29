"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { RefreshCw, CheckCircle, XCircle, Clock } from "lucide-react"

export default function WhatsAppTimeoutConfig() {
  const [loading, setLoading] = useState(false)
  const [testResult, setTestResult] = useState<any>(null)

  const testTimeoutSystem = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/whatsapp/test-timeout")
      const data = await response.json()
      setTestResult(data)
    } catch (error) {
      console.error("Erro ao testar sistema:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Configuração de Timeout WhatsApp</h1>
        <p className="text-muted-foreground">
          Sistema de aviso de inatividade e finalização automática de atendimentos
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Como Funciona</CardTitle>
          <CardDescription>O sistema monitora conversas ativas e gerencia timeouts automaticamente</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3">
            <Clock className="h-5 w-5 text-blue-500 mt-0.5" />
            <div>
              <p className="font-medium">5 minutos de inatividade</p>
              <p className="text-sm text-muted-foreground">
                O sistema envia um aviso ao usuário perguntando se ainda precisa de atendimento
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Clock className="h-5 w-5 text-orange-500 mt-0.5" />
            <div>
              <p className="font-medium">10 minutos de inatividade</p>
              <p className="text-sm text-muted-foreground">
                O atendimento é finalizado automaticamente e o usuário é notificado
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Testar Sistema</CardTitle>
          <CardDescription>Verifique se o sistema de timeout está configurado corretamente</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={testTimeoutSystem} disabled={loading} className="w-full">
            {loading ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Testando...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Testar Configuração
              </>
            )}
          </Button>

          {testResult && (
            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <span className="font-medium">Sistema de Timeout</span>
                {testResult.timeout_system_ready ? (
                  <Badge variant="default" className="gap-1">
                    <CheckCircle className="h-3 w-3" />
                    Configurado
                  </Badge>
                ) : (
                  <Badge variant="destructive" className="gap-1">
                    <XCircle className="h-3 w-3" />
                    Não Configurado
                  </Badge>
                )}
              </div>

              <div className="space-y-2">
                <p className="font-medium">Detalhes:</p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between p-3 bg-muted rounded">
                    <span>Campos no Banco de Dados</span>
                    {testResult.results.database ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted rounded">
                    <span>CRON_SECRET Configurado</span>
                    {testResult.results.cronSecret ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted rounded">
                    <span>Conversas Ativas</span>
                    <Badge variant="outline">{testResult.results.conversationsActive}</Badge>
                  </div>
                </div>
              </div>

              {testResult.results.details?.inactiveConversations &&
                testResult.results.details.inactiveConversations.length > 0 && (
                  <div className="mt-4">
                    <p className="font-medium mb-2">Conversas Inativas:</p>
                    <div className="space-y-2">
                      {testResult.results.details.inactiveConversations.map((conv: any, index: number) => (
                        <div key={index} className="p-3 bg-muted rounded text-sm">
                          <p>
                            <strong>Telefone:</strong> {conv.phone_number}
                          </p>
                          <p>
                            <strong>Inativo há:</strong> {conv.minutes_inactive} minutos
                          </p>
                          <p>
                            <strong>Aviso enviado:</strong> {conv.timeout_warning_sent ? "Sim" : "Não"}
                          </p>
                          <p>
                            <strong>Etapa:</strong> {conv.current_step}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {!testResult.timeout_system_ready && (
                <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="font-medium text-yellow-900 mb-2">Ação necessária:</p>
                  <ol className="list-decimal list-inside space-y-1 text-sm text-yellow-800">
                    {!testResult.results.database && <li>Execute o script SQL add_whatsapp_timeout_fields.sql</li>}
                    {!testResult.results.cronSecret && <li>Configure a variável CRON_SECRET no Vercel</li>}
                  </ol>
                  <p className="text-sm text-yellow-800 mt-2">
                    Consulte o guia em docs/ATIVAR_TIMEOUT_WHATSAPP.md para mais detalhes
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
