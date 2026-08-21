import { NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { RATE_LIMITS, enforceRateLimit } from "@/lib/api-guard"

export const dynamic = "force-dynamic"

const toggleSchema = z.object({
  serviceId: z.coerce.number().int().positive(),
})

// Daftar jasa yang disimpan oleh user yang sedang login.
// Mendukung `?id=<serviceId>` untuk memeriksa status simpan satu jasa saja.
export async function GET(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const limited = enforceRateLimit(
    request,
    "saved-read",
    RATE_LIMITS.read,
    session.user.id
  )
  if (limited) return limited

  const userId = parseInt(session.user.id, 10)
  const { searchParams } = new URL(request.url)
  const singleId = searchParams.get("id")

  if (singleId) {
    const serviceId = parseInt(singleId, 10)
    if (!Number.isFinite(serviceId)) {
      return NextResponse.json({ error: "ID tidak valid" }, { status: 400 })
    }
    const exists = await prisma.savedService.findUnique({
      where: { userId_serviceId: { userId, serviceId } },
      select: { id: true },
    })
    return NextResponse.json({ saved: Boolean(exists) })
  }

  const saved = await prisma.savedService.findMany({
    where: { userId },
    include: {
      service: {
        include: {
          provider: { select: { id: true, name: true, avatarUrl: true } },
          category: { select: { id: true, name: true, slug: true, icon: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  })

  return NextResponse.json(saved.map((s) => s.service))
}

// Simpan (POST) / hapus (DELETE) dari wishlist
export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const limited = enforceRateLimit(
    request,
    "save",
    RATE_LIMITS.save,
    session.user.id
  )
  if (limited) return limited

  try {
    const body = await request.json()
    const { serviceId } = toggleSchema.parse(body)

    const service = await prisma.service.findUnique({
      where: { id: serviceId },
      select: { id: true, status: true },
    })
    if (!service || service.status !== "ACTIVE") {
      return NextResponse.json({ error: "Jasa tidak ditemukan" }, { status: 404 })
    }

    const userId = parseInt(session.user.id, 10)

    const existing = await prisma.savedService.findUnique({
      where: { userId_serviceId: { userId, serviceId } },
    })

    if (existing) {
      await prisma.savedService.delete({ where: { id: existing.id } })
      return NextResponse.json({ saved: false })
    }

    await prisma.savedService.create({ data: { userId, serviceId } })
    return NextResponse.json({ saved: true }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0]?.message ?? "Data tidak valid" },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    )
  }
}
