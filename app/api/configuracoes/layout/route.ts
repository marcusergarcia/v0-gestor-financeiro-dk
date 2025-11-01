import { NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET() {
  try {
    const result = await query(`SELECT * FROM timbrado_config WHERE ativo = 1 ORDER BY id DESC LIMIT 1`)

    if (result.length > 0) {
      return NextResponse.json({
        success: true,
        data: result[0],
      })
    }

    return NextResponse.json({
      success: true,
      data: null,
    })
  } catch (error) {
    console.error("Erro ao buscar configuração:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Erro ao buscar configuração de layout",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json()

    // Verifica se já existe uma configuração
    const existing = await query(`SELECT id FROM timbrado_config WHERE ativo = 1 LIMIT 1`)

    if (existing.length > 0) {
      // Atualiza configuração existente
      await query(
        `UPDATE timbrado_config SET 
          empresa_nome = ?,
          empresa_cnpj = ?,
          empresa_endereco = ?,
          empresa_cep = ?,
          empresa_bairro = ?,
          empresa_cidade = ?,
          empresa_uf = ?,
          empresa_telefone = ?,
          empresa_email = ?,
          empresa_site = ?,
          empresa_representante_legal = ?,
          representante_nacionalidade = ?,
          representante_estado_civil = ?,
          representante_rg = ?,
          representante_cpf = ?,
          empresa_latitude = ?,
          empresa_longitude = ?,
          tamanho_papel = ?,
          orientacao = ?,
          margem_superior = ?,
          margem_inferior = ?,
          margem_esquerda = ?,
          margem_direita = ?,
          cabecalho = ?,
          rodape = ?,
          rodape_texto = ?,
          updated_at = NOW()
        WHERE id = ?`,
        [
          data.empresa_nome || null,
          data.empresa_cnpj || null,
          data.empresa_endereco || null,
          data.empresa_cep || null,
          data.empresa_bairro || null,
          data.empresa_cidade || null,
          data.empresa_uf || null,
          data.empresa_telefone || null,
          data.empresa_email || null,
          data.empresa_site || null,
          data.empresa_representante_legal || null,
          data.representante_nacionalidade || null,
          data.representante_estado_civil || null,
          data.representante_rg || null,
          data.representante_cpf || null,
          data.empresa_latitude || null,
          data.empresa_longitude || null,
          data.tamanho_papel || "A4",
          data.orientacao || "retrato",
          data.margem_superior || 10,
          data.margem_inferior || 10,
          data.margem_esquerda || 15,
          data.margem_direita || 15,
          data.cabecalho || null,
          data.rodape || null,
          data.rodape_texto || null,
          existing[0].id,
        ],
      )

      return NextResponse.json({
        success: true,
        message: "Configurações atualizadas com sucesso!",
      })
    } else {
      // Insere nova configuração
      await query(
        `INSERT INTO timbrado_config (
          empresa_nome,
          empresa_cnpj,
          empresa_endereco,
          empresa_cep,
          empresa_bairro,
          empresa_cidade,
          empresa_uf,
          empresa_telefone,
          empresa_email,
          empresa_site,
          empresa_representante_legal,
          representante_nacionalidade,
          representante_estado_civil,
          representante_rg,
          representante_cpf,
          empresa_latitude,
          empresa_longitude,
          tamanho_papel,
          orientacao,
          margem_superior,
          margem_inferior,
          margem_esquerda,
          margem_direita,
          cabecalho,
          rodape,
          rodape_texto,
          ativo,
          created_at,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, NOW(), NOW())`,
        [
          data.empresa_nome || null,
          data.empresa_cnpj || null,
          data.empresa_endereco || null,
          data.empresa_cep || null,
          data.empresa_bairro || null,
          data.empresa_cidade || null,
          data.empresa_uf || null,
          data.empresa_telefone || null,
          data.empresa_email || null,
          data.empresa_site || null,
          data.empresa_representante_legal || null,
          data.representante_nacionalidade || null,
          data.representante_estado_civil || null,
          data.representante_rg || null,
          data.representante_cpf || null,
          data.empresa_latitude || null,
          data.empresa_longitude || null,
          data.tamanho_papel || "A4",
          data.orientacao || "retrato",
          data.margem_superior || 10,
          data.margem_inferior || 10,
          data.margem_esquerda || 15,
          data.margem_direita || 15,
          data.cabecalho || null,
          data.rodape || null,
          data.rodape_texto || null,
        ],
      )

      return NextResponse.json({
        success: true,
        message: "Configurações salvas com sucesso!",
      })
    }
  } catch (error) {
    console.error("Erro ao salvar configuração:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Erro ao salvar configurações de layout",
      },
      { status: 500 },
    )
  }
}
