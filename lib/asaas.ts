interface AsaasConfig {
  apiKey: string
  environment: "sandbox" | "production"
}

interface CustomerData {
  name: string
  email?: string
  cpfCnpj: string
  phone?: string
  mobilePhone?: string
  address?: string
  addressNumber?: string
  complement?: string
  province?: string
  postalCode?: string
  city?: string
  state?: string
}

interface BoletoData {
  customer: string // ID do cliente no Asaas
  billingType: "BOLETO"
  value: number
  dueDate: string // YYYY-MM-DD
  description?: string
  externalReference?: string // Referência externa (número do boleto)
  fine?: {
    value: number // Percentual de multa
    type: "PERCENTAGE" | "FIXED"
  }
  interest?: {
    value: number // Percentual de juros ao mês
    type: "PERCENTAGE" | "FIXED"
  }
  discount?: {
    value: number
    dueDateLimitDays: number
    type: "PERCENTAGE" | "FIXED"
  }
}

interface AsaasPaymentResponse {
  id: string
  dateCreated: string
  customer: string
  value: number
  netValue: number
  billingType: string
  status: string
  dueDate: string
  invoiceUrl: string
  bankSlipUrl: string
  invoiceNumber: string
  externalReference: string
  nossoNumero: string
  description: string
  barCode?: string
  identificationField?: string
}

interface AsaasCustomerResponse {
  id: string
  name: string
  email: string
  cpfCnpj: string
  phone?: string
  mobilePhone?: string
}

export class AsaasAPI {
  private config: AsaasConfig
  private baseURL: string

  constructor(config: AsaasConfig) {
    this.config = config
    this.baseURL =
      config.environment === "sandbox"
        ? "https://sandbox.asaas.com/api/v3"
        : "https://api.asaas.com/api/v3"
  }

  private async request<T>(
    endpoint: string,
    method: "GET" | "POST" | "PUT" | "DELETE" = "GET",
    data?: any
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`

    const headers: HeadersInit = {
      access_token: this.config.apiKey,
      "Content-Type": "application/json",
    }

    const options: RequestInit = {
      method,
      headers,
    }

    if (data && (method === "POST" || method === "PUT")) {
      options.body = JSON.stringify(data)
    }

    console.log(`[Asaas] ${method} ${url}`)
    if (data) {
      console.log("[Asaas] Payload:", JSON.stringify(data, null, 2))
    }

    const response = await fetch(url, options)
    const responseData = await response.json()

    console.log("[Asaas] Response status:", response.status)
    console.log("[Asaas] Response:", JSON.stringify(responseData, null, 2))

    if (!response.ok) {
      const errorMessage =
        responseData.errors?.map((e: any) => e.description).join(", ") ||
        responseData.message ||
        "Erro desconhecido"
      throw new Error(`Asaas API Error: ${response.status} - ${errorMessage}`)
    }

    return responseData as T
  }

  // CLIENTES
  async criarCliente(data: CustomerData): Promise<AsaasCustomerResponse> {
    return this.request("/customers", "POST", data)
  }

  async buscarClientePorCpfCnpj(cpfCnpj: string): Promise<{ data: AsaasCustomerResponse[] }> {
    const cpfCnpjLimpo = cpfCnpj.replace(/\D/g, "")
    return this.request(`/customers?cpfCnpj=${cpfCnpjLimpo}`, "GET")
  }

  async buscarOuCriarCliente(data: CustomerData): Promise<AsaasCustomerResponse> {
    // Primeiro tenta buscar cliente existente
    const clientes = await this.buscarClientePorCpfCnpj(data.cpfCnpj)
    
    if (clientes.data && clientes.data.length > 0) {
      console.log("[Asaas] Cliente existente encontrado:", clientes.data[0].id)
      return clientes.data[0]
    }

    // Se não encontrar, cria novo cliente
    console.log("[Asaas] Cliente não encontrado, criando novo...")
    return this.criarCliente(data)
  }

  // COBRANÇAS (BOLETOS)
  async criarBoleto(data: BoletoData): Promise<AsaasPaymentResponse> {
    return this.request("/payments", "POST", data)
  }

  async consultarBoleto(paymentId: string): Promise<AsaasPaymentResponse> {
    return this.request(`/payments/${paymentId}`, "GET")
  }

  async cancelarBoleto(paymentId: string): Promise<AsaasPaymentResponse> {
    return this.request(`/payments/${paymentId}`, "DELETE")
  }

  async obterLinhaDigitavel(paymentId: string): Promise<{ identificationField: string; barCode: string }> {
    return this.request(`/payments/${paymentId}/identificationField`, "GET")
  }
}

// Instância singleton
let asaasInstance: AsaasAPI | null = null

export function getAsaasAPI(): AsaasAPI {
  const apiKey = process.env.ASAAS_API_KEY
  const environment = (process.env.ASAAS_ENVIRONMENT as "sandbox" | "production") || "sandbox"

  if (!apiKey) {
    throw new Error("Asaas não configurado. Configure ASAAS_API_KEY nas variáveis de ambiente.")
  }

  if (!asaasInstance) {
    asaasInstance = new AsaasAPI({
      apiKey,
      environment,
    })
  }

  return asaasInstance
}
