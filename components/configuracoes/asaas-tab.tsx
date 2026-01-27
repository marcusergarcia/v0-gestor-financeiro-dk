"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertCircle, CheckCircle2, CreditCard, ExternalLink, Loader2, Settings } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export function AsaasTab() {
  const [loading, setLoading] = useState(false)
  const [testing, setTesting] = useState(false)
  const [apiKey, setApiKey] = useState("")
  const [environment, setEnvironment] = useState<"sandbox" | "production">("production")
  const [connectionStatus, setConnectionStatus] = useState<"connected" | "disconnected" | "unknown">("unknown")
  const { toast } = useToast()

  useEffect(() => {
    checkConnection()
  }, [])

  const checkConnection = async () => {
    try {
      const response = await fetch("/api/asaas/status")
      const result = await response.json()
      
      if (result.success && result.data?.connected) {
        setConnectionStatus("connected")
        setEnvironment(result.data.environment || "production")
      } else {
        setConnectionStatus("disconnected")
      }
    } catch {
      setConnectionStatus("unknown")
    }
  }

  const handleTestConnection = async () => {
    setTesting(true)
    try {
      const response = await fetch("/api/asaas/test")
      const result = await response.json()

      if (result.success) {
        toast({
          title: "Conexao bem-sucedida!",
          description: `Conectado ao Asaas (${result.data?.environment || "production"})`,
        })
        setConnectionStatus("connected")
      } else {
        toast({
          title: "Erro de conexao",
          description: result.message || "Nao foi possivel conectar ao Asaas",
          variant: "destructive",
        })
        setConnectionStatus("disconnected")
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao testar conexao com Asaas",
        variant: "destructive",
      })
      setConnectionStatus("disconnected")
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl shadow-lg">
          <CreditCard className="h-8 w-8 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Configuracoes do Asaas</h2>
          <p className="text-gray-600">Configure a integracao com o Asaas para emissao de boletos</p>
        </div>
      </div>

      {/* Status da conexão */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-teal-600" />
            Status da Integracao
          </CardTitle>
          <CardDescription>Verifique o status da conexao com o Asaas</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              {connectionStatus === "connected" ? (
                <>
                  <CheckCircle2 className="h-6 w-6 text-green-500" />
                  <div>
                    <p className="font-medium text-green-700">Conectado</p>
                    <p className="text-sm text-gray-600">
                      Ambiente: {environment === "sandbox" ? "Sandbox (Testes)" : "Producao"}
                    </p>
                  </div>
                </>
              ) : connectionStatus === "disconnected" ? (
                <>
                  <AlertCircle className="h-6 w-6 text-red-500" />
                  <div>
                    <p className="font-medium text-red-700">Desconectado</p>
                    <p className="text-sm text-gray-600">Configure a API Key nas variaveis de ambiente</p>
                  </div>
                </>
              ) : (
                <>
                  <AlertCircle className="h-6 w-6 text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-700">Status desconhecido</p>
                    <p className="text-sm text-gray-600">Clique em testar conexao</p>
                  </div>
                </>
              )}
            </div>
            <Button
              onClick={handleTestConnection}
              disabled={testing}
              className="bg-teal-600 hover:bg-teal-700"
            >
              {testing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Testando...
                </>
              ) : (
                "Testar Conexao"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Instruções de configuração */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ExternalLink className="h-5 w-5 text-blue-600" />
            Configuracao
          </CardTitle>
          <CardDescription>Como configurar a integracao com o Asaas</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="font-medium text-blue-800 mb-2">Variaveis de Ambiente Necessarias:</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="font-mono text-xs">ASAAS_API_KEY</Badge>
                <span className="text-sm text-gray-600">- Sua chave de API do Asaas</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="font-mono text-xs">ASAAS_ENVIRONMENT</Badge>
                <span className="text-sm text-gray-600">- sandbox ou production (padrao: production)</span>
              </div>
            </div>
          </div>

          <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
            <h4 className="font-medium text-amber-800 mb-2">Como obter a API Key:</h4>
            <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700">
              <li>Acesse sua conta no Asaas</li>
              <li>Va em Configuracoes &gt; Integracoes</li>
              <li>Clique em "Gerar nova chave de API"</li>
              <li>Copie a chave gerada</li>
              <li>Configure a variavel ASAAS_API_KEY no Vercel</li>
            </ol>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => window.open("https://www.asaas.com/", "_blank")}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Acessar Asaas
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => window.open("https://docs.asaas.com/", "_blank")}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Documentacao
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Funcionalidades */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle>Funcionalidades Disponiveis</CardTitle>
          <CardDescription>Recursos disponiveis com a integracao Asaas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <span className="text-gray-700">Emissao de Boletos Bancarios</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <span className="text-gray-700">Gerenciamento de Clientes</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <span className="text-gray-700">Linha Digitavel e Codigo de Barras</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <span className="text-gray-700">PDF do Boleto para Impressao</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <span className="text-gray-700">Multa e Juros Automaticos</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
