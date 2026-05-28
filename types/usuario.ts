export interface User {
  id: number
  nome: string
  email: string
  cpf?: string
  telefone?: string
  tipo: "admin" | "tecnico" | "vendedor" | "usuario"
  perfil?: string
  ativo: boolean
  permissoes?: string[]
  configuracoes?: any
  ultimo_acesso?: string
  data_criacao?: string
}

export interface Usuario extends User {}
