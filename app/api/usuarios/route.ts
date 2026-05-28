import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET() {
  try {
    const usuarios = await query(`
      SELECT 
        id,
        nome,
        email,
        cpf,
        telefone,
        tipo,
        ativo,
        ultimo_acesso,
        data_criacao,
        permissoes,
        configuracoes
      FROM usuarios 
      ORDER BY nome ASC
    `)

    // Parse das permissões JSON para cada usuário
    const usuariosComPermissoes = usuarios.map((usuario: any) => ({
      ...usuario,
      permissoes: usuario.permissoes ? JSON.parse(usuario.permissoes) : null,
    }))

    return NextResponse.json({
      success: true,
      data: usuariosComPermissoes,
    })
  } catch (error) {
    console.error("Erro ao buscar usuários:", error)
    return NextResponse.json({ success: false, message: "Erro ao buscar usuários" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { nome, email, cpf, telefone, tipo, senha, ativo = 1, permissoes } = body

    // Verificar se email já existe
    const existingUser = await query("SELECT id FROM usuarios WHERE email = ?", [email])

    if (existingUser.length > 0) {
      return NextResponse.json({ success: false, message: "Email já cadastrado" }, { status: 400 })
    }

    // Converter permissões para JSON
    const permissoesJson = permissoes ? JSON.stringify(permissoes) : null

    const result = await query(
      `
      INSERT INTO usuarios (nome, email, cpf, telefone, tipo, senha, ativo, permissoes, data_criacao)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `,
      [nome, email, cpf || null, telefone || null, tipo, senha, ativo, permissoesJson],
    )

    return NextResponse.json({
      success: true,
      message: "Usuário criado com sucesso",
      data: { id: result.insertId },
    })
  } catch (error) {
    console.error("Erro ao criar usuário:", error)
    return NextResponse.json({ success: false, message: "Erro ao criar usuário" }, { status: 500 })
  }
}
