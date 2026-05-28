"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

export default function TestWhatsAppPage() {
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [verifyToken, setVerifyToken] = useState("")

  const testWebhookVerification = async () => {
    setLoading(true)
    try {
      const response = await fetch(
        `/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=${verifyToken}&hub.challenge=TEST_CHALLENGE_123`,
      )
      const text = await response.text()
      setResult({
        status: response.status,
        response: text,
        success: response.status === 200 && text === "TEST_CHALLENGE_123",
      })
    } catch (error: any) {
      setResult({ error: error.message })
    } finally {
      setLoading(false)
    }
  }

  const checkEnvVariables = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/whatsapp/status")
      const data = await response.json()
      setResult(data)
    } catch (error: any) {
      setResult({ error: error.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">Teste WhatsApp Webhook</h1>

      <Card className="p-6 mb-4">
        <h2 className="text-xl font-semibold mb-4">1. Verificar Variáveis de Ambiente</h2>
        <Button onClick={checkEnvVariables} disabled={loading}>
          {loading ? "Verificando..." : "Verificar Variáveis"}
        </Button>
      </Card>

      <Card className="p-6 mb-4">
        <h2 className="text-xl font-semibold mb-4">2. Testar Verificação do Webhook</h2>
        <p className="text-sm text-muted-foreground mb-4">Digite o mesmo token que você configurou no Meta:</p>
        <Input
          type="text"
          placeholder="Token de verificação"
          value={verifyToken}
          onChange={(e) => setVerifyToken(e.target.value)}
          className="mb-4"
        />
        <Button onClick={testWebhookVerification} disabled={loading || !verifyToken}>
          {loading ? "Testando..." : "Testar Webhook"}
        </Button>
      </Card>

      {result && (
        <Card className="p-6 bg-muted">
          <h3 className="font-semibold mb-2">Resultado:</h3>
          <pre className="text-xs overflow-auto">{JSON.stringify(result, null, 2)}</pre>
          {result.success && (
            <div className="mt-4 p-4 bg-green-100 text-green-800 rounded">
              ✅ Webhook funcionando corretamente! Agora você pode clicar em "Verificar e salvar" no Meta.
            </div>
          )}
        </Card>
      )}

      <Card className="p-6 mt-4 bg-blue-50">
        <h3 className="font-semibold mb-2">Informações do Webhook:</h3>
        <p className="text-sm">
          <strong>URL de callback:</strong> https://gestor9.vercel.app/api/whatsapp/webhook
        </p>
      </Card>
    </div>
  )
}
