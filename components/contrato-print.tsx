"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Printer, X, Eye } from "lucide-react"

interface ContratoPrintProps {
  contrato: any
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
  empresa_representante_legal?: string
  representante_nacionalidade?: string
  representante_estado_civil?: string
  representante_rg?: string
  representante_cpf?: string
}

interface LogoConfig {
  id: number
  tipo: string
  nome: string
  dados?: string
  formato?: string
  tamanho?: number
  ativo: boolean
}

export function ContratoPrint({ contrato, onClose }: ContratoPrintProps) {
  const [timbradoConfig, setTimbradoConfig] = useState<TimbradoConfig | null>(null)
  const [logoImpressao, setLogoImpressao] = useState<LogoConfig | null>(null)
  const [conteudoProcessado, setConteudoProcessado] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchConfiguracoes()
  }, [])

  useEffect(() => {
    if (timbradoConfig && contrato) {
      processarConteudo()
    }
  }, [timbradoConfig, contrato])

  const fetchConfiguracoes = async () => {
    try {
      const timbradoResponse = await fetch("/api/timbrado-config")
      const timbradoResult = await timbradoResponse.json()
      if (timbradoResult.success && timbradoResult.data) {
        setTimbradoConfig(timbradoResult.data)
      }

      const logoResponse = await fetch("/api/configuracoes/logos")
      const logoResult = await logoResponse.json()
      if (logoResult.success && logoResult.data) {
        const logoImpressaoEncontrado = logoResult.data.find(
          (logo: LogoConfig) => logo.tipo === "impressao" && logo.ativo && logo.dados,
        )
        setLogoImpressao(logoImpressaoEncontrado || null)
      }
    } catch (error) {
      console.error("Erro ao buscar configurações:", error)
    } finally {
      setLoading(false)
    }
  }

  const numeroParaExtenso = (valor: number): string => {
    if (valor === 0) return "zero"

    const unidades = ["", "um", "dois", "três", "quatro", "cinco", "seis", "sete", "oito", "nove"]
    const dezenas = ["", "", "vinte", "trinta", "quarenta", "cinquenta", "sessenta", "setenta", "oitenta", "noventa"]
    const especiais = [
      "dez",
      "onze",
      "doze",
      "treze",
      "quatorze",
      "quinze",
      "dezesseis",
      "dezessete",
      "dezoito",
      "dezenove",
    ]
    const centenas = [
      "",
      "cento",
      "duzentos",
      "trezentos",
      "quatrocentos",
      "quinhentos",
      "seiscentos",
      "setecentos",
      "oitocentos",
      "novecentos",
    ]

    const converterGrupo = (num: number): string => {
      if (num === 0) return ""
      if (num === 100) return "cem"

      let resultado = ""
      const c = Math.floor(num / 100)
      const d = Math.floor((num % 100) / 10)
      const u = num % 10

      if (c > 0) resultado += centenas[c]
      if (d === 1) {
        if (resultado) resultado += " e "
        resultado += especiais[u]
      } else {
        if (d > 0) {
          if (resultado) resultado += " e "
          resultado += dezenas[d]
        }
        if (u > 0) {
          if (resultado) resultado += " e "
          resultado += unidades[u]
        }
      }
      return resultado
    }

    let inteiro = Math.floor(valor)
    const centavos = Math.round((valor - inteiro) * 100)
    let resultado = ""

    if (inteiro >= 1000000) {
      const milhoes = Math.floor(inteiro / 1000000)
      resultado += converterGrupo(milhoes)
      resultado += milhoes === 1 ? " milhão" : " milhões"
      inteiro = inteiro % 1000000
      if (inteiro > 0) resultado += " e "
    }

    if (inteiro >= 1000) {
      const milhares = Math.floor(inteiro / 1000)
      if (resultado) resultado += " "
      resultado += converterGrupo(milhares) + " mil"
      inteiro = inteiro % 1000
      if (inteiro > 0) resultado += " e "
    }

    if (inteiro > 0) {
      if (resultado) resultado += " "
      resultado += converterGrupo(inteiro)
    }

    resultado += inteiro === 1 ? " real" : " reais"

    if (centavos > 0) {
      resultado += " e " + converterGrupo(centavos)
      resultado += centavos === 1 ? " centavo" : " centavos"
    }

    return resultado
  }

  const dataParaExtenso = (dataString: string): string => {
    if (!dataString) return ""

    const meses = [
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

    const data = new Date(dataString + "T00:00:00")
    const dia = data.getDate()
    const mes = data.getMonth()
    const ano = data.getFullYear()

    return `${dia} de ${meses[mes]} de ${ano}`
  }

  const processarConteudo = () => {
    if (!contrato.conteudo_contrato || !timbradoConfig) return

    let conteudo = contrato.conteudo_contrato

    conteudo = conteudo.replace(/\[EMPRESA_NOME\]/g, timbradoConfig.empresa_nome || "")
    conteudo = conteudo.replace(/\[EMPRESA_CNPJ\]/g, timbradoConfig.empresa_cnpj || "")
    conteudo = conteudo.replace(/\[EMPRESA_ENDERECO\]/g, timbradoConfig.empresa_endereco || "")
    conteudo = conteudo.replace(/\[EMPRESA_CEP\]/g, timbradoConfig.empresa_cep || "")
    conteudo = conteudo.replace(/\[EMPRESA_BAIRRO\]/g, timbradoConfig.empresa_bairro || "")
    conteudo = conteudo.replace(/\[EMPRESA_CIDADE\]/g, timbradoConfig.empresa_cidade || "")
    conteudo = conteudo.replace(/\[EMPRESA_UF\]/g, timbradoConfig.empresa_uf || "")
    conteudo = conteudo.replace(/\[EMPRESA_REPRESENTANTE_LEGAL\]/g, timbradoConfig.empresa_representante_legal || "")
    conteudo = conteudo.replace(/\[REPRESENTANTE_NACIONALIDADE\]/g, timbradoConfig.representante_nacionalidade || "")
    conteudo = conteudo.replace(/\[REPRESENTANTE_ESTADO_CIVIL\]/g, timbradoConfig.representante_estado_civil || "")
    conteudo = conteudo.replace(/\[REPRESENTANTE_RG\]/g, timbradoConfig.representante_rg || "")
    conteudo = conteudo.replace(/\[REPRESENTANTE_CPF\]/g, timbradoConfig.representante_cpf || "")

    conteudo = conteudo.replace(/\[NOME\]/g, contrato.cliente_nome || "")
    conteudo = conteudo.replace(/\[CNPJ\]/g, contrato.cliente_cnpj || contrato.cliente_cpf || "")
    conteudo = conteudo.replace(/\[ENDERECO\]/g, contrato.cliente_endereco || "")
    conteudo = conteudo.replace(/\[CEP\]/g, contrato.cliente_cep || "")
    conteudo = conteudo.replace(/\[BAIRRO\]/g, contrato.cliente_bairro || "")
    conteudo = conteudo.replace(/\[CIDADE\]/g, contrato.cliente_cidade || "")
    conteudo = conteudo.replace(/\[ESTADO\]/g, contrato.cliente_estado || "")
    conteudo = conteudo.replace(/\[SINDICO\]/g, contrato.cliente_sindico || "")
    conteudo = conteudo.replace(/\[RG_SINDICO\]/g, contrato.cliente_rg_sindico || "")
    conteudo = conteudo.replace(/\[CPF_SINDICO\]/g, contrato.cliente_cpf_sindico || "")

    conteudo = conteudo.replace(/\[PRAZO_CONTRATO\]/g, contrato.prazo_contrato?.toString() || "")
    conteudo = conteudo.replace(/\[DIA_VENCIMENTO\]/g, contrato.dia_vencimento?.toString() || "")
    conteudo = conteudo.replace(/\[DATA_INICIO\]/g, formatDate(contrato.data_inicio) || "")
    conteudo = conteudo.replace(/\[QUANTIDADE_VISITAS\]/g, contrato.quantidade_visitas?.toString() || "")

    const valorMensal = contrato.valor_mensal || 0
    const valorFormatado = formatCurrency(valorMensal)
    const valorExtenso = numeroParaExtenso(valorMensal)
    const valorCompleto = `${valorFormatado} (${valorExtenso})`
    conteudo = conteudo.replace(/\[VALOR_MENSAL\]/g, valorCompleto)

    let equipamentosTexto = ""
    if (contrato.equipamentos_inclusos && contrato.equipamentos_inclusos.length > 0) {
      const equipamentosFormatados = contrato.equipamentos_inclusos.map((eq: any) => {
        if (typeof eq === "object" && eq.nome) {
          const quantidade = eq.quantidade || 1
          return `${quantidade}x ${eq.nome}`
        }
        return `1x ${eq}`
      })
      equipamentosTexto = equipamentosFormatados.join("\n")
    } else {
      equipamentosTexto = "Equipamentos conforme especificado na proposta"
    }
    conteudo = conteudo.replace(/\[EQUIPAMENTOS_INCLUSOS\]/g, equipamentosTexto)

    // Adicionar equipamentos em consignação logo após os equipamentos inclusos
    if (contrato.equipamentos_consignacao && contrato.equipamentos_consignacao.trim()) {
      const consignacaoTexto = `\n\nEQUIPAMENTOS EM CONSIGNAÇÃO:\n${contrato.equipamentos_consignacao}`
      // Procurar pelo parágrafo dos equipamentos e adicionar após ele
      const equipamentosIndex = conteudo.indexOf(equipamentosTexto)
      if (equipamentosIndex !== -1) {
        const fimEquipamentos = equipamentosIndex + equipamentosTexto.length
        conteudo = conteudo.slice(0, fimEquipamentos) + consignacaoTexto + conteudo.slice(fimEquipamentos)
      }
    }

    const localData = `\n\n${timbradoConfig.empresa_cidade || "Local"}, ${dataParaExtenso(contrato.data_inicio)}\n\n`
    conteudo += localData

    setConteudoProcessado(conteudo)
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return ""
    return new Date(dateString + "T00:00:00").toLocaleDateString("pt-BR")
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value || 0)
  }

  const formatCNPJ = (cnpj: string) => {
    if (!cnpj) return ""
    const numeros = cnpj.replace(/\D/g, "")
    if (numeros.length === 14) {
      return numeros.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5")
    }
    return cnpj
  }

  const formatCPF = (cpf: string) => {
    if (!cpf) return ""
    const numeros = cpf.replace(/\D/g, "")
    if (numeros.length === 11) {
      return numeros.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")
    }
    return cpf
  }

  const formatRG = (rg: string) => {
    if (!rg) return ""
    const numeros = rg.replace(/\D/g, "")
    if (numeros.length >= 8) {
      return numeros.replace(/(\d{2})(\d{3})(\d{3})(\d{1})/, "$1.$2.$3-$4")
    }
    return rg
  }

  const dividirConteudoEmPaginas = (conteudo: string) => {
    const paginas = []

    const quebras = ["3. SERVIÇOS PRESTADOS:", "3. Manter", "2. Incluir", "CLÁUSULA DÉCIMA"]

    let conteudoRestante = conteudo
    const posicaoAtual = 0

    const pos1 = conteudoRestante.indexOf(quebras[0])
    if (pos1 !== -1) {
      paginas.push(conteudoRestante.substring(0, pos1).trim())
      conteudoRestante = conteudoRestante.substring(pos1)
    }

    const pos2 = conteudoRestante.indexOf(quebras[1])
    if (pos2 !== -1) {
      paginas.push(conteudoRestante.substring(0, pos2).trim())
      conteudoRestante = conteudoRestante.substring(pos2)
    }

    const pos3 = conteudoRestante.indexOf(quebras[2])
    if (pos3 !== -1) {
      paginas.push(conteudoRestante.substring(0, pos3).trim())
      conteudoRestante = conteudoRestante.substring(pos3)
    }

    const pos4 = conteudoRestante.indexOf(quebras[3])
    if (pos4 !== -1) {
      paginas.push(conteudoRestante.substring(0, pos4).trim())
      conteudoRestante = conteudoRestante.substring(pos4)
    }

    if (conteudoRestante.trim()) {
      paginas.push(conteudoRestante.trim())
    }

    if (paginas.length === 0) {
      const linhas = conteudo.split("\n")
      const linhasPorPagina = 40
      let paginaAtual = []

      for (let i = 0; i < linhas.length; i++) {
        paginaAtual.push(linhas[i])

        if (paginaAtual.length >= linhasPorPagina || i === linhas.length - 1) {
          paginas.push(paginaAtual.join("\n"))
          paginaAtual = []
        }
      }
    }

    return paginas
  }

  const gerarCabecalho = () => {
    const logoSrc = logoImpressao?.dados || timbradoConfig?.logo_url || ""

    return `
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
    `
  }

  const gerarRodape = () => {
    return timbradoConfig?.rodape
      ? `
      <div class="page-footer">
        ${timbradoConfig.rodape}
      </div>
    `
      : ""
  }

  const gerarHTMLCompleto = () => {
    const paginas = dividirConteudoEmPaginas(conteudoProcessado)

    let htmlPaginas = ""

    htmlPaginas += `
      <div class="page">
        ${gerarCabecalho()}
        
        <div class="titulo">
          <h1>CONTRATO DE CONSERVAÇÃO E PREVENÇÃO DOS EQUIPAMENTOS ELETRÔNICOS</h1>
          <p>Contrato Nº: <strong>${contrato.numero}</strong></p>
        </div>
        
        <div class="conteudo">
          ${paginas[0] || ""}
        </div>
        
        ${gerarRodape()}
      </div>
    `

    for (let i = 1; i < Math.min(paginas.length, 4); i++) {
      htmlPaginas += `
        <div class="page">
          ${gerarCabecalho()}
          
          <div class="conteudo-pagina">
            ${paginas[i]}
          </div>
          
          ${gerarRodape()}
        </div>
      `
    }

    if (paginas.length >= 5) {
      htmlPaginas += `
        <div class="page">
          ${gerarCabecalho()}
          
          <div class="conteudo-final">
            ${paginas[4]}
          </div>
          
          <div class="assinaturas">
            <div class="assinatura">
              <div class="linha-assinatura">
                <p class="nome-empresa">${timbradoConfig?.empresa_nome || "EMPRESA"}</p>
                <p class="info-empresa">CNPJ: ${formatCNPJ(timbradoConfig?.empresa_cnpj || "")}</p>
                <p class="representante">${timbradoConfig?.empresa_representante_legal || "Representante Legal"}</p>
                <p class="info-empresa">RG: ${formatRG(timbradoConfig?.representante_rg || "")}</p>
                <p class="info-empresa">CPF: ${formatCPF(timbradoConfig?.representante_cpf || "")}</p>
              </div>
            </div>
            
            <div class="assinatura">
              <div class="linha-assinatura">
                <p class="nome-empresa">${contrato.cliente_nome}</p>
                <p class="info-empresa">CNPJ: ${formatCNPJ(contrato.cliente_cnpj || contrato.cliente_cpf || "")}</p>
                ${
                  contrato.cliente_sindico
                    ? `
                  <p class="representante">${contrato.cliente_sindico}</p>
                  <p class="info-empresa">RG: ${formatRG(contrato.cliente_rg_sindico || "")}</p>
                  <p class="info-empresa">CPF: ${formatCPF(contrato.cliente_cpf_sindico || "")}</p>
                `
                    : ""
                }
              </div>
            </div>
          </div>
          
          ${gerarRodape()}
        </div>
      `
    } else if (paginas.length === 4) {
      htmlPaginas += `
        <div class="page">
          ${gerarCabecalho()}
          
          <div class="assinaturas">
            <div class="assinatura">
              <div class="linha-assinatura">
                <p class="nome-empresa">${timbradoConfig?.empresa_nome || "EMPRESA"}</p>
                <p class="info-empresa">CNPJ: ${formatCNPJ(timbradoConfig?.empresa_cnpj || "")}</p>
                <p class="representante">${timbradoConfig?.empresa_representante_legal || "Representante Legal"}</p>
                <p class="info-empresa">RG: ${formatRG(timbradoConfig?.representante_rg || "")}</p>
                <p class="info-empresa">CPF: ${formatCPF(timbradoConfig?.representante_cpf || "")}</p>
              </div>
            </div>
            
            <div class="assinatura">
              <div class="linha-assinatura">
                <p class="nome-empresa">${contrato.cliente_nome}</p>
                <p class="info-empresa">CNPJ: ${formatCNPJ(contrato.cliente_cnpj || contrato.cliente_cpf || "")}</p>
                ${
                  contrato.cliente_sindico
                    ? `
                  <p class="representante">${contrato.cliente_sindico}</p>
                  <p class="info-empresa">RG: ${formatRG(contrato.cliente_rg_sindico || "")}</p>
                  <p class="info-empresa">CPF: ${formatCPF(contrato.cliente_cpf_sindico || "")}</p>
                `
                    : ""
                }
              </div>
            </div>
          </div>
          
          ${gerarRodape()}
        </div>
      `
    }

    return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Contrato ${contrato.numero}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 0;
            background: white;
            color: black;
            font-size: 12px;
            line-height: 1.4;
        }
        
        .page {
            width: 21cm;
            min-height: 29.7cm;
            padding: 1.5cm;
            margin: 0 auto;
            background: white;
            box-sizing: border-box;
            page-break-after: always;
            display: flex;
            flex-direction: column;
            position: relative;
        }
        
        .page:last-child {
            page-break-after: avoid;
        }
        
        .page-header {
            text-align: center;
            margin-bottom: 20px;
            border-bottom: 1px solid #ccc;
            padding-bottom: 15px;
        }
        
        .logo img {
            max-height: 50px;
            width: auto;
        }
        
        .cabecalho-personalizado {
            margin-top: 10px;
            font-size: 10px;
            line-height: 1.3;
        }
        
        .titulo {
            text-align: center;
            margin-bottom: 25px;
        }
        
        .titulo h1 {
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 10px;
            line-height: 1.3;
        }
        
        .titulo p {
            font-size: 13px;
            margin: 5px 0;
        }
        
        .conteudo {
            flex: 1;
            font-size: 11px;
            line-height: 1.5;
            text-align: justify;
            white-space: pre-line;
            overflow: hidden;
        }
        
        .conteudo-pagina {
            flex: 1;
            font-size: 11px;
            line-height: 1.5;
            text-align: justify;
            white-space: pre-line;
            overflow: hidden;
        }
        
        .conteudo-final {
            flex: 1;
            font-size: 11px;
            line-height: 1.5;
            text-align: justify;
            white-space: pre-line;
            margin-bottom: 25px;
        }
        
        .assinaturas {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 40px;
            margin-top: auto;
            padding-top: 25px;
        }
        
        .assinatura {
            text-align: center;
        }
        
        .linha-assinatura {
            border-top: 2px solid black;
            padding-top: 15px;
            margin-top: 50px;
        }
        
        .nome-empresa {
            font-weight: bold;
            font-size: 11px;
            margin-bottom: 5px;
        }
        
        .info-empresa {
            font-size: 9px;
            margin: 2px 0;
        }
        
        .representante {
            font-size: 9px;
            font-weight: 500;
            margin: 8px 0 2px 0;
        }
        
        .page-footer {
            text-align: center;
            font-size: 9px;
            border-top: 1px solid #ccc;
            padding-top: 10px;
            margin-top: 20px;
            line-height: 1.3;
        }
        
        @media print {
            body {
                margin: 0;
                padding: 0;
            }
            
            .page {
                margin: 0;
                padding: 1cm;
                page-break-after: always;
            }
            
            .page:last-child {
                page-break-after: avoid;
            }
            
            .conteudo, .conteudo-pagina, .conteudo-final {
                font-size: 10px;
                line-height: 1.4;
            }
            
            .titulo h1 {
                font-size: 14px;
            }
            
            .titulo p {
                font-size: 12px;
            }
        }
        
        @media screen {
            .page {
                margin-bottom: 20px;
                box-shadow: 0 0 10px rgba(0,0,0,0.1);
            }
        }
    </style>
</head>
<body>
    ${htmlPaginas}
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
          printWindow.close()
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
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Carregando...</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Visualizar Contrato - {contrato.numero}</DialogTitle>
        </DialogHeader>

        <div className="bg-white p-8 border rounded-lg">
          <div className="mb-6">
            {(logoImpressao?.dados || timbradoConfig?.logo_url) && (
              <div className="text-center mb-6">
                <img
                  src={logoImpressao?.dados || timbradoConfig?.logo_url || "/placeholder.svg"}
                  alt="Logo da Empresa"
                  className="mx-auto h-16 object-contain"
                />
              </div>
            )}

            {timbradoConfig?.cabecalho && (
              <div
                className="text-center mb-6 text-sm border-b pb-4"
                dangerouslySetInnerHTML={{ __html: timbradoConfig.cabecalho }}
              />
            )}

            <div className="text-center mb-8">
              <h1 className="text-xl font-bold mb-2">
                CONTRATO DE CONSERVAÇÃO E PREVENÇÃO DOS EQUIPAMENTOS ELETRÔNICOS
              </h1>
              <p className="text-sm">
                Contrato Nº: <strong>{contrato.numero}</strong>
              </p>
            </div>

            {conteudoProcessado && (
              <div className="mb-8 text-sm leading-relaxed whitespace-pre-line text-justify max-h-96 overflow-y-auto border p-4">
                {conteudoProcessado}
              </div>
            )}

            <div className="mt-16 grid grid-cols-2 gap-12">
              <div className="text-center">
                <div className="border-t-2 border-black pt-4 mt-12">
                  <p className="font-bold text-sm">{timbradoConfig?.empresa_nome || "EMPRESA"}</p>
                  <p className="text-xs">CNPJ: {formatCNPJ(timbradoConfig?.empresa_cnpj || "")}</p>
                  <p className="text-xs font-medium mt-2">
                    {timbradoConfig?.empresa_representante_legal || "Representante Legal"}
                  </p>
                  <p className="text-xs">RG: {formatRG(timbradoConfig?.representante_rg || "")}</p>
                  <p className="text-xs">CPF: {formatCPF(timbradoConfig?.representante_cpf || "")}</p>
                </div>
              </div>

              <div className="text-center">
                <div className="border-t-2 border-black pt-4 mt-12">
                  <p className="font-bold text-sm">{contrato.cliente_nome}</p>
                  <p className="text-xs">CNPJ: {formatCNPJ(contrato.cliente_cnpj || contrato.cliente_cpf || "")}</p>
                  {contrato.cliente_sindico && (
                    <>
                      <p className="text-xs font-medium mt-2">{contrato.cliente_sindico}</p>
                      <p className="text-xs">RG: {formatRG(contrato.cliente_rg_sindico || "")}</p>
                      <p className="text-xs">CPF: {formatCPF(contrato.cliente_cpf_sindico || "")}</p>
                    </>
                  )}
                </div>
              </div>
            </div>

            {timbradoConfig?.rodape && (
              <div
                className="text-center text-xs border-t pt-4 mt-8"
                dangerouslySetInnerHTML={{ __html: timbradoConfig.rodape }}
              />
            )}
          </div>
        </div>

        <div className="flex items-center justify-end space-x-2 pt-4 border-t">
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
      </DialogContent>
    </Dialog>
  )
}
