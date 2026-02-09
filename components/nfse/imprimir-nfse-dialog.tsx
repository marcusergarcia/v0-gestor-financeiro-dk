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

    // Get the full URL for images so they work in the new window
    const baseUrl = window.location.origin

    // Clone content and fix relative image paths
    let htmlContent = content.innerHTML
    htmlContent = htmlContent.replace(
      /src="\/images\//g,
      `src="${baseUrl}/images/`
    )

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
      <body>${htmlContent}</body>
      </html>
    `)
    printWindow.document.close()
    // Wait for images to fully load before printing
    const images = printWindow.document.querySelectorAll("img")
    let loadedCount = 0
    const totalImages = images.length

    const tryPrint = () => {
      loadedCount++
      if (loadedCount >= totalImages) {
        setTimeout(() => printWindow.print(), 200)
      }
    }

    if (totalImages === 0) {
      setTimeout(() => printWindow.print(), 300)
    } else {
      images.forEach((img) => {
        if (img.complete) {
          tryPrint()
        } else {
          img.onload = tryPrint
          img.onerror = tryPrint
        }
      })
      // Fallback: print after 2s even if images fail
      setTimeout(() => printWindow.print(), 2000)
    }
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
      <table style={{ width: "100%", borderCollapse: "collapse", border: "2px solid #1a3a6e" }}>
        <tbody>
          <tr>
            <td style={{ width: "80px", padding: "8px 10px", verticalAlign: "middle", borderRight: "1px solid #1a3a6e", textAlign: "center" }}>
              {/* Brasao oficial da Prefeitura de Sao Paulo */}
              <img
                src="/images/brasao-sp.png"
                alt="Brasao da Prefeitura de Sao Paulo"
                style={{ display: "block", margin: "0 auto", width: "60px", height: "auto" }}
                crossOrigin="anonymous"
              />
            </td>
            <td style={{ padding: "8px 16px", verticalAlign: "middle" }}>
              <div style={{ fontSize: "11px", fontWeight: "bold", color: "#1a3a6e", marginBottom: 1 }}>
                PREFEITURA DO MUNICIPIO DE SAO PAULO
              </div>
              <div style={{ fontSize: "10px", color: "#1a3a6e", marginBottom: 4 }}>
                SECRETARIA MUNICIPAL DA FAZENDA
              </div>
              <div style={{ fontSize: "14px", fontWeight: "bold", color: "#1a3a6e", letterSpacing: "0.3px" }}>
                NOTA FISCAL ELETRONICA DE SERVICOS - NFS-e
              </div>
              {nota.numero_rps && (
                <div style={{ fontSize: "9px", color: "#444", marginTop: 4 }}>
                  RPS N.{" "}{nota.numero_rps}{nota.serie_rps ? ` Serie ${nota.serie_rps}` : ""}, emitido em {formatDateBR(nota.data_emissao || nota.created_at)}
                </div>
              )}
            </td>
            <td style={{ width: "200px", padding: "8px 12px", verticalAlign: "top", borderLeft: "1px solid #1a3a6e" }}>
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
              <div style={{ marginBottom: 6 }}>
                <div style={{ fontSize: "8px", color: "#555", textTransform: "uppercase" }}>Numero da Nota</div>
                <div style={{ fontSize: "18px", fontWeight: "bold", color: "#1a3a6e" }}>
                  {nota.numero_nfse ? String(nota.numero_nfse).padStart(8, "0") : "-"}
                </div>
              </div>
              <div style={{ marginBottom: 4 }}>
                <div style={{ fontSize: "8px", color: "#555", textTransform: "uppercase" }}>Data e Hora de Emissao</div>
                <div style={{ fontSize: "10px", fontWeight: "bold", color: "#000" }}>
                  {formatDateTimeBR(nota.data_emissao || nota.created_at)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: "8px", color: "#555", textTransform: "uppercase" }}>Codigo de Verificacao</div>
                <div style={{ fontSize: "10px", fontWeight: "bold", color: "#000" }}>
                  {nota.codigo_verificacao || "-"}
                </div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      {/* Dados ja exibidos no cabecalho - sem duplicacao */}

      {/* ===== PRESTADOR DE SERVICOS ===== */}
      <SectionHeader>PRESTADOR DE SERVICOS</SectionHeader>
      <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #000", borderTop: "none" }}>
        <tbody>
          <tr>
            {/* Logo da empresa ao lado esquerdo do prestador (vem do sistema - Configuracoes > Logos) */}
            {logo && (
              <td rowSpan={3} style={{ width: "70px", padding: "6px 8px", verticalAlign: "middle", borderRight: "1px solid #999", textAlign: "center" }}>
                <img
                  src={logo}
                  alt="Logo da empresa"
                  style={{ display: "block", margin: "0 auto", maxWidth: "55px", maxHeight: "55px", objectFit: "contain" }}
                  crossOrigin="anonymous"
                />
              </td>
            )}
            <td style={{ ...cellStyle, borderRight: "1px solid #999", width: "auto" }}>
              <FieldLabel>Nome/Razao Social</FieldLabel>
              <FieldValue bold>{prestador?.razao_social || "-"}</FieldValue>
            </td>
            <td style={{ ...cellStyle, borderRight: "1px solid #999", width: "22%" }}>
              <FieldLabel>CPF/CNPJ</FieldLabel>
              <FieldValue>{formatCpfCnpj(prestador?.cnpj || "")}</FieldValue>
            </td>
            <td style={{ ...cellStyle, width: "22%" }}>
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
              {nota.observacoes_tributos && (
                <div style={{ marginTop: 8, fontSize: "9px", color: "#444" }}>
                  {nota.observacoes_tributos}
                </div>
              )}
            </td>
          </tr>
          {/* Retencoes federais na linha de discriminacao, como no modelo oficial */}
          <tr>
            <td style={{ padding: "4px 12px", borderTop: "1px solid #999" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", flexWrap: "wrap", fontSize: "9px" }}>
                <span><strong>INSS (R$)</strong> {formatCurrency(nota.valor_inss || 0)}</span>
                <span><strong>IRRF (R$)</strong> {formatCurrency(nota.valor_ir || 0)}</span>
                <span><strong>CSLL (R$)</strong> {formatCurrency(nota.valor_csll || 0)}</span>
                <span><strong>COFINS (R$)</strong> {formatCurrency(nota.valor_cofins || 0)}</span>
                <span><strong>PIS/PASEP (R$)</strong> {formatCurrency(nota.valor_pis || 0)}</span>
              </div>
            </td>
          </tr>
          {/* Valor total em destaque */}
          <tr>
            <td style={{
              padding: "8px 12px",
              borderTop: "2px solid #1a3a6e",
              background: "#e8edf5",
              textAlign: "right",
            }}>
              <span style={{ fontSize: "14px", fontWeight: "bold", color: "#1a3a6e" }}>
                VALOR TOTAL DO SERVICO = {formatCurrency(nota.valor_total || valorServicos)}
              </span>
            </td>
          </tr>
        </tbody>
      </table>

      {/* ===== CODIGO DO SERVICO + TRIBUTOS (layout oficial) ===== */}
      <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #000", borderTop: "none" }}>
        <tbody>
          {/* Codigo do servico - linha inteira */}
          <tr>
            <td colSpan={6} style={{ ...cellStyle, borderBottom: "1px solid #999" }}>
              <FieldLabel>Codigo do Servico</FieldLabel>
              <FieldValue>{nota.codigo_servico || "-"}</FieldValue>
            </td>
          </tr>
          {/* Linha de tributos: Deducoes, Base Calculo, Municipio, Aliquota, ISS, Credito */}
          <tr>
            <td style={{ ...cellStyle, borderRight: "1px solid #999", textAlign: "right" }}>
              <FieldLabel>Valor Total das Deducoes (R$)</FieldLabel>
              <FieldValue>{formatCurrency(valorDeducoes)}</FieldValue>
            </td>
            <td style={{ ...cellStyle, borderRight: "1px solid #999", textAlign: "right" }}>
              <FieldLabel>Base de Calculo (R$)</FieldLabel>
              <FieldValue bold>{formatCurrency(baseCalculo)}</FieldValue>
            </td>
            <td style={{ ...cellStyle, borderRight: "1px solid #999" }}>
              <FieldLabel>Municipio da Prestacao</FieldLabel>
              <FieldValue>{prestador?.cidade || "Sao Paulo"}</FieldValue>
            </td>
            <td style={{ ...cellStyle, borderRight: "1px solid #999", textAlign: "center" }}>
              <FieldLabel>Aliquota (%)</FieldLabel>
              <FieldValue>{aliquotaIss.toFixed(2)}</FieldValue>
            </td>
            <td style={{ ...cellStyle, borderRight: "1px solid #999", textAlign: "right" }}>
              <FieldLabel>Valor do ISS (R$)</FieldLabel>
              <FieldValue bold>{formatCurrency(valorIss)}</FieldValue>
            </td>
            <td style={{ ...cellStyle, textAlign: "right" }}>
              <FieldLabel>Credito (R$)</FieldLabel>
              <FieldValue>{formatCurrency(valorCredito)}</FieldValue>
            </td>
          </tr>
          {/* Numero inscricao da obra + ISS retido */}
          <tr>
            <td colSpan={3} style={{ ...cellStyle, borderTop: "1px solid #999", borderRight: "1px solid #999" }}>
              <FieldLabel>Numero Inscricao da Obra</FieldLabel>
              <FieldValue>{nota.numero_inscricao_obra || "-"}</FieldValue>
            </td>
            <td colSpan={3} style={{ ...cellStyle, borderTop: "1px solid #999" }}>
              <FieldLabel>Valor Aproximado dos Tributos / Fonte</FieldLabel>
              <FieldValue>{nota.iss_retido ? "ISS Retido na Fonte" : "-"}</FieldValue>
            </td>
          </tr>
        </tbody>
      </table>

      {/* ===== OUTRAS INFORMACOES ===== */}
      <SectionHeader>OUTRAS INFORMACOES</SectionHeader>
      <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #000", borderTop: "none" }}>
        <tbody>
          <tr>
            <td style={{ padding: "8px 12px", fontSize: "9px", lineHeight: 1.5, whiteSpace: "pre-wrap", verticalAlign: "top", minHeight: "40px" }}>
              {nota.informacoes_complementares || nota.observacoes || (
                <>
                  (1) Esta NFS-e foi emitida com respaldo na Lei n. 14.097/2005;{" "}
                  (2) Documento emitido por ME ou EPP optante pelo Simples Nacional;{" "}
                  {nota.numero_rps && `(3) Esta NFS-e substitui o RPS N. ${nota.numero_rps}${nota.serie_rps ? ` Serie ${nota.serie_rps}` : ""}, emitido em ${formatDateBR(nota.data_emissao || nota.created_at)};`}
                </>
              )}
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
        marginTop: 10,
        padding: "6px 12px",
        textAlign: "center",
        fontSize: "8px",
        color: "#555",
        lineHeight: 1.5,
        borderTop: "1px solid #1a3a6e",
      }}>
        <div>Consulte a autenticidade desta NFS-e em: <strong>nfe.prefeitura.sp.gov.br</strong></div>
        <div style={{ marginTop: 2 }}>
          Inscricao Municipal: {prestador?.inscricao_municipal || "-"} | Numero da Nota: {nota.numero_nfse ? String(nota.numero_nfse).padStart(8, "0") : "-"} | Codigo de Verificacao: {nota.codigo_verificacao || "-"}
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
