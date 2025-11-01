import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET() {
  try {
    const config = await query("SELECT * FROM timbrado_config WHERE ativo = 1 LIMIT 1")

    if ((config as any[]).length === 0) {
      // Retornar configuração padrão se não existir
      return NextResponse.json({
        success: true,
        data: {
          empresa_nome: "",
          empresa_cnpj: "",
          empresa_endereco: "",
          empresa_telefone: "",
          empresa_email: "",
          empresa_site: "",
          tamanho_papel: "A4",
          orientacao: "retrato",
          margem_superior: 20,
          margem_inferior: 20,
          margem_esquerda: 20,
          margem_direita: 20,
          cabecalho: "",
          rodape: "",
        },
      })
    }

    return NextResponse.json({
      success: true,
      data: (config as any[])[0],
    })
  } catch (error) {
    console.error("Erro ao buscar configuração do timbrado:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Erro ao buscar configuração",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      empresa_nome,
      empresa_cnpj,
      empresa_endereco,
      empresa_telefone,
      empresa_email,
      empresa_site,
      tamanho_papel,
      orientacao,
      margem_superior,
      margem_inferior,
      margem_esquerda,
      margem_direita,
      cabecalho,
      rodape,
    } = body

    // Desativar configurações existentes
    await query("UPDATE timbrado_config SET ativo = 0")

    // Inserir nova configuração
    const result = await query(
      `
      INSERT INTO timbrado_config (
        empresa_nome, empresa_cnpj, empresa_endereco, empresa_telefone,
        empresa_email, empresa_site, tamanho_papel, orientacao,
        margem_superior, margem_inferior, margem_esquerda, margem_direita,
        cabecalho, rodape, ativo
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `,
      [
        empresa_nome,
        empresa_cnpj,
        empresa_endereco,
        empresa_telefone,
        empresa_email,
        empresa_site,
        tamanho_papel,
        orientacao,
        margem_superior,
        margem_inferior,
        margem_esquerda,
        margem_direita,
        cabecalho,
        rodape,
      ],
    )

    const novaConfig = await query("SELECT * FROM timbrado_config WHERE id = ?", [(result as any).insertId])

    return NextResponse.json({
      success: true,
      data: (novaConfig as any[])[0],
      message: "Configuração salva com sucesso",
    })
  } catch (error) {
    console.error("Erro ao salvar configuração:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Erro ao salvar configuração",
      },
      { status: 500 },
    )
  }
}
