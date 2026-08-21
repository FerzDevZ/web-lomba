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

  const admin = await prisma.user.findUnique({
    where: { id: parseInt(session.user.id, 10) },
    select: { role: true },
  })
  if (admin?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const limited = enforceRateLimit(
    request,
    "admin-users",
    RATE_LIMITS.adminRead,
    session.user.id
  )
  if (limited) return limited

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      location: true,
      phone: true,
      createdAt: true,
      _count: {
        select: { services: true, ordersOrderCustomer: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  })

  return NextResponse.json(users)
}
