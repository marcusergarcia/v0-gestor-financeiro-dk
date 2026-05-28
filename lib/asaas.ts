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
    // Sandbox: https://sandbox.asaas.com/api/v3
    // Production: https://api.asaas.com/v3
    this.baseURL =
      config.environment === "sandbox" ? "https://sandbox.asaas.com/api/v3" : "https://api.asaas.com/v3"
    
    console.log("[Asaas] Inicializado - Environment:", config.environment)
    console.log("[Asaas] Inicializado - Base URL:", this.baseURL)
  }

  private async request<T>(endpoint: string, method: "GET" | "POST" | "PUT" | "DELETE" = "GET", data?: any): Promise<T> {
    const url = `${this.baseURL}${endpoint}`

    console.log(`[Asaas] ${method} ${url}`)
    console.log(`[Asaas] Environment: ${this.config.environment}`)
    
    // Mostra apenas parte da API key por segurança
    const apiKeyPreview = this.config.apiKey ? 
      `${this.config.apiKey.substring(0, 10)}...${this.config.apiKey.substring(this.config.apiKey.length - 5)}` : 
      "UNDEFINED"
    console.log(`[Asaas] API Key: ${apiKeyPreview}`)

    // Header de autenticação conforme documentação Asaas
    const headers: HeadersInit = {
      "access_token": this.config.apiKey,
      "Content-Type": "application/json",
      "User-Agent": "GestorFinanceiro/1.0",
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
      console.log("[Asaas] Iniciando fetch...")
      const response = await fetch(url, options)
      
      // Verificar o content-type da resposta
      const contentType = response.headers.get("content-type") || ""
      console.log("[Asaas] Response status:", response.status)
      console.log("[Asaas] Content-Type:", contentType)
      
      // Ler a resposta como texto primeiro
      const responseText = await response.text()
      console.log("[Asaas] Response body (first 500 chars):", responseText.substring(0, 500))
      
      // Se não for JSON, mostrar erro detalhado
      if (!contentType.includes("application/json")) {
        console.error("[Asaas] Resposta não é JSON!")
        console.error("[Asaas] Status:", response.status)
        console.error("[Asaas] Headers:", JSON.stringify(Object.fromEntries(response.headers.entries())))
        
        if (response.status === 401) {
          throw new Error(`Asaas: Não autorizado (401). Verifique se a API Key está correta e corresponde ao ambiente (${this.config.environment}).`)
        }
        if (response.status === 403) {
          throw new Error(`Asaas: Acesso negado (403). A API Key pode não ter permissão para esta operação.`)
        }
        if (response.status === 404) {
          throw new Error(`Asaas: Endpoint não encontrado (404). URL: ${url}`)
        }
        
        throw new Error(`Asaas retornou status ${response.status}. Verifique a API Key e o ambiente.`)
      }
      
      // Parse JSON
      let responseData
      try {
        responseData = JSON.parse(responseText)
      } catch (parseError) {
        console.error("[Asaas] Erro ao parsear JSON:", parseError)
        throw new Error(`Asaas retornou resposta inválida: ${responseText.substring(0, 200)}`)
      }

      console.log("[Asaas] Response JSON:", JSON.stringify(responseData, null, 2))

      if (!response.ok) {
        const errorMessage = responseData.errors
          ? responseData.errors.map((e: any) => `${e.code}: ${e.description}`).join("; ")
          : JSON.stringify(responseData)
        console.error("[Asaas] Erro da API:", errorMessage)
        throw new Error(`Asaas: ${errorMessage}`)
      }

      return responseData as T
    } catch (fetchError: any) {
      console.error("[Asaas] Erro na requisição:", fetchError.message || fetchError)
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
    
    console.log("[Asaas] obterOuCriarCliente - CPF/CNPJ:", cpfCnpjLimpo)
    console.log("[Asaas] obterOuCriarCliente - Nome:", data.name)

    try {
      // Primeiro tenta buscar por CPF/CNPJ
      console.log("[Asaas] Buscando cliente por CPF/CNPJ...")
      const existente = await this.buscarClientePorCpfCnpj(cpfCnpjLimpo)

      if (existente.data && existente.data.length > 0) {
        console.log("[Asaas] Cliente já existe:", existente.data[0].id, "-", existente.data[0].name)
        return existente.data[0]
      }
      
      console.log("[Asaas] Cliente não encontrado, criando novo...")
    } catch (searchError) {
      console.log("[Asaas] Erro ao buscar cliente (tentando criar):", searchError)
    }

    // Se não existe ou erro na busca, cria novo
    console.log("[Asaas] Criando novo cliente com dados:", {
      name: data.name,
      cpfCnpj: cpfCnpjLimpo,
      email: data.email,
      mobilePhone: data.mobilePhone,
    })
    
    try {
      const novoCliente = await this.criarCliente({
        ...data,
        cpfCnpj: cpfCnpjLimpo,
      })
      console.log("[Asaas] Novo cliente criado:", novoCliente.id)
      return novoCliente
    } catch (createError: any) {
      // Se o erro for "cliente já existe", tenta buscar novamente
      if (createError.message && createError.message.includes("já cadastrado")) {
        console.log("[Asaas] Cliente já existe (via erro), buscando...")
        const existente = await this.buscarClientePorCpfCnpj(cpfCnpjLimpo)
        if (existente.data && existente.data.length > 0) {
          return existente.data[0]
        }
      }
      throw createError
    }
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
