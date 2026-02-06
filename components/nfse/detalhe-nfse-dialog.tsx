"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Loader2, FileText, Clock, CheckCircle2, XCircle, AlertCircle, RefreshCw } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

interface DetalheNfseDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  notaId: number | null
}

function formatDateBR(dateStr: string | null): string {
  if (!dateStr) return "-"
  try {
    return new Date(dateStr).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  } catch {
    return dateStr
  }
}

export function DetalheNfseDialog({ open, onOpenChange, notaId }: DetalheNfseDialogProps) {
  const [loading, setLoading] = useState(false)
  const [consultando, setConsultando] = useState(false)
  const [nota, setNota] = useState<any>(null)
  const { toast } = useToast()

  useEffect(() => {
    if (open && notaId) {
      fetchNota()
    }
  }, [open, notaId])

  const handleConsultar = async () => {
    if (!notaId) return
    setConsultando(true)
    try {
      const response = await fetch(`/api/nfse/${notaId}/consultar`, { method: "POST" })
      const result = await response.json()

      if (result.success) {
        toast({ title: "NFS-e Encontrada!", description: result.message })
        fetchNota() // Recarregar dados
      } else {
        toast({
          title: "Consulta NFS-e",
          description: result.message,
          variant: result.data?.status === "processando" ? "default" : "destructive",
        })
      }
    } catch {
      toast({ title: "Erro", description: "Erro ao consultar na prefeitura", variant: "destructive" })
    } finally {
      setConsultando(false)
    }
  }

  const fetchNota = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/nfse/${notaId}`)
      const result = await response.json()
      if (result.success) {
        setNota(result.data)
      }
    } catch (error) {
      console.error("Erro ao buscar nota:", error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "emitida":
        return <Badge className="bg-green-100 text-green-700 border-green-300">Emitida</Badge>
      case "processando":
        return <Badge className="bg-blue-100 text-blue-700 border-blue-300">Processando</Badge>
      case "pendente":
        return <Badge className="bg-amber-100 text-amber-700 border-amber-300">Pendente</Badge>
      case "cancelada":
        return <Badge className="bg-red-100 text-red-700 border-red-300">Cancelada</Badge>
      case "erro":
        return <Badge className="bg-red-100 text-red-700 border-red-300">Erro</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-emerald-600" />
            Detalhes da NFS-e
          </DialogTitle>
          <DialogDescription>
            {nota?.numero_nfse ? `Nota ${nota.numero_nfse}` : `RPS ${nota?.numero_rps || ""}`}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
          </div>
        ) : nota ? (
          <div className="space-y-4">
            {/* Status e números */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  {getStatusBadge(nota.status)}
                  {nota.numero_nfse && (
                    <span className="text-sm text-gray-600">NFS-e: {nota.numero_nfse}</span>
                  )}
                </div>
                <p className="text-xs text-gray-500">
                  RPS: {nota.numero_rps} | Serie: {nota.serie_rps}
                </p>
                {nota.codigo_verificacao && (
                  <p className="text-xs text-gray-500">
                    Cod. Verificacao: {nota.codigo_verificacao}
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-emerald-700">{formatCurrency(nota.valor_total)}</p>
                {nota.data_emissao && (
                  <p className="text-xs text-gray-500">Emitida em: {formatDateBR(nota.data_emissao)}</p>
                )}
              </div>
            </div>

            {/* Botao consultar - para notas em processamento */}
            {nota.status === "processando" && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-800">NFS-e em processamento</p>
                    <p className="text-xs text-blue-600 mt-1">
                      O RPS foi enviado, mas a prefeitura ainda nao retornou o numero da NFS-e.
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={handleConsultar}
                    disabled={consultando}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {consultando ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Consultando...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Consultar na Prefeitura
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Erro */}
            {nota.status === "erro" && nota.mensagem_erro && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  {nota.mensagem_erro}
                </p>
              </div>
            )}

            {/* Cancelamento */}
            {nota.status === "cancelada" && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">
                  Cancelada em: {formatDateBR(nota.data_cancelamento)}
                </p>
                {nota.motivo_cancelamento && (
                  <p className="text-sm text-red-600 mt-1">Motivo: {nota.motivo_cancelamento}</p>
                )}
              </div>
            )}

            <Separator />

            {/* Origem */}
            <div>
              <h4 className="font-semibold text-gray-700 mb-2">Origem</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-500">Tipo:</span>{" "}
                  {nota.origem === "orcamento" && "Orcamento"}
                  {nota.origem === "ordem_servico" && "Ordem de Servico"}
                  {nota.origem === "boleto" && "Boleto"}
                  {nota.origem === "avulsa" && "Emissao Avulsa"}
                </div>
                {nota.origem_numero && (
                  <div>
                    <span className="text-gray-500">Numero:</span> {nota.origem_numero}
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Tomador */}
            <div>
              <h4 className="font-semibold text-gray-700 mb-2">Tomador</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-500">Nome:</span> {nota.tomador_razao_social}
                </div>
                <div>
                  <span className="text-gray-500">{nota.tomador_tipo === "PF" ? "CPF" : "CNPJ"}:</span>{" "}
                  {nota.tomador_cpf_cnpj}
                </div>
                {nota.tomador_email && (
                  <div>
                    <span className="text-gray-500">Email:</span> {nota.tomador_email}
                  </div>
                )}
                {nota.tomador_endereco && (
                  <div className="col-span-2">
                    <span className="text-gray-500">Endereco:</span>{" "}
                    {[nota.tomador_endereco, nota.tomador_bairro, nota.tomador_cidade, nota.tomador_uf]
                      .filter(Boolean)
                      .join(", ")}
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Servico */}
            <div>
              <h4 className="font-semibold text-gray-700 mb-2">Servico</h4>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-500">Codigo:</span> {nota.codigo_servico}
                </div>
                <div>
                  <span className="text-gray-500">Descricao:</span>
                  <p className="mt-1 text-gray-700 whitespace-pre-wrap">{nota.descricao_servico}</p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Valores */}
            <div>
              <h4 className="font-semibold text-gray-700 mb-2">Valores</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-500">Valor Servicos:</span>{" "}
                  {formatCurrency(nota.valor_servicos)}
                </div>
                <div>
                  <span className="text-gray-500">Deducoes:</span>{" "}
                  {formatCurrency(nota.valor_deducoes)}
                </div>
                <div>
                  <span className="text-gray-500">ISS ({((nota.aliquota_iss || 0) * 100).toFixed(2)}%):</span>{" "}
                  {formatCurrency(nota.valor_iss)}
                </div>
                <div>
                  <span className="text-gray-500">ISS Retido:</span>{" "}
                  {nota.iss_retido ? "Sim" : "Nao"}
                </div>
                {nota.valor_pis > 0 && (
                  <div>
                    <span className="text-gray-500">PIS:</span> {formatCurrency(nota.valor_pis)}
                  </div>
                )}
                {nota.valor_cofins > 0 && (
                  <div>
                    <span className="text-gray-500">COFINS:</span> {formatCurrency(nota.valor_cofins)}
                  </div>
                )}
                {nota.valor_ir > 0 && (
                  <div>
                    <span className="text-gray-500">IR:</span> {formatCurrency(nota.valor_ir)}
                  </div>
                )}
              </div>
            </div>

            {/* Transmissões */}
            {nota.transmissoes && nota.transmissoes.length > 0 && (
              <>
                <Separator />
                <div>
                  <h4 className="font-semibold text-gray-700 mb-2">Historico de Transmissoes</h4>
                  <div className="space-y-2">
                    {nota.transmissoes.map((t: any) => (
                      <div
                        key={t.id}
                        className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm"
                      >
                        <div className="flex items-center gap-2">
                          {t.sucesso ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )}
                          <span className="capitalize">{t.tipo.replace("_", " ")}</span>
                        </div>
                        <div className="flex items-center gap-3 text-gray-500">
                          {t.tempo_resposta_ms && <span>{t.tempo_resposta_ms}ms</span>}
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDateBR(t.created_at)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="py-8 text-center text-gray-500">Nota fiscal nao encontrada</div>
        )}
      </DialogContent>
    </Dialog>
  )
}
