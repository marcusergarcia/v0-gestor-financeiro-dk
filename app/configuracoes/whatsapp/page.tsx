"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { MessageSquare, CheckCircle, XCircle, Loader2 } from "lucide-react"

export default function WhatsAppConfigPage() {
  const [config, setConfig] = useState({
    phoneNumberId: "",
    accessToken: "",
    verifyToken: "",
    webhookUrl: "",
  })
  const [testPhone, setTestPhone] = useState("")
  const [testMessage, setTestMessage] = useState("Olá! Esta é uma mensagem de teste do sistema.")
  const [loading, setLoading] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<{
    phoneNumberId: boolean
    accessToken: boolean
    verifyToken: boolean
  } | null>(null)
  const [checkingStatus, setCheckingStatus] = useState(false)

  useEffect(() => {
    const webhookUrl = `${window.location.origin}/api/whatsapp/webhook`
    setConfig((prev) => ({ ...prev, webhookUrl }))
    checkConnectionStatus()
  }, [])

  const checkConnectionStatus = async () => {
    setCheckingStatus(true)
    try {
      const response = await fetch("/api/whatsapp/status")
      const result = await response.json()
      setConnectionStatus(result.config)
    } catch (error) {
      console.error("Erro ao verificar status:", error)
    } finally {
      setCheckingStatus(false)
    }
  }

  const handleTestMessage = async () => {
    if (!testPhone || !testMessage) {
      setTestResult({ success: false, message: "Preencha o número e a mensagem" })
      return
    }

    setLoading(true)
    setTestResult(null)

    try {
      const response = await fetch("/api/whatsapp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: testPhone,
          message: testMessage,
        }),
      })

      const result = await response.json()

      if (response.ok && result.success) {
        setTestResult({ success: true, message: "Mensagem enviada com sucesso!" })
      } else {
        setTestResult({ success: false, message: result.error || "Erro ao enviar mensagem" })
      }
    } catch (error) {
      setTestResult({ success: false, message: "Erro de conexão" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <MessageSquare className="h-8 w-8 text-green-600" />
          Configuração WhatsApp Business
        </h1>
        <p className="text-muted-foreground mt-2">
          Configure a integração com WhatsApp Business API para receber ordens de serviço
        </p>
      </div>

      <div className="grid gap-6">
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Erro comum:</strong> Se você recebeu o erro "Object does not exist or missing permissions",
            verifique:
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>
                Use <code className="bg-muted px-1 rounded">WHATSAPP_PHONE_NUMBER_ID</code> (não o Business Account ID)
              </li>
              <li>
                Token precisa ter permissões <code className="bg-muted px-1 rounded">whatsapp_business_management</code>{" "}
                e <code className="bg-muted px-1 rounded">whatsapp_business_messaging</code>
              </li>
              <li>Crie um System User com token permanente no Meta Business Suite</li>
            </ul>
            <a href="/docs/RESOLVER_ERRO_WHATSAPP.md" className="text-blue-600 underline mt-2 inline-block">
              Ver guia completo de resolução
            </a>
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Status da Integração
              <Button variant="outline" size="sm" onClick={checkConnectionStatus} disabled={checkingStatus}>
                {checkingStatus ? <Loader2 className="h-4 w-4 animate-spin" /> : "Atualizar"}
              </Button>
            </CardTitle>
            <CardDescription>Verificação das configurações do WhatsApp Business</CardDescription>
          </CardHeader>
          <CardContent>
            {connectionStatus ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-muted rounded-md">
                  <span className="font-medium">Phone Number ID</span>
                  {connectionStatus.phoneNumberId ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                </div>
                <div className="flex items-center justify-between p-3 bg-muted rounded-md">
                  <span className="font-medium">Access Token</span>
                  {connectionStatus.accessToken ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                </div>
                <div className="flex items-center justify-between p-3 bg-muted rounded-md">
                  <span className="font-medium">Verify Token</span>
                  {connectionStatus.verifyToken ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                </div>

                {connectionStatus.phoneNumberId && connectionStatus.accessToken && connectionStatus.verifyToken ? (
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>Todas as configurações estão corretas!</AlertDescription>
                  </Alert>
                ) : (
                  <Alert variant="destructive">
                    <XCircle className="h-4 w-4" />
                    <AlertDescription>
                      Algumas configurações estão faltando. Adicione as variáveis de ambiente no Vercel.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">Verificando status...</div>
            )}
          </CardContent>
        </Card>

        {/* Como Configurar */}
        <Card>
          <CardHeader>
            <CardTitle>📋 Como Configurar</CardTitle>
            <CardDescription>Siga os passos abaixo para ativar a integração</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-semibold">1. Obter Phone Number ID (Não o Business Account ID!)</h3>
              <p className="text-sm text-muted-foreground">
                No Meta Developers, vá em <strong>WhatsApp → Introdução</strong> e copie o{" "}
                <strong>Phone number ID</strong> (algo como 110200345501442)
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold">2. Criar System User com Token Permanente</h3>
              <p className="text-sm text-muted-foreground">
                No Meta Business Suite, crie um System User com permissões{" "}
                <code className="bg-muted px-1 rounded text-xs">whatsapp_business_management</code> e{" "}
                <code className="bg-muted px-1 rounded text-xs">whatsapp_business_messaging</code>
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold">3. Configurar Webhook</h3>
              <p className="text-sm text-muted-foreground">
                Em "Configuration" → "Webhooks", adicione a URL abaixo e inscreva-se no campo "messages"
              </p>
              <div className="bg-muted p-3 rounded-md font-mono text-sm break-all">{config.webhookUrl}</div>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold">4. Adicionar Variáveis de Ambiente</h3>
              <p className="text-sm text-muted-foreground">No Vercel, adicione as seguintes variáveis de ambiente:</p>
              <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                <li>
                  <code className="bg-muted px-1 rounded">WHATSAPP_PHONE_NUMBER_ID</code> - ID do telefone (não da conta
                  business)
                </li>
                <li>
                  <code className="bg-muted px-1 rounded">WHATSAPP_ACCESS_TOKEN</code> - Token do System User
                  (permanente)
                </li>
                <li>
                  <code className="bg-muted px-1 rounded">WHATSAPP_VERIFY_TOKEN</code> - Qualquer string segura que você
                  definir
                </li>
                <li>
                  <code className="bg-muted px-1 rounded">WHATSAPP_BUSINESS_ACCOUNT_ID</code> - ID da conta business
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Teste de Envio */}
        <Card>
          <CardHeader>
            <CardTitle>🧪 Testar Envio de Mensagem</CardTitle>
            <CardDescription>Envie uma mensagem de teste para verificar a configuração</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="testPhone">Número de Telefone (com código do país)</Label>
              <Input
                id="testPhone"
                placeholder="5511999999999"
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Exemplo: 5511999999999 (Brasil)</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="testMessage">Mensagem</Label>
              <Input id="testMessage" value={testMessage} onChange={(e) => setTestMessage(e.target.value)} />
            </div>

            <Button onClick={handleTestMessage} disabled={loading} className="w-full">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Enviar Mensagem de Teste
                </>
              )}
            </Button>

            {testResult && (
              <Alert variant={testResult.success ? "default" : "destructive"}>
                {testResult.success ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                <AlertDescription>{testResult.message}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Informações Adicionais */}
        <Card>
          <CardHeader>
            <CardTitle>ℹ️ Informações Importantes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>• O WhatsApp Business API é gratuito para até 1.000 conversas por mês</p>
            <p>• Cada conversa iniciada pelo cliente tem validade de 24 horas</p>
            <p>• Após 24 horas, você precisa usar templates aprovados pela Meta</p>
            <p>• As ordens de serviço criadas via WhatsApp aparecem automaticamente no sistema</p>
            <p>• Os técnicos podem visualizar e atualizar as OS normalmente</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
