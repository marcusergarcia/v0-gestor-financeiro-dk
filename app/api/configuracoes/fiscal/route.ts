import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET() {
  try {
    const configs = await query(`SELECT * FROM configuracao_fiscal WHERE ativo = 1 LIMIT 1`)

    if ((configs as any[]).length === 0) {
      return NextResponse.json({
        success: true,
        data: null,
      })
    }

    return NextResponse.json({
      success: true,
      data: (configs as any[])[0],
    })
  } catch (error) {
    console.error("Erro ao buscar configuracao fiscal:", error)
    return NextResponse.json(
      { success: false, message: "Erro ao buscar configuracao fiscal" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      municipal_service_id,
      municipal_service_code,
      municipal_service_name,
      descricao_servico_padrao,
      iss_percentual = 5.0,
      cofins_percentual = 0,
      csll_percentual = 0,
      inss_percentual = 0,
      ir_percentual = 0,
      pis_percentual = 0,
      reter_iss = false,
      emissao_automatica = false,
    } = body

    // Verificar se ja existe configuracao
    const existente = await query(`SELECT id FROM configuracao_fiscal WHERE ativo = 1 LIMIT 1`)

    if ((existente as any[]).length > 0) {
      await query(
        `
        UPDATE configuracao_fiscal SET
          municipal_service_id = ?,
          municipal_service_code = ?,
          municipal_service_name = ?,
          descricao_servico_padrao = ?,
          iss_percentual = ?,
          cofins_percentual = ?,
          csll_percentual = ?,
          inss_percentual = ?,
          ir_percentual = ?,
          pis_percentual = ?,
          reter_iss = ?,
          emissao_automatica = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `,
        [
          municipal_service_id || null,
          municipal_service_code || null,
          municipal_service_name || null,
          descricao_servico_padrao || null,
          iss_percentual,
          cofins_percentual,
          csll_percentual,
          inss_percentual,
          ir_percentual,
          pis_percentual,
          reter_iss ? 1 : 0,
          emissao_automatica ? 1 : 0,
          (existente as any[])[0].id,
        ]
      )
    } else {
      await query(
        `
        INSERT INTO configuracao_fiscal (
          municipal_service_id, municipal_service_code, municipal_service_name,
          descricao_servico_padrao,
          iss_percentual, cofins_percentual, csll_percentual,
          inss_percentual, ir_percentual, pis_percentual,
          reter_iss, emissao_automatica
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
        [
          municipal_service_id || null,
          municipal_service_code || null,
          municipal_service_name || null,
          descricao_servico_padrao || null,
          iss_percentual,
          cofins_percentual,
          csll_percentual,
          inss_percentual,
          ir_percentual,
          pis_percentual,
          reter_iss ? 1 : 0,
          emissao_automatica ? 1 : 0,
        ]
      )
    }

    return NextResponse.json({
      success: true,
      message: "Configuracao fiscal salva com sucesso",
    })
  } catch (error) {
    console.error("Erro ao salvar configuracao fiscal:", error)
    return NextResponse.json(
      { success: false, message: "Erro ao salvar configuracao fiscal" },
      { status: 500 }
    )
  }
}
