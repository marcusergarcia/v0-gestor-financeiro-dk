"use client"

import { useState, useEffect, useRef } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Loader2, Printer } from "lucide-react"
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

function formatDateTimeBR(dateStr: string | null): string {
  if (!dateStr) return "-"
  try {
    return new Date(dateStr).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
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

function formatCep(value: string): string {
  if (!value) return ""
  const clean = value.replace(/\D/g, "")
  if (clean.length === 8) {
    return clean.replace(/(\d{5})(\d{3})/, "$1-$2")
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
          ${getPrintStyles()}
          @media print {
            body { padding: 0; margin: 0; }
            @page { margin: 10mm; size: A4; }
          }
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
              <NfsePrefeituraSP nota={nota} prestador={prestador} logo={logo} />
            </div>
          </div>
        ) : (
          <div className="py-8 text-center text-gray-500">Nota fiscal nao encontrada</div>
        )}
      </DialogContent>
    </Dialog>
  )
}

// ============================================================
// Componente que renderiza o layout oficial da Prefeitura de SP
// ============================================================
function NfsePrefeituraSP({ nota, prestador, logo }: { nota: any; prestador: any; logo: string | null }) {
  const isCancelada = nota.status === "cancelada"

  const enderecoTomador = [
    nota.tomador_endereco,
    nota.tomador_numero,
    nota.tomador_complemento,
  ].filter(Boolean).join(", ")

  const enderecoPrestador = [
    prestador?.endereco,
    prestador?.numero_endereco,
    prestador?.complemento,
  ].filter(Boolean).join(", ")

  const valorServicos = nota.valor_servicos || 0
  const valorDeducoes = nota.valor_deducoes || 0
  const baseCalculo = valorServicos - valorDeducoes
  const aliquotaIss = (nota.aliquota_iss || 0) * 100
  const valorIss = nota.valor_iss || 0
  const valorCredito = 0 // Credito nao disponivel no sistema

  return (
    <div style={{
      fontFamily: "Arial, Helvetica, sans-serif",
      fontSize: "10px",
      color: "#000",
      maxWidth: "800px",
      margin: "0 auto",
      lineHeight: 1.3,
    }}>
      {/* ===== CABECALHO PREFEITURA ===== */}
      <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #000" }}>
        <tbody>
          <tr>
            <td style={{ width: "100px", padding: "8px 12px", verticalAlign: "middle", borderRight: "1px solid #000" }}>
              {/* Brasao de Sao Paulo - SVG simplificado */}
              <svg viewBox="0 0 80 90" width="70" height="80" style={{ display: "block", margin: "0 auto" }}>
                <rect x="5" y="5" width="70" height="80" rx="3" fill="none" stroke="#1a3a6e" strokeWidth="2"/>
                <text x="40" y="30" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#1a3a6e" fontFamily="Arial">PREFEITURA</text>
                <text x="40" y="40" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#1a3a6e" fontFamily="Arial">DO MUNICIPIO</text>
                <text x="40" y="50" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#1a3a6e" fontFamily="Arial">DE SAO PAULO</text>
                <text x="40" y="65" textAnchor="middle" fontSize="7" fill="#1a3a6e" fontFamily="Arial">SECRETARIA</text>
                <text x="40" y="74" textAnchor="middle" fontSize="7" fill="#1a3a6e" fontFamily="Arial">DE FINANCAS</text>
              </svg>
            </td>
            <td style={{ padding: "8px 16px", verticalAlign: "middle" }}>
              <div style={{ fontSize: "11px", fontWeight: "bold", color: "#1a3a6e", marginBottom: 2 }}>
                PREFEITURA DO MUNICIPIO DE SAO PAULO
              </div>
              <div style={{ fontSize: "10px", color: "#1a3a6e", marginBottom: 1 }}>
                SECRETARIA MUNICIPAL DE FINANCAS
              </div>
              <div style={{ fontSize: "16px", fontWeight: "bold", color: "#1a3a6e", marginTop: 6, letterSpacing: "0.5px" }}>
                NFS-e - NOTA FISCAL DE SERVICOS ELETRONICA
              </div>
            </td>
            <td style={{ width: "200px", padding: "8px 12px", verticalAlign: "middle", borderLeft: "1px solid #000", textAlign: "right" }}>
              {isCancelada && (
                <div style={{
                  background: "#dc2626",
                  color: "#fff",
                  fontWeight: "bold",
                  fontSize: "11px",
                  padding: "3px 10px",
                  marginBottom: 6,
                  textAlign: "center",
                }}>
                  CANCELADA
                </div>
              )}
              <div style={{ fontSize: "9px", color: "#555", marginBottom: 2 }}>Numero da Nota</div>
              <div style={{ fontSize: "20px", fontWeight: "bold", color: "#1a3a6e" }}>
                {nota.numero_nfse || "-"}
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      {/* ===== DADOS DA NOTA (Data, Codigo Verificacao, etc.) ===== */}
      <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #000", borderTop: "none" }}>
        <tbody>
          <tr>
            <td style={{ ...cellStyle, borderRight: "1px solid #999", width: "25%" }}>
              <FieldLabel>Data e Hora da Emissao</FieldLabel>
              <FieldValue>{formatDateTimeBR(nota.data_emissao || nota.created_at)}</FieldValue>
            </td>
            <td style={{ ...cellStyle, borderRight: "1px solid #999", width: "25%" }}>
              <FieldLabel>Codigo de Verificacao</FieldLabel>
              <FieldValue>{nota.codigo_verificacao || "-"}</FieldValue>
            </td>
            <td style={{ ...cellStyle, borderRight: "1px solid #999", width: "25%" }}>
              <FieldLabel>Numero do RPS</FieldLabel>
              <FieldValue>{nota.numero_rps ? `${nota.serie_rps || ""} - ${String(nota.numero_rps).padStart(8, "0")}` : "-"}</FieldValue>
            </td>
            <td style={{ ...cellStyle, width: "25%" }}>
              <FieldLabel>Data da Competencia</FieldLabel>
              <FieldValue>{formatDateBR(nota.data_emissao || nota.created_at)}</FieldValue>
            </td>
          </tr>
        </tbody>
      </table>

      {/* ===== PRESTADOR DE SERVICOS ===== */}
      <SectionHeader>PRESTADOR DE SERVICOS</SectionHeader>
      <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #000", borderTop: "none" }}>
        <tbody>
          <tr>
            <td style={{ ...cellStyle, borderRight: "1px solid #999", width: "50%" }}>
              <FieldLabel>Nome/Razao Social</FieldLabel>
              <FieldValue bold>{prestador?.razao_social || "-"}</FieldValue>
            </td>
            <td style={{ ...cellStyle, borderRight: "1px solid #999", width: "25%" }}>
              <FieldLabel>CPF/CNPJ</FieldLabel>
              <FieldValue>{formatCpfCnpj(prestador?.cnpj || "")}</FieldValue>
            </td>
            <td style={{ ...cellStyle, width: "25%" }}>
              <FieldLabel>Inscricao Municipal</FieldLabel>
              <FieldValue>{prestador?.inscricao_municipal || "-"}</FieldValue>
            </td>
          </tr>
          <tr>
            <td style={{ ...cellStyle, borderRight: "1px solid #999", borderTop: "1px solid #999" }}>
              <FieldLabel>Endereco</FieldLabel>
              <FieldValue>{enderecoPrestador || "-"}</FieldValue>
            </td>
            <td style={{ ...cellStyle, borderRight: "1px solid #999", borderTop: "1px solid #999" }}>
              <FieldLabel>Municipio</FieldLabel>
              <FieldValue>{prestador?.cidade || "SAO PAULO"} - {prestador?.uf || "SP"}</FieldValue>
            </td>
            <td style={{ ...cellStyle, borderTop: "1px solid #999" }}>
              <FieldLabel>CEP</FieldLabel>
              <FieldValue>{formatCep(prestador?.cep || "")}</FieldValue>
            </td>
          </tr>
          {(prestador?.email || prestador?.telefone) && (
            <tr>
              <td style={{ ...cellStyle, borderRight: "1px solid #999", borderTop: "1px solid #999" }}>
                <FieldLabel>E-mail</FieldLabel>
                <FieldValue>{prestador?.email || "-"}</FieldValue>
              </td>
              <td colSpan={2} style={{ ...cellStyle, borderTop: "1px solid #999" }}>
                <FieldLabel>Telefone</FieldLabel>
                <FieldValue>{prestador?.telefone || "-"}</FieldValue>
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* ===== TOMADOR DE SERVICOS ===== */}
      <SectionHeader>TOMADOR DE SERVICOS</SectionHeader>
      <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #000", borderTop: "none" }}>
        <tbody>
          <tr>
            <td style={{ ...cellStyle, borderRight: "1px solid #999", width: "50%" }}>
              <FieldLabel>Nome/Razao Social</FieldLabel>
              <FieldValue bold>{nota.tomador_razao_social || "-"}</FieldValue>
            </td>
            <td style={{ ...cellStyle, borderRight: "1px solid #999", width: "25%" }}>
              <FieldLabel>CPF/CNPJ</FieldLabel>
              <FieldValue>{formatCpfCnpj(nota.tomador_cpf_cnpj || "")}</FieldValue>
            </td>
            <td style={{ ...cellStyle, width: "25%" }}>
              <FieldLabel>Inscricao Municipal</FieldLabel>
              <FieldValue>{nota.tomador_inscricao_municipal || "-"}</FieldValue>
            </td>
          </tr>
          <tr>
            <td style={{ ...cellStyle, borderRight: "1px solid #999", borderTop: "1px solid #999" }}>
              <FieldLabel>Endereco</FieldLabel>
              <FieldValue>{enderecoTomador || "-"}</FieldValue>
            </td>
            <td style={{ ...cellStyle, borderRight: "1px solid #999", borderTop: "1px solid #999" }}>
              <FieldLabel>Municipio</FieldLabel>
              <FieldValue>{nota.tomador_cidade || "-"}{nota.tomador_uf ? ` - ${nota.tomador_uf}` : ""}</FieldValue>
            </td>
            <td style={{ ...cellStyle, borderTop: "1px solid #999" }}>
              <FieldLabel>CEP</FieldLabel>
              <FieldValue>{formatCep(nota.tomador_cep || "")}</FieldValue>
            </td>
          </tr>
          <tr>
            <td style={{ ...cellStyle, borderRight: "1px solid #999", borderTop: "1px solid #999" }}>
              <FieldLabel>E-mail</FieldLabel>
              <FieldValue>{nota.tomador_email || "-"}</FieldValue>
            </td>
            <td colSpan={2} style={{ ...cellStyle, borderTop: "1px solid #999" }}>
              <FieldLabel>Bairro</FieldLabel>
              <FieldValue>{nota.tomador_bairro || "-"}</FieldValue>
            </td>
          </tr>
        </tbody>
      </table>

      {/* ===== DISCRIMINACAO DOS SERVICOS ===== */}
      <SectionHeader>DISCRIMINACAO DOS SERVICOS</SectionHeader>
      <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #000", borderTop: "none" }}>
        <tbody>
          <tr>
            <td style={{ padding: "10px 12px", minHeight: "80px", whiteSpace: "pre-wrap", lineHeight: 1.5, fontSize: "10px", verticalAlign: "top" }}>
              {nota.descricao_servico || "-"}
            </td>
          </tr>
        </tbody>
      </table>

      {/* ===== CODIGO DO SERVICO ===== */}
      <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #000", borderTop: "none" }}>
        <tbody>
          <tr>
            <td style={{ ...cellStyle, borderRight: "1px solid #999", width: "50%" }}>
              <FieldLabel>Codigo do Servico</FieldLabel>
              <FieldValue>{nota.codigo_servico || "-"}</FieldValue>
            </td>
            <td style={{ ...cellStyle, width: "50%" }}>
              <FieldLabel>Local da Prestacao do Servico</FieldLabel>
              <FieldValue>{prestador?.cidade || "SAO PAULO"} - {prestador?.uf || "SP"}</FieldValue>
            </td>
          </tr>
        </tbody>
      </table>

      {/* ===== VALORES / TRIBUTOS ===== */}
      <SectionHeader>VALORES E TRIBUTOS REFERENTES A NOTA</SectionHeader>
      <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #000", borderTop: "none" }}>
        <tbody>
          {/* Linha 1 - Valor Servicos, Deducoes, Base de Calculo */}
          <tr>
            <td style={{ ...cellStyle, borderRight: "1px solid #999", width: "33.33%", textAlign: "right" }}>
              <FieldLabel>Valor Total dos Servicos</FieldLabel>
              <FieldValue bold>{formatCurrency(valorServicos)}</FieldValue>
            </td>
            <td style={{ ...cellStyle, borderRight: "1px solid #999", width: "33.33%", textAlign: "right" }}>
              <FieldLabel>Deducoes</FieldLabel>
              <FieldValue>{formatCurrency(valorDeducoes)}</FieldValue>
            </td>
            <td style={{ ...cellStyle, width: "33.33%", textAlign: "right" }}>
              <FieldLabel>Base de Calculo</FieldLabel>
              <FieldValue bold>{formatCurrency(baseCalculo)}</FieldValue>
            </td>
          </tr>
          {/* Linha 2 - Aliquota, ISS, Credito */}
          <tr>
            <td style={{ ...cellStyle, borderRight: "1px solid #999", borderTop: "1px solid #999", textAlign: "right" }}>
              <FieldLabel>Aliquota de ISS (%)</FieldLabel>
              <FieldValue>{aliquotaIss.toFixed(2)}%</FieldValue>
            </td>
            <td style={{ ...cellStyle, borderRight: "1px solid #999", borderTop: "1px solid #999", textAlign: "right" }}>
              <FieldLabel>Valor do ISS</FieldLabel>
              <FieldValue bold>{formatCurrency(valorIss)}</FieldValue>
            </td>
            <td style={{ ...cellStyle, borderTop: "1px solid #999", textAlign: "right" }}>
              <FieldLabel>ISS Retido</FieldLabel>
              <FieldValue>{nota.iss_retido ? "Sim" : "Nao"}</FieldValue>
            </td>
          </tr>
          {/* Linha 3 - Outras retencoes */}
          <tr>
            <td colSpan={3} style={{ ...cellStyle, borderTop: "1px solid #999" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: "8px", flexWrap: "wrap" }}>
                <div style={{ flex: 1, textAlign: "right" }}>
                  <FieldLabel>PIS</FieldLabel>
                  <FieldValue>{formatCurrency(nota.valor_pis || 0)}</FieldValue>
                </div>
                <div style={{ flex: 1, textAlign: "right" }}>
                  <FieldLabel>COFINS</FieldLabel>
                  <FieldValue>{formatCurrency(nota.valor_cofins || 0)}</FieldValue>
                </div>
                <div style={{ flex: 1, textAlign: "right" }}>
                  <FieldLabel>IR</FieldLabel>
                  <FieldValue>{formatCurrency(nota.valor_ir || 0)}</FieldValue>
                </div>
                <div style={{ flex: 1, textAlign: "right" }}>
                  <FieldLabel>INSS</FieldLabel>
                  <FieldValue>{formatCurrency(nota.valor_inss || 0)}</FieldValue>
                </div>
                <div style={{ flex: 1, textAlign: "right" }}>
                  <FieldLabel>CSLL</FieldLabel>
                  <FieldValue>{formatCurrency(nota.valor_csll || 0)}</FieldValue>
                </div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      {/* ===== VALOR TOTAL / CREDITO ===== */}
      <table style={{ width: "100%", borderCollapse: "collapse", border: "2px solid #1a3a6e", borderTop: "none" }}>
        <tbody>
          <tr>
            <td style={{
              padding: "10px 16px",
              background: "#e8edf5",
              width: "50%",
              borderRight: "2px solid #1a3a6e",
            }}>
              <div style={{ fontSize: "9px", color: "#555", marginBottom: 2 }}>VALOR TOTAL DA NOTA (R$)</div>
              <div style={{ fontSize: "22px", fontWeight: "bold", color: "#1a3a6e" }}>
                {formatCurrency(nota.valor_total || valorServicos)}
              </div>
            </td>
            <td style={{
              padding: "10px 16px",
              background: "#e8edf5",
              width: "50%",
            }}>
              <div style={{ fontSize: "9px", color: "#555", marginBottom: 2 }}>VALOR DO CREDITO (R$)</div>
              <div style={{ fontSize: "14px", fontWeight: "bold", color: "#1a3a6e" }}>
                {formatCurrency(valorCredito)}
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      {/* ===== CANCELAMENTO ===== */}
      {isCancelada && (
        <table style={{ width: "100%", borderCollapse: "collapse", border: "2px solid #dc2626", marginTop: 4 }}>
          <tbody>
            <tr>
              <td style={{ padding: "8px 16px", background: "#fef2f2", textAlign: "center" }}>
                <div style={{ fontSize: "14px", fontWeight: "bold", color: "#dc2626", marginBottom: 2 }}>
                  NOTA FISCAL CANCELADA
                </div>
                {nota.data_cancelamento && (
                  <div style={{ fontSize: "10px", color: "#991b1b" }}>
                    Data do cancelamento: {formatDateTimeBR(nota.data_cancelamento)}
                  </div>
                )}
                {nota.motivo_cancelamento && (
                  <div style={{ fontSize: "10px", color: "#991b1b", marginTop: 2 }}>
                    Motivo: {nota.motivo_cancelamento}
                  </div>
                )}
              </td>
            </tr>
          </tbody>
        </table>
      )}

      {/* ===== RODAPE ===== */}
      <div style={{
        marginTop: 8,
        padding: "8px 12px",
        fontSize: "8px",
        color: "#666",
        textAlign: "center",
        borderTop: "1px solid #ccc",
        lineHeight: 1.5,
      }}>
        <div>Documento emitido por ME ou EPP optante pelo Simples Nacional.</div>
        <div>Nao gera direito a credito fiscal de IPI.</div>
        <div style={{ marginTop: 4, fontSize: "8px", color: "#999" }}>
          NFS-e gerada em conformidade com a legislacao municipal de Sao Paulo
        </div>
        <div style={{ marginTop: 4, fontSize: "7px", color: "#bbb" }}>
          Consulte a autenticidade desta NFS-e em: nfe.prefeitura.sp.gov.br - Inscricao: {prestador?.inscricao_municipal || "-"} | Numero: {nota.numero_nfse || "-"} | Cod. Verificacao: {nota.codigo_verificacao || "-"}
        </div>
      </div>
    </div>
  )
}

// ============================================================
// Sub-componentes auxiliares para o layout oficial
// ============================================================

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      background: "#1a3a6e",
      color: "#fff",
      fontSize: "9px",
      fontWeight: "bold",
      padding: "4px 12px",
      letterSpacing: "0.5px",
      textTransform: "uppercase",
      border: "1px solid #1a3a6e",
      borderBottom: "none",
    }}>
      {children}
    </div>
  )
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: "8px", color: "#666", marginBottom: 1, textTransform: "uppercase" }}>
      {children}
    </div>
  )
}

function FieldValue({ children, bold }: { children: React.ReactNode; bold?: boolean }) {
  return (
    <div style={{ fontSize: "10px", fontWeight: bold ? "bold" : "normal", color: "#000" }}>
      {children}
    </div>
  )
}

// Estilos compartilhados
const cellStyle: React.CSSProperties = {
  padding: "5px 12px",
  verticalAlign: "top",
}

// ============================================================
// CSS para impressao
// ============================================================
function getPrintStyles(): string {
  return `
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 10px;
      color: #000;
      padding: 10px;
      line-height: 1.3;
    }
    table { border-collapse: collapse; }
  `
}
