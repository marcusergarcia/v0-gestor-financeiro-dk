import { type NextRequest, NextResponse } from "next/server"
import { pool } from "@/lib/db"
import { gerarXmlCancelamentoNfse } from "@/lib/nfse/xml-builder"
import { cancelarNfse } from "@/lib/nfse/soap-client"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const connection = await pool.getConnection()
  try {
    const body = await request.json()
    const { motivo } = body

    // Buscar nota fiscal
    const [notaRows] = await connection.execute("SELECT * FROM notas_fiscais WHERE id = ?", [id])
    const notas = notaRows as any[]
    if (notas.length === 0) {
      return NextResponse.json({ success: false, message: "Nota fiscal nao encontrada" }, { status: 404 })
    }
    const nota = notas[0]

    if (nota.status !== "emitida") {
      return NextResponse.json(
        { success: false, message: "Apenas notas emitidas podem ser canceladas" },
        { status: 400 },
      )
    }

    if (!nota.numero_nfse) {
      return NextResponse.json(
        { success: false, message: "Nota nao possui numero NFS-e para cancelamento" },
        { status: 400 },
      )
    }

    // Buscar config
    const [configRows] = await connection.execute("SELECT * FROM nfse_config WHERE ativo = 1 LIMIT 1")
    const configs = configRows as any[]
    if (configs.length === 0) {
      return NextResponse.json({ success: false, message: "Configuracao NFS-e nao encontrada" }, { status: 400 })
    }
    const config = configs[0]

    // Gerar XML de cancelamento
    const xmlCancelamento = gerarXmlCancelamentoNfse(
      config.cnpj,
      config.inscricao_municipal,
      nota.numero_nfse,
    )

    // Enviar cancelamento
    const soapResponse = await cancelarNfse(
      xmlCancelamento, config.ambiente, config.certificado_base64, config.certificado_senha
    )

    // Registrar transmissão
    await connection.execute(
      `INSERT INTO nfse_transmissoes (nota_fiscal_id, tipo, xml_envio, xml_retorno, sucesso, mensagem_erro, tempo_resposta_ms)
       VALUES (?, 'cancelamento', ?, ?, ?, ?, ?)`,
      [id, xmlCancelamento, soapResponse.xml, soapResponse.success ? 1 : 0, soapResponse.erro || null, soapResponse.tempoMs],
    )

    if (soapResponse.success) {
      await connection.execute(
        `UPDATE notas_fiscais SET status = 'cancelada', data_cancelamento = NOW(), motivo_cancelamento = ?, xml_retorno = ? WHERE id = ?`,
        [motivo || "Cancelamento solicitado", soapResponse.xml, id],
      )

      return NextResponse.json({
        success: true,
        message: "NFS-e cancelada com sucesso!",
      })
    } else {
      return NextResponse.json({
        success: false,
        message: "Erro ao cancelar NFS-e: " + soapResponse.erro,
      })
    }
  } catch (error: any) {
    console.error("Erro ao cancelar NFS-e:", error)
    return NextResponse.json(
      { success: false, message: "Erro interno: " + error.message },
      { status: 500 },
    )
  } finally {
    connection.release()
  }
}
