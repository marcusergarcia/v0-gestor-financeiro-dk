export interface Cliente {
  id: string
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
  updated_at?: string
  // Novos campos da administradora
  nome_adm?: string
  contato_adm?: string
  telefone_adm?: string
  email_adm?: string
}

export interface Boleto {
  id: number
  numero: string
  cliente_id: number
  cliente_nome?: string
  valor: number
  data_vencimento: string
  data_pagamento?: string
  status: string
  numero_parcela: number
  total_parcelas: number
  observacoes?: string
  created_at: string
  updated_at: string
}

export interface Produto {
  id: string
  codigo: string
  descricao: string
  valor_unitario: number
  estoque: number
  ativo: boolean
  created_at: string
  marca?: string
  ncm?: string
  categoria?: string
  tipo?: "produto" | "servico"
}
