"use client"

import { useState, useEffect, useRef } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Loader2, Printer, Package } from "lucide-react"
import { formatCurrency } from "@/lib/utils"

interface DanfeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  nfeId: number | null
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

function formatTimeBR(dateStr: string | null): string {
  if (!dateStr) return "-"
  try {
    return new Date(dateStr).toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
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

function formatCep(value: string): string {
  if (!value) return ""
  const clean = value.replace(/\D/g, "")
  if (clean.length === 8) {
    return clean.replace(/(\d{5})(\d{3})/, "$1-$2")
  }
  return value
}

function formatChaveAcesso(chave: string): string {
  if (!chave) return "-"
  return chave.replace(/(\d{4})/g, "$1 ").trim()
}

export function DanfeDialog({ open, onOpenChange, nfeId }: DanfeDialogProps) {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<any>(null)
  const printRef = useRef<HTMLDivElement>(null)

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
      }
    } catch (error) {
      console.error("Erro ao carregar DANFE:", error)
    } finally {
      setLoading(false)
    }
  }

  const handlePrint = () => {
    const content = printRef.current
    if (!content) return

    const printWindow = window.open("", "_blank")
    if (!printWindow) return

    const baseUrl = window.location.origin
    let htmlContent = content.innerHTML
    htmlContent = htmlContent.replace(
      /src="\/images\//g,
      `src="${baseUrl}/images/`
    )

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>DANFE - NF-e ${data?.nfe?.numero_nfe || ""}</title>
        <style>
          ${getPrintStyles()}
          img { max-width: 100%; }
          @media print {
            body { padding: 0; margin: 0; }
            @page { margin: 8mm; size: A4; }
            * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; }
          }
        </style>
      </head>
      <body>${htmlContent}</body>
      </html>
    `)
    printWindow.document.close()
    const images = printWindow.document.querySelectorAll("img")
    let loadedCount = 0
    const totalImages = images.length

    const tryPrint = () => {
      loadedCount++
      if (loadedCount >= totalImages) {
        setTimeout(() => printWindow.print(), 300)
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
      setTimeout(() => printWindow.print(), 3000)
    }
  }

  const nfe = data?.nfe
  const itens = data?.itens || []
  const emitente = data?.emitente
  const logo = data?.logo

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl w-[80vw] max-h-[80vh] overflow-y-auto p-0">
        <DialogHeader className="p-4 pb-0 pr-14">
          <DialogTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Printer className="h-5 w-5 text-blue-600" />
              Imprimir DANFE
            </span>
            <Button
              size="sm"
              onClick={handlePrint}
              disabled={loading || !data}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Printer className="h-4 w-4 mr-2" />
              Imprimir
            </Button>
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : nfe ? (
          <div className="p-4 pt-2">
            <div ref={printRef}>
              <DanfeLayout nfe={nfe} itens={itens} emitente={emitente} logo={logo} />
            </div>
          </div>
        ) : (
          <div className="py-8 text-center text-gray-500">NF-e nao encontrada</div>
        )}
      </DialogContent>
    </Dialog>
  )
}

// ============================================================
// Componente que renderiza o layout oficial do DANFE
// Modelo baseado no DANFE padrao SEFAZ (conforme anexo do usuario)
// ============================================================
function DanfeLayout({ nfe, itens, emitente, logo }: { nfe: any; itens: any[]; emitente: any; logo: string | null }) {
  const isCancelada = nfe.status === "cancelada"
  const numeroNfe = String(nfe.numero_nfe || "").padStart(9, "0")
  const serie = nfe.serie || 1

  const enderecoEmitente = [emitente?.endereco, emitente?.numero_endereco].filter(Boolean).join(", ")
  const bairroEmitente = emitente?.bairro || ""
  const cidadeEmitente = emitente?.cidade || ""
  const ufEmitente = emitente?.uf || "SP"
  const cepEmitente = formatCep(emitente?.cep || "")

  const enderecoDestinatario = [nfe.dest_endereco, nfe.dest_numero].filter(Boolean).join(", ")

  const valorProdutos = Number(nfe.valor_produtos) || Number(nfe.valor_total) || 0
  const valorFrete = Number(nfe.valor_frete) || 0
  const valorSeguro = Number(nfe.valor_seguro) || 0
  const valorDesconto = Number(nfe.valor_desconto) || 0
  const valorOutras = Number(nfe.valor_outras) || 0
  const valorIpi = Number(nfe.valor_ipi) || 0
  const valorIcms = Number(nfe.valor_icms) || 0
  const valorIcmsSt = Number(nfe.valor_icms_st) || 0
  const baseIcms = Number(nfe.base_icms) || 0
  const baseIcmsSt = Number(nfe.base_icms_st) || 0
  const valorTotal = Number(nfe.valor_total) || valorProdutos

  return (
    <div style={{
      fontFamily: "Arial, Helvetica, sans-serif",
      fontSize: "9px",
      color: "#000",
      maxWidth: "100%",
      margin: "0 auto",
      lineHeight: 1.3,
    }}>
      {/* ===== CANHOTO DE RECEBIMENTO ===== */}
      <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #000" }}>
        <tbody>
          <tr>
            <td style={{ padding: "4px 8px", borderRight: "1px solid #000", width: "75%", verticalAlign: "top" }}>
              <FieldLabel>RECEBEMOS DE {emitente?.razao_social || emitente?.nome_fantasia || ""} OS PRODUTOS CONSTANTES NA NOTA FISCAL INDICADA AO LADO.</FieldLabel>
              <div style={{ display: "flex", gap: "20px", marginTop: "8px" }}>
                <div style={{ flex: 1 }}>
                  <FieldLabel>DATA DE RECEBIMENTO</FieldLabel>
                  <div style={{ borderBottom: "1px solid #999", height: "14px", marginTop: "2px" }} />
                </div>
                <div style={{ flex: 2 }}>
                  <FieldLabel>IDENTIFICACAO E ASSINATURA DO RECEBEDOR</FieldLabel>
                  <div style={{ borderBottom: "1px solid #999", height: "14px", marginTop: "2px" }} />
                </div>
              </div>
            </td>
            <td style={{ padding: "6px 8px", textAlign: "center", verticalAlign: "middle" }}>
              <FieldLabel>NF-e</FieldLabel>
              <div style={{ fontSize: "14px", fontWeight: "bold" }}>N. {numeroNfe}</div>
              <div style={{ fontSize: "9px" }}>SERIE: {serie}</div>
            </td>
          </tr>
        </tbody>
      </table>

      {/* Linha tracejada de corte */}
      <div style={{ borderBottom: "1px dashed #999", margin: "4px 0" }} />

      {/* ===== CABECALHO PRINCIPAL ===== */}
      <table style={{ width: "100%", borderCollapse: "collapse", border: "2px solid #000" }}>
        <tbody>
          <tr>
            {/* Coluna esquerda: Logo + Dados do emitente */}
            <td style={{ width: "38%", borderRight: "1px solid #000", padding: "6px 8px", verticalAlign: "top" }}>
              <div style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
                {logo && (
                  <img
                    src={logo}
                    alt="Logo"
                    style={{ maxHeight: "50px", maxWidth: "60px", objectFit: "contain" }}
                    crossOrigin="anonymous"
                  />
                )}
                <div>
                  <div style={{ fontSize: "11px", fontWeight: "bold" }}>
                    {emitente?.razao_social || emitente?.nome_fantasia || ""}
                  </div>
                  <div style={{ fontSize: "8px", marginTop: "2px", lineHeight: 1.4 }}>
                    {enderecoEmitente}{bairroEmitente ? ` - ${bairroEmitente}` : ""}
                    <br />
                    {cidadeEmitente} - {ufEmitente}
                    <br />
                    CEP: {cepEmitente}
                  </div>
                </div>
              </div>
            </td>
            {/* Coluna centro: DANFE info */}
            <td style={{ width: "28%", borderRight: "1px solid #000", padding: "6px 8px", textAlign: "center", verticalAlign: "top" }}>
              <div style={{ fontSize: "16px", fontWeight: "bold", letterSpacing: "1px" }}>DANFE</div>
              <div style={{ fontSize: "7px", marginTop: "1px", lineHeight: 1.3 }}>
                DOCUMENTO AUXILIAR<br />DE NOTA FISCAL<br />ELETRONICA
              </div>
              <div style={{ marginTop: "4px", fontSize: "9px" }}>
                <span>0 - ENTRADA</span>
                <span style={{ margin: "0 6px" }}>|</span>
                <strong>1 - SAIDA</strong>
              </div>
              <div style={{ fontSize: "18px", fontWeight: "bold", marginTop: "4px" }}>
                N. {numeroNfe}
              </div>
              <div style={{ fontSize: "9px" }}>SERIE: {serie}</div>
              <div style={{ fontSize: "8px", marginTop: "2px" }}>FOLHA 1 / 1</div>
            </td>
            {/* Coluna direita: Chave + Protocolo */}
            <td style={{ width: "34%", padding: "6px 8px", verticalAlign: "top" }}>
              <FieldLabel>CHAVE DE ACESSO</FieldLabel>
              <div style={{
                fontFamily: "monospace",
                fontSize: "8px",
                letterSpacing: "0.3px",
                wordBreak: "break-all",
                marginTop: "2px",
                lineHeight: 1.5,
                fontWeight: "bold",
              }}>
                {formatChaveAcesso(nfe.chave_acesso || "")}
              </div>
              <div style={{ marginTop: "6px", padding: "4px", border: "1px solid #ccc", fontSize: "7px", textAlign: "center", lineHeight: 1.4 }}>
                Consulta de autenticidade no portal nacional da NF-e<br />
                <strong>www.nfe.fazenda.gov.br/portal</strong> ou no site da Sefaz Autorizadora.
              </div>
              {nfe.protocolo && (
                <div style={{ marginTop: "6px" }}>
                  <FieldLabel>PROTOCOLO DE AUTORIZACAO DE USO</FieldLabel>
                  <div style={{ fontSize: "9px", fontFamily: "monospace", fontWeight: "bold", marginTop: "1px" }}>
                    {nfe.protocolo} - {formatDateTimeBR(nfe.data_autorizacao || nfe.data_emissao)}
                  </div>
                </div>
              )}
            </td>
          </tr>
        </tbody>
      </table>

      {/* ===== NATUREZA DA OPERACAO + IE + CNPJ ===== */}
      <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #000", borderTop: "none" }}>
        <tbody>
          <tr>
            <td style={{ ...cellStyle, borderRight: "1px solid #999", width: "60%" }}>
              <FieldLabel>NATUREZA DA OPERACAO</FieldLabel>
              <FieldValue bold>{nfe.natureza_operacao || "Venda"}</FieldValue>
            </td>
            <td style={{ ...cellStyle, width: "40%" }}>
              <FieldLabel>PROTOCOLO DE AUTORIZACAO DE USO</FieldLabel>
              <FieldValue>{nfe.protocolo ? `${nfe.protocolo}` : "-"}</FieldValue>
            </td>
          </tr>
          <tr>
            <td colSpan={2} style={{ padding: 0 }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <tbody>
                  <tr>
                    <td style={{ ...cellStyle, borderRight: "1px solid #999", borderTop: "1px solid #999", width: "34%" }}>
                      <FieldLabel>INSCRICAO ESTADUAL DE SUBST. TRIBUTARIA</FieldLabel>
                      <FieldValue>{emitente?.inscricao_estadual_st || "-"}</FieldValue>
                    </td>
                    <td style={{ ...cellStyle, borderRight: "1px solid #999", borderTop: "1px solid #999", width: "33%" }}>
                      <FieldLabel>INSCRICAO ESTADUAL</FieldLabel>
                      <FieldValue>{emitente?.inscricao_estadual || "-"}</FieldValue>
                    </td>
                    <td style={{ ...cellStyle, borderTop: "1px solid #999", width: "33%" }}>
                      <FieldLabel>CNPJ / CPF</FieldLabel>
                      <FieldValue>{formatCnpjCpf(emitente?.cnpj || "")}</FieldValue>
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
        </tbody>
      </table>

      {/* ===== DESTINATARIO / REMETENTE ===== */}
      <SectionHeader>DESTINATARIO / REMETENTE</SectionHeader>
      <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #000", borderTop: "none" }}>
        <tbody>
          <tr>
            <td style={{ ...cellStyle, borderRight: "1px solid #999", width: "50%" }}>
              <FieldLabel>NOME / RAZAO SOCIAL</FieldLabel>
              <FieldValue bold>{nfe.dest_razao_social || nfe.cliente_nome || "-"}</FieldValue>
            </td>
            <td style={{ ...cellStyle, borderRight: "1px solid #999", width: "25%" }}>
              <FieldLabel>CNPJ / CPF</FieldLabel>
              <FieldValue>{formatCnpjCpf(nfe.dest_cpf_cnpj || "")}</FieldValue>
            </td>
            <td style={{ ...cellStyle, width: "25%" }}>
              <FieldLabel>DATA EMISSAO</FieldLabel>
              <FieldValue>{formatDateBR(nfe.data_emissao || nfe.created_at)}</FieldValue>
            </td>
          </tr>
          <tr>
            <td style={{ ...cellStyle, borderRight: "1px solid #999", borderTop: "1px solid #999" }}>
              <FieldLabel>ENDERECO</FieldLabel>
              <FieldValue>{enderecoDestinatario || "-"}</FieldValue>
            </td>
            <td style={{ ...cellStyle, borderRight: "1px solid #999", borderTop: "1px solid #999" }}>
              <FieldLabel>BAIRRO / DISTRITO</FieldLabel>
              <FieldValue>{nfe.dest_bairro || "-"}</FieldValue>
            </td>
            <td style={{ ...cellStyle, borderTop: "1px solid #999" }}>
              <FieldLabel>CEP</FieldLabel>
              <FieldValue>{formatCep(nfe.dest_cep || "")}</FieldValue>
            </td>
          </tr>
          <tr>
            <td style={{ ...cellStyle, borderRight: "1px solid #999", borderTop: "1px solid #999" }}>
              <FieldLabel>MUNICIPIO</FieldLabel>
              <FieldValue>{nfe.dest_cidade || "-"}</FieldValue>
            </td>
            <td style={{ ...cellStyle, borderRight: "1px solid #999", borderTop: "1px solid #999" }}>
              <FieldLabel>FONE / FAX</FieldLabel>
              <FieldValue>{nfe.dest_telefone || "-"}</FieldValue>
            </td>
            <td style={{ ...cellStyle, borderTop: "1px solid #999" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <tbody>
                  <tr>
                    <td style={{ width: "40%", verticalAlign: "top" }}>
                      <FieldLabel>UF</FieldLabel>
                      <FieldValue>{nfe.dest_uf || "-"}</FieldValue>
                    </td>
                    <td style={{ verticalAlign: "top" }}>
                      <FieldLabel>INSCRICAO ESTADUAL</FieldLabel>
                      <FieldValue>{nfe.dest_inscricao_estadual || "-"}</FieldValue>
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
          <tr>
            <td colSpan={3} style={{ ...cellStyle, borderTop: "1px solid #999" }}>
              <FieldLabel>DATA ENTRADA / SAIDA</FieldLabel>
              <FieldValue>{formatDateBR(nfe.data_emissao || nfe.created_at)}</FieldValue>
              <span style={{ float: "right" }}>
                <FieldLabel>HORA ENTRADA / SAIDA</FieldLabel>
                <FieldValue>{formatTimeBR(nfe.data_emissao || nfe.created_at)}</FieldValue>
              </span>
            </td>
          </tr>
        </tbody>
      </table>

      {/* ===== FATURA / DUPLICATA ===== */}
      <SectionHeader>FATURA / DUPLICATA</SectionHeader>
      <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #000", borderTop: "none" }}>
        <tbody>
          <tr>
            <td style={{ ...cellStyle, minHeight: "16px" }}>
              <FieldValue>{nfe.modalidade_frete === "boleto" ? "Boleto bancario" : (nfe.info_pagamento || "-")}</FieldValue>
            </td>
          </tr>
        </tbody>
      </table>

      {/* ===== CALCULO DO IMPOSTO ===== */}
      <SectionHeader>CALCULO DO IMPOSTO</SectionHeader>
      <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #000", borderTop: "none" }}>
        <tbody>
          <tr>
            <td style={{ ...cellStyle, borderRight: "1px solid #999", textAlign: "right" }}>
              <FieldLabel>BASE DE CALCULO DO ICMS</FieldLabel>
              <FieldValue>{formatCurrency(baseIcms)}</FieldValue>
            </td>
            <td style={{ ...cellStyle, borderRight: "1px solid #999", textAlign: "right" }}>
              <FieldLabel>VALOR DO ICMS</FieldLabel>
              <FieldValue>{formatCurrency(valorIcms)}</FieldValue>
            </td>
            <td style={{ ...cellStyle, borderRight: "1px solid #999", textAlign: "right" }}>
              <FieldLabel>BASE DE CALCULO DO ICMS SUBST.</FieldLabel>
              <FieldValue>{formatCurrency(baseIcmsSt)}</FieldValue>
            </td>
            <td style={{ ...cellStyle, borderRight: "1px solid #999", textAlign: "right" }}>
              <FieldLabel>VALOR DO ICMS SUBST.</FieldLabel>
              <FieldValue>{formatCurrency(valorIcmsSt)}</FieldValue>
            </td>
            <td style={{ ...cellStyle, textAlign: "right" }}>
              <FieldLabel>VALOR TOTAL DOS PRODUTOS</FieldLabel>
              <FieldValue bold>{formatCurrency(valorProdutos)}</FieldValue>
            </td>
          </tr>
          <tr>
            <td style={{ ...cellStyle, borderRight: "1px solid #999", borderTop: "1px solid #999", textAlign: "right" }}>
              <FieldLabel>VALOR DO FRETE</FieldLabel>
              <FieldValue>{formatCurrency(valorFrete)}</FieldValue>
            </td>
            <td style={{ ...cellStyle, borderRight: "1px solid #999", borderTop: "1px solid #999", textAlign: "right" }}>
              <FieldLabel>VALOR DO SEGURO</FieldLabel>
              <FieldValue>{formatCurrency(valorSeguro)}</FieldValue>
            </td>
            <td style={{ ...cellStyle, borderRight: "1px solid #999", borderTop: "1px solid #999", textAlign: "right" }}>
              <FieldLabel>DESCONTO</FieldLabel>
              <FieldValue>{formatCurrency(valorDesconto)}</FieldValue>
            </td>
            <td style={{ ...cellStyle, borderRight: "1px solid #999", borderTop: "1px solid #999", textAlign: "right" }}>
              <FieldLabel>OUTRAS DESPESAS ACESSORIAS</FieldLabel>
              <FieldValue>{formatCurrency(valorOutras)}</FieldValue>
            </td>
            <td style={{ ...cellStyle, borderTop: "1px solid #999", textAlign: "right" }}>
              <FieldLabel>VALOR TOTAL DO IPI</FieldLabel>
              <FieldValue>{formatCurrency(valorIpi)}</FieldValue>
            </td>
          </tr>
          <tr>
            <td colSpan={5} style={{ ...cellStyle, borderTop: "1px solid #999", textAlign: "right" }}>
              <FieldLabel>VALOR TOTAL DA NOTA</FieldLabel>
              <div style={{ fontSize: "13px", fontWeight: "bold" }}>
                {formatCurrency(valorTotal)}
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      {/* ===== TRANSPORTADOR / VOLUMES ===== */}
      <SectionHeader>TRANSPORTADOR / VOLUMES TRANSPORTADOS</SectionHeader>
      <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #000", borderTop: "none" }}>
        <tbody>
          <tr>
            <td style={{ ...cellStyle, borderRight: "1px solid #999", width: "15%" }}>
              <FieldLabel>FRETE POR CONTA</FieldLabel>
              <FieldValue>{nfe.modalidade_frete === "0" ? "0-EMITENTE" : "9-SEM FRETE"}</FieldValue>
            </td>
            <td style={{ ...cellStyle, borderRight: "1px solid #999", width: "15%" }}>
              <FieldLabel>CODIGO ANTT</FieldLabel>
              <FieldValue>-</FieldValue>
            </td>
            <td style={{ ...cellStyle, borderRight: "1px solid #999", width: "15%" }}>
              <FieldLabel>PLACA DO VEICULO</FieldLabel>
              <FieldValue>-</FieldValue>
            </td>
            <td style={{ ...cellStyle, borderRight: "1px solid #999", width: "5%" }}>
              <FieldLabel>UF</FieldLabel>
              <FieldValue>-</FieldValue>
            </td>
            <td style={{ ...cellStyle, borderRight: "1px solid #999", width: "25%" }}>
              <FieldLabel>CNPJ / CPF</FieldLabel>
              <FieldValue>-</FieldValue>
            </td>
            <td style={{ ...cellStyle, width: "25%" }}>
              <FieldLabel>VALOR DO FRETE</FieldLabel>
              <FieldValue>{formatCurrency(valorFrete)}</FieldValue>
            </td>
          </tr>
          <tr>
            <td colSpan={2} style={{ ...cellStyle, borderRight: "1px solid #999", borderTop: "1px solid #999" }}>
              <FieldLabel>QUANTIDADE</FieldLabel>
              <FieldValue>-</FieldValue>
            </td>
            <td style={{ ...cellStyle, borderRight: "1px solid #999", borderTop: "1px solid #999" }}>
              <FieldLabel>ESPECIE</FieldLabel>
              <FieldValue>-</FieldValue>
            </td>
            <td style={{ ...cellStyle, borderRight: "1px solid #999", borderTop: "1px solid #999" }}>
              <FieldLabel>MARCA</FieldLabel>
              <FieldValue>-</FieldValue>
            </td>
            <td style={{ ...cellStyle, borderRight: "1px solid #999", borderTop: "1px solid #999" }}>
              <FieldLabel>PESO BRUTO</FieldLabel>
              <FieldValue>-</FieldValue>
            </td>
            <td style={{ ...cellStyle, borderTop: "1px solid #999" }}>
              <FieldLabel>PESO LIQUIDO</FieldLabel>
              <FieldValue>-</FieldValue>
            </td>
          </tr>
        </tbody>
      </table>

      {/* ===== DADOS DOS PRODUTOS ===== */}
      <SectionHeader>DADOS DOS PRODUTOS / SERVICOS</SectionHeader>
      <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #000", borderTop: "none", fontSize: "8px" }}>
        <thead>
          <tr style={{ background: "#f0f0f0" }}>
            <th style={thStyle}>CODIGO</th>
            <th style={{ ...thStyle, textAlign: "left", width: "30%" }}>DESCRICAO DOS PRODUTOS</th>
            <th style={thStyle}>NCM/SH</th>
            <th style={thStyle}>O/CSOSN</th>
            <th style={thStyle}>CFOP</th>
            <th style={thStyle}>UNID</th>
            <th style={thStyle}>QUANT.</th>
            <th style={thStyle}>VALOR UNITARIO</th>
            <th style={thStyle}>VALOR TOTAL</th>
            <th style={thStyle}>BASE ICMS</th>
            <th style={thStyle}>ALIQUOTA ICMS</th>
            <th style={thStyle}>VALOR IPI</th>
          </tr>
        </thead>
        <tbody>
          {itens.map((item: any, idx: number) => (
            <tr key={idx}>
              <td style={tdStyle}>{item.codigo_produto || "-"}</td>
              <td style={{ ...tdStyle, textAlign: "left" }}>{item.descricao || "-"}</td>
              <td style={tdStyle}>{item.ncm || "-"}</td>
              <td style={tdStyle}>{item.csosn || item.cst || "0102"}</td>
              <td style={tdStyle}>{item.cfop || "5102"}</td>
              <td style={tdStyle}>{item.unidade || "UN"}</td>
              <td style={{ ...tdStyle, textAlign: "right" }}>{Number(item.quantidade || 0).toFixed(0)}</td>
              <td style={{ ...tdStyle, textAlign: "right" }}>{Number(item.valor_unitario || 0).toFixed(2)}</td>
              <td style={{ ...tdStyle, textAlign: "right", fontWeight: "bold" }}>{Number(item.valor_total || 0).toFixed(2)}</td>
              <td style={{ ...tdStyle, textAlign: "right" }}>0,00</td>
              <td style={{ ...tdStyle, textAlign: "right" }}>0,00</td>
              <td style={{ ...tdStyle, textAlign: "right" }}>0,00</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* ===== DADOS ADICIONAIS ===== */}
      <SectionHeader>DADOS ADICIONAIS</SectionHeader>
      <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #000", borderTop: "none" }}>
        <tbody>
          <tr>
            <td style={{ padding: "6px 10px", width: "60%", borderRight: "1px solid #999", verticalAlign: "top", minHeight: "50px" }}>
              <FieldLabel>INFORMACOES COMPLEMENTARES</FieldLabel>
              <div style={{ fontSize: "8px", lineHeight: 1.5, marginTop: "3px", whiteSpace: "pre-wrap" }}>
                {nfe.info_complementar || (
                  <>
                    Documento emitido por ME ou EPP optante pelo SIMPLES NACIONAL conforme LC 123/2006.
                    {"\n"}Nao gera direito a credito fiscal de IPI.
                  </>
                )}
              </div>
            </td>
            <td style={{ padding: "6px 10px", verticalAlign: "top" }}>
              <FieldLabel>RESERVADO AO FISCO</FieldLabel>
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
                {nfe.data_cancelamento && (
                  <div style={{ fontSize: "10px", color: "#991b1b" }}>
                    Data do cancelamento: {formatDateTimeBR(nfe.data_cancelamento)}
                  </div>
                )}
              </td>
            </tr>
          </tbody>
        </table>
      )}

      {/* ===== RODAPE ===== */}
      <div style={{
        marginTop: 6,
        padding: "4px 12px",
        textAlign: "center",
        fontSize: "7px",
        color: "#555",
        lineHeight: 1.5,
        borderTop: "1px solid #000",
      }}>
        <div>Consulte a autenticidade desta NF-e em: <strong>www.nfe.fazenda.gov.br/portal</strong></div>
      </div>
    </div>
  )
}

// ============================================================
// Sub-componentes auxiliares
// ============================================================

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      background: "#e8e8e8",
      color: "#000",
      fontSize: "8px",
      fontWeight: "bold",
      padding: "3px 10px",
      letterSpacing: "0.3px",
      textTransform: "uppercase",
      border: "1px solid #000",
      borderBottom: "none",
    }}>
      {children}
    </div>
  )
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: "7px", color: "#555", marginBottom: 1, textTransform: "uppercase" }}>
      {children}
    </div>
  )
}

function FieldValue({ children, bold }: { children: React.ReactNode; bold?: boolean }) {
  return (
    <div style={{ fontSize: "9px", fontWeight: bold ? "bold" : "normal", color: "#000" }}>
      {children}
    </div>
  )
}

// Estilos compartilhados
const cellStyle: React.CSSProperties = {
  padding: "4px 8px",
  verticalAlign: "top",
}

const thStyle: React.CSSProperties = {
  border: "1px solid #000",
  padding: "3px 4px",
  textAlign: "center",
  fontSize: "7px",
  fontWeight: "bold",
  textTransform: "uppercase",
}

const tdStyle: React.CSSProperties = {
  border: "1px solid #ccc",
  padding: "2px 4px",
  textAlign: "center",
  fontSize: "8px",
}

// ============================================================
// CSS para impressao
// ============================================================
function getPrintStyles(): string {
  return `
    * { margin: 0; padding: 0; box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; }
    body {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 9px;
      color: #000;
      padding: 8px;
      line-height: 1.3;
    }
    table { border-collapse: collapse; }
    div[style*="background"] { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; }
    td[style*="background"] { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; }
  `
}
