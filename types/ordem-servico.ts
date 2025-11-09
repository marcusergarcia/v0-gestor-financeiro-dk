export interface OrdemServico {
  id: number
  numero: string
  cliente_id: number
  contrato_id?: number
  tecnico_id: number
  tecnico_name: string
  tecnico_email?: string
  solicitado_por?: string
  data_atual: string
  data_agendamento?: string
  periodo_agendamento?: "manha" | "tarde" | "integral"
  data_execucao?: string
  horario_entrada?: string
  horario_saida?: string
  tipo_servico: "manutencao" | "orcamento" | "vistoria_contrato" | "preventiva"
  relatorio_visita?: string
  servico_realizado?: string
  observacoes?: string
  responsavel: "zelador" | "porteiro" | "sindico" | "outros"
  nome_responsavel: string
  equipamentos?: string
  situacao: "rascunho" | "aberta" | "agendada" | "em_andamento" | "concluida" | "cancelada"
  created_at: string
  updated_at: string

  // Dados do cliente (quando incluídos na consulta)
  cliente_nome?: string
  cliente_codigo?: string
  cliente_cnpj?: string
  cliente_cpf?: string
  cliente_endereco?: string
  cliente_telefone?: string
  cliente_email?: string
  cliente_distancia_km?: number
}

export interface OrdemServicoFoto {
  id: number
  ordem_servico_id: number
  nome_arquivo: string
  caminho_arquivo: string
  tipo_foto: "antes" | "durante" | "depois"
  descricao?: string
  created_at: string
}

export interface OrdemServicoAssinatura {
  id: number
  ordem_servico_id: number
  tipo_assinatura: "tecnico" | "responsavel"
  assinatura_base64: string
  nome_assinante: string
  data_assinatura: string
}

export interface OrdemServicoCompleta extends OrdemServico {
  itens: boolean
  cliente: any
  fotos: OrdemServicoFoto[]
  assinaturas: OrdemServicoAssinatura[]
}

export interface CreateOrdemServicoData {
  numero: string
  cliente_id: number
  contrato_id?: string
  tecnico_id: number
  tecnico_name: string
  tecnico_email?: string
  solicitado_por?: string
  data_atual: string
  data_agendamento?: string
  periodo_agendamento?: "manha" | "tarde" | "integral"
  data_execucao?: string
  horario_entrada?: string
  horario_saida?: string
  tipo_servico: string
  relatorio_visita?: string
  servico_realizado?: string
  observacoes?: string
  responsavel: string
  nome_responsavel: string
  equipamentos?: string
  situacao?: string
}

// Helper function to get service type label
export function getTipoServicoLabel(tipo: string): string {
  switch (tipo) {
    case "manutencao":
      return "Manutenção"
    case "orcamento":
      return "Orçamento"
    case "vistoria_contrato":
      return "Vistoria para Contrato"
    case "preventiva":
      return "Preventiva"
    default:
      return tipo
  }
}

// Helper function to get service type value from label
export function getTipoServicoValue(label: string): string {
  switch (label.toLowerCase()) {
    case "manutenção":
      return "manutencao"
    case "orçamento":
      return "orcamento"
    case "vistoria para contrato":
      return "vistoria_contrato"
    case "preventiva":
      return "preventiva"
    default:
      return label
  }
}
