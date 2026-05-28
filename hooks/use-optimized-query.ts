"use client"

// CORREÇÃO 7: Hook otimizado para queries

import { useState, useEffect, useCallback, useMemo } from "react"
import { debounce } from "@/lib/utils-centralized"
import { apiClient } from "@/lib/api-client"
import type { PaginationParams } from "@/types/common"

interface UseOptimizedQueryOptions<T> {
  endpoint: string
  params?: Record<string, any>
  enabled?: boolean
  refetchInterval?: number
  staleTime?: number
  cacheKey?: string
}

interface QueryState<T> {
  data: T | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  isStale: boolean
}

// Cache simples em memória
const queryCache = new Map<string, { data: any; timestamp: number }>()

export function useOptimizedQuery<T>(options: UseOptimizedQueryOptions<T>): QueryState<T> {
  const {
    endpoint,
    params = {},
    enabled = true,
    refetchInterval,
    staleTime = 5 * 60 * 1000, // 5 minutos
    cacheKey,
  } = options

  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Gerar chave do cache
  const finalCacheKey = useMemo(() => {
    return cacheKey || `${endpoint}?${new URLSearchParams(params).toString()}`
  }, [endpoint, params, cacheKey])

  // Verificar se os dados estão obsoletos
  const isStale = useMemo(() => {
    const cached = queryCache.get(finalCacheKey)
    if (!cached) return true
    return Date.now() - cached.timestamp > staleTime
  }, [finalCacheKey, staleTime])

  // Função para buscar dados
  const fetchData = useCallback(async () => {
    if (!enabled) return

    // Verificar cache primeiro
    const cached = queryCache.get(finalCacheKey)
    if (cached && !isStale) {
      setData(cached.data)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await apiClient.get<T>(endpoint + "?" + new URLSearchParams(params).toString())

      if (response.success && response.data) {
        setData(response.data)
        // Atualizar cache
        queryCache.set(finalCacheKey, {
          data: response.data,
          timestamp: Date.now(),
        })
      } else {
        setError(response.error || "Erro ao carregar dados")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido")
    } finally {
      setLoading(false)
    }
  }, [endpoint, params, enabled, finalCacheKey, isStale])

  // Função de refetch
  const refetch = useCallback(async () => {
    // Limpar cache para forçar nova busca
    queryCache.delete(finalCacheKey)
    await fetchData()
  }, [fetchData, finalCacheKey])

  // Efeito para buscar dados iniciais
  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Efeito para refetch automático
  useEffect(() => {
    if (!refetchInterval || !enabled) return

    const interval = setInterval(fetchData, refetchInterval)
    return () => clearInterval(interval)
  }, [fetchData, refetchInterval, enabled])

  return {
    data,
    loading,
    error,
    refetch,
    isStale,
  }
}

// Hook para busca com debounce
export function useOptimizedSearch<T>(endpoint: string, searchTerm: string, delay = 300): QueryState<T> {
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm)

  const debouncedSetSearch = useMemo(() => debounce((term: string) => setDebouncedSearchTerm(term), delay), [delay])

  useEffect(() => {
    debouncedSetSearch(searchTerm)
  }, [searchTerm, debouncedSetSearch])

  return useOptimizedQuery<T>({
    endpoint,
    params: { search: debouncedSearchTerm },
    enabled: debouncedSearchTerm.length >= 2,
    cacheKey: `${endpoint}-search-${debouncedSearchTerm}`,
  })
}

// Hook para paginação otimizada
export function useOptimizedPagination<T>(endpoint: string, initialParams: PaginationParams = {}) {
  const [params, setParams] = useState<PaginationParams>({
    page: 1,
    limit: 50,
    ...initialParams,
  })

  const query = useOptimizedQuery<T[]>({
    endpoint,
    params,
    cacheKey: `${endpoint}-page-${params.page}-${params.limit}-${params.search || ""}`,
  })

  const setPage = useCallback((page: number) => {
    setParams((prev) => ({ ...prev, page }))
  }, [])

  const setSearch = useCallback((search: string) => {
    setParams((prev) => ({ ...prev, search, page: 1 }))
  }, [])

  const setLimit = useCallback((limit: number) => {
    setParams((prev) => ({ ...prev, limit, page: 1 }))
  }, [])

  return {
    ...query,
    params,
    setPage,
    setSearch,
    setLimit,
    setParams,
  }
}
