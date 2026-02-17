import { type NextRequest, NextResponse } from "next/server"
import { pool } from "@/lib/db"
import {
  gerarXmlNFe,
  gerarXmlEnviNFe,
  type DadosNFe,
  type DadosEmitente,
  type DadosDestinatario,
  type ItemNFe,
} from "@/lib/nfe/xml-builder"
import { assinarXmlNFe, extrairCertKeyDoPfx } from "@/lib/nfe/xml-signer"
import { autorizarNFe } from "@/lib/nfe/soap-client"

export async function POST(request: NextRequest) {
  const connection = await pool.getConnection()
  try {
    const body = await request.json()
    const {
      origem,
      origem_id,
      origem_numero,
      cliente_id,
      dest_tipo,
      dest_cpf_cnpj,
      dest_razao_social,
      dest_email,
      dest_telefone,
      dest_inscricao_estadual,
      dest_ind_ie_dest,
      dest_endereco,
      dest_numero,
      dest_complemento,
      dest_bairro,
      dest_cidade,
      dest_uf,
      dest_cep,
      dest_codigo_municipio,
      itens,
      info_complementar,
      natureza_operacao,
    } = body

    if (!itens || itens.length === 0) {
      return NextResponse.json(
        { success: false, message: "Nenhum item informado para a NF-e." },
        { status: 400 },
      )
    }

    // Buscar configuracao NF-e
    const [configRows] = await connection.execute(
      "SELECT * FROM nfe_config WHERE ativo = 1 LIMIT 1"
    )
    const configs = configRows as any[]
    if (configs.length === 0) {
      return NextResponse.json(
        { success: false, message: "Configuracao NF-e nao encontrada. Configure em Configuracoes > NF-e Material." },
        { status: 400 },
      )
    }
    const config = configs[0]

    // Buscar certificado (reutiliza da NFS-e se configurado)
    let certificadoBase64 = ""
    let certificadoSenha = ""

    if (config.usar_certificado_nfse) {
      const [nfseConfigRows] = await connection.execute(
        "SELECT certificado_base64, certificado_senha FROM nfse_config WHERE ativo = 1 LIMIT 1"
      )
      const nfseConfigs = nfseConfigRows as any[]
      if (nfseConfigs.length === 0 || !nfseConfigs[0].certificado_base64) {
        return NextResponse.json(
          { success: false, message: "Certificado digital nao configurado na NFS-e. Configure em Configuracoes > NFS-e." },
          { status: 400 },
        )
      }
      certificadoBase64 = nfseConfigs[0].certificado_base64
      certificadoSenha = nfseConfigs[0].certificado_senha
    }

    if (!certificadoBase64) {
      return NextResponse.json(
        { success: false, message: "Certificado digital nao encontrado." },
        { status: 400 },
      )
    }

    // Obter proximo numero NF-e
    const numeroNFe = config.proximo_numero_nfe || 1
    const serie = config.serie_nfe || 1
    const ambiente = config.ambiente || 2
    console.log("[v0] NF-e: Numero:", numeroNFe, "Serie:", serie, "Ambiente:", ambiente)

    // Gerar data de emissao no fuso horario de Sao Paulo (UTC-3)
    // A Vercel roda em UTC, entao new Date().toISOString() pode retornar o dia seguinte
    // quando em SP ainda e o dia anterior (ex: 22h SP = 01h UTC do dia seguinte).
    // A SEFAZ pode rejeitar datas com fuso errado ou dia incorreto na chave de acesso.
    const agora = new Date()
    const spFormatter = new Intl.DateTimeFormat("sv-SE", {
      timeZone: "America/Sao_Paulo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    })
    const spParts = spFormatter.formatToParts(agora)
    const getPart = (type: string) => spParts.find((p) => p.type === type)?.value || ""
    const dataEmissaoSP = `${getPart("year")}-${getPart("month")}-${getPart("day")}`
    const dhEmiSP = `${dataEmissaoSP}T${getPart("hour")}:${getPart("minute")}:${getPart("second")}-03:00`
    console.log("[v0] NF-e: Data emissao SP:", dataEmissaoSP, "dhEmi:", dhEmiSP, "| UTC:", agora.toISOString())

    // Garantir que CNPJ tenha exatamente 14 digitos (padStart com zero a esquerda)
    // O DB pode armazenar sem leading zero dependendo de como foi inserido
    const cnpjEmitente = (config.cnpj || "").replace(/\D/g, "").padStart(14, "0")
    console.log("[v0] NF-e: CNPJ config.cnpj raw:", JSON.stringify(config.cnpj), "| formatado:", cnpjEmitente, "| length:", cnpjEmitente.length)

    // Montar emitente a partir da config
    const emitente: DadosEmitente = {
      cnpj: cnpjEmitente,
      razaoSocial: config.razao_social,
      nomeFantasia: config.nome_fantasia || undefined,
      inscricaoEstadual: config.inscricao_estadual,
      crt: config.crt || 1,
      telefone: config.telefone || undefined,
      endereco: {
        logradouro: config.endereco || "",
        numero: config.numero_endereco || "S/N",
        complemento: config.complemento || undefined,
        bairro: config.bairro || "",
        codigoMunicipio: config.codigo_municipio || "3550308",
        municipio: config.cidade || "Sao Paulo",
        uf: config.uf || "SP",
        cep: config.cep || "",
      },
    }

    // Montar destinatario - garantir padding correto do CPF/CNPJ
    const tipoDoc = dest_tipo || "PJ"
    const cpfCnpjRaw = (dest_cpf_cnpj || "").replace(/\D/g, "")
    const cpfCnpjDest = tipoDoc === "PJ" ? cpfCnpjRaw.padStart(14, "0") : cpfCnpjRaw.padStart(11, "0")
    console.log("[v0] NF-e: Dest CPF/CNPJ raw:", JSON.stringify(dest_cpf_cnpj), "| formatado:", cpfCnpjDest, "| tipo:", tipoDoc)

    const destinatario: DadosDestinatario = {
      tipo: tipoDoc,
      cpfCnpj: cpfCnpjDest,
      razaoSocial: dest_razao_social || "",
      inscricaoEstadual: dest_inscricao_estadual || undefined,
      indicadorIE: dest_ind_ie_dest || 9,
      email: dest_email || undefined,
      telefone: dest_telefone || undefined,
      endereco: dest_endereco ? {
        logradouro: dest_endereco,
        numero: dest_numero || "S/N",
        complemento: dest_complemento || undefined,
        bairro: dest_bairro || "",
        codigoMunicipio: dest_codigo_municipio || "3550308",
        municipio: dest_cidade || "Sao Paulo",
        uf: dest_uf || "SP",
        cep: (dest_cep || "").replace(/\D/g, ""),
      } : undefined,
    }

    // Em homologacao, a SEFAZ exige xNome = "NF-E EMITIDA EM AMBIENTE DE HOMOLOGACAO - SEM VALOR FISCAL"
    if (ambiente === 2) {
      destinatario.razaoSocial = "NF-E EMITIDA EM AMBIENTE DE HOMOLOGACAO - SEM VALOR FISCAL"
    }

    // Montar itens
    const itensNFe: ItemNFe[] = (itens as any[]).map((item: any, index: number) => ({
      numero: index + 1,
      codigoProduto: item.codigo_produto || `PROD${(index + 1).toString().padStart(3, "0")}`,
      descricao: item.descricao || "Produto",
      ncm: (item.ncm || "00000000").replace(/\D/g, ""),
      cfop: "5102",
      unidade: item.unidade || "UN",
      quantidade: Number(item.quantidade) || 1,
      valorUnitario: Number(item.valor_unitario) || 0,
      valorTotal: Number(item.valor_total) || (Number(item.quantidade) * Number(item.valor_unitario)) || 0,
    }))

    // Montar dados NF-e
    const dadosNFe: DadosNFe = {
      emitente,
      destinatario,
      itens: itensNFe,
      informacoesAdicionais: info_complementar || config.info_complementar || undefined,
      serie,
      numeroNF: numeroNFe,
      naturezaOperacao: natureza_operacao || config.natureza_operacao || "Venda",
      tipoAmbiente: ambiente,
      dataEmissaoSP,
      dhEmiSP,
    }

    // Extrair certificado PEM
    let certPem = ""
    let keyPem = ""
    try {
      const extracted = extrairCertKeyDoPfx(certificadoBase64, certificadoSenha)
      certPem = extracted.certPem
      keyPem = extracted.keyPem
      console.log("[v0] NF-e: Certificado extraido com sucesso")
    } catch (extractError: any) {
      console.error("[v0] NF-e: Erro ao extrair certificado:", extractError?.message)
      return NextResponse.json(
        { success: false, message: "Erro ao extrair certificado digital: " + (extractError?.message || "Erro desconhecido") },
        { status: 400 },
      )
    }

    // Gerar XML da NF-e
    const { xml: xmlNFe, chaveAcesso, cNF, cDV } = gerarXmlNFe(dadosNFe)
    console.log("[v0] NF-e: XML gerado. Chave de acesso:", chaveAcesso)

    // Assinar XML com XMLDSIG
    let xmlAssinado: string
    try {
      xmlAssinado = assinarXmlNFe(xmlNFe, certPem, keyPem)
      console.log("[v0] NF-e: XML assinado com XMLDSIG")
    } catch (signError: any) {
      console.error("[v0] NF-e: Erro ao assinar XML:", signError?.message)
      return NextResponse.json(
        { success: false, message: "Erro ao assinar XML: " + (signError?.message || "Erro desconhecido") },
        { status: 400 },
      )
    }

    // Gerar envelope de envio (enviNFe)
    const idLote = Date.now().toString().substring(0, 15)
    const xmlEnviNFe = gerarXmlEnviNFe(xmlAssinado, idLote)

    // Calcular valor total
    const valorProdutos = itensNFe.reduce((acc, item) => acc + item.valorTotal, 0)

    // Inserir registro no banco antes de enviar
    const [insertResult] = await connection.execute(
      `INSERT INTO nfe_emitidas (
        numero_nfe, serie, chave_acesso,
        origem, origem_id, origem_numero,
        emitente_cnpj, emitente_ie,
        cliente_id, dest_tipo, dest_cpf_cnpj, dest_razao_social,
        dest_email, dest_telefone, dest_inscricao_estadual, dest_ind_ie_dest,
        dest_endereco, dest_numero, dest_complemento, dest_bairro,
        dest_cidade, dest_uf, dest_cep, dest_codigo_municipio,
        valor_produtos, valor_total,
        info_complementar, natureza_operacao,
        status, data_emissao, xml_envio
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'processando', NOW(), ?)`,
      [
        numeroNFe, serie, chaveAcesso,
        origem || "avulsa", origem_id || null, origem_numero || null,
        cnpjEmitente, config.inscricao_estadual,
        cliente_id || null, tipoDoc,
        cpfCnpjDest,
        ambiente === 2 ? "NF-E EMITIDA EM AMBIENTE DE HOMOLOGACAO - SEM VALOR FISCAL" : (dest_razao_social || ""),
        dest_email || null, dest_telefone || null,
        dest_inscricao_estadual || null, dest_ind_ie_dest || 9,
        dest_endereco || null, dest_numero || null,
        dest_complemento || null, dest_bairro || null,
        dest_cidade || null, dest_uf || null,
        (dest_cep || "").replace(/\D/g, "") || null, dest_codigo_municipio || null,
        valorProdutos, valorProdutos,
        info_complementar || config.info_complementar || null,
        natureza_operacao || config.natureza_operacao || "Venda",
        xmlEnviNFe,
      ]
    )
    const nfeId = (insertResult as any).insertId
    console.log("[v0] NF-e: Registro inserido, ID:", nfeId)

    // Inserir itens no banco
    for (const item of itensNFe) {
      await connection.execute(
        `INSERT INTO nfe_itens (
          nfe_id, numero_item, produto_id, codigo_produto, descricao,
          ncm, cfop, unidade, quantidade, valor_unitario, valor_total,
          origem, csosn
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, '102')`,
        [
          nfeId, item.numero,
          (itens as any[])[item.numero - 1]?.produto_id || null,
          item.codigoProduto, item.descricao,
          item.ncm, item.cfop, item.unidade,
          item.quantidade, item.valorUnitario, item.valorTotal,
        ]
      )
    }

    // Debug: Log do XML assinado e envelope para troubleshooting
    console.log("[v0] NF-e: XML NFe assinado (primeiros 1000):", xmlAssinado.substring(0, 1000))
    console.log("[v0] NF-e: XML enviNFe tamanho:", xmlEnviNFe.length, "bytes")

    // Enviar para a SEFAZ
    console.log("[v0] NF-e: Enviando para SEFAZ SP...")
    const resultado = await autorizarNFe(
      xmlEnviNFe,
      ambiente,
      certificadoBase64,
      certificadoSenha,
    )

    // Debug: Log completo do retorno da SEFAZ
    console.log("[v0] NF-e: SEFAZ retorno success:", resultado.success, "httpStatus:", resultado.httpStatus, "tempoMs:", resultado.tempoMs)
    console.log("[v0] NF-e: SEFAZ retorno XML (primeiros 2000):", resultado.xml.substring(0, 2000))
    console.log("[v0] NF-e: SEFAZ retorno erro:", resultado.erro || "(nenhum)")

    // Extrair dados do protNFe (dentro de infProt) - este e o status REAL da NF-e
    // O retorno da SEFAZ para autorizacao sincrona tem dois niveis:
    // - cStat do lote (retEnviNFe): 104 = "Lote processado"
    // - cStat da NF-e (protNFe > infProt): 100 = "Autorizado" ou codigo de rejeicao
    const protNFeData = extrairDadosProtNFe(resultado.xml)
    const cStatReal = protNFeData.cStat || extrairCampoXml(resultado.xml, "cStat") || ""
    const xMotivoReal = protNFeData.xMotivo || extrairCampoXml(resultado.xml, "xMotivo") || resultado.erro || ""
    const protocoloReal = protNFeData.nProt || ""

    // A NF-e so foi REALMENTE autorizada se o cStat dentro de protNFe e 100
    const nfeAutorizada = cStatReal === "100" || (resultado.success && protNFeData.cStat === "")

    console.log("[v0] NF-e: cStat real (protNFe):", cStatReal, "xMotivo:", xMotivoReal, "protocolo:", protocoloReal, "autorizada:", nfeAutorizada)

    // Registrar transmissao
    await connection.execute(
      `INSERT INTO nfe_transmissoes (
        nfe_id, tipo, xml_envio, xml_retorno, sucesso, codigo_status, mensagem_status, tempo_resposta_ms
      ) VALUES (?, 'autorizacao', ?, ?, ?, ?, ?, ?)`,
      [
        nfeId,
        xmlEnviNFe.substring(0, 65535),
        resultado.xml.substring(0, 65535),
        nfeAutorizada ? 1 : 0,
        cStatReal,
        xMotivoReal,
        resultado.tempoMs,
      ]
    )

    if (nfeAutorizada) {
      // Extrair dados do protocolo
      const protocolo = protocoloReal
      const cStat = cStatReal
      const xMotivo = xMotivoReal

      // Montar XML do nfeProc (NF-e processada = NF-e + protocolo)
      const xmlProtocolo = montarNfeProc(xmlAssinado, resultado.xml)

      // Atualizar registro como autorizada
      await connection.execute(
        `UPDATE nfe_emitidas SET
          status = 'autorizada',
          protocolo = ?,
          data_autorizacao = NOW(),
          xml_retorno = ?,
          xml_protocolo = ?
        WHERE id = ?`,
        [protocolo, resultado.xml, xmlProtocolo, nfeId]
      )

      // Incrementar proximo numero
      await connection.execute(
        "UPDATE nfe_config SET proximo_numero_nfe = ? WHERE id = ?",
        [numeroNFe + 1, config.id]
      )

      console.log("[v0] NF-e AUTORIZADA! Protocolo:", protocolo)

      return NextResponse.json({
        success: true,
        message: `NF-e ${numeroNFe} autorizada com sucesso!`,
        data: {
          id: nfeId,
          numero_nfe: numeroNFe,
          serie,
          chave_acesso: chaveAcesso,
          protocolo,
          status: "autorizada",
          cStat,
          xMotivo,
          valor_total: valorProdutos,
        },
      })
    } else {
      // Erro na SEFAZ - NF-e rejeitada ou erro de comunicacao
      const cStat = cStatReal
      const xMotivo = xMotivoReal

      await connection.execute(
        `UPDATE nfe_emitidas SET
          status = 'rejeitada',
          xml_retorno = ?,
          codigo_erro = ?,
          mensagem_erro = ?
        WHERE id = ?`,
        [resultado.xml, cStat, xMotivo, nfeId]
      )

      // Se a nota foi rejeitada, nao incrementa o numero (pode retentar)
      console.log("[v0] NF-e REJEITADA! cStat:", cStat, "xMotivo:", xMotivo)

      return NextResponse.json({
        success: false,
        message: `NF-e rejeitada pela SEFAZ: ${xMotivo}`,
        data: {
          id: nfeId,
          numero_nfe: numeroNFe,
          chave_acesso: chaveAcesso,
          status: "rejeitada",
          cStat,
          xMotivo,
        },
      })
    }
  } catch (error: any) {
    console.error("[v0] NF-e Error:", error)
    return NextResponse.json(
      { success: false, message: "Erro interno: " + (error?.message || "Erro desconhecido") },
      { status: 500 },
    )
  } finally {
    connection.release()
  }
}

// Helpers
function extrairCampoXml(xml: string, campo: string): string | null {
  const match = xml.match(new RegExp(`<${campo}>([^<]+)</${campo}>`))
  return match ? match[1] : null
}

/**
 * Extrai dados de dentro de <protNFe><infProt>...</infProt></protNFe>
 * Este e o status REAL da NF-e (diferente do status do lote)
 */
function extrairDadosProtNFe(xml: string): { cStat: string; xMotivo: string; nProt: string; dhRecbto: string } {
  const protNFeMatch = xml.match(/<protNFe[^>]*>[\s\S]*?<infProt[^>]*>([\s\S]*?)<\/infProt>[\s\S]*?<\/protNFe>/)
  if (!protNFeMatch) {
    return { cStat: "", xMotivo: "", nProt: "", dhRecbto: "" }
  }
  const infProt = protNFeMatch[1]
  return {
    cStat: (infProt.match(/<cStat>([^<]+)<\/cStat>/)?.[1] || "").trim(),
    xMotivo: (infProt.match(/<xMotivo>([^<]+)<\/xMotivo>/)?.[1] || "").trim(),
    nProt: (infProt.match(/<nProt>([^<]+)<\/nProt>/)?.[1] || "").trim(),
    dhRecbto: (infProt.match(/<dhRecbto>([^<]+)<\/dhRecbto>/)?.[1] || "").trim(),
  }
}

function montarNfeProc(xmlNFeAssinado: string, xmlRetorno: string): string {
  // Extrair protNFe do retorno
  const protMatch = xmlRetorno.match(/<protNFe[\s\S]*?<\/protNFe>/)
  const protNFe = protMatch ? protMatch[0] : ""

  return `<nfeProc versao="4.00" xmlns="http://www.portalfiscal.inf.br/nfe">${xmlNFeAssinado}${protNFe}</nfeProc>`
}
