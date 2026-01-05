"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CreditCard, Loader2 } from "lucide-react"

export default function TestPagBankCartaoPage() {
  const [loading, setLoading] = useState(false)
  const [resultado, setResultado] = useState<any>(null)

  const [clienteNome, setClienteNome] = useState("Jose da Silva")
  const [clienteEmail, setClienteEmail] = useState("email@test.com")
  const [clienteTaxId, setClienteTaxId] = useState("12345678909")
  const [valorTotal, setValorTotal] = useState(50000)
  const [referenceId, setReferenceId] = useState("ex-00001")

  const gerarPagamentoCartao = async () => {
    setLoading(true)
    setResultado(null)

    try {
      const response = await fetch("/api/test-pagbank-cartao", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clienteNome,
          clienteEmail,
          clienteTaxId,
          valorTotal,
          referenceId,
        }),
      })

      const data = await response.json()
      setResultado(data)
    } catch (error) {
      console.error("Erro ao gerar pagamento:", error)
      setResultado({ error: "Erro ao gerar pagamento com cartão" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-6 h-6" />
            Simulador de Pagamento com Cartão - PagBank
          </CardTitle>
          <CardDescription>
            Gera logs de pagamento via cartão de crédito no formato exigido pelo PagBank para homologação
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="nome">Nome do Cliente</Label>
              <Input id="nome" value={clienteNome} onChange={(e) => setClienteNome(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={clienteEmail} onChange={(e) => setClienteEmail(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="taxId">CPF/CNPJ</Label>
              <Input id="taxId" value={clienteTaxId} onChange={(e) => setClienteTaxId(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="valor">Valor (centavos)</Label>
              <Input
                id="valor"
                type="number"
                value={valorTotal}
                onChange={(e) => setValorTotal(Number.parseInt(e.target.value))}
              />
              <p className="text-xs text-muted-foreground mt-1">R$ {(valorTotal / 100).toFixed(2)}</p>
            </div>
          </div>

          <div>
            <Label htmlFor="reference">Reference ID</Label>
            <Input id="reference" value={referenceId} onChange={(e) => setReferenceId(e.target.value)} />
          </div>

          <Button onClick={gerarPagamentoCartao} disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Gerando log...
              </>
            ) : (
              <>
                <CreditCard className="mr-2 h-4 w-4" />
                Gerar Pagamento com Cartão
              </>
            )}
          </Button>

          {resultado && (
            <Card className={resultado.success ? "border-green-500" : "border-red-500"}>
              <CardHeader>
                <CardTitle className="text-sm">Resultado</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-xs overflow-auto">{JSON.stringify(resultado, null, 2)}</pre>
              </CardContent>
            </Card>
          )}

          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Próximos passos:</h3>
            <ol className="text-sm space-y-1 list-decimal list-inside">
              <li>Clique em "Gerar Pagamento com Cartão" para criar o log</li>
              <li>
                Acesse <strong>/configuracoes/pagbank-logs</strong>
              </li>
              <li>Baixe o arquivo de log gerado</li>
              <li>Envie ao Maurício (Time de Integração PagBank)</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
