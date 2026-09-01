import { NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { RATE_LIMITS, enforceRateLimit } from "@/lib/api-guard"

export const dynamic = "force-dynamic"

const toggleSchema = z.object({
  serviceId: z.union([z.string(), z.number()]).transform(String).refine((v) => /^[0-9a-fA-F]{24}$/.test(v) || /^\d+$/.test(v), "serviceId tidak valid"),
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

  try {
    // Pastikan ID selalu string untuk MongoDB @db.ObjectId
    const userId = String(session.user.id)
    const { searchParams } = new URL(request.url)
    const singleId = searchParams.get("id")

    if (singleId) {
      const serviceId = String(singleId)
      if (!serviceId.trim()) {
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
  } catch (error) {
    console.error("[saved] GET error:", error)
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 })
  }
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
    const parsed = toggleSchema.parse(body)
    // Pastikan ID selalu string untuk MongoDB @db.ObjectId
    const serviceId = String(parsed.serviceId)
    const userId = String(session.user.id)

    const service = await prisma.service.findUnique({
      where: { id: serviceId } as any,
      select: { id: true, status: true },
    })
    if (!service || service.status !== "ACTIVE") {
      return NextResponse.json({ error: "Jasa tidak ditemukan" }, { status: 404 })
    }

    // Toggle atomik dalam transaksi (P0-4)
    const result = await prisma.$transaction(async (tx: any) => {
      const existing = await tx.savedService.findUnique({
        where: { userId_serviceId: { userId, serviceId } },
      })
      if (existing) {
        await tx.savedService.delete({ where: { id: existing.id } })
        return { saved: false, code: 200 as const }
      }
      await tx.savedService.create({ data: { userId, serviceId } })
      return { saved: true, code: 201 as const }
    })
    return NextResponse.json({ saved: result.saved }, { status: result.code })
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
