import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const usuarios = await query("SELECT * FROM usuarios WHERE id = ?", [id])

    if (usuarios.length === 0) {
      return NextResponse.json({ success: false, message: "Usuário não encontrado" }, { status: 404 })
    }

    const usuario = usuarios[0]

    // Parse das permissões JSON
    if (usuario.permissoes) {
      usuario.permissoes = JSON.parse(usuario.permissoes)
    }

    return NextResponse.json({
      success: true,
      data: usuario,
    })
  } catch (error) {
    console.error("Erro ao buscar usuário:", error)
    return NextResponse.json({ success: false, message: "Erro ao buscar usuário" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const { nome, email, cpf, telefone, tipo, senha, ativo, permissoes } = body

    // Verificar se email já existe em outro usuário
    const existingUser = await query("SELECT id FROM usuarios WHERE email = ? AND id != ?", [email, id])

    if (existingUser.length > 0) {
      return NextResponse.json({ success: false, message: "Email já cadastrado para outro usuário" }, { status: 400 })
    }

    // Converter permissões para JSON
    const permissoesJson = permissoes ? JSON.stringify(permissoes) : null

    let updateQuery = `
      UPDATE usuarios 
      SET nome = ?, email = ?, cpf = ?, telefone = ?, tipo = ?, ativo = ?, permissoes = ?, updated_at = NOW()
    `
    const params_array = [nome, email, cpf || null, telefone || null, tipo, ativo, permissoesJson]

    if (senha && senha.trim() !== "") {
      updateQuery += ", senha = ?"
      params_array.push(senha)
    }

    updateQuery += " WHERE id = ?"
    params_array.push(id)

    await query(updateQuery, params_array)

    return NextResponse.json({
      success: true,
      message: "Usuário atualizado com sucesso",
    })
  } catch (error) {
    console.error("Erro ao atualizar usuário:", error)
    return NextResponse.json({ success: false, message: "Erro ao atualizar usuário" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    // Verificar se usuário existe
    const usuario = await query("SELECT id FROM usuarios WHERE id = ?", [id])

    if (usuario.length === 0) {
      return NextResponse.json({ success: false, message: "Usuário não encontrado" }, { status: 404 })
    }

    await query("DELETE FROM usuarios WHERE id = ?", [id])

    return NextResponse.json({
      success: true,
      message: "Usuário excluído com sucesso",
    })
  } catch (error) {
    console.error("Erro ao excluir usuário:", error)
    return NextResponse.json({ success: false, message: "Erro ao excluir usuário" }, { status: 500 })
  }
}
