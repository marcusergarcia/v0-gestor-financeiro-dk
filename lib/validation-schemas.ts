// CORREÇÃO 4: Schemas de validação centralizados

import { z } from "zod"

// Schemas base
const cnpjSchema = z.string().refine(
  (val) => {
    if (!val) return true // Opcional
    const cleaned = val.replace(/\D/g, "")
    return cleaned.length === 14
  },
  { message: "CNPJ deve ter 14 dígitos" },
)

const cpfSchema = z.string().refine(
  (val) => {
    if (!val) return true // Opcional
    const cleaned = val.replace(/\D/g, "")
    return cleaned.length === 11
  },
  { message: "CPF deve ter 11 dígitos" },
)

const emailSchema = z.string().email("Email inválido").optional().or(z.literal(""))

const phoneSchema = z.string().refine(
  (val) => {
    if (!val) return true // Opcional
    const cleaned = val.replace(/\D/g, "")
    return cleaned.length >= 10 && cleaned.length <= 11
  },
  { message: "Telefone deve ter 10 ou 11 dígitos" },
)

// Schema para Cliente
export const clienteSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  codigo: z.string().optional(),
  cnpj: cnpjSchema.optional(),
  cpf: cpfSchema.optional(),
  email: emailSchema,
  telefone: phoneSchema.optional(),
  endereco: z.string().optional(),
  bairro: z.string().optional(),
  cidade: z.string().optional(),
  estado: z.string().optional(),
  cep: z.string().optional(),
  contato: z.string().optional(),
  distancia_km: z.number().min(0).optional(),
  sindico: z.string().optional(),
  rg_sindico: z.string().optional(),
  cpf_sindico: cpfSchema.optional(),
  zelador: z.string().optional(),
  tem_contrato: z.boolean().optional(),
  dia_contrato: z.number().min(1).max(31).optional(),
  observacoes: z.string().optional(),
  status: z.enum(["ativo", "inativo"]).optional(),
  // Administradora
  nome_adm: z.string().optional(),
  contato_adm: z.string().optional(),
  telefone_adm: phoneSchema.optional(),
  email_adm: emailSchema,
})

// Schema para Produto
export const produtoSchema = z.object({
  codigo: z.string().min(1, "Código é obrigatório"),
  descricao: z.string().min(1, "Descrição é obrigatória"),
  tipo: z.string().optional(),
  marca: z.string().optional(),
  ncm: z.string().optional(),
  unidade: z.string().min(1, "Unidade é obrigatória"),
  valor_custo: z.number().min(0, "Valor de custo deve ser positivo"),
  valor_unitario: z.number().min(0, "Valor unitário deve ser positivo"),
  valor_mao_obra: z.number().min(0, "Valor de mão de obra deve ser positivo"),
  margem_lucro: z.number().min(0, "Margem de lucro deve ser positiva"),
  estoque: z.number().min(0, "Estoque deve ser positivo"),
  estoque_minimo: z.number().min(0, "Estoque mínimo deve ser positivo"),
  observacoes: z.string().optional(),
  ativo: z.boolean(),
})

// Schema para Orçamento
export const orcamentoSchema = z.object({
  cliente_id: z.number().min(1, "Cliente é obrigatório"),
  tipo_servico: z.string().min(1, "Tipo de serviço é obrigatório"),
  detalhes_servico: z.string().optional(),
  valor_material: z.number().min(0),
  valor_mao_obra: z.number().min(0),
  desconto: z.number().min(0),
  valor_total: z.number().min(0),
  validade: z.number().min(1, "Validade deve ser pelo menos 1 dia"),
  observacoes: z.string().optional(),
  situacao: z.enum(["pendente", "enviado", "aprovado", "rejeitado", "cancelado"]),
  data_orcamento: z.string(),
  data_inicio: z.string().optional(),
  distancia_km: z.number().min(0),
  valor_boleto: z.number().min(0),
  prazo_dias: z.number().min(1),
  juros_am: z.number().min(0),
  imposto_servico: z.number().min(0),
  imposto_material: z.number().min(0),
  desconto_mdo_percent: z.number().min(0).max(100),
  desconto_mdo_valor: z.number().min(0),
  parcelamento_mdo: z.number().min(1),
  parcelamento_material: z.number().min(0),
})

// Schema para Boleto
export const boletoSchema = z.object({
  numero: z.string().min(1, "Número é obrigatório"),
  cliente_id: z.number().min(1, "Cliente é obrigatório"),
  valor: z.number().min(0.01, "Valor deve ser maior que zero"),
  data_vencimento: z.string(),
  data_pagamento: z.string().optional(),
  status: z.enum(["pendente", "pago", "vencido", "cancelado"]),
  numero_parcela: z.number().min(1),
  total_parcelas: z.number().min(1),
  observacoes: z.string().optional(),
})

// Funções de validação
export function validateCliente(data: any) {
  return clienteSchema.safeParse(data)
}

export function validateProduto(data: any) {
  return produtoSchema.safeParse(data)
}

export function validateOrcamento(data: any) {
  return orcamentoSchema.safeParse(data)
}

export function validateBoleto(data: any) {
  return boletoSchema.safeParse(data)
}
