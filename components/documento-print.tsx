"use client"

import type React from "react"

import { useState, useEffect, useRef, useCallback } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Printer, X } from "lucide-react"

interface Documento {
  id: number
  codigo: string
  titulo: string
  conteudo: string
  cliente_id: number
  cliente_nome: string
  cliente_endereco: string
  cliente_telefone: string
  cliente_email: string
  cliente_sindico?: string
  tipo_documento: string
  status: string
  versao: number
  tags: string
  created_at: string
  updated_at: string
  created_by: string
  observacoes: string
}

interface ConfiguracaoTimbrado {
  id: number
  empresa_nome: string
  empresa_cnpj: string
  empresa_endereco: string
  empresa_telefone: string
  empresa_email: string
  empresa_site: string
  empresa_representante_legal: string
  tamanho_papel: string
  orientacao: string
  margem_superior: number
  margem_inferior: number
  margem_esquerda: number
  margem_direita: number
  cabecalho: string
  rodape: string
  rodape_texto: string
  ativo: boolean
}

interface Logo {
  id: number
  tipo: string
  nome: string
  dados: string
  formato: string
  tamanho: number
  ativo: boolean
}

interface DocumentoPrintProps {
  documento: Documento | null
  isOpen: boolean
  onClose: () => void
}

// Função para converter data em extenso
const formatDateExtended = (dateString: string): string => {
  const date = new Date(dateString)
  const months = [
    "janeiro",
    "fevereiro",
    "março",
    "abril",
    "maio",
    "junho",
    "julho",
    "agosto",
    "setembro",
    "outubro",
    "novembro",
    "dezembro",
  ]

  const day = date.getDate()
  const month = months[date.getMonth()]
  const year = date.getFullYear()

  return `${day} de ${month} de ${year}`
}

export function DocumentoPrint({ documento, isOpen, onClose }: DocumentoPrintProps) {
  const [configuracaoTimbrado, setConfiguracaoTimbrado] = useState<ConfiguracaoTimbrado | null>(null)
  const [logos, setLogos] = useState<Logo[]>([])
  const [loading, setLoading] = useState(true)
  const [clienteCompleto, setClienteCompleto] = useState<any>(null)

  // Estados para redimensionamento
  const [size, setSize] = useState({ width: 1400, height: 800 })
  const [isResizing, setIsResizing] = useState(false)
  const [resizeDirection, setResizeDirection] = useState<string>("")
  const resizeRef = useRef<{ startX: number; startY: number; startWidth: number; startHeight: number }>({
    startX: 0,
    startY: 0,
    startWidth: 0,
    startHeight: 0,
  })

  useEffect(() => {
    if (isOpen) {
      loadConfiguracaoTimbrado()
      loadLogos()
      if (documento?.cliente_id) {
        loadClienteCompleto(documento.cliente_id)
      }
    }
  }, [isOpen, documento?.cliente_id])

  const loadConfiguracaoTimbrado = async () => {
    try {
      const response = await fetch("/api/timbrado-config")
      const result = await response.json()
      if (result.success && result.data) {
        setConfiguracaoTimbrado(result.data)
      }
    } catch (error) {
      console.error("Erro ao carregar configuração do timbrado:", error)
    }
  }

  const loadLogos = async () => {
    try {
      const response = await fetch("/api/configuracoes/logos")
      const result = await response.json()
      if (result.success) {
        setLogos(result.data || [])
      }
    } catch (error) {
      console.error("Erro ao carregar logos:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadClienteCompleto = async (clienteId: number) => {
    try {
      const response = await fetch(`/api/clientes/${clienteId}`)
      const result = await response.json()
      if (result.success) {
        setClienteCompleto(result.data)
      }
    } catch (error) {
      console.error("Erro ao carregar dados completos do cliente:", error)
    }
  }

  // Funções de redimensionamento
  const handleMouseDown = useCallback(
    (e: React.MouseEvent, direction: string) => {
      e.preventDefault()
      setIsResizing(true)
      setResizeDirection(direction)
      resizeRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        startWidth: size.width,
        startHeight: size.height,
      }
    },
    [size],
  )

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isResizing) return

      const deltaX = e.clientX - resizeRef.current.startX
      const deltaY = e.clientY - resizeRef.current.startY

      let newWidth = size.width
      let newHeight = size.height

      // Tamanhos mínimos e máximos
      const minWidth = 800
      const minHeight = 600
      const maxWidth = window.innerWidth - 100
      const maxHeight = window.innerHeight - 100

      if (resizeDirection.includes("e")) {
        newWidth = Math.min(Math.max(resizeRef.current.startWidth + deltaX, minWidth), maxWidth)
      }
      if (resizeDirection.includes("w")) {
        newWidth = Math.min(Math.max(resizeRef.current.startWidth - deltaX, minWidth), maxWidth)
      }
      if (resizeDirection.includes("s")) {
        newHeight = Math.min(Math.max(resizeRef.current.startHeight + deltaY, minHeight), maxHeight)
      }
      if (resizeDirection.includes("n")) {
        newHeight = Math.min(Math.max(resizeRef.current.startHeight - deltaY, minHeight), maxHeight)
      }

      setSize({ width: newWidth, height: newHeight })
    },
    [isResizing, resizeDirection, size],
  )

  const handleMouseUp = useCallback(() => {
    setIsResizing(false)
    setResizeDirection("")
  }, [])

  useEffect(() => {
    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
      return () => {
        document.removeEventListener("mousemove", handleMouseMove)
        document.removeEventListener("mouseup", handleMouseUp)
      }
    }
  }, [isResizing, handleMouseMove, handleMouseUp])

  const handlePrint = () => {
    if (!documento) return

    const printWindow = window.open("", "_blank")
    if (!printWindow) return

    const logoImpressao = logos.find((logo) => logo.tipo === "impressao" && logo.ativo)
    const sindico = clienteCompleto?.sindico || documento.cliente_sindico || ""

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>${documento.titulo}</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            body {
              font-family: Arial, sans-serif;
              font-size: 10px;
              line-height: 1.2;
              color: #000;
              background: white;
            }
            
            .container {
              width: 100%;
              max-width: 210mm;
              margin: 0 auto;
              padding: 0;
              min-height: 297mm;
              display: flex;
              flex-direction: column;
              background: white;
            }
            
            .header {
              text-align: center;
              margin-bottom: 15px;
              border-bottom: 1px solid #000;
              padding-bottom: 10px;
              flex-shrink: 0;
              background: white;
            }
            
            .logo {
              max-height: 50px;
              margin-bottom: 8px;
              object-fit: contain;
            }
            
            .company-header {
              font-size: 9px;
              margin-bottom: 8px;
              line-height: 1.2;
              text-align: center;
            }
            
            .document-title {
              font-size: 16px;
              font-weight: bold;
              margin-bottom: 5px;
              text-transform: uppercase;
            }
            
            .content-wrapper {
              flex: 1;
              display: flex;
              flex-direction: column;
              background: white;
            }
            
            .document-content {
              flex: 1;
              text-align: justify;
              line-height: 1.3;
              margin-bottom: 15px;
              background: white;
            }
            
            .document-content h1,
            .document-content h2,
            .document-content h3,
            .document-content h4,
            .document-content h5,
            .document-content h6 {
              margin: 8px 0 4px 0;
              font-weight: bold;
            }
            
            .document-content h1 { font-size: 14px; }
            .document-content h2 { font-size: 13px; }
            .document-content h3 { font-size: 12px; }
            .document-content h4 { font-size: 11px; }
            .document-content h5 { font-size: 10px; }
            .document-content h6 { font-size: 9px; }
            
            .document-content p {
              margin: 4px 0;
            }
            
            .document-content ul,
            .document-content ol {
              margin: 4px 0;
              padding-left: 15px;
            }
            
            .document-content li {
              margin: 2px 0;
            }
            
            .document-content table {
              width: 100%;
              border-collapse: collapse;
              margin: 8px 0;
              font-size: 9px;
            }
            
            .document-content table th,
            .document-content table td {
              border: 1px solid #000;
              padding: 3px;
              text-align: left;
            }
            
            .document-content table th {
              background-color: #f0f0f0;
              font-weight: bold;
            }
            
            .document-content img {
              max-width: 100%;
              height: auto;
              margin: 4px 0;
            }
            
            .document-content blockquote {
              margin: 8px 0;
              padding: 5px 10px;
              border-left: 3px solid #ccc;
              background-color: #f9f9f9;
              font-style: italic;
            }
            
            .document-content pre {
              background-color: #f5f5f5;
              padding: 5px;
              border: 1px solid #ddd;
              border-radius: 3px;
              font-family: 'Courier New', monospace;
              font-size: 9px;
              margin: 4px 0;
              white-space: pre-wrap;
            }
            
            .client-info {
              background-color: #f9f9f9;
              padding: 8px;
              border: 1px solid #ddd;
              margin: 10px 0;
              flex-shrink: 0;
            }
            
            .client-info h3 {
              margin-bottom: 4px;
              font-size: 11px;
              font-weight: bold;
            }
            
            .client-info p {
              margin: 1px 0;
              font-size: 9px;
              line-height: 1.2;
            }
            
            .client-info .sindico {
              font-weight: bold;
              margin-top: 4px;
            }
            
            .document-footer-section {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              margin: 15px 0 10px 0;
              padding: 8px 0;
              border-top: 1px solid #ccc;
              flex-shrink: 0;
              background: transparent;
            }
            
            .document-footer-left {
              width: 48%;
              background: transparent;
            }
            
            .document-footer-right {
              width: 48%;
              text-align: center;
              background: transparent;
            }
            
            .document-date {
              font-size: 10px;
              color: #666;
              margin-bottom: 8px;
            }
            
            .company-info {
              font-size: 9px;
              color: #666;
              line-height: 1.2;
            }
            
            .company-info p {
              margin: 1px 0;
            }
            
            .footer {
              margin-top: 10px;
              padding-top: 8px;
              border-top: 1px solid #000;
              text-align: center;
              font-size: 8px;
              font-weight: bold;
              flex-shrink: 0;
              background: white;
            }
            
            .document-meta {
              margin-top: 10px;
              padding-top: 5px;
              border-top: 1px solid #ccc;
              font-size: 8px;
              color: #666;
              flex-shrink: 0;
              background: white;
            }
            
            @page {
              margin: ${configuracaoTimbrado ? `${Math.max(configuracaoTimbrado.margem_superior, 10)}mm ${Math.max(configuracaoTimbrado.margem_direita, 10)}mm ${Math.max(configuracaoTimbrado.margem_inferior, 10)}mm ${Math.max(configuracaoTimbrado.margem_esquerda, 10)}mm` : "10mm"};
              size: ${configuracaoTimbrado?.tamanho_papel || "A4"} ${configuracaoTimbrado?.orientacao === "paisagem" ? "landscape" : "portrait"};
            }
            
            @media print {
              body { 
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
                background: white !important;
              }
              
              .container { 
                padding: 0; 
                max-width: none;
                min-height: auto;
                background: white !important;
              }
              
              .document-footer-section {
                background: white !important;
              }
              
              .document-footer-left,
              .document-footer-right {
                background: white !important;
              }
              
              .content-wrapper {
                background: white !important;
              }
              
              .no-print {
                display: none !important;
              }
              
              /* Força quebra de página apenas se necessário */
              .document-content {
                page-break-inside: avoid;
              }
              
              /* Evita quebras desnecessárias */
              h1, h2, h3, h4, h5, h6 {
                page-break-after: avoid;
              }
              
              /* Mantém elementos juntos */
              .client-info,
              .document-footer-section {
                page-break-inside: avoid;
              }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <!-- Cabeçalho -->
            <div class="header">
              ${logoImpressao && logoImpressao.dados ? `<img src="${logoImpressao.dados}" alt="Logo" class="logo">` : ""}
              
              ${configuracaoTimbrado?.cabecalho ? `<div class="company-header">${configuracaoTimbrado.cabecalho}</div>` : ""}
              
              <div class="document-title">${documento.titulo}</div>
            </div>

            <div class="content-wrapper">
              <!-- Informações do Cliente -->
              ${
                documento.cliente_nome
                  ? `
                <div class="client-info">
                  <h3>Ao</h3>
                  <p><strong>Nome:</strong> ${documento.cliente_nome}</p>
                  ${documento.cliente_endereco ? `<p><strong>Endereço:</strong> ${documento.cliente_endereco}</p>` : ""}
                  ${documento.cliente_telefone ? `<p><strong>Telefone:</strong> ${documento.cliente_telefone}</p>` : ""}
                  ${documento.cliente_email ? `<p><strong>E-mail:</strong> ${documento.cliente_email}</p>` : ""}
                  ${sindico ? `<p class="sindico"><strong>A/C Sr(a):</strong> ${sindico}</p>` : ""}
                </div>
              `
                  : ""
              }

              <!-- Conteúdo do Documento -->
              <div class="document-content">
                ${documento.conteudo}
              </div>

              <!-- Seção de Rodapé com Data e Informações da Empresa -->
              <div class="document-footer-section">
                <div class="document-footer-left">
                  <!-- Espaço vazio no lado esquerdo -->
                </div>
                <div class="document-footer-right">
                  <div class="document-date">
                    <strong>São Paulo, ${formatDateExtended(documento.created_at)}</strong>
                  </div>
                  ${
                    configuracaoTimbrado
                      ? `
                    <div class="company-info">
                      ${configuracaoTimbrado.empresa_nome ? `<p>${configuracaoTimbrado.empresa_nome}</p>` : ""}
                      ${configuracaoTimbrado.empresa_cnpj ? `<p>${configuracaoTimbrado.empresa_cnpj}</p>` : ""}
                      ${configuracaoTimbrado.empresa_representante_legal ? `<p>${configuracaoTimbrado.empresa_representante_legal}</p>` : ""}
                      ${configuracaoTimbrado.empresa_email ? `<p>${configuracaoTimbrado.empresa_email}</p>` : ""}
                    </div>
                  `
                      : ""
                  }
                </div>
              </div>

              <!-- Observações -->
              ${
                documento.observacoes
                  ? `
                <div class="document-meta">
                  <h4>Observações:</h4>
                  <p>${documento.observacoes}</p>
                </div>
              `
                  : ""
              }
            </div>

            <!-- Rodapé -->
            ${
              configuracaoTimbrado && (configuracaoTimbrado.rodape || configuracaoTimbrado.rodape_texto)
                ? `
      <div class="footer">
        ${configuracaoTimbrado.rodape ? `<div>${configuracaoTimbrado.rodape}</div>` : ""}
        ${configuracaoTimbrado.rodape_texto ? `<div>${configuracaoTimbrado.rodape_texto}</div>` : ""}
      </div>
    `
                : ""
            }
          </div>
        </body>
      </html>
    `

    printWindow.document.write(printContent)
    printWindow.document.close()

    // Aguardar o carregamento e imprimir
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print()
        printWindow.close()
      }, 500)
    }
  }

  if (!documento) return null

  const logoImpressao = logos.find((logo) => logo.tipo === "impressao" && logo.ativo)
  const sindico = clienteCompleto?.sindico || documento.cliente_sindico || ""

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="overflow-hidden flex flex-col p-0"
        style={{
          width: `${size.width}px`,
          height: `${size.height}px`,
          maxWidth: "none",
        }}
      >
        {/* Resize Handles */}
        <div
          className="absolute top-0 left-0 right-0 h-1 cursor-n-resize hover:bg-blue-500 z-50"
          onMouseDown={(e) => handleMouseDown(e, "n")}
        />
        <div
          className="absolute bottom-0 left-0 right-0 h-1 cursor-s-resize hover:bg-blue-500 z-50"
          onMouseDown={(e) => handleMouseDown(e, "s")}
        />
        <div
          className="absolute top-0 bottom-0 left-0 w-1 cursor-w-resize hover:bg-blue-500 z-50"
          onMouseDown={(e) => handleMouseDown(e, "w")}
        />
        <div
          className="absolute top-0 bottom-0 right-0 w-1 cursor-e-resize hover:bg-blue-500 z-50"
          onMouseDown={(e) => handleMouseDown(e, "e")}
        />
        <div
          className="absolute top-0 left-0 w-3 h-3 cursor-nw-resize hover:bg-blue-500 z-50"
          onMouseDown={(e) => handleMouseDown(e, "nw")}
        />
        <div
          className="absolute top-0 right-0 w-3 h-3 cursor-ne-resize hover:bg-blue-500 z-50"
          onMouseDown={(e) => handleMouseDown(e, "ne")}
        />
        <div
          className="absolute bottom-0 left-0 w-3 h-3 cursor-sw-resize hover:bg-blue-500 z-50"
          onMouseDown={(e) => handleMouseDown(e, "sw")}
        />
        <div
          className="absolute bottom-0 right-0 w-3 h-3 cursor-se-resize hover:bg-blue-500 z-50"
          onMouseDown={(e) => handleMouseDown(e, "se")}
        />

        <DialogHeader className="flex-shrink-0 px-6 py-4 border-b">
          <DialogTitle>Visualizar Documento para Impressão</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Carregando configurações...</p>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col min-h-0">
            {/* Preview do Documento */}
            <div className="flex-1 bg-white text-black border-t overflow-hidden flex flex-col">
              <div className="flex-1 overflow-y-auto p-8">
                {/* Cabeçalho Preview - SEM código e versão */}
                <div className="text-center mb-8 border-b pb-6">
                  {logoImpressao && logoImpressao.dados && (
                    <div className="mb-6">
                      <img
                        src={logoImpressao.dados || "/placeholder.svg"}
                        alt="Logo da empresa"
                        className="mx-auto max-h-20 object-contain"
                      />
                    </div>
                  )}

                  {configuracaoTimbrado?.cabecalho && (
                    <div className="mb-6 text-sm text-gray-600 leading-relaxed">{configuracaoTimbrado.cabecalho}</div>
                  )}

                  <h1 className="text-2xl font-bold mb-4 text-gray-900">{documento.titulo}</h1>
                </div>

                {/* Informações do Cliente Preview */}
                {documento.cliente_nome && (
                  <div className="bg-gray-50 p-4 rounded-lg mb-6 border">
                    <h3 className="font-bold mb-2 text-gray-800">Ao</h3>
                    <div className="space-y-1 text-sm leading-tight">
                      <div>
                        <strong>Nome:</strong> {documento.cliente_nome}
                      </div>
                      {documento.cliente_endereco && (
                        <div>
                          <strong>Endereço:</strong> {documento.cliente_endereco}
                        </div>
                      )}
                      {documento.cliente_telefone && (
                        <div>
                          <strong>Telefone:</strong> {documento.cliente_telefone}
                        </div>
                      )}
                      {documento.cliente_email && (
                        <div>
                          <strong>E-mail:</strong> {documento.cliente_email}
                        </div>
                      )}
                      {sindico && (
                        <div className="pt-2">
                          <strong>A/C Sr(a):</strong> {sindico}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Conteúdo Completo do Documento */}
                <div className="mb-8">
                  <div
                    className="prose max-w-none text-sm leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: documento.conteudo }}
                  />
                </div>

                {/* Seção de Rodapé com Data e Informações da Empresa - Preview */}
                <div className="flex justify-between items-start py-4 border-t border-gray-300 mb-6">
                  <div className="w-1/2">{/* Lado esquerdo vazio */}</div>
                  <div className="w-1/2 text-center">
                    <div className="text-sm text-gray-600 mb-3">
                      <strong>São Paulo, {formatDateExtended(documento.created_at)}</strong>
                    </div>
                    {configuracaoTimbrado && (
                      <div className="text-xs text-gray-500 space-y-1">
                        {configuracaoTimbrado.empresa_nome && <div>{configuracaoTimbrado.empresa_nome}</div>}
                        {configuracaoTimbrado.empresa_cnpj && <div>{configuracaoTimbrado.empresa_cnpj}</div>}
                        {configuracaoTimbrado.empresa_representante_legal && (
                          <div>{configuracaoTimbrado.empresa_representante_legal}</div>
                        )}
                        {configuracaoTimbrado.empresa_email && <div>{configuracaoTimbrado.empresa_email}</div>}
                      </div>
                    )}
                  </div>
                </div>

                {/* Observações */}
                {documento.observacoes && (
                  <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <h4 className="font-bold mb-2 text-yellow-800">Observações:</h4>
                    <p className="text-sm text-yellow-700">{documento.observacoes}</p>
                  </div>
                )}

                {/* Rodapé Preview */}
                {configuracaoTimbrado && (configuracaoTimbrado.rodape || configuracaoTimbrado.rodape_texto) && (
                  <div className="border-t-2 border-gray-800 pt-4 text-center">
                    <div className="text-xs font-bold space-y-1">
                      {configuracaoTimbrado.rodape && (
                        <div dangerouslySetInnerHTML={{ __html: configuracaoTimbrado.rodape }} />
                      )}
                      {configuracaoTimbrado.rodape_texto && <div>{configuracaoTimbrado.rodape_texto}</div>}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Botões de Ação */}
            <div className="flex-shrink-0 flex justify-between items-center border-t bg-gray-50 px-6 py-3">
              <div className="text-xs text-gray-500 space-y-1">
                <div>
                  <strong>Configuração:</strong> {configuracaoTimbrado?.tamanho_papel || "A4"} -{" "}
                  {configuracaoTimbrado?.orientacao || "Retrato"}
                </div>
                <div>
                  <strong>Margens:</strong> {configuracaoTimbrado?.margem_superior || 20}mm
                </div>
              </div>

              <div className="flex gap-3">
                <Button onClick={onClose} variant="outline">
                  <X className="h-4 w-4 mr-2" />
                  Fechar
                </Button>
                <Button onClick={handlePrint} className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Printer className="h-4 w-4 mr-2" />
                  Imprimir
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
