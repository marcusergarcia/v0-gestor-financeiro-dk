import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    const token = authHeader?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ error: "Token não fornecido" }, { status: 401 })
    }

    // Buscar usuário pelo token armazenado
    const userDataString = request.cookies.get("user")?.value

    if (!userDataString) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 401 })
    }

    const userData = JSON.parse(userDataString)

    // Buscar dados atualizados do usuário no banco
    const usuarios = (await query(
      `SELECT id, nome, email, cpf, telefone, tipo, perfil, ativo, permissoes, configuracoes
       FROM usuarios 
       WHERE id = ? AND ativo = 1`,
      [userData.id],
    )) as any[]

    if (usuarios.length === 0) {
      return NextResponse.json({ error: "Usuário não encontrado ou inativo" }, { status: 401 })
    }

    const usuario = usuarios[0]

    return NextResponse.json({
      user: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        cpf: usuario.cpf,
        telefone: usuario.telefone,
        tipo: usuario.tipo,
        perfil: usuario.perfil || usuario.tipo,
        ativo: usuario.ativo,
        permissoes: usuario.permissoes,
        configuracoes: usuario.configuracoes,
      },
    })
  } catch (error) {
    console.error("Erro ao verificar autenticação:", error)
    return NextResponse.json({ error: "Erro ao verificar autenticação" }, { status: 500 })
  }
}
