interface AsaasConfig {
  apiKey: string
  environment: "sandbox" | "production"
}

interface AsaasCustomer {
  name: string
  cpfCnpj: string
  email?: string
  phone?: string
  mobilePhone?: string
  address?: string
  addressNumber?: string
  complement?: string
  province?: string
  postalCode?: string
  externalReference?: string
  notificationDisabled?: boolean
}

interface AsaasPayment {
  customer: string // ID do cliente no Asaas (cus_xxxx)
  billingType: "BOLETO" | "PIX" | "CREDIT_CARD"
  value: number
  dueDate: string // YYYY-MM-DD
  description?: string
  externalReference?: string
  fine?: {
    value: number // percentual
    type: "PERCENTAGE" | "FIXED"
  }
  interest?: {
    value: number // percentual ao mês
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
  originalValue: number
  billingType: string
  status: string
  dueDate: string
  description: string
  externalReference: string
  invoiceUrl: string
  bankSlipUrl: string
  invoiceNumber: string
  nossoNumero: string
  barCode: string
  identificationField: string
}

interface AsaasCustomerResponse {
  id: string
  name: string
  cpfCnpj: string
  email: string
  phone: string
  mobilePhone: string
  address: string
  addressNumber: string
  province: string
  postalCode: string
  externalReference: string
}

export class AsaasAPI {
  private config: AsaasConfig
  private baseURL: string

  constructor(config: AsaasConfig) {
    this.config = config
    // URL base de acordo com a documentação oficial do Asaas
    this.baseURL =
      config.environment === "sandbox" ? "https://sandbox.asaas.com/api/v3" : "https://api.asaas.com/v3"
  }

  private async request<T>(endpoint: string, method: "GET" | "POST" | "PUT" | "DELETE" = "GET", data?: any): Promise<T> {
    const url = `${this.baseURL}${endpoint}`

    console.log(`[Asaas] ${method} ${url}`)
    console.log(`[Asaas] Environment: ${this.config.environment}`)
    console.log(`[Asaas] API Key prefix: ${this.config.apiKey.substring(0, 20)}...`)

    const headers: HeadersInit = {
      "access_token": this.config.apiKey,
      "Content-Type": "application/json",
      "Accept": "application/json",
    }

    const options: RequestInit = {
      method,
      headers,
    }

    if (data && (method === "POST" || method === "PUT")) {
      options.body = JSON.stringify(data)
      console.log("[Asaas] Payload:", JSON.stringify(data, null, 2))
    }

    try {
      const response = await fetch(url, options)
      
      // Verificar o content-type da resposta
      const contentType = response.headers.get("content-type") || ""
      console.log("[Asaas] Response status:", response.status)
      console.log("[Asaas] Content-Type:", contentType)
      
      // Se não for JSON, ler como texto para ver o erro
      if (!contentType.includes("application/json")) {
        const textResponse = await response.text()
        console.error("[Asaas] Resposta não é JSON:", textResponse.substring(0, 1000))
        throw new Error(`Asaas API retornou HTML em vez de JSON. Status: ${response.status}. Verifique se a API Key (ASAAS_API_KEY) está correta e corresponde ao ambiente (${this.config.environment}). URL: ${url}`)
      }
      
      const responseData = await response.json()

      console.log("[Asaas] Response:", JSON.stringify(responseData, null, 2))

      if (!response.ok) {
        const errorMessage = responseData.errors
          ? responseData.errors.map((e: any) => e.description).join(", ")
          : JSON.stringify(responseData)
        throw new Error(`Asaas API Error: ${response.status} - ${errorMessage}`)
      }

      return responseData as T
    } catch (fetchError) {
      console.error("[Asaas] Erro na requisição:", fetchError)
      throw fetchError
    }
  }

  // CLIENTES
  async criarCliente(data: AsaasCustomer): Promise<AsaasCustomerResponse> {
    return this.request("/customers", "POST", data)
  }

  async buscarClientePorCpfCnpj(cpfCnpj: string): Promise<{ data: AsaasCustomerResponse[] }> {
    const cpfCnpjLimpo = cpfCnpj.replace(/\D/g, "")
    return this.request(`/customers?cpfCnpj=${cpfCnpjLimpo}`, "GET")
  }

  async buscarClientePorExternalReference(externalReference: string): Promise<{ data: AsaasCustomerResponse[] }> {
    return this.request(`/customers?externalReference=${externalReference}`, "GET")
  }

  // COBRANÇAS (BOLETOS)
  async criarCobranca(data: AsaasPayment): Promise<AsaasPaymentResponse> {
    return this.request("/payments", "POST", data)
  }

  async consultarCobranca(paymentId: string): Promise<AsaasPaymentResponse> {
    return this.request(`/payments/${paymentId}`, "GET")
  }

  async cancelarCobranca(paymentId: string): Promise<AsaasPaymentResponse> {
    return this.request(`/payments/${paymentId}`, "DELETE")
  }

  async listarCobrancas(filters?: {
    customer?: string
    billingType?: string
    status?: string
    externalReference?: string
  }): Promise<{ data: AsaasPaymentResponse[] }> {
    const params = new URLSearchParams()
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value)
      })
    }
    const queryString = params.toString() ? `?${params.toString()}` : ""
    return this.request(`/payments${queryString}`, "GET")
  }

  // Método auxiliar para criar ou buscar cliente
  async obterOuCriarCliente(data: AsaasCustomer): Promise<AsaasCustomerResponse> {
    const cpfCnpjLimpo = data.cpfCnpj.replace(/\D/g, "")

    // Primeiro tenta buscar por CPF/CNPJ
    const existente = await this.buscarClientePorCpfCnpj(cpfCnpjLimpo)

    if (existente.data && existente.data.length > 0) {
      console.log("[Asaas] Cliente já existe:", existente.data[0].id)
      return existente.data[0]
    }

    // Se não existe, cria novo
    console.log("[Asaas] Criando novo cliente")
    return this.criarCliente({
      ...data,
      cpfCnpj: cpfCnpjLimpo,
    })
  }
}

// Cria nova instância a cada chamada para garantir que pega as variáveis atualizadas
export function getAsaasAPI(): AsaasAPI {
  const apiKey = process.env.ASAAS_API_KEY
  const environment = (process.env.ASAAS_ENVIRONMENT as "sandbox" | "production") || "production"

  console.log("[Asaas] getAsaasAPI - Environment:", environment)
  console.log("[Asaas] getAsaasAPI - API Key exists:", !!apiKey)

  if (!apiKey) {
    throw new Error("ASAAS_API_KEY não configurada. Configure a variável de ambiente no Vercel.")
  }

  return new AsaasAPI({
    apiKey,
    environment,
  })
}
