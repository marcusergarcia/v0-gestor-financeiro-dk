"use client"

import { useState, useEffect, useRef } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Loader2, Printer, Package, Download } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

interface DanfeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  nfeId: number | null
}

function formatDateBR(dateStr: string | null): string {
  if (!dateStr) return "-"
  try {
    return new Date(dateStr).toLocaleDateString("pt-BR")
  } catch {
    return dateStr
  }
}

function formatCnpjCpf(doc: string): string {
  if (!doc) return "-"
  const clean = doc.replace(/\D/g, "")
  if (clean.length === 14) {
    return clean.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5")
  }
  if (clean.length === 11) {
    return clean.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")
  }
  return doc
}

function formatChaveAcesso(chave: string): string {
  if (!chave) return "-"
  return chave.replace(/(\d{4})/g, "$1 ").trim()
}

export function DanfeDialog({ open, onOpenChange, nfeId }: DanfeDialogProps) {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<any>(null)
  const printRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  useEffect(() => {
    if (open && nfeId) {
      fetchDanfe()
    }
  }, [open, nfeId])

  const fetchDanfe = async () => {
    if (!nfeId) return
    setLoading(true)
    try {
      const response = await fetch(`/api/nfe/${nfeId}/danfe`)
      const result = await response.json()
      if (result.success) {
        setData(result.data)
      } else {
        toast({ title: "Erro", description: result.message, variant: "destructive" })
      }
    } catch {
      toast({ title: "Erro", description: "Erro ao carregar dados do DANFE", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const handlePrint = () => {
    if (!printRef.current) return
    const printContent = printRef.current.innerHTML
    const printWindow = window.open("", "", "width=800,height=1100")
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>DANFE - NF-e ${data?.nfe?.numero_nfe || ""}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: Arial, Helvetica, sans-serif; font-size: 9px; color: #000; padding: 10px; }
            .danfe-container { max-width: 210mm; margin: 0 auto; border: 2px solid #000; }
            .danfe-header { display: flex; border-bottom: 2px solid #000; }
            .danfe-header-left { width: 30%; border-right: 1px solid #000; padding: 6px; text-align: center; }
            .danfe-header-center { width: 40%; border-right: 1px solid #000; padding: 6px; text-align: center; }
            .danfe-header-right { width: 30%; padding: 6px; }
            .danfe-logo { max-height: 50px; max-width: 100%; }
            .danfe-title { font-size: 14px; font-weight: bold; }
            .danfe-subtitle { font-size: 8px; margin-top: 2px; }
            .danfe-section { border-bottom: 1px solid #000; padding: 4px 6px; }
            .danfe-section-title { font-weight: bold; font-size: 8px; text-transform: uppercase; background: #f0f0f0; padding: 2px 4px; margin: -4px -6px 4px; }
            .danfe-row { display: flex; border-bottom: 1px solid #ccc; }
            .danfe-row:last-child { border-bottom: none; }
            .danfe-cell { flex: 1; padding: 2px 4px; border-right: 1px solid #ccc; }
            .danfe-cell:last-child { border-right: none; }
            .danfe-cell label { font-size: 7px; color: #666; display: block; }
            .danfe-cell span { font-size: 9px; font-weight: 500; }
            .danfe-chave { font-family: monospace; font-size: 8px; letter-spacing: 1px; text-align: center; padding: 4px; }
            table { width: 100%; border-collapse: collapse; font-size: 8px; }
            th { background: #f0f0f0; border: 1px solid #000; padding: 3px; text-align: center; font-size: 7px; }
            td { border: 1px solid #ccc; padding: 2px 4px; }
            .text-right { text-align: right; }
            .text-center { text-align: center; }
            .total-row { font-weight: bold; background: #f8f8f8; }
            .info-compl { font-size: 8px; padding: 6px; min-height: 40px; }
            @media print {
              body { padding: 0; }
              .danfe-container { border-width: 2px; }
            }
          </style>
        </head>
        <body>
          ${printContent}
        </body>
        </html>
      `)
      printWindow.document.close()
      setTimeout(() => {
        printWindow.print()
        printWindow.close()
      }, 500)
    }
  }

  const nfe = data?.nfe
  const itens = data?.itens || []
  const emitente = data?.emitente
  const logo = data?.logo

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-blue-600" />
            DANFE - NF-e {nfe?.numero_nfe ? String(nfe.numero_nfe).padStart(9, "0") : ""}
          </DialogTitle>
          <DialogDescription>
            Documento Auxiliar da Nota Fiscal Eletronica
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : nfe ? (
          <>
            {/* Action buttons */}
            <div className="flex items-center gap-2 justify-end">
              <Button onClick={handlePrint} className="bg-blue-600 hover:bg-blue-700 text-white">
                <Printer className="h-4 w-4 mr-2" />
                Imprimir
              </Button>
            </div>

            {/* DANFE Content */}
            <div ref={printRef} className="bg-white">
              <div className="danfe-container" style={{ maxWidth: "210mm", margin: "0 auto", border: "2px solid #000", fontFamily: "Arial, sans-serif", fontSize: "9px" }}>
                {/* Header */}
                <div style={{ display: "flex", borderBottom: "2px solid #000" }}>
                  <div style={{ width: "30%", borderRight: "1px solid #000", padding: "6px", textAlign: "center" }}>
                    {logo && (
                      <img src={logo} alt="Logo" style={{ maxHeight: "50px", maxWidth: "100%", marginBottom: "4px" }} />
                    )}
                    <div style={{ fontSize: "10px", fontWeight: "bold" }}>
                      {emitente?.razao_social || emitente?.nome_fantasia || ""}
                    </div>
                    <div style={{ fontSize: "7px", marginTop: "2px" }}>
                      {[emitente?.endereco, emitente?.numero_endereco, emitente?.bairro].filter(Boolean).join(", ")}
                    </div>
                    <div style={{ fontSize: "7px" }}>
                      {emitente?.cidade} - {emitente?.uf} | CEP: {emitente?.cep}
                    </div>
                    <div style={{ fontSize: "7px" }}>
                      CNPJ: {formatCnpjCpf(emitente?.cnpj || "")} | IE: {emitente?.inscricao_estadual || ""}
                    </div>
                  </div>
                  <div style={{ width: "40%", borderRight: "1px solid #000", padding: "8px", textAlign: "center" }}>
                    <div style={{ fontSize: "16px", fontWeight: "bold" }}>DANFE</div>
                    <div style={{ fontSize: "7px", marginTop: "2px" }}>
                      Documento Auxiliar da Nota Fiscal Eletronica
                    </div>
                    <div style={{ fontSize: "8px", marginTop: "4px" }}>
                      0 - ENTRADA | <strong>1 - SAIDA</strong>
                    </div>
                    <div style={{ fontSize: "18px", fontWeight: "bold", marginTop: "4px" }}>
                      N. {String(nfe.numero_nfe).padStart(9, "0")}
                    </div>
                    <div style={{ fontSize: "9px" }}>
                      Serie: {nfe.serie || 1} | Folha 1/1
                    </div>
                  </div>
                  <div style={{ width: "30%", padding: "6px" }}>
                    <div style={{ fontSize: "7px", fontWeight: "bold", marginBottom: "4px" }}>CHAVE DE ACESSO</div>
                    <div style={{ fontFamily: "monospace", fontSize: "7px", letterSpacing: "0.5px", wordBreak: "break-all" }}>
                      {formatChaveAcesso(nfe.chave_acesso || "")}
                    </div>
                    {nfe.protocolo && (
                      <div style={{ marginTop: "6px" }}>
                        <div style={{ fontSize: "7px", fontWeight: "bold" }}>PROTOCOLO DE AUTORIZACAO</div>
                        <div style={{ fontSize: "8px", fontFamily: "monospace" }}>{nfe.protocolo}</div>
                        <div style={{ fontSize: "7px" }}>{formatDateBR(nfe.data_autorizacao)}</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Natureza da operacao */}
                <div style={{ borderBottom: "1px solid #000", padding: "3px 6px" }}>
                  <div style={{ fontSize: "7px", color: "#666" }}>NATUREZA DA OPERACAO</div>
                  <div style={{ fontSize: "9px", fontWeight: "500" }}>{nfe.natureza_operacao || "Venda"}</div>
                </div>

                {/* Destinatario */}
                <div style={{ borderBottom: "1px solid #000" }}>
                  <div style={{ fontSize: "7px", fontWeight: "bold", background: "#f0f0f0", padding: "2px 6px" }}>DESTINATARIO / REMETENTE</div>
                  <div style={{ display: "flex", borderBottom: "1px solid #ccc" }}>
                    <div style={{ flex: 3, padding: "2px 6px", borderRight: "1px solid #ccc" }}>
                      <div style={{ fontSize: "7px", color: "#666" }}>RAZAO SOCIAL</div>
                      <div style={{ fontSize: "9px" }}>{nfe.dest_razao_social || nfe.cliente_nome || "-"}</div>
                    </div>
                    <div style={{ flex: 1, padding: "2px 6px", borderRight: "1px solid #ccc" }}>
                      <div style={{ fontSize: "7px", color: "#666" }}>CNPJ/CPF</div>
                      <div style={{ fontSize: "9px" }}>{formatCnpjCpf(nfe.dest_cpf_cnpj || "")}</div>
                    </div>
                    <div style={{ flex: 1, padding: "2px 6px" }}>
                      <div style={{ fontSize: "7px", color: "#666" }}>DATA EMISSAO</div>
                      <div style={{ fontSize: "9px" }}>{formatDateBR(nfe.data_emissao || nfe.created_at)}</div>
                    </div>
                  </div>
                  <div style={{ display: "flex" }}>
                    <div style={{ flex: 3, padding: "2px 6px", borderRight: "1px solid #ccc" }}>
                      <div style={{ fontSize: "7px", color: "#666" }}>ENDERECO</div>
                      <div style={{ fontSize: "9px" }}>
                        {[nfe.dest_endereco, nfe.dest_numero].filter(Boolean).join(", ") || "-"}
                      </div>
                    </div>
                    <div style={{ flex: 1, padding: "2px 6px", borderRight: "1px solid #ccc" }}>
                      <div style={{ fontSize: "7px", color: "#666" }}>BAIRRO</div>
                      <div style={{ fontSize: "9px" }}>{nfe.dest_bairro || "-"}</div>
                    </div>
                    <div style={{ flex: 1, padding: "2px 6px", borderRight: "1px solid #ccc" }}>
                      <div style={{ fontSize: "7px", color: "#666" }}>MUNICIPIO</div>
                      <div style={{ fontSize: "9px" }}>{nfe.dest_cidade || "-"}</div>
                    </div>
                    <div style={{ width: "40px", padding: "2px 6px" }}>
                      <div style={{ fontSize: "7px", color: "#666" }}>UF</div>
                      <div style={{ fontSize: "9px" }}>{nfe.dest_uf || "-"}</div>
                    </div>
                  </div>
                </div>

                {/* Itens */}
                <div>
                  <div style={{ fontSize: "7px", fontWeight: "bold", background: "#f0f0f0", padding: "2px 6px", borderBottom: "1px solid #000" }}>DADOS DOS PRODUTOS / SERVICOS</div>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "8px" }}>
                    <thead>
                      <tr>
                        <th style={{ border: "1px solid #000", padding: "3px", fontSize: "7px", background: "#f0f0f0" }}>CODIGO</th>
                        <th style={{ border: "1px solid #000", padding: "3px", fontSize: "7px", background: "#f0f0f0" }}>DESCRICAO DO PRODUTO/SERVICO</th>
                        <th style={{ border: "1px solid #000", padding: "3px", fontSize: "7px", background: "#f0f0f0" }}>NCM</th>
                        <th style={{ border: "1px solid #000", padding: "3px", fontSize: "7px", background: "#f0f0f0" }}>CFOP</th>
                        <th style={{ border: "1px solid #000", padding: "3px", fontSize: "7px", background: "#f0f0f0" }}>UN</th>
                        <th style={{ border: "1px solid #000", padding: "3px", fontSize: "7px", background: "#f0f0f0" }}>QTD</th>
                        <th style={{ border: "1px solid #000", padding: "3px", fontSize: "7px", background: "#f0f0f0" }}>VL UNIT</th>
                        <th style={{ border: "1px solid #000", padding: "3px", fontSize: "7px", background: "#f0f0f0" }}>VL TOTAL</th>
                      </tr>
                    </thead>
                    <tbody>
                      {itens.map((item: any, idx: number) => (
                        <tr key={idx}>
                          <td style={{ border: "1px solid #ccc", padding: "2px 4px", textAlign: "center" }}>{item.codigo_produto}</td>
                          <td style={{ border: "1px solid #ccc", padding: "2px 4px" }}>{item.descricao}</td>
                          <td style={{ border: "1px solid #ccc", padding: "2px 4px", textAlign: "center" }}>{item.ncm}</td>
                          <td style={{ border: "1px solid #ccc", padding: "2px 4px", textAlign: "center" }}>{item.cfop || "5102"}</td>
                          <td style={{ border: "1px solid #ccc", padding: "2px 4px", textAlign: "center" }}>{item.unidade}</td>
                          <td style={{ border: "1px solid #ccc", padding: "2px 4px", textAlign: "right" }}>{Number(item.quantidade).toFixed(2)}</td>
                          <td style={{ border: "1px solid #ccc", padding: "2px 4px", textAlign: "right" }}>{Number(item.valor_unitario).toFixed(4)}</td>
                          <td style={{ border: "1px solid #ccc", padding: "2px 4px", textAlign: "right", fontWeight: "bold" }}>{Number(item.valor_total).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Totais */}
                <div style={{ borderTop: "2px solid #000", display: "flex" }}>
                  <div style={{ flex: 1, padding: "3px 6px", borderRight: "1px solid #ccc" }}>
                    <div style={{ fontSize: "7px", color: "#666" }}>VALOR TOTAL DOS PRODUTOS</div>
                    <div style={{ fontSize: "11px", fontWeight: "bold" }}>
                      {formatCurrency(Number(nfe.valor_produtos) || Number(nfe.valor_total))}
                    </div>
                  </div>
                  <div style={{ flex: 1, padding: "3px 6px", borderRight: "1px solid #ccc" }}>
                    <div style={{ fontSize: "7px", color: "#666" }}>VALOR TOTAL DA NOTA</div>
                    <div style={{ fontSize: "11px", fontWeight: "bold" }}>
                      {formatCurrency(Number(nfe.valor_total) || Number(nfe.valor_produtos))}
                    </div>
                  </div>
                </div>

                {/* Info complementar */}
                {nfe.info_complementar && (
                  <div style={{ borderTop: "1px solid #000", padding: "4px 6px" }}>
                    <div style={{ fontSize: "7px", fontWeight: "bold" }}>INFORMACOES COMPLEMENTARES</div>
                    <div style={{ fontSize: "8px", marginTop: "2px" }}>{nfe.info_complementar}</div>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <Package className="h-12 w-12 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500">NF-e nao encontrada</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
