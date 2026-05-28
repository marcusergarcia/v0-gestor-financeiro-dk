import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Permitir acesso à página de login e rotas de API
  const publicPaths = ["/login", "/sem-permissoes"]
  const isPublicPath = publicPaths.some((path) => pathname.startsWith(path))
  const isApiRoute = pathname.startsWith("/api")
  const isStaticFile = pathname.startsWith("/_next") || pathname.includes(".")

  if (isPublicPath || isApiRoute || isStaticFile) {
    return NextResponse.next()
  }

  // Para rotas protegidas, deixar o cliente verificar autenticação
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
}
