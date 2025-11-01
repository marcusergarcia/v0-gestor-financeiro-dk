"use client"

interface ContratoPrintViewProps {
  contrato: any
  timbradoConfig: any
  logoImpressao: any
  layoutConfig: any
  paginasConteudo: string[]
  clienteCompleto: any
}

export function ContratoPrintView({
  contrato,
  timbradoConfig,
  logoImpressao,
  layoutConfig,
  paginasConteudo,
  clienteCompleto,
}: ContratoPrintViewProps) {
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

  const renderHeader = () => {
    if (!layoutConfig.showHeader && !layoutConfig.showLogo) return null

    const logoSrc = logoImpressao?.dados || timbradoConfig?.logo_url || ""

    return (
      <div className="page-header">
        {layoutConfig.showLogo && logoSrc && (
          <div className="logo">
            <img
              src={logoSrc || "/placeholder.svg"}
              alt="Logo da Empresa"
              style={{ maxHeight: `${layoutConfig.logoSize}px` }}
            />
          </div>
        )}

        {layoutConfig.showHeader && timbradoConfig?.cabecalho && (
          <div className="cabecalho-personalizado" dangerouslySetInnerHTML={{ __html: timbradoConfig.cabecalho }} />
        )}
      </div>
    )
  }

  const renderFooter = () => {
    if (!layoutConfig.showFooter || !timbradoConfig?.rodape) return null

    return <div className="page-footer" dangerouslySetInnerHTML={{ __html: timbradoConfig.rodape }} />
  }

  const renderPrimeiraPagina = () => {
    if (paginasConteudo.length === 0) return null

    return (
      <div className="page">
        {renderHeader()}

        <div className="page-content">
          <div className="titulo">
            <h1>CONTRATO DE CONSERVAÇÃO E PREVENÇÃO DOS EQUIPAMENTOS ELETRÔNICOS</h1>
            <p>
              Contrato Nº: <strong>{contrato.numero}</strong>
            </p>
          </div>

          <div className="conteudo" dangerouslySetInnerHTML={{ __html: paginasConteudo[0] }} />
        </div>

        {renderFooter()}
      </div>
    )
  }

  const renderPaginasIntermediarias = () => {
    if (paginasConteudo.length <= 2) return null

    return paginasConteudo.slice(1, -1).map((conteudo, index) => (
      <div key={`pagina-${index + 1}`} className="page">
        {renderHeader()}

        <div className="page-content">
          <div className="conteudo" dangerouslySetInnerHTML={{ __html: conteudo }} />
        </div>

        {renderFooter()}
      </div>
    ))
  }

  const renderUltimaPagina = () => {
    if (paginasConteudo.length < 2) return null

    const ultimaPagina = paginasConteudo[paginasConteudo.length - 1]

    return (
      <div className="page">
        {renderHeader()}

        <div className="page-content">
          <div className="conteudo" dangerouslySetInnerHTML={{ __html: ultimaPagina }} />

          <div className="assinaturas">
            <div className="assinatura">
              <div className="linha-assinatura">
                <p className="nome-empresa">{timbradoConfig?.empresa_nome || "EMPRESA"}</p>
                <p className="info-empresa">CNPJ: {formatCNPJ(timbradoConfig?.empresa_cnpj || "")}</p>
                <p className="representante">{timbradoConfig?.empresa_representante_legal || "Representante Legal"}</p>
                <p className="info-empresa">RG: {formatRG(timbradoConfig?.representante_rg || "")}</p>
                <p className="info-empresa">CPF: {formatCPF(timbradoConfig?.representante_cpf || "")}</p>
              </div>
            </div>

            <div className="assinatura">
              <div className="linha-assinatura">
                <p className="nome-empresa">{contrato.cliente_nome || clienteCompleto?.nome}</p>
                <p className="info-empresa">
                  CNPJ:{" "}
                  {formatCNPJ(
                    contrato.cliente_cnpj ||
                      contrato.cliente_cpf ||
                      clienteCompleto?.cnpj ||
                      clienteCompleto?.cpf ||
                      "",
                  )}
                </p>
                {(contrato.cliente_sindico || clienteCompleto?.sindico) && (
                  <>
                    <p className="representante">{contrato.cliente_sindico || clienteCompleto?.sindico}</p>
                    <p className="info-empresa">
                      RG: {formatRG(contrato.cliente_rg_sindico || clienteCompleto?.rg_sindico || "")}
                    </p>
                    <p className="info-empresa">
                      CPF: {formatCPF(contrato.cliente_cpf_sindico || clienteCompleto?.cpf_sindico || "")}
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {renderFooter()}
      </div>
    )
  }

  return (
    <>
      <style>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: Arial, sans-serif;
          background: white;
          color: black;
          font-size: ${layoutConfig.fontSize}px;
          line-height: ${layoutConfig.lineHeight};
        }

        .page {
          width: 210mm;
          height: 297mm;
          padding: ${layoutConfig.marginTop}mm ${layoutConfig.pageMargin}mm ${layoutConfig.marginBottom}mm ${layoutConfig.pageMargin}mm;
          margin: 0 auto;
          background: white;
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
          border-bottom: 1px solid #ccc;
          padding-bottom: 15px;
          margin-bottom: 20px;
          flex-shrink: 0;
        }

        .logo img {
          width: auto;
          max-height: ${layoutConfig.logoSize}px;
        }

        .cabecalho-personalizado {
          margin-top: 10px;
          font-size: ${layoutConfig.headerFontSize}px;
          line-height: 1.3;
        }

        .page-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .titulo {
          text-align: center;
          margin-bottom: 25px;
          flex-shrink: 0;
        }

        .titulo h1 {
          font-size: ${layoutConfig.titleFontSize}px;
          font-weight: bold;
          margin-bottom: 10px;
          line-height: 1.3;
        }

        .titulo p {
          font-size: ${layoutConfig.fontSize + 2}px;
          margin: 5px 0;
        }

        .conteudo {
          flex: 1;
          font-size: ${layoutConfig.fontSize}px;
          line-height: ${layoutConfig.lineHeight};
          text-align: justify;
          overflow: visible;
          margin-top: ${layoutConfig.contentMarginTop}mm;
          margin-bottom: ${layoutConfig.contentMarginBottom}mm;
        }

        .assinaturas {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 40px;
          margin-top: auto;
          padding-top: 40px;
          flex-shrink: 0;
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
          font-size: ${layoutConfig.signatureFontSize}px;
          margin-bottom: 5px;
        }

        .info-empresa,
        .representante {
          font-size: ${layoutConfig.signatureFontSize - 1}px;
          margin: 2px 0;
        }

        .representante {
          font-weight: 500;
          margin: 8px 0 2px 0;
        }

        .page-footer {
          text-align: center;
          font-size: ${layoutConfig.footerFontSize}px;
          border-top: 1px solid #ccc;
          padding-top: 10px;
          margin-top: 20px;
          line-height: 1.3;
          flex-shrink: 0;
        }

        @media print {
          body {
            margin: 0;
            padding: 0;
          }

          .page {
            margin: 0;
            page-break-after: always;
          }

          .page:last-child {
            page-break-after: avoid;
          }
        }

        @media screen {
          body {
            background: #e5e5e5;
            padding: 20px;
          }

          .page {
            margin-bottom: 20px;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
          }
        }
      `}</style>

      {renderPrimeiraPagina()}
      {renderPaginasIntermediarias()}
      {renderUltimaPagina()}
    </>
  )
}
