import type { User } from "@/types/usuario"

// Mapeamento de rotas e suas permissões necessárias
const routePermissions: Record<string, string[]> = {
  "/dashboard": ["dashboard"],
  "/clientes": ["clientes"],
  "/produtos": ["produtos"],
  "/orcamentos": ["orcamentos"],
  "/contratos": ["contratos"],
  "/ordem-servico": ["ordem_servico"],
  "/financeiro": ["financeiro"],
  "/nota-fiscal": ["nota_fiscal", "financeiro"],
  "/documentos": ["documentos"],
  "/relatorios": ["relatorios"],
  "/usuarios": ["usuarios"],
  "/configuracoes": ["configuracoes"],
  "/logs": ["logs"],
}

// Ordem de prioridade das rotas
const routePriority = [
  "/dashboard",
  "/ordem-servico",
  "/clientes",
  "/orcamentos",
  "/contratos",
  "/financeiro",
  "/nota-fiscal",
  "/produtos",
  "/documentos",
  "/relatorios",
  "/usuarios",
  "/configuracoes",
  "/logs",
]

export function getFirstAvailableRoute(user: User): string {
  // Se é admin, vai para dashboard
  if (user.tipo === "admin") {
    return "/dashboard"
  }

  // Para outros tipos, encontrar primeira rota com permissão
  const permissoes = user.permissoes || []

  for (const route of routePriority) {
    const requiredPermissions = routePermissions[route]
    if (requiredPermissions && requiredPermissions.some((perm) => permissoes.includes(perm))) {
      return route
    }
  }

  // Se não encontrou nenhuma rota, redireciona para sem permissões
  return "/sem-permissoes"
}

export function canAccessRoute(user: User, pathname: string): boolean {
  // Admin tem acesso a tudo
  if (user.tipo === "admin") {
    return true
  }

  // Rotas públicas
  const publicRoutes = ["/login", "/sem-permissoes"]
  if (publicRoutes.includes(pathname)) {
    return true
  }

  // Verificar se a rota tem permissões definidas
  const route = Object.keys(routePermissions).find((r) => pathname.startsWith(r))
  if (!route) {
    return true // Se não tem permissões definidas, permite acesso
  }

  const requiredPermissions = routePermissions[route]
  const userPermissions = user.permissoes || []

  return requiredPermissions.some((perm) => userPermissions.includes(perm))
}

export function hasPermission(user: User, permission: string): boolean {
  // Admin tem todas as permissões
  if (user.tipo === "admin") {
    return true
  }

  const userPermissions = user.permissoes || []
  return userPermissions.includes(permission)
}
