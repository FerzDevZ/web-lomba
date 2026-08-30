// @ts-nocheck
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { toPrismaId, sameId } from "@/lib/ids"
import { RATE_LIMITS, enforceRateLimit } from "@/lib/api-guard"

export const dynamic = "force-dynamic"

const DAY_MS = 24 * 60 * 60 * 1000

export async function GET(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { id: toPrismaId(session.user.id) as unknown as number & string },
    select: { role: true },
  })
  if (user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const limited = enforceRateLimit(
    request,
    "admin-stats",
    RATE_LIMITS.adminRead,
    session.user.id
  )
  if (limited) return limited

  const since = new Date(Date.now() - 13 * DAY_MS)

  const [
    totalUsers,
    totalProviders,
    totalCustomers,
    totalServices,
    activeServices,
    draftServices,
    totalOrders,
    completedAgg,
    ratingAgg,
    recentOrders,
    statusGroups,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: "PROVIDER" } }),
    prisma.user.count({ where: { role: "CUSTOMER" } }),
    prisma.service.count(),
    prisma.service.count({ where: { status: "ACTIVE" } }),
    prisma.service.findMany({
      where: { status: "DRAFT" },
      include: {
        provider: { select: { name: true } },
        category: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.order.count(),
    prisma.order.aggregate({
      where: { status: "COMPLETED" },
      _sum: { totalPrice: true },
    }),
    prisma.service.aggregate({
      where: { status: "ACTIVE" },
      _avg: { ratingAvg: true },
    }),
    prisma.order.findMany({
      where: { createdAt: { gte: since } },
      include: {
        customer: { select: { name: true } },
        service: {
          select: {
            title: true,
            provider: { select: { name: true } },
            category: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    prisma.order.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
  ])

  // Pesanan per hari — 14 hari terakhir
  const ordersByDay = Array.from({ length: 14 }, (_, i) => {
    const day = new Date(Date.now() - (13 - i) * DAY_MS)
    return {
      date: day.toLocaleDateString("id-ID", { day: "numeric", month: "short" }),
      count: 0,
    }
  })
  const dayMap = new Map(ordersByDay.map((o) => [o.date, o]))
  const allRecent = await prisma.order.findMany({
    where: { createdAt: { gte: since } },
    select: { createdAt: true },
  })
  for (const o of allRecent) {
    const key = o.createdAt.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
    })
    const entry = dayMap.get(key)
    if (entry) entry.count++
  }

  // Pendapatan per kategori (semua completed)
  const completed = await prisma.order.findMany({
    where: { status: "COMPLETED" },
    select: {
      totalPrice: true,
      service: {
        select: {
          category: { select: { name: true } },
          provider: { select: { id: true, name: true } },
        },
      },
    },
  })

  const categoryRevenue = new Map<string, number>()
  const providerStats = new Map<
    number,
    { name: string; revenue: number; orders: number }
  >()
  for (const o of completed) {
    const cat = o.service.category.name
    categoryRevenue.set(cat, (categoryRevenue.get(cat) ?? 0) + o.totalPrice)

    const pid = o.service.provider.id
    const prev = providerStats.get(pid) ?? {
      name: o.service.provider.name ?? "Provider",
      revenue: 0,
      orders: 0,
    }
    prev.revenue += o.totalPrice
    prev.orders++
    providerStats.set(pid, prev)
  }

  const statusBreakdown = {
    PENDING: 0,
    IN_PROGRESS: 0,
    COMPLETED: 0,
    CANCELLED: 0,
  }
  for (const g of statusGroups) {
    statusBreakdown[g.status as keyof typeof statusBreakdown] = g._count._all
  }

  return NextResponse.json({
    totalUsers,
    totalProviders,
    totalCustomers,
    totalServices,
    activeServices,
    draftServices,
    totalOrders,
    revenue: completedAgg._sum.totalPrice ?? 0,
    avgRating: ratingAgg._avg.ratingAvg ?? 0,
    recentOrders,
    ordersByDay,
    categoryRevenue: Array.from(categoryRevenue.entries()).map(
      ([name, value]) => ({ name, value })
    ),
    topProviders: Array.from(providerStats.entries())
      .map(([id, s]) => ({ id, ...s }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5),
    statusBreakdown,
  })
}
