"use client"

import { useAuth } from "@/contexts/auth-context"

export function usePermissions() {
  const { user } = useAuth()

  const isAdmin = user?.tipo === "admin"
  const userType = user?.tipo || "usuario"

  // Parse das permissões do usuário
  const permissoes = user?.permissoes ? JSON.parse(user.permissoes) : []

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
