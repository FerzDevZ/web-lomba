import { NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { RATE_LIMITS, enforceRateLimit } from "@/lib/api-guard"

const statusSchema = z.object({
  status: z.enum(["ACTIVE", "DRAFT", "ARCHIVED"]),
})

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const serviceId = parseInt(id, 10)
  if (!Number.isFinite(serviceId)) {
    return NextResponse.json({ error: "ID tidak valid" }, { status: 400 })
  }

  const limited = enforceRateLimit(
    request,
    "service-write",
    RATE_LIMITS.serviceWrite,
    session.user.id
  )
  if (limited) return limited

  try {
    const body = await request.json()
    const { status } = statusSchema.parse(body)

    const service = await prisma.service.findUnique({
      where: { id: serviceId },
    })
    if (!service) {
      return NextResponse.json({ error: "Jasa tidak ditemukan" }, { status: 404 })
    }

    // Pemilik jasa boleh mengubah statusnya sendiri; ADMIN juga, karena
    // halaman moderasi mengaktifkan jasa draft milik provider lain.
    const userId = parseInt(session.user.id, 10)
    const isOwner = service.providerId === userId
    const isAdmin = session.user.role === "ADMIN"

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: "Forbidden: bukan pemilik jasa" },
        { status: 403 }
      )
    }

    const updated = await prisma.service.update({
      where: { id: serviceId },
      data: { status },
    })

    return NextResponse.json(updated)
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
