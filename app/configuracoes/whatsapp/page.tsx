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

  useEffect(() => {
    // Carregar configurações salvas
    const webhookUrl = `${window.location.origin}/api/whatsapp/webhook`
    setConfig((prev) => ({ ...prev, webhookUrl }))
  }, [])

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
        {/* Instruções */}
        <Card>
          <CardHeader>
            <CardTitle>📋 Como Configurar</CardTitle>
            <CardDescription>Siga os passos abaixo para ativar a integração</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-semibold">1. Criar App no Meta for Developers</h3>
              <p className="text-sm text-muted-foreground">
                Acesse{" "}
                <a
                  href="https://developers.facebook.com"
                  target="_blank"
                  className="text-blue-600 underline"
                  rel="noreferrer"
                >
                  developers.facebook.com
                </a>{" "}
                e crie um app do tipo "Business"
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold">2. Adicionar WhatsApp Product</h3>
              <p className="text-sm text-muted-foreground">
                No painel do app, adicione o produto "WhatsApp" e configure um número de telefone
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
                  <code className="bg-muted px-1 rounded">WHATSAPP_PHONE_NUMBER_ID</code>
                </li>
                <li>
                  <code className="bg-muted px-1 rounded">WHATSAPP_ACCESS_TOKEN</code>
                </li>
                <li>
                  <code className="bg-muted px-1 rounded">WHATSAPP_VERIFY_TOKEN</code>
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
