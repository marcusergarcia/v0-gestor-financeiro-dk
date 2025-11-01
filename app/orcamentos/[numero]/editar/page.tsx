import { Suspense } from "react"
import { EditarOrcamentoClient } from "@/components/editar-orcamento-client"
import { Skeleton } from "@/components/ui/skeleton"
import { query } from "@/lib/db"
import { redirect } from "next/navigation"

async function getOrcamento(numero: string) {
  try {
    // Buscar dados do orçamento com informações do cliente e administradora
    const orcamentoQuery = `
      SELECT 
        o.*,
        DATE_FORMAT(o.data_orcamento, '%Y-%m-%d') as data_orcamento,
        DATE_FORMAT(o.data_inicio, '%Y-%m-%d') as data_inicio,
        DATE_FORMAT(o.created_at, '%Y-%m-%d %H:%i:%s') as created_at,
        DATE_FORMAT(o.updated_at, '%Y-%m-%d %H:%i:%s') as updated_at,
        c.nome as cliente_nome,
        c.codigo as cliente_codigo,
        c.cnpj as cliente_cnpj,
        c.cpf as cliente_cpf,
        c.email as cliente_email,
        c.telefone as cliente_telefone,
        c.endereco as cliente_endereco,
        c.bairro as cliente_bairro,
        c.cidade as cliente_cidade,
        c.estado as cliente_estado,
        c.distancia_km,
        c.nome_adm,
        c.contato_adm,
        c.telefone_adm,
        c.email_adm
      FROM orcamentos o
      LEFT JOIN clientes c ON o.cliente_id = c.id
      WHERE o.numero = ?
    `

    const orcamentos = await query(orcamentoQuery, [numero])

    if (!orcamentos || orcamentos.length === 0) {
      redirect("/orcamentos")
    }

    const orcamento = orcamentos[0]

    // Buscar itens do orçamento com informações dos produtos
    const itensQuery = `
      SELECT 
        oi.*,
        p.codigo as produto_codigo,
        p.descricao as produto_descricao,
        p.unidade as produto_unidade,
        p.ncm as produto_ncm,
        p.marca as marca_nome
      FROM orcamentos_itens oi
      LEFT JOIN produtos p ON oi.produto_id = p.id
      WHERE oi.orcamento_numero = ?
      ORDER BY oi.id
    `

    const itens = await query(itensQuery, [numero])

    // Montar resposta
    return {
      ...orcamento,
      itens: itens || [],
    }
  } catch (error) {
    console.error("Erro ao buscar orçamento:", error)
    redirect("/orcamentos")
  }
}

export default async function EditarOrcamentoPage({ params }: { params: Promise<{ numero: string }> }) {
  const { numero } = await params
  const data = await getOrcamento(numero)

  // Extract items from the data
  const itens = data.itens || []

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto py-8">
        <Suspense
          fallback={
            <div className="space-y-4">
              <Skeleton className="h-12 w-64" />
              <Skeleton className="h-96 w-full" />
            </div>
          }
        >
          <EditarOrcamentoClient orcamento={data} itensIniciais={itens} />
        </Suspense>
      </div>
    </div>
  )
}
