"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Printer, X } from "lucide-react"
import { formatCurrency, formatDate } from "@/lib/utils"

interface PropostaDetalhes {
  numero: string
  cliente_nome: string
  cliente_codigo: string
  cliente_endereco: string
  cliente_telefone: string
  cliente_email: string
  sindico: string
  tipo: string
  frequencia: string
  valor_total_proposta: number
  forma_pagamento: string
  prazo_contrato: number
  garantia: number
  observacoes: string
  data_proposta: string
  data_validade: string
  itens: any[]
  equipamentos_consignacao?: string
}

interface Equipamento {
  id: number
  nome: string
  categoria: string
}

interface ConfiguracaoLayout {
  empresa_nome: string
  empresa_cnpj: string
  empresa_endereco: string
  empresa_cep: string
  empresa_bairro: string
  empresa_cidade: string
  empresa_uf: string
  empresa_telefone: string
  empresa_email: string
  empresa_site: string
  empresa_representante_legal: string
  representante_nacionalidade: string
  representante_estado_civil: string
  representante_rg: string
  representante_cpf: string
  tamanho_papel: string
  orientacao: string
  margem_superior: number
  margem_inferior: number
  margem_esquerda: number
  margem_direita: number
  cabecalho: string
  rodape: string
  rodape_texto: string
}

interface Logo {
  id: number
  tipo: string
  nome: string
  url: string
  dados: string
}

interface PropostaPrintProps {
  proposta: PropostaDetalhes | null
  isOpen: boolean
  onClose: () => void
}

const CATEGORIAS = {
  basicos: "EQUIPAMENTOS BÁSICOS",
  portoes_veiculos: "PORTÕES DE VEÍCULOS",
  portoes_pedestre: "PORTÕES DE PEDESTRE",
  software_redes: "SOFTWARE E REDES",
}

export function PropostaPrint({ proposta, isOpen, onClose }: PropostaPrintProps) {
  const [equipamentos, setEquipamentos] = useState<Equipamento[]>([])
  const [configuracaoLayout, setConfiguracaoLayout] = useState<ConfiguracaoLayout | null>(null)
  const [logos, setLogos] = useState<Logo[]>([])
  const [modalSize, setModalSize] = useState({ width: 1400, height: 800 })
  const [isResizing, setIsResizing] = useState(false)
  const [resizeDirection, setResizeDirection] = useState<string>("")
  const startPos = useRef({ x: 0, y: 0 })
  const startSize = useRef({ width: 0, height: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isOpen) {
      loadEquipamentos()
      loadConfiguracaoLayout()
      loadLogos()
    }
  }, [isOpen])

  const loadEquipamentos = async () => {
    try {
      const response = await fetch("/api/equipamentos")
      const result = await response.json()
      if (result.success) {
        setEquipamentos(result.data || [])
      }
    } catch (error) {
      // Error handled silently
    }
  }

  const loadConfiguracaoLayout = async () => {
    try {
      const response = await fetch("/api/configuracoes/layout")
      const result = await response.json()
      if (result.success && result.data) {
        setConfiguracaoLayout(result.data)
      }
    } catch (error) {
      // Error handled silently
    }
  }

  const loadLogos = async () => {
    try {
      const response = await fetch("/api/configuracoes/logos")
      const result = await response.json()
      if (result.success) {
        const logosComUrl = result.data.map((logo: any) => ({
          ...logo,
          url: logo.dados || "/placeholder.svg",
        }))
        setLogos(logosComUrl)
      }
    } catch (error) {
      // Error handled silently
    } finally {
      setLoading(false)
    }
  }

  const handleMouseDown = (e: React.MouseEvent, direction: string) => {
    e.preventDefault()
    setIsResizing(true)
    setResizeDirection(direction)
    startPos.current = { x: e.clientX, y: e.clientY }
    startSize.current = { ...modalSize }
  }

  useEffect(() => {
    if (!isResizing) return

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - startPos.current.x
      const deltaY = e.clientY - startPos.current.y

      let newWidth = startSize.current.width
      let newHeight = startSize.current.height

      if (resizeDirection.includes("e")) {
        newWidth = startSize.current.width + deltaX
      }
      if (resizeDirection.includes("w")) {
        newWidth = startSize.current.width - deltaX
      }
      if (resizeDirection.includes("s")) {
        newHeight = startSize.current.height + deltaY
      }
      if (resizeDirection.includes("n")) {
        newHeight = startSize.current.height - deltaY
      }

      const minWidth = 800
      const minHeight = 600
      const maxWidth = window.innerWidth - 100
      const maxHeight = window.innerHeight - 100

      newWidth = Math.max(minWidth, Math.min(maxWidth, newWidth))
      newHeight = Math.max(minHeight, Math.min(maxHeight, newHeight))

      setModalSize({ width: newWidth, height: newHeight })
    }

    const handleMouseUp = () => {
      setIsResizing(false)
      setResizeDirection("")
    }

    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [isResizing, resizeDirection])

  const handlePrint = () => {
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Proposta ${proposta?.numero}</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            body {
              font-family: Arial, sans-serif;
              font-size: 11px;
              line-height: 1.3;
              color: #000;
              background: white;
            }
            
            .page-container {
              width: 100%;
              min-height: 100vh;
              display: flex;
              flex-direction: column;
            }
            
            .page-header {
              text-align: center;
              padding-bottom: 10px;
              border-bottom: 2px solid #000;
              margin-bottom: 12px;
            }
            
            .logo {
              max-height: 60px;
              margin-bottom: 6px;
            }
            
            .company-description {
              font-size: 9px;
              margin-bottom: 8px;
              line-height: 1.2;
            }
            
            .proposta-title {
              font-size: 14px;
              font-weight: bold;
              margin-bottom: 8px;
            }
            
            .page-content {
              flex: 1;
            }
            
            .section {
              margin-bottom: 8px;
            }
            
            .section-title {
              font-size: 10px;
              font-weight: bold;
              margin-bottom: 5px;
              padding: 4px 8px;
              text-decoration: underline;
              background-color: #f8f9fa;
              border-left: 3px solid #0066cc;
            }
            
            .two-columns {
              display: flex;
              gap: 15px;
              margin-bottom: 10px;
            }
            
            .column {
              flex: 1;
            }
            
            .info-line {
              margin-bottom: 2px;
              font-size: 9px;
            }
            
            .info-line strong {
              font-weight: bold;
            }
            
            .equipamentos-section {
              border-top: 1px solid #000;
              padding-top: 8px;
              margin-top: 8px;
            }
            
            .equipamentos-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 10px;
              font-size: 9px;
              line-height: 1.3;
            }
            
            .categoria-section {
              margin-bottom: 8px;
            }
            
            .categoria-title {
              font-weight: bold;
              margin-bottom: 3px;
              font-size: 9px;
            }
            
            .categoria-items {
              margin-left: 8px;
            }
            
            .categoria-items div {
              margin-bottom: 2px;
            }
            
            .valor-total {
              text-align: center;
              font-size: 12px;
              font-weight: bold;
              background-color: #f0f0f0;
              padding: 6px;
              border: 1px solid #000;
              margin: 8px 0;
            }
            
            .conditions {
              font-size: 10px;
              line-height: 1.35;
              text-align: justify;
            }
            
            .condition-item {
              margin-bottom: 4px;
            }
            
            .condition-title {
              font-weight: bold;
              margin-bottom: 2px;
              font-size: 10px;
            }
            
            .condition-text {
              text-align: justify;
            }
            
            .condition-list {
              margin-left: 15px;
              margin-top: 2px;
            }
            
            .condition-list li {
              margin-bottom: 1px;
            }
            
            .page-footer {
              padding-top: 8px;
              border-top: 2px solid #000;
              text-align: center;
              font-size: 8px;
              font-weight: bold;
              page-break-inside: avoid;
              margin-top: auto;
            }
            
            @page {
              margin: ${configuracaoLayout ? `${configuracaoLayout.margem_superior}mm ${configuracaoLayout.margem_direita}mm ${configuracaoLayout.margem_inferior}mm ${configuracaoLayout.margem_esquerda}mm` : "12mm 8mm 12mm 8mm"};
              size: ${configuracaoLayout?.tamanho_papel || "A4"} ${configuracaoLayout?.orientacao === "paisagem" ? "landscape" : "portrait"};
            }
            
            @media print {
              body { 
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              .page-container { 
                min-height: 100vh;
                display: flex;
                flex-direction: column;
              }
              .page-header {
                flex-shrink: 0;
              }
              .page-content {
                flex: 1;
              }
              .page-footer {
                flex-shrink: 0;
                margin-top: auto;
              }
            }
          </style>
        </head>
        <body>
          <div class="page-container">
            <div class="page-header">
              ${logos.find((logo) => logo.tipo === "impressao") ? `<img src="${logos.find((logo) => logo.tipo === "impressao")?.url}" alt="Logo" class="logo">` : ""}
              ${configuracaoLayout?.cabecalho ? `<div class="company-description">${configuracaoLayout.cabecalho}</div>` : ""}
              <div class="proposta-title">PROPOSTA DE CONTRATO Nº ${proposta?.numero}</div>
            </div>

            <div class="page-content">
              <div class="two-columns">
                <div class="column">
                  <div class="section-title">DADOS DO CLIENTE</div>
                  <div class="info-line"><strong>Cliente:</strong> ${proposta?.cliente_nome}</div>
                  ${proposta?.cliente_endereco ? `<div class="info-line"><strong>Endereço:</strong> ${proposta.cliente_endereco}</div>` : ""}
                  ${proposta?.cliente_telefone ? `<div class="info-line"><strong>Telefone:</strong> ${proposta.cliente_telefone}</div>` : ""}
                  ${proposta?.cliente_email ? `<div class="info-line"><strong>E-mail:</strong> ${proposta.cliente_email}</div>` : ""}
                  <div class="info-line"><strong>A/C Sr(a):</strong> ${proposta?.sindico || "Síndico"}</div>
                  <div class="info-line" style="margin-top: 5px; padding-top: 5px; border-top: 1px solid #ccc;">
                    <strong>Data:</strong> ${formatDate(proposta?.data_proposta || "")}
                  </div>
                  ${proposta?.data_validade ? `<div class="info-line"><strong>Validade:</strong> ${formatDate(proposta.data_validade)}</div>` : ""}
                </div>
                <div class="column">
                  <div class="section-title">DADOS DA EMPRESA</div>
                  ${configuracaoLayout?.empresa_nome ? `<div class="info-line"><strong>Empresa:</strong> ${configuracaoLayout.empresa_nome}</div>` : ""}
                  ${configuracaoLayout?.empresa_cnpj ? `<div class="info-line"><strong>CNPJ:</strong> ${configuracaoLayout.empresa_cnpj}</div>` : ""}
                  ${configuracaoLayout?.empresa_endereco ? `<div class="info-line"><strong>Endereço:</strong> ${configuracaoLayout.empresa_endereco}</div>` : ""}
                  ${configuracaoLayout?.empresa_cidade && configuracaoLayout?.empresa_uf ? `<div class="info-line"><strong>Cidade:</strong> ${configuracaoLayout.empresa_cidade} - ${configuracaoLayout.empresa_uf}</div>` : ""}
                  ${configuracaoLayout?.empresa_telefone ? `<div class="info-line"><strong>Telefone:</strong> ${configuracaoLayout.empresa_telefone}</div>` : ""}
                  ${configuracaoLayout?.empresa_email ? `<div class="info-line"><strong>E-mail:</strong> ${configuracaoLayout.empresa_email}</div>` : ""}
                </div>
              </div>

              <div class="equipamentos-section">
                <div class="section-title">Equipamentos Inclusos</div>
                <div class="equipamentos-grid">
                  ${Object.entries(getEquipamentosPorCategoria())
                    .map(
                      ([categoria, itens]) => `
                    <div class="categoria-section">
                      <div class="categoria-title">
                        ${CATEGORIAS[categoria as keyof typeof CATEGORIAS] || categoria.toUpperCase()}:
                      </div>
                      <div class="categoria-items">
                        ${itens
                          .map(
                            (item) => `
                          <div>${item.quantidade}x ${item.nome}</div>
                        `,
                          )
                          .join("")}
                      </div>
                    </div>
                  `,
                    )
                    .join("")}
                </div>
              </div>

              <div class="valor-total">
                VALOR TOTAL DA PROPOSTA: ${formatCurrency(proposta?.valor_total_proposta || 0)}
              </div>

              <div class="section">
                <div class="section-title">Condições Gerais do Contrato</div>
                <div class="conditions">
                  <div class="condition-item">
                    <div class="condition-title">1. VISITAS MENSAIS:</div>
                    <div class="condition-text">
                      O presente contrato compreende <strong>01 (uma) visita mensal</strong>, realizada <strong>em horário comercial</strong>, com o objetivo de verificar o funcionamento dos equipamentos, realizar <strong>limpeza e lubrificação preventiva</strong>. 
                      Caso seja constatada a necessidade de substituição de alguma peça, a CONTRATANTE será <strong>comunicada previamente</strong>, e a troca somente será efetuada <strong>mediante autorização expressa</strong>, sendo o valor da peça e do serviço cobrados à parte.
                    </div>
                  </div>

                  <div class="condition-item">
                    <div class="condition-title">2. VISITAS EMERGENCIAIS:</div>
                    <div class="condition-text">
                      Chamados efetuados <strong>dentro do horário comercial</strong> serão <strong>atendidos no mesmo dia</strong>. Chamados realizados <strong>após o horário comercial</strong> serão atendidos <strong>em até 15 (quinze) horas</strong> após o registro do chamado. Nos casos de <strong>finais de semana e feriados</strong>, este prazo poderá <strong>sofrer variação</strong>, conforme disponibilidade técnica.
                    </div>
                  </div>

                  <div class="condition-item">
                    <div class="condition-title">3. MÃO DE OBRA:</div>
                    <div class="condition-text">
                      O presente contrato <strong>não inclui serviços de mão de obra</strong> referentes a:
                    </div>
                    <ul class="condition-list">
                      <li>Equipamentos que não possuam manutenção pelo fabricante; ou</li>
                      <li>Instalação de novos equipamentos.</li>
                    </ul>
                    <div class="condition-text">
                      Nessas hipóteses, o condomínio fará jus a um <strong>desconto de 50% (cinquenta por cento)</strong> sobre o valor da mão de obra praticado pela CONTRATADA.
                    </div>
                  </div>

                  <div class="condition-item">
                    <div class="condition-title">4. GARANTIA E RESPONSABILIDADE:</div>
                    <div class="condition-text">
                      A CONTRATADA se compromete a prestar os serviços contratados com <strong>zelo, segurança e observância das normas técnicas aplicáveis</strong>, responsabilizando-se pela <strong>qualidade dos serviços executados</strong> e pela <strong>integridade dos equipamentos durante o período de manutenção</strong>.
                    </div>
                    <div class="condition-text" style="margin-top: 3px;">
                      A CONTRATADA <strong>não se responsabiliza por danos decorrentes</strong> de mau uso, vandalismo, descargas elétricas, quedas de energia, intempéries climáticas ou intervenções realizadas por terceiros não autorizados pela CONTRATADA.
                    </div>
                    <div class="condition-text" style="margin-top: 3px;">
                      As peças substituídas terão <strong>garantia de fábrica, conforme condições do fabricante</strong>, sendo de responsabilidade da CONTRATANTE providenciar as condições adequadas de uso e conservação dos equipamentos.
                    </div>
                  </div>

                  ${
                    proposta?.equipamentos_consignacao
                      ? `
                    <div class="condition-item">
                      <div class="condition-title">5. EQUIPAMENTOS EM CONSIGNAÇÃO:</div>
                      <div class="condition-text">
                        Caso o contrato seja firmado nas condições de consignação, os equipamentos consignados serão <strong>instalados pela CONTRATADA</strong> e permanecerão sob essa condição até o <strong>término do prazo contratual</strong>. 
                        Em caso de renovação do contrato, os referidos equipamentos passarão automaticamente à <strong>posse do condomínio, sem ônus adicional</strong>.
                      </div>
                      <div class="condition-text" style="margin-top: 3px; background-color: #fef3c7; padding: 4px; border-left: 3px solid #f59e0b;">
                        <strong>Equipamentos:</strong> ${proposta.equipamentos_consignacao}
                      </div>
                    </div>
                  `
                      : ""
                  }
                </div>
              </div>

              <div class="section" style="border-top: 2px solid #000; padding-top: 8px; margin-top: 8px;">
                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; font-size: 11px; line-height: 1.4;">
                  <div><strong>Validade da proposta:</strong> 30 dias</div>
                  <div><strong>Forma de pagamento:</strong> ${proposta?.forma_pagamento || ""}</div>
                  <div><strong>Garantia:</strong> ${proposta?.garantia || 0} dias</div>
                  <div style="grid-column: 1;"><strong>Prazo do contrato:</strong> ${proposta?.prazo_contrato || 0} meses</div>
                  <div style="grid-column: 2 / 4;"><strong>Início dos serviços:</strong> Após assinatura do contrato e primeira mensalidade</div>
                </div>
              </div>

              ${
                proposta?.observacoes
                  ? `
                <div class="section">
                  <div class="section-title">OBSERVAÇÕES:</div>
                  <div style="font-size: 9px; line-height: 1.3;">${proposta.observacoes}</div>
                </div>
              `
                  : ""
              }
            </div>

            ${
              configuracaoLayout && (configuracaoLayout.rodape || configuracaoLayout.rodape_texto)
                ? `
              <div class="page-footer">
                ${configuracaoLayout.rodape ? `<div>${configuracaoLayout.rodape}</div>` : ""}
                ${configuracaoLayout.rodape_texto ? `<div style="margin-top: 3px;">${configuracaoLayout.rodape_texto}</div>` : ""}
              </div>
            `
                : ""
            }
          </div>
        </body>
      </html>
    `
    const printWindow = window.open("", "_blank")
    if (printWindow) {
      printWindow.document.write(printContent)
      printWindow.document.close()
      printWindow.print()
      printWindow.close()
    }
  }

  const getEquipamentosPorCategoria = () => {
    if (!proposta || !equipamentos.length) return {}

    const equipamentosPorCategoria: { [key: string]: any[] } = {}

    proposta.itens.forEach((item) => {
      const equipamento = equipamentos.find((eq) => eq.id === item.equipamento_id)
      if (equipamento) {
        const categoria = equipamento.categoria
        if (!equipamentosPorCategoria[categoria]) {
          equipamentosPorCategoria[categoria] = []
        }
        equipamentosPorCategoria[categoria].push({
          ...item,
          nome: equipamento.nome,
        })
      }
    })

    return equipamentosPorCategoria
  }

  const logoImpressao = logos.find((logo) => logo.tipo === "impressao")

  if (!proposta) return null

  const equipamentosPorCategoria = getEquipamentosPorCategoria()

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent
          className="p-0 gap-0 overflow-hidden print:hidden"
          style={{
            width: `${modalSize.width}px`,
            height: `${modalSize.height}px`,
            maxWidth: "none",
            maxHeight: "none",
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

          {/* Header fixo */}
          <DialogHeader className="px-6 py-4 border-b shrink-0">
            <DialogTitle>Visualizar Proposta para Impressão</DialogTitle>
          </DialogHeader>

          {/* Conteúdo scrollável */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            <div className="bg-white text-black min-h-[297mm] flex flex-col">
              {/* Cabeçalho fixo no topo */}
              <div className="mb-3 pb-3 border-b-2 border-black flex-shrink-0">
                {logoImpressao && (
                  <div className="text-center mb-2">
                    <img
                      src={logoImpressao.url || "/placeholder.svg"}
                      alt="Logo da empresa"
                      className="mx-auto max-h-14 object-contain"
                    />
                  </div>
                )}

                {configuracaoLayout?.cabecalho && (
                  <div className="text-center mb-2 font-medium text-[9px]">{configuracaoLayout.cabecalho}</div>
                )}

                <div className="text-center mb-2">
                  <h1 className="text-sm font-bold mb-1">PROPOSTA DE CONTRATO Nº {proposta.numero}</h1>
                </div>
              </div>

              {/* Conteúdo principal */}
              <div className="flex-1 p-4 text-[10px] leading-snug">
                {/* Dados do Cliente e Empresa */}
                <div className="mb-3 grid grid-cols-2 gap-3">
                  <div>
                    <h2 className="text-[10px] font-bold mb-1 border-b border-gray-300 pb-1 bg-blue-50 px-2 py-1 border-l-[3px] border-l-blue-500">
                      DADOS DO CLIENTE
                    </h2>
                    <div className="text-[9px] space-y-0.5">
                      <div>
                        <strong>Cliente:</strong> {proposta.cliente_nome}
                      </div>
                      {proposta.cliente_endereco && (
                        <div>
                          <strong>Endereço:</strong> {proposta.cliente_endereco}
                        </div>
                      )}
                      {proposta.cliente_telefone && (
                        <div>
                          <strong>Telefone:</strong> {proposta.cliente_telefone}
                        </div>
                      )}
                      {proposta.cliente_email && (
                        <div>
                          <strong>E-mail:</strong> {proposta.cliente_email}
                        </div>
                      )}
                      <div>
                        <strong>A/C Sr(a):</strong> {proposta.sindico || "Síndico"}
                      </div>
                      <div className="mt-1.5 pt-1.5 border-t border-gray-200">
                        <div>
                          <strong>Data:</strong> {formatDate(proposta.data_proposta)}
                        </div>
                        {proposta.data_validade && (
                          <div>
                            <strong>Validade:</strong> {formatDate(proposta.data_validade)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div>
                    <h2 className="text-[10px] font-bold mb-1 border-b border-gray-300 pb-1 bg-blue-50 px-2 py-1 border-l-[3px] border-l-blue-500">
                      DADOS DA EMPRESA
                    </h2>
                    {configuracaoLayout ? (
                      <div className="text-[9px] space-y-0.5">
                        {configuracaoLayout.empresa_nome && (
                          <div>
                            <strong>Empresa:</strong> {configuracaoLayout.empresa_nome}
                          </div>
                        )}
                        {configuracaoLayout.empresa_cnpj && (
                          <div>
                            <strong>CNPJ:</strong> {configuracaoLayout.empresa_cnpj}
                          </div>
                        )}
                        {configuracaoLayout.empresa_endereco && (
                          <div>
                            <strong>Endereço:</strong> {configuracaoLayout.empresa_endereco}
                          </div>
                        )}
                        {configuracaoLayout.empresa_cidade && configuracaoLayout.empresa_uf && (
                          <div>
                            <strong>Cidade:</strong> {configuracaoLayout.empresa_cidade} -{" "}
                            {configuracaoLayout.empresa_uf}
                          </div>
                        )}
                        {configuracaoLayout.empresa_telefone && (
                          <div>
                            <strong>Telefone:</strong> {configuracaoLayout.empresa_telefone}
                          </div>
                        )}
                        {configuracaoLayout.empresa_email && (
                          <div>
                            <strong>E-mail:</strong> {configuracaoLayout.empresa_email}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-[9px] text-gray-500">Configurações não encontradas</div>
                    )}
                  </div>
                </div>

                {/* Equipamentos Inclusos */}
                <div className="mb-3 pt-2 border-t border-black">
                  <h2 className="text-[10px] font-bold mb-1 border-b border-gray-300 pb-1 underline bg-purple-50 px-2 py-1 border-l-[3px] border-l-purple-500">
                    Equipamentos Inclusos
                  </h2>
                  <div className="text-[9px] leading-tight space-y-2 grid grid-cols-2 gap-2">
                    {Object.entries(equipamentosPorCategoria).map(([categoria, itens]) => (
                      <div key={categoria}>
                        <div className="font-bold mb-0.5 text-[9px]">
                          {CATEGORIAS[categoria as keyof typeof CATEGORIAS] || categoria.toUpperCase()}:
                        </div>
                        <div className="ml-2 space-y-0.5">
                          {itens.map((item, index) => (
                            <div key={index}>
                              {item.quantidade}x {item.nome}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Valor Total */}
                <div className="mb-3">
                  <div className="text-center text-xs font-bold bg-gray-100 p-1.5 border">
                    VALOR TOTAL DA PROPOSTA: {formatCurrency(proposta.valor_total_proposta)}
                  </div>
                </div>

                {/* Condições Gerais do Contrato */}
                <div className="mb-3">
                  <h2 className="text-[10px] font-bold mb-1 underline bg-gray-50 px-2 py-1 border-l-[3px] border-l-gray-500">
                    Condições Gerais do Contrato
                  </h2>
                  <div className="text-[10px] leading-tight space-y-1 text-justify">
                    <div>
                      <div className="font-bold mb-0.5 text-[10px]">1. VISITAS MENSAIS:</div>
                      <div>
                        O presente contrato compreende <strong>01 (uma) visita mensal</strong>, realizada{" "}
                        <strong>em horário comercial</strong>, com o objetivo de verificar o funcionamento dos
                        equipamentos, realizar <strong>limpeza e lubrificação preventiva</strong>. Caso seja constatada
                        a necessidade de substituição de alguma peça, a CONTRATANTE será{" "}
                        <strong>comunicada previamente</strong>, e a troca somente será efetuada{" "}
                        <strong>mediante autorização expressa</strong>, sendo o valor da peça e do serviço cobrados à
                        parte.
                      </div>
                    </div>

                    <div>
                      <div className="font-bold mb-0.5 text-[10px]">2. VISITAS EMERGENCIAIS:</div>
                      <div>
                        Chamados efetuados <strong>dentro do horário comercial</strong> serão{" "}
                        <strong>atendidos no mesmo dia</strong>. Chamados realizados{" "}
                        <strong>após o horário comercial</strong> serão atendidos{" "}
                        <strong>em até 15 (quinze) horas</strong> após o registro do chamado. Nos casos de{" "}
                        <strong>finais de semana e feriados</strong>, este prazo poderá <strong>sofrer variação</strong>
                        , conforme disponibilidade técnica.
                      </div>
                    </div>

                    <div>
                      <div className="font-bold mb-0.5 text-[10px]">3. MÃO DE OBRA:</div>
                      <div>
                        O presente contrato <strong>não inclui serviços de mão de obra</strong> referentes a:
                      </div>
                      <ul className="ml-4 list-disc">
                        <li>Equipamentos que não possuam manutenção pelo fabricante; ou</li>
                        <li>Instalação de novos equipamentos.</li>
                      </ul>
                      <div>
                        Nessas hipóteses, o condomínio fará jus a um{" "}
                        <strong>desconto de 50% (cinquenta por cento)</strong> sobre o valor da mão de obra praticado
                        pela CONTRATADA.
                      </div>
                    </div>

                    <div>
                      <div className="font-bold mb-0.5 text-[10px]">4. GARANTIA E RESPONSABILIDADE:</div>
                      <div>
                        A CONTRATADA se compromete a prestar os serviços contratados com{" "}
                        <strong>zelo, segurança e observância das normas técnicas aplicáveis</strong>,
                        responsabilizando-se pela <strong>qualidade dos serviços executados</strong> e pela{" "}
                        <strong>integridade dos equipamentos durante o período de manutenção</strong>.
                      </div>
                      <div className="mt-1">
                        A CONTRATADA <strong>não se responsabiliza por danos decorrentes</strong> de mau uso,
                        vandalismo, descargas elétricas, quedas de energia, intempéries climáticas ou intervenções
                        realizadas por terceiros não autorizados pela CONTRATADA.
                      </div>
                      <div className="mt-1">
                        As peças substituídas terão{" "}
                        <strong>garantia de fábrica, conforme condições do fabricante</strong>, sendo de
                        responsabilidade da CONTRATANTE providenciar as condições adequadas de uso e conservação dos
                        equipamentos.
                      </div>
                    </div>

                    {proposta.equipamentos_consignacao && (
                      <div>
                        <div className="font-bold mb-0.5 text-[10px]">5. EQUIPAMENTOS EM CONSIGNAÇÃO:</div>
                        <div>
                          Caso o contrato seja firmado nas condições de consignação, os equipamentos consignados serão{" "}
                          <strong>instalados pela CONTRATADA</strong> e permanecerão sob essa condição até o{" "}
                          <strong>término do prazo contratual</strong>. Em caso de renovação do contrato, os referidos
                          equipamentos passarão automaticamente à{" "}
                          <strong>posse do condomínio, sem ônus adicional</strong>.
                        </div>
                        <div className="mt-1 bg-amber-50 border border-amber-200 rounded p-1.5">
                          <strong>Equipamentos:</strong> {proposta.equipamentos_consignacao}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Informações do Contrato */}
                <div className="mb-3 border-t-2 border-black pt-2 mt-2">
                  <div className="grid grid-cols-3 gap-2 text-[11px] leading-tight">
                    <div>
                      <strong>Validade da proposta:</strong> 30 dias
                    </div>
                    <div>
                      <strong>Forma de pagamento:</strong> {proposta.forma_pagamento}
                    </div>
                    <div>
                      <strong>Garantia:</strong> {proposta.garantia} dias
                    </div>
                    <div>
                      <strong>Prazo do contrato:</strong> {proposta.prazo_contrato} meses
                    </div>
                    <div className="col-span-2">
                      <strong>Início dos serviços:</strong> Após assinatura do contrato e primeira mensalidade
                    </div>
                  </div>
                </div>

                {/* Observações */}
                {proposta.observacoes && (
                  <div className="mb-3">
                    <h3 className="text-[10px] font-bold mb-0.5 bg-blue-50 px-2 py-1 border-l-[3px] border-l-blue-500">
                      OBSERVAÇÕES:
                    </h3>
                    <div className="text-[10px] leading-tight">{proposta.observacoes}</div>
                  </div>
                )}
              </div>

              {/* Rodapé fixo no final */}
              {configuracaoLayout && (configuracaoLayout.rodape || configuracaoLayout.rodape_texto) && (
                <div className="mt-auto pt-2 border-t-2 border-black flex-shrink-0">
                  <div className="text-center text-[8px] leading-tight space-y-0.5 font-bold">
                    {configuracaoLayout.rodape && <div>{configuracaoLayout.rodape}</div>}
                    {configuracaoLayout.rodape_texto && <div>{configuracaoLayout.rodape_texto}</div>}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Botões de Ação fixos */}
          <div className="flex justify-end gap-2 px-6 py-4 border-t shrink-0">
            <Button onClick={handlePrint} className="bg-blue-600 hover:bg-blue-700 text-white">
              <Printer className="h-4 w-4 mr-2" />
              Imprimir
            </Button>
            <Button onClick={onClose} variant="outline">
              <X className="h-4 w-4 mr-2" />
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Estilos de impressão */}
      <style jsx>{`
        @media print {
          * {
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          
          body * {
            visibility: hidden;
          }
          
          .print-only, .print-only * {
            visibility: visible;
          }
          
          .print-only {
            position: absolute;
            left: 0;
            top: 0;
            width: 100% !important;
            height: 100% !important;
          }
          
          .no-print, .print\\:hidden {
            display: none !important;
          }
          
          @page {
            margin: ${configuracaoLayout ? `${configuracaoLayout.margem_superior}mm ${configuracaoLayout.margem_direita}mm ${configuracaoLayout.margem_inferior}mm ${configuracaoLayout.margem_esquerda}mm` : "12mm 8mm 12mm 8mm"};
            size: ${configuracaoLayout?.tamanho_papel || "A4"} ${configuracaoLayout?.orientacao === "paisagem" ? "landscape" : "portrait"};
          }
        }
      `}</style>
    </>
  )
}
