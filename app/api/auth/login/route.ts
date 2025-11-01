import { NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function POST(request: Request) {
  try {
    const { email, senha } = await request.json()

    if (!email || !senha) {
      return NextResponse.json({ success: false, message: "Email e senha são obrigatórios" }, { status: 400 })
    }

    // Buscar usuário no banco
    const usuarios = (await query(
      `SELECT id, nome, email, cpf, telefone, tipo, perfil, senha, ativo, permissoes, configuracoes
       FROM usuarios 
       WHERE email = ? AND ativo = 1`,
      [email],
    )) as any[]

    if (usuarios.length === 0) {
      return NextResponse.json({ success: false, message: "Usuário não encontrado ou inativo" }, { status: 401 })
    }

    const usuario = usuarios[0]

    // Verificar senha (suporta texto simples e hash básico)
    const senhaValida =
      usuario.senha === senha ||
      usuario.senha === Buffer.from(senha).toString("base64") ||
      // Para senhas que podem estar hasheadas de forma simples
      usuario.senha.toLowerCase() === senha.toLowerCase()

    if (!senhaValida) {
      return NextResponse.json({ success: false, message: "Senha incorreta" }, { status: 401 })
    }

    // Atualizar último acesso
    await query(`UPDATE usuarios SET ultimo_acesso = NOW() WHERE id = ?`, [usuario.id])

    // Preparar dados do usuário para retorno (sem a senha)
    const userData = {
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
    }

    return NextResponse.json({
      success: true,
      message: "Login realizado com sucesso!",
      user: userData,
    })
  } catch (error) {
    console.error("Erro no login:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Erro interno do servidor",
        error: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 },
    )
  }
}
