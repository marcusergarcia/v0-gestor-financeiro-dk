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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Loader2, FileText, CheckCircle2, XCircle, AlertCircle, RefreshCw, Printer, Package, Clock, Copy } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

interface DetalheNfeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  nfeId: number | null
  onPrint?: (nfeId: number) => void
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

export function DetalheNfeDialog({ open, onOpenChange, nfeId, onPrint }: DetalheNfeDialogProps) {
  const [loading, setLoading] = useState(false)
  const [consultando, setConsultando] = useState(false)
  const [nfe, setNfe] = useState<any>(null)
  const [itens, setItens] = useState<any[]>([])
  const [transmissoes, setTransmissoes] = useState<any[]>([])
  const { toast } = useToast()

  useEffect(() => {
    if (open && nfeId) {
      fetchNfe()
    }
  }, [open, nfeId])

  const fetchNfe = async () => {
    if (!nfeId) return
    setLoading(true)
    try {
      const response = await fetch(`/api/nfe/${nfeId}`)
      const result = await response.json()
      if (result.success) {
        setNfe(result.data)
        setItens(result.data.itens || [])
        setTransmissoes(result.data.transmissoes || [])
      } else {
        toast({ title: "Erro", description: result.message, variant: "destructive" })
      }
    } catch {
      toast({ title: "Erro", description: "Erro ao carregar dados da NF-e", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const handleConsultar = async () => {
    if (!nfeId) return
    setConsultando(true)
    try {
      const response = await fetch(`/api/nfe/${nfeId}/consultar`, { method: "POST" })
      const result = await response.json()
      if (result.success) {
        toast({ title: "Consulta realizada", description: `cStat: ${result.data?.cStat} - ${result.data?.xMotivo}` })
        fetchNfe()
      } else {
        toast({ title: "Erro", description: result.message, variant: "destructive" })
      }
    } catch {
      toast({ title: "Erro", description: "Erro ao consultar NF-e na SEFAZ", variant: "destructive" })
    } finally {
      setConsultando(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({ title: "Copiado", description: "Texto copiado para a area de transferencia" })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "autorizada":
        return (
          <Badge className="bg-green-100 text-green-700 border-green-300 gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Autorizada
          </Badge>
        )
      case "processando":
        return (
          <Badge className="bg-blue-100 text-blue-700 border-blue-300 gap-1">
            <Clock className="h-3 w-3" />
            Processando
          </Badge>
        )
      case "rejeitada":
        return (
          <Badge className="bg-red-100 text-red-700 border-red-300 gap-1">
            <AlertCircle className="h-3 w-3" />
            Rejeitada
          </Badge>
        )
      case "cancelada":
        return (
          <Badge className="bg-red-100 text-red-700 border-red-300 gap-1">
            <XCircle className="h-3 w-3" />
            Cancelada
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-blue-600" />
            Detalhes da NF-e
          </DialogTitle>
          <DialogDescription>
            Informacoes completas da Nota Fiscal Eletronica de Material
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : nfe ? (
          <div className="space-y-6">
            {/* Header com status */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Numero NF-e</p>
                <p className="text-2xl font-bold text-blue-700">
                  {nfe.numero_nfe ? String(nfe.numero_nfe).padStart(9, "0") : "-"}
                </p>
                {nfe.serie && <p className="text-xs text-gray-400">Serie: {nfe.serie}</p>}
              </div>
              <div className="flex items-center gap-2">
                {getStatusBadge(nfe.status)}
                {(nfe.status === "processando" || nfe.status === "rejeitada") && (
                  <Button variant="outline" size="sm" onClick={handleConsultar} disabled={consultando}>
                    {consultando ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <RefreshCw className="h-4 w-4 mr-1" />}
                    Consultar SEFAZ
                  </Button>
                )}
                {nfe.status === "autorizada" && onPrint && (
                  <Button variant="outline" size="sm" onClick={() => onPrint(nfe.id)} className="text-emerald-600 border-emerald-300">
                    <Printer className="h-4 w-4 mr-1" />
                    DANFE
                  </Button>
                )}
              </div>
            </div>

            <Separator />

            {/* Chave de acesso */}
            {nfe.chave_acesso && (
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">Chave de Acesso</p>
                <div className="flex items-center gap-2">
                  <code className="text-xs font-mono bg-white px-2 py-1 rounded border flex-1 break-all">
                    {nfe.chave_acesso}
                  </code>
                  <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => copyToClipboard(nfe.chave_acesso)}>
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
                {nfe.protocolo && (
                  <div className="mt-2">
                    <p className="text-xs text-gray-500">Protocolo: <span className="font-mono">{nfe.protocolo}</span></p>
                  </div>
                )}
              </div>
            )}

            {/* Erro */}
            {(nfe.status === "rejeitada" || nfe.status === "erro") && nfe.mensagem_erro && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm font-medium text-red-700">Mensagem de Erro</p>
                <p className="text-sm text-red-600 mt-1">{nfe.mensagem_erro}</p>
                {nfe.codigo_erro && <p className="text-xs text-red-500 mt-1">Codigo: {nfe.codigo_erro}</p>}
              </div>
            )}

            {/* Dados do destinatario */}
            <div>
              <h4 className="font-semibold text-sm text-gray-700 mb-2">Destinatario</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-gray-500">Razao Social</p>
                  <p className="font-medium">{nfe.dest_razao_social || nfe.cliente_nome || "-"}</p>
                </div>
                <div>
                  <p className="text-gray-500">CPF/CNPJ</p>
                  <p className="font-medium">{nfe.dest_cpf_cnpj || "-"}</p>
                </div>
                <div>
                  <p className="text-gray-500">Endereco</p>
                  <p className="font-medium">
                    {[nfe.dest_endereco, nfe.dest_numero, nfe.dest_bairro, nfe.dest_cidade, nfe.dest_uf]
                      .filter(Boolean).join(", ") || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Natureza da Operacao</p>
                  <p className="font-medium">{nfe.natureza_operacao || "-"}</p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Origem */}
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div>
                <p className="text-gray-500">Origem</p>
                <p className="font-medium capitalize">{nfe.origem || "-"}</p>
              </div>
              <div>
                <p className="text-gray-500">Numero Origem</p>
                <p className="font-medium">{nfe.origem_numero || "-"}</p>
              </div>
              <div>
                <p className="text-gray-500">Data de Emissao</p>
                <p className="font-medium">{formatDateBR(nfe.data_autorizacao || nfe.data_emissao || nfe.created_at)}</p>
              </div>
            </div>

            <Separator />

            {/* Itens */}
            {itens.length > 0 && (
              <div>
                <h4 className="font-semibold text-sm text-gray-700 mb-2">Itens ({itens.length})</h4>
                <div className="overflow-x-auto border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">#</TableHead>
                        <TableHead className="text-xs">Codigo</TableHead>
                        <TableHead className="text-xs">Descricao</TableHead>
                        <TableHead className="text-xs">NCM</TableHead>
                        <TableHead className="text-xs text-center">Qtd</TableHead>
                        <TableHead className="text-xs text-right">Vl. Unit.</TableHead>
                        <TableHead className="text-xs text-right">Vl. Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {itens.map((item: any) => (
                        <TableRow key={item.id || item.numero_item}>
                          <TableCell className="text-xs">{item.numero_item}</TableCell>
                          <TableCell className="text-xs font-mono">{item.codigo_produto}</TableCell>
                          <TableCell className="text-xs truncate max-w-[200px]">{item.descricao}</TableCell>
                          <TableCell className="text-xs font-mono">{item.ncm}</TableCell>
                          <TableCell className="text-xs text-center">{item.quantidade} {item.unidade}</TableCell>
                          <TableCell className="text-xs text-right">{formatCurrency(Number(item.valor_unitario))}</TableCell>
                          <TableCell className="text-xs text-right font-semibold">{formatCurrency(Number(item.valor_total))}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <div className="text-right mt-2">
                  <span className="text-sm text-gray-500">Valor Total dos Produtos: </span>
                  <span className="text-lg font-bold text-blue-700">
                    {formatCurrency(Number(nfe.valor_total) || Number(nfe.valor_produtos))}
                  </span>
                </div>
              </div>
            )}

            {/* Info complementar */}
            {nfe.info_complementar && (
              <>
                <Separator />
                <div>
                  <h4 className="font-semibold text-sm text-gray-700 mb-1">Informacoes Complementares</h4>
                  <p className="text-sm text-gray-600">{nfe.info_complementar}</p>
                </div>
              </>
            )}

            {/* Transmissoes */}
            {transmissoes.length > 0 && (
              <>
                <Separator />
                <div>
                  <h4 className="font-semibold text-sm text-gray-700 mb-2">Historico de Transmissoes</h4>
                  <div className="space-y-2">
                    {transmissoes.map((t: any, idx: number) => (
                      <div key={idx} className="bg-gray-50 rounded-lg p-3 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-medium capitalize">{t.tipo?.replace("_", " ")}</span>
                          <span className="text-gray-400">{formatDateBR(t.created_at)}</span>
                        </div>
                        <div className="mt-1 flex items-center gap-2">
                          {t.sucesso ? (
                            <Badge className="bg-green-100 text-green-700 text-[10px]">Sucesso</Badge>
                          ) : (
                            <Badge className="bg-red-100 text-red-700 text-[10px]">Falha</Badge>
                          )}
                          <span className="text-gray-500">
                            {t.codigo_status && `cStat: ${t.codigo_status}`}
                            {t.mensagem_status && ` - ${t.mensagem_status}`}
                          </span>
                        </div>
                        {t.tempo_resposta_ms && (
                          <p className="text-gray-400 mt-1">Tempo: {t.tempo_resposta_ms}ms</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500">NF-e nao encontrada</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
