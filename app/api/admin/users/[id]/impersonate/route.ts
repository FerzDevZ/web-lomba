import { NextResponse } from "next/server"
import { encode } from "next-auth/jwt"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
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

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const adminId = parseInt(session.user.id, 10)
  const admin = await prisma.user.findUnique({
    where: { id: adminId },
    select: { role: true },
  })
  if (admin?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const limited = enforceRateLimit(
    request,
    "impersonate",
    RATE_LIMITS.impersonate,
    adminId
  )
  if (limited) return limited

  const { id } = await params
  const targetId = parseInt(id, 10)
  if (!Number.isFinite(targetId)) {
    return NextResponse.json({ error: "ID tidak valid" }, { status: 400 })
  }
  if (targetId === adminId) {
    return NextResponse.json(
      { error: "Tidak bisa masuk ke akun sendiri" },
      { status: 400 }
    )
  }

  const target = await prisma.user.findUnique({ where: { id: targetId } })
  if (!target) {
    return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 })
  }
  if (target.role === "ADMIN") {
    return NextResponse.json(
      { error: "Admin tidak bisa di-impersonate" },
      { status: 400 }
    )
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
      sub: String(target.id),
      id: String(target.id),
      role: target.role,
      name: target.name,
      email: target.email,
      impersonatorId: String(adminId),
    },
  })

  const res = NextResponse.json({
    ok: true,
    user: { name: target.name, role: target.role },
  })
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
