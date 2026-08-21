import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { RATE_LIMITS, enforceRateLimit } from "@/lib/api-guard"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const limited = enforceRateLimit(request, "categories", RATE_LIMITS.read)
  if (limited) return limited

  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: { services: { where: { status: "ACTIVE" } } },
      },
    },
  })

  return NextResponse.json(categories)
}
