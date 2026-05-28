import { type NextRequest, NextResponse } from "next/server"
import { pool } from "@/lib/db"

// Endpoint de debug para ver o XML bruto enviado e recebido da prefeitura
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Buscar nota fiscal
    const [notaRows] = await pool.execute(
      "SELECT id, numero_rps, serie_rps, numero_nfse, status, mensagem_erro, xml_envio, xml_retorno, created_at FROM notas_fiscais WHERE id = ?",
      [id]
    )
    const notas = notaRows as any[]
    if (notas.length === 0) {
      return NextResponse.json({ error: "Nota nao encontrada" }, { status: 404 })
    }
    const nota = notas[0]

    // Buscar transmissoes
    const [transRows] = await pool.execute(
      "SELECT id, tipo, xml_envio, xml_retorno, sucesso, codigo_erro, mensagem_erro, tempo_resposta_ms, created_at FROM nfse_transmissoes WHERE nota_fiscal_id = ? ORDER BY created_at DESC",
      [id]
    )

    return NextResponse.json({
      nota: {
        id: nota.id,
        numero_rps: nota.numero_rps,
        serie_rps: nota.serie_rps,
        numero_nfse: nota.numero_nfse,
        status: nota.status,
        mensagem_erro: nota.mensagem_erro,
        xml_envio_length: nota.xml_envio?.length || 0,
        xml_envio: nota.xml_envio,
        xml_retorno_length: nota.xml_retorno?.length || 0,
        xml_retorno: nota.xml_retorno,
        created_at: nota.created_at,
      },
      transmissoes: (transRows as any[]).map(t => ({
        id: t.id,
        tipo: t.tipo,
        sucesso: t.sucesso,
        codigo_erro: t.codigo_erro,
        mensagem_erro: t.mensagem_erro,
        tempo_resposta_ms: t.tempo_resposta_ms,
        xml_envio_length: t.xml_envio?.length || 0,
        xml_envio: t.xml_envio,
        xml_retorno_length: t.xml_retorno?.length || 0,
        xml_retorno: t.xml_retorno,
        created_at: t.created_at,
      })),
    })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Erro" }, { status: 500 })
  }
}
