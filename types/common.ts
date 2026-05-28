// CORREÇÃO 2: Tipos centralizados e consistentes

// Tipos base
export interface BaseEntity {
  id: number
  created_at: string
  updated_at?: string
}

// Status padronizados
export type StatusPadrao = "ativo" | "inativo" | "pendente" | "aprovado" | "rejeitado" | "cancelado"

export type SituacaoOrcamento = "pendente" | "enviado" | "aprovado" | "rejeitado" | "cancelado"

export type SituacaoBoleto = "pendente" | "pago" | "vencido" | "cancelado"

export type StatusContrato = "ativo" | "inativo" | "suspenso" | "cancelado"

// Interface padronizada para respostas de API
export interface ApiResponse<T = any> {
  success: boolean
  message?: string
  data?: T
  error?: string
}

// Interface padronizada para paginação
export interface PaginationParams {
  page?: number
  limit?: number
  search?: string
  sortBy?: string
  sortOrder?: "asc" | "desc"
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// Interfaces de entidades principais
export interface Cliente extends BaseEntity {
  codigo?: string
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
  tem_contrato?: boolean
  dia_contrato?: number
  observacoes?: string
  status?: StatusPadrao
  // Campos da administradora
  nome_adm?: string
  contato_adm?: string
  telefone_adm?: string
  email_adm?: string
}

export interface Produto extends BaseEntity {
  codigo: string
  descricao: string
  tipo?: string // Nome da categoria
  marca?: string // Nome da marca
  ncm?: string
  unidade: string
  valor_custo: number
  valor_unitario: number
  valor_mao_obra: number
  margem_lucro: number
  estoque: number
  estoque_minimo: number
  observacoes?: string
  ativo: boolean
}

export interface OrcamentoItem {
  id?: number
  produto_id: number
  produto?: Produto
  quantidade: number
  valor_unitario: number
  valor_mao_obra: number
  valor_total: number
  marca_nome?: string
  produto_ncm?: string
  // Valores ajustados para nota fiscal
  valor_unitario_ajustado?: number
  valor_total_ajustado?: number
}

export interface Orcamento extends BaseEntity {
  numero: string
  cliente_id: number
  cliente?: Cliente
  tipo_servico: string
  detalhes_servico?: string
  valor_material: number
  valor_mao_obra: number
  desconto: number
  valor_total: number
  validade: number
  observacoes?: string
  situacao: SituacaoOrcamento
  data_orcamento: string
  data_inicio?: string
  // Parâmetros de cálculo
  distancia_km: number
  valor_boleto: number
  prazo_dias: number
  juros_am: number
  imposto_servico: number
  imposto_material: number
  desconto_mdo_percent: number
  desconto_mdo_valor: number
  parcelamento_mdo: number
  parcelamento_material: number
  // Relacionamentos
  itens?: OrcamentoItem[]
}

export interface Boleto extends BaseEntity {
  numero: string
  cliente_id: number
  cliente?: Cliente
  valor: number
  data_vencimento: string
  data_pagamento?: string
  status: SituacaoBoleto
  numero_parcela: number
  total_parcelas: number
  observacoes?: string
}

// Tipos para formulários
export interface ClienteFormData extends Omit<Cliente, "id" | "created_at" | "updated_at"> {}

export interface ProdutoFormData extends Omit<Produto, "id" | "created_at" | "updated_at"> {}

export interface OrcamentoFormData extends Omit<Orcamento, "id" | "created_at" | "updated_at" | "numero"> {}

// Tipos para filtros
export interface ClienteFilters extends PaginationParams {
  status?: StatusPadrao
  tem_contrato?: boolean
  cidade?: string
  estado?: string
}

export interface ProdutoFilters extends PaginationParams {
  categoria?: string
  marca?: string
  ativo?: boolean
  estoque_baixo?: boolean
}

export interface OrcamentoFilters extends PaginationParams {
  situacao?: SituacaoOrcamento
  cliente_id?: number
  data_inicio?: string
  data_fim?: string
  valor_min?: number
  valor_max?: number
}
