"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Download, Trash2, RefreshCw, FileText, AlertCircle } from "lucide-react"
import { toast } from "sonner"

interface LogEntry {
  timestamp: string
  method: string
  endpoint: string
  request: any
  response: any
  status: number
  paymentType: string
}

export default function PagBankLogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null)

  const fetchLogs = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/pagbank/logs")
      const data = await response.json()
      if (data.success) {
        setLogs(data.logs)
      }
    } catch (error) {
      console.error("Erro ao buscar logs:", error)
      toast.error("Erro ao buscar logs")
    } finally {
      setLoading(false)
    }
  }

  const downloadLogs = async () => {
    try {
      const response = await fetch("/api/pagbank/logs?format=txt")
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `pagbank-logs-${new Date().toISOString().split("T")[0]}.txt`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast.success("Logs baixados com sucesso!")
    } catch (error) {
      console.error("Erro ao baixar logs:", error)
      toast.error("Erro ao baixar logs")
    }
  }

  const clearLogs = async () => {
    if (!confirm("Tem certeza que deseja limpar todos os logs?")) return

    try {
      const response = await fetch("/api/pagbank/logs", { method: "DELETE" })
      const data = await response.json()
      if (data.success) {
        toast.success("Logs limpos com sucesso")
        fetchLogs()
      }
    } catch (error) {
      console.error("Erro ao limpar logs:", error)
      toast.error("Erro ao limpar logs")
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [])

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return "bg-green-500"
    if (status >= 400 && status < 500) return "bg-yellow-500"
    return "bg-red-500"
  }

  const getPaymentTypeColor = (type: string) => {
    switch (type) {
      case "BOLETO":
        return "bg-blue-500"
      case "CREDIT_CARD":
        return "bg-purple-500"
      case "PAYOUT":
        return "bg-orange-500"
      case "CASHBACK":
        return "bg-green-500"
      default:
        return "bg-gray-500"
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Logs de Integração PagBank</h1>
          <p className="text-muted-foreground mt-1">Visualize e exporte os logs de transações para validação</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchLogs} variant="outline" disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
          <Button onClick={downloadLogs} variant="outline" disabled={logs.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Baixar TXT
          </Button>
          <Button onClick={clearLogs} variant="destructive" disabled={logs.length === 0}>
            <Trash2 className="h-4 w-4 mr-2" />
            Limpar
          </Button>
        </div>
      </div>

      {logs.length === 0 && !loading && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum log registrado</h3>
            <p className="text-muted-foreground text-center max-w-md">
              Execute transações no PagBank (criar boletos, payouts, etc.) para gerar logs que poderão ser enviados para
              a equipe de integração.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Transações Registradas ({logs.length})</CardTitle>
              <CardDescription>Clique em uma transação para ver os detalhes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 max-h-[600px] overflow-y-auto">
              {logs.map((log, index) => (
                <Card
                  key={index}
                  className={`cursor-pointer hover:bg-accent transition-colors ${
                    selectedLog === log ? "border-primary" : ""
                  }`}
                  onClick={() => setSelectedLog(log)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <Badge className={getPaymentTypeColor(log.paymentType)}>{log.paymentType}</Badge>
                      <Badge className={getStatusColor(log.status)}>{log.status}</Badge>
                    </div>
                    <div className="text-sm space-y-1">
                      <div className="font-medium">
                        {log.method} {log.endpoint}
                      </div>
                      <div className="text-muted-foreground">{new Date(log.timestamp).toLocaleString("pt-BR")}</div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>
        </div>

        <div>
          {selectedLog ? (
            <Card>
              <CardHeader>
                <CardTitle>Detalhes da Transação</CardTitle>
                <CardDescription>
                  {selectedLog.method} {selectedLog.endpoint}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Request</h3>
                  <pre className="bg-muted p-4 rounded-lg text-xs overflow-auto max-h-[300px]">
                    {JSON.stringify(selectedLog.request, null, 2)}
                  </pre>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Response</h3>
                  <pre className="bg-muted p-4 rounded-lg text-xs overflow-auto max-h-[300px]">
                    {JSON.stringify(selectedLog.response, null, 2)}
                  </pre>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-center">Selecione uma transação para ver os detalhes</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-blue-600" />
            Como enviar os logs para o PagBank
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <ol className="list-decimal list-inside space-y-2">
            <li>Execute pelo menos uma transação de cada tipo que você vai usar (Boleto, Cartão, etc.)</li>
            <li>Clique no botão "Baixar TXT" para baixar o arquivo de logs</li>
            <li>Envie o arquivo para a equipe de integração do PagBank</li>
            <li>Aguarde a validação da equipe (geralmente 1-2 dias úteis)</li>
            <li>Após aprovação, você poderá usar em produção</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  )
}
