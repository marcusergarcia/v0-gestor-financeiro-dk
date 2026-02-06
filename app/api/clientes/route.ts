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

    // Verificar duplicidade de CNPJ
    if (data.cnpj && data.cnpj.trim()) {
      const cnpjExistente = await query(
        "SELECT id, nome, codigo FROM clientes WHERE cnpj = ? AND (status IS NULL OR status != 'inativo') LIMIT 1",
        [data.cnpj.toUpperCase().replace(/[^\d]/g, "")]
      )
      if (cnpjExistente && cnpjExistente.length > 0) {
        return NextResponse.json(
          {
            success: false,
            message: `CNPJ ja cadastrado para o cliente "${cnpjExistente[0].nome}" (Codigo: ${cnpjExistente[0].codigo || "N/A"})`,
            field: "cnpj",
          },
          { status: 409 },
        )
      }
    }

    // Verificar duplicidade de CPF
    if (data.cpf && data.cpf.trim()) {
      const cpfExistente = await query(
        "SELECT id, nome, codigo FROM clientes WHERE cpf = ? AND (status IS NULL OR status != 'inativo') LIMIT 1",
        [data.cpf.toUpperCase().replace(/[^\d]/g, "")]
      )
      if (cpfExistente && cpfExistente.length > 0) {
        return NextResponse.json(
          {
            success: false,
            message: `CPF ja cadastrado para o cliente "${cpfExistente[0].nome}" (Codigo: ${cpfExistente[0].codigo || "N/A"})`,
            field: "cpf",
          },
          { status: 409 },
        )
      }
    }

    // Verificar duplicidade de codigo
    if (data.codigo && data.codigo.trim()) {
      const codigoExistente = await query(
        "SELECT id, nome FROM clientes WHERE codigo = ? AND (status IS NULL OR status != 'inativo') LIMIT 1",
        [data.codigo.toUpperCase()]
      )
      if (codigoExistente && codigoExistente.length > 0) {
        return NextResponse.json(
          {
            success: false,
            message: `Codigo ja cadastrado para o cliente "${codigoExistente[0].nome}"`,
            field: "codigo",
          },
          { status: 409 },
        )
      }
    }

    const insertQuery = `
      INSERT INTO clientes (
        codigo, nome, cnpj, cpf, email, telefone, endereco, bairro,
        cidade, estado, cep, contato, distancia_km, sindico, rg_sindico,
        cpf_sindico, zelador, tem_contrato, dia_contrato, observacoes,
        nome_adm, contato_adm, telefone_adm, email_adm, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `

    const params = [
      data.codigo?.toUpperCase() || null,
      data.nome?.toUpperCase(),
      data.cnpj?.toUpperCase() || null,
      data.cpf?.toUpperCase() || null,
      data.email?.toLowerCase() || null,
      data.telefone || null,
      data.endereco?.toUpperCase() || null,
      data.bairro?.toUpperCase() || null,
      data.cidade?.toUpperCase() || null,
      data.estado?.toUpperCase() || null,
      data.cep || null,
      data.contato?.toUpperCase() || null,
      data.distancia_km || 0,
      data.sindico?.toUpperCase() || null,
      data.rg_sindico?.toUpperCase() || null,
      data.cpf_sindico?.toUpperCase() || null,
      data.zelador?.toUpperCase() || null,
      data.tem_contrato ? 1 : 0,
      data.dia_contrato || null,
      data.observacoes?.toUpperCase() || null,
      data.nome_adm?.toUpperCase() || null,
      data.contato_adm?.toUpperCase() || null,
      data.telefone_adm || null,
      data.email_adm?.toLowerCase() || null,
    ]

    const result = await query(insertQuery, params)

    return NextResponse.json({
      success: true,
      message: "Cliente criado com sucesso",
      data: { id: result.insertId, ...data },
    })
  } catch (error: any) {
    console.error("Erro ao criar cliente:", error?.message || error)

    // Tratar erro de duplicidade do MySQL (ER_DUP_ENTRY)
    if (error?.code === "ER_DUP_ENTRY" || error?.errno === 1062) {
      const msg = error?.message || ""
      if (msg.includes("cnpj")) {
        return NextResponse.json(
          { success: false, message: "CNPJ ja cadastrado para outro cliente", field: "cnpj" },
          { status: 409 },
        )
      }
      if (msg.includes("cpf")) {
        return NextResponse.json(
          { success: false, message: "CPF ja cadastrado para outro cliente", field: "cpf" },
          { status: 409 },
        )
      }
      if (msg.includes("codigo")) {
        return NextResponse.json(
          { success: false, message: "Codigo ja cadastrado para outro cliente", field: "codigo" },
          { status: 409 },
        )
      }
      return NextResponse.json(
        { success: false, message: "Registro duplicado. Verifique CNPJ, CPF ou Codigo." },
        { status: 409 },
      )
    }

    return NextResponse.json(
      { success: false, message: "Erro interno do servidor" },
      { status: 500 },
    )
  }
}
