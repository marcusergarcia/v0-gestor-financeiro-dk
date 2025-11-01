export interface Orcamento {
  status: ReactNode
  status: string
  data_criacao: string | number | Date
  desconto_valor: any
  desconto_percentual: any
  id: string
  numero: string
  cliente_id: number
  tipo_servico: string
  detalhes_servico?: string
  valor_material: number
  valor_mao_obra: number
  desconto: number
  valor_total: number
  data_orcamento: string
  validade?: number
  situacao: "pendente" | "aprovado" | "rejeitado" | "cancelado"
  observacoes?: string
  created_at: string
  updated_at: string
  cliente_nome?: string
  cliente_codigo?: string
}

export interface OrcamentoItem {
  produto: any
  produto: any
  id: string
  orcamento_id: string
  produto_id: string
  produto_codigo?: string
  produto_nome?: string
  quantidade: number
  valor_unitario: number
  valor_mao_obra: number
  valor_total: number
  descricao_personalizada?: string
  categoria_nome?: string
  marca_nome?: string
  created_at: string
}

export interface Cliente {
  id: number
  codigo: string
  nome: string
  cnpj?: string
  cpf?: string
  email?: string
  telefone?: string
  endereco?: string
  bairro?: string
  cidade?: string
  estado?: string
  cep?: string
  contato?: string
  distancia_km?: number
  sindico?: string
  rg_sindico?: string
  cpf_sindico?: string
  zelador?: string
  tem_contrato: boolean
  dia_contrato?: number
  observacoes?: string
  status: string
  created_at: string
}

export interface Produto {
  id: string
  codigo: string
  descricao: string
  categoria_id: string
  categoria_nome?: string
  marca_id: string
  marca_nome?: string
  ncm?: string
  unidade: string
  valor_unitario: number
  valor_mao_obra: number
  valor_custo: number
  margem_lucro: number
  estoque: number
  estoque_minimo: number
  observacoes?: string
  ativo: boolean
}
