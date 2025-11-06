"use client"

import type React from "react"

import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Printer, X, Eye } from "lucide-react"

interface OrdemServicoPrintProps {
  ordemServico: any
  itens: any[]
  fotos: any[]
  assinaturas: any[]
  onClose: () => void
}

interface TimbradoConfig {
  id?: number
  logo_url?: string
  cabecalho?: string
  rodape?: string
  empresa_nome?: string
  empresa_cnpj?: string
  empresa_endereco?: string
  empresa_cep?: string
  empresa_bairro?: string
  empresa_cidade?: string
  empresa_uf?: string
  empresa_telefone?: string
  empresa_email?: string
  empresa_representante_legal?: string
  representante_nacionalidade?: string
  representante_estado_civil?: string
  representante_rg?: string
  representante_cpf?: string
  margem_superior?: number
  margem_direita?: number
  margem_inferior?: number
  margem_esquerda?: number
  tamanho_papel?: string
  orientacao?: string
}

interface LogoConfig {
  id: number
  tipo: string
  nome: string
  dados?: string
  caminho?: string
  formato?: string
  tamanho?: number
  ativo: boolean
}

export function OrdemServicoPrint({ ordemServico, itens, fotos, assinaturas, onClose }: OrdemServicoPrintProps) {
  const [timbradoConfig, setTimbradoConfig] = useState<TimbradoConfig | null>(null)
  const [logoImpressao, setLogoImpressao] = useState<LogoConfig | null>(null)
  const [loading, setLoading] = useState(true)

  // Estados para redimensionamento
  const [size, setSize] = useState({ width: 1400, height: 800 })
  const [isResizing, setIsResizing] = useState(false)
  const [resizeDirection, setResizeDirection] = useState<string>("")
  const modalRef = useRef<HTMLDivElement>(null)
  const startPos = useRef({ x: 0, y: 0, width: 0, height: 0 })

  const minWidth = 800
  const minHeight = 600
  const maxWidth = typeof window !== "undefined" ? window.innerWidth - 100 : 1800
  const maxHeight = typeof window !== "undefined" ? window.innerHeight - 100 : 1000

  useEffect(() => {
    fetchConfiguracoes()
  }, [])

  const fetchConfiguracoes = async () => {
    try {
      const timbradoResponse = await fetch("/api/configuracoes/layout")
      const timbradoResult = await timbradoResponse.json()
      if (timbradoResult.success && timbradoResult.data) {
        setTimbradoConfig(timbradoResult.data)
      }

      const logoResponse = await fetch("/api/configuracoes/logos")
      const logoResult = await logoResponse.json()
      if (logoResult.success && logoResult.data) {
        const logoImpressaoEncontrado = logoResult.data.find(
          (logo: LogoConfig) => logo.tipo === "impressao" && logo.ativo && (logo.dados || logo.caminho),
        )
        setLogoImpressao(logoImpressaoEncontrado || null)
      }
    } catch (error) {
      console.error("Erro ao buscar configurações:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleMouseDown = useCallback(
    (e: React.MouseEvent, direction: string) => {
      e.preventDefault()
      setIsResizing(true)
      setResizeDirection(direction)
      startPos.current = {
        x: e.clientX,
        y: e.clientY,
        width: size.width,
        height: size.height,
      }
    },
    [size],
  )

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isResizing) return

      const deltaX = e.clientX - startPos.current.x
      const deltaY = e.clientY - startPos.current.y

      let newWidth = size.width
      let newHeight = size.height

      if (resizeDirection.includes("e")) {
        newWidth = Math.min(Math.max(startPos.current.width + deltaX, minWidth), maxWidth)
      }
      if (resizeDirection.includes("w")) {
        newWidth = Math.min(Math.max(startPos.current.width - deltaX, minWidth), maxWidth)
      }
      if (resizeDirection.includes("s")) {
        newHeight = Math.min(Math.max(startPos.current.height + deltaY, minHeight), maxHeight)
      }
      if (resizeDirection.includes("n")) {
        newHeight = Math.min(Math.max(startPos.current.height - deltaY, minHeight), maxHeight)
      }

      setSize({ width: newWidth, height: newHeight })
    },
    [isResizing, resizeDirection, size, minWidth, minHeight, maxWidth, maxHeight],
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

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "Não informada"
    try {
      const dateOnly = dateString.split("T")[0]
      const [year, month, day] = dateOnly.split("-")
      const date = new Date(Number.parseInt(year), Number.parseInt(month) - 1, Number.parseInt(day))
      if (isNaN(date.getTime())) return "Não informada"
      return date.toLocaleDateString("pt-BR")
    } catch {
      return "Não informada"
    }
  }

  const formatTime = (timeString: string | null | undefined) => {
    if (!timeString) return "Não informado"
    return timeString
  }

  const getTipoServicoLabel = (tipo: string) => {
    switch (tipo) {
      case "manutencao":
        return "Manutenção"
      case "orcamento":
        return "Orçamento"
      case "vistoria_contrato":
        return "Vistoria para Contrato"
      case "preventiva":
        return "Preventiva"
      default:
        return tipo
    }
  }

  const getStatusLabel = (situacao: string) => {
    switch (situacao) {
      case "rascunho":
        return "Rascunho"
      case "aberta":
        return "Aberta"
      case "agendada":
        return "Agendada"
      case "em_andamento":
        return "Em Andamento"
      case "concluida":
        return "Concluída"
      case "cancelada":
        return "Cancelada"
      default:
        return situacao
    }
  }

  const getClienteNome = () => {
    return ordemServico.cliente?.nome || ordemServico.cliente_nome || "Cliente não informado"
  }

  const getClienteTelefone = () => {
    return ordemServico.cliente?.telefone || ordemServico.cliente_telefone || ""
  }

  const getClienteEmail = () => {
    return ordemServico.cliente?.email || ordemServico.cliente_email || ""
  }

  const getClienteEndereco = () => {
    const endereco = ordemServico.cliente?.endereco || ordemServico.cliente_endereco || ""
    const cidade = ordemServico.cliente?.cidade || ordemServico.cliente_cidade || ""
    const estado = ordemServico.cliente?.estado || ordemServico.cliente_estado || ""
    const cep = ordemServico.cliente?.cep || ordemServico.cliente_cep || ""

    let enderecoCompleto = endereco
    if (cidade) enderecoCompleto += `, ${cidade}`
    if (estado) enderecoCompleto += ` - ${estado}`
    if (cep) enderecoCompleto += ` - ${cep}`

    return enderecoCompleto
  }

  const getAssinaturaResponsavel = () => {
    return assinaturas.find(
      (a) =>
        a.tipo === "cliente" ||
        a.tipo === "responsavel" ||
        a.tipo_assinatura === "cliente" ||
        a.tipo_assinatura === "responsavel",
    )
  }

  const getAssinaturaCaminho = (assinatura: any) => {
    return assinatura?.caminho || assinatura?.caminho_arquivo || assinatura?.assinatura_base64 || ""
  }

  const getFotoCaminho = (foto: any) => {
    return foto?.caminho || foto?.caminho_arquivo || ""
  }

  const gerarHTMLCompleto = () => {
    const logoSrc = logoImpressao?.dados || logoImpressao?.caminho || timbradoConfig?.logo_url || ""
    const assinaturaResponsavel = getAssinaturaResponsavel()

    return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Ordem de Serviço ${ordemServico.numero}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 0;
            background: white;
            color: black;
            font-size: 14px;
            line-height: 1.3;
        }
        
        .container {
            width: 21cm;
            min-height: 29.7cm;
            padding: 1cm;
            margin: 0 auto;
            background: white;
            box-sizing: border-box;
            page-break-after: always;
            display: flex;
            flex-direction: column;
            position: relative;
        }
        
        .page-header {
            text-align: center;
            margin-bottom: 12px;
            border-bottom: 2px solid #333;
            padding-bottom: 10px;
        }
        
        .logo img {
            max-height: 50px;
            width: auto;
        }
        
        .cabecalho-personalizado {
            margin-top: 8px;
            font-size: 11px;
            line-height: 1.2;
        }
        
        .titulo {
            text-align: center;
            margin-bottom: 12px;
            padding-bottom: 10px;
            border-bottom: 2px solid #333;
        }
        
        .titulo h1 {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 6px;
            line-height: 1.2;
        }
        
        .titulo p {
            font-size: 14px;
            margin: 0;
        }
        
        .two-columns {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin-bottom: 10px;
            padding-bottom: 10px;
            border-bottom: 1px solid #ccc;
        }
        
        .section-title {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 6px;
            text-decoration: underline;
        }
        
        .info-line {
            margin-bottom: 3px;
            font-size: 14px;
            line-height: 1.3;
        }
        
        .info-line strong {
            font-weight: bold;
        }
        
        .section {
            margin-bottom: 10px;
            padding-bottom: 10px;
            border-bottom: 1px solid #ccc;
        }
        
        .text-section {
            background-color: #f9f9f9;
            padding: 8px;
            border-radius: 4px;
            margin-bottom: 10px;
            border-bottom: 1px solid #ccc;
        }
        
        .text-section h3 {
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 6px;
            color: #333;
        }
        
        .text-section p {
            font-size: 14px;
            line-height: 1.3;
            margin: 0;
            white-space: pre-wrap;
        }
        
        .equipamentos-section {
            margin-bottom: 10px;
            padding-bottom: 10px;
            border-bottom: 1px solid #ccc;
        }
        
        .equipamentos-list {
            background-color: #f5f5f5;
            padding: 8px;
            border-radius: 4px;
        }
        
        .equipamento-item {
            padding: 3px 0;
            font-size: 14px;
            line-height: 1.3;
        }
        
        .fotos-section {
            margin-bottom: 10px;
            padding-bottom: 10px;
            border-bottom: 1px solid #ccc;
        }
        
        .fotos-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 8px;
            margin-top: 8px;
        }
        
        .foto-item {
            text-align: center;
        }
        
        .foto-item img {
            width: 100%;
            height: 80px;
            object-fit: cover;
            border: 1px solid #ddd;
            border-radius: 3px;
        }
        
        .foto-item p {
            font-size: 14px;
            margin-top: 3px;
            color: #666;
            line-height: 1.2;
        }
        
        .assinaturas-section {
            margin-top: auto;
            padding-top: 10px;
        }
        
        .assinatura-item {
            text-align: center;
            max-width: 400px;
            margin: 0 auto;
        }
        
        .assinatura-item h4 {
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 8px;
        }
        
        .assinatura-box {
            border: 1px solid #000;
            height: 100px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 8px;
        }
        
        .assinatura-box img {
            max-width: 90%;
            max-height: 90px;
            object-fit: contain;
        }
        
        .assinatura-info {
            font-size: 14px;
            color: #666;
            line-height: 1.3;
        }
        
        .page-footer {
            text-align: center;
            font-size: 10px;
            border-top: 2px solid #333;
            padding-top: 8px;
            margin-top: 10px;
            line-height: 1.2;
        }
        
        @page {
            margin: ${timbradoConfig ? `${timbradoConfig.margem_superior || 10}mm ${timbradoConfig.margem_direita || 8}mm ${timbradoConfig.margem_inferior || 10}mm ${timbradoConfig.margem_esquerda || 8}mm` : "10mm 8mm 10mm 8mm"};
            size: ${timbradoConfig?.tamanho_papel || "A4"} ${timbradoConfig?.orientacao === "paisagem" ? "landscape" : "portrait"};
        }
        
        @media print {
            body { -webkit-print-color-adjust: exact; }
            .container { padding: 0; margin: 0; }
        }
        
        @media screen {
            .container {
                margin-bottom: 20px;
                box-shadow: 0 0 10px rgba(0,0,0,0.1);
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Cabeçalho -->
        <div class="page-header">
            ${
              logoSrc
                ? `
              <div class="logo">
                <img src="${logoSrc}" alt="Logo da Empresa" />
              </div>
            `
                : ""
            }
            
            ${
              timbradoConfig?.cabecalho
                ? `
              <div class="cabecalho-personalizado">
                ${timbradoConfig.cabecalho}
              </div>
            `
                : ""
            }
        </div>

        <!-- Título -->
        <div class="titulo">
            <h1>ORDEM DE SERVIÇO Nº ${ordemServico.numero}</h1>
            <p>Status: <strong>${getStatusLabel(ordemServico.situacao)}</strong></p>
        </div>

        <!-- Informações Principais -->
        <div class="two-columns">
            <div>
                <div class="section-title">Dados do Cliente</div>
                <div class="info-line"><strong>Nome:</strong> ${getClienteNome()}</div>
                ${getClienteTelefone() ? `<div class="info-line"><strong>Telefone:</strong> ${getClienteTelefone()}</div>` : ""}
                ${getClienteEmail() ? `<div class="info-line"><strong>E-mail:</strong> ${getClienteEmail()}</div>` : ""}
                ${getClienteEndereco() ? `<div class="info-line"><strong>Endereço:</strong> ${getClienteEndereco()}</div>` : ""}
            </div>
            <div>
                <div class="section-title">Dados da Ordem de Serviço</div>
                <div class="info-line"><strong>Data:</strong> ${formatDate(ordemServico.data_atual)}</div>
                <div class="info-line"><strong>Tipo de Serviço:</strong> ${getTipoServicoLabel(ordemServico.tipo_servico)}</div>
                <div class="info-line"><strong>Técnico:</strong> ${ordemServico.tecnico_name || "Não informado"}</div>
                ${ordemServico.data_agendamento ? `<div class="info-line"><strong>Data Agendamento:</strong> ${formatDate(ordemServico.data_agendamento)}${ordemServico.periodo_agendamento ? ` - ${ordemServico.periodo_agendamento === "manha" ? "Manhã" : "Tarde"}` : ""}</div>` : ""}
                ${ordemServico.horario_entrada ? `<div class="info-line"><strong>Horário Entrada:</strong> ${formatTime(ordemServico.horario_entrada)}</div>` : ""}
                ${ordemServico.horario_saida ? `<div class="info-line"><strong>Horário Saída:</strong> ${formatTime(ordemServico.horario_saida)}</div>` : ""}
                ${ordemServico.solicitado_por ? `<div class="info-line"><strong>Solicitado por:</strong> ${ordemServico.solicitado_por}</div>` : ""}
            </div>
        </div>

        <!-- Descrições -->
        ${
          ordemServico.descricao_defeito && ordemServico.tipo_servico !== "preventiva"
            ? `
          <div class="text-section">
            <h3>Descrição do Defeito</h3>
            <p>${ordemServico.descricao_defeito}</p>
          </div>
        `
            : ""
        }

        ${
          ordemServico.necessidades_cliente && ordemServico.tipo_servico === "preventiva"
            ? `
          <div class="text-section">
            <h3>Necessidades do Cliente</h3>
            <p>${ordemServico.necessidades_cliente}</p>
          </div>
        `
            : ""
        }

        ${
          ordemServico.servico_realizado && ordemServico.tipo_servico !== "preventiva"
            ? `
          <div class="text-section">
            <h3>Serviço Realizado</h3>
            <p>${ordemServico.servico_realizado}</p>
          </div>
        `
            : ""
        }

        ${
          ordemServico.relatorio_visita
            ? `
          <div class="text-section">
            <h3>Relatório da Visita</h3>
            <p>${ordemServico.relatorio_visita}</p>
          </div>
        `
            : ""
        }

        ${
          ordemServico.observacoes && ordemServico.tipo_servico !== "preventiva"
            ? `
          <div class="text-section">
            <h3>Observações</h3>
            <p>${ordemServico.observacoes}</p>
          </div>
        `
            : ""
        }

        <!-- Equipamentos -->
        ${
          itens.length > 0
            ? `
          <div class="equipamentos-section">
            <div class="section-title">Equipamentos</div>
            <div class="equipamentos-list">
              ${itens
                .map(
                  (item) => `
                <div class="equipamento-item">
                  • ${item.equipamento_nome_atual || item.equipamento_nome}
                </div>
              `,
                )
                .join("")}
            </div>
          </div>
        `
            : ""
        }

        <!-- Fotos -->
        ${
          fotos.length > 0
            ? `
          <div class="fotos-section">
            <div class="section-title">Fotos do Serviço</div>
            <div class="fotos-grid">
              ${fotos
                .slice(0, 6)
                .map(
                  (foto) => `
                <div class="foto-item">
                  <img src="${getFotoCaminho(foto)}" alt="${foto.nome_arquivo}" />
                  <p>${foto.nome_arquivo}</p>
                </div>
              `,
                )
                .join("")}
            </div>
            ${fotos.length > 6 ? `<p style="font-size: 12px; text-align: center; margin-top: 8px;">E mais ${fotos.length - 6} foto(s)...</p>` : ""}
          </div>
        `
            : ""
        }

        <!-- Responsável -->
        ${
          ordemServico.responsavel || ordemServico.nome_responsavel
            ? `
          <div class="section">
            <div class="section-title">Responsável</div>
            ${ordemServico.responsavel ? `<div class="info-line"><strong>Responsável:</strong> ${ordemServico.responsavel}</div>` : ""}
            ${ordemServico.nome_responsavel ? `<div class="info-line"><strong>Nome:</strong> ${ordemServico.nome_responsavel}</div>` : ""}
          </div>
        `
            : ""
        }

        <!-- Assinatura -->
        <div class="assinaturas-section">
            <div class="section-title">Assinatura</div>
            <div class="assinatura-item">
                <h4>Responsável do Cliente</h4>
                <div class="assinatura-box">
                    ${assinaturaResponsavel ? `<img src="${getAssinaturaCaminho(assinaturaResponsavel)}" alt="Assinatura Cliente" />` : ""}
                </div>
                <div class="assinatura-info">
                    ${ordemServico.nome_responsavel || ordemServico.responsavel || "Nome do Responsável"}
                    ${assinaturaResponsavel ? `<br>Assinado em: ${new Date(assinaturaResponsavel.data_assinatura).toLocaleString("pt-BR")}` : ""}
                </div>
            </div>
        </div>

        <!-- Rodapé -->
        ${
          timbradoConfig?.rodape
            ? `
          <div class="page-footer">
            ${timbradoConfig.rodape}
          </div>
        `
            : ""
        }
    </div>
</body>
</html>
    `
  }

  const handlePrintNewWindow = () => {
    const htmlContent = gerarHTMLCompleto()
    const printWindow = window.open("", "_blank")

    if (printWindow) {
      printWindow.document.write(htmlContent)
      printWindow.document.close()

      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print()
        }, 1000)
      }
    }
  }

  const handlePreview = () => {
    const htmlContent = gerarHTMLCompleto()
    const previewWindow = window.open("", "_blank")

    if (previewWindow) {
      previewWindow.document.write(htmlContent)
      previewWindow.document.close()
    }
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 shadow-xl">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-3">Carregando...</span>
          </div>
        </div>
      </div>
    )
  }

  const assinaturaResponsavel = getAssinaturaResponsavel()

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div
        ref={modalRef}
        className="bg-white rounded-lg shadow-2xl flex flex-col relative"
        style={{
          width: `${size.width}px`,
          height: `${size.height}px`,
          maxWidth: "95vw",
          maxHeight: "95vh",
        }}
      >
        {/* Resize Handles */}
        <div
          className="absolute top-0 left-8 right-8 h-2 cursor-ns-resize hover:bg-blue-500/20 transition-colors z-10"
          onMouseDown={(e) => handleMouseDown(e, "n")}
        />
        <div
          className="absolute bottom-0 left-8 right-8 h-2 cursor-ns-resize hover:bg-blue-500/20 transition-colors z-10"
          onMouseDown={(e) => handleMouseDown(e, "s")}
        />
        <div
          className="absolute right-0 top-8 bottom-8 w-2 cursor-ew-resize hover:bg-blue-500/20 transition-colors z-10"
          onMouseDown={(e) => handleMouseDown(e, "e")}
        />
        <div
          className="absolute left-0 top-8 bottom-8 w-2 cursor-ew-resize hover:bg-blue-500/20 transition-colors z-10"
          onMouseDown={(e) => handleMouseDown(e, "w")}
        />
        <div
          className="absolute top-0 right-0 w-4 h-4 cursor-ne-resize hover:bg-blue-500/30 transition-colors z-10 rounded-tr-lg"
          onMouseDown={(e) => handleMouseDown(e, "ne")}
        />
        <div
          className="absolute top-0 left-0 w-4 h-4 cursor-nw-resize hover:bg-blue-500/30 transition-colors z-10 rounded-tl-lg"
          onMouseDown={(e) => handleMouseDown(e, "nw")}
        />
        <div
          className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize hover:bg-blue-500/30 transition-colors z-10 rounded-br-lg"
          onMouseDown={(e) => handleMouseDown(e, "se")}
        />
        <div
          className="absolute bottom-0 left-0 w-4 h-4 cursor-sw-resize hover:bg-blue-500/30 transition-colors z-10 rounded-bl-lg"
          onMouseDown={(e) => handleMouseDown(e, "sw")}
        />

        {/* Header Fixo */}
        <div className="flex-shrink-0 px-6 py-4 border-b bg-white rounded-t-lg">
          <h2 className="text-xl font-semibold">Visualizar Ordem de Serviço - {ordemServico.numero}</h2>
        </div>

        {/* Conteúdo com Scroll */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="bg-white">
            <div className="mb-4">
              {(logoImpressao?.dados || logoImpressao?.caminho || timbradoConfig?.logo_url) && (
                <div className="text-center mb-4 pb-3 border-b-2 border-gray-800">
                  <img
                    src={
                      logoImpressao?.dados || logoImpressao?.caminho || timbradoConfig?.logo_url || "/placeholder.svg"
                    }
                    alt="Logo da Empresa"
                    className="mx-auto h-16 object-contain"
                  />
                </div>
              )}

              {timbradoConfig?.cabecalho && (
                <div
                  className="text-center mb-4 text-sm border-b-2 border-gray-800 pb-3"
                  dangerouslySetInnerHTML={{ __html: timbradoConfig.cabecalho }}
                />
              )}

              <div className="text-center mb-4 pb-3 border-b-2 border-gray-800">
                <h1 className="text-xl font-bold mb-1.5">ORDEM DE SERVIÇO Nº {ordemServico.numero}</h1>
                <p className="text-base">
                  Status: <strong>{getStatusLabel(ordemServico.situacao)}</strong>
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-3 pb-3 border-b border-gray-400">
                <div>
                  <h3 className="font-bold mb-2 underline text-lg">Dados do Cliente</h3>
                  <div className="space-y-1 text-sm">
                    <p>
                      <strong>Nome:</strong> {getClienteNome()}
                    </p>
                    {getClienteTelefone() && (
                      <p>
                        <strong>Telefone:</strong> {getClienteTelefone()}
                      </p>
                    )}
                    {getClienteEmail() && (
                      <p>
                        <strong>E-mail:</strong> {getClienteEmail()}
                      </p>
                    )}
                    {getClienteEndereco() && (
                      <p>
                        <strong>Endereço:</strong> {getClienteEndereco()}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="font-bold mb-2 underline text-lg">Dados da Ordem de Serviço</h3>
                  <div className="space-y-1 text-sm">
                    <p>
                      <strong>Data:</strong> {formatDate(ordemServico.data_atual)}
                    </p>
                    <p>
                      <strong>Tipo de Serviço:</strong> {getTipoServicoLabel(ordemServico.tipo_servico)}
                    </p>
                    <p>
                      <strong>Técnico:</strong> {ordemServico.tecnico_name || "Não informado"}
                    </p>
                    {ordemServico.data_agendamento && (
                      <p>
                        <strong>Data Agendamento:</strong> {formatDate(ordemServico.data_agendamento)}
                        {ordemServico.periodo_agendamento && (
                          <span className="ml-2 text-cyan-600 font-semibold">
                            ({ordemServico.periodo_agendamento === "manha" ? "Manhã" : "Tarde"})
                          </span>
                        )}
                      </p>
                    )}
                    {ordemServico.horario_entrada && (
                      <p>
                        <strong>Horário Entrada:</strong> {formatTime(ordemServico.horario_entrada)}
                      </p>
                    )}
                    {ordemServico.horario_saida && (
                      <p>
                        <strong>Horário Saída:</strong> {formatTime(ordemServico.horario_saida)}
                      </p>
                    )}
                    {ordemServico.solicitado_por && (
                      <p>
                        <strong>Solicitado por:</strong> {ordemServico.solicitado_por}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {ordemServico.descricao_defeito && ordemServico.tipo_servico !== "preventiva" && (
                <div className="mb-3 p-2 bg-gray-50 rounded border-b border-gray-400 pb-3">
                  <h3 className="font-bold mb-1.5 text-base">Descrição do Defeito</h3>
                  <p className="text-sm whitespace-pre-wrap leading-snug">{ordemServico.descricao_defeito}</p>
                </div>
              )}

              {ordemServico.necessidades_cliente && ordemServico.tipo_servico === "preventiva" && (
                <div className="mb-3 p-2 bg-gray-50 rounded border-b border-gray-400 pb-3">
                  <h3 className="font-bold mb-1.5 text-base">Necessidades do Cliente</h3>
                  <p className="text-sm whitespace-pre-wrap leading-snug">{ordemServico.necessidades_cliente}</p>
                </div>
              )}

              {ordemServico.servico_realizado && ordemServico.tipo_servico !== "preventiva" && (
                <div className="mb-3 p-2 bg-gray-50 rounded border-b border-gray-400 pb-3">
                  <h3 className="font-bold mb-1.5 text-base">Serviço Realizado</h3>
                  <p className="text-sm whitespace-pre-wrap leading-snug">{ordemServico.servico_realizado}</p>
                </div>
              )}

              {ordemServico.relatorio_visita && (
                <div className="mb-3 p-2 bg-gray-50 rounded border-b border-gray-400 pb-3">
                  <h3 className="font-bold mb-1.5 text-base">Relatório da Visita</h3>
                  <p className="text-sm whitespace-pre-wrap leading-snug">{ordemServico.relatorio_visita}</p>
                </div>
              )}

              {itens.length > 0 && (
                <div className="mb-3 pb-3 border-b border-gray-400">
                  <h3 className="font-bold mb-2 text-lg underline">Equipamentos</h3>
                  <div className="bg-gray-50 p-2 rounded">
                    {itens.map((item, index) => (
                      <div key={index} className="text-sm py-0.5 leading-snug">
                        • {item.equipamento_nome_atual || item.equipamento_nome}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {fotos.length > 0 && (
                <div className="mb-3 pb-3 border-b border-gray-400">
                  <h3 className="font-bold mb-2 text-lg underline">Fotos do Serviço</h3>
                  <div className="grid grid-cols-3 gap-2">
                    {fotos.slice(0, 6).map((foto, index) => (
                      <div key={index} className="text-center">
                        <img
                          src={getFotoCaminho(foto) || "/placeholder.svg"}
                          alt={foto.nome_arquivo}
                          className="w-full h-20 object-cover border rounded"
                        />
                        <p className="text-sm mt-1">{foto.nome_arquivo}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-4">
                <div className="text-center">
                  <h4 className="font-bold mb-2 text-base">Responsável do Cliente</h4>
                  <div className="border-2 border-black h-28 flex items-center justify-center mb-2 max-w-md mx-auto">
                    {assinaturaResponsavel && (
                      <img
                        src={getAssinaturaCaminho(assinaturaResponsavel) || "/placeholder.svg"}
                        alt="Assinatura Cliente"
                        className="max-h-24 max-w-[90%] object-contain"
                      />
                    )}
                  </div>
                  <p className="text-sm">
                    {ordemServico.nome_responsavel || ordemServico.responsavel || "Nome do Responsável"}
                  </p>
                  {assinaturaResponsavel && (
                    <p className="text-sm text-gray-600 mt-0.5">
                      Assinado em: {new Date(assinaturaResponsavel.data_assinatura).toLocaleString("pt-BR")}
                    </p>
                  )}
                </div>
              </div>

              {timbradoConfig?.rodape && (
                <div
                  className="text-center text-xs border-t-2 border-gray-800 pt-3 mt-4"
                  dangerouslySetInnerHTML={{ __html: timbradoConfig.rodape }}
                />
              )}
            </div>
          </div>
        </div>

        {/* Footer Fixo */}
        <div className="flex-shrink-0 px-6 py-4 border-t bg-gray-50 rounded-b-lg">
          <div className="flex items-center justify-end space-x-2">
            <Button onClick={handlePreview} variant="outline" className="bg-green-50 hover:bg-green-100">
              <Eye className="mr-2 h-4 w-4" />
              Visualizar
            </Button>
            <Button onClick={handlePrintNewWindow} className="bg-blue-600 hover:bg-blue-700">
              <Printer className="mr-2 h-4 w-4" />
              Imprimir
            </Button>
            <Button onClick={onClose} variant="outline">
              <X className="mr-2 h-4 w-4" />
              Fechar
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
