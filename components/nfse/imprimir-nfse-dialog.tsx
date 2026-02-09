"use client"

import { useState, useEffect, useRef } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Loader2, Printer, Download } from "lucide-react"
import { formatCurrency } from "@/lib/utils"

interface ImprimirNfseDialogProps {
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
    })
  } catch {
    return dateStr
  }
}

function formatCpfCnpj(value: string): string {
  if (!value) return "-"
  const clean = value.replace(/\D/g, "")
  if (clean.length === 11) {
    return clean.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")
  }
  if (clean.length === 14) {
    return clean.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5")
  }
  return value
}

export function ImprimirNfseDialog({ open, onOpenChange, notaId }: ImprimirNfseDialogProps) {
  const [loading, setLoading] = useState(false)
  const [dados, setDados] = useState<any>(null)
  const printRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open && notaId) {
      fetchDados()
    }
  }, [open, notaId])

  const fetchDados = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/nfse/${notaId}/imprimir`)
      const result = await response.json()
      if (result.success) {
        setDados(result.data)
      }
    } catch (error) {
      console.error("Erro ao buscar dados:", error)
    } finally {
      setLoading(false)
    }
  }

  const handlePrint = () => {
    const content = printRef.current
    if (!content) return

    const printWindow = window.open("", "_blank")
    if (!printWindow) return

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>NFS-e ${dados?.nota?.numero_nfse || ""}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, Helvetica, sans-serif; font-size: 11px; color: #333; padding: 20px; }
          .nfse-container { max-width: 800px; margin: 0 auto; border: 2px solid #333; }
          .nfse-header { display: flex; align-items: center; border-bottom: 2px solid #333; padding: 12px 16px; gap: 16px; }
          .nfse-header img { max-height: 60px; max-width: 120px; object-fit: contain; }
          .nfse-header-info { flex: 1; }
          .nfse-header-info h1 { font-size: 16px; margin-bottom: 2px; }
          .nfse-header-info p { font-size: 10px; color: #555; }
          .nfse-title { background: #1a5c2e; color: white; text-align: center; padding: 6px; font-size: 14px; font-weight: bold; letter-spacing: 1px; }
          .nfse-numero { display: flex; justify-content: space-between; border-bottom: 1px solid #ccc; padding: 8px 16px; background: #f8f8f8; }
          .nfse-numero span { font-weight: bold; }
          .nfse-section { border-bottom: 1px solid #ccc; padding: 8px 16px; }
          .nfse-section-title { font-size: 10px; font-weight: bold; text-transform: uppercase; color: #1a5c2e; margin-bottom: 6px; border-bottom: 1px solid #e0e0e0; padding-bottom: 2px; }
          .nfse-grid { display: grid; gap: 4px 16px; }
          .nfse-grid-2 { grid-template-columns: 1fr 1fr; }
          .nfse-grid-3 { grid-template-columns: 1fr 1fr 1fr; }
          .nfse-grid-4 { grid-template-columns: 1fr 1fr 1fr 1fr; }
          .nfse-field label { font-size: 9px; color: #777; text-transform: uppercase; display: block; }
          .nfse-field span { font-size: 11px; font-weight: 500; }
          .nfse-discriminacao { white-space: pre-wrap; font-size: 11px; line-height: 1.5; padding: 6px 0; }
          .nfse-valores-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 4px; }
          .nfse-total { display: flex; justify-content: space-between; align-items: center; padding: 10px 16px; background: #f0f7f0; border-top: 2px solid #1a5c2e; }
          .nfse-total-label { font-size: 12px; font-weight: bold; color: #1a5c2e; }
          .nfse-total-value { font-size: 18px; font-weight: bold; color: #1a5c2e; }
          .nfse-footer { padding: 6px 16px; text-align: center; font-size: 9px; color: #999; border-top: 1px solid #e0e0e0; }
          .nfse-status-cancelada { background: #fef2f2; border: 1px solid #ef4444; color: #dc2626; text-align: center; padding: 8px; font-size: 14px; font-weight: bold; margin: 8px 16px; }
          @media print { body { padding: 0; } .nfse-container { border: 1px solid #333; } }
        </style>
      </head>
      <body>${content.innerHTML}</body>
      </html>
    `)
    printWindow.document.close()
    setTimeout(() => {
      printWindow.print()
    }, 300)
  }

  const nota = dados?.nota
  const prestador = dados?.prestador
  const logo = dados?.logo

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[900px] max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="p-4 pb-0">
          <DialogTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Printer className="h-5 w-5 text-emerald-600" />
              Imprimir NFS-e
            </span>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handlePrint}
                disabled={loading || !dados}
                className="bg-emerald-600 hover:bg-emerald-700 text-foreground"
              >
                <Printer className="h-4 w-4 mr-2" />
                Imprimir
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
          </div>
        ) : nota ? (
          <div className="p-4 pt-2">
            <div ref={printRef}>
              <div className="nfse-container" style={{ maxWidth: 800, margin: "0 auto", border: "2px solid #333", fontFamily: "Arial, Helvetica, sans-serif", fontSize: 11, color: "#333" }}>
                {/* Header */}
                <div style={{ display: "flex", alignItems: "center", borderBottom: "2px solid #333", padding: "12px 16px", gap: 16 }}>
                  {logo && (
                    <img
                      src={logo}
                      alt="Logo"
                      style={{ maxHeight: 60, maxWidth: 120, objectFit: "contain" }}
                      crossOrigin="anonymous"
                    />
                  )}
                  <div style={{ flex: 1 }}>
                    <h1 style={{ fontSize: 16, marginBottom: 2, fontWeight: "bold" }}>{prestador?.razao_social || "Prestador"}</h1>
                    <p style={{ fontSize: 10, color: "#555" }}>CNPJ: {formatCpfCnpj(prestador?.cnpj || "")}</p>
                    <p style={{ fontSize: 10, color: "#555" }}>IM: {prestador?.inscricao_municipal || "-"}</p>
                    {prestador?.endereco && (
                      <p style={{ fontSize: 10, color: "#555" }}>
                        {[prestador.endereco, prestador.numero_endereco, prestador.complemento, prestador.bairro, prestador.cidade, prestador.uf].filter(Boolean).join(", ")}
                        {prestador.cep ? ` - CEP: ${prestador.cep}` : ""}
                      </p>
                    )}
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <p style={{ fontSize: 9, color: "#777" }}>Prefeitura de Sao Paulo</p>
                    <p style={{ fontSize: 9, color: "#777" }}>Secretaria de Financas</p>
                  </div>
                </div>

                {/* Title */}
                <div style={{ background: "#1a5c2e", color: "white", textAlign: "center", padding: 6, fontSize: 14, fontWeight: "bold", letterSpacing: 1 }}>
                  NOTA FISCAL DE SERVICOS ELETRONICA - NFS-e
                </div>

                {/* Status cancelada */}
                {nota.status === "cancelada" && (
                  <div style={{ background: "#fef2f2", border: "1px solid #ef4444", color: "#dc2626", textAlign: "center", padding: 8, fontSize: 14, fontWeight: "bold", margin: "8px 16px" }}>
                    NOTA FISCAL CANCELADA
                    {nota.data_cancelamento && ` em ${formatDateBR(nota.data_cancelamento)}`}
                  </div>
                )}

                {/* Numero e Data */}
                <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #ccc", padding: "8px 16px", background: "#f8f8f8" }}>
                  <div>
                    <span style={{ fontSize: 9, color: "#777" }}>NUMERO DA NFS-e: </span>
                    <span style={{ fontWeight: "bold", fontSize: 14 }}>{nota.numero_nfse || "-"}</span>
                  </div>
                  <div>
                    <span style={{ fontSize: 9, color: "#777" }}>DATA DE EMISSAO: </span>
                    <span style={{ fontWeight: "bold" }}>{formatDateBR(nota.data_emissao || nota.created_at)}</span>
                  </div>
                  <div>
                    <span style={{ fontSize: 9, color: "#777" }}>COD. VERIFICACAO: </span>
                    <span style={{ fontWeight: "bold" }}>{nota.codigo_verificacao || "-"}</span>
                  </div>
                </div>

                {/* RPS */}
                <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #ccc", padding: "4px 16px", fontSize: 10 }}>
                  <span>RPS: {nota.serie_rps}.{String(nota.numero_rps).padStart(8, "0")}</span>
                  <span>Competencia: {formatDateBR(nota.data_emissao || nota.created_at)}</span>
                </div>

                {/* Tomador */}
                <div style={{ borderBottom: "1px solid #ccc", padding: "8px 16px" }}>
                  <div style={{ fontSize: 10, fontWeight: "bold", textTransform: "uppercase", color: "#1a5c2e", marginBottom: 6, borderBottom: "1px solid #e0e0e0", paddingBottom: 2 }}>
                    Tomador de Servicos
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 16px" }}>
                    <div>
                      <label style={{ fontSize: 9, color: "#777", display: "block" }}>NOME/RAZAO SOCIAL</label>
                      <span style={{ fontWeight: 500 }}>{nota.tomador_razao_social || "-"}</span>
                    </div>
                    <div>
                      <label style={{ fontSize: 9, color: "#777", display: "block" }}>CPF/CNPJ</label>
                      <span style={{ fontWeight: 500 }}>{formatCpfCnpj(nota.tomador_cpf_cnpj || "")}</span>
                    </div>
                    {nota.tomador_email && (
                      <div>
                        <label style={{ fontSize: 9, color: "#777", display: "block" }}>EMAIL</label>
                        <span style={{ fontWeight: 500 }}>{nota.tomador_email}</span>
                      </div>
                    )}
                    {nota.tomador_endereco && (
                      <div style={{ gridColumn: nota.tomador_email ? "auto" : "span 2" }}>
                        <label style={{ fontSize: 9, color: "#777", display: "block" }}>ENDERECO</label>
                        <span style={{ fontWeight: 500 }}>
                          {[nota.tomador_endereco, nota.tomador_numero, nota.tomador_bairro, nota.tomador_cidade, nota.tomador_uf].filter(Boolean).join(", ")}
                          {nota.tomador_cep ? ` - CEP: ${nota.tomador_cep}` : ""}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Servico */}
                <div style={{ borderBottom: "1px solid #ccc", padding: "8px 16px" }}>
                  <div style={{ fontSize: 10, fontWeight: "bold", textTransform: "uppercase", color: "#1a5c2e", marginBottom: 6, borderBottom: "1px solid #e0e0e0", paddingBottom: 2 }}>
                    Discriminacao dos Servicos
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "4px 16px", marginBottom: 6 }}>
                    <div>
                      <label style={{ fontSize: 9, color: "#777", display: "block" }}>CODIGO DO SERVICO</label>
                      <span style={{ fontWeight: 500 }}>{nota.codigo_servico || "-"}</span>
                    </div>
                    <div>
                      <label style={{ fontSize: 9, color: "#777", display: "block" }}>ALIQUOTA ISS</label>
                      <span style={{ fontWeight: 500 }}>{((nota.aliquota_iss || 0) * 100).toFixed(2)}%</span>
                    </div>
                    <div>
                      <label style={{ fontSize: 9, color: "#777", display: "block" }}>ISS RETIDO</label>
                      <span style={{ fontWeight: 500 }}>{nota.iss_retido ? "Sim" : "Nao"}</span>
                    </div>
                  </div>
                  <div style={{ whiteSpace: "pre-wrap", fontSize: 11, lineHeight: 1.5, padding: "6px 0" }}>
                    {nota.descricao_servico || "-"}
                  </div>
                </div>

                {/* Valores */}
                <div style={{ borderBottom: "1px solid #ccc", padding: "8px 16px" }}>
                  <div style={{ fontSize: 10, fontWeight: "bold", textTransform: "uppercase", color: "#1a5c2e", marginBottom: 6, borderBottom: "1px solid #e0e0e0", paddingBottom: 2 }}>
                    Valores
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 4 }}>
                    <div>
                      <label style={{ fontSize: 9, color: "#777", display: "block" }}>VALOR SERVICOS</label>
                      <span style={{ fontWeight: 500 }}>{formatCurrency(nota.valor_servicos)}</span>
                    </div>
                    <div>
                      <label style={{ fontSize: 9, color: "#777", display: "block" }}>DEDUCOES</label>
                      <span style={{ fontWeight: 500 }}>{formatCurrency(nota.valor_deducoes || 0)}</span>
                    </div>
                    <div>
                      <label style={{ fontSize: 9, color: "#777", display: "block" }}>BASE DE CALCULO</label>
                      <span style={{ fontWeight: 500 }}>{formatCurrency((nota.valor_servicos || 0) - (nota.valor_deducoes || 0))}</span>
                    </div>
                    <div>
                      <label style={{ fontSize: 9, color: "#777", display: "block" }}>VALOR ISS</label>
                      <span style={{ fontWeight: 500 }}>{formatCurrency(nota.valor_iss || 0)}</span>
                    </div>
                    {(nota.valor_pis > 0 || nota.valor_cofins > 0 || nota.valor_ir > 0 || nota.valor_inss > 0 || nota.valor_csll > 0) && (
                      <>
                        {nota.valor_pis > 0 && (
                          <div>
                            <label style={{ fontSize: 9, color: "#777", display: "block" }}>PIS</label>
                            <span style={{ fontWeight: 500 }}>{formatCurrency(nota.valor_pis)}</span>
                          </div>
                        )}
                        {nota.valor_cofins > 0 && (
                          <div>
                            <label style={{ fontSize: 9, color: "#777", display: "block" }}>COFINS</label>
                            <span style={{ fontWeight: 500 }}>{formatCurrency(nota.valor_cofins)}</span>
                          </div>
                        )}
                        {nota.valor_inss > 0 && (
                          <div>
                            <label style={{ fontSize: 9, color: "#777", display: "block" }}>INSS</label>
                            <span style={{ fontWeight: 500 }}>{formatCurrency(nota.valor_inss)}</span>
                          </div>
                        )}
                        {nota.valor_ir > 0 && (
                          <div>
                            <label style={{ fontSize: 9, color: "#777", display: "block" }}>IR</label>
                            <span style={{ fontWeight: 500 }}>{formatCurrency(nota.valor_ir)}</span>
                          </div>
                        )}
                        {nota.valor_csll > 0 && (
                          <div>
                            <label style={{ fontSize: 9, color: "#777", display: "block" }}>CSLL</label>
                            <span style={{ fontWeight: 500 }}>{formatCurrency(nota.valor_csll)}</span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Total */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 16px", background: "#f0f7f0", borderTop: "2px solid #1a5c2e" }}>
                  <span style={{ fontSize: 12, fontWeight: "bold", color: "#1a5c2e" }}>VALOR TOTAL DA NOTA</span>
                  <span style={{ fontSize: 18, fontWeight: "bold", color: "#1a5c2e" }}>{formatCurrency(nota.valor_total)}</span>
                </div>

                {/* Footer */}
                <div style={{ padding: "6px 16px", textAlign: "center", fontSize: 9, color: "#999", borderTop: "1px solid #e0e0e0" }}>
                  Documento gerado pelo sistema de gestao financeira | NFS-e emitida conforme legislacao municipal
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center text-gray-500">Nota fiscal nao encontrada</div>
        )}
      </DialogContent>
    </Dialog>
  )
}
