import { PagBankLogger } from "./pagbank-logger"

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
  items: Array<{
    reference_id: string
    name: string
    quantity: number
    unit_amount: number // em centavos
  }>
  shipping_address: {
    street: string
    number: string
    complement?: string
    locality: string
    city: string
    region_code: string
    country: string
    postal_code: string
  }
  charges: {
    reference_id: string
    description: string
    amount: {
      value: number // em centavos
      currency: "BRL"
    }
    payment_method: {
      type: "BOLETO"
      boleto: {
        template: "COBRANCA" | "PROPOSTA"
        due_date: string // YYYY-MM-DD
        days_until_expiration: number
        holder: {
          name: string
          tax_id: string
          email: string
          address: {
            street: string
            number: string
            postal_code: string
            locality: string
            city: string
            region: string
            region_code: string
            country: string
          }
        }
        instruction_lines: {
          line_1: string
          line_2?: string
        }
      }
    }
    payment_instructions?: {
      fine?: {
        date: string // YYYY-MM-DD
        value: number // Percentual * 100 (ex: 2% = 200)
      }
      interest?: {
        date: string // YYYY-MM-DD
        value: number // Percentual * 100 (ex: 0.033% = 3.3)
      }
      discounts?: Array<{
        due_date: string // YYYY-MM-DD
        value: number // Percentual * 100
      }>
    }
  }[]
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

    const paymentType = endpoint.includes("/orders")
      ? "BOLETO"
      : endpoint.includes("/payouts")
        ? "PAYOUT"
        : endpoint.includes("/cashback")
          ? "CASHBACK"
          : "OTHER"

    try {
      const response = await fetch(url, options)
      const responseData = await response.json()

      if (response.ok) {
        await PagBankLogger.log({
          method,
          endpoint: url,
          request: data || {},
          response: responseData,
          status: response.status,
          paymentType,
          success: true,
        }).catch((err) => console.error("Erro ao registrar log PagBank:", err))
      } else {
        await PagBankLogger.log({
          method,
          endpoint: url,
          request: data || {},
          response: responseData,
          status: response.status,
          paymentType,
          success: false,
        }).catch((err) => console.error("Erro ao registrar log PagBank:", err))
      }

      if (!response.ok) {
        throw new Error(`PagSeguro API Error: ${response.status} - ${JSON.stringify(responseData)}`)
      }

      return responseData as T
    } catch (error) {
      throw error
    }
  }

  // BOLETOS
  async criarBoleto(data: BoletoData) {
    const telefoneRaw = typeof data.customer.phone === "string" ? data.customer.phone.replace(/\D/g, "") : ""
    const telefone = telefoneRaw.length >= 10 ? telefoneRaw : "11999999999"
    const ddd = telefone.substring(0, 2)
    const numero = telefone.substring(2)

    const payload = {
      reference_id: data.charges[0].reference_id,
      customer: {
        name: data.customer.name,
        email: data.customer.email,
        tax_id: data.customer.tax_id,
        phones: [
          {
            country: "55",
            area: ddd,
            number: numero,
            type: "MOBILE",
          },
        ],
      },
      items: data.items,
      shipping: {
        address: data.shipping_address,
      },
      charges: data.charges,
    }

    console.log("[PagSeguro] Criando pedido com boleto:", JSON.stringify(payload, null, 2))

    return this.request("/orders", "POST", payload)
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
