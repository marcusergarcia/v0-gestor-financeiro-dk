// Gerador de XML para NFS-e São Paulo (Padrão ABRASF/SP)
// Web Service: https://nfe.prefeitura.sp.gov.br/ws/lotenfe.asmx

export interface DadosPrestador {
  cnpj: string
  inscricaoMunicipal: string
}

export interface DadosTomador {
  tipo: "PF" | "PJ"
  cpfCnpj: string
  inscricaoMunicipal?: string
  razaoSocial: string
  email?: string
  telefone?: string
  endereco?: string
  numero?: string
  complemento?: string
  bairro?: string
  cidade?: string
  uf?: string
  cep?: string
  codigoMunicipio?: string
}

export interface DadosServico {
  codigoServico: string
  descricao: string
  codigoCnae?: string
  aliquotaIss: number
  valorServicos: number
  valorDeducoes?: number
  valorPis?: number
  valorCofins?: number
  valorInss?: number
  valorIr?: number
  valorCsll?: number
  issRetido: boolean
}

export interface DadosRps {
  numero: number
  serie: string
  tipo: number // 1=RPS, 2=RPS-Mista, 3=Cupom
  dataEmissao: string // YYYY-MM-DD
  naturezaOperacao: number // 1=Tributação no município, 2=Fora do município, etc
  regimeTributacao: number
  optanteSimples: number // 1=Sim, 2=Não
  incentivadorCultural: number // 1=Sim, 2=Não
}

export interface DadosNfse {
  rps: DadosRps
  prestador: DadosPrestador
  tomador: DadosTomador
  servico: DadosServico
}

// Gerar XML de envio de lote de RPS para SP
export function gerarXmlEnvioLoteRps(notas: DadosNfse[], numeroLote: number): string {
  const listaRps = notas.map((nota) => gerarRpsXml(nota)).join("\n")

  return `<?xml version="1.0" encoding="UTF-8"?>
<PedidoEnvioLoteRPS xmlns="http://www.prefeitura.sp.gov.br/nfe" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <Cabecalho xmlns="" Versao="1">
    <CPFCNPJRemetente>
      <CNPJ>${notas[0].prestador.cnpj}</CNPJ>
    </CPFCNPJRemetente>
    <transacao>true</transacao>
    <dtInicio>${notas[0].rps.dataEmissao}</dtInicio>
    <dtFim>${notas[0].rps.dataEmissao}</dtFim>
    <QtdRPS>${notas.length}</QtdRPS>
    <ValorTotalServicos>${somarValores(notas, "valorServicos").toFixed(2)}</ValorTotalServicos>
    <ValorTotalDeducoes>${somarValores(notas, "valorDeducoes").toFixed(2)}</ValorTotalDeducoes>
  </Cabecalho>
  ${listaRps}
</PedidoEnvioLoteRPS>`
}

function gerarRpsXml(nota: DadosNfse): string {
  const { rps, prestador, tomador, servico } = nota

  const valorIss = servico.issRetido
    ? 0
    : ((servico.valorServicos - (servico.valorDeducoes || 0)) * servico.aliquotaIss)

  // SP usa formato específico para CPF/CNPJ do tomador
  const tomadorCpfCnpj =
    tomador.tipo === "PF"
      ? `<CPF>${tomador.cpfCnpj}</CPF>`
      : `<CNPJ>${tomador.cpfCnpj}</CNPJ>`

  return `  <RPS xmlns="">
    <Assinatura></Assinatura>
    <ChaveRPS>
      <InscricaoPrestador>${prestador.inscricaoMunicipal}</InscricaoPrestador>
      <SerieRPS>${rps.serie}</SerieRPS>
      <NumeroRPS>${rps.numero}</NumeroRPS>
    </ChaveRPS>
    <TipoRPS>${rps.tipo === 1 ? "RPS" : rps.tipo === 2 ? "RPS-M" : "RPS-C"}</TipoRPS>
    <DataEmissao>${rps.dataEmissao}</DataEmissao>
    <StatusRPS>N</StatusRPS>
    <TributacaoRPS>${getTributacaoSP(rps.regimeTributacao, rps.optanteSimples)}</TributacaoRPS>
    <ValorServicos>${servico.valorServicos.toFixed(2)}</ValorServicos>
    <ValorDeducoes>${(servico.valorDeducoes || 0).toFixed(2)}</ValorDeducoes>
    <ValorPIS>${(servico.valorPis || 0).toFixed(2)}</ValorPIS>
    <ValorCOFINS>${(servico.valorCofins || 0).toFixed(2)}</ValorCOFINS>
    <ValorINSS>${(servico.valorInss || 0).toFixed(2)}</ValorINSS>
    <ValorIR>${(servico.valorIr || 0).toFixed(2)}</ValorIR>
    <ValorCSLL>${(servico.valorCsll || 0).toFixed(2)}</ValorCSLL>
    <CodigoServico>${servico.codigoServico}</CodigoServico>
    <AliquotaServicos>${(servico.aliquotaIss * 100).toFixed(4)}</AliquotaServicos>
    <ISSRetido>${servico.issRetido ? "true" : "false"}</ISSRetido>
    <CPFCNPJTomador>
      ${tomadorCpfCnpj}
    </CPFCNPJTomador>${tomador.inscricaoMunicipal ? `
    <InscricaoMunicipalTomador>${tomador.inscricaoMunicipal}</InscricaoMunicipalTomador>` : ""}${tomador.razaoSocial ? `
    <RazaoSocialTomador>${escapeXml(tomador.razaoSocial)}</RazaoSocialTomador>` : ""}${tomador.endereco ? `
    <EnderecoTomador>${escapeXml(tomador.endereco)}</EnderecoTomador>` : ""}${tomador.numero ? `
    <NumeroEnderecoTomador>${escapeXml(tomador.numero)}</NumeroEnderecoTomador>` : ""}${tomador.complemento ? `
    <ComplementoEnderecoTomador>${escapeXml(tomador.complemento)}</ComplementoEnderecoTomador>` : ""}${tomador.bairro ? `
    <BairroTomador>${escapeXml(tomador.bairro)}</BairroTomador>` : ""}${tomador.cidade ? `
    <CidadeTomador>${tomador.codigoMunicipio || "3550308"}</CidadeTomador>` : ""}${tomador.uf ? `
    <UFTomador>${tomador.uf}</UFTomador>` : ""}${tomador.cep ? `
    <CEPTomador>${tomador.cep.replace(/\D/g, "")}</CEPTomador>` : ""}${tomador.email ? `
    <EmailTomador>${escapeXml(tomador.email)}</EmailTomador>` : ""}
    <Discriminacao>${escapeXml(servico.descricao)}</Discriminacao>
  </RPS>`
}

// Gerar XML de consulta de NFS-e por RPS
export function gerarXmlConsultaNfseRps(
  prestadorCnpj: string,
  inscricaoMunicipal: string,
  numeroRps: number,
  serieRps: string,
): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<PedidoConsultaNFe xmlns="http://www.prefeitura.sp.gov.br/nfe">
  <Cabecalho xmlns="" Versao="1">
    <CPFCNPJRemetente>
      <CNPJ>${prestadorCnpj}</CNPJ>
    </CPFCNPJRemetente>
  </Cabecalho>
  <Detalhe xmlns="">
    <ChaveRPS>
      <InscricaoPrestador>${inscricaoMunicipal}</InscricaoPrestador>
      <SerieRPS>${serieRps}</SerieRPS>
      <NumeroRPS>${numeroRps}</NumeroRPS>
    </ChaveRPS>
  </Detalhe>
</PedidoConsultaNFe>`
}

// Gerar XML de cancelamento de NFS-e SP
export function gerarXmlCancelamentoNfse(
  prestadorCnpj: string,
  inscricaoMunicipal: string,
  numeroNfse: string,
): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<PedidoCancelamentoNFe xmlns="http://www.prefeitura.sp.gov.br/nfe">
  <Cabecalho xmlns="" Versao="1">
    <CPFCNPJRemetente>
      <CNPJ>${prestadorCnpj}</CNPJ>
    </CPFCNPJRemetente>
    <transacao>true</transacao>
  </Cabecalho>
  <Detalhe xmlns="">
    <ChaveNFe>
      <InscricaoPrestador>${inscricaoMunicipal}</InscricaoPrestador>
      <NumeroNFe>${numeroNfse}</NumeroNFe>
    </ChaveNFe>
    <AssinaturaCancelamento></AssinaturaCancelamento>
  </Detalhe>
</PedidoCancelamentoNFe>`
}

// Gerar XML de consulta de lote
export function gerarXmlConsultaLote(
  prestadorCnpj: string,
  numeroLote: number,
): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<PedidoConsultaLote xmlns="http://www.prefeitura.sp.gov.br/nfe">
  <Cabecalho xmlns="" Versao="1">
    <CPFCNPJRemetente>
      <CNPJ>${prestadorCnpj}</CNPJ>
    </CPFCNPJRemetente>
    <NumeroLote>${numeroLote}</NumeroLote>
  </Cabecalho>
</PedidoConsultaLote>`
}

// Gerar XML para testar envio (teste de conexão)
export function gerarXmlTesteEnvio(prestadorCnpj: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<PedidoConsultaLote xmlns="http://www.prefeitura.sp.gov.br/nfe">
  <Cabecalho xmlns="" Versao="1">
    <CPFCNPJRemetente>
      <CNPJ>${prestadorCnpj}</CNPJ>
    </CPFCNPJRemetente>
    <NumeroLote>0</NumeroLote>
  </Cabecalho>
</PedidoConsultaLote>`
}

// Helper: Mapear regime tributação para código SP
function getTributacaoSP(regime: number, optanteSimples: number): string {
  if (optanteSimples === 1) return "T" // Simples Nacional
  switch (regime) {
    case 1:
      return "M" // Microempresa municipal
    case 2:
      return "E" // Estimativa
    case 3:
      return "C" // Sociedade de profissionais
    case 4:
      return "F" // Cooperativa
    case 5:
      return "K" // MEI - Simples Nacional
    case 6:
      return "T" // ME/EPP Simples Nacional
    default:
      return "T"
  }
}

function somarValores(notas: DadosNfse[], campo: "valorServicos" | "valorDeducoes"): number {
  return notas.reduce((acc, nota) => acc + (nota.servico[campo] || 0), 0)
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}

// URLs dos webservices da Prefeitura de SP
// Ref: Manual de Utilização do Web Service v2.1 - Prefeitura de SP
// Homologação usa subdomínio "nfeh" (com H)
export const SP_WEBSERVICE_URLS = {
  homologacao: "https://nfeh.prefeitura.sp.gov.br/ws/lotenfe.asmx",
  producao: "https://nfe.prefeitura.sp.gov.br/ws/lotenfe.asmx",
}

// SOAP Actions da Prefeitura de SP
export const SP_SOAP_ACTIONS = {
  envioLoteRps: "http://www.prefeitura.sp.gov.br/nfe/ws/envioLoteRPS",
  testeEnvioLoteRps: "http://www.prefeitura.sp.gov.br/nfe/ws/testeEnvioLoteRPS",
  cancelamentoNfe: "http://www.prefeitura.sp.gov.br/nfe/ws/cancelamentoNFe",
  consultaNfe: "http://www.prefeitura.sp.gov.br/nfe/ws/consultaNFe",
  consultaNfeRecebidas: "http://www.prefeitura.sp.gov.br/nfe/ws/consultaNFeRecebidas",
  consultaNFeEmitidas: "http://www.prefeitura.sp.gov.br/nfe/ws/consultaNFeEmitidas",
  consultaLote: "http://www.prefeitura.sp.gov.br/nfe/ws/consultaLote",
}
