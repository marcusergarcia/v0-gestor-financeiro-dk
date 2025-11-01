import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search")
    const limit = Number.parseInt(searchParams.get("limit") || "1000")

    let searchQuery = `
      SELECT
        id,
        codigo,
        nome,
        cnpj,
        cpf,
        email,
        telefone,
        endereco,
        bairro,
        cidade,
        estado,
        cep,
        contato,
        distancia_km,
        sindico,
        rg_sindico,
        cpf_sindico,
        zelador,
        tem_contrato,
        dia_contrato,
        observacoes,
        status,
        created_at,
        nome_adm,
        contato_adm,
        telefone_adm,
        email_adm
      FROM clientes
      WHERE (status IS NULL OR status != 'inativo')
    `

    const params: any[] = []

    if (search && search.trim()) {
      searchQuery += ` AND (
        nome LIKE ? OR 
        codigo LIKE ? OR 
        cnpj LIKE ? OR 
        cpf LIKE ? OR 
        email LIKE ? OR 
        telefone LIKE ? OR 
        cidade LIKE ?
      )`
      const searchTerm = `%${search.trim()}%`
      params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm)
    }

    searchQuery += ` ORDER BY
      CASE WHEN tem_contrato = 1 THEN 0 ELSE 1 END,
      nome
      LIMIT ?`

    params.push(limit)

    const clientes = await query(searchQuery, params)

    // Log apenas quando há busca específica ou em desenvolvimento com poucos resultados
    if (search || (process.env.NODE_ENV === "development" && clientes.length < 10)) {
      console.log(`📊 Clientes encontrados: ${clientes.length}${search ? ` (busca: "${search}")` : ""}`)
    }

    return NextResponse.json({
      success: true,
      data: clientes || [],
    })
  } catch (error) {
    console.error("❌ Erro ao buscar clientes:", error)
    return NextResponse.json({ success: false, message: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()

    const insertQuery = `
      INSERT INTO clientes (
        codigo, nome, cnpj, cpf, email, telefone, endereco, bairro,
        cidade, estado, cep, contato, distancia_km, sindico, rg_sindico,
        cpf_sindico, zelador, tem_contrato, dia_contrato, observacoes,
        nome_adm, contato_adm, telefone_adm, email_adm, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `

    const result = await query(insertQuery, [
      data.codigo || null,
      data.nome,
      data.cnpj || null,
      data.cpf || null,
      data.email || null,
      data.telefone || null,
      data.endereco || null,
      data.bairro || null,
      data.cidade || null,
      data.estado || null,
      data.cep || null,
      data.contato || null,
      data.distancia_km || 0,
      data.sindico || null,
      data.rg_sindico || null,
      data.cpf_sindico || null,
      data.zelador || null,
      data.tem_contrato || 0,
      data.dia_contrato || null,
      data.observacoes || null,
      data.nome_adm || null,
      data.contato_adm || null,
      data.telefone_adm || null,
      data.email_adm || null,
    ])

    console.log(`✅ Cliente criado: ${data.nome} (ID: ${result.insertId})`)

    return NextResponse.json({
      success: true,
      message: "Cliente criado com sucesso",
      data: { id: result.insertId, ...data },
    })
  } catch (error) {
    console.error("❌ Erro ao criar cliente:", error)
    return NextResponse.json({ success: false, message: "Erro interno do servidor" }, { status: 500 })
  }
}
