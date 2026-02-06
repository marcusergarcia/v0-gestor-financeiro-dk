import { type NextRequest, NextResponse } from "next/server"
import { pool } from "@/lib/db"
import { gerarXmlConsultaNfseRps } from "@/lib/nfse/xml-builder"
import { consultarNfse, extrairDadosNfseRetorno } from "@/lib/nfse/soap-client"

/**
 * POST /api/nfse/[id]/consultar
 * Consulta o status de uma NFS-e na prefeitura de SP usando o numero do RPS.
 * Quando o processamento e assincrono, a prefeitura retorna o NumeroNFe nesta consulta.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const connection = await pool.getConnection()

  try {
    // Buscar nota fiscal
    const [notaRows] = await connection.execute(
      "SELECT * FROM notas_fiscais WHERE id = ?",
      [id]
    )
    const notas = notaRows as any[]
    if (notas.length === 0) {
      return NextResponse.json(
        { success: false, message: "Nota fiscal nao encontrada" },
        { status: 404 }
      )
    }
    const nota = notas[0]

    // Buscar configuracao NFS-e
    const [configRows] = await connection.execute(
      "SELECT * FROM nfse_config WHERE ativo = 1 LIMIT 1"
    )
    const configs = configRows as any[]
    if (configs.length === 0) {
      return NextResponse.json(
        { success: false, message: "Configuracao NFS-e nao encontrada" },
        { status: 400 }
      )
    }
    const config = configs[0]

    if (!config.certificado_base64) {
      return NextResponse.json(
        { success: false, message: "Certificado digital nao configurado" },
        { status: 400 }
      )
    }

    // Gerar XML de consulta por RPS
    const xmlConsulta = gerarXmlConsultaNfseRps(
      config.cnpj,
      config.inscricao_municipal,
      nota.numero_rps,
      nota.serie_rps || "11"
    )

    console.log("[v0] Consultando NFS-e por RPS:", nota.numero_rps, "Serie:", nota.serie_rps)

    // Enviar consulta para a prefeitura
    const soapResponse = await consultarNfse(
      xmlConsulta,
      config.ambiente,
      config.certificado_base64,
      config.certificado_senha
    )

    // Registrar transmissao
    await connection.execute(
      `INSERT INTO nfse_transmissoes (nota_fiscal_id, tipo, xml_envio, xml_retorno, sucesso, codigo_erro, mensagem_erro, tempo_resposta_ms)
       VALUES (?, 'consulta_rps', ?, ?, ?, ?, ?, ?)`,
      [
        id,
        xmlConsulta,
        soapResponse.xml,
        soapResponse.success ? 1 : 0,
        null,
        soapResponse.erro || null,
        soapResponse.tempoMs,
      ]
    )

    if (soapResponse.success) {
      // Extrair dados do retorno
      const dadosRetorno = extrairDadosNfseRetorno(soapResponse.xml)

      if (dadosRetorno.sucesso && dadosRetorno.numeroNfse) {
        // NFS-e encontrada! Atualizar no banco
        await connection.execute(
          `UPDATE notas_fiscais SET 
            numero_nfse = ?, codigo_verificacao = ?, status = 'emitida',
            data_emissao = COALESCE(data_emissao, NOW()), xml_retorno = ?, updated_at = CURRENT_TIMESTAMP
           WHERE id = ?`,
          [dadosRetorno.numeroNfse, dadosRetorno.codigoVerificacao || null, soapResponse.xml, id]
        )

        return NextResponse.json({
          success: true,
          message: `NFS-e encontrada! Numero: ${dadosRetorno.numeroNfse}`,
          data: {
            numero_nfse: dadosRetorno.numeroNfse,
            codigo_verificacao: dadosRetorno.codigoVerificacao,
            status: "emitida",
          },
        })
      } else if (dadosRetorno.erros.length > 0) {
        // Retorno com erros - pode significar que o RPS nao foi processado ainda ou falhou
        const erroMsg = dadosRetorno.erros.join("; ")

        // Verificar se e um erro de "nao encontrado" (ainda processando) ou erro real
        const aindaProcessando = dadosRetorno.erros.some(
          (e) =>
            e.includes("1") || // Erro generico
            e.toLowerCase().includes("nao encontrad") ||
            e.toLowerCase().includes("não encontrad") ||
            e.toLowerCase().includes("processamento")
        )

        if (!aindaProcessando) {
          // Erro real - atualizar status
          await connection.execute(
            `UPDATE notas_fiscais SET status = 'erro', mensagem_erro = ?, xml_retorno = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
            [erroMsg, soapResponse.xml, id]
          )
        }

        return NextResponse.json({
          success: false,
          message: aindaProcessando
            ? "NFS-e ainda em processamento na prefeitura. Tente novamente em alguns instantes."
            : "Erro na consulta: " + erroMsg,
          data: {
            status: aindaProcessando ? "processando" : "erro",
            erros: dadosRetorno.erros,
          },
        })
      } else {
        // Sem numero e sem erros - ainda processando
        return NextResponse.json({
          success: false,
          message: "NFS-e ainda em processamento na prefeitura. Tente novamente em alguns instantes.",
          data: { status: "processando" },
        })
      }
    } else {
      return NextResponse.json({
        success: false,
        message: "Erro na comunicacao com a prefeitura: " + soapResponse.erro,
        data: { status: "erro" },
      })
    }
  } catch (error: any) {
    console.error("[v0] Erro ao consultar NFS-e:", error?.message || error)
    return NextResponse.json(
      { success: false, message: "Erro interno: " + (error?.message || "Erro desconhecido") },
      { status: 500 }
    )
  } finally {
    connection.release()
  }
}
