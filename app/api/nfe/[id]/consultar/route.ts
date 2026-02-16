import { type NextRequest, NextResponse } from "next/server"
import { pool } from "@/lib/db"
import { gerarXmlConsultaProtocolo } from "@/lib/nfe/xml-builder"
import { consultarProtocoloNFe } from "@/lib/nfe/soap-client"

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    // Buscar NF-e
    const [nfeRows] = await pool.execute("SELECT * FROM nfe_emitidas WHERE id = ?", [id])
    const nfes = nfeRows as any[]
    if (nfes.length === 0) {
      return NextResponse.json({ success: false, message: "NF-e nao encontrada" }, { status: 404 })
    }
    const nfe = nfes[0]

    if (!nfe.chave_acesso) {
      return NextResponse.json({ success: false, message: "NF-e sem chave de acesso" }, { status: 400 })
    }

    // Buscar config e certificado
    const [configRows] = await pool.execute("SELECT * FROM nfe_config WHERE ativo = 1 LIMIT 1")
    const configs = configRows as any[]
    if (configs.length === 0) {
      return NextResponse.json({ success: false, message: "Configuracao NF-e nao encontrada" }, { status: 400 })
    }
    const config = configs[0]

    let certificadoBase64 = ""
    let certificadoSenha = ""
    if (config.usar_certificado_nfse) {
      const [nfseRows] = await pool.execute("SELECT certificado_base64, certificado_senha FROM nfse_config WHERE ativo = 1 LIMIT 1")
      const nfseConfigs = nfseRows as any[]
      if (nfseConfigs.length > 0) {
        certificadoBase64 = nfseConfigs[0].certificado_base64
        certificadoSenha = nfseConfigs[0].certificado_senha
      }
    }

    if (!certificadoBase64) {
      return NextResponse.json({ success: false, message: "Certificado digital nao encontrado" }, { status: 400 })
    }

    // Consultar na SEFAZ
    const xmlConsulta = gerarXmlConsultaProtocolo(nfe.chave_acesso, config.ambiente || 2)
    const resultado = await consultarProtocoloNFe(xmlConsulta, config.ambiente || 2, certificadoBase64, certificadoSenha)

    // Registrar transmissao
    await pool.execute(
      `INSERT INTO nfe_transmissoes (nfe_id, tipo, xml_envio, xml_retorno, sucesso, codigo_status, mensagem_status, tempo_resposta_ms)
       VALUES (?, 'consulta_protocolo', ?, ?, ?, ?, ?, ?)`,
      [
        nfe.id, xmlConsulta, resultado.xml.substring(0, 65535),
        resultado.success ? 1 : 0,
        extrairCampo(resultado.xml, "cStat") || "",
        extrairCampo(resultado.xml, "xMotivo") || resultado.erro || "",
        resultado.tempoMs,
      ]
    )

    const cStat = extrairCampo(resultado.xml, "cStat") || ""
    const xMotivo = extrairCampo(resultado.xml, "xMotivo") || ""
    const protocolo = extrairCampo(resultado.xml, "nProt") || ""

    // Atualizar status conforme resposta
    if (cStat === "100") {
      await pool.execute(
        "UPDATE nfe_emitidas SET status = 'autorizada', protocolo = ?, data_autorizacao = NOW() WHERE id = ?",
        [protocolo, nfe.id]
      )
    } else if (cStat === "101" || cStat === "135") {
      await pool.execute(
        "UPDATE nfe_emitidas SET status = 'cancelada' WHERE id = ?",
        [nfe.id]
      )
    }

    return NextResponse.json({
      success: true,
      data: { cStat, xMotivo, protocolo },
    })
  } catch (error: any) {
    console.error("Erro ao consultar NF-e:", error)
    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }
}

function extrairCampo(xml: string, campo: string): string | null {
  const match = xml.match(new RegExp(`<${campo}>([^<]+)</${campo}>`))
  return match ? match[1] : null
}
