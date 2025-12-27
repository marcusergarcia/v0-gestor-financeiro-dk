interface PagSeguroConfig {
  token: string
  environment: "sandbox" | "production"
  email?: string
}

interface BoletoData {
  customer: {
    name: string
    email: string
    tax_id: string // CPF/CNPJ
    phone: string
  }
  billing_address: {
    street: string
    number: string
    complement?: string
    locality: string
    city: string
    region_code: string // UF
    country: string
    postal_code: string
  }
  amount: {
    value: number // Valor em centavos
    currency: "BRL"
  }
  reference_id: string
  description: string
  due_date: string // YYYY-MM-DD
  instruction_lines?: {
    line_1?: string
    line_2?: string
  }
  holder: {
    name: string
    tax_id: string
    email: string
    address: {
      street: string
      number: string
      complement?: string
      locality: string
      city: string
      region_code: string
      country: string
      postal_code: string
    }
  }
  multa?: {
    percentual: number // 0.01 a 99.99
  }
  juros?: {
    percentual: number // 0.01 a 59.99 (ao mês)
  }
  desconto?: {
    percentual: number // 0.01 a 99.99
    data_limite: string // YYYY-MM-DD
  }
}

interface PayoutData {
  reference_id: string
  description: string
  amount: {
    value: number // em centavos
    currency: "BRL"
  }
  payment_method: {
    type: "PIX" | "BANK_ACCOUNT"
    pix_key?: string
    bank_account?: {
      account_number: string
      account_digit: string
      branch_number: string
      bank_code: string
      account_type: "CHECKING" | "SAVINGS"
    }
  }
  destination: {
    holder: {
      name: string
      tax_id: string
      email?: string
      phone?: string
    }
  }
}

interface CashbackData {
  phone: string
  purchase_value: number
  reference_id: string
}

export class PagSeguroAPI {
  private config: PagSeguroConfig
  private baseURL: string

  constructor(config: PagSeguroConfig) {
    this.config = config
    this.baseURL = config.environment === "sandbox" ? "https://sandbox.api.pagseguro.com" : "https://api.pagseguro.com"
  }

  private async request<T>(
    endpoint: string,
    method: "GET" | "POST" | "PUT" | "DELETE" = "GET",
    data?: any,
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`

    console.log("[PagSeguro API] Request:", { method, url, data })

    const headers: HeadersInit = {
      Authorization: `Bearer ${this.config.token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    }

    const options: RequestInit = {
      method,
      headers,
    }

    if (data && (method === "POST" || method === "PUT")) {
      options.body = JSON.stringify(data)
    }

    try {
      const response = await fetch(url, options)
      const responseData = await response.json()

      console.log("[PagSeguro API] Response:", { status: response.status, data: responseData })

      if (!response.ok) {
        throw new Error(`PagSeguro API Error: ${response.status} - ${JSON.stringify(responseData)}`)
      }

      return responseData as T
    } catch (error) {
      console.error("[PagSeguro API] Error:", error)
      throw error
    }
  }

  // BOLETOS
  async criarBoleto(data: BoletoData) {
    return this.request("/charges", "POST", {
      reference_id: data.reference_id,
      description: data.description,
      amount: data.amount,
      payment_method: {
        type: "BOLETO",
        boleto: {
          due_date: data.due_date,
          instruction_lines: data.instruction_lines,
          holder: data.holder,
        },
      },
      notification_urls: [process.env.NEXT_PUBLIC_APP_URL + "/api/pagseguro/webhook"],
    })
  }

  async consultarBoleto(chargeId: string) {
    return this.request(`/charges/${chargeId}`, "GET")
  }

  async cancelarBoleto(chargeId: string) {
    return this.request(`/charges/${chargeId}/cancel`, "POST")
  }

  // PAYOUT - Pagamento de Contas
  async criarPayout(data: PayoutData) {
    return this.request("/payouts", "POST", data)
  }

  async consultarPayout(payoutId: string) {
    return this.request(`/payouts/${payoutId}`, "GET")
  }

  async cancelarPayout(payoutId: string) {
    return this.request(`/payouts/${payoutId}/cancel`, "POST")
  }

  // CASHBACK - ClubePag
  async consultarCashback(phone: string) {
    // Remove formatação do telefone
    const cleanPhone = phone.replace(/\D/g, "")
    return this.request(`/clubepag/cashback?phone=${cleanPhone}`, "GET")
  }

  async registrarCompraComCashback(data: CashbackData) {
    const cleanPhone = data.phone.replace(/\D/g, "")

    return this.request("/clubepag/cashback", "POST", {
      phone: cleanPhone,
      purchase_value: data.purchase_value,
      reference_id: data.reference_id,
    })
  }

  async resgatarCashback(phone: string, amount: number) {
    const cleanPhone = phone.replace(/\D/g, "")

    return this.request("/clubepag/cashback/redeem", "POST", {
      phone: cleanPhone,
      amount,
    })
  }

  async configurarCashback(percentual: number) {
    return this.request("/clubepag/settings", "PUT", {
      cashback_percentage: percentual,
    })
  }

  // CUPONS - ClubePag
  async criarCupom(data: {
    code: string
    discount_percentage: number
    expiration_date: string
    max_uses?: number
  }) {
    return this.request("/clubepag/coupons", "POST", data)
  }

  async listarCupons() {
    return this.request("/clubepag/coupons", "GET")
  }
}

// Instância singleton
let pagseguroInstance: PagSeguroAPI | null = null

export function getPagSeguroAPI(): PagSeguroAPI {
  const token = process.env.PAGSEGURO_TOKEN
  const environment = (process.env.PAGSEGURO_ENVIRONMENT as "sandbox" | "production") || "sandbox"

  if (!token || token === "test_token_temporario") {
    console.warn("[PagSeguro] Token não configurado. Usando modo simulado.")
    // Retorna instância mock que não faz requisições reais
    return {
      criarBoleto: async () => {
        throw new Error("PagSeguro não configurado. Aguardando token de produção.")
      },
      consultarBoleto: async () => {
        throw new Error("PagSeguro não configurado. Aguardando token de produção.")
      },
      cancelarBoleto: async () => {
        throw new Error("PagSeguro não configurado. Aguardando token de produção.")
      },
      criarPayout: async () => {
        throw new Error("PagSeguro não configurado. Aguardando token de produção.")
      },
      consultarPayout: async () => {
        throw new Error("PagSeguro não configurado. Aguardando token de produção.")
      },
      cancelarPayout: async () => {
        throw new Error("PagSeguro não configurado. Aguardando token de produção.")
      },
      consultarCashback: async () => {
        throw new Error("PagSeguro não configurado. Aguardando token de produção.")
      },
      registrarCompraComCashback: async () => {
        throw new Error("PagSeguro não configurado. Aguardando token de produção.")
      },
      resgatarCashback: async () => {
        throw new Error("PagSeguro não configurado. Aguardando token de produção.")
      },
      configurarCashback: async () => {
        throw new Error("PagSeguro não configurado. Aguardando token de produção.")
      },
      criarCupom: async () => {
        throw new Error("PagSeguro não configurado. Aguardando token de produção.")
      },
      listarCupons: async () => {
        throw new Error("PagSeguro não configurado. Aguardando token de produção.")
      },
    } as unknown as PagSeguroAPI
  }

  if (!pagseguroInstance) {
    pagseguroInstance = new PagSeguroAPI({
      token,
      environment,
    })
  }

  return pagseguroInstance
}
