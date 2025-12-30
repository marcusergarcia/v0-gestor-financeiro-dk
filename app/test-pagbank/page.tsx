"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, XCircle, Loader2, AlertCircle } from "lucide-react"

export default function TestPagBankPage() {
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<any[]>([])
  const [error, setError] = useState("")

  const runTests = async () => {
    setLoading(true)
    setError("")
    setResults([])

    const tests = [
      {
        name: "Boleto à vista",
        type: "boleto",
        data: {
          customer: {
            name: "José da Silva",
            email: "jose.silva@example.com",
            tax_id: "12345678909",
            phone: "11999999999",
          },
          amount: 10000, // R$ 100,00
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        },
      },
      {
        name: "PIX",
        type: "pix",
        data: {
          customer: {
            name: "Maria Santos",
            email: "maria.santos@example.com",
            tax_id: "98765432100",
            phone: "11988888888",
          },
          amount: 5000, // R$ 50,00
        },
      },
    ]

    for (const test of tests) {
      try {
        const response = await fetch("/api/test-pagbank", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(test),
        })

        const data = await response.json()

        setResults((prev) => [
          ...prev,
          {
            name: test.name,
            success: response.ok,
            status: response.status,
            data,
          },
        ])
      } catch (err) {
        setResults((prev) => [
          ...prev,
          {
            name: test.name,
            success: false,
            error: err instanceof Error ? err.message : "Erro desconhecido",
          },
        ])
      }
    }

    setLoading(false)
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Teste de Integração PagBank</CardTitle>
          <CardDescription>Execute testes para gerar logs de sucesso para validação da equipe PagBank</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Importante:</strong> Verifique se você está usando o token do ambiente <strong>SANDBOX</strong> do
              PagBank. Após executar os testes com sucesso, acesse a página de logs em /configuracoes/pagbank-logs para
              baixar o arquivo e enviar ao time de integração.
            </AlertDescription>
          </Alert>

          <div className="flex gap-4">
            <Button onClick={runTests} disabled={loading} className="flex-1">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Executar Testes
            </Button>
            <Button variant="outline" asChild>
              <a href="/configuracoes/pagbank-logs">Ver Logs</a>
            </Button>
          </div>

          {error && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {results.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold">Resultados:</h3>
              {results.map((result, index) => (
                <Card key={index}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{result.name}</p>
                        <p className="text-sm text-muted-foreground">Status: {result.status || "Erro"}</p>
                      </div>
                      {result.success ? (
                        <CheckCircle className="h-6 w-6 text-green-600" />
                      ) : (
                        <XCircle className="h-6 w-6 text-red-600" />
                      )}
                    </div>
                    {result.error && <p className="mt-2 text-sm text-red-600">{result.error}</p>}
                    {result.data && (
                      <details className="mt-2">
                        <summary className="text-sm cursor-pointer">Ver detalhes</summary>
                        <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-auto">
                          {JSON.stringify(result.data, null, 2)}
                        </pre>
                      </details>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
