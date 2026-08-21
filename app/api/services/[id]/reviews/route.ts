import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { RATE_LIMITS, enforceRateLimit } from "@/lib/api-guard"

export const dynamic = "force-dynamic"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const limited = enforceRateLimit(
    request,
    "service-reviews",
    RATE_LIMITS.read
  )
  if (limited) return limited

  const { id } = await params
  const serviceId = parseInt(id, 10)
  if (!Number.isFinite(serviceId)) {
    return NextResponse.json({ error: "ID tidak valid" }, { status: 400 })
  }

  const reviews = await prisma.review.findMany({
    where: { order: { serviceId } },
    include: {
      reviewer: { select: { id: true, name: true, avatarUrl: true } },
      order: { select: { createdAt: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  })

  return NextResponse.json(reviews)
}
