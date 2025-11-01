// CORREÇÃO 3: Cliente de API padronizado

import type { ApiResponse } from "@/types/common"

class ApiClient {
  private baseUrl: string

  constructor(baseUrl = "/api") {
    this.baseUrl = baseUrl
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseUrl}${endpoint}`

      const response = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
        ...options,
      })

      const data = await response.json()

      if (!response.ok) {
        return {
          success: false,
          error: data.message || `HTTP ${response.status}: ${response.statusText}`,
        }
      }

      return data
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erro de conexão",
      }
    }
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: "GET" })
  }

  async post<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async put<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: "PUT",
      body: JSON.stringify(data),
    })
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: "DELETE" })
  }

  // Métodos específicos para entidades

  // Clientes
  async getClientes(params?: any) {
    const query = params ? `?${new URLSearchParams(params).toString()}` : ""
    return this.get(`/clientes${query}`)
  }

  async getCliente(id: number) {
    return this.get(`/clientes/${id}`)
  }

  async createCliente(data: any) {
    return this.post("/clientes", data)
  }

  async updateCliente(id: number, data: any) {
    return this.put(`/clientes/${id}`, data)
  }

  async deleteCliente(id: number) {
    return this.delete(`/clientes/${id}`)
  }

  // Produtos
  async getProdutos(params?: any) {
    const query = params ? `?${new URLSearchParams(params).toString()}` : ""
    return this.get(`/produtos${query}`)
  }

  async getProduto(id: number) {
    return this.get(`/produtos/${id}`)
  }

  async createProduto(data: any) {
    return this.post("/produtos", data)
  }

  async updateProduto(id: number, data: any) {
    return this.put(`/produtos/${id}`, data)
  }

  async deleteProduto(id: number) {
    return this.delete(`/produtos/${id}`)
  }

  // Orçamentos
  async getOrcamentos(params?: any) {
    const query = params ? `?${new URLSearchParams(params).toString()}` : ""
    return this.get(`/orcamentos${query}`)
  }

  async getOrcamento(numero: string) {
    return this.get(`/orcamentos/${numero}`)
  }

  async createOrcamento(data: any) {
    return this.post("/orcamentos", data)
  }

  async updateOrcamento(numero: string, data: any) {
    return this.put(`/orcamentos/${numero}`, data)
  }

  async deleteOrcamento(numero: string) {
    return this.delete(`/orcamentos/${numero}`)
  }

  // Boletos
  async getBoletos(params?: any) {
    const query = params ? `?${new URLSearchParams(params).toString()}` : ""
    return this.get(`/boletos${query}`)
  }

  async getBoleto(id: number) {
    return this.get(`/boletos/${id}`)
  }

  async createBoleto(data: any) {
    return this.post("/boletos", data)
  }

  async updateBoleto(id: number, data: any) {
    return this.put(`/boletos/${id}`, data)
  }

  async deleteBoleto(id: number) {
    return this.delete(`/boletos/${id}`)
  }
}

export const apiClient = new ApiClient()
