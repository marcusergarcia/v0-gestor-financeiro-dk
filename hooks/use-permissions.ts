"use client"

import { useAuth } from "@/contexts/auth-context"

export function usePermissions() {
  const { user } = useAuth()

  const isAdmin = user?.tipo === "admin"
  const userType = user?.tipo || "usuario"

  // Parse seguro das permissões do usuário
  let permissoes: string[] = []
  if (user?.permissoes) {
    if (Array.isArray(user.permissoes)) {
      permissoes = user.permissoes
    } else if (typeof user.permissoes === "string") {
      try {
        const trimmed = user.permissoes.trim()
        if (trimmed.startsWith("[")) {
          permissoes = JSON.parse(trimmed)
        } else if (trimmed) {
          permissoes = trimmed.split(",").map((p: string) => p.trim())
        }
      } catch (e) {
        console.error("Erro ao fazer parse das permissões no hook usePermissions:", e)
        permissoes = []
      }
    }
  }

  // Verifica se o usuário tem uma permissão específica
  const hasPermission = (permission: string): boolean => {
    // Admin tem todas as permissões
    if (isAdmin) return true

    // Verifica se a permissão está na lista do usuário
    return permissoes.includes(permission)
  }

  // Verifica se o usuário tem todas as permissões listadas
  const hasAllPermissions = (requiredPermissions: string[]): boolean => {
    if (isAdmin) return true
    return requiredPermissions.every((permission) => permissoes.includes(permission))
  }

  // Verifica se o usuário tem pelo menos uma das permissões listadas
  const hasAnyPermission = (requiredPermissions: string[]): boolean => {
    if (isAdmin) return true
    return requiredPermissions.some((permission) => permissoes.includes(permission))
  }

  return {
    user,
    isAdmin,
    userType,
    permissoes,
    hasPermission,
    hasAllPermissions,
    hasAnyPermission,
  }
}
