"use client"

import { useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { CheckCircle, XCircle, Clock, ArrowLeft, Printer } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

export default function ConfirmacaoContent() {
  const searchParams = useSearchParams()
  const transactionId = searchParams.get("transaction_id")
  const status = searchParams.get("status")
  const [loading, setLoading] = useState(true)
  const [boleto, setBoleto] = useState<any>(null)

  useEffect(() => {
    if (transactionId) {
      // Buscar dados do boleto pelo ID do Asaas
      fetch(`/api/boletos?asaas_id=${transactionId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.boletos && data.boletos.length > 0) {
            setBoleto(data.boletos[0])
          }
          setLoading(false)
        })
        .catch((error) => {
          console.error("Erro ao buscar boleto:", error)
          setLoading(false)
        })
    } else {
      setLoading(false)
    }
  }, [transactionId])

  const getStatusConfig = () => {
    switch (status) {
      case "success":
        return {
          icon: CheckCircle,
          color: "text-green-500",
          title: "Pagamento Confirmado!",
          description: "Seu pagamento foi processado com sucesso.",
        }
      case "pending":
        return {
          icon: Clock,
          color: "text-yellow-500",
          title: "Pagamento Pendente",
          description: "Aguardando confirmação do pagamento.",
        }
      case "canceled":
        return {
          icon: XCircle,
          color: "text-red-500",
          title: "Pagamento Cancelado",
          description: "O pagamento foi cancelado.",
        }
      default:
        return {
          icon: Clock,
          color: "text-blue-500",
          title: "Processando Pagamento",
          description: "Estamos processando seu pagamento.",
        }
    }
  }

  const config = getStatusConfig()
  const Icon = config.icon

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite]" />
          <p className="mt-4 text-muted-foreground">Carregando informações...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center p-4">
      <Card className="w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-muted">
            <Icon className={`h-12 w-12 ${config.color}`} />
          </div>
          <CardTitle className="text-2xl">{config.title}</CardTitle>
          <CardDescription>{config.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {transactionId && (
            <div className="rounded-lg border bg-muted/50 p-4">
              <p className="text-sm font-medium text-muted-foreground">ID da Transação</p>
              <p className="font-mono text-sm">{transactionId}</p>
            </div>
          )}

          {boleto && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Número do Boleto</p>
                  <p className="text-lg font-semibold">{boleto.numero}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Valor</p>
                  <p className="text-lg font-semibold">
                    {new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(boleto.valor)}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Vencimento</p>
                  <p className="text-lg font-semibold">{new Date(boleto.vencimento).toLocaleDateString("pt-BR")}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <p className="text-lg font-semibold capitalize">{boleto.status}</p>
                </div>
              </div>

              {boleto.link_pdf && status === "pending" && (
                <Button onClick={() => window.open(boleto.link_pdf, "_blank")} variant="outline" className="w-full">
                  <Printer className="mr-2 h-4 w-4" />
                  Imprimir Boleto
                </Button>
              )}
            </div>
          )}

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button asChild className="flex-1">
              <Link href="/dashboard">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar ao Dashboard
              </Link>
            </Button>
            {status === "pending" && (
              <Button asChild variant="outline" className="flex-1 bg-transparent">
                <Link href="/financeiro">Ver Meus Boletos</Link>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
