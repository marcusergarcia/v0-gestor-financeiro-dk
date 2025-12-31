"use client"

interface OrcamentoPrintViewProps {
  orcamento: any
  timbradoConfig: any
  logoImpressao: any
  layoutConfig: any
  paginasPreview: string[]
  clienteCompleto: any
  onClose: () => void
}

export function OrcamentoPrintView({
  orcamento,
  timbradoConfig,
  logoImpressao,
  layoutConfig,
  paginasPreview,
  clienteCompleto,
}: OrcamentoPrintViewProps) {
  const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return "-"

    try {
      const dateOnly = dateString.split("T")[0].trim()
      const parts = dateOnly.split("-")
      if (parts.length !== 3) return "-"

      const [year, month, day] = parts

      if (!/^\d{4}$/.test(year) || !/^\d{2}$/.test(month) || !/^\d{2}$/.test(day)) {
        return "-"
      }

      return `${day}/${month}/${year}`
    } catch (error) {
      console.error("Erro ao formatar data:", error, dateString)
      return "-"
    }
  }

  const calcularDataValidade = () => {
    if (!orcamento) return ""

    try {
      const dataOrcamentoStr = orcamento.data_orcamento.split("T")[0]
      const [year, month, day] = dataOrcamentoStr.split("-").map(Number)

      const diasValidade = 30
      const totalDias = day + diasValidade

      const dataValidade = new Date(year, month - 1, totalDias)

      const validadeDay = String(dataValidade.getDate()).padStart(2, "0")
      const validadeMonth = String(dataValidade.getMonth() + 1).padStart(2, "0")
      const validadeYear = dataValidade.getFullYear()

      return `${validadeDay}/${validadeMonth}/${validadeYear}`
    } catch (error) {
      console.error("Erro ao calcular data de validade:", error)
      return "-"
    }
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

  const getClienteInfoForDisplay = () => {
    return {
      endereco: clienteCompleto?.endereco || orcamento.cliente_endereco,
      bairro: clienteCompleto?.bairro || orcamento.cliente_bairro,
      cidade: clienteCompleto?.cidade || orcamento.cliente_cidade,
      estado: clienteCompleto?.estado || orcamento.cliente_estado,
      sindico: clienteCompleto?.representante_legal || orcamento.cliente_representante_legal,
    }
  }

  const clienteInfo = getClienteInfoForDisplay()

  return (
    <div className="print-container">
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-container, .print-container * {
            visibility: visible;
          }
          .print-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .page {
            page-break-after: always;
          }
          .page:last-child {
            page-break-after: avoid;
          }
        }

        @page {
          margin: ${layoutConfig.marginTop}mm ${layoutConfig.pageMargin}mm ${layoutConfig.marginBottom}mm ${layoutConfig.pageMargin}mm;
          size: A4 portrait;
        }

        .print-container {
          font-family: Arial, sans-serif;
          background: white;
          color: black;
        }

        .page {
          width: 21cm;
          min-height: 29.7cm;
          margin: 0 auto 20px;
          background: white;
          box-shadow: 0 0 10px rgba(0,0,0,0.1);
          display: flex;
          flex-direction: column;
          position: relative;
          box-sizing: border-box;
          padding: ${layoutConfig.marginTop}mm ${layoutConfig.pageMargin}mm ${layoutConfig.marginBottom}mm ${layoutConfig.pageMargin}mm;
        }

        .page-header {
          text-align: center;
          margin-bottom: ${layoutConfig.contentMarginTop}mm;
          border-bottom: 1px solid #ccc;
          padding-bottom: 12px;
        }

        .page-header img {
          max-height: ${layoutConfig.logoSize}px;
          width: auto;
          margin: 0 auto;
        }

        .cabecalho-personalizado {
          margin-top: 8px;
          font-size: ${layoutConfig.headerFontSize}px;
          line-height: 1.3;
        }

        .page-content {
          flex: 1;
          font-size: ${layoutConfig.fontSize}px;
          line-height: ${layoutConfig.lineHeight};
          display: flex;
          flex-direction: column;
        }

        .page-content h3,
        .page-content p strong:only-child {
          font-size: 14px !important;
          font-weight: bold;
        }

        .page-content > p:first-of-type {
          font-size: 14px !important;
          font-weight: bold;
        }

        .titulo {
          text-align: center;
          margin-bottom: 10px;
        }

        .titulo h1 {
          font-size: ${layoutConfig.titleFontSize}px;
          font-weight: bold;
          margin-bottom: 4px;
          line-height: 1.2;
        }

        .separador-linha {
          width: 100%;
          height: 1px;
          background-color: #000;
          margin: 8px 0;
        }

        .info-section {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-bottom: 12px;
        }

        .info-column {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .section-title {
          font-size: ${layoutConfig.fontSize + 2}px;
          font-weight: bold;
          text-decoration: underline;
          margin-bottom: 5px;
        }

        .info-item {
          font-size: ${layoutConfig.fontSize}px;
          line-height: 1.3;
          margin-bottom: 2px;
        }

        .info-item strong {
          font-weight: bold;
        }

        .conteudo-texto {
          flex: 1;
          text-align: justify;
        }

        .data-local {
          font-size: 12px;
          margin-top: ${layoutConfig.contentMarginBottom}mm;
          margin-bottom: 0;
          text-align: left;
        }

        .page-footer {
          text-align: center;
          font-size: ${layoutConfig.footerFontSize}px;
          border-top: 1px solid #ccc;
          padding-top: 8px;
          margin-top: ${layoutConfig.contentMarginBottom}mm;
          line-height: 1.3;
        }

        .conteudo-texto .data-local {
          display: none;
        }

        @media screen {
          .page {
            margin-bottom: 20px;
          }
        }
      `}</style>

      {/* Primeira Página */}
      <div className="page">
        {/* Header */}
        {(layoutConfig.showLogo || layoutConfig.showHeader) && (
          <div className="page-header">
            {layoutConfig.showLogo && (logoImpressao?.dados || timbradoConfig?.logo_url) && (
              <img src={logoImpressao?.dados || timbradoConfig?.logo_url} alt="Logo da Empresa" />
            )}
            {layoutConfig.showHeader && timbradoConfig?.cabecalho && (
              <div className="cabecalho-personalizado" dangerouslySetInnerHTML={{ __html: timbradoConfig.cabecalho }} />
            )}
          </div>
        )}

        {/* Conteúdo da primeira página */}
        <div className="page-content">
          <div className="titulo">
            <h1>ORÇAMENTO {orcamento.numero}</h1>
          </div>

          <div className="separador-linha"></div>

          <div className="info-section">
            <div className="info-column">
              <h3 className="section-title">Dados do Cliente</h3>
              <div className="info-item">
                <strong>Nome:</strong> {orcamento.cliente_nome || ""}
              </div>
              {clienteInfo?.sindico && (
                <div className="info-item">
                  <strong>A/C Sr(a):</strong> {clienteInfo.sindico}
                </div>
              )}
              <div className="info-item">
                <strong>Data:</strong> {formatDate(orcamento.data_orcamento)}
              </div>
              <div className="info-item">
                <strong>Validade:</strong> {calcularDataValidade()}
              </div>
              {orcamento.cliente_email && (
                <div className="info-item">
                  <strong>E-mail:</strong> {orcamento.cliente_email}
                </div>
              )}
              {orcamento.cliente_cnpj && (
                <div className="info-item">
                  <strong>CNPJ:</strong> {orcamento.cliente_cnpj}
                </div>
              )}
              {orcamento.cliente_cpf && (
                <div className="info-item">
                  <strong>CPF:</strong> {orcamento.cliente_cpf}
                </div>
              )}
              {clienteInfo?.endereco && (
                <div className="info-item">
                  <strong>Endereço:</strong> {clienteInfo.endereco}
                </div>
              )}
              {clienteInfo?.bairro && (
                <div className="info-item">
                  <strong>Bairro:</strong> {clienteInfo.bairro}
                </div>
              )}
              {clienteInfo?.cidade && (
                <div className="info-item">
                  <strong>Cidade:</strong> {clienteInfo.cidade} - {clienteInfo.estado || ""}
                </div>
              )}
            </div>

            <div className="info-column">
              <h3 className="section-title">Dados do Orçamento</h3>
              <div className="info-item">
                <strong>Tipo de Serviço:</strong> {orcamento.tipo_servico || ""}
              </div>
              {orcamento.prazo_dias && (
                <div className="info-item">
                  <strong>Prazo:</strong> {orcamento.prazo_dias} dias úteis
                </div>
              )}
              {timbradoConfig?.empresa_representante_legal && (
                <div className="info-item">
                  <strong>Contato:</strong>{" "}
                  {timbradoConfig.empresa_representante_legal.split(" ").length > 1
                    ? timbradoConfig.empresa_representante_legal.split(" ")[0] +
                      " " +
                      timbradoConfig.empresa_representante_legal.split(" ").pop()
                    : timbradoConfig.empresa_representante_legal}
                </div>
              )}
              {timbradoConfig?.empresa_telefone && (
                <div className="info-item">
                  <strong>Telefone:</strong> {timbradoConfig.empresa_telefone}
                </div>
              )}
              {timbradoConfig?.empresa_email && (
                <div className="info-item">
                  <strong>E-mail:</strong> {timbradoConfig.empresa_email}
                </div>
              )}
            </div>
          </div>

          {orcamento.observacoes && (
            <div style={{ marginBottom: "12px", marginTop: "8px" }}>
              <h3 className="section-title">Observações</h3>
              <div className="info-item" style={{ whiteSpace: "pre-wrap" }}>
                {orcamento.observacoes}
              </div>
            </div>
          )}

          {/* Conteúdo da primeira quebra */}
          {paginasPreview[0] && (
            <div className="conteudo-texto" dangerouslySetInnerHTML={{ __html: paginasPreview[0] }} />
          )}
        </div>

        {/* Footer */}
        {layoutConfig.showFooter && timbradoConfig?.rodape && (
          <div className="page-footer" dangerouslySetInnerHTML={{ __html: timbradoConfig.rodape }} />
        )}
      </div>

      {/* Páginas Intermediárias */}
      {paginasPreview.slice(1, -1).map((paginaConteudo, index) => (
        <div key={index + 1} className="page">
          {/* Header */}
          {(layoutConfig.showLogo || layoutConfig.showHeader) && (
            <div className="page-header">
              {layoutConfig.showLogo && (logoImpressao?.dados || timbradoConfig?.logo_url) && (
                <img src={logoImpressao?.dados || timbradoConfig?.logo_url} alt="Logo da Empresa" />
              )}
              {layoutConfig.showHeader && timbradoConfig?.cabecalho && (
                <div
                  className="cabecalho-personalizado"
                  dangerouslySetInnerHTML={{ __html: timbradoConfig.cabecalho }}
                />
              )}
            </div>
          )}

          {/* Conteúdo */}
          <div className="page-content">
            <div className="conteudo-texto" dangerouslySetInnerHTML={{ __html: paginaConteudo }} />
          </div>

          {/* Footer */}
          {layoutConfig.showFooter && timbradoConfig?.rodape && (
            <div className="page-footer" dangerouslySetInnerHTML={{ __html: timbradoConfig.rodape }} />
          )}
        </div>
      ))}

      {/* Última Página */}
      {paginasPreview.length > 1 && (
        <div className="page">
          {/* Header */}
          {(layoutConfig.showLogo || layoutConfig.showHeader) && (
            <div className="page-header">
              {layoutConfig.showLogo && (logoImpressao?.dados || timbradoConfig?.logo_url) && (
                <img src={logoImpressao?.dados || timbradoConfig?.logo_url} alt="Logo da Empresa" />
              )}
              {layoutConfig.showHeader && timbradoConfig?.cabecalho && (
                <div
                  className="cabecalho-personalizado"
                  dangerouslySetInnerHTML={{ __html: timbradoConfig.cabecalho }}
                />
              )}
            </div>
          )}

          {/* Conteúdo */}
          <div className="page-content">
            <div
              className="conteudo-texto"
              dangerouslySetInnerHTML={{ __html: paginasPreview[paginasPreview.length - 1] }}
            />

            {/* Data no final da última página - ÚNICA OCORRÊNCIA */}
            <p className="data-local">
              {timbradoConfig?.empresa_cidade || "Local"}, {dataParaExtenso(orcamento.data_orcamento)}
            </p>
          </div>

          {/* Footer */}
          {layoutConfig.showFooter && timbradoConfig?.rodape && (
            <div className="page-footer" dangerouslySetInnerHTML={{ __html: timbradoConfig.rodape }} />
          )}
        </div>
      )}

      {/* Se houver apenas 1 página, adicionar data inline */}
      {paginasPreview.length === 1 && (
        <style>{`
          .page:first-child .page-content::after {
            content: "${timbradoConfig?.empresa_cidade || "Local"}, ${dataParaExtenso(orcamento.data_orcamento)}";
            display: block;
            margin-top: ${layoutConfig.contentMarginBottom}mm;
            font-size: 12px;
          }
        `}</style>
      )}
    </div>
  )
}
