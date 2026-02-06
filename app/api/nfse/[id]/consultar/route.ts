import { type NextRequest, NextResponse } from "next/server"
import { pool } from "@/lib/db"
import { gerarXmlConsultaNfseRps, gerarXmlConsultaLote } from "@/lib/nfse/xml-builder"
import { consultarNfse, consultarLote, extrairDadosNfseRetorno } from "@/lib/nfse/soap-client"

/**
 * POST /api/nfse/[id]/consultar
 * Consulta o status de uma NFS-e na prefeitura de SP.
 * 
 * Tenta 2 metodos:
 * 1. ConsultaNFe por ChaveRPS (PedidoConsultaNFe) - busca a NFS-e pelo numero do RPS
 * 2. ConsultaLote (PedidoConsultaLote) - busca pelo numero do lote retornado no envio
 * 
 * O web service sincrono da prefeitura SP retorna a NFS-e na mesma conexao do envio.
 * Se a NFS-e nao foi retornada na emissao, pode ser que o XML de retorno nao foi
 * parseado corretamente. Esta rota tenta consultar novamente.
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

    console.log("[v0] === CONSULTA NFS-e ===")
    console.log("[v0] Nota ID:", id, "RPS:", nota.numero_rps, "Serie:", nota.serie_rps, "Status:", nota.status)
    
    // Primeiro, verificar se o xml_retorno do envio original ja contem o numero da NFS-e
    // (pode ter sido parseado incorretamente na emissao)
    if (nota.xml_retorno) {
      console.log("[v0] Reanalisando XML de retorno original...")
      const dadosOriginal = extrairDadosNfseRetorno(nota.xml_retorno)
      if (dadosOriginal.sucesso && dadosOriginal.numeroNfse) {
        console.log("[v0] NFS-e encontrada no XML original! Numero:", dadosOriginal.numeroNfse)
        await connection.execute(
          `UPDATE notas_fiscais SET 
            numero_nfse = ?, codigo_verificacao = ?, status = 'emitida',
            data_emissao = COALESCE(data_emissao, NOW()), updated_at = CURRENT_TIMESTAMP
           WHERE id = ?`,
          [dadosOriginal.numeroNfse, dadosOriginal.codigoVerificacao || null, id]
        )
        // Atualizar ultima NFS-e conhecida
        await connection.execute(
          `UPDATE nfse_config SET ultima_nfse_numero = GREATEST(COALESCE(ultima_nfse_numero, 0), ?) WHERE ativo = 1`,
          [Number(dadosOriginal.numeroNfse)]
        )
        return NextResponse.json({
          success: true,
          message: `NFS-e encontrada! Numero: ${dadosOriginal.numeroNfse}`,
          data: {
            numero_nfse: dadosOriginal.numeroNfse,
            codigo_verificacao: dadosOriginal.codigoVerificacao,
            status: "emitida",
          },
        })
      }
    }

    // Metodo 1: Consulta por RPS (PedidoConsultaNFe com ChaveRPS)
    console.log("[v0] Metodo 1: Consultando NFS-e por RPS:", nota.numero_rps, "Serie:", nota.serie_rps)
    const xmlConsultaRps = gerarXmlConsultaNfseRps(
      config.cnpj,
      config.inscricao_municipal,
      nota.numero_rps,
      nota.serie_rps || "11"
    )
    console.log("[v0] XML de consulta por RPS:", xmlConsultaRps)

    const responseRps = await consultarNfse(
      xmlConsultaRps,
      config.ambiente,
      config.certificado_base64,
      config.certificado_senha
    )

    // Registrar transmissao
    await connection.execute(
      `INSERT INTO nfse_transmissoes (nota_fiscal_id, tipo, xml_envio, xml_retorno, sucesso, codigo_erro, mensagem_erro, tempo_resposta_ms)
       VALUES (?, 'consulta_rps', ?, ?, ?, ?, ?, ?)`,
      [id, xmlConsultaRps, responseRps.xml, responseRps.success ? 1 : 0, null, responseRps.erro || null, responseRps.tempoMs]
    )

    if (responseRps.success) {
      const dadosRps = extrairDadosNfseRetorno(responseRps.xml)
      if (dadosRps.sucesso && dadosRps.numeroNfse) {
        console.log("[v0] NFS-e encontrada via consulta RPS! Numero:", dadosRps.numeroNfse)
        await connection.execute(
          `UPDATE notas_fiscais SET 
            numero_nfse = ?, codigo_verificacao = ?, status = 'emitida',
            data_emissao = COALESCE(data_emissao, NOW()), xml_retorno = ?, updated_at = CURRENT_TIMESTAMP
           WHERE id = ?`,
          [dadosRps.numeroNfse, dadosRps.codigoVerificacao || null, responseRps.xml, id]
        )
        await connection.execute(
          `UPDATE nfse_config SET ultima_nfse_numero = GREATEST(COALESCE(ultima_nfse_numero, 0), ?) WHERE ativo = 1`,
          [Number(dadosRps.numeroNfse)]
        )
        return NextResponse.json({
          success: true,
          message: `NFS-e encontrada! Numero: ${dadosRps.numeroNfse}`,
          data: {
            numero_nfse: dadosRps.numeroNfse,
            codigo_verificacao: dadosRps.codigoVerificacao,
            status: "emitida",
          },
        })
      } else {
        console.log("[v0] Consulta RPS retornou sucesso mas sem NumeroNFe. Erros:", dadosRps.erros)
      }
    } else {
      console.log("[v0] Consulta RPS falhou:", responseRps.erro)
    }

    // Metodo 2: Consulta por Lote (PedidoConsultaLote com NumeroLote)
    // Extrair NumeroLote do xml_retorno do envio original
    const numLoteMatch = nota.xml_retorno?.match(/<NumeroLote>(\d+)<\/NumeroLote>/)
    if (numLoteMatch) {
      const numLote = parseInt(numLoteMatch[1])
      console.log("[v0] Metodo 2: Consultando por lote:", numLote)

      const xmlConsultaLote = gerarXmlConsultaLote(config.cnpj, numLote)
      const responseLote = await consultarLote(
        xmlConsultaLote,
        config.ambiente,
        config.certificado_base64,
        config.certificado_senha
      )

      // Registrar transmissao
      await connection.execute(
        `INSERT INTO nfse_transmissoes (nota_fiscal_id, tipo, xml_envio, xml_retorno, sucesso, codigo_erro, mensagem_erro, tempo_resposta_ms)
         VALUES (?, 'consulta_lote', ?, ?, ?, ?, ?, ?)`,
        [id, xmlConsultaLote, responseLote.xml, responseLote.success ? 1 : 0, null, responseLote.erro || null, responseLote.tempoMs]
      )

      if (responseLote.success) {
        const dadosLote = extrairDadosNfseRetorno(responseLote.xml)
        if (dadosLote.sucesso && dadosLote.numeroNfse) {
          console.log("[v0] NFS-e encontrada via consulta lote! Numero:", dadosLote.numeroNfse)
          await connection.execute(
            `UPDATE notas_fiscais SET 
              numero_nfse = ?, codigo_verificacao = ?, status = 'emitida',
              data_emissao = COALESCE(data_emissao, NOW()), xml_retorno = ?, updated_at = CURRENT_TIMESTAMP
             WHERE id = ?`,
            [dadosLote.numeroNfse, dadosLote.codigoVerificacao || null, responseLote.xml, id]
          )
          await connection.execute(
            `UPDATE nfse_config SET ultima_nfse_numero = GREATEST(COALESCE(ultima_nfse_numero, 0), ?) WHERE ativo = 1`,
            [Number(dadosLote.numeroNfse)]
          )
          return NextResponse.json({
            success: true,
            message: `NFS-e encontrada! Numero: ${dadosLote.numeroNfse}`,
            data: {
              numero_nfse: dadosLote.numeroNfse,
              codigo_verificacao: dadosLote.codigoVerificacao,
              status: "emitida",
            },
          })
        } else {
          console.log("[v0] Consulta lote retornou sucesso mas sem NumeroNFe. Erros:", dadosLote.erros)
        }
      } else {
        console.log("[v0] Consulta lote falhou:", responseLote.erro)
      }
    }

    // Nenhum metodo retornou a NFS-e
    // Verificar se houve erros especificos
    const errosRps = responseRps.success ? extrairDadosNfseRetorno(responseRps.xml).erros : [responseRps.erro || "Falha na comunicacao"]
    const todosErros = errosRps.filter(Boolean)

    // Se o erro indica que o RPS nao foi encontrado, pode estar realmente processando ainda
    const aindaProcessando = todosErros.some(
      (e) =>
        e?.toLowerCase().includes("nao encontrad") ||
        e?.toLowerCase().includes("não encontrad") ||
        e?.toLowerCase().includes("processamento") ||
        e?.toLowerCase().includes("nenhuma") ||
        e?.includes("Erro 9") // Erro 9 = "Nenhuma NFS-e encontrada"
    )

    if (!aindaProcessando && todosErros.length > 0) {
      // Erro real - atualizar status se fizer sentido
      const erroMsg = todosErros.join("; ")
      console.log("[v0] Erros na consulta (nao processando):", erroMsg)
      
      return NextResponse.json({
        success: false,
        message: "Erro na consulta: " + erroMsg,
        data: { status: "erro", erros: todosErros },
      })
    }

    return NextResponse.json({
      success: false,
      message: "NFS-e ainda nao encontrada na prefeitura. O RPS pode estar em processamento. Tente novamente em alguns instantes.",
      data: { status: "processando" },
    })
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
