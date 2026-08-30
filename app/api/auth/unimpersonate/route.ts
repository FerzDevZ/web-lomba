// @ts-nocheck
import { NextResponse } from "next/server"
import { encode } from "next-auth/jwt"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { toPrismaId, sameId } from "@/lib/ids"
import { RATE_LIMITS, enforceRateLimit } from "@/lib/api-guard"

export const dynamic = "force-dynamic"

// Nama cookie sesi ditentukan dari protokol request — sama persis dengan aturan
// Auth.js: `useSecureCookies ?? url.protocol === "https:"` (lihat @auth/core/lib/init.js)
// https → __Secure-authjs.session-token, http → authjs.session-token
function sessionCookieName(requestUrl: string) {
  return requestUrl.startsWith("https://")
    ? "__Secure-authjs.session-token"
    : "authjs.session-token"
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id || !session.user.impersonatedBy) {
    return NextResponse.json({ error: "Tidak sedang impersonate" }, { status: 400 })
  }

  const originalId = toPrismaId(session.user.impersonatedBy)

  const limited = enforceRateLimit(
    request,
    "impersonate",
    RATE_LIMITS.impersonate,
    originalId
  )
  if (limited) return limited

  const original = await prisma.user.findUnique({ where: { id: originalId } })
  if (!original) {
    return NextResponse.json({ error: "Akun admin asli tidak ditemukan" }, { status: 404 })
  }

  const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET
  if (!secret) {
    return NextResponse.json(
      { error: "AUTH_SECRET belum diatur" },
      { status: 500 }
    )
  }

  const cookieName = sessionCookieName(request.url)

  const token = await encode({
    secret,
    salt: cookieName,
    token: {
      sub: String(original.id),
      id: String(original.id),
      role: original.role,
      name: original.name,
      email: original.email,
    },
  })

  const res = NextResponse.json({ ok: true })
  res.cookies.set(cookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: cookieName.startsWith("__Secure-"),
    path: "/",
    maxAge: 30 * 24 * 60 * 60,
  })

  // Hapus nama cookie lawan agar tidak ada sesi ganda yang tertinggal
  const otherName = cookieName.startsWith("__Secure-")
    ? "authjs.session-token"
    : "__Secure-authjs.session-token"
  res.cookies.set(otherName, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: otherName.startsWith("__Secure-"),
    path: "/",
    maxAge: 0,
  })

  return res
}
