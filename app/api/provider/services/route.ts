import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { RATE_LIMITS, enforceRateLimit } from "@/lib/api-guard"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const limited = enforceRateLimit(
    request,
    "provider-services",
    RATE_LIMITS.read,
    session.user.id
  )
  if (limited) return limited

  const providerId = parseInt(session.user.id, 10)
  const services = await prisma.service.findMany({
    where: { providerId },
    include: {
      category: { select: { id: true, name: true, slug: true } },
      _count: { select: { orders: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(services)
}
