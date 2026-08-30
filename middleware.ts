import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"

// Halaman yang boleh diakses tanpa login
const PUBLIC_PATHS = [
  "/",
  "/services",
  "/service",
  "/provider",
  "/login",
  "/register",
  "/faq",
  "/api/auth",
  "/api/services",
  "/api/categories",
  "/sitemap.xml",
  "/robots.txt",
  // Route metadata Next.js (file-based): tidak punya ekstensi di URL sehingga
  // tidak tertangkap pengecualian `.*\..*` pada matcher di bawah.
  "/icon",
  "/apple-icon",
  "/opengraph-image",
  "/twitter-image",
  "/manifest.webmanifest",
]

const KNOWN_PREFIXES = [
  "/",
  "/services",
  "/service",
  "/provider",
  "/checkout",
  "/orders",
  "/dashboard",
  "/login",
  "/register",
  "/faq",
  "/api",
  "/sitemap",
  "/robots",
  "/icon",
  "/opengraph-image",
]

function isKnownPath(pathname: string): boolean {
  return KNOWN_PREFIXES.some((p) => {
    if (p === "/") return pathname === "/"
    // exact atau prefix dengan "/" atau "." (untuk /sitemap.xml, /robots.txt)
    return (
      pathname === p ||
      pathname.startsWith(`${p}/`) ||
      pathname.startsWith(`${p}.`)
    )
  })
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Route API menangani autentikasi masing-masing
  if (pathname.startsWith("/api/")) {
    return NextResponse.next()
  }

  const isPublic = PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  )

  // Hijack 404 fix: unknown routes jangan redirect ke /login, biarkan Next render 404
  if (!isKnownPath(pathname) && !isPublic) {
    return NextResponse.next()
  }

  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  })

  // Belum login, arahkan ke halaman masuk
  if (!isPublic && !token) {
    const url = new URL("/login", request.url)
    url.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(url)
  }

  if (token) {
    const role = token.role as string | undefined

    // /dashboard/provider hanya untuk PROVIDER / ADMIN
    if (
      pathname.startsWith("/dashboard/provider") &&
      role !== "PROVIDER" &&
      role !== "ADMIN"
    ) {
      return NextResponse.redirect(new URL("/dashboard", request.url))
    }

    // /dashboard/admin hanya untuk ADMIN
    if (
      pathname.startsWith("/dashboard/admin") &&
      role !== "ADMIN"
    ) {
      return NextResponse.redirect(new URL("/dashboard", request.url))
    }

    // Pengguna yang sudah login tidak perlu ke halaman auth
    if (pathname.startsWith("/login") || pathname.startsWith("/register")) {
      return NextResponse.redirect(new URL("/dashboard", request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
}
