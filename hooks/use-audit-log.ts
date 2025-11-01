"use client"

import { useAuth } from "@/contexts/auth-context"
import { registrarLog } from "@/lib/logger"

export function useAuditLog() {
  const { user } = useAuth()

  const logCreate = async (modulo: string, detalhes: string, dados_novos?: any) => {
    if (!user) {
      console.log("Usuário não logado, não registrando log")
      return
    }

    console.log("Registrando log de criação:", modulo, detalhes)

    await registrarLog({
      usuario_id: user.id,
      usuario_nome: user.nome,
      usuario_email: user.email,
      acao: "Registro criado",
      modulo,
      tipo: "create",
      detalhes,
      dados_novos,
      ip_address: "client-side",
      user_agent: navigator.userAgent,
    })
  }

  const logUpdate = async (modulo: string, detalhes: string, dados_anteriores?: any, dados_novos?: any) => {
    if (!user) {
      console.log("Usuário não logado, não registrando log")
      return
    }

    console.log("Registrando log de atualização:", modulo, detalhes)

    await registrarLog({
      usuario_id: user.id,
      usuario_nome: user.nome,
      usuario_email: user.email,
      acao: "Registro atualizado",
      modulo,
      tipo: "update",
      detalhes,
      dados_anteriores,
      dados_novos,
      ip_address: "client-side",
      user_agent: navigator.userAgent,
    })
  }

  const logDelete = async (modulo: string, detalhes: string, dados_anteriores?: any) => {
    if (!user) {
      console.log("Usuário não logado, não registrando log")
      return
    }

    console.log("Registrando log de exclusão:", modulo, detalhes)

    await registrarLog({
      usuario_id: user.id,
      usuario_nome: user.nome,
      usuario_email: user.email,
      acao: "Registro excluído",
      modulo,
      tipo: "delete",
      detalhes,
      dados_anteriores,
      ip_address: "client-side",
      user_agent: navigator.userAgent,
    })
  }

  const logView = async (modulo: string, detalhes: string) => {
    if (!user) {
      console.log("Usuário não logado, não registrando log")
      return
    }

    console.log("Registrando log de visualização:", modulo, detalhes)

    await registrarLog({
      usuario_id: user.id,
      usuario_nome: user.nome,
      usuario_email: user.email,
      acao: "Registro visualizado",
      modulo,
      tipo: "view",
      detalhes,
      ip_address: "client-side",
      user_agent: navigator.userAgent,
    })
  }

  const logError = async (modulo: string, detalhes: string, error?: any) => {
    console.log("Registrando log de erro:", modulo, detalhes)

    await registrarLog({
      usuario_id: user?.id,
      usuario_nome: user?.nome || "Sistema",
      usuario_email: user?.email,
      acao: "Erro ocorrido",
      modulo,
      tipo: "error",
      detalhes,
      dados_novos: error ? { error: error.toString() } : undefined,
      ip_address: "client-side",
      user_agent: navigator.userAgent,
    })
  }

  return {
    logCreate,
    logUpdate,
    logDelete,
    logView,
    logError,
  }
}
