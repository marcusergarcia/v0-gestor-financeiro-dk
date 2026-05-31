import { NextResponse } from "next/server"
import { pool } from "@/lib/db"

const DEFAULT_CATEGORIES = [
  { nome: "Faturamento", tipo: "entrada" },
  { nome: "Outras Receitas", tipo: "entrada" },
  { nome: "Investimentos", tipo: "entrada" },
  { nome: "Alimentação", tipo: "saida" },
  { nome: "Tecnologia & SaaS", tipo: "saida" },
  { nome: "Transporte & Viagem", tipo: "saida" },
  { nome: "Combustível", tipo: "saida" },
  { nome: "Impostos & Tributos", tipo: "saida" },
  { nome: "Aluguel & Condomínio", tipo: "saida" },
  { nome: "Energia Elétrica", tipo: "saida" },
  { nome: "Água, Esgoto & Gás", tipo: "saida" },
  { nome: "Internet & Telefone", tipo: "saida" },
  { nome: "Marketing & Anúncios", tipo: "saida" },
  { nome: "Pessoal & Pro-labore", tipo: "saida" },
  { nome: "Tarifas Bancárias", tipo: "saida" },
  { nome: "Material de Escritório", tipo: "saida" },
  { nome: "Fornecedores", tipo: "saida" },
  { nome: "Outras Despesas", tipo: "saida" },
  { nome: "Outros", tipo: "saida" }
]

async function ensureTableAndSeed() {
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS categorias_financeiras (
      id INT AUTO_INCREMENT PRIMARY KEY,
      nome VARCHAR(100) NOT NULL UNIQUE,
      tipo ENUM('entrada', 'saida') NOT NULL DEFAULT 'saida',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Check columns to ensure 'tipo' column is present
  const [columns]: any = await pool.execute("SHOW COLUMNS FROM categorias_financeiras LIKE 'tipo'")
  if (columns.length === 0) {
    await pool.execute("ALTER TABLE categorias_financeiras ADD COLUMN tipo ENUM('entrada', 'saida') NOT NULL DEFAULT 'saida'")
  }

  const [rows]: any = await pool.execute("SELECT COUNT(*) as count FROM categorias_financeiras")
  if (rows[0].count === 0) {
    for (const cat of DEFAULT_CATEGORIES) {
      await pool.execute("INSERT IGNORE INTO categorias_financeiras (nome, tipo) VALUES (?, ?)", [cat.nome, cat.tipo])
    }
  }
}

export async function GET() {
  try {
    await ensureTableAndSeed()
    const [rows]: any = await pool.execute("SELECT nome, tipo FROM categorias_financeiras ORDER BY nome ASC")
    return NextResponse.json({ success: true, data: rows })
  } catch (error: any) {
    console.error("Erro ao buscar categorias:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    await ensureTableAndSeed()
    const { nome, tipo } = await request.json()
    if (!nome || !nome.trim()) {
      return NextResponse.json({ success: false, error: "Nome da categoria é obrigatório" }, { status: 400 })
    }

    const trimmedNome = nome.trim()
    const finalTipo = tipo === "entrada" ? "entrada" : "saida"
    await pool.execute("INSERT IGNORE INTO categorias_financeiras (nome, tipo) VALUES (?, ?)", [trimmedNome, finalTipo])
    return NextResponse.json({ success: true, data: { nome: trimmedNome, tipo: finalTipo } })
  } catch (error: any) {
    console.error("Erro ao criar categoria:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    await ensureTableAndSeed()
    const { searchParams } = new URL(request.url)
    const nome = searchParams.get("nome")

    if (!nome) {
      return NextResponse.json({ success: false, error: "Nome da categoria é obrigatório" }, { status: 400 })
    }

    // Verificar se a categoria está sendo usada em alguma transação ativa
    const [txRows]: any = await pool.execute(
      "SELECT COUNT(*) as count FROM transacoes_financeiras WHERE categoria = ? AND ativo = 1",
      [nome]
    )

    if (txRows[0].count > 0) {
      return NextResponse.json({
        success: false,
        error: `A categoria "${nome}" está sendo usada em ${txRows[0].count} lançamento(s) e não pode ser excluída.`
      }, { status: 400 })
    }

    await pool.execute("DELETE FROM categorias_financeiras WHERE nome = ?", [nome])
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Erro ao deletar categoria:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
